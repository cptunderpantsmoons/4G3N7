import { Injectable, Logger } from '@nestjs/common';

export interface StorageDocument {
  id: string;
  collectionName: string;
  data: Record<string, any>;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  metadata?: Record<string, any>;
}

export interface StorageQuery {
  collection: string;
  filter?: Record<string, any>;
  sort?: Record<string, 1 | -1>;
  limit?: number;
  skip?: number;
  projection?: Record<string, 1 | 0>;
}

export interface QueryResult {
  total: number;
  count: number;
  data: StorageDocument[];
  hasMore: boolean;
}

export interface StorageBackendConfig {
  type: 'postgresql' | 'mongodb' | 'memory';
  host?: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
}

/**
 * Data Storage Service
 * Provides multi-backend data persistence (PostgreSQL, MongoDB, Memory)
 */
@Injectable()
export class DataStorageService {
  private readonly logger = new Logger(DataStorageService.name);
  private backendType: string;
  private memoryStore: Map<string, Map<string, StorageDocument>> = new Map();
  private documentVersions: Map<string, StorageDocument[]> = new Map();

  constructor(config: StorageBackendConfig) {
    this.backendType = config.type;
    this.logger.log(`Initialized Data Storage Service with ${config.type} backend`);
  }

  /**
   * Store a document
   */
  async store(
    collection: string,
    data: Record<string, any>,
    userId?: string
  ): Promise<{ id: string; version: number }> {
    try {
      const id = this.generateId();
      const now = new Date();

      const document: StorageDocument = {
        id,
        collectionName: collection,
        data,
        version: 1,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
      };

      switch (this.backendType) {
        case 'memory':
          return this.storeMemory(document);
        case 'postgresql':
          return await this.storePostgres(document);
        case 'mongodb':
          return await this.storeMongo(document);
        default:
          throw new Error(`Unsupported backend: ${this.backendType}`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error storing document: ${msg}`, error);
      throw error;
    }
  }

  /**
   * Retrieve a document
   */
  async retrieve(id: string, collection?: string): Promise<StorageDocument | null> {
    try {
      switch (this.backendType) {
        case 'memory':
          return this.retrieveMemory(id, collection);
        case 'postgresql':
          return await this.retrievePostgres(id, collection);
        case 'mongodb':
          return await this.retrieveMongo(id, collection);
        default:
          throw new Error(`Unsupported backend: ${this.backendType}`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error retrieving document: ${msg}`, error);
      return null;
    }
  }

  /**
   * Update a document
   */
  async update(
    id: string,
    changes: Record<string, any>,
    userId?: string
  ): Promise<{ version: number }> {
    try {
      const document = await this.retrieve(id);
      if (!document) {
        throw new Error(`Document not found: ${id}`);
      }

      const updated: StorageDocument = {
        ...document,
        data: { ...document.data, ...changes },
        version: document.version + 1,
        updatedAt: new Date(),
      };

      switch (this.backendType) {
        case 'memory':
          return this.updateMemory(updated);
        case 'postgresql':
          return await this.updatePostgres(updated);
        case 'mongodb':
          return await this.updateMongo(updated);
        default:
          throw new Error(`Unsupported backend: ${this.backendType}`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error updating document: ${msg}`, error);
      throw error;
    }
  }

  /**
   * Delete a document
   */
  async delete(id: string): Promise<void> {
    try {
      switch (this.backendType) {
        case 'memory':
          this.deleteMemory(id);
          break;
        case 'postgresql':
          await this.deletePostgres(id);
          break;
        case 'mongodb':
          await this.deleteMongo(id);
          break;
        default:
          throw new Error(`Unsupported backend: ${this.backendType}`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error deleting document: ${msg}`, error);
      throw error;
    }
  }

  /**
   * Query documents
   */
  async query(queryRequest: StorageQuery): Promise<QueryResult> {
    try {
      switch (this.backendType) {
        case 'memory':
          return this.queryMemory(queryRequest);
        case 'postgresql':
          return await this.queryPostgres(queryRequest);
        case 'mongodb':
          return await this.queryMongo(queryRequest);
        default:
          throw new Error(`Unsupported backend: ${this.backendType}`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error querying documents: ${msg}`, error);
      throw error;
    }
  }

  /**
   * Get document version history
   */
  async getVersionHistory(id: string): Promise<StorageDocument[]> {
    try {
      const versions = this.documentVersions.get(id) || [];
      return versions;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error getting version history: ${msg}`, error);
      return [];
    }
  }

  /**
   * Restore document to previous version
   */
  async restoreVersion(id: string, version: number): Promise<void> {
    try {
      const versions = this.documentVersions.get(id) || [];
      const targetVersion = versions.find((v) => v.version === version);

      if (!targetVersion) {
        throw new Error(`Version not found: ${version}`);
      }

      const updated: StorageDocument = {
        ...targetVersion,
        version: version + 1,
        updatedAt: new Date(),
      };

      await this.update(id, updated.data);

      this.logger.log(`Restored document ${id} to version ${version}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error restoring version: ${msg}`, error);
      throw error;
    }
  }

  /**
   * Export collection
   */
  async exportCollection(
    collection: string,
    format: 'json' | 'csv' | 'xml' = 'json'
  ): Promise<string> {
    try {
      const result = await this.query({
        collection,
        limit: 1000000,
      });

      switch (format) {
        case 'json':
          return JSON.stringify(result.data, null, 2);
        case 'csv':
          return this.convertToCsv(result.data);
        case 'xml':
          return this.convertToXml(result.data);
        default:
          throw new Error(`Unsupported format: ${format}`);
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error exporting collection: ${msg}`, error);
      throw error;
    }
  }

  /**
   * Import collection
   */
  async importCollection(
    collection: string,
    data: string,
    format: 'json' | 'csv' = 'json',
    userId?: string
  ): Promise<{ imported: number }> {
    try {
      let documents: Record<string, any>[];

      switch (format) {
        case 'json':
          documents = JSON.parse(data);
          break;
        case 'csv':
          documents = this.parseCsv(data);
          break;
        default:
          throw new Error(`Unsupported format: ${format}`);
      }

      let imported = 0;
      for (const doc of documents) {
        await this.store(collection, doc, userId);
        imported++;
      }

      this.logger.log(`Imported ${imported} documents to ${collection}`);
      return { imported };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error importing collection: ${msg}`, error);
      throw error;
    }
  }

  /**
   * Memory backend methods
   */
  private storeMemory(document: StorageDocument): { id: string; version: number } {
    const collection =
      this.memoryStore.get(document.collectionName) || new Map();
    collection.set(document.id, document);
    this.memoryStore.set(document.collectionName, collection);

    // Store version
    const versions = this.documentVersions.get(document.id) || [];
    versions.push({ ...document });
    this.documentVersions.set(document.id, versions);

    return { id: document.id, version: document.version };
  }

  private retrieveMemory(id: string, collection?: string): StorageDocument | null {
    if (collection) {
      const col = this.memoryStore.get(collection);
      return col?.get(id) || null;
    }

    // Search all collections
    for (const col of this.memoryStore.values()) {
      const doc = col.get(id);
      if (doc) return doc;
    }

    return null;
  }

  private updateMemory(document: StorageDocument): { version: number } {
    const collection =
      this.memoryStore.get(document.collectionName) || new Map();
    collection.set(document.id, document);
    this.memoryStore.set(document.collectionName, collection);

    // Store version
    const versions = this.documentVersions.get(document.id) || [];
    versions.push({ ...document });
    this.documentVersions.set(document.id, versions);

    return { version: document.version };
  }

  private deleteMemory(id: string): void {
    for (const col of this.memoryStore.values()) {
      col.delete(id);
    }
  }

  private queryMemory(queryRequest: StorageQuery): QueryResult {
    const collection = this.memoryStore.get(queryRequest.collection);
    if (!collection) {
      return { total: 0, count: 0, data: [], hasMore: false };
    }

    let results = Array.from(collection.values());

    // Apply filter
    if (queryRequest.filter) {
      results = results.filter((doc) =>
        this.matchesFilter(doc.data, queryRequest.filter || {})
      );
    }

    const total = results.length;

    // Apply sort
    if (queryRequest.sort) {
      results.sort((a, b) => {
        for (const [field, direction] of Object.entries(queryRequest.sort || {})) {
          const aVal = this.getNestedValue(a.data, field);
          const bVal = this.getNestedValue(b.data, field);

          if (aVal < bVal) return direction === 1 ? -1 : 1;
          if (aVal > bVal) return direction === 1 ? 1 : -1;
        }
        return 0;
      });
    }

    // Apply pagination
    const skip = queryRequest.skip || 0;
    const limit = queryRequest.limit || 10;
    const paginated = results.slice(skip, skip + limit);

    return {
      total,
      count: paginated.length,
      data: paginated,
      hasMore: skip + limit < total,
    };
  }

  /**
   * PostgreSQL backend (stub - real implementation would use pg library)
   */
  private async storePostgres(document: StorageDocument): Promise<{ id: string; version: number }> {
    // Real implementation would insert into PostgreSQL
    this.logger.warn('PostgreSQL backend not fully implemented, using memory fallback');
    return this.storeMemory(document);
  }

  private async retrievePostgres(id: string, collection?: string): Promise<StorageDocument | null> {
    // Real implementation would query PostgreSQL
    return this.retrieveMemory(id, collection);
  }

  private async updatePostgres(document: StorageDocument): Promise<{ version: number }> {
    // Real implementation would update in PostgreSQL
    return this.updateMemory(document);
  }

  private async deletePostgres(id: string): Promise<void> {
    // Real implementation would delete from PostgreSQL
    this.deleteMemory(id);
  }

  private async queryPostgres(queryRequest: StorageQuery): Promise<QueryResult> {
    // Real implementation would query PostgreSQL
    return this.queryMemory(queryRequest);
  }

  /**
   * MongoDB backend (stub)
   */
  private async storeMongo(document: StorageDocument): Promise<{ id: string; version: number }> {
    // Real implementation would use MongoDB driver
    this.logger.warn('MongoDB backend not fully implemented, using memory fallback');
    return this.storeMemory(document);
  }

  private async retrieveMongo(id: string, collection?: string): Promise<StorageDocument | null> {
    return this.retrieveMemory(id, collection);
  }

  private async updateMongo(document: StorageDocument): Promise<{ version: number }> {
    return this.updateMemory(document);
  }

  private async deleteMongo(id: string): Promise<void> {
    this.deleteMemory(id);
  }

  private async queryMongo(queryRequest: StorageQuery): Promise<QueryResult> {
    return this.queryMemory(queryRequest);
  }

  /**
   * Helper methods
   */
  private generateId(): string {
    return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private matchesFilter(data: Record<string, any>, filter: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(filter)) {
      const dataValue = this.getNestedValue(data, key);
      if (dataValue !== value) return false;
    }
    return true;
  }

  private getNestedValue(obj: any, path: string): any {
    const parts = path.split('.');
    let value = obj;
    for (const part of parts) {
      value = value?.[part];
    }
    return value;
  }

  private convertToCsv(documents: StorageDocument[]): string {
    if (documents.length === 0) return '';

    const headers = Object.keys(documents[0].data);
    const csv = [headers.join(',')];

    for (const doc of documents) {
      const row = headers.map((h) => {
        const val = doc.data[h];
        return typeof val === 'string' ? `"${val}"` : String(val);
      });
      csv.push(row.join(','));
    }

    return csv.join('\n');
  }

  private convertToXml(documents: StorageDocument[]): string {
    let xml = '<?xml version="1.0"?>\n<documents>\n';

    for (const doc of documents) {
      xml += `  <document id="${doc.id}">\n`;
      for (const [key, value] of Object.entries(doc.data)) {
        xml += `    <${key}>${this.escapeXml(String(value))}</${key}>\n`;
      }
      xml += '  </document>\n';
    }

    xml += '</documents>';
    return xml;
  }

  private escapeXml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private parseCsv(data: string): Record<string, any>[] {
    const lines = data.split('\n');
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map((h) => h.trim());
    const documents: Record<string, any>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const doc: Record<string, any> = {};

      for (let j = 0; j < headers.length; j++) {
        doc[headers[j]] = values[j];
      }

      documents.push(doc);
    }

    return documents;
  }
}
