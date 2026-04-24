import { Inject, Injectable } from '@nestjs/common';
import {
  USER_REPOSITORY,
  type IUserRepository,
} from '../../../domain/repositories/user.repository.interface';
import { UserId } from '../../../domain/value-objects/user-id.vo';
import { UserNotFoundError } from '../../../domain/errors/user-not-found.error';
import {
  USER_EVENT_PUBLISHER,
  type IUserEventPublisher,
} from '../../ports/event-publisher.port';
import { UserMapper } from '../../mappers/user.mapper';
import type { UserResponseDto } from '../../dtos/user-response.dto';
import type { UpdateUserProfileCommand } from './update-user-profile.command';

@Injectable()
export class UpdateUserProfileHandler {
  constructor(
    @Inject(USER_REPOSITORY) private readonly users: IUserRepository,
    @Inject(USER_EVENT_PUBLISHER)
    private readonly events: IUserEventPublisher,
  ) {}

  async execute(cmd: UpdateUserProfileCommand): Promise<UserResponseDto> {
    const id = UserId.of(cmd.userId);
    const user = await this.users.findById(id);
    if (!user) {
      throw new UserNotFoundError(cmd.userId);
    }

    user.updateProfile(cmd.firstName, cmd.lastName);
    await this.users.save(user);
    await this.events.publish(user.pullDomainEvents());

    return UserMapper.toResponseDto(user);
  }
}
