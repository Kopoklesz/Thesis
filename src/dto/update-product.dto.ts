import { IsOptional, IsString, IsNumber, IsEnum, Min } from 'class-validator';
import { NoProfanity } from '../common/no-profanity.decorator';

export enum ProductStatus {
  AVAILABLE = 'available',
  UNAVAILABLE = 'unavailable'
}

export class UpdateProductDto {
  @IsOptional()
  @IsString()
  @NoProfanity({ message: 'A termék neve nem megengedett kifejezést tartalmaz' })
  name?: string;

  @IsOptional()
  @IsString()
  @NoProfanity({ message: 'A kategória neve nem megengedett kifejezést tartalmaz' })
  category?: string;

  @IsOptional()
  @IsString()
  image?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  price?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  max_stock?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  current_stock?: number;

  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}