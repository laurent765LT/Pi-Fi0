import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user.repository.interface';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { UserNotFoundError } from '../../../domain/errors/user-not-found.error';
import { UserMapper } from '../../mappers/user.mapper';
import type { UserResponseDto } from '../../dtos/user-response.dto';
import type { GetCurrentUserQuery } from './get-current-user.query';

/**
 * Returns the full profile of the authenticated user. The controller
 * wires `user.id` from the JWT into this query — we treat the two as
 * distinct concerns so we can later add "read-as another user"
 * impersonation for admins without duplicating logic.
 */
@Injectable()
export class GetCurrentUserHandler {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(query: GetCurrentUserQuery): Promise<UserResponseDto> {
    const user = await this.users.findById(UserId.of(query.userId));
    if (!user) {
      throw new UserNotFoundError(query.userId);
    }
    return UserMapper.toResponseDto(user);
  }
}
