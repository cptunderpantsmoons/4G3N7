import { Injectable, Logger } from '@nestjs/common';
import * as mammoth from 'mammoth';
import { createWriteStream, createReadStream } from 'fs';
import { promisify } from 'util';
import { pipeline } from 'stream';

const pipelineAsync = promisify(pipeline);

export interface DocxMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  created?: Date;
  modified?: Date;
  lastModifiedBy?: string;
}

export interface DocxExtractionResult {
  text: string;
  html?: string;
  metadata: DocxMetadata;
  wordCount: number;
  pageCount?: number;
  images?: Array<{
    data: Buffer;
    contentType: string;
  }>;
}

@Injectable()
export class DocxProcessorService {
  private readonly logger = new Logger(DocxProcessorService.name);

  /**
   * Extract text and metadata from DOCX file
   */
  async extractText(filePath: string): Promise<DocxExtractionResult> {
    try {
      this.logger.log(`Extracting text from DOCX: ${filePath}`);

      const result = await mammoth.extractRawText({ path: filePath });
      const htmlResult = await mammoth.convertToHtml({ path: filePath });
      
      const text = result.value;
      const html = htmlResult.value;
      const wordCount = this.countWords(text);

      // Extract metadata
      const metadata = await this.extractMetadata(filePath);

      return {
        text,
        html,
        metadata,
        wordCount,
      };
    } catch (error) {
      this.logger.error(`Error extracting DOCX text: ${error.message}`, error.stack);
      throw new Error(`Failed to extract DOCX text: ${error.message}`);
    }
  }

  /**
   * Extract metadata from DOCX file
   */
  async extractMetadata(filePath: string): Promise<DocxMetadata> {
    try {
      // Mammoth doesn't provide direct metadata extraction
      // We would need to use a different library or parse the XML directly
      // For now, return basic structure
      return {
        title: undefined,
        author: undefined,
        subject: undefined,
        keywords: [],
      };
    } catch (error) {
      this.logger.error(`Error extracting DOCX metadata: ${error.message}`);
      return {};
    }
  }

  /**
   * Extract images from DOCX file
   */
  async extractImages(filePath: string): Promise<Array<{ data: Buffer; contentType: string }>> {
    try {
      const images: Array<{ data: Buffer; contentType: string }> = [];

      const result = await mammoth.convertToHtml({
        path: filePath,
        convertImage: mammoth.images.imgElement(async (image) => {
          const buffer = await image.read();
          images.push({
            data: buffer,
            contentType: image.contentType || 'image/png',
          });
          return { src: `data:${image.contentType};base64,${buffer.toString('base64')}` };
        }),
      });

      return images;
    } catch (error) {
      this.logger.error(`Error extracting images from DOCX: ${error.message}`);
      return [];
    }
  }

  /**
   * Convert DOCX to HTML
   */
  async convertToHtml(filePath: string): Promise<string> {
    try {
      const result = await mammoth.convertToHtml({ path: filePath });
      return result.value;
    } catch (error) {
      this.logger.error(`Error converting DOCX to HTML: ${error.message}`);
      throw new Error(`Failed to convert DOCX to HTML: ${error.message}`);
    }
  }

  /**
   * Convert DOCX to Markdown
   */
  async convertToMarkdown(filePath: string): Promise<string> {
    try {
      const result = await mammoth.convertToMarkdown({ path: filePath });
      return result.value;
    } catch (error) {
      this.logger.error(`Error converting DOCX to Markdown: ${error.message}`);
      throw new Error(`Failed to convert DOCX to Markdown: ${error.message}`);
    }
  }

  /**
   * Extract structured content from DOCX
   */
  async extractStructuredContent(filePath: string): Promise<any> {
    try {
      const text = await this.extractText(filePath);
      const html = await this.convertToHtml(filePath);

      // Parse structure (headings, paragraphs, lists, tables)
      const structure = this.parseStructure(html);

      return {
        ...text,
        structure,
      };
    } catch (error) {
      this.logger.error(`Error extracting structured content: ${error.message}`);
      throw new Error(`Failed to extract structured content: ${error.message}`);
    }
  }

  /**
   * Parse document structure from HTML
   */
  private parseStructure(html: string): any {
    // Basic structure parsing
    // In production, use a proper HTML parser like cheerio or jsdom
    const structure = {
      headings: [],
      paragraphs: [],
      lists: [],
      tables: [],
    };

    return structure;
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Validate DOCX file
   */
  async validate(filePath: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      await mammoth.extractRawText({ path: filePath });
      return { valid: true, errors: [] };
    } catch (error) {
      errors.push(error.message);
      return { valid: false, errors };
    }
  }
}
