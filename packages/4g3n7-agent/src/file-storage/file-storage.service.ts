import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, S3ClientConfig } from '@aws-sdk/client-s3';
import { Readable } from 'stream';
import { promises as fs } from 'fs';
import { join } from 'path';

export interface FileStorageProvider {
  uploadFile(key: string, buffer: Buffer, contentType?: string): Promise<string>;
  getFile(key: string): Promise<Buffer>;
  deleteFile(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
}

export interface FileStorageConfig {
  provider: 's3' | 'minio' | 'local';
  region?: string;
  bucket: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  forcePathStyle?: boolean;
  localPath?: string;
}

@Injectable()
export class FileStorageService implements OnModuleInit {
  private readonly logger = new Logger(FileStorageService.name);
  private readonly provider: FileStorageProvider;
  private readonly config: FileStorageConfig;

  constructor(private readonly configService: ConfigService) {
    this.config = this.loadConfig();
    this.provider = this.createProvider();
  }

  private loadConfig(): FileStorageConfig {
    const provider = this.configService.get<string>('FILE_STORAGE_PROVIDER', 'local') as 's3' | 'minio' | 'local';

    return {
      provider,
      region: this.configService.get<string>('AWS_REGION', 'us-east-1'),
      bucket: this.configService.get<string>('FILE_STORAGE_BUCKET', '4g3n7-files'),
      accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID'),
      secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY'),
      endpoint: this.configService.get<string>('MINIO_ENDPOINT'),
      forcePathStyle: this.configService.get<boolean>('MINIO_FORCE_PATH_STYLE', false),
      localPath: this.configService.get<string>('LOCAL_STORAGE_PATH', './uploads'),
    };
  }

  private createProvider(): FileStorageProvider {
    switch (this.config.provider) {
      case 's3':
      case 'minio':
        return new S3FileStorageProvider(this.config);
      case 'local':
        return new LocalFileStorageProvider(this.config);
      default:
        throw new Error(`Unsupported file storage provider: ${this.config.provider}`);
    }
  }

  async onModuleInit() {
    this.logger.log(`File storage initialized with provider: ${this.config.provider}`);
    this.logger.log(`Bucket/Path: ${this.config.bucket || this.config.localPath}`);
  }

  async uploadFile(key: string, buffer: Buffer, contentType?: string): Promise<string> {
    try {
      const result = await this.provider.uploadFile(key, buffer, contentType);
      this.logger.log(`File uploaded successfully: ${key}`);
      return result;
    } catch (error) {
      this.logger.error(`Failed to upload file: ${key}`, error);
      throw error;
    }
  }

  async getFile(key: string): Promise<Buffer> {
    try {
      const result = await this.provider.getFile(key);
      return result;
    } catch (error) {
      this.logger.error(`Failed to get file: ${key}`, error);
      throw error;
    }
  }

  async deleteFile(key: string): Promise<void> {
    try {
      await this.provider.deleteFile(key);
      this.logger.log(`File deleted successfully: ${key}`);
    } catch (error) {
      this.logger.error(`Failed to delete file: ${key}`, error);
      throw error;
    }
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    try {
      return await this.provider.getSignedUrl(key, expiresIn);
    } catch (error) {
      this.logger.error(`Failed to generate signed URL for: ${key}`, error);
      throw error;
    }
  }

  getProvider(): FileStorageProvider {
    return this.provider;
  }
}

class S3FileStorageProvider implements FileStorageProvider {
  private readonly s3Client: S3Client;
  private readonly logger = new Logger(S3FileStorageProvider.name);

  constructor(private readonly config: FileStorageConfig) {
    const clientConfig: S3ClientConfig = {
      region: this.config.region,
    };

    if (this.config.accessKeyId && this.config.secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId: this.config.accessKeyId,
        secretAccessKey: this.config.secretAccessKey,
      };
    }

    if (this.config.endpoint) {
      clientConfig.endpoint = this.config.endpoint;
      clientConfig.forcePathStyle = this.config.forcePathStyle;
    }

    this.s3Client = new S3Client(clientConfig);
  }

  async uploadFile(key: string, buffer: Buffer, contentType?: string): Promise<string> {
    const command = new PutObjectCommand({
      Bucket: this.config.bucket!,
      Key: key,
      Body: buffer,
      ContentType: contentType || 'application/octet-stream',
      ServerSideEncryption: 'AES256',
    });

    await this.s3Client.send(command);
    return `s3://${this.config.bucket}/${key}`;
  }

  async getFile(key: string): Promise<Buffer> {
    const command = new GetObjectCommand({
      Bucket: this.config.bucket!,
      Key: key,
    });

    const response = await this.s3Client.send(command);

    if (response.Body instanceof Readable) {
      const chunks: Buffer[] = [];
      for await (const chunk of response.Body) {
        chunks.push(chunk);
      }
      return Buffer.concat(chunks);
    }

    throw new Error('Unable to read file content');
  }

  async deleteFile(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
      Bucket: this.config.bucket!,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');
    const command = new GetObjectCommand({
      Bucket: this.config.bucket!,
      Key: key,
    });

    return await getSignedUrl(this.s3Client, command, { expiresIn });
  }
}

class LocalFileStorageProvider implements FileStorageProvider {
  private readonly logger = new Logger(LocalFileStorageProvider.name);

  constructor(private readonly config: FileStorageConfig) {
    this.ensureDirectoryExists();
  }

  private ensureDirectoryExists(): void {
    const path = this.config.localPath || './uploads';
    fs.mkdir(path, { recursive: true }).catch(() => {});
  }

  private getFilePath(key: string): string {
    return join(this.config.localPath || './uploads', key);
  }

  async uploadFile(key: string, buffer: Buffer, contentType?: string): Promise<string> {
    const filePath = this.getFilePath(key);
    const directory = dirname(filePath);

    await fs.mkdir(directory, { recursive: true });
    await fs.writeFile(filePath, buffer);

    return `file://${filePath}`;
  }

  async getFile(key: string): Promise<Buffer> {
    const filePath = this.getFilePath(key);
    return await fs.readFile(filePath);
  }

  async deleteFile(key: string): Promise<void> {
    const filePath = this.getFilePath(key);
    await fs.unlink(filePath);
  }

  async getSignedUrl(key: string, expiresIn: number): Promise<string> {
    // For local storage, return the file path directly
    // In a real implementation, you might want to generate temporary URLs
    return this.getFilePath(key);
  }
}

function dirname(path: string): string {
  return path.substring(0, path.lastIndexOf('/'));
}