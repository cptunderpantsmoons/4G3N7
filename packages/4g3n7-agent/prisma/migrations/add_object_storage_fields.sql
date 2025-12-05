-- Migration: Add object storage fields to File model
-- Purpose: Enable migration from Base64 to object storage (S3/MinIO)

-- Add MigrationStatus enum
DO $$ BEGIN
    CREATE TYPE "MigrationStatus" AS ENUM('PENDING', 'MIGRATED', 'FAILED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add object storage and migration fields to File table
ALTER TABLE "File"
ADD COLUMN IF NOT EXISTS "data" TEXT NULLABLE,
ADD COLUMN IF NOT EXISTS "objectStorageKey" TEXT NULLABLE,
ADD COLUMN IF NOT EXISTS "objectStorageSize" INTEGER NULLABLE,
ADD COLUMN IF NOT EXISTS "originalSize" INTEGER NULLABLE,
ADD COLUMN IF NOT EXISTS "migrationStatus" "MigrationStatus" NULLABLE,
ADD COLUMN IF NOT EXISTS "migratedAt" TIMESTAMP(3) NULLABLE,
ADD COLUMN IF NOT EXISTS "migrationError" TEXT NULLABLE,
ADD COLUMN IF NOT EXISTS "compressionRatio" DOUBLE PRECISION NULLABLE;

-- Make existing data nullable for migration compatibility
-- This allows existing files to keep their data while being migrated
UPDATE "File" SET "data" = "data" WHERE "data" IS NOT NULL;

-- Add migration-specific indexes for performance
CREATE INDEX IF NOT EXISTS "File_migrationStatus_idx" ON "File"("migrationStatus");
CREATE INDEX IF NOT EXISTS "File_objectStorageKey_idx" ON "File"("objectStorageKey");
CREATE INDEX IF NOT EXISTS "File_migratedAt_idx" ON "File"("migratedAt");
CREATE INDEX IF NOT EXISTS "File_migrationStatus_migratedAt_idx" ON "File"("migrationStatus", "migratedAt");

-- Create a partial index for files that need migration (performance optimization)
CREATE INDEX IF NOT EXISTS "File_needsMigration_idx" ON "File"("id")
WHERE "objectStorageKey" IS NULL OR "migrationStatus" = 'PENDING';

-- Add comments for documentation
COMMENT ON COLUMN "File"."data" IS 'Base64 encoded file data (legacy, will be cleared after migration)';
COMMENT ON COLUMN "File"."objectStorageKey" IS 'Key in object storage (S3/MinIO)';
COMMENT ON COLUMN "File"."objectStorageSize" IS 'File size in object storage in bytes';
COMMENT ON COLUMN "File"."originalSize" IS 'Original file size before migration in bytes';
COMMENT ON COLUMN "File"."migrationStatus" IS 'Migration status: PENDING, MIGRATED, or FAILED';
COMMENT ON COLUMN "File"."migratedAt" IS 'Timestamp when migration was completed';
COMMENT ON COLUMN "File"."migrationError" IS 'Error message if migration failed';
COMMENT ON COLUMN "File"."compressionRatio" IS 'Size reduction ratio (objectStorageSize / originalSize)';