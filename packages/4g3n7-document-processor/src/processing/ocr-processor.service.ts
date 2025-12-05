import { Injectable, Logger } from '@nestjs/common';
import { createWorker, Worker, RecognizeResult } from 'tesseract.js';
import { readFile } from 'fs/promises';
import * as sharp from 'sharp';

export interface OcrResult {
  text: string;
  confidence: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
  lines: Array<{
    text: string;
    confidence: number;
    bbox: { x0: number; y0: number; x1: number; y1: number };
  }>;
  language: string;
}

@Injectable()
export class OcrProcessorService {
  private readonly logger = new Logger(OcrProcessorService.name);
  private worker: Worker | null = null;

  async onModuleInit() {
    // Initialize Tesseract worker
    try {
      this.logger.log('Initializing Tesseract OCR worker...');
      this.worker = await createWorker('eng');
      this.logger.log('Tesseract OCR worker initialized');
    } catch (error) {
      this.logger.error(`Failed to initialize OCR worker: ${error.message}`);
    }
  }

  async onModuleDestroy() {
    if (this.worker) {
      await this.worker.terminate();
    }
  }

  /**
   * Perform OCR on image file
   */
  async recognizeText(filePath: string, language = 'eng'): Promise<OcrResult> {
    try {
      this.logger.log(`Performing OCR on image: ${filePath}`);

      // Ensure worker is initialized
      if (!this.worker) {
        this.worker = await createWorker(language);
      } else if (language !== 'eng') {
        await this.worker.loadLanguage(language);
        await this.worker.initialize(language);
      }

      const result: RecognizeResult = await this.worker.recognize(filePath);

      return {
        text: result.data.text,
        confidence: result.data.confidence,
        words: result.data.words.map(word => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox,
        })),
        lines: result.data.lines.map(line => ({
          text: line.text,
          confidence: line.confidence,
          bbox: line.bbox,
        })),
        language,
      };
    } catch (error) {
      this.logger.error(`Error performing OCR: ${error.message}`, error.stack);
      throw new Error(`Failed to perform OCR: ${error.message}`);
    }
  }

  /**
   * Preprocess image for better OCR results
   */
  async preprocessImage(filePath: string, outputPath: string): Promise<void> {
    try {
      this.logger.log(`Preprocessing image: ${filePath}`);

      await sharp(filePath)
        .greyscale()
        .normalize()
        .threshold(128)
        .toFile(outputPath);

      this.logger.log(`Image preprocessed: ${outputPath}`);
    } catch (error) {
      this.logger.error(`Error preprocessing image: ${error.message}`);
      throw new Error(`Failed to preprocess image: ${error.message}`);
    }
  }

  /**
   * Perform OCR with preprocessing
   */
  async recognizeTextWithPreprocessing(filePath: string, language = 'eng'): Promise<OcrResult> {
    try {
      const preprocessedPath = `${filePath}.preprocessed.png`;
      await this.preprocessImage(filePath, preprocessedPath);
      const result = await this.recognizeText(preprocessedPath, language);
      
      // Clean up preprocessed file
      // await unlink(preprocessedPath);
      
      return result;
    } catch (error) {
      this.logger.error(`Error performing OCR with preprocessing: ${error.message}`);
      throw new Error(`Failed to perform OCR with preprocessing: ${error.message}`);
    }
  }

  /**
   * Detect language in image
   */
  async detectLanguage(filePath: string): Promise<string> {
    try {
      // Perform OCR with language detection
      const result = await this.recognizeText(filePath);
      return result.language;
    } catch (error) {
      this.logger.error(`Error detecting language: ${error.message}`);
      return 'eng';
    }
  }

  /**
   * Perform OCR on multiple images
   */
  async batchRecognize(filePaths: string[], language = 'eng'): Promise<OcrResult[]> {
    try {
      this.logger.log(`Performing batch OCR on ${filePaths.length} images`);

      const results: OcrResult[] = [];

      for (const filePath of filePaths) {
        const result = await this.recognizeText(filePath, language);
        results.push(result);
      }

      return results;
    } catch (error) {
      this.logger.error(`Error performing batch OCR: ${error.message}`);
      throw new Error(`Failed to perform batch OCR: ${error.message}`);
    }
  }

  /**
   * Extract text from specific region of image
   */
  async recognizeRegion(
    filePath: string,
    region: { x: number; y: number; width: number; height: number },
    language = 'eng'
  ): Promise<OcrResult> {
    try {
      // Extract region using sharp
      const regionPath = `${filePath}.region.png`;
      await sharp(filePath)
        .extract({
          left: region.x,
          top: region.y,
          width: region.width,
          height: region.height,
        })
        .toFile(regionPath);

      const result = await this.recognizeText(regionPath, language);
      
      // Clean up region file
      // await unlink(regionPath);
      
      return result;
    } catch (error) {
      this.logger.error(`Error recognizing region: ${error.message}`);
      throw new Error(`Failed to recognize region: ${error.message}`);
    }
  }

  /**
   * Get OCR confidence threshold recommendations
   */
  getConfidenceAnalysis(result: OcrResult): {
    overall: string;
    wordAccuracy: number;
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    if (result.confidence < 70) {
      recommendations.push('Consider preprocessing the image for better results');
      recommendations.push('Check image quality and resolution');
    }

    if (result.confidence < 50) {
      recommendations.push('Image may be too blurry or low quality');
      recommendations.push('Try different preprocessing options');
    }

    const lowConfidenceWords = result.words.filter(w => w.confidence < 60).length;
    const wordAccuracy = ((result.words.length - lowConfidenceWords) / result.words.length) * 100;

    if (wordAccuracy < 80) {
      recommendations.push('Many words have low confidence scores');
    }

    return {
      overall: result.confidence >= 80 ? 'Good' : result.confidence >= 60 ? 'Fair' : 'Poor',
      wordAccuracy,
      recommendations,
    };
  }
}
