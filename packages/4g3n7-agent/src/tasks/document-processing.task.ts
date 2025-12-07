import { Injectable, Logger } from '@nestjs/common';
import { GooseIntegration } from '../integrations/goose';

/**
 * Example task handler demonstrating Goose document processing integration
 * This shows how to integrate Goose capabilities into 4g3n7 task workflows
 */
@Injectable()
export class DocumentProcessingTask {
  private readonly logger = new Logger(DocumentProcessingTask.name);

  async processDocument(filePath: string, action: string = 'extract_data', params: any = {}) {
    const goose = GooseIntegration.getInstance();

    try {
      this.logger.log(`Processing document: ${filePath} with action: ${action}`);

      // Process document using Goose
      const result = await goose.processDocument(filePath, action, params);

      // Store key information in memory for future reference
      if (result.extracted) {
        await goose.rememberMemory(
          `Document processed: ${filePath} -> ${JSON.stringify(result.extracted)}`,
          'document_processing',
          ['finance', 'automation', filePath.split('.').pop()]
        );
      }

      this.logger.log(`Document processing completed successfully`);
      return {
        success: true,
        data: result,
        filePath,
        action,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      this.logger.error(`Document processing failed for ${filePath}`, error);
      return {
        success: false,
        error: error.message,
        filePath,
        action,
        timestamp: new Date().toISOString()
      };
    }
  }

  async extractInvoiceData(invoicePath: string) {
    return this.processDocument(invoicePath, 'extract_data', {
      fields: ['date', 'total', 'vendor', 'invoice_number'],
      schema: 'invoice'
    });
  }

  async summarizeDocument(docPath: string) {
    return this.processDocument(docPath, 'generate_summary', {
      max_length: 500,
      include_key_points: true
    });
  }

  async convertDocument(docPath: string, targetFormat: string) {
    return this.processDocument(docPath, 'convert_format', {
      target_format: targetFormat
    });
  }
}
