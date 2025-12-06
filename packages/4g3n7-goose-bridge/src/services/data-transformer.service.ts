import { Injectable, Logger } from '@nestjs/common';
const xml2js = require('xml2js');
import * as Papa from 'papaparse';

export type DataFormat = 'json' | 'xml' | 'csv' | 'yaml' | 'plaintext';

export interface TransformOptions {
  sourcePath?: string;
  targetPath?: string;
  mappings?: Array<{
    source: string;
    target: string;
    transform?: (value: any) => any;
  }>;
  flatten?: boolean;
}

export interface TransformResult {
  success: boolean;
  data?: any;
  format: DataFormat;
  recordsProcessed: number;
  duration: number;
  errors?: string[];
}

/**
 * Data Transformer Service
 * Converts data between formats (JSON, XML, CSV, etc.)
 */
@Injectable()
export class DataTransformerService {
  private readonly logger = new Logger(DataTransformerService.name);
  private xmlBuilder: any;
  private xmlParser: any;

  constructor() {
    this.xmlBuilder = new (xml2js as any).Builder();
    this.xmlParser = new (xml2js as any).Parser();
  }

  /**
   * Transform data from one format to another
   */
  async transform(
    data: any,
    fromFormat: DataFormat,
    toFormat: DataFormat,
    options?: TransformOptions
  ): Promise<TransformResult> {
    const startTime = Date.now();
    const errors: string[] = [];

    try {
      this.logger.log(
        `Transforming data from ${fromFormat} to ${toFormat}`
      );

      // Parse source format
      let parsed: any;
      try {
        parsed = this.parse(data, fromFormat);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to parse ${fromFormat}: ${msg}`);
      }

      // Apply field mappings if provided
      if (options?.mappings) {
        parsed = this.applyMappings(parsed, options.mappings);
      }

      // Flatten if requested
      if (options?.flatten) {
        parsed = this.flattenObject(parsed);
      }

      // Serialize to target format
      let result: string;
      try {
        result = this.serialize(parsed, toFormat);
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        throw new Error(`Failed to serialize to ${toFormat}: ${msg}`);
      }

      const duration = Date.now() - startTime;
      const recordCount = Array.isArray(parsed) ? parsed.length : 1;

      return {
        success: true,
        data: result,
        format: toFormat,
        recordsProcessed: recordCount,
        duration,
        errors: errors.length > 0 ? errors : undefined,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const msg = error instanceof Error ? error.message : String(error);

      this.logger.error(`Transform failed: ${msg}`, error);

      return {
        success: false,
        format: toFormat,
        recordsProcessed: 0,
        duration,
        errors: [msg],
      };
    }
  }

  /**
   * Parse data from specified format
   */
  private parse(data: any, format: DataFormat): any {
    try {
      switch (format) {
        case 'json':
          if (typeof data === 'string') {
            return JSON.parse(data);
          }
          return data;

        case 'csv':
          if (typeof data !== 'string') {
            throw new Error('CSV data must be a string');
          }
          return new Promise((resolve, reject) => {
            Papa.parse(data, {
              header: true,
              skipEmptyLines: true,
              complete: (results: any) => resolve(results.data),
              error: (error: any) => reject(error),
            });
          });

        case 'xml':
          if (typeof data !== 'string') {
            throw new Error('XML data must be a string');
          }
          return this.xmlParser.parseStringPromise(data);

        case 'plaintext':
          if (typeof data !== 'string') {
            return data;
          }
          return { content: data };

        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error parsing ${format}: ${msg}`);
      throw error;
    }
  }

  /**
   * Serialize data to specified format
   */
  private serialize(data: any, format: DataFormat): string {
    try {
      switch (format) {
        case 'json':
          return JSON.stringify(data, null, 2);

        case 'csv':
          if (Array.isArray(data)) {
            return Papa.unparse(data);
          } else if (typeof data === 'object') {
            return Papa.unparse([data]);
          }
          return String(data);

        case 'xml':
          if (typeof data === 'string') {
            return data; // Already XML
          }
          return this.xmlBuilder.buildObject({ root: data });

        case 'plaintext':
          if (typeof data === 'object') {
            return JSON.stringify(data);
          }
          return String(data);

        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error serializing to ${format}: ${msg}`);
      throw error;
    }
  }

  /**
   * Apply field mappings to data
   */
  private applyMappings(
    data: any,
    mappings: Array<{
      source: string;
      target: string;
      transform?: (value: any) => any;
    }>
  ): any {
    if (Array.isArray(data)) {
      return data.map((item) => this.mapFields(item, mappings));
    } else if (typeof data === 'object') {
      return this.mapFields(data, mappings);
    }
    return data;
  }

  /**
   * Map individual record fields
   */
  private mapFields(
    record: any,
    mappings: Array<{
      source: string;
      target: string;
      transform?: (value: any) => any;
    }>
  ): any {
    const result: Record<string, any> = {};

    for (const mapping of mappings) {
      let value = this.getNestedValue(record, mapping.source);

      if (mapping.transform && value !== undefined) {
        try {
          value = mapping.transform(value);
        } catch (error) {
          this.logger.warn(
            `Transform function failed for ${mapping.source}`,
            error
          );
        }
      }

      this.setNestedValue(result, mapping.target, value);
    }

    return result;
  }

  /**
   * Get nested value using dot notation
   */
  private getNestedValue(obj: any, path: string): any {
    const parts = path.split('.');
    let value = obj;

    for (const part of parts) {
      if (value == null) {
        return undefined;
      }
      value = value[part];
    }

    return value;
  }

  /**
   * Set nested value using dot notation
   */
  private setNestedValue(obj: any, path: string, value: any): void {
    const parts = path.split('.');
    let current = obj;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current)) {
        current[part] = {};
      }
      current = current[part];
    }

    current[parts[parts.length - 1]] = value;
  }

  /**
   * Flatten nested object to single level
   */
  private flattenObject(obj: any, prefix: string = ''): any {
    const result: Record<string, any> = {};

    const flatten = (o: any, p: string) => {
      for (const [key, value] of Object.entries(o)) {
        const newKey = p ? `${p}.${key}` : key;

        if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
          flatten(value, newKey);
        } else if (Array.isArray(value)) {
          result[newKey] = JSON.stringify(value);
        } else {
          result[newKey] = value;
        }
      }
    };

    if (Array.isArray(obj)) {
      return obj.map((item) => {
        const flattened: Record<string, any> = {};
        flatten(item, prefix);
        return flattened;
      });
    }

    flatten(obj, prefix);
    return result;
  }

  /**
   * Convert JSON to CSV
   */
  async jsonToCsv(data: any[]): Promise<string> {
    try {
      if (!Array.isArray(data)) {
        throw new Error('Data must be an array for CSV conversion');
      }
      return Papa.unparse(data);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error converting JSON to CSV: ${msg}`);
      throw error;
    }
  }

  /**
   * Convert CSV to JSON
   */
  async csvToJson(data: string): Promise<any[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(data, {
        header: true,
        skipEmptyLines: true,
        complete: (results: any) => resolve(results.data),
        error: (error: any) => reject(error),
      });
    });
  }

  /**
   * Convert JSON to XML
   */
  async jsonToXml(data: any): Promise<string> {
    try {
      return this.xmlBuilder.buildObject({ root: data });
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error converting JSON to XML: ${msg}`);
      throw error;
    }
  }

  /**
   * Convert XML to JSON
   */
  async xmlToJson(data: string): Promise<any> {
    try {
      return this.xmlParser.parseStringPromise(data);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error converting XML to JSON: ${msg}`);
      throw error;
    }
  }
}
