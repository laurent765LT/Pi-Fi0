import {
  IsEmail,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

/**
 * Password policy for Strick'in production:
 * - at least 12 characters
 * - at least 1 uppercase letter
 * - at least 1 digit
 * - at least 1 special character among `!@#$%^&*`
 */
const PASSWORD_REGEX = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{12,}$/;

const PASSWORD_MESSAGE =
  'Password must contain at least 12 characters, including 1 uppercase letter, 1 digit, and 1 special character (!@#$%^&*).';

export class RegisterDto {
  @IsEmail({}, { message: 'A valid email address is required.' })
  @MaxLength(254)
  email!: string;

  @IsString()
  @Matches(PASSWORD_REGEX, { message: PASSWORD_MESSAGE })
  password!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName!: string;

  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName!: string;

  /**
   * Functional role for Strick'in. Defaults to `CGP`.
   * Maps to Prisma `UserRole` via AuthService.resolveRole().
   */
  @IsOptional()
  @IsIn(['CGP', 'ASSUREUR', 'ADMIN'])
  role?: 'CGP' | 'ASSUREUR' | 'ADMIN';
}
