/**
 * Data Processing Controller
 * REST API endpoints for data transformation and validation
 */

import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth
} from '@nestjs/swagger';
import { DataTransformerService, DataFormat, TransformOptions } from '../services/data-transformer.service';
import { DataValidatorService, DataSchema, ValidationResult } from '../services/data-validator.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { PermissionsGuard } from './permissions.guard';
import { Permissions } from '../decorators/permissions.decorator';

// DTOs for API requests
export class TransformDataDto {
  data: any;
  fromFormat: DataFormat;
  toFormat: DataFormat;
  options?: TransformOptions;
}

export class ValidateDataDto {
  data: any;
  schema: DataSchema;
  options?: {
    coerce?: boolean;
    strict?: boolean;
  };
}

export class TransformResultDto {
  success: boolean;
  data?: string;
  format: DataFormat;
  recordsProcessed: number;
  duration: number;
  errors?: string[];
}

export class ValidationResultDto {
  valid: boolean;
  errors: Array<{
    field: string;
    code: string;
    message: string;
    severity: 'error' | 'warning';
    value?: any;
  }>;
  warnings?: Array<{
    field: string;
    message: string;
  }>;
  data?: any;
  coercedData?: any;
}

@ApiTags('data-processing')
@Controller('api/v1/data')
export class DataProcessingController {
  constructor(
    private readonly transformerService: DataTransformerService,
    private readonly validatorService: DataValidatorService,
  ) {}

  /**
   * Transform data between formats
   */
  @Post('transform')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('data.transform')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Transform data between formats',
    description: 'Convert data from one format to another (JSON, XML, CSV, YAML, etc.)'
  })
  @ApiResponse({
    status: 200,
    description: 'Data transformation successful',
    type: TransformResultDto
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input or transformation error'
  })
  async transformData(@Body() dto: TransformDataDto): Promise<TransformResultDto> {
    return this.transformerService.transform(
      dto.data,
      dto.fromFormat,
      dto.toFormat,
      dto.options
    );
  }

  /**
   * Validate data against schema
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('data.validate')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Validate data against schema',
    description: 'Validate data against a JSON schema with custom validation rules'
  })
  @ApiResponse({
    status: 200,
    description: 'Validation completed',
    type: ValidationResultDto
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or invalid input'
  })
  async validateData(@Body() dto: ValidateDataDto): Promise<ValidationResultDto> {
    return this.validatorService.validate(
      dto.data,
      dto.schema,
      dto.options
    );
  }

  /**
   * Transform and validate data in one operation
   */
  @Post('process')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('data.process')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Transform and validate data',
    description: 'Transform data to a target format and validate against schema'
  })
  @ApiResponse({
    status: 200,
    description: 'Data processing completed successfully'
  })
  async processData(@Body() dto: {
    data: any;
    fromFormat: DataFormat;
    toFormat: DataFormat;
    schema: DataSchema;
    transformOptions?: TransformOptions;
    validationOptions?: {
      coerce?: boolean;
      strict?: boolean;
    };
  }): Promise<{
    transform: TransformResultDto;
    validation: ValidationResultDto;
  }> {
    // Transform first
    const transformResult = await this.transformerService.transform(
      dto.data,
      dto.fromFormat,
      dto.toFormat,
      dto.transformOptions
    );

    // Validate the transformed data
    const validationData = transformResult.success && transformResult.data
      ? transformResult.data
      : dto.data;

    const validationResult = await this.validatorService.validate(
      validationData,
      dto.schema,
      dto.validationOptions
    );

    return {
      transform: transformResult,
      validation: validationResult,
    };
  }

  /**
   * Convert JSON to CSV
   */
  @Post('json-to-csv')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('data.convert')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Convert JSON array to CSV',
    description: 'Convert a JSON array of objects to CSV format'
  })
  @ApiResponse({
    status: 200,
    description: 'Conversion successful',
    schema: { type: 'string', example: 'name,email\nJohn,john@example.com' }
  })
  async jsonToCsv(@Body() data: any[]): Promise<string> {
    return this.transformerService.jsonToCsv(data);
  }

  /**
   * Convert CSV to JSON
   */
  @Post('csv-to-json')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('data.convert')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Convert CSV to JSON',
    description: 'Convert CSV data to JSON array of objects'
  })
  @ApiResponse({
    status: 200,
    description: 'Conversion successful',
    schema: {
      type: 'array',
      items: { type: 'object' },
      example: [{ name: 'John', email: 'john@example.com' }]
    }
  })
  async csvToJson(@Body() csvData: string): Promise<any[]> {
    return this.transformerService.csvToJson(csvData);
  }

  /**
   * Convert JSON to XML
   */
  @Post('json-to-xml')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('data.convert')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Convert JSON to XML',
    description: 'Convert JSON object to XML format'
  })
  @ApiResponse({
    status: 200,
    description: 'Conversion successful',
    schema: { type: 'string', example: '<root><name>John</name></root>' }
  })
  async jsonToXml(@Body() data: any): Promise<string> {
    return this.transformerService.jsonToXml(data);
  }

  /**
   * Convert XML to JSON
   */
  @Post('xml-to-json')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('data.convert')
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Convert XML to JSON',
    description: 'Convert XML data to JSON object'
  })
  @ApiResponse({
    status: 200,
    description: 'Conversion successful',
    schema: { type: 'object', example: { root: { name: 'John' } } }
  })
  async xmlToJson(@Body() xmlData: string): Promise<any> {
    return this.transformerService.xmlToJson(xmlData);
  }
}
