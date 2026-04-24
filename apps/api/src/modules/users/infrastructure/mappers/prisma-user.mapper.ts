import type { User as PrismaUser, UserRole as PrismaUserRole, KYCStatus as PrismaKycStatus } from '@prisma/client';
import { User } from '../../domain/entities/user.entity';
import type { KycStatus, UserRole } from '../../domain/entities/user.entity';
import { Email } from '../../domain/value-objects/email.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';

/**
 * Maps between the Prisma row and the domain `User` aggregate.
 *
 * The domain enum is narrower than Prisma's (`OnboardingStatus`, etc.
 * aren't modeled at the domain layer yet). We fall back to permissive
 * casts where the two sets overlap and throw at the seams so no unknown
 * Prisma value silently reaches the domain.
 */
export class PrismaUserMapper {
  static toDomain(
    row: Pick<
      PrismaUser,
      | 'id'
      | 'email'
      | 'firstName'
      | 'lastName'
      | 'role'
      | 'orgId'
      | 'kycStatus'
      | 'createdAt'
      | 'updatedAt'
    > & { passwordHash?: string | null },
  ): User {
    return User.reconstitute({
      id: UserId.of(row.id),
      email: Email.of(row.email),
      firstName: row.firstName,
      lastName: row.lastName,
      role: PrismaUserMapper.mapRoleIn(row.role),
      orgId: row.orgId,
      kycStatus: PrismaUserMapper.mapKycIn(row.kycStatus),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      passwordHash: row.passwordHash ?? undefined,
    });
  }

  /**
   * Shape consumed by Prisma `upsert`. We split the id from the rest
   * because `where` wants `{ id }` and `create` wants everything.
   */
  static toPersistence(user: User): {
    id: string;
    data: {
      email: string;
      firstName: string;
      lastName: string;
      role: PrismaUserRole;
      orgId: string;
      kycStatus: PrismaKycStatus;
      passwordHash: string;
    };
  } {
    const snapshot = user.toSnapshot();
    if (!snapshot.passwordHash) {
      // We never persist a user without a password hash: registration
      // always sets one and subsequent `save()` calls reload the existing
      // hash through the repository.
      throw new Error(
        `PrismaUserMapper.toPersistence: passwordHash is required for user ${snapshot.id.value}`,
      );
    }
    return {
      id: snapshot.id.value,
      data: {
        email: snapshot.email.value,
        firstName: snapshot.firstName,
        lastName: snapshot.lastName,
        role: PrismaUserMapper.mapRoleOut(snapshot.role),
        orgId: snapshot.orgId,
        kycStatus: PrismaUserMapper.mapKycOut(snapshot.kycStatus),
        passwordHash: snapshot.passwordHash,
      },
    };
  }

  private static mapRoleIn(prismaRole: PrismaUserRole): UserRole {
    // Prisma and domain enums share the same string values for every
    // role listed in the domain union, but we re-assert the invariant
    // here so future Prisma additions don't silently leak.
    const allowed: UserRole[] = [
      'CGP',
      'INSURER_ADMIN',
      'ISSUER_ADMIN',
      'PLATFORM_ADMIN',
      'VIEWER',
      'MANAGER',
      'ORG_ADMIN',
      'SUPER_ADMIN',
    ];
    if ((allowed as string[]).includes(prismaRole)) {
      return prismaRole as UserRole;
    }
    throw new Error(`Unknown Prisma UserRole: ${String(prismaRole)}`);
  }

  private static mapRoleOut(domainRole: UserRole): PrismaUserRole {
    return domainRole as PrismaUserRole;
  }

  private static mapKycIn(raw: PrismaKycStatus): KycStatus {
    const allowed: KycStatus[] = [
      'PENDING',
      'IN_REVIEW',
      'VERIFIED',
      'REJECTED',
      'EXPIRED',
    ];
    if ((allowed as string[]).includes(raw)) {
      return raw as KycStatus;
    }
    throw new Error(`Unknown Prisma KYCStatus: ${String(raw)}`);
  }

  private static mapKycOut(status: KycStatus): PrismaKycStatus {
    return status as PrismaKycStatus;
  }
}
