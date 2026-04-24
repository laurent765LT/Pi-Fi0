import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user.repository.interface';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { UserNotFoundError } from '../../../domain/errors/user-not-found.error';
import { UserMapper } from '../../mappers/user.mapper';
import type { UserResponseDto } from '../../dtos/user-response.dto';
import type { GetUserByIdQuery } from './get-user-by-id.query';

@Injectable()
export class GetUserByIdHandler {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
  ) {}

  async execute(query: GetUserByIdQuery): Promise<UserResponseDto> {
    const user = await this.users.findById(UserId.of(query.userId));
    if (!user) {
      throw new UserNotFoundError(query.userId);
    }
    return UserMapper.toResponseDto(user);
  }
}
