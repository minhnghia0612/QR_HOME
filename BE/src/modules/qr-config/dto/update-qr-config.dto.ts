import { IsString, IsOptional, IsEnum } from 'class-validator';
import { QrStatus } from '../entities/qr-config.entity';

export class UpdateQrConfigDto {
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
}
