import { IsString, MinLength, MaxLength } from 'class-validator';

/**
 * Inbound body for `PATCH /users/me`. This class uses class-validator
 * decorators (a presentation-layer concern under the Clean Architecture
 * dependency rule, but we keep DTOs in `application/` because they are
 * also the shape our command handlers accept natively).
 */
export class UpdateProfileRequestDto {
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;
}
