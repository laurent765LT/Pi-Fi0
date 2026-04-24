import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Marks a route or controller as public — the `JwtAuthGuard` will skip it
 * and allow unauthenticated access.
 *
 * @example
 *   @Public()
 *   @Post('login')
 *   login() {}
 */
export const Public = (): MethodDecorator & ClassDecorator =>
  SetMetadata(IS_PUBLIC_KEY, true);
