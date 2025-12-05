import { Injectable, Logger } from '@nestjs/common';
import * as XLSX from 'xlsx';
import { readFile, writeFile } from 'fs/promises';

export interface XlsxMetadata {
  sheetNames: string[];
  sheetCount: number;
  author?: string;
  created?: Date;
  modified?: Date;
}

export interface XlsxSheet {
  name: string;
  data: any[][];
  headers?: string[];
  rowCount: number;
  columnCount: number;
}

export interface XlsxExtractionResult {
  metadata: XlsxMetadata;
  sheets: XlsxSheet[];
  text: string;
  json: any;
}

@Injectable()
export class XlsxProcessorService {
  private readonly logger = new Logger(XlsxProcessorService.name);

  /**
   * Extract data from XLSX file
   */
  async extractData(filePath: string): Promise<XlsxExtractionResult> {
    try {
      this.logger.log(`Extracting data from XLSX: ${filePath}`);

      const buffer = await readFile(filePath);
      const workbook = XLSX.read(buffer, { type: 'buffer' });

      const metadata: XlsxMetadata = {
        sheetNames: workbook.SheetNames,
        sheetCount: workbook.SheetNames.length,
        author: workbook.Props?.Author,
        created: workbook.Props?.CreatedDate,
        modified: workbook.Props?.ModifiedDate,
      };

      const sheets: XlsxSheet[] = [];
      let fullText = '';
      const json: any = {};

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
        const headers = jsonData[0] as string[];
        const data = jsonData as any[][];

        sheets.push({
          name: sheetName,
          data,
          headers,
          rowCount: data.length,
          columnCount: headers?.length || 0,
        });

        // Convert to text
        const sheetText = XLSX.utils.sheet_to_txt(worksheet);
        fullText += `\n\n=== ${sheetName} ===\n${sheetText}`;

        // Convert to JSON
        json[sheetName] = XLSX.utils.sheet_to_json(worksheet);
      }

      return {
        metadata,
        sheets,
        text: fullText.trim(),
        json,
      };
    } catch (error) {
      this.logger.error(`Error extracting XLSX data: ${error.message}`, error.stack);
      throw new Error(`Failed to extract XLSX data: ${error.message}`);
    }
  }

  /**
   * Extract specific sheet from XLSX file
   */
  async extractSheet(filePath: string, sheetName: string): Promise<XlsxSheet> {
    try {
      const buffer = await readFile(filePath);
      const workbook = XLSX.read(buffer, { type: 'buffer' });

      if (!workbook.SheetNames.includes(sheetName)) {
        throw new Error(`Sheet '${sheetName}' not found`);
      }

      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
      const headers = jsonData[0] as string[];
      const data = jsonData as any[][];

      return {
        name: sheetName,
        data,
        headers,
        rowCount: data.length,
        columnCount: headers?.length || 0,
      };
    } catch (error) {
      this.logger.error(`Error extracting sheet: ${error.message}`);
      throw new Error(`Failed to extract sheet: ${error.message}`);
    }
  }

  /**
   * Convert XLSX to CSV
   */
  async convertToCsv(filePath: string, sheetName?: string): Promise<string> {
    try {
      const buffer = await readFile(filePath);
      const workbook = XLSX.read(buffer, { type: 'buffer' });

      const targetSheet = sheetName || workbook.SheetNames[0];
      const worksheet = workbook.Sheets[targetSheet];

      return XLSX.utils.sheet_to_csv(worksheet);
    } catch (error) {
      this.logger.error(`Error converting to CSV: ${error.message}`);
      throw new Error(`Failed to convert to CSV: ${error.message}`);
    }
  }

  /**
   * Convert XLSX to JSON
   */
  async convertToJson(filePath: string): Promise<any> {
    try {
      const buffer = await readFile(filePath);
      const workbook = XLSX.read(buffer, { type: 'buffer' });

      const result: any = {};

      for (const sheetName of workbook.SheetNames) {
        const worksheet = workbook.Sheets[sheetName];
        result[sheetName] = XLSX.utils.sheet_to_json(worksheet);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error converting to JSON: ${error.message}`);
      throw new Error(`Failed to convert to JSON: ${error.message}`);
    }
  }

  /**
   * Create XLSX from JSON data
   */
  async createFromJson(data: any, outputPath: string): Promise<void> {
    try {
      const workbook = XLSX.utils.book_new();

      for (const [sheetName, sheetData] of Object.entries(data)) {
        const worksheet = XLSX.utils.json_to_sheet(sheetData as any[]);
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
      }

      const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
      await writeFile(outputPath, buffer);
    } catch (error) {
      this.logger.error(`Error creating XLSX from JSON: ${error.message}`);
      throw new Error(`Failed to create XLSX from JSON: ${error.message}`);
    }
  }

  /**
   * Merge multiple XLSX files
   */
  async mergeWorkbooks(filePaths: string[], outputPath: string): Promise<void> {
    try {
      const mergedWorkbook = XLSX.utils.book_new();

      for (const filePath of filePaths) {
        const buffer = await readFile(filePath);
        const workbook = XLSX.read(buffer, { type: 'buffer' });

        for (const sheetName of workbook.SheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const uniqueSheetName = `${sheetName}_${filePaths.indexOf(filePath)}`;
          XLSX.utils.book_append_sheet(mergedWorkbook, worksheet, uniqueSheetName);
        }
      }

      const buffer = XLSX.write(mergedWorkbook, { type: 'buffer', bookType: 'xlsx' });
      await writeFile(outputPath, buffer);
    } catch (error) {
      this.logger.error(`Error merging workbooks: ${error.message}`);
      throw new Error(`Failed to merge workbooks: ${error.message}`);
    }
  }

  /**
   * Extract form data from XLSX
   */
  async extractFormData(filePath: string): Promise<any> {
    try {
      const result = await this.extractData(filePath);
      
      // Parse form-like structures
      const formData: any = {};

      for (const sheet of result.sheets) {
        // Look for key-value pairs
        for (let i = 0; i < sheet.data.length; i++) {
          const row = sheet.data[i];
          if (row.length >= 2 && row[0] && row[1]) {
            formData[String(row[0])] = row[1];
          }
        }
      }

      return formData;
    } catch (error) {
      this.logger.error(`Error extracting form data: ${error.message}`);
      throw new Error(`Failed to extract form data: ${error.message}`);
    }
  }

  /**
   * Validate XLSX file
   */
  async validate(filePath: string): Promise<{ valid: boolean; errors: string[] }> {
    const errors: string[] = [];

    try {
      const buffer = await readFile(filePath);
      XLSX.read(buffer, { type: 'buffer' });
      return { valid: true, errors: [] };
    } catch (error) {
      errors.push(error.message);
      return { valid: false, errors };
    }
  }

  /**
   * Get statistics for XLSX file
   */
  async getStatistics(filePath: string): Promise<any> {
    try {
      const result = await this.extractData(filePath);

      const stats = {
        sheetCount: result.metadata.sheetCount,
        sheets: result.sheets.map(sheet => ({
          name: sheet.name,
          rowCount: sheet.rowCount,
          columnCount: sheet.columnCount,
          cellCount: sheet.rowCount * sheet.columnCount,
        })),
        totalRows: result.sheets.reduce((sum, sheet) => sum + sheet.rowCount, 0),
        totalColumns: result.sheets.reduce((sum, sheet) => sum + sheet.columnCount, 0),
      };

      return stats;
    } catch (error) {
      this.logger.error(`Error getting statistics: ${error.message}`);
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }
}
