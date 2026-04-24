import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuditLogService } from './services/audit-log.service';
import { TokenService } from './services/token.service';
import { JwtStrategy } from './strategies/jwt.strategy';

/**
 * Authentication module.
 *
 * Registers:
 *   - `JwtStrategy` (HS256) — extracts tokens from Authorization header
 *     or the `strickin_access` cookie.
 *   - `JwtAuthGuard` — opt-in per controller/handler via `@UseGuards()`;
 *     on this module's own routes, `@Public()` declares the few
 *     unauthenticated endpoints (login/register/refresh).
 *
 * Rate limiting is handled by the root `ThrottlerModule` in `AppModule`
 * (100 req/min/IP globally); per-endpoint tighter limits are declared with
 * `@Throttle()` on the controller (login 10/min, register 5/hour,
 * refresh 30/min).
 */
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        // The strategy/token service supply their own secret per sign/verify
        // call, but JwtModule needs a default for DI. We reuse the access
        // secret here — individual calls override it when necessary.
        secret:
          config.get<string>('JWT_ACCESS_SECRET') ??
          config.get<string>('JWT_SECRET'),
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    TokenService,
    AuditLogService,
    JwtStrategy,
    JwtAuthGuard,
  ],
  exports: [
    AuthService,
    TokenService,
    AuditLogService,
    JwtAuthGuard,
    JwtModule,
  ],
})
export class AuthModule {}
