import type { User } from '../../domain/entities/user.entity';
import type { UserResponseDto } from '../dtos/user-response.dto';

/**
 * Maps a `User` domain aggregate to the public `UserResponseDto`. Used by
 * every handler that returns a user to the caller — keeps serialisation
 * logic in one place and guarantees we never leak a password hash.
 */
export class UserMapper {
  static toResponseDto(user: User): UserResponseDto {
    return {
      id: user.id.value,
      email: user.email.value,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      orgId: user.orgId,
      kycStatus: user.kycStatus,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    };
  }
}
