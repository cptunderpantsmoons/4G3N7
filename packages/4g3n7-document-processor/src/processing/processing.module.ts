import { Module } from '@nestjs/common';
import { DocxProcessorService } from './docx-processor.service';
import { PdfProcessorService } from './pdf-processor.service';
import { XlsxProcessorService } from './xlsx-processor.service';
import { OcrProcessorService } from './ocr-processor.service';
import { FormatConverterService } from './format-converter.service';
import { MetadataExtractorService } from './metadata-extractor.service';
import { DocumentAnalyzerService } from './document-analyzer.service';

@Module({
  providers: [
    DocxProcessorService,
    PdfProcessorService,
    XlsxProcessorService,
    OcrProcessorService,
    FormatConverterService,
    MetadataExtractorService,
    DocumentAnalyzerService,
  ],
  exports: [
    DocxProcessorService,
    PdfProcessorService,
    XlsxProcessorService,
    OcrProcessorService,
    FormatConverterService,
    MetadataExtractorService,
    DocumentAnalyzerService,
  ],
})
export class ProcessingModule {}
