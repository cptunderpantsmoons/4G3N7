/**
 * Memory System Interfaces for Phase 4
 * Defines memory storage, categorization, and retrieval patterns
 */

export enum MemoryCategory {
  PREFERENCES = 'preferences',
  PATTERNS = 'patterns',
  HISTORY = 'history',
  FACTS = 'facts',
  RELATIONSHIPS = 'relationships',
  RULES = 'rules',
  CONCEPTS = 'concepts',
  INTERACTIONS = 'interactions',
}

export enum MemoryPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export interface MemoryEntry {
  id: string;
  category: MemoryCategory;
  content: string;
  metadata?: Record<string, any>;
  tags: string[];
  priority: MemoryPriority;
  confidence?: number;
  createdAt: Date;
  updatedAt: Date;
  accessCount: number;
  lastAccessedAt?: Date;
  ttl?: number; // Time to live in milliseconds
  expiresAt?: Date;
  relatedMemories?: string[];
  evidence?: string[];
  source?: string;
}

export interface MemorySearchQuery {
  q: string;
  category?: MemoryCategory;
  tags?: string[];
  priority?: MemoryPriority;
  limit?: number;
  offset?: number;
  confidenceThreshold?: number;
}

export interface MemorySearchResult {
  id: string;
  content: string;
  category: MemoryCategory;
  score: number;
  relevance: number;
  tags: string[];
  priority: MemoryPriority;
}

export interface MemorySearchResults {
  query: string;
  total: number;
  results: MemorySearchResult[];
  executionTime: number;
}

export interface MemoryStatistics {
  totalMemories: number;
  byCategory: Record<MemoryCategory, number>;
  byPriority: Record<MemoryPriority, number>;
  avgConfidence: number;
  oldestMemory: Date;
  newestMemory: Date;
  mostAccessedMemory?: string;
  expiringMemories: number;
}

export interface MemoryCleanupPolicy {
  enabled: boolean;
  deleteExpiredMemories: boolean;
  archiveOldMemories: boolean;
  maxAge?: number; // milliseconds
  retentionCount?: number;
  cleanupInterval?: number; // milliseconds
}

export interface MemoryImportExport {
  memories: MemoryEntry[];
  exportedAt: Date;
  version: string;
  format: 'json' | 'csv';
}
