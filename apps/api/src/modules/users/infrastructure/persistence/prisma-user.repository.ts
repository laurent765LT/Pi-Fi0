import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../../common/prisma.service';
import type { IUserRepository } from '../../domain/repositories/user.repository.interface';
import type { User } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { PrismaUserMapper } from '../mappers/prisma-user.mapper';

/**
 * Prisma-backed implementation of `IUserRepository`.
 *
 * The repository is deliberately thin: it translates between the Prisma
 * row shape and the domain aggregate. Any query logic that goes beyond
 * "load / save one aggregate" belongs in a dedicated read model, not here.
 */
@Injectable()
export class PrismaUserRepository implements IUserRepository {
  // Public select shape used by every "load aggregate" query — WITHOUT
  // the password hash. Authentication flows go through
  // `findByEmailWithPassword` which opts in explicitly.
  private readonly publicSelect = {
    id: true,
    email: true,
    firstName: true,
    lastName: true,
    role: true,
    orgId: true,
    kycStatus: true,
    createdAt: true,
    updatedAt: true,
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  async findById(id: UserId): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { id: id.value },
      select: this.publicSelect,
    });
    return row ? PrismaUserMapper.toDomain(row) : null;
  }

  async findByEmail(email: Email): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { email: email.value },
      select: this.publicSelect,
    });
    return row ? PrismaUserMapper.toDomain(row) : null;
  }

  async findByEmailWithPassword(email: Email): Promise<User | null> {
    const row = await this.prisma.user.findUnique({
      where: { email: email.value },
      select: { ...this.publicSelect, passwordHash: true },
    });
    return row ? PrismaUserMapper.toDomain(row) : null;
  }

  async save(user: User): Promise<void> {
    const { id, data } = PrismaUserMapper.toPersistence(user);
    await this.prisma.user.upsert({
      where: { id },
      create: { id, ...data },
      update: {
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
        orgId: data.orgId,
        kycStatus: data.kycStatus,
        passwordHash: data.passwordHash,
      },
    });
  }

  async exists(email: Email): Promise<boolean> {
    const count = await this.prisma.user.count({
      where: { email: email.value },
    });
    return count > 0;
  }
}
