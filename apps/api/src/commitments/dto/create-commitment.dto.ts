import { IsString, IsNumber, IsPositive } from 'class-validator';

export class CreateCommitmentDto {
  @IsString()
  shelfId!: string;

  /**
   * Amount in euros – must be a positive multiple of 1 000.
   */
  @IsNumber()
  @IsPositive()
  amount!: number;
}
