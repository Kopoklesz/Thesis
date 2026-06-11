import { IsNotEmpty, IsString, IsHexColor, IsEnum, IsOptional } from 'class-validator';
import { NoProfanity } from '../common/no-profanity.decorator';

export enum WebshopStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive'
}

export class CreateWebshopDto {
  @IsNotEmpty()
  @IsString()
  @NoProfanity({ message: 'A webshop neve nem megengedett kifejezést tartalmaz' })
  subject_name: string;

  @IsNotEmpty()
  @IsHexColor()
  header_color_code: string;

  @IsNotEmpty()
  @IsString()
  @NoProfanity({ message: 'A fizetőeszköz neve nem megengedett kifejezést tartalmaz' })
  paying_instrument: string;

  @IsOptional()
  @IsString()
  paying_instrument_icon: string;

  @IsNotEmpty()
  @IsEnum(WebshopStatus)
  status: WebshopStatus;
}