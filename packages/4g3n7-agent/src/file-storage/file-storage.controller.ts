import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UploadedFile,
  UseInterceptors,
  Body,
  Query,
  Res,
  BadRequestException,
  InternalServerErrorException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { FileStorageService } from './file-storage.service';
import { FileMigrationService } from './migration.service';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
} from '@nestjs/swagger';

@ApiTags('File Storage')
@Controller('files')
export class FileStorageController {
  constructor(
    private readonly fileStorage: FileStorageService,
    private readonly migrationService: FileMigrationService,
  ) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({ summary: 'Upload a file to object storage' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 200, description: 'File uploaded successfully' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Body('taskId') taskId: string,
    @Body('type') type: string = 'attachment',
  ) {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    try {
      const key = `${type}/${taskId}/${Date.now()}_${file.originalname}`;
      const result = await this.fileStorage.uploadFile(
        key,
        file.buffer,
        file.mimetype,
      );

      return {
        success: true,
        key,
        url: result,
        size: file.buffer.length,
        type: file.mimetype,
        originalName: file.originalname,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload file: ${error.message}`,
      );
    }
  }

  @Post('upload-base64')
  @ApiOperation({ summary: 'Upload a base64 encoded file to object storage' })
  @ApiResponse({ status: 200, description: 'File uploaded successfully' })
  async uploadBase64File(
    @Body()
    body: {
      data: string;
      filename: string;
      taskId: string;
      type?: string;
      mimeType?: string;
    },
  ) {
    try {
      const {
        data,
        filename,
        taskId,
        type = 'attachment',
        mimeType = 'application/octet-stream',
      } = body;

      if (!data || !filename || !taskId) {
        throw new BadRequestException(
          'Missing required fields: data, filename, taskId',
        );
      }

      // Decode base64
      const buffer = Buffer.from(data, 'base64');
      const key = `${type}/${taskId}/${Date.now()}_${filename}`;

      const result = await this.fileStorage.uploadFile(key, buffer, mimeType);

      return {
        success: true,
        key,
        url: result,
        size: buffer.length,
        type: mimeType,
        originalName: filename,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to upload file: ${error.message}`,
      );
    }
  }

  @Get(':key')
  @ApiOperation({ summary: 'Get a file from object storage' })
  @ApiResponse({ status: 200, description: 'File retrieved successfully' })
  async getFile(@Param('key') key: string, @Res() res: Response) {
    try {
      const buffer = await this.fileStorage.getFile(key);

      // Set appropriate headers
      res.setHeader('Content-Type', this.getMimeTypeFromKey(key));
      res.setHeader('Content-Length', buffer.length);
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year cache

      res.send(buffer);
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get file: ${error.message}`,
      );
    }
  }

  @Get(':key/url')
  @ApiOperation({ summary: 'Get a signed URL for a file' })
  @ApiResponse({
    status: 200,
    description: 'Signed URL generated successfully',
  })
  async getSignedUrl(
    @Param('key') key: string,
    @Query('expiresIn') expiresIn: number = 3600,
  ) {
    try {
      const url = await this.fileStorage.getSignedUrl(key, expiresIn);

      return {
        success: true,
        url,
        expiresIn,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to generate signed URL: ${error.message}`,
      );
    }
  }

  @Delete(':key')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a file from object storage' })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  async deleteFile(@Param('key') key: string) {
    try {
      await this.fileStorage.deleteFile(key);

      return {
        success: true,
        message: 'File deleted successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to delete file: ${error.message}`,
      );
    }
  }

  // Migration endpoints
  @Post('migration/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start Base64 to object storage migration' })
  @ApiResponse({ status: 200, description: 'Migration started' })
  async startMigration(
    @Body()
    body: {
      dryRun?: boolean;
      fileTypes?: string[];
      batchSize?: number;
    } = {},
  ) {
    try {
      await this.migrationService.startMigration(body);

      return {
        success: true,
        message: 'Migration started successfully',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to start migration: ${error.message}`,
      );
    }
  }

  @Get('migration/progress')
  @ApiOperation({ summary: 'Get migration progress' })
  @ApiResponse({ status: 200, description: 'Migration progress retrieved' })
  async getMigrationProgress() {
    try {
      const progress = await this.migrationService.getMigrationProgress();
      const stats = await this.migrationService.getMigrationStats();

      return {
        success: true,
        progress,
        stats,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get migration progress: ${error.message}`,
      );
    }
  }

  @Get('migration/stats')
  @ApiOperation({ summary: 'Get migration statistics' })
  @ApiResponse({ status: 200, description: 'Migration statistics retrieved' })
  async getMigrationStats() {
    try {
      const stats = await this.migrationService.getMigrationStats();

      return {
        success: true,
        stats,
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to get migration stats: ${error.message}`,
      );
    }
  }

  @Post('migration/rollback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rollback migration (dangerous!)' })
  @ApiResponse({ status: 200, description: 'Migration rollback completed' })
  async rollbackMigration() {
    try {
      await this.migrationService.rollbackMigration();

      return {
        success: true,
        message: 'Migration rollback completed',
      };
    } catch (error) {
      throw new InternalServerErrorException(
        `Failed to rollback migration: ${error.message}`,
      );
    }
  }

  private getMimeTypeFromKey(key: string): string {
    const ext = key.split('.').pop()?.toLowerCase();

    const mimeTypes: { [key: string]: string } = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      pdf: 'application/pdf',
      txt: 'text/plain',
      csv: 'text/csv',
      json: 'application/json',
      xml: 'application/xml',
      zip: 'application/zip',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };

    return mimeTypes[ext || ''] || 'application/octet-stream';
  }
}
