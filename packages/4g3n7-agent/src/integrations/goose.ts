import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class GooseIntegration {
  private static instance: GooseIntegration;
  private readonly logger = new Logger(GooseIntegration.name);
  private gooseUrl: string;

  private constructor(gooseUrl: string) {
    this.gooseUrl = gooseUrl;
  }

  public static getInstance(): GooseIntegration {
    if (!GooseIntegration.instance) {
      const url = process.env.GOOSE_API_URL || 'http://goose-agent:9993';
      GooseIntegration.instance = new GooseIntegration(url);
    }
    return GooseIntegration.instance;
  }

  async processDocument(filePath: string, action: string, params = {}): Promise<any> {
    try {
      const response = await axios.post(`${this.gooseUrl}/documents`, {
        action,
        file_path: filePath,
        ...params
      });
      this.logger.log(`Processed document: ${filePath}`);
      return response.data;
    } catch (error) {
      this.logger.error('Goose document processing failed', error);
      throw new Error('Document processing failed');
    }
  }

  async rememberMemory(data: string, category: string, tags: string[] = []) {
    try {
      await axios.post(`${this.gooseUrl}/memory`, {
        action: 'remember',
        data,
        category,
        tags,
        is_global: false
      });
      this.logger.log(`Memory stored in category: ${category}`);
    } catch (error) {
      this.logger.error('Memory storage failed', error);
    }
  }
}
