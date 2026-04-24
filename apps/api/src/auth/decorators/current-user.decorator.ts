import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../types/authenticated-user.type';

/**
 * Injects the authenticated user (loaded from the DB, without password hash)
 * into a controller method.
 *
 * @example
 *   @Get('me')
 *   me(@CurrentUser() user: AuthenticatedUser) {
 *     return user;
 *   }
 */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AuthenticatedUser => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    if (!request.user) {
      throw new Error(
        'CurrentUser decorator used on a route without JwtAuthGuard.',
      );
    }
    return request.user;
  },
);
