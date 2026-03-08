import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as argon2 from 'argon2';
import { PrismaService } from '../common/prisma.service';

interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  orgId: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
  ) {}

  async login(email: string, password: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { organization: true },
    });

    if (!user) throw new UnauthorizedException('Identifiants invalides');

    const valid = await argon2.verify(user.passwordHash, password);
    if (!valid) throw new UnauthorizedException('Identifiants invalides');

    const tokens = await this.generateTokens({
      sub: user.id,
      email: user.email,
      role: user.role,
      orgId: user.orgId,
    });

    await this.prisma.user.update({
      where: { id: user.id },
      data: { refreshToken: await argon2.hash(tokens.refreshToken) },
    });

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        orgId: user.orgId,
        orgType: user.organization.type,
        onboardingStatus: user.onboardingStatus,
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwt.verify<JwtPayload>(refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || !user.refreshToken) {
        throw new UnauthorizedException();
      }

      const valid = await argon2.verify(user.refreshToken, refreshToken);
      if (!valid) throw new UnauthorizedException();

      const tokens = await this.generateTokens({
        sub: user.id,
        email: user.email,
        role: user.role,
        orgId: user.orgId,
      });

      await this.prisma.user.update({
        where: { id: user.id },
        data: { refreshToken: await argon2.hash(tokens.refreshToken) },
      });

      return tokens;
    } catch {
      throw new UnauthorizedException('Token de rafraîchissement invalide');
    }
  }

  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true },
    });
    if (!user) throw new UnauthorizedException();

    const { passwordHash, refreshToken, ...profile } = user;
    return profile;
  }

  private async generateTokens(payload: JwtPayload) {
    const [accessToken, refreshToken] = await Promise.all([
      this.jwt.signAsync(payload),
      this.jwt.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
