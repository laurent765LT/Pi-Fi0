import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import { RegisterUserCommand } from '../application/commands/register-user/register-user.command';
import { RegisterUserHandler } from '../application/commands/register-user/register-user.handler';
import type { UserResponseDto } from '../application/dtos/user-response.dto';
import { withHttpErrorMapping } from './errors-to-http';

/**
 * Admin-facing users controller.
 *
 * Self-service registration lives in `AuthModule` (it combines user
 * creation with token issuance in a single flow). This admin endpoint is
 * for "provision a user account on someone's behalf" — a common need in
 * B2B onboarding. RBAC is enforced by `JwtAuthGuard` + a future
 * `RolesGuard` (not yet wired).
 */
@Controller('api/v1/admin/users')
@UseGuards(JwtAuthGuard)
export class UsersAdminController {
  constructor(private readonly registerUser: RegisterUserHandler) {}

  @Post()
  @HttpCode(201)
  async create(@Body() cmd: RegisterUserCommand): Promise<UserResponseDto> {
    return withHttpErrorMapping(() => this.registerUser.execute(cmd));
  }
}
