import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateShelfDto } from './dto/create-shelf.dto';
import { ShelfStatus } from '@prisma/client';

@Injectable()
export class ShelvesService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const shelves = await this.prisma.shelf.findMany({
      include: {
        product: {
          select: {
            id: true,
            isin: true,
            name: true,
            payoffType: true,
            issuerName: true,
            maturityDate: true,
            sri: true,
            status: true,
          },
        },
        _count: {
          select: { commitments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return shelves.map((shelf) => ({
      ...shelf,
      fillPercentage: this.computeFillPercentage(shelf as any),
    }));
  }

  async findOne(id: string) {
    const shelf = await this.prisma.shelf.findUnique({
      where: { id },
      include: {
        product: true,
        commitments: {
          where: { status: { in: ['CONFIRMED', 'WAITING'] } },
          select: { amount: true, status: true },
        },
        _count: {
          select: { commitments: true },
        },
      },
    });

    if (!shelf) {
      throw new NotFoundException(`Shelf ${id} not found`);
    }

    const confirmedAmount = shelf.commitments
      .filter((c) => c.status === 'CONFIRMED')
      .reduce((sum, c) => sum + c.amount, 0);

    const waitingAmount = shelf.commitments
      .filter((c) => c.status === 'WAITING')
      .reduce((sum, c) => sum + c.amount, 0);

    const effectiveCap =
      shelf.targetAmount * (1 + shelf.surbookingPct / 100);

    return {
      ...shelf,
      confirmedAmount,
      waitingAmount,
      effectiveCap,
      fillPercentage: this.getFillPercentage(confirmedAmount, effectiveCap),
    };
  }

  async create(dto: CreateShelfDto) {
    const product = await this.prisma.product.findUnique({
      where: { id: dto.productId },
    });

    if (!product) {
      throw new NotFoundException(`Product ${dto.productId} not found`);
    }

    const closingDate = new Date(dto.closingDate);
    if (closingDate <= new Date()) {
      throw new BadRequestException('closingDate must be in the future');
    }

    return this.prisma.shelf.create({
      data: {
        productId: dto.productId,
        targetAmount: dto.targetAmount,
        surbookingPct: dto.surbookingPct ?? 15,
        closingDate,
        status: ShelfStatus.OPEN,
      },
      include: {
        product: {
          select: {
            id: true,
            isin: true,
            name: true,
            payoffType: true,
            issuerName: true,
          },
        },
      },
    });
  }

  async findCommitments(shelfId: string) {
    const shelf = await this.prisma.shelf.findUnique({
      where: { id: shelfId },
    });

    if (!shelf) {
      throw new NotFoundException(`Shelf ${shelfId} not found`);
    }

    return this.prisma.commitment.findMany({
      where: { shelfId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            orgId: true,
          },
        },
        organization: {
          select: { id: true, name: true, type: true },
        },
      },
      orderBy: [{ status: 'asc' }, { createdAt: 'asc' }],
    });
  }

  getFillPercentage(confirmedAmount: number, effectiveCap: number): number {
    if (effectiveCap <= 0) return 0;
    return Math.min(100, (confirmedAmount / effectiveCap) * 100);
  }

  private computeFillPercentage(
    shelf: { targetAmount: number; surbookingPct: number },
  ): number {
    // Without loading commitments we cannot compute it accurately;
    // this is a lightweight placeholder for list view — full detail via findOne.
    return 0;
  }
}
