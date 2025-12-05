import { Injectable, Logger } from '@nestjs/common';
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';
import { readFile } from 'fs/promises';

export interface PdfMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string[];
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount: number;
}

export interface PdfExtractionResult {
  text: string;
  metadata: PdfMetadata;
  pageCount: number;
  wordCount: number;
  pages: Array<{
    pageNumber: number;
    text: string;
    wordCount: number;
  }>;
}

@Injectable()
export class PdfProcessorService {
  private readonly logger = new Logger(PdfProcessorService.name);

  /**
   * Extract text from PDF file
   */
  async extractText(filePath: string): Promise<PdfExtractionResult> {
    try {
      this.logger.log(`Extracting text from PDF: ${filePath}`);

      const dataBuffer = await readFile(filePath);
      const loadingTask = pdfjsLib.getDocument({ data: dataBuffer });
      const pdfDocument = await loadingTask.promise;

      const numPages = pdfDocument.numPages;
      const pages: Array<{ pageNumber: number; text: string; wordCount: number }> = [];
      let fullText = '';

      for (let i = 1; i <= numPages; i++) {
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items.map((item: any) => item.str).join(' ');
        
        pages.push({
          pageNumber: i,
          text: pageText,
          wordCount: this.countWords(pageText),
        });

        fullText += pageText + '\n';
      }

      const metadata = await this.extractMetadata(filePath);
      const wordCount = this.countWords(fullText);

      return {
        text: fullText,
        metadata: { ...metadata, pageCount: numPages },
        pageCount: numPages,
        wordCount,
        pages,
      };
    } catch (error) {
      this.logger.error(`Error extracting PDF text: ${error.message}`, error.stack);
      throw new Error(`Failed to extract PDF text: ${error.message}`);
    }
  }

  /**
   * Extract metadata from PDF file
   */
  async extractMetadata(filePath: string): Promise<PdfMetadata> {
    try {
      const dataBuffer = await readFile(filePath);
      const pdfDoc = await PDFDocument.load(dataBuffer);

      const title = pdfDoc.getTitle();
      const author = pdfDoc.getAuthor();
      const subject = pdfDoc.getSubject();
      const keywords = pdfDoc.getKeywords();
      const creator = pdfDoc.getCreator();
      const producer = pdfDoc.getProducer();
      const creationDate = pdfDoc.getCreationDate();
      const modificationDate = pdfDoc.getModificationDate();
      const pageCount = pdfDoc.getPageCount();

      return {
        title,
        author,
        subject,
        keywords: keywords ? keywords.split(',').map(k => k.trim()) : [],
        creator,
        producer,
        creationDate,
        modificationDate,
        pageCount,
      };
    } catch (error) {
      this.logger.error(`Error extracting PDF metadata: ${error.message}`);
      return { pageCount: 0 };
    }
  }

  /**
   * Extract images from PDF
   */
  async extractImages(filePath: string): Promise<Array<{ data: Buffer; pageNumber: number }>> {
    try {
      this.logger.log(`Extracting images from PDF: ${filePath}`);
      
      const dataBuffer = await readFile(filePath);
      const pdfDoc = await PDFDocument.load(dataBuffer);
      const images: Array<{ data: Buffer; pageNumber: number }> = [];

      // PDF image extraction is complex and requires additional libraries
      // This is a placeholder for the actual implementation
      
      return images;
    } catch (error) {
      this.logger.error(`Error extracting PDF images: ${error.message}`);
      return [];
    }
  }

  /**
   * Merge multiple PDF files
   */
  async mergePdfs(filePaths: string[]): Promise<Buffer> {
    try {
      this.logger.log(`Merging ${filePaths.length} PDF files`);

      const mergedPdf = await PDFDocument.create();

      for (const filePath of filePaths) {
        const dataBuffer = await readFile(filePath);
        const pdf = await PDFDocument.load(dataBuffer);
        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
        copiedPages.forEach((page) => mergedPdf.addPage(page));
      }

      const mergedPdfBytes = await mergedPdf.save();
      return Buffer.from(mergedPdfBytes);
    } catch (error) {
      this.logger.error(`Error merging PDFs: ${error.message}`);
      throw new Error(`Failed to merge PDFs: ${error.message}`);
    }
  }

  /**
   * Split PDF into individual pages
   */
  async splitPdf(filePath: string): Promise<Buffer[]> {
    try {
      this.logger.log(`Splitting PDF: ${filePath}`);

      const dataBuffer = await readFile(filePath);
      const pdfDoc = await PDFDocument.load(dataBuffer);
      const pages: Buffer[] = [];

      for (let i = 0; i < pdfDoc.getPageCount(); i++) {
        const newPdf = await PDFDocument.create();
        const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
        newPdf.addPage(copiedPage);
        const pdfBytes = await newPdf.save();
        pages.push(Buffer.from(pdfBytes));
      }

      return pages;
    } catch (error) {
      this.logger.error(`Error splitting PDF: ${error.message}`);
      throw new Error(`Failed to split PDF: ${error.message}`);
    }
  }

  /**
   * Add watermark to PDF
   */
  async addWatermark(filePath: string, watermarkText: string): Promise<Buffer> {
    try {
      const dataBuffer = await readFile(filePath);
      const pdfDoc = await PDFDocument.load(dataBuffer);
      const pages = pdfDoc.getPages();

      pages.forEach((page) => {
        const { width, height } = page.getSize();
        page.drawText(watermarkText, {
          x: width / 2 - 50,
          y: height / 2,
          size: 50,
          opacity: 0.3,
        });
      });

      const pdfBytes = await pdfDoc.save();
      return Buffer.from(pdfBytes);
    } catch (error) {
      this.logger.error(`Error adding watermark: ${error.message}`);
      throw new Error(`Failed to add watermark: ${error.message}`);
    }
  }

  /**
   * Extract specific pages from PDF
   */
  async extractPages(filePath: string, pageNumbers: number[]): Promise<Buffer> {
    try {
      const dataBuffer = await readFile(filePath);
      const pdfDoc = await PDFDocument.load(dataBuffer);
      const newPdf = await PDFDocument.create();

      const copiedPages = await newPdf.copyPages(pdfDoc, pageNumbers.map(n => n - 1));
      copiedPages.forEach((page) => newPdf.addPage(page));

      const pdfBytes = await newPdf.save();
      return Buffer.from(pdfBytes);
    } catch (error) {
      this.logger.error(`Error extracting pages: ${error.message}`);
      throw new Error(`Failed to extract pages: ${error.message}`);
    }
  }

  /**
   * Count words in text
   */
  private countWords(text: string): number {
    if (!text) return 0;
    return text.trim().split(/\s+/).filter(word => word.length > 0).length;
  }

  /**
   * Validate PDF file
   */
  async validate(filePath: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      const dataBuffer = await readFile(filePath);
      await PDFDocument.load(dataBuffer);
      return { valid: true, errors: [] };
    } catch (error) {
      errors.push(error.message);
      return { valid: false, errors };
    }
  }
}
