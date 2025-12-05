-- Performance Optimization Indexes for 4G3N7 Database
-- This migration adds critical indexes to improve query performance

-- Task performance indexes
CREATE INDEX CONCURRENTLY "idx_task_status_priority" ON "Task" ("status", "priority" DESC);
CREATE INDEX CONCURRENTLY "idx_task_status_created_at" ON "Task" ("status", "createdAt" DESC);
CREATE INDEX CONCURRENTLY "idx_task_executed_at_priority" ON "Task" ("executedAt" ASC, "priority" DESC);
CREATE INDEX CONCURRENTLY "idx_task_queued_at" ON "Task" ("queuedAt" ASC) WHERE "queuedAt" IS NOT NULL;
CREATE INDEX CONCURRENTLY "idx_task_scheduled_for" ON "Task" ("scheduledFor" ASC) WHERE "scheduledFor" IS NOT NULL;
CREATE INDEX CONCURRENTLY "idx_task_control" ON "Task" ("control");

-- Message performance indexes
CREATE INDEX CONCURRENTLY "idx_message_task_id_created_at" ON "Message" ("taskId", "createdAt" ASC);
CREATE INDEX CONCURRENTLY "idx_message_task_id_summary_id" ON "Message" ("taskId", "summaryId") WHERE "summaryId" IS NULL;
CREATE INDEX CONCURRENTLY "idx_message_summary_id" ON "Message" ("summaryId") WHERE "summaryId" IS NOT NULL;
CREATE INDEX CONCURRENTLY "idx_message_role" ON "Message" ("role");

-- Summary performance indexes
CREATE INDEX CONCURRENTLY "idx_summary_task_id_created_at" ON "Summary" ("taskId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY "idx_summary_parent_id" ON "Summary" ("parentId") WHERE "parentId" IS NOT NULL;

-- File performance indexes
CREATE INDEX CONCURRENTLY "idx_file_task_id_created_at" ON "File" ("taskId", "createdAt" DESC);
CREATE INDEX CONCURRENTLY "idx_file_type" ON "File" ("type");

-- JSON indexes for frequently queried fields
-- Note: These are GIN indexes for JSONB fields to speed up JSON queries
CREATE INDEX CONCURRENTLY "idx_message_content_gin" ON "Message" USING GIN ("content");
CREATE INDEX CONCURRENTLY "idx_task_model_gin" ON "Task" USING GIN ("model");
CREATE INDEX CONCURRENTLY "idx_task_result_gin" ON "Task" USING GIN ("result");

-- Composite indexes for complex query patterns
CREATE INDEX CONCURRENTLY "idx_task_status_priority_created" ON "Task" ("status", "priority" DESC, "createdAt" DESC);
CREATE INDEX CONCURRENTLY "idx_task_status_executed_priority" ON "Task" ("status", "executedAt" ASC, "priority" DESC);

-- Partial indexes for common business logic
CREATE INDEX CONCURRENTLY "idx_task_active" ON "Task" ("id", "status", "priority")
WHERE "status" IN ('PENDING', 'RUNNING', 'NEEDS_HELP', 'NEEDS_REVIEW');

CREATE INDEX CONCURRENTLY "idx_task_completed" ON "Task" ("completedAt" DESC)
WHERE "status" = 'COMPLETED';

CREATE INDEX CONCURRENTLY "idx_message_unsummarized" ON "Message" ("taskId", "createdAt" ASC)
WHERE "summaryId" IS NULL;