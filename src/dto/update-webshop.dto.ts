import { IsOptional, IsString, IsHexColor, IsEnum } from 'class-validator';
import { WebshopStatus } from '../entity/webshop.entity';
import { NoProfanity } from '../common/no-profanity.decorator';

export class UpdateWebshopDto {
  @IsOptional()
  @IsString()
  @NoProfanity({ message: 'A webshop neve nem megengedett kifejezést tartalmaz' })
  subject_name?: string;

  @IsOptional()
  @IsString()
  @NoProfanity({ message: 'A fizetőeszköz neve nem megengedett kifejezést tartalmaz' })
  paying_instrument?: string;

  @IsOptional()
  @IsHexColor()
  header_color_code?: string;

  @IsOptional()
  @IsString()
  paying_instrument_icon?: string;

  @IsOptional()
  @IsEnum(WebshopStatus)
  status?: WebshopStatus;
}