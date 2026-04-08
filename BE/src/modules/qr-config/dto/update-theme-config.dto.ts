import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CustomerUiSize } from '../entities/qr-config.entity';

export class UpdateThemeConfigDto {
  @IsString()
  @IsOptional()
  themeId?: string;

  @IsString()
  @IsOptional()
  primaryColor?: string;

  @IsString()
  @IsOptional()
  secondaryColor?: string;

  @IsString()
  @IsOptional()
  fontFamily?: string;

  @IsEnum(CustomerUiSize)
  @IsOptional()
  customerUiSize?: CustomerUiSize;
}
