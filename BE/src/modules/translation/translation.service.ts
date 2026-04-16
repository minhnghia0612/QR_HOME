import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class TranslationService {
  private ai: GoogleGenerativeAI;
  private readonly logger = new Logger(TranslationService.name);

  constructor(private config: ConfigService) {
    const key = this.config.get('GEMINI_API_KEY', '');
    if (key) {
      this.ai = new GoogleGenerativeAI(key);
      this.printAvailableModels(key);
    }
  }

  private async printAvailableModels(key: string) {
    try {
      this.logger.log('Fetching available Gemini models...');
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
      const data = await response.json();
      if (data.models) {
        const modelNames = data.models.map((m: any) => m.name);
        this.logger.log('Available models: ' + JSON.stringify(modelNames, null, 2));
      } else {
        this.logger.warn('Failed to parse models: ' + JSON.stringify(data));
      }
    } catch (e) {
      this.logger.error('Error fetching available models: ' + e.message);
    }
  }

  async translateJSON(payload: any, targetLang: string): Promise<any> {
    if (!this.ai) {
      throw new HttpException('AI Translate is not configured', HttpStatus.NOT_IMPLEMENTED);
    }

    try {
      const model = this.ai.getGenerativeModel({ model: 'gemini-2.5-flash' });
      const prompt = `You are a professional translator for a Web Booking system (Spa/Salon/Restaurant). 
                    Translate the string values in the following JSON object into the language code: "${targetLang}".
                    IMPORTANT RULES:
                    1. Keep the exact same JSON structure and keys.
                    2. Only translate the textual values (e.g. name, description, tags).
                    3. DO NOT translate prices, numbers, or boolean values.
                    4. Output ONLY the raw JSON string. Do not use markdown blocks like \`\`\`json.

                    Source JSON:
                    ${JSON.stringify(payload)}`;

      const result = await model.generateContent(prompt);
      let text = result.response.text();
      text = text.replace(/```json/gi, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    } catch (error) {
      this.logger.error('Failed to translate with Generative AI: ' + error.message);
      throw new HttpException('AI Translation failed', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
