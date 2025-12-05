/**
 * Extension Registry
 * Manages extension discovery, registration, and metadata
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  ExtensionManifest,
  ExtensionCapability,
} from '../interfaces/types';
import * as fs from 'fs/promises';
import * as path from 'path';

export interface RegistryEntry {
  manifest: ExtensionManifest;
  registered: boolean;
  installedAt: Date;
  updatedAt: Date;
  source: 'builtin' | 'marketplace' | 'custom';
  path: string;
}

@Injectable()
export class ExtensionRegistry {
  private readonly logger = new Logger(ExtensionRegistry.name);
  private registry: Map<string, RegistryEntry> = new Map();
  private capabilityIndex: Map<string, Set<string>> = new Map(); // capability -> extension IDs

  /**
   * Initialize the registry
   */
  async initialize(extensionPaths: string[]): Promise<void> {
    this.logger.log('Initializing extension registry...');
    
    for (const extensionPath of extensionPaths) {
      await this.scanDirectory(extensionPath);
    }
    
    this.logger.log(`Extension registry initialized with ${this.registry.size} extensions`);
  }

  /**
   * Scan a directory for extensions
   */
  private async scanDirectory(directory: string): Promise<void> {
    try {
      const files = await fs.readdir(directory, { withFileTypes: true });
      
      for (const file of files) {
        if (file.isDirectory()) {
          const manifestPath = path.join(directory, file.name, 'manifest.json');
          
          try {
            await this.registerExtensionFromPath(manifestPath);
          } catch (error) {
            this.logger.warn(`Failed to register extension from ${manifestPath}`, error);
          }
        }
      }
    } catch (error) {
      this.logger.error(`Failed to scan directory: ${directory}`, error);
    }
  }

  /**
   * Register an extension from manifest path
   */
  private async registerExtensionFromPath(manifestPath: string): Promise<void> {
    const content = await fs.readFile(manifestPath, 'utf-8');
    const manifest: ExtensionManifest = JSON.parse(content);
    
    await this.registerExtension(manifest, path.dirname(manifestPath), 'custom');
  }

  /**
   * Register an extension
   */
  async registerExtension(
    manifest: ExtensionManifest,
    extensionPath: string,
    source: 'builtin' | 'marketplace' | 'custom' = 'custom'
  ): Promise<void> {
    // Validate manifest
    this.validateManifest(manifest);
    
    // Check if already registered
    const existing = this.registry.get(manifest.id);
    
    if (existing) {
      this.logger.warn(`Extension already registered: ${manifest.id}, updating...`);
    }
    
    // Register extension
    const entry: RegistryEntry = {
      manifest,
      registered: true,
      installedAt: existing?.installedAt || new Date(),
      updatedAt: new Date(),
      source,
      path: extensionPath,
    };
    
    this.registry.set(manifest.id, entry);
    
    // Index capabilities
    this.indexCapabilities(manifest);
    
    this.logger.log(`Extension registered: ${manifest.name} (${manifest.id}) v${manifest.version}`);
  }

  /**
   * Unregister an extension
   */
  async unregisterExtension(extensionId: string): Promise<void> {
    const entry = this.registry.get(extensionId);
    
    if (!entry) {
      throw new Error(`Extension not found: ${extensionId}`);
    }
    
    // Remove from capability index
    this.removeFromCapabilityIndex(entry.manifest);
    
    // Remove from registry
    this.registry.delete(extensionId);
    
    this.logger.log(`Extension unregistered: ${entry.manifest.name}`);
  }

  /**
   * Get extension by ID
   */
  getExtension(extensionId: string): RegistryEntry | undefined {
    return this.registry.get(extensionId);
  }

  /**
   * Get all extensions
   */
  getAllExtensions(): RegistryEntry[] {
    return Array.from(this.registry.values());
  }

  /**
   * Get extensions by capability
   */
  getExtensionsByCapability(capability: string): RegistryEntry[] {
    const extensionIds = this.capabilityIndex.get(capability) || new Set();
    return Array.from(extensionIds)
      .map(id => this.registry.get(id))
      .filter((entry): entry is RegistryEntry => entry !== undefined);
  }

  /**
   * Search extensions
   */
  searchExtensions(query: string): RegistryEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllExtensions().filter(entry => {
      const manifest = entry.manifest;
      return (
        manifest.name.toLowerCase().includes(lowerQuery) ||
        manifest.description.toLowerCase().includes(lowerQuery) ||
        manifest.id.toLowerCase().includes(lowerQuery) ||
        manifest.capabilities.some(cap => 
          cap.name.toLowerCase().includes(lowerQuery) ||
          cap.description.toLowerCase().includes(lowerQuery)
        )
      );
    });
  }

  /**
   * Get extension count
   */
  getExtensionCount(): number {
    return this.registry.size;
  }

  /**
   * Check if extension exists
   */
  hasExtension(extensionId: string): boolean {
    return this.registry.has(extensionId);
  }

  /**
   * Validate extension manifest
   */
  private validateManifest(manifest: ExtensionManifest): void {
    if (!manifest.id || !manifest.name || !manifest.version) {
      throw new Error('Invalid manifest: missing required fields (id, name, version)');
    }
    
    // Validate version format (semver)
    const semverRegex = /^\d+\.\d+\.\d+$/;
    if (!semverRegex.test(manifest.version)) {
      throw new Error(`Invalid version format: ${manifest.version}`);
    }
    
    // Validate capabilities
    if (!Array.isArray(manifest.capabilities) || manifest.capabilities.length === 0) {
      throw new Error('Extension must have at least one capability');
    }
    
    for (const capability of manifest.capabilities) {
      if (!capability.id || !capability.name || !capability.operations) {
        throw new Error('Invalid capability: missing required fields');
      }
    }
  }

  /**
   * Index capabilities for fast lookup
   */
  private indexCapabilities(manifest: ExtensionManifest): void {
    for (const capability of manifest.capabilities) {
      // Index by capability ID
      if (!this.capabilityIndex.has(capability.id)) {
        this.capabilityIndex.set(capability.id, new Set());
      }
      this.capabilityIndex.get(capability.id)!.add(manifest.id);
      
      // Index by operations
      for (const operation of capability.operations) {
        if (!this.capabilityIndex.has(operation)) {
          this.capabilityIndex.set(operation, new Set());
        }
        this.capabilityIndex.get(operation)!.add(manifest.id);
      }
    }
  }

  /**
   * Remove extension from capability index
   */
  private removeFromCapabilityIndex(manifest: ExtensionManifest): void {
    for (const capability of manifest.capabilities) {
      // Remove from capability ID index
      const capSet = this.capabilityIndex.get(capability.id);
      if (capSet) {
        capSet.delete(manifest.id);
        if (capSet.size === 0) {
          this.capabilityIndex.delete(capability.id);
        }
      }
      
      // Remove from operations index
      for (const operation of capability.operations) {
        const opSet = this.capabilityIndex.get(operation);
        if (opSet) {
          opSet.delete(manifest.id);
          if (opSet.size === 0) {
            this.capabilityIndex.delete(operation);
          }
        }
      }
    }
  }

  /**
   * Get all capabilities
   */
  getAllCapabilities(): string[] {
    return Array.from(this.capabilityIndex.keys());
  }

  /**
   * Export registry as JSON
   */
  exportRegistry(): Record<string, any> {
    const entries: any[] = [];
    
    for (const entry of this.registry.values()) {
      entries.push({
        ...entry,
        installedAt: entry.installedAt.toISOString(),
        updatedAt: entry.updatedAt.toISOString(),
      });
    }
    
    return {
      extensions: entries,
      totalCount: entries.length,
      capabilities: this.getAllCapabilities(),
    };
  }
}
