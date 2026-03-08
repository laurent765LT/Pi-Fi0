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

export class CreateProductDto {
  @IsString()
  isin!: string;

  @IsString()
  name!: string;

  @IsEnum(PayoffType)
  payoffType!: PayoffType;

  @IsString()
  issuerName!: string;

  @IsOptional()
  @IsString()
  guarantorName?: string;

  @IsString()
  underlyingName!: string;

  @IsString()
  underlyingYahoo!: string;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  initialPrice?: number;

  @IsNumber()
  @Type(() => Number)
  barrierCapPct!: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  autocallBarrierPct?: number;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  couponPct?: number;

  @IsNumber()
  @Type(() => Number)
  maxGainPct!: number;

  @IsInt()
  @Min(1)
  @Max(7)
  @Type(() => Number)
  sri!: number;

  @IsDateString()
  maturityDate!: string;

  @IsOptional()
  @IsArray()
  @IsDateString({}, { each: true })
  observationDates?: string[];

  @IsNumber()
  @Type(() => Number)
  entryFeePct!: number;

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
