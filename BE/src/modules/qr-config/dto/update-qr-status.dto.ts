import { IsEnum } from 'class-validator';
import { QrStatus } from '../entities/qr-config.entity';

export class UpdateQrStatusDto {
  @IsEnum(QrStatus)
  status: QrStatus;
}
