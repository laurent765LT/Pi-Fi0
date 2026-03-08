import {
  IsString,
  IsNumber,
  IsPositive,
  IsOptional,
  Min,
  Max,
  IsDateString,
} from 'class-validator';

export class CreateShelfDto {
  @IsString()
  productId!: string;

  @IsNumber()
  @IsPositive()
  targetAmount!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  surbookingPct?: number;

  @IsDateString()
  closingDate!: string;
}
