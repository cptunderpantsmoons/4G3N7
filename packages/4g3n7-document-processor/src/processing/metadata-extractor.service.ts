import { Injectable, Logger } from '@nestjs/common';
import { DocxProcessorService } from './docx-processor.service';
import { PdfProcessorService } from './pdf-processor.service';
import { XlsxProcessorService } from './xlsx-processor.service';

export interface DocumentMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  created?: Date;
  modified?: Date;
  lastModifiedBy?: string;
  pageCount?: number;
  wordCount?: number;
  language?: string;
  fileSize?: number;
  mimeType?: string;
  checksum?: string;
}

@Injectable()
export class MetadataExtractorService {
  private readonly logger = new Logger(MetadataExtractorService.name);

  constructor(
    private readonly docxProcessor: DocxProcessorService,
    private readonly pdfProcessor: PdfProcessorService,
    private readonly xlsxProcessor: XlsxProcessorService,
  ) {}

  /**
   * Extract metadata from any supported document type
   */
  async extractMetadata(filePath: string, mimeType: string): Promise<DocumentMetadata> {
    try {
      this.logger.log(`Extracting metadata from: ${filePath}`);

      if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) {
        return await this.extractDocxMetadata(filePath);
      }

      if (mimeType.includes('pdf')) {
        return await this.extractPdfMetadata(filePath);
      }

      if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
        return await this.extractXlsxMetadata(filePath);
      }

      return {};
    } catch (error) {
      this.logger.error(`Error extracting metadata: ${error.message}`);
      return {};
    }
  }

  /**
   * Extract DOCX metadata
   */
  private async extractDocxMetadata(filePath: string): Promise<DocumentMetadata> {
    const result = await this.docxProcessor.extractText(filePath);
    return {
      ...result.metadata,
      wordCount: result.wordCount,
    };
  }

  /**
   * Extract PDF metadata
   */
  private async extractPdfMetadata(filePath: string): Promise<DocumentMetadata> {
    const metadata = await this.pdfProcessor.extractMetadata(filePath);
    return {
      title: metadata.title,
      author: metadata.author,
      subject: metadata.subject,
      keywords: metadata.keywords,
      creator: metadata.creator,
      producer: metadata.producer,
      created: metadata.creationDate,
      modified: metadata.modificationDate,
      pageCount: metadata.pageCount,
    };
  }

  /**
   * Extract XLSX metadata
   */
  private async extractXlsxMetadata(filePath: string): Promise<DocumentMetadata> {
    const result = await this.xlsxProcessor.extractData(filePath);
    return {
      author: result.metadata.author,
      created: result.metadata.created,
      modified: result.metadata.modified,
    };
  }

  /**
   * Enrich metadata with additional information
   */
  async enrichMetadata(metadata: DocumentMetadata, filePath: string): Promise<DocumentMetadata> {
    try {
      const fs = await import('fs/promises');
      const crypto = await import('crypto');
      
      const stats = await fs.stat(filePath);
      const buffer = await fs.readFile(filePath);
      const hash = crypto.createHash('sha256');
      hash.update(buffer);

      return {
        ...metadata,
        fileSize: stats.size,
        checksum: hash.digest('hex'),
      };
    } catch (error) {
      this.logger.error(`Error enriching metadata: ${error.message}`);
      return metadata;
    }
  }
}
