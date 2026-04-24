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
 * Input for the RegisterUser use case.
 *
 * class-validator decorators let Nest's global `ValidationPipe` reject
 * malformed requests before the handler runs. The password policy here
 * mirrors `Password.isStrongEnough()` — the domain is the canonical rule,
 * this just surfaces the same check as an HTTP 400 early.
 */
const PASSWORD_REGEX =
  /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{12,}$/;

const PASSWORD_MESSAGE =
  'Password must contain at least 12 characters, including 1 uppercase letter, 1 digit, and 1 special character (!@#$%^&*).';

export class RegisterUserCommand {
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

  @IsOptional()
  @IsIn(['CGP', 'INSURER_ADMIN', 'ISSUER_ADMIN', 'PLATFORM_ADMIN'])
  role?: 'CGP' | 'INSURER_ADMIN' | 'ISSUER_ADMIN' | 'PLATFORM_ADMIN';

  /** Required: the org the user belongs to. */
  @IsString()
  @MinLength(1)
  orgId!: string;
}
