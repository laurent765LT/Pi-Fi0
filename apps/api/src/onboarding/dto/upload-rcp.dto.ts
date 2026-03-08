import { IsString, IsNumber, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class UploadRcpDto {
  @IsString()
  rcpInsurer!: string;

  @IsNumber()
  @Min(0)
  @Type(() => Number)
  rcpAmount!: number;
}
