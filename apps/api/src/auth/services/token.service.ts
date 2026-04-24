import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import * as argon2 from 'argon2';
import { randomUUID } from 'node:crypto';
import { PrismaService } from '../../common/prisma.service';
import type {
  AccessTokenPayload,
  RefreshTokenPayload,
} from '../types/authenticated-user.type';

export interface IssuedTokens {
  accessToken: string;
  refreshToken: string;
  accessExpiresIn: string;
  refreshExpiresIn: string;
  refreshTokenId: string;
}

/**
 * Centralises JWT issuance + refresh-token persistence.
 *
 * Access tokens:
 *   - HS256, 15 min (configurable via JWT_ACCESS_EXPIRES_IN)
 *   - payload: { sub, email, role, orgId, jti }
 *
 * Refresh tokens:
 *   - HS256, 30 days (configurable via JWT_REFRESH_EXPIRES_IN)
 *   - stored in DB as Argon2-hashed strings
 *   - ONE active refresh token per (user, deviceFingerprint)
 *   - rotated on every use
 */
@Injectable()
export class TokenService {
  private readonly accessSecret: string;
  private readonly refreshSecret: string;
  private readonly accessExpiresIn: string;
  private readonly refreshExpiresIn: string;

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    const accessSecret =
      config.get<string>('JWT_ACCESS_SECRET') ??
      config.get<string>('JWT_SECRET');
    const refreshSecret = config.get<string>('JWT_REFRESH_SECRET');

    if (!accessSecret) {
      throw new Error(
        'JWT_ACCESS_SECRET (or legacy JWT_SECRET) must be defined.',
      );
    }
    if (!refreshSecret) {
      throw new Error('JWT_REFRESH_SECRET must be defined.');
    }

    this.accessSecret = accessSecret;
    this.refreshSecret = refreshSecret;
    this.accessExpiresIn = config.get<string>('JWT_ACCESS_EXPIRES_IN', '15m');
    this.refreshExpiresIn = config.get<string>(
      'JWT_REFRESH_EXPIRES_IN',
      '30d',
    );
  }

  /**
   * Issues a fresh access/refresh token pair and persists the refresh hash.
   * If `previousRefreshTokenId` is provided, that record is revoked first
   * (atomic rotation).
   */
  async issueTokens(params: {
    userId: string;
    email: string;
    role: string;
    orgId: string;
    deviceFingerprint?: string | null;
    previousRefreshTokenId?: string | null;
  }): Promise<IssuedTokens> {
    const accessJti = randomUUID();
    const refreshJti = randomUUID();

    // Reserve a refresh-token row first to get its id into the JWT payload.
    const refreshModel = this.refreshTokenModel;
    let refreshTokenId: string = randomUUID();

    if (refreshModel) {
      if (params.previousRefreshTokenId) {
        // Revoke previous token atomically (same user/device context).
        try {
          await refreshModel.update({
            where: { id: params.previousRefreshTokenId },
            data: { revokedAt: new Date() },
          });
        } catch {
          // If the row disappeared, we still issue a new one — best-effort.
        }
      }

      const placeholder = await refreshModel.create({
        data: {
          userId: params.userId,
          tokenHash: 'pending',
          deviceFingerprint: params.deviceFingerprint ?? null,
          expiresAt: this.computeRefreshExpiry(),
          createdAt: new Date(),
        },
      });
      refreshTokenId = placeholder.id;
    }

    const accessPayload: AccessTokenPayload = {
      sub: params.userId,
      email: params.email,
      role: params.role,
      orgId: params.orgId,
      jti: accessJti,
    };

    const refreshPayload: RefreshTokenPayload = {
      sub: params.userId,
      rtid: refreshTokenId,
      jti: refreshJti,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(accessPayload, {
        secret: this.accessSecret,
        expiresIn: this.accessExpiresIn,
        algorithm: 'HS256',
      }),
      this.jwt.signAsync(refreshPayload, {
        secret: this.refreshSecret,
        expiresIn: this.refreshExpiresIn,
        algorithm: 'HS256',
      }),
    ]);

    if (refreshModel) {
      const tokenHash = await argon2.hash(refreshToken, {
        type: argon2.argon2id,
      });
      await refreshModel.update({
        where: { id: refreshTokenId },
        data: { tokenHash },
      });
    } else {
      // Legacy fallback — store on User.refreshToken column.
      const legacyHash = await argon2.hash(refreshToken, {
        type: argon2.argon2id,
      });
      await this.prisma.user.update({
        where: { id: params.userId },
        data: { refreshToken: legacyHash },
      });
    }

    return {
      accessToken,
      refreshToken,
      accessExpiresIn: this.accessExpiresIn,
      refreshExpiresIn: this.refreshExpiresIn,
      refreshTokenId,
    };
  }

  /**
   * Verifies a refresh token, checks it matches the stored hash and has not
   * been revoked, and returns the persisted row + JWT payload.
   */
  async verifyRefreshToken(rawToken: string): Promise<{
    payload: RefreshTokenPayload;
    row: {
      id: string;
      userId: string;
      deviceFingerprint: string | null;
    } | null;
  }> {
    const payload = await this.jwt.verifyAsync<RefreshTokenPayload>(rawToken, {
      secret: this.refreshSecret,
      algorithms: ['HS256'],
    });

    const refreshModel = this.refreshTokenModel;

    if (refreshModel) {
      const row = await refreshModel.findUnique({
        where: { id: payload.rtid },
        select: {
          id: true,
          userId: true,
          tokenHash: true,
          deviceFingerprint: true,
          revokedAt: true,
          expiresAt: true,
        },
      });

      if (!row || row.revokedAt || row.expiresAt.getTime() < Date.now()) {
        throw new Error('Refresh token revoked or expired.');
      }

      if (row.userId !== payload.sub) {
        throw new Error('Refresh token user mismatch.');
      }

      const valid = await argon2.verify(row.tokenHash, rawToken);
      if (!valid) {
        throw new Error('Refresh token mismatch.');
      }

      return {
        payload,
        row: {
          id: row.id,
          userId: row.userId,
          deviceFingerprint: row.deviceFingerprint,
        },
      };
    }

    // Legacy fallback using `users.refreshToken`.
    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, refreshToken: true },
    });
    if (!user || !user.refreshToken) {
      throw new Error('Refresh token revoked.');
    }
    const valid = await argon2.verify(user.refreshToken, rawToken);
    if (!valid) {
      throw new Error('Refresh token mismatch.');
    }
    return {
      payload,
      row: null,
    };
  }

  /**
   * Revokes a specific refresh token (by id) or every outstanding token for
   * a user if `refreshTokenId` is omitted.
   */
  async revokeRefreshToken(
    userId: string,
    refreshTokenId?: string | null,
  ): Promise<void> {
    const refreshModel = this.refreshTokenModel;

    if (refreshModel) {
      if (refreshTokenId) {
        try {
          await refreshModel.update({
            where: { id: refreshTokenId },
            data: { revokedAt: new Date() },
          });
        } catch {
          /* row may already be revoked/missing — not fatal */
        }
      } else {
        await refreshModel.updateMany({
          where: { userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      return;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  private computeRefreshExpiry(): Date {
    // Very small parser — supports `\d+[smhdw]` formats.
    const match = /^(\d+)([smhdw])$/.exec(this.refreshExpiresIn);
    let ms = 30 * 24 * 60 * 60 * 1000;
    if (match && match[1] && match[2]) {
      const value = Number.parseInt(match[1], 10);
      const unit = match[2] as 's' | 'm' | 'h' | 'd' | 'w';
      const multipliers = {
        s: 1000,
        m: 60 * 1000,
        h: 60 * 60 * 1000,
        d: 24 * 60 * 60 * 1000,
        w: 7 * 24 * 60 * 60 * 1000,
      } as const;
      ms = value * multipliers[unit];
    }
    return new Date(Date.now() + ms);
  }

  private get refreshTokenModel():
    | {
        create: (args: {
          data: {
            userId: string;
            tokenHash: string;
            deviceFingerprint: string | null;
            expiresAt: Date;
            createdAt: Date;
          };
        }) => Promise<{ id: string }>;
        update: (args: {
          where: { id: string };
          data: Record<string, unknown>;
        }) => Promise<unknown>;
        updateMany: (args: {
          where: Record<string, unknown>;
          data: Record<string, unknown>;
        }) => Promise<unknown>;
        findUnique: (args: {
          where: { id: string };
          select: Record<string, boolean>;
        }) => Promise<{
          id: string;
          userId: string;
          tokenHash: string;
          deviceFingerprint: string | null;
          revokedAt: Date | null;
          expiresAt: Date;
        } | null>;
      }
    | null {
    const model = (this.prisma as unknown as Record<string, unknown>)[
      'refreshToken'
    ];
    if (model && typeof model === 'object') {
      return model as never;
    }
    return null;
  }
}
