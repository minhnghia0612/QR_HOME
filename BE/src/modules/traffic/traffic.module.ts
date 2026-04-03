import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrafficController } from './traffic.controller';
import { TrafficService } from './traffic.service';
import { TrafficLog } from './entities/traffic-log.entity';
import { AuthModule } from '../auth/auth.module';
import { TrafficGateway } from './traffic.gateway';

@Module({
  imports: [TypeOrmModule.forFeature([TrafficLog]), AuthModule],
  controllers: [TrafficController],
  providers: [TrafficService, TrafficGateway],
  exports: [TrafficService],
})
export class TrafficModule {}
