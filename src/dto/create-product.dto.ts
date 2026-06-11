import { IsNotEmpty, IsString, IsNumber, IsPositive, IsUrl, IsEnum } from 'class-validator';
import { NoProfanity } from '../common/no-profanity.decorator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  @NoProfanity({ message: 'A termék neve nem megengedett kifejezést tartalmaz' })
  name: string;

  @IsNotEmpty()
  @IsString()
  @NoProfanity({ message: 'A kategória neve nem megengedett kifejezést tartalmaz' })
  category: string;

  @IsNotEmpty()
  @IsUrl()
  image: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  price: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  max_stock: number;

  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  current_stock: number;

  @IsNotEmpty()
  @IsEnum(['available', 'unavailable'])
  status: 'available' | 'unavailable';

  @IsNotEmpty()
  @IsNumber()
  webshop_id: number;
}