import { IsString, MaxLength, MinLength } from 'class-validator';

/**
 * Input for UpdateUserProfile.
 *
 * `userId` is injected by the controller from the JWT — it is not part
 * of the request body. We still list it here so the handler signature
 * is self-documenting.
 */
export class UpdateUserProfileCommand {
  /** Set by the controller from `@CurrentUser()`. */
  userId!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;
}
