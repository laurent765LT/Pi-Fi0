import {
  IsString,
  IsEnum,
  IsNumber,
  IsOptional,
  IsDateString,
  IsArray,
  IsInt,
  Min,
  Max,
  IsUrl,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PayoffType, ProductStatus } from '@prisma/client';

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  isin?: string;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEnum(PayoffType)
  payoffType?: PayoffType;

  @IsOptional()
  @IsString()
  issuerName?: string;

  @IsOptional()
  @IsString()
  guarantorName?: string;

  @IsOptional()
  @IsString()
  underlyingName?: string;

  @IsOptional()
  @IsString()
  underlyingYahoo?: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  initialPrice?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  barrierCapPct?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  autocallBarrierPct?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  couponPct?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  maxGainPct?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  @Type(() => Number)
  sri?: number;

  @IsOptional()
  @IsDateString()
  maturityDate?: string;

  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  observationDates?: string[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  entryFeePct?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  managementFeePct?: number;

  @IsOptional()
  @IsString()
  reference?: string;

  @IsOptional()
  @IsUrl()
  kidUrl?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  orgId?: string;
}
