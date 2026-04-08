import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CurrencyUnit, QrStatus } from '../entities/qr-config.entity';

export class UpdateSettingsConfigDto {
  @IsEnum(QrStatus)
  @IsOptional()
  status?: QrStatus;

  @IsString()
  @IsOptional()
  spaName?: string;

  @IsString()
  @IsOptional()
  spaAddress?: string;

  @IsString()
  @IsOptional()
  spaPhone?: string;

  @IsString()
  @IsOptional()
  spaEmail?: string;

  @IsString()
  @IsOptional()
  spaLogo?: string;

  @IsString()
  @IsOptional()
  bannerUrl?: string;

  @IsString()
  @IsOptional()
  welcomeMessage?: string;

  @IsString()
  @IsOptional()
  backgroundColor?: string;

  @IsEnum(CurrencyUnit)
  @IsOptional()
  currencyUnit?: CurrencyUnit;
}
