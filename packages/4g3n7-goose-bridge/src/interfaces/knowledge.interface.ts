/**
 * Knowledge Base Interfaces for Phase 4
 * Defines knowledge representation, relationships, and validation
 */

export enum KnowledgeType {
  FACT = 'fact',
  RELATIONSHIP = 'relationship',
  RULE = 'rule',
  CONCEPT = 'concept',
  PATTERN = 'pattern',
  INSIGHT = 'insight',
}

export enum ConfidenceLevel {
  LOW = 0.3,
  MEDIUM = 0.6,
  HIGH = 0.8,
  VERIFIED = 1.0,
}

export interface KnowledgeItem {
  id: string;
  type: KnowledgeType;
  title: string;
  description: string;
  content: string;
  tags: string[];
  sources: string[];
  confidence: ConfidenceLevel;
  verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastReviewedAt?: Date;
  reviewedBy?: string;
  relatedItems: string[];
  evidence: Evidence[];
  metadata?: Record<string, any>;
}

export interface Evidence {
  id: string;
  source: string;
  content: string;
  strength: number; // 0-1
  timestamp: Date;
  reviewer?: string;
}

export interface KnowledgeRelationship {
  id: string;
  fromItemId: string;
  toItemId: string;
  relationType: 'related' | 'parent' | 'child' | 'similar' | 'contradicts';
  strength: number; // 0-1
  explanation?: string;
  createdAt: Date;
}

export interface EntityMention {
  text: string;
  type: string;
  confidence: number;
  position: { start: number; end: number };
}

export interface ExtractionResult {
  facts: KnowledgeItem[];
  relationships: KnowledgeRelationship[];
  entities: EntityMention[];
  insights: KnowledgeItem[];
  metadata?: Record<string, any>;
}

export interface KnowledgeValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: string[];
  overallScore: number; // 0-1
}

export interface ValidationError {
  field: string;
  message: string;
  severity: 'critical' | 'high' | 'medium';
}

export interface ValidationWarning {
  field: string;
  message: string;
  suggestion: string;
}

export interface KnowledgeQuery {
  q: string;
  type?: KnowledgeType;
  tags?: string[];
  verified?: boolean;
  minConfidence?: number;
  limit?: number;
  offset?: number;
}

export interface KnowledgeSearchResult {
  id: string;
  title: string;
  type: KnowledgeType;
  score: number;
  confidence: ConfidenceLevel;
  snippet: string;
}

export interface KnowledgeSearchResults {
  query: string;
  total: number;
  results: KnowledgeSearchResult[];
  executionTime: number;
}

export interface KnowledgeGraphNode {
  id: string;
  label: string;
  type: KnowledgeType;
  properties: Record<string, any>;
  degree: number;
}

export interface KnowledgeGraphEdge {
  id: string;
  source: string;
  target: string;
  relationType: string;
  weight: number;
}

export interface KnowledgeStatistics {
  totalItems: number;
  byType: Record<KnowledgeType, number>;
  verifiedCount: number;
  avgConfidence: number;
  relationshipCount: number;
  mostLinkedItem?: string;
  lastUpdated: Date;
}
