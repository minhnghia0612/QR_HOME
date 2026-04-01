import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { QrConfigController } from './qr-config.controller';
import { QrConfigService } from './qr-config.service';
import { QrConfig } from './entities/qr-config.entity';
import { ServicesModule } from '../services/services.module';

@Module({
  imports: [TypeOrmModule.forFeature([QrConfig]), ServicesModule],
  controllers: [QrConfigController],
  providers: [QrConfigService],
  exports: [QrConfigService],
})
export class QrConfigModule {}
