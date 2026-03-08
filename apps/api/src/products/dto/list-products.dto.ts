import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { PayoffType, ProductStatus } from '@prisma/client';

export class ListProductsDto {
  @IsOptional()
  @IsEnum(PayoffType)
  payoffType?: PayoffType;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  @Type(() => Number)
  minSri?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(7)
  @Type(() => Number)
  maxSri?: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number;
}
