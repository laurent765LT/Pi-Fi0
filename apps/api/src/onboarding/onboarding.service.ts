import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { OnboardingStatus } from '@prisma/client';
import { PrismaService } from '../common/prisma.service';

const ORIAS_PATTERN = /^\d{8}$/;

@Injectable()
export class OnboardingService {
  private readonly logger = new Logger(OnboardingService.name);

  constructor(private readonly prisma: PrismaService) {}

  async uploadOrias(userId: string, oriasNumber: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        oriasNumber,
        onboardingStatus: OnboardingStatus.DOCS_UPLOADED,
      },
      select: {
        id: true,
        oriasNumber: true,
        onboardingStatus: true,
      },
    });
  }

  async uploadRcp(userId: string, rcpInsurer: string, rcpAmount: number) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    return this.prisma.user.update({
      where: { id: userId },
      data: { rcpInsurer, rcpAmount },
      select: {
        id: true,
        rcpInsurer: true,
        rcpAmount: true,
        onboardingStatus: true,
      },
    });
  }

  async verifyOrias(oriasNumber: string): Promise<{ valid: boolean; oriasNumber: string; message: string }> {
    const valid = ORIAS_PATTERN.test(oriasNumber);
    return {
      valid,
      oriasNumber,
      message: valid
        ? 'ORIAS number format is valid'
        : 'ORIAS number must be exactly 8 digits',
    };
  }

  async completeOnboarding(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (!user.oriasNumber) {
      throw new BadRequestException('ORIAS number is required to complete onboarding');
    }

    if (!user.rcpInsurer || user.rcpAmount === null || user.rcpAmount === undefined) {
      throw new BadRequestException('RCP information is required to complete onboarding');
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: { onboardingStatus: OnboardingStatus.ACTIVE },
      select: {
        id: true,
        oriasNumber: true,
        rcpInsurer: true,
        rcpAmount: true,
        onboardingStatus: true,
      },
    });
  }
}
