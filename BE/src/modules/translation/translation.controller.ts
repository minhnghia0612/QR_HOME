import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { TranslationService } from './translation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('translation')
export class TranslationController {
  constructor(private readonly translationService: TranslationService) {}

  @UseGuards(JwtAuthGuard)
  @Post('auto')
  async autoTranslate(@Body() body: { payload: any; targetLang: string }) {
    const translated = await this.translationService.translateJSON(body.payload, body.targetLang);
    return { data: translated };
  }
}
