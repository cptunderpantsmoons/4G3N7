/**
 * Phase 5.2 - OCR Service
 * 
 * Optical Character Recognition service for text extraction, form detection,
 * and table recognition from images.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  OCRResult,
  TextBlock,
  TextLine,
  Character,
  FormField,
  TableDetection,
} from '../interfaces/computer-vision.interface';
import * as crypto from 'crypto';

@Injectable()
export class OCRService {
  private readonly logger = new Logger(OCRService.name);

  // Cache OCR results
  private ocrCache = new Map<string, OCRResult>();
  // Store extracted text
  private textStore = new Map<string, string>();
  // Language detection cache
  private languageCache = new Map<string, string>();

  constructor() {
    this.startCleanupScheduler();
  }

  /**
   * Perform OCR on an image
   */
  async performOCR(imageBuffer: Buffer, language: string = 'eng'): Promise<OCRResult> {
    const imageId = this.generateImageId(imageBuffer);
    const cacheKey = `${imageId}_${language}`;

    // Check cache
    const cached = this.ocrCache.get(cacheKey);
    if (cached) {
      this.logger.debug(`Using cached OCR result for image ${imageId}`);
      return cached;
    }

    try {
      this.logger.log(`Performing OCR on image: ${imageId} (language: ${language})`);

      const blocks = await this.extractTextBlocks(imageBuffer, language);
      const lines = this.organizeIntoLines(blocks);
      const rawText = this.buildRawText(blocks);
      const tables = await this.detectTables(imageBuffer);
      const formFields = await this.detectForms(imageBuffer);

      const result: OCRResult = {
        imageId,
        timestamp: new Date(),
        rawText,
        blocks,
        lines,
        metadata: {
          language,
          direction: this.detectTextDirection(blocks),
          averageConfidence: this.calculateAverageConfidence(blocks),
          processingTime: Date.now(), // TODO: Use actual processing time
        },
        tables,
        formFields,
      };

      this.ocrCache.set(cacheKey, result);
      this.textStore.set(imageId, rawText);
      this.languageCache.set(imageId, language);

      return result;
    } catch (error) {
      this.logger.error(`Error performing OCR: ${error.message}`);
      throw error;
    }
  }

  /**
   * Extract just the text from an image
   */
  async extractText(imageBuffer: Buffer, language: string = 'eng'): Promise<string> {
    const imageId = this.generateImageId(imageBuffer);

    // Check cache
    const cached = this.textStore.get(imageId);
    if (cached) {
      return cached;
    }

    try {
      const result = await this.performOCR(imageBuffer, language);
      return result.rawText;
    } catch (error) {
      this.logger.error(`Error extracting text: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate unique image ID from buffer hash
   */
  private generateImageId(imageBuffer: Buffer): string {
    return `img_${crypto.createHash('sha256').update(imageBuffer).digest('hex').substring(0, 16)}`;
  }

  /**
   * Extract text blocks from image
   */
  private async extractTextBlocks(imageBuffer: Buffer, language: string): Promise<TextBlock[]> {
    this.logger.debug(`Extracting text blocks from image (language: ${language})`);

    // TODO: Integrate with Tesseract.js, PaddleOCR, or Google Vision API
    // For now, return empty array
    const blocks: TextBlock[] = [];

    // TODO: Actual OCR implementation
    // - Segment image into text regions
    // - Extract characters with confidence
    // - Detect font properties
    // - Determine text direction

    return blocks;
  }

  /**
   * Organize text blocks into lines
   */
  private organizeIntoLines(blocks: TextBlock[]): TextLine[] {
    this.logger.debug(`Organizing ${blocks.length} blocks into lines`);

    const lines: TextLine[] = [];

    // TODO: Implement line organization algorithm
    // - Group characters by Y-coordinate (baseline)
    // - Sort left-to-right
    // - Create TextLine objects

    return lines;
  }

  /**
   * Build raw text from blocks
   */
  private buildRawText(blocks: TextBlock[]): string {
    return blocks.map(b => b.text).join('\n');
  }

  /**
   * Detect text direction (LTR, RTL, vertical)
   */
  private detectTextDirection(blocks: TextBlock[]): 'ltr' | 'rtl' | 'vertical' {
    // TODO: Implement actual text direction detection
    // - Analyze character positions
    // - Detect common RTL languages (Arabic, Hebrew)
    // - Detect vertical writing systems (Chinese, Japanese, Korean)

    return 'ltr';
  }

  /**
   * Calculate average confidence across all blocks
   */
  private calculateAverageConfidence(blocks: TextBlock[]): number {
    if (blocks.length === 0) return 0;

    const sum = blocks.reduce((acc, block) => acc + block.confidence, 0);
    return sum / blocks.length;
  }

  /**
   * Detect tables in image
   */
  async detectTables(imageBuffer: Buffer): Promise<TableDetection[]> {
    this.logger.debug('Detecting tables in image');

    // TODO: Implement table detection
    // - Find grid patterns
    // - Extract cell content
    // - Build table structure

    const tables: TableDetection[] = [];

    return tables;
  }

  /**
   * Detect form fields in image
   */
  async detectForms(imageBuffer: Buffer): Promise<FormField[]> {
    this.logger.debug('Detecting form fields in image');

    // TODO: Implement form field detection
    // - Find input boxes
    // - Detect checkboxes and radio buttons
    // - Identify labels
    // - Detect dropdowns and text areas

    const fields: FormField[] = [];

    return fields;
  }

  /**
   * Get cached OCR result
   */
  getOCRResult(imageId: string, language: string = 'eng'): OCRResult | undefined {
    const cacheKey = `${imageId}_${language}`;
    return this.ocrCache.get(cacheKey);
  }

  /**
   * Get extracted text
   */
  getText(imageId: string): string | undefined {
    return this.textStore.get(imageId);
  }

  /**
   * Search text in OCR results
   */
  searchText(query: string, limit: number = 10): Array<{ imageId: string; text: string; matches: number }> {
    const results = [];

    for (const [imageId, text] of this.textStore) {
      const regex = new RegExp(query, 'gi');
      const matches = text.match(regex);

      if (matches) {
        results.push({
          imageId,
          text: text.substring(0, 200),
          matches: matches.length,
        });
      }
    }

    return results.slice(0, limit);
  }

  /**
   * List extracted text
   */
  listExtractedText(limit?: number): Array<{ imageId: string; length: number }> {
    let texts = Array.from(this.textStore.entries()).map(([imageId, text]) => ({
      imageId,
      length: text.length,
    }));

    if (limit) {
      texts = texts.slice(-limit);
    }

    return texts;
  }

  /**
   * Clear OCR cache
   */
  clearOCR(imageId?: string): void {
    if (imageId) {
      // Clear specific image
      const keysToDelete = Array.from(this.ocrCache.keys()).filter(k => k.startsWith(imageId));
      keysToDelete.forEach(k => this.ocrCache.delete(k));
      this.textStore.delete(imageId);
      this.languageCache.delete(imageId);
      this.logger.log(`Cleared OCR for image: ${imageId}`);
    } else {
      // Clear all
      this.ocrCache.clear();
      this.textStore.clear();
      this.languageCache.clear();
      this.logger.log('Cleared all OCR cache');
    }
  }

  /**
   * Get OCR statistics
   */
  getStatistics(): {
    cachedResults: number;
    extractedTexts: number;
    totalCharacters: number;
    averageTextLength: number;
  } {
    let totalChars = 0;
    for (const text of this.textStore.values()) {
      totalChars += text.length;
    }

    const avgLength = this.textStore.size > 0 ? totalChars / this.textStore.size : 0;

    return {
      cachedResults: this.ocrCache.size,
      extractedTexts: this.textStore.size,
      totalCharacters: totalChars,
      averageTextLength: avgLength,
    };
  }

  /**
   * Cleanup old cached data
   */
  private startCleanupScheduler(): void {
    const MAX_CACHED = 50;
    const CLEANUP_INTERVAL = 60 * 60 * 1000; // 1 hour

    setInterval(() => {
      if (this.ocrCache.size > MAX_CACHED) {
        const toRemove = this.ocrCache.size - MAX_CACHED;
        const entries = Array.from(this.ocrCache.entries()).slice(0, toRemove);

        for (const [key] of entries) {
          this.ocrCache.delete(key);
          const imageId = key.split('_')[0];
          this.textStore.delete(imageId);
          this.languageCache.delete(imageId);
        }

        this.logger.log(`Cleaned up ${toRemove} cached OCR results`);
      }
    }, CLEANUP_INTERVAL);
  }

  /**
   * Shutdown the service
   */
  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down OCR Service');
    this.ocrCache.clear();
    this.textStore.clear();
    this.languageCache.clear();
  }
}
