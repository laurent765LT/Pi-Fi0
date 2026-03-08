import { IsString, Matches } from 'class-validator';

export class UploadOriasDto {
  @IsString()
  @Matches(/^\d{8}$/, { message: 'ORIAS number must be exactly 8 digits' })
  oriasNumber!: string;
}
