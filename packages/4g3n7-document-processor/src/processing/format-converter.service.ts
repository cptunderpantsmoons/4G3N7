import { Injectable, Logger } from '@nestjs/common';
import { exec } from 'child_process';
import { promisify } from 'util';
import { readFile, writeFile } from 'fs/promises';
import { DocxProcessorService } from './docx-processor.service';
import { PdfProcessorService } from './pdf-processor.service';
import { XlsxProcessorService } from './xlsx-processor.service';

const execAsync = promisify(exec);

export type SupportedFormat = 'docx' | 'pdf' | 'xlsx' | 'csv' | 'html' | 'txt' | 'md' | 'odt' | 'rtf';

@Injectable()
export class FormatConverterService {
  private readonly logger = new Logger(FormatConverterService.name);

  constructor(
    private readonly docxProcessor: DocxProcessorService,
    private readonly pdfProcessor: PdfProcessorService,
    private readonly xlsxProcessor: XlsxProcessorService,
  ) {}

  /**
   * Convert document between formats
   */
  async convert(
    inputPath: string,
    outputPath: string,
    fromFormat: SupportedFormat,
    toFormat: SupportedFormat,
  ): Promise<void> {
    try {
      this.logger.log(`Converting ${fromFormat} to ${toFormat}`);

      // Direct conversions
      if (fromFormat === 'docx' && toFormat === 'html') {
        const html = await this.docxProcessor.convertToHtml(inputPath);
        await writeFile(outputPath, html);
        return;
      }

      if (fromFormat === 'docx' && toFormat === 'md') {
        const markdown = await this.docxProcessor.convertToMarkdown(inputPath);
        await writeFile(outputPath, markdown);
        return;
      }

      if (fromFormat === 'xlsx' && toFormat === 'csv') {
        const csv = await this.xlsxProcessor.convertToCsv(inputPath);
        await writeFile(outputPath, csv);
        return;
      }

      if (fromFormat === 'xlsx' && toFormat === 'txt') {
        const data = await this.xlsxProcessor.extractData(inputPath);
        await writeFile(outputPath, data.text);
        return;
      }

      if (fromFormat === 'pdf' && toFormat === 'txt') {
        const data = await this.pdfProcessor.extractText(inputPath);
        await writeFile(outputPath, data.text);
        return;
      }

      // Use LibreOffice for complex conversions
      await this.convertWithLibreOffice(inputPath, outputPath, toFormat);
    } catch (error) {
      this.logger.error(`Error converting document: ${error.message}`, error.stack);
      throw new Error(`Failed to convert document: ${error.message}`);
    }
  }

  /**
   * Convert using LibreOffice
   */
  private async convertWithLibreOffice(
    inputPath: string,
    outputPath: string,
    toFormat: SupportedFormat,
  ): Promise<void> {
    try {
      const formatMap: Record<string, string> = {
        pdf: 'pdf',
        docx: 'docx',
        odt: 'odt',
        rtf: 'rtf',
        html: 'html',
        txt: 'txt',
      };

      const outputFormat = formatMap[toFormat];
      if (!outputFormat) {
        throw new Error(`Unsupported output format: ${toFormat}`);
      }

      const outputDir = outputPath.substring(0, outputPath.lastIndexOf('/'));

      // Use LibreOffice headless mode
      const command = `libreoffice --headless --convert-to ${outputFormat} --outdir ${outputDir} ${inputPath}`;
      
      const { stdout, stderr } = await execAsync(command);
      
      if (stderr && !stderr.includes('Warning')) {
        this.logger.warn(`LibreOffice warning: ${stderr}`);
      }

      this.logger.log(`Conversion completed: ${stdout}`);
    } catch (error) {
      this.logger.error(`Error converting with LibreOffice: ${error.message}`);
      throw new Error(`Failed to convert with LibreOffice: ${error.message}`);
    }
  }

  /**
   * Batch convert multiple documents
   */
  async batchConvert(
    files: Array<{ inputPath: string; outputPath: string; fromFormat: SupportedFormat; toFormat: SupportedFormat }>,
  ): Promise<Array<{ success: boolean; error?: string }>> {
    const results: Array<{ success: boolean; error?: string }> = [];

    for (const file of files) {
      try {
        await this.convert(file.inputPath, file.outputPath, file.fromFormat, file.toFormat);
        results.push({ success: true });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }

    return results;
  }

  /**
   * Get supported conversion paths
   */
  getSupportedConversions(): Record<SupportedFormat, SupportedFormat[]> {
    return {
      docx: ['pdf', 'html', 'txt', 'md', 'odt', 'rtf'],
      pdf: ['txt', 'html'],
      xlsx: ['csv', 'txt', 'html', 'pdf'],
      csv: ['xlsx', 'txt'],
      html: ['pdf', 'docx', 'txt'],
      txt: ['pdf', 'docx', 'html'],
      md: ['pdf', 'docx', 'html'],
      odt: ['pdf', 'docx', 'html', 'txt'],
      rtf: ['pdf', 'docx', 'html', 'txt'],
    };
  }

  /**
   * Check if conversion is supported
   */
  isConversionSupported(fromFormat: SupportedFormat, toFormat: SupportedFormat): boolean {
    const supported = this.getSupportedConversions();
    return supported[fromFormat]?.includes(toFormat) || false;
  }
}
