import { IsString } from 'class-validator';

export class VerifyOriasDto {
  @IsString()
  oriasNumber!: string;
}
