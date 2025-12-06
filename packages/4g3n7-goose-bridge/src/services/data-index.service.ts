import { Injectable, Logger } from '@nestjs/common';

export interface IndexDocument {
  id: string;
  collection: string;
  content: string;
  metadata?: Record<string, any>;
  tokens: string[];
  score?: number;
}

export interface SearchQuery {
  q: string;
  collection?: string;
  limit?: number;
  offset?: number;
  filters?: Record<string, any>;
}

export interface SearchResult {
  id: string;
  collection: string;
  score: number;
  snippet?: string;
  metadata?: Record<string, any>;
}

export interface SearchResults {
  query: string;
  total: number;
  results: SearchResult[];
  suggestions?: string[];
  executionTime: number;
}

export interface IndexStatistics {
  totalDocuments: number;
  totalTokens: number;
  avgDocSize: number;
  collections: Record<string, number>;
  lastUpdated: Date;
}

/**
 * Data Index Service
 * Provides full-text search indexing and query capabilities
 */
@Injectable()
export class DataIndexService {
  private readonly logger = new Logger(DataIndexService.name);
  private indices: Map<string, Map<string, IndexDocument>> = new Map();
  private tokenIndex: Map<string, Set<string>> = new Map();
  private documentIndex: Map<string, IndexDocument> = new Map();

  constructor() {
    this.logger.log('Initialized Data Index Service');
  }

  /**
   * Index a document for full-text search
   */
  indexDocument(doc: IndexDocument): void {
    try {
      const docId = `${doc.collection}:${doc.id}`;
      
      // Store document
      this.documentIndex.set(docId, doc);
      
      // Initialize collection index if needed
      if (!this.indices.has(doc.collection)) {
        this.indices.set(doc.collection, new Map());
      }
      
      const collectionIndex = this.indices.get(doc.collection)!;
      collectionIndex.set(doc.id, doc);
      
      // Tokenize and index content
      const tokens = this.tokenizeContent(doc.content);
      doc.tokens = tokens;
      
      // Update token index
      tokens.forEach((token) => {
        if (!this.tokenIndex.has(token)) {
          this.tokenIndex.set(token, new Set());
        }
        this.tokenIndex.get(token)!.add(docId);
      });
      
      this.logger.debug(`Indexed document ${docId} with ${tokens.length} tokens`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error indexing document: ${msg}`, error);
      throw error;
    }
  }

  /**
   * Remove document from index
   */
  removeDocument(id: string, collection: string): void {
    try {
      const docId = `${collection}:${id}`;
      const doc = this.documentIndex.get(docId);
      
      if (!doc) {
        return;
      }
      
      // Remove from document index
      this.documentIndex.delete(docId);
      
      // Remove from collection index
      const collectionIndex = this.indices.get(collection);
      if (collectionIndex) {
        collectionIndex.delete(id);
      }
      
      // Remove from token index
      doc.tokens.forEach((token) => {
        const docSet = this.tokenIndex.get(token);
        if (docSet) {
          docSet.delete(docId);
          if (docSet.size === 0) {
            this.tokenIndex.delete(token);
          }
        }
      });
      
      this.logger.debug(`Removed document ${docId} from index`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error removing document: ${msg}`, error);
      throw error;
    }
  }

  /**
   * Search documents by query
   */
  search(query: SearchQuery): SearchResults {
    try {
      const startTime = Date.now();
      const normalizedQuery = query.q.toLowerCase();
      const tokens = this.tokenizeContent(normalizedQuery);
      const limit = query.limit || 10;
      const offset = query.offset || 0;
      
      // Find matching documents
      const matchedDocIds = this.findMatchingDocuments(tokens, query.collection);
      
      // Score and rank results
      const rankedResults = this.rankResults(matchedDocIds, tokens, normalizedQuery);
      
      // Apply filters if provided
      let filtered = rankedResults;
      if (query.filters) {
        filtered = this.applyFilters(rankedResults, query.filters);
      }
      
      // Generate suggestions
      const suggestions = this.generateSuggestions(tokens);
      
      // Paginate results
      const paginatedResults = filtered.slice(offset, offset + limit);
      
      const results: SearchResults = {
        query: query.q,
        total: filtered.length,
        results: paginatedResults.map((docId) => {
          const doc = this.documentIndex.get(docId)!;
          return {
            id: doc.id,
            collection: doc.collection,
            score: doc.score || 0,
            snippet: this.generateSnippet(doc.content, tokens),
            metadata: doc.metadata,
          };
        }),
        suggestions,
        executionTime: Date.now() - startTime,
      };
      
      this.logger.debug(`Search completed: ${filtered.length} results in ${results.executionTime}ms`);
      return results;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error searching documents: ${msg}`, error);
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  getStatistics(): IndexStatistics {
    const stats: Record<string, number> = {};
    
    this.indices.forEach((_, collection) => {
      stats[collection] = this.indices.get(collection)?.size || 0;
    });
    
    const totalDocuments = this.documentIndex.size;
    const totalTokens = this.tokenIndex.size;
    
    const avgDocSize = totalDocuments > 0
      ? Array.from(this.documentIndex.values()).reduce(
          (sum, doc) => sum + doc.tokens.length,
          0
        ) / totalDocuments
      : 0;
    
    return {
      totalDocuments,
      totalTokens,
      avgDocSize,
      collections: stats,
      lastUpdated: new Date(),
    };
  }

  /**
   * Clear all indices
   */
  clearIndex(): void {
    this.indices.clear();
    this.tokenIndex.clear();
    this.documentIndex.clear();
    this.logger.log('Index cleared');
  }

  /**
   * Tokenize content for indexing
   */
  private tokenizeContent(content: string): string[] {
    return content
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter((token) => token.length > 1);
  }

  /**
   * Find documents matching any token
   */
  private findMatchingDocuments(tokens: string[], collection?: string): string[] {
    const matched = new Set<string>();
    
    tokens.forEach((token) => {
      const docs = this.tokenIndex.get(token);
      if (docs) {
        docs.forEach((docId) => {
          if (!collection || docId.startsWith(`${collection}:`)) {
            matched.add(docId);
          }
        });
      }
    });
    
    return Array.from(matched);
  }

  /**
   * Rank results by relevance
   */
  private rankResults(docIds: string[], tokens: string[], query: string): string[] {
    const scoredDocs = docIds.map((docId) => {
      const doc = this.documentIndex.get(docId)!;
      let score = 0;
      
      // Count token matches
      tokens.forEach((token) => {
        const count = (doc.content.match(new RegExp(token, 'g')) || []).length;
        score += count * 10;
      });
      
      // Exact phrase bonus
      if (doc.content.toLowerCase().includes(query)) {
        score += 50;
      }
      
      doc.score = score;
      return docId;
    });
    
    return scoredDocs.sort(
      (a, b) => (this.documentIndex.get(b)?.score || 0) - (this.documentIndex.get(a)?.score || 0)
    );
  }

  /**
   * Apply filters to results
   */
  private applyFilters(
    docIds: string[],
    filters: Record<string, any>
  ): string[] {
    return docIds.filter((docId) => {
      const doc = this.documentIndex.get(docId)!;
      
      for (const [key, value] of Object.entries(filters)) {
        if (doc.metadata && doc.metadata[key] !== value) {
          return false;
        }
      }
      
      return true;
    });
  }

  /**
   * Generate search suggestions
   */
  private generateSuggestions(tokens: string[]): string[] {
    const suggestions = new Set<string>();
    
    tokens.forEach((token) => {
      // Find similar tokens
      Array.from(this.tokenIndex.keys()).forEach((existingToken) => {
        if (
          existingToken.startsWith(token.substring(0, 2)) &&
          existingToken !== token
        ) {
          suggestions.add(existingToken);
        }
      });
    });
    
    return Array.from(suggestions).slice(0, 5);
  }

  /**
   * Generate content snippet around match
   */
  private generateSnippet(content: string, tokens: string[], maxLength: number = 100): string {
    let snippet = content.substring(0, maxLength);
    
    // Find first token match position
    for (const token of tokens) {
      const index = content.toLowerCase().indexOf(token);
      if (index !== -1) {
        const start = Math.max(0, index - 20);
        snippet = content.substring(start, start + maxLength);
        break;
      }
    }
    
    return snippet.length < content.length ? snippet + '...' : snippet;
  }
}
