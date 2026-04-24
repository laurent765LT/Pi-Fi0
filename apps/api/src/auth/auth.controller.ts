import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Throttle, minutes, hours } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import {
  AuthService,
  type AuthRequestContext,
  type AuthSessionResult,
} from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto, RefreshDto, RegisterDto } from './dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import type { AuthenticatedUser } from './types/authenticated-user.type';

const DEFAULT_COOKIE_NAME = 'strickin_access';
const DEFAULT_REFRESH_COOKIE_NAME = 'strickin_refresh';

/**
 * Request shape after `cookie-parser` middleware is installed. The parser is
 * optional — when absent, cookies are accessed via the raw header.
 *
 * We use an intersection type rather than `extends Request` because
 * `Request.cookies` is a required property in @types/express whose absence
 * at runtime (when cookie-parser isn't installed) is our whole point.
 */
type RequestWithCookies = Request & { cookies?: Record<string, string> };

@Controller('api/v1/auth')
export class AuthController {
  private readonly accessCookieName: string;
  private readonly refreshCookieName: string;
  private readonly isProd: boolean;

  constructor(
    private readonly auth: AuthService,
    config: ConfigService,
  ) {
    this.accessCookieName = config.get<string>(
      'AUTH_COOKIE_NAME',
      DEFAULT_COOKIE_NAME,
    );
    this.refreshCookieName = config.get<string>(
      'AUTH_REFRESH_COOKIE_NAME',
      DEFAULT_REFRESH_COOKIE_NAME,
    );
    this.isProd = config.get<string>('NODE_ENV') === 'production';
  }

  // ── REGISTER ──────────────────────────────────────────────────────────────

  @Public()
  @Post('register')
  @Throttle({ default: { ttl: hours(1), limit: 5 } })
  @HttpCode(201)
  async register(
    @Body() dto: RegisterDto,
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.register(dto, this.extractContext(req));
    this.setAuthCookies(res, result);
    return this.formatResponse(result);
  }

  // ── LOGIN ─────────────────────────────────────────────────────────────────

  @Public()
  @Post('login')
  @Throttle({ default: { ttl: minutes(1), limit: 10 } })
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.auth.login(dto, this.extractContext(req));
    this.setAuthCookies(res, result);
    return this.formatResponse(result);
  }

  // ── REFRESH ───────────────────────────────────────────────────────────────

  @Public()
  @Post('refresh')
  @Throttle({ default: { ttl: minutes(1), limit: 30 } })
  @HttpCode(200)
  async refresh(
    @Body() dto: RefreshDto,
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    const token =
      dto.refreshToken ??
      req.cookies?.[this.refreshCookieName] ??
      this.readRawCookie(req, this.refreshCookieName);

    if (!token) {
      throw new UnauthorizedException('Refresh token is required.');
    }

    const result = await this.auth.refresh(token, this.extractContext(req));
    this.setAuthCookies(res, result);
    return this.formatResponse(result);
  }

  // ── LOGOUT ────────────────────────────────────────────────────────────────

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(204)
  async logout(
    @CurrentUser() user: AuthenticatedUser,
    @Req() req: RequestWithCookies,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.auth.logout(user, this.extractContext(req));
    this.clearAuthCookies(res);
  }

  // ── ME ────────────────────────────────────────────────────────────────────

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async me(@CurrentUser() user: AuthenticatedUser) {
    // The guard already loaded a fresh copy from the DB, but we re-fetch to
    // ensure role / org changes propagate even between guard calls.
    return this.auth.me(user.id);
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private extractContext(req: RequestWithCookies): AuthRequestContext {
    const ipAddress =
      (req.headers['x-forwarded-for'] as string | undefined)
        ?.split(',')[0]
        ?.trim() ||
      req.socket?.remoteAddress ||
      req.ip ||
      null;
    const userAgent = (req.headers['user-agent'] as string | undefined) ?? null;
    return {
      ipAddress,
      userAgent,
      deviceFingerprint: null,
    };
  }

  private setAuthCookies(res: Response, result: AuthSessionResult) {
    const accessMaxAge = parseDurationSeconds(result.accessExpiresIn);
    const refreshMaxAge = parseDurationSeconds(result.refreshExpiresIn);

    res.cookie(this.accessCookieName, result.accessToken, {
      httpOnly: true,
      secure: this.isProd,
      sameSite: 'lax',
      path: '/',
      maxAge: accessMaxAge * 1000,
    });

    res.cookie(this.refreshCookieName, result.refreshToken, {
      httpOnly: true,
      secure: this.isProd,
      sameSite: 'lax',
      // Refresh cookie only needs to be sent to /auth/* — scope it down.
      path: '/api/v1/auth',
      maxAge: refreshMaxAge * 1000,
    });
  }

  private clearAuthCookies(res: Response) {
    res.clearCookie(this.accessCookieName, { path: '/' });
    res.clearCookie(this.refreshCookieName, { path: '/api/v1/auth' });
  }

  private formatResponse(result: AuthSessionResult) {
    return {
      accessToken: result.accessToken,
      refreshToken: result.refreshToken,
      expiresIn: result.accessExpiresIn,
      refreshExpiresIn: result.refreshExpiresIn,
      user: result.user,
    };
  }

  /**
   * Fallback cookie reader when `cookie-parser` is not installed — parses
   * the raw `Cookie` header. We keep the implementation tiny; the full
   * `cookie` package is a transitive dependency of Express anyway.
   */
  private readRawCookie(req: Request, name: string): string | null {
    const header = req.headers.cookie;
    if (!header) return null;
    const segments = header.split(';');
    for (const segment of segments) {
      const [rawName, ...rest] = segment.trim().split('=');
      if (rawName === name) {
        return decodeURIComponent(rest.join('='));
      }
    }
    return null;
  }
}

/**
 * Converts a duration string like `15m` or `30d` into a raw number of
 * seconds. Used for cookie `maxAge`.
 */
function parseDurationSeconds(duration: string): number {
  const match = /^(\d+)([smhdw])$/.exec(duration);
  if (!match || !match[1] || !match[2]) {
    // Treat the input as already-seconds when it's a bare number.
    const n = Number.parseInt(duration, 10);
    return Number.isFinite(n) ? n : 900;
  }
  const value = Number.parseInt(match[1], 10);
  const unit = match[2] as 's' | 'm' | 'h' | 'd' | 'w';
  const multipliers = {
    s: 1,
    m: 60,
    h: 60 * 60,
    d: 24 * 60 * 60,
    w: 7 * 24 * 60 * 60,
  } as const;
  return value * multipliers[unit];
}

