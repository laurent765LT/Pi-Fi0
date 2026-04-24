import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import type { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../common/prisma.service';
import type {
  AccessTokenPayload,
  AuthenticatedUser,
} from '../types/authenticated-user.type';

/**
 * Extracts the access token from either:
 *   1. The `Authorization: Bearer <token>` header (preferred for API clients)
 *   2. The `strickin_access` cookie (preferred for browser clients)
 *
 * The name of the cookie is configurable via `AUTH_COOKIE_NAME`.
 */
const cookieExtractor = (cookieName: string) => (req: Request): string | null => {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies;
  if (cookies && typeof cookies[cookieName] === 'string') {
    return cookies[cookieName];
  }
  return null;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    config: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    const cookieName = config.get<string>('AUTH_COOKIE_NAME', 'strickin_access');
    const secret =
      config.get<string>('JWT_ACCESS_SECRET') ??
      config.get<string>('JWT_SECRET');
    if (!secret) {
      throw new Error(
        'JWT_ACCESS_SECRET (or legacy JWT_SECRET) must be defined.',
      );
    }

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        cookieExtractor(cookieName),
      ]),
      ignoreExpiration: false,
      algorithms: ['HS256'],
      secretOrKey: secret,
    });
  }

  /**
   * Resolves the JWT payload into a full `AuthenticatedUser` by loading the
   * user row from the DB. This guarantees that if a user is disabled or
   * deleted, their outstanding access tokens stop working immediately.
   */
  async validate(payload: AccessTokenPayload): Promise<AuthenticatedUser> {
    if (!payload?.sub) {
      throw new UnauthorizedException('Malformed token payload.');
    }

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
      throw new UnauthorizedException('User no longer exists.');
    }

    return user;
  }
}
