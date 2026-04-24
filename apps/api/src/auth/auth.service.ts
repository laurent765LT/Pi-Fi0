import {
  ConflictException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import type { OrgType, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';
import type { LoginDto, RegisterDto } from './dto';
import { AuditLogService } from './services/audit-log.service';
import { TokenService } from './services/token.service';
import type { AuthenticatedUser } from './types/authenticated-user.type';
import { PrismaService } from '../common/prisma.service';

const ARGON2_OPTS = {
  type: argon2.argon2id,
  memoryCost: 2 ** 16, // 64 MB
  timeCost: 3,
  parallelism: 1,
} as const;

/**
 * Result surface returned to the controller for login/register/refresh.
 * The controller is responsible for converting this to a cookie-augmented
 * HTTP response.
 */
export interface AuthSessionResult {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
  user: AuthenticatedUser;
}

/**
 * Request-scoped metadata captured by the controller (IP + user agent) and
 * forwarded to AuthService so audit logs always include it.
 */
export interface AuthRequestContext {
  ipAddress: string | null;
  userAgent: string | null;
  deviceFingerprint?: string | null;
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly tokens: TokenService,
    private readonly audit: AuditLogService,
  ) {}

  // ── REGISTER ──────────────────────────────────────────────────────────────

  async register(
    dto: RegisterDto,
    ctx: AuthRequestContext,
  ): Promise<AuthSessionResult> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const existing = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: { id: true },
    });
    if (existing) {
      await this.audit.record({
        userId: null,
        action: 'REGISTER_FAILED',
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        payload: { email: normalizedEmail, reason: 'EMAIL_ALREADY_REGISTERED' },
      });
      throw new ConflictException('Email is already registered.');
    }

    const passwordHash = await argon2.hash(dto.password, ARGON2_OPTS);
    const { role: prismaRole, orgId } = await this.resolveRegistrationTargets(
      dto.role ?? 'CGP',
    );

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: prismaRole as UserRole,
        orgId,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        orgId: true,
      },
    });

    const tokens = await this.tokens.issueTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      deviceFingerprint: ctx.deviceFingerprint,
    });

    await this.audit.record({
      userId: user.id,
      action: 'REGISTER',
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      payload: { email: user.email, role: user.role },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessExpiresIn: tokens.accessExpiresIn,
      refreshExpiresIn: tokens.refreshExpiresIn,
      user,
    };
  }

  // ── LOGIN ─────────────────────────────────────────────────────────────────

  async login(
    dto: LoginDto,
    ctx: AuthRequestContext,
  ): Promise<AuthSessionResult> {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        orgId: true,
        passwordHash: true,
      },
    });

    if (!user) {
      await this.audit.record({
        userId: null,
        action: 'LOGIN_FAILED',
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        payload: { email: normalizedEmail, reason: 'USER_NOT_FOUND' },
      });
      // Intentionally generic message — don't reveal which factor failed.
      throw new UnauthorizedException('Invalid credentials.');
    }

    const valid = await argon2.verify(user.passwordHash, dto.password);
    if (!valid) {
      await this.audit.record({
        userId: user.id,
        action: 'LOGIN_FAILED',
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        payload: { email: user.email, reason: 'BAD_PASSWORD' },
      });
      throw new UnauthorizedException('Invalid credentials.');
    }

    const tokens = await this.tokens.issueTokens({
      userId: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
      deviceFingerprint: ctx.deviceFingerprint,
    });

    await this.audit.record({
      userId: user.id,
      action: 'LOGIN',
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      payload: { email: user.email },
    });

    const { passwordHash: _omit, ...publicUser } = user;
    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      accessExpiresIn: tokens.accessExpiresIn,
      refreshExpiresIn: tokens.refreshExpiresIn,
      user: publicUser,
    };
  }

  // ── REFRESH ───────────────────────────────────────────────────────────────

  async refresh(
    rawRefreshToken: string,
    ctx: AuthRequestContext,
  ): Promise<AuthSessionResult> {
    let payloadSub: string | null = null;
    let refreshTokenId: string | null = null;

    try {
      const { payload, row } = await this.tokens.verifyRefreshToken(
        rawRefreshToken,
      );
      payloadSub = payload.sub;
      refreshTokenId = row?.id ?? null;

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          orgId: true,
        },
      });
      if (!user) {
        throw new Error('User no longer exists.');
      }

      const tokens = await this.tokens.issueTokens({
        userId: user.id,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
        deviceFingerprint: row?.deviceFingerprint ?? ctx.deviceFingerprint,
        previousRefreshTokenId: row?.id ?? null,
      });

      await this.audit.record({
        userId: user.id,
        action: 'TOKEN_REFRESH',
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        payload: { rotatedFrom: row?.id ?? null },
      });

      return {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        accessExpiresIn: tokens.accessExpiresIn,
        refreshExpiresIn: tokens.refreshExpiresIn,
        user,
      };
    } catch (err) {
      this.logger.warn(
        `Refresh rejected: ${err instanceof Error ? err.message : err}`,
      );
      await this.audit.record({
        userId: payloadSub,
        action: 'TOKEN_REFRESH_FAILED',
        ipAddress: ctx.ipAddress,
        userAgent: ctx.userAgent,
        payload: {
          refreshTokenId,
          reason:
            err instanceof Error ? err.message : 'UNKNOWN_REFRESH_FAILURE',
        },
      });
      // Preventive reuse detection: if a revoked token is presented, burn
      // every outstanding refresh token for this user.
      if (payloadSub) {
        await this.tokens.revokeRefreshToken(payloadSub).catch(() => undefined);
      }
      throw new UnauthorizedException('Invalid or expired refresh token.');
    }
  }

  // ── LOGOUT ────────────────────────────────────────────────────────────────

  async logout(
    user: AuthenticatedUser,
    ctx: AuthRequestContext & { refreshTokenId?: string | null },
  ): Promise<void> {
    await this.tokens.revokeRefreshToken(user.id, ctx.refreshTokenId ?? null);
    await this.audit.record({
      userId: user.id,
      action: 'LOGOUT',
      ipAddress: ctx.ipAddress,
      userAgent: ctx.userAgent,
      payload: {},
    });
  }

  // ── ME ────────────────────────────────────────────────────────────────────

  async me(userId: string): Promise<AuthenticatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        orgId: true,
      },
    });
    if (!user) {
      throw new UnauthorizedException('User no longer exists.');
    }
    return user;
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  /**
   * Maps the functional role (`CGP` / `ASSUREUR` / `ADMIN`) coming from the
   * sign-up form to the persistent Prisma role + a default org id.
   *
   * The real Strick'in onboarding flow assigns organisations explicitly via
   * a separate process — this is a bootstrap default used during open
   * self-service registration.
   */
  private async resolveRegistrationTargets(
    role: 'CGP' | 'ASSUREUR' | 'ADMIN',
  ): Promise<{ role: string; orgId: string }> {
    const { type, prismaRole, slug } = this.roleMapping(role);

    // Prefer an existing org of that type …
    const existing = await this.prisma.organization.findFirst({
      where: { type },
      select: { id: true },
      orderBy: { createdAt: 'asc' },
    });

    if (existing) {
      return { role: prismaRole, orgId: existing.id };
    }

    // … otherwise seed a default org so the user can still sign up. The
    // admin UI can rename/merge it later.
    const created = await this.prisma.organization.create({
      data: {
        name: this.roleMapping(role).defaultOrgName,
        type,
        slug: `${slug}-${Date.now()}`,
      },
      select: { id: true },
    });
    return { role: prismaRole, orgId: created.id };
  }

  private roleMapping(role: 'CGP' | 'ASSUREUR' | 'ADMIN'): {
    type: OrgType;
    prismaRole: UserRole;
    slug: string;
    defaultOrgName: string;
  } {
    switch (role) {
      case 'CGP':
        return {
          type: 'BROKER',
          prismaRole: 'VIEWER',
          slug: 'cgp',
          defaultOrgName: 'Cabinet CGP Indépendant',
        };
      case 'ASSUREUR':
        return {
          type: 'INSURER',
          prismaRole: 'ORG_ADMIN',
          slug: 'assureur',
          defaultOrgName: 'Assureur',
        };
      case 'ADMIN':
        return {
          type: 'ADMIN',
          prismaRole: 'SUPER_ADMIN',
          slug: 'admin',
          defaultOrgName: "Strick'in Admin",
        };
      default:
        return {
          type: 'BROKER',
          prismaRole: 'VIEWER',
          slug: 'cgp',
          defaultOrgName: 'Cabinet CGP Indépendant',
        };
    }
  }
}
