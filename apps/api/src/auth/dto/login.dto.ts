import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'A valid email address is required.' })
  @MaxLength(254)
  email!: string;

  /**
   * We deliberately keep a loose check here (min 1 char) — stricter password
   * rules are enforced at registration only. Rejecting a weak password at
   * login would leak password policy changes to attackers.
   */
  @IsString()
  @MinLength(1)
  @MaxLength(512)
  password!: string;
}
