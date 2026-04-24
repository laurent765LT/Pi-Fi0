import { Body, Controller, Get, Param, Patch, UseGuards } from '@nestjs/common';
import { CurrentUser } from '../../../auth/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../../auth/guards/jwt-auth.guard';
import type { AuthenticatedUser } from '../../../auth/types/authenticated-user.type';
import { GetCurrentUserHandler } from '../application/queries/get-current-user/get-current-user.handler';
import { GetCurrentUserQuery } from '../application/queries/get-current-user/get-current-user.query';
import { GetUserByIdHandler } from '../application/queries/get-user-by-id/get-user-by-id.handler';
import { GetUserByIdQuery } from '../application/queries/get-user-by-id/get-user-by-id.query';
import { UpdateUserProfileHandler } from '../application/commands/update-user-profile/update-user-profile.handler';
import { UpdateProfileRequestDto } from '../application/dtos/update-profile-request.dto';
import type { UserResponseDto } from '../application/dtos/user-response.dto';
import { withHttpErrorMapping } from './errors-to-http';

/**
 * Main users-facing controller. Routes here are scoped to the current
 * authenticated user: `/users/me` returns the current profile, and
 * `PATCH /users/me` lets them update it.
 *
 * Admin-only routes (list all users, disable a user, etc.) live in the
 * dedicated `UsersAdminController` to make the RBAC story explicit.
 */
@Controller('api/v1/users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly getCurrentUser: GetCurrentUserHandler,
    private readonly getUserById: GetUserByIdHandler,
    private readonly updateProfile: UpdateUserProfileHandler,
  ) {}

  @Get('me')
  async me(@CurrentUser() user: AuthenticatedUser): Promise<UserResponseDto> {
    return withHttpErrorMapping(() =>
      this.getCurrentUser.execute(new GetCurrentUserQuery(user.id)),
    );
  }

  @Patch('me')
  async updateMe(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateProfileRequestDto,
  ): Promise<UserResponseDto> {
    return withHttpErrorMapping(() =>
      this.updateProfile.execute({
        userId: user.id,
        firstName: dto.firstName,
        lastName: dto.lastName,
      }),
    );
  }

  /**
   * Lookup another user by id. Kept on the main controller (rather than
   * the admin one) because CGPs may need to resolve peers inside their
   * own org — access control is deferred to a future RLS guard.
   */
  @Get(':id')
  async getById(@Param('id') id: string): Promise<UserResponseDto> {
    return withHttpErrorMapping(() =>
      this.getUserById.execute(new GetUserByIdQuery(id)),
    );
  }
}
