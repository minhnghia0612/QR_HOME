import { Module, Global } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Translation } from './entities/translation.entity';
import { TranslationService } from './translation.service';
import { TranslationController } from './translation.controller';

@Global()
@Module({
  imports: [TypeOrmModule.forFeature([Translation])],
  controllers: [TranslationController],
  providers: [TranslationService],
  exports: [TranslationService, TypeOrmModule],
})
export class TranslationModule {}
