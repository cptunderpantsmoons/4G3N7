import { Module } from '@nestjs/common';
import { FileStorageService } from './file-storage.service';
import { FileMigrationService } from './migration.service';
import { FileStorageController } from './file-storage.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [FileStorageController],
  providers: [FileStorageService, FileMigrationService],
  exports: [FileStorageService, FileMigrationService],
})
export class FileStorageModule {}