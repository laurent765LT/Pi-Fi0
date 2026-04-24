import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class ProductInputDto {
  @IsString()
  isin!: string;

  @IsString()
  name!: string;

  @IsString()
  payoffType!: string;

  @IsString()
  issuerName!: string;

  @IsOptional()
  @IsString()
  guarantorName?: string | null;

  @IsString()
  underlyingName!: string;

  @IsOptional()
  @IsString()
  underlyingTicker?: string | null;

  @IsOptional()
  @IsNumber()
  barrierCapPct?: number | null;

  @IsOptional()
  @IsNumber()
  autocallBarrierPct?: number | null;

  @IsOptional()
  @IsNumber()
  couponPct?: number | null;

  @IsOptional()
  @IsNumber()
  maxGainPct?: number | null;

  @IsInt()
  @Min(1)
  @Max(7)
  sri!: number;

  @IsString()
  maturityDate!: string;

  @IsOptional()
  @IsNumber()
  entryFeePct?: number | null;

  @IsOptional()
  @IsString()
  description?: string | null;
}

class ClientProfileDto {
  @IsIn(['novice', 'intermediate', 'expert'])
  experienceLevel!: 'novice' | 'intermediate' | 'expert';

  @IsIn(['low', 'medium', 'high'])
  riskTolerance!: 'low' | 'medium' | 'high';

  @IsIn(['short', 'medium', 'long'])
  investmentHorizon!: 'short' | 'medium' | 'long';

  @IsOptional()
  @IsIn(['fr', 'en'])
  preferredLanguage?: 'fr' | 'en';
}

export class GenerateCommentaryDto {
  @ValidateNested()
  @Type(() => ProductInputDto)
  product!: ProductInputDto;

  @ValidateNested()
  @Type(() => ClientProfileDto)
  profile!: ClientProfileDto;
}
