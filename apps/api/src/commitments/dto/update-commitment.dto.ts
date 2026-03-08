import { IsNumber, IsPositive } from 'class-validator';

export class UpdateCommitmentDto {
  /**
   * New amount in euros – must be a positive multiple of 1 000.
   */
  @IsNumber()
  @IsPositive()
  amount!: number;
}
