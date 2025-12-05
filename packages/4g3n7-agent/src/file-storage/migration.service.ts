import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FileStorageService } from './file-storage.service';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';

export interface MigrationProgress {
  totalFiles: number;
  processedFiles: number;
  failedFiles: number;
  currentFile?: string;
  percentage: number;
  startTime: Date;
  estimatedTimeRemaining?: number;
}

export interface MigrationResult {
  success: boolean;
  totalMigrated: number;
  totalFailed: number;
  errors: string[];
  duration: number;
}

export interface FileMigrationRecord {
  id: string;
  originalBase64Size: number;
  objectStorageKey: string;
  objectStorageSize: number;
  compressionRatio: number;
  migratedAt: Date;
  status: 'migrated' | 'failed' | 'pending';
  error?: string;
}

@Injectable()
export class FileMigrationService implements OnModuleInit {
  private readonly logger = new Logger(FileMigrationService.name);
  private readonly batchSize: number;
  private readonly maxRetries: number;
  private migrationInProgress = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly fileStorage: FileStorageService,
    private readonly configService: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.batchSize = this.configService.get<number>('MIGRATION_BATCH_SIZE', 50);
    this.maxRetries = this.configService.get<number>('MIGRATION_MAX_RETRIES', 3);
  }

  async onModuleInit() {
    this.logger.log('File migration service initialized');
  }

  async startMigration(options: {
    dryRun?: boolean;
    fileTypes?: string[];
    batchSize?: number;
  } = {}): Promise<void> {
    if (this.migrationInProgress) {
      throw new Error('Migration is already in progress');
    }

    this.migrationInProgress = true;
    const { dryRun = false, fileTypes, batchSize = this.batchSize } = options;

    this.logger.log(`Starting file migration (dry run: ${dryRun})`);

    try {
      const result = await this.performMigration(dryRun, fileTypes, batchSize);
      this.eventEmitter.emit('migration.completed', result);

      if (result.success) {
        this.logger.log(`Migration completed successfully: ${result.totalMigrated} files migrated in ${result.duration}ms`);
      } else {
        this.logger.error(`Migration completed with errors: ${result.totalFailed} files failed`);
      }
    } catch (error) {
      this.logger.error('Migration failed', error);
      this.eventEmitter.emit('migration.failed', error);
      throw error;
    } finally {
      this.migrationInProgress = false;
    }
  }

  private async performMigration(
    dryRun: boolean,
    fileTypes?: string[],
    batchSize: number
  ): Promise<MigrationResult> {
    const startTime = Date.now();
    const errors: string[] = [];
    let totalMigrated = 0;
    let totalFailed = 0;

    // Get files that need migration
    const filesToMigrate = await this.getFilesToMigrate(fileTypes);
    const totalFiles = filesToMigrate.length;

    this.logger.log(`Found ${totalFiles} files to migrate`);

    if (totalFiles === 0) {
      return {
        success: true,
        totalMigrated: 0,
        totalFailed: 0,
        errors: [],
        duration: Date.now() - startTime,
      };
    }

    // Process files in batches
    for (let i = 0; i < filesToMigrate.length; i += batchSize) {
      const batch = filesToMigrate.slice(i, i + batchSize);

      for (const file of batch) {
        try {
          if (!dryRun) {
            await this.migrateFile(file);
          }
          totalMigrated++;
        } catch (error) {
          totalFailed++;
          const errorMessage = `Failed to migrate file ${file.id}: ${error.message}`;
          this.logger.error(errorMessage);
          errors.push(errorMessage);

          if (!dryRun) {
            await this.markFileAsFailed(file.id, error.message);
          }
        }

        // Emit progress update
        const progress: MigrationProgress = {
          totalFiles,
          processedFiles: totalMigrated + totalFailed,
          failedFiles: totalFailed,
          currentFile: file.name,
          percentage: Math.round(((totalMigrated + totalFailed) / totalFiles) * 100),
          startTime: new Date(startTime),
          estimatedTimeRemaining: this.calculateETA(startTime, totalMigrated + totalFailed, totalFiles),
        };

        this.eventEmitter.emit('migration.progress', progress);
      }

      // Add small delay between batches to prevent overwhelming the system
      if (i + batchSize < filesToMigrate.length) {
        await this.delay(100);
      }
    }

    return {
      success: totalFailed === 0,
      totalMigrated,
      totalFailed,
      errors,
      duration: Date.now() - startTime,
    };
  }

  private async getFilesToMigrate(fileTypes?: string[]): Promise<any[]> {
    const where: any = {
      OR: [
        {
          objectStorageKey: null,
        },
        {
          migrationStatus: 'pending',
        },
      ],
    };

    if (fileTypes && fileTypes.length > 0) {
      where.type = {
        in: fileTypes,
      };
    }

    return await this.prisma.file.findMany({
      where,
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  private async migrateFile(file: any): Promise<void> {
    if (!file.content || !file.content.data) {
      throw new Error('File has no base64 content to migrate');
    }

    // Decode base64 content
    const buffer = Buffer.from(file.content.data, 'base64');
    const originalSize = buffer.length;

    // Generate object storage key
    const objectKey = this.generateObjectKey(file);

    // Upload to object storage
    await this.fileStorage.uploadFile(objectKey, buffer, file.content.media_type);

    // Update file record
    await this.prisma.file.update({
      where: { id: file.id },
      data: {
        objectStorageKey,
        objectStorageSize: buffer.length,
        originalSize,
        migrationStatus: 'migrated',
        migratedAt: new Date(),
        compressionRatio: originalSize > 0 ? buffer.length / originalSize : 1,
      },
    });

    // Optionally clear base64 content to save database space
    if (this.configService.get<boolean>('CLEAR_BASE64_AFTER_MIGRATION', false)) {
      await this.prisma.file.update({
        where: { id: file.id },
        data: {
          content: {
            ...file.content,
            data: null, // Clear base64 data
          },
        },
      });
    }
  }

  private async markFileAsFailed(fileId: string, error: string): Promise<void> {
    await this.prisma.file.update({
      where: { id: fileId },
      data: {
        migrationStatus: 'failed',
        migrationError: error,
        migratedAt: new Date(),
      },
    });
  }

  private generateObjectKey(file: any): string {
    const date = new Date(file.createdAt);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    // Generate a unique filename to avoid collisions
    const timestamp = date.getTime();
    const randomId = Math.random().toString(36).substring(2, 8);
    const extension = this.getFileExtension(file.name);

    return `files/${year}/${month}/${day}/${file.taskId}_${timestamp}_${randomId}${extension}`;
  }

  private getFileExtension(filename: string): string {
    const ext = filename.split('.').pop();
    return ext ? `.${ext}` : '';
  }

  private calculateETA(startTime: number, processed: number, total: number): number {
    if (processed === 0) return 0;

    const elapsed = Date.now() - startTime;
    const rate = processed / elapsed;
    const remaining = total - processed;

    return Math.round(remaining / rate);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getMigrationProgress(): Promise<MigrationProgress | null> {
    if (!this.migrationInProgress) {
      return null;
    }

    const stats = await this.getMigrationStats();

    return {
      totalFiles: stats.total,
      processedFiles: stats.migrated + stats.failed,
      failedFiles: stats.failed,
      percentage: stats.total > 0 ? Math.round(((stats.migrated + stats.failed) / stats.total) * 100) : 0,
      startTime: new Date(), // This should be stored in a better way
    };
  }

  async getMigrationStats(): Promise<{
    total: number;
    migrated: number;
    failed: number;
    pending: number;
  }> {
    const [total, migrated, failed, pending] = await Promise.all([
      this.prisma.file.count({
        where: {
          content: {
            not: null,
          },
        },
      }),
      this.prisma.file.count({
        where: {
          migrationStatus: 'migrated',
        },
      }),
      this.prisma.file.count({
        where: {
          migrationStatus: 'failed',
        },
      }),
      this.prisma.file.count({
        where: {
          OR: [
            {
              objectStorageKey: null,
            },
            {
              migrationStatus: 'pending',
            },
          ],
        },
      }),
    ]);

    return { total, migrated, failed, pending };
  }

  async rollbackMigration(): Promise<void> {
    this.logger.warn('Starting migration rollback - this will remove object storage files');

    const migratedFiles = await this.prisma.file.findMany({
      where: {
        objectStorageKey: {
          not: null,
        },
        migrationStatus: 'migrated',
      },
    });

    for (const file of migratedFiles) {
      try {
        if (file.objectStorageKey) {
          await this.fileStorage.deleteFile(file.objectStorageKey);
        }
      } catch (error) {
        this.logger.error(`Failed to delete object storage file ${file.objectStorageKey}:`, error);
      }
    }

    // Reset all migration status
    await this.prisma.file.updateMany({
      where: {
        migrationStatus: {
          not: null,
        },
      },
      data: {
        migrationStatus: null,
        objectStorageKey: null,
        objectStorageSize: null,
        migratedAt: null,
        migrationError: null,
      },
    });

    this.logger.log('Migration rollback completed');
  }
}