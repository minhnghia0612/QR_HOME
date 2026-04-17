import { IsOptional, IsUUID, IsString, IsNotEmpty } from 'class-validator';

export class LogVisitDto {
  @IsOptional()
  @IsUUID()
  serviceId?: string;

  @IsUUID()
  @IsNotEmpty()
  adminId: string;

  @IsOptional()
  @IsUUID()
  storeId?: string;

  @IsOptional()
  @IsString()
  ipAddress?: string;

  @IsOptional()
  @IsString()
  userAgent?: string;
}
