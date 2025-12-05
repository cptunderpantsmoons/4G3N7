import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocxProcessorService } from '../processing/docx-processor.service';
import { PdfProcessorService } from '../processing/pdf-processor.service';
import { XlsxProcessorService } from '../processing/xlsx-processor.service';
import { OcrProcessorService } from '../processing/ocr-processor.service';
import { MetadataExtractorService } from '../processing/metadata-extractor.service';
import { DocumentAnalyzerService } from '../processing/document-analyzer.service';
import { FormatConverterService } from '../processing/format-converter.service';

@Injectable()
export class DocumentService {
  private readonly logger = new Logger(DocumentService.name);

  constructor(
    private prisma: PrismaService,
    private docxProcessor: DocxProcessorService,
    private pdfProcessor: PdfProcessorService,
    private xlsxProcessor: XlsxProcessorService,
    private ocrProcessor: OcrProcessorService,
    private metadataExtractor: MetadataExtractorService,
    private documentAnalyzer: DocumentAnalyzerService,
    private formatConverter: FormatConverterService,
  ) {}

  /**
   * Process uploaded document
   */
  async processDocument(documentId: string, filePath: string, mimeType: string): Promise<any> {
    try {
      this.logger.log(`Processing document: ${documentId}`);

      // Extract metadata
      const metadata = await this.metadataExtractor.extractMetadata(filePath, mimeType);

      // Extract content based on type
      let extractedText = '';
      let extractedData: any = null;

      if (mimeType.includes('wordprocessingml') || mimeType.includes('msword')) {
        const result = await this.docxProcessor.extractText(filePath);
        extractedText = result.text;
        extractedData = result;
      } else if (mimeType.includes('pdf')) {
        const result = await this.pdfProcessor.extractText(filePath);
        extractedText = result.text;
        extractedData = result;
      } else if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
        const result = await this.xlsxProcessor.extractData(filePath);
        extractedText = result.text;
        extractedData = result;
      }

      // Analyze document
      let analysis: any = null;
      if (extractedText) {
        analysis = await this.documentAnalyzer.analyzeDocument(extractedText);
      }

      // Update document in database
      const document = await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'COMPLETED',
          stage: 'COMPLETED',
          metadata: metadata as any,
          extractedText,
          extractedData: extractedData as any,
          wordCount: analysis?.wordCount,
          pageCount: metadata.pageCount,
          language: analysis?.language,
          sentiment: analysis?.sentiment as any,
          classification: analysis?.topics || [],
          processingEndedAt: new Date(),
        },
      });

      return document;
    } catch (error) {
      this.logger.error(`Error processing document: ${error.message}`);
      
      // Update document with error
      await this.prisma.document.update({
        where: { id: documentId },
        data: {
          status: 'FAILED',
          error: error.message,
          processingEndedAt: new Date(),
        },
      });

      throw error;
    }
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string): Promise<any> {
    return this.prisma.document.findUnique({
      where: { id: documentId },
      include: {
        versions: true,
        conversions: true,
        workflows: true,
      },
    });
  }

  /**
   * Get all documents
   */
  async getDocuments(skip = 0, take = 10): Promise<any> {
    const [documents, total] = await Promise.all([
      this.prisma.document.findMany({
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.document.count(),
    ]);

    return {
      documents,
      total,
      page: Math.floor(skip / take) + 1,
      totalPages: Math.ceil(total / take),
    };
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string): Promise<void> {
    await this.prisma.document.delete({
      where: { id: documentId },
    });
  }

  /**
   * Compare two documents
   */
  async compareDocuments(sourceId: string, targetId: string): Promise<any> {
    const [source, target] = await Promise.all([
      this.getDocument(sourceId),
      this.getDocument(targetId),
    ]);

    if (!source || !target) {
      throw new Error('One or both documents not found');
    }

    // Calculate similarity
    const similarity = this.calculateSimilarity(
      source.extractedText || '',
      target.extractedText || ''
    );

    // Create comparison record
    const comparison = await this.prisma.documentComparison.create({
      data: {
        sourceDocumentId: sourceId,
        targetDocumentId: targetId,
        similarity,
        status: 'COMPLETED',
        completedAt: new Date(),
      },
    });

    return comparison;
  }

  /**
   * Calculate text similarity (basic implementation)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    // Very basic similarity - in production use proper algorithms
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }
}
