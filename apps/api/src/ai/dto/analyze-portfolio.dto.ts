import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class PortfolioPositionDto {
  @IsString()
  productName!: string;

  @IsString()
  isin!: string;

  @IsString()
  payoffType!: string;

  @IsString()
  issuerName!: string;

  @IsString()
  underlyingName!: string;

  @IsInt()
  @Min(1)
  @Max(7)
  sri!: number;

  @IsOptional()
  @IsNumber()
  barrierPct!: number | null;

  @IsOptional()
  @IsNumber()
  couponPct!: number | null;

  @IsString()
  maturityDate!: string;

  @IsNumber()
  notional!: number;

  @IsOptional()
  @IsNumber()
  currentValuePct?: number;
}

class MaturityBucketsDto {
  @IsNumber()
  under1Y!: number;

  @IsNumber()
  oneToThreeY!: number;

  @IsNumber()
  overThreeY!: number;
}

export class AnalyzePortfolioDto {
  @IsNumber()
  totalNotional!: number;

  @IsString()
  currency!: string;

  @IsInt()
  positionCount!: number;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PortfolioPositionDto)
  positions!: PortfolioPositionDto[];

  @IsOptional()
  @IsNumber()
  averageSri?: number;

  @IsOptional()
  issuerConcentration?: Record<string, number>;

  @IsOptional()
  underlyingConcentration?: Record<string, number>;

  @IsOptional()
  @ValidateNested()
  @Type(() => MaturityBucketsDto)
  maturityBuckets?: MaturityBucketsDto;
}
