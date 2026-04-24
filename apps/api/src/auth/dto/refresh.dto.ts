import { IsOptional, IsString, MaxLength } from 'class-validator';

export class RefreshDto {
  /**
   * Optional when the refresh token is sent via HttpOnly cookie.
   * When present in the body, it takes precedence.
   */
  @IsOptional()
  @IsString()
  @MaxLength(2048)
  refreshToken?: string;
}
