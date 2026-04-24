import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import type { AuthenticatedUser } from '../types/authenticated-user.type';

/**
 * Global auth guard. Routes/controllers tagged with `@Public()` are skipped.
 *
 * Accepts tokens from:
 *   - `Authorization: Bearer <token>` header
 *   - `strickin_access` cookie (or whatever `AUTH_COOKIE_NAME` is set to)
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;
    return super.canActivate(context);
  }

  handleRequest<TUser extends AuthenticatedUser>(
    err: Error | null,
    user: TUser | false,
  ): TUser {
    if (err || !user) {
      throw err instanceof UnauthorizedException
        ? err
        : new UnauthorizedException('Authentication required.');
    }
    return user;
  }
}
