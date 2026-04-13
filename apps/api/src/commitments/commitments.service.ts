import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../common/prisma.service';
import { CreateCommitmentDto } from './dto/create-commitment.dto';
import { UpdateCommitmentDto } from './dto/update-commitment.dto';
import { ListCommitmentsDto } from './dto/list-commitments.dto';
import { CommitmentStatus, ShelfStatus, Prisma } from '@prisma/client';

interface AuthUser {
  id: string;
  orgId: string;
  role: string;
}

interface ShelfRow {
  id: string;
  status: string;
  targetAmount: number;
  surbookingPct: number;
  closingDate: Date;
}

@Injectable()
export class CommitmentsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Helpers ────────────────────────────────────────────────────────────────

  private validateAmount(amount: number): void {
    if (amount <= 0 || amount % 1000 !== 0) {
      throw new BadRequestException(
        'Amount must be a positive multiple of 1000',
      );
    }
  }

  private effectiveCap(targetAmount: number, surbookingPct: number): number {
    return targetAmount * (1 + surbookingPct / 100);
  }

  /**
   * Returns the sum of CONFIRMED commitments on a shelf, **inside** an
   * interactive transaction using SELECT FOR UPDATE on the shelf row so
   * concurrent writes are serialised.
   */
  private async lockedShelfAggregates(
    tx: Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
    shelfId: string,
  ): Promise<{ shelf: ShelfRow; confirmedAmount: number; nextWaitingRank: number }> {
    // Lock the shelf row to prevent concurrent modifications
    const rows = await (tx as any).$queryRaw<ShelfRow[]>`
      SELECT id, status, "targetAmount", "surbookingPct", "closingDate"
      FROM shelves
      WHERE id = ${shelfId}
      FOR UPDATE
    `;

    if (!rows.length) {
      throw new NotFoundException(`Shelf ${shelfId} not found`);
    }

    const shelf = rows[0];

    if (shelf.status === ShelfStatus.CANCELLED) {
      throw new BadRequestException('This shelf has been cancelled');
    }
    if (shelf.status === ShelfStatus.CLOSED) {
      throw new BadRequestException('This shelf is closed');
    }
    if (new Date(shelf.closingDate) <= new Date()) {
      throw new BadRequestException('This shelf has passed its closing date');
    }

    const agg = await (tx as any).commitment.aggregate({
      where: { shelfId, status: CommitmentStatus.CONFIRMED },
      _sum: { amount: true },
    });

    const confirmedAmount: number = agg._sum.amount ?? 0;

    const maxRankRow = await (tx as any).commitment.aggregate({
      where: { shelfId, status: CommitmentStatus.WAITING },
      _max: { rank: true },
    });

    const nextWaitingRank: number = (maxRankRow._max.rank ?? 0) + 1;

    return { shelf, confirmedAmount, nextWaitingRank };
  }

  // ── Promote waiting commitments (FIFO) after a cancellation ───────────────

  private async promoteWaiting(
    tx: Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
    shelfId: string,
  ): Promise<void> {
    // Re-fetch shelf snapshot inside the transaction (already locked upstream)
    const rows = await (tx as any).$queryRaw<ShelfRow[]>`
      SELECT id, status, "targetAmount", "surbookingPct", "closingDate"
      FROM shelves
      WHERE id = ${shelfId}
      FOR UPDATE
    `;

    if (!rows.length) return;
    const shelf = rows[0];

    const cap = this.effectiveCap(shelf.targetAmount, shelf.surbookingPct);

    // Sum of currently confirmed commitments
    const agg = await (tx as any).commitment.aggregate({
      where: { shelfId, status: CommitmentStatus.CONFIRMED },
      _sum: { amount: true },
    });
    let confirmedAmount: number = agg._sum.amount ?? 0;

    // Fetch waiting commitments ordered by rank (FIFO)
    const waiting = await (tx as any).commitment.findMany({
      where: { shelfId, status: CommitmentStatus.WAITING },
      orderBy: { rank: 'asc' },
    });

    for (const w of waiting) {
      if (confirmedAmount + w.amount <= cap) {
        await (tx as any).commitment.update({
          where: { id: w.id },
          data: { status: CommitmentStatus.CONFIRMED, rank: null },
        });
        confirmedAmount += w.amount;
      } else {
        // No more room – stop
        break;
      }
    }

    // Update shelf status if cap is now reached
    const newStatus =
      confirmedAmount >= cap ? ShelfStatus.FULL : ShelfStatus.OPEN;

    if (shelf.status !== newStatus) {
      await (tx as any).shelf.update({
        where: { id: shelfId },
        data: { status: newStatus },
      });
    }
  }

  // ── Public API ─────────────────────────────────────────────────────────────

  async create(dto: CreateCommitmentDto, user: AuthUser) {
    this.validateAmount(dto.amount);

    return this.prisma.$transaction(
      async (tx) => {
        const { shelf, confirmedAmount, nextWaitingRank } =
          await this.lockedShelfAggregates(tx as any, dto.shelfId);

        const cap = this.effectiveCap(shelf.targetAmount, shelf.surbookingPct);

        let status: CommitmentStatus;
        let rank: number | null = null;

        if (confirmedAmount + dto.amount <= cap) {
          status = CommitmentStatus.CONFIRMED;
        } else {
          status = CommitmentStatus.WAITING;
          rank = nextWaitingRank;
        }

        const commitment = await (tx as any).commitment.create({
          data: {
            shelfId: dto.shelfId,
            userId: user.id,
            orgId: user.orgId,
            amount: dto.amount,
            status,
            rank,
          },
          include: {
            shelf: {
              select: {
                id: true,
                status: true,
                targetAmount: true,
                surbookingPct: true,
              },
            },
          },
        });

        // If cap is now reached, mark shelf as FULL
        const newConfirmed =
          status === CommitmentStatus.CONFIRMED
            ? confirmedAmount + dto.amount
            : confirmedAmount;

        if (newConfirmed >= cap && shelf.status !== ShelfStatus.FULL) {
          await (tx as any).shelf.update({
            where: { id: dto.shelfId },
            data: { status: ShelfStatus.FULL },
          });
        }

        return commitment;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        timeout: 5000,
      },
    );
  }

  async findMyCommitments(user: AuthUser, query: ListCommitmentsDto = {}) {
    const { status, shelfId, page = 1, limit = 20 } = query;

    const where: Prisma.CommitmentWhereInput = { userId: user.id };

    // Org isolation: non-super-admin users are restricted to their own org
    if (user.orgId) {
      where.orgId = user.orgId;
    }

    if (status) {
      where.status = status;
    }

    if (shelfId) {
      where.shelfId = shelfId;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.commitment.findMany({
        where,
        skip,
        take: limit,
        include: {
          shelf: {
            select: {
              id: true,
              status: true,
              targetAmount: true,
              surbookingPct: true,
              closingDate: true,
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
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commitment.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateAmount(id: string, dto: UpdateCommitmentDto, user: AuthUser) {
    this.validateAmount(dto.amount);

    return this.prisma.$transaction(
      async (tx) => {
        // Fetch and lock the existing commitment
        const existing = await (tx as any).commitment.findUnique({
          where: { id },
        });

        if (!existing) {
          throw new NotFoundException(`Commitment ${id} not found`);
        }
        if (existing.userId !== user.id) {
          throw new ForbiddenException('You can only update your own commitments');
        }
        if (existing.status === CommitmentStatus.CANCELLED) {
          throw new BadRequestException('Cannot update a cancelled commitment');
        }

        const { shelf, confirmedAmount, nextWaitingRank } =
          await this.lockedShelfAggregates(tx as any, existing.shelfId);

        const cap = this.effectiveCap(shelf.targetAmount, shelf.surbookingPct);

        // Compute confirmed total excluding the current commitment
        const otherConfirmed =
          existing.status === CommitmentStatus.CONFIRMED
            ? confirmedAmount - existing.amount
            : confirmedAmount;

        let newStatus: CommitmentStatus;
        let newRank: number | null = null;

        if (otherConfirmed + dto.amount <= cap) {
          newStatus = CommitmentStatus.CONFIRMED;
        } else {
          newStatus = CommitmentStatus.WAITING;
          // Keep existing rank if already waiting, else assign a new one
          newRank =
            existing.status === CommitmentStatus.WAITING
              ? existing.rank
              : nextWaitingRank;
        }

        const updated = await (tx as any).commitment.update({
          where: { id },
          data: { amount: dto.amount, status: newStatus, rank: newRank },
        });

        // Recalculate shelf status
        const newConfirmed =
          newStatus === CommitmentStatus.CONFIRMED
            ? otherConfirmed + dto.amount
            : otherConfirmed;

        const targetShelfStatus =
          newConfirmed >= cap ? ShelfStatus.FULL : ShelfStatus.OPEN;

        if (shelf.status !== targetShelfStatus) {
          await (tx as any).shelf.update({
            where: { id: existing.shelfId },
            data: { status: targetShelfStatus },
          });
        }

        // If the updated commitment is no longer CONFIRMED, try to promote waiting
        if (
          existing.status === CommitmentStatus.CONFIRMED &&
          newStatus !== CommitmentStatus.CONFIRMED
        ) {
          await this.promoteWaiting(tx as any, existing.shelfId);
        }

        return updated;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        timeout: 5000,
      },
    );
  }

  // ── Approval Workflow ──────────────────────────────────────────────────────

  async reviewCommitment(id: string, user: AuthUser) {
    if (user.role !== 'ORG_ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only ORG_ADMIN or SUPER_ADMIN can review commitments');
    }

    const existing = await this.prisma.commitment.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException(`Commitment ${id} not found`);
    }
    if (existing.status !== CommitmentStatus.PENDING) {
      throw new BadRequestException(
        `Cannot review a commitment with status ${existing.status}. Only PENDING commitments can be reviewed.`,
      );
    }

    return this.prisma.commitment.update({
      where: { id },
      data: {
        status: CommitmentStatus.REVIEW,
        reviewedBy: user.id,
      },
    });
  }

  async approveCommitment(id: string, user: AuthUser) {
    if (user.role !== 'ORG_ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only ORG_ADMIN or SUPER_ADMIN can approve commitments');
    }

    return this.prisma.$transaction(
      async (tx) => {
        const existing = await (tx as any).commitment.findUnique({ where: { id } });

        if (!existing) {
          throw new NotFoundException(`Commitment ${id} not found`);
        }
        if (existing.status !== CommitmentStatus.REVIEW) {
          throw new BadRequestException(
            `Cannot approve a commitment with status ${existing.status}. Only REVIEW commitments can be approved.`,
          );
        }

        const { shelf, confirmedAmount, nextWaitingRank } =
          await this.lockedShelfAggregates(tx as any, existing.shelfId);

        const cap = this.effectiveCap(shelf.targetAmount, shelf.surbookingPct);

        let newStatus: CommitmentStatus;
        let newRank: number | null = null;

        if (confirmedAmount + existing.amount <= cap) {
          newStatus = CommitmentStatus.CONFIRMED;
        } else {
          newStatus = CommitmentStatus.WAITING;
          newRank = nextWaitingRank;
        }

        const updated = await (tx as any).commitment.update({
          where: { id },
          data: {
            status: newStatus,
            rank: newRank,
            reviewedBy: user.id,
          },
        });

        // Update shelf status if cap is now reached
        if (newStatus === CommitmentStatus.CONFIRMED) {
          const newConfirmed = confirmedAmount + existing.amount;
          if (newConfirmed >= cap && shelf.status !== 'FULL') {
            await (tx as any).shelf.update({
              where: { id: existing.shelfId },
              data: { status: 'FULL' },
            });
          }
        }

        return updated;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        timeout: 5000,
      },
    );
  }

  async rejectCommitment(id: string, user: AuthUser, reason: string) {
    if (user.role !== 'ORG_ADMIN' && user.role !== 'SUPER_ADMIN') {
      throw new ForbiddenException('Only ORG_ADMIN or SUPER_ADMIN can reject commitments');
    }

    if (!reason || reason.trim().length === 0) {
      throw new BadRequestException('A rejection reason is required');
    }

    return this.prisma.$transaction(
      async (tx) => {
        const existing = await (tx as any).commitment.findUnique({ where: { id } });

        if (!existing) {
          throw new NotFoundException(`Commitment ${id} not found`);
        }
        if (existing.status === CommitmentStatus.CANCELLED) {
          throw new BadRequestException('Commitment is already cancelled');
        }

        const wasConfirmed = existing.status === CommitmentStatus.CONFIRMED;

        const cancelled = await (tx as any).commitment.update({
          where: { id },
          data: {
            status: CommitmentStatus.CANCELLED,
            rank: null,
            rejectionReason: reason.trim(),
            reviewedBy: user.id,
          },
        });

        // Promote waiting commitments if freed space
        if (wasConfirmed) {
          await this.promoteWaiting(tx as any, existing.shelfId);
        }

        return cancelled;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        timeout: 5000,
      },
    );
  }

  async cancel(id: string, user: AuthUser) {
    return this.prisma.$transaction(
      async (tx) => {
        const existing = await (tx as any).commitment.findUnique({
          where: { id },
        });

        if (!existing) {
          throw new NotFoundException(`Commitment ${id} not found`);
        }
        if (existing.userId !== user.id) {
          throw new ForbiddenException('You can only cancel your own commitments');
        }
        if (existing.status === CommitmentStatus.CANCELLED) {
          throw new BadRequestException('Commitment is already cancelled');
        }

        const wasConfirmed = existing.status === CommitmentStatus.CONFIRMED;

        const cancelled = await (tx as any).commitment.update({
          where: { id },
          data: { status: CommitmentStatus.CANCELLED, rank: null },
        });

        // Lock shelf and promote waiting commitments if freed space
        if (wasConfirmed) {
          await this.promoteWaiting(tx as any, existing.shelfId);
        }

        return cancelled;
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted,
        timeout: 5000,
      },
    );
  }

  /**
   * Org-scoped listing: returns all commitments for a given orgId.
   * Used by OrgIsolationGuard-protected endpoints for admin views.
   * When orgId is null (SUPER_ADMIN without filter), returns all commitments.
   */
  async findAllForOrg(orgId: string | null, query: ListCommitmentsDto = {}) {
    const { status, shelfId, page = 1, limit = 20 } = query;

    const where: Prisma.CommitmentWhereInput = {};

    if (orgId) {
      where.orgId = orgId;
    }

    if (status) {
      where.status = status;
    }

    if (shelfId) {
      where.shelfId = shelfId;
    }

    const skip = (page - 1) * limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.commitment.findMany({
        where,
        skip,
        take: limit,
        include: {
          shelf: {
            select: {
              id: true,
              status: true,
              targetAmount: true,
              surbookingPct: true,
              closingDate: true,
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
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.commitment.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
