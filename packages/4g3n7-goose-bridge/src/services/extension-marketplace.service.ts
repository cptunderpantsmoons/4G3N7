/**
 * Phase 6.2 - Extension Marketplace Service
 * Marketplace browsing and extension installation
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  Extension,
  MarketplaceExtension,
  ExtensionVersion,
  InstalledExtension,
  ExtensionType,
} from '../interfaces/ui-extension-management.interface';

@Injectable()
export class ExtensionMarketplaceService {
  private readonly logger = new Logger(ExtensionMarketplaceService.name);

  private extensions = new Map<string, Extension>();
  private marketplace = new Map<string, MarketplaceExtension>();
  private installed = new Map<string, InstalledExtension>();
  private versions = new Map<string, ExtensionVersion[]>();

  constructor() {
    this.initializeMarketplace();
  }

  async searchMarketplace(query: string, filters?: Record<string, any>): Promise<MarketplaceExtension[]> {
    this.logger.log(`Searching marketplace: ${query}`);

    let results = Array.from(this.marketplace.values());

    if (query) {
      results = results.filter(m => 
        m.extension.name.toLowerCase().includes(query.toLowerCase()) ||
        m.extension.description.toLowerCase().includes(query.toLowerCase()) ||
        m.extension.keywords.some(k => k.toLowerCase().includes(query.toLowerCase()))
      );
    }

    if (filters?.type) {
      results = results.filter(m => m.extension.type === filters.type);
    }

    return results.sort((a, b) => b.extension.downloads - a.extension.downloads);
  }

  async getMarketplaceExtension(extensionId: string): Promise<MarketplaceExtension> {
    const ext = this.marketplace.get(extensionId);
    if (!ext) {
      throw new Error(`Extension not found: ${extensionId}`);
    }
    return ext;
  }

  async getFeaturedExtensions(limit: number = 10): Promise<MarketplaceExtension[]> {
    return Array.from(this.marketplace.values())
      .filter(m => m.featured)
      .slice(0, limit);
  }

  async getTrendingExtensions(limit: number = 10): Promise<MarketplaceExtension[]> {
    return Array.from(this.marketplace.values())
      .filter(m => m.trending)
      .sort((a, b) => b.extension.downloads - a.extension.downloads)
      .slice(0, limit);
  }

  async getRecommendedExtensions(limit: number = 10): Promise<MarketplaceExtension[]> {
    return Array.from(this.marketplace.values())
      .filter(m => m.extension.rating >= 4.0)
      .sort((a, b) => b.extension.rating - a.extension.rating)
      .slice(0, limit);
  }

  async installExtension(extensionId: string, version?: string): Promise<InstalledExtension> {
    const marketplace = this.marketplace.get(extensionId);
    if (!marketplace) {
      throw new Error(`Extension not found: ${extensionId}`);
    }

    const ext = marketplace.extension;
    this.logger.log(`Installing extension: ${ext.name}`);

    const installedId = `installed_${Date.now()}`;
    const installed: InstalledExtension = {
      installedId,
      extensionId,
      name: ext.name,
      version: version || ext.version,
      type: ext.type,
      status: 'installed' as any,
      installPath: `/extensions/${extensionId}`,
      installDate: new Date(),
      lastUpdated: new Date(),
      autoUpdate: true,
      enabled: true,
      dataFolder: `/data/${extensionId}`,
    };

    this.installed.set(installedId, installed);
    ext.downloads++;
    return installed;
  }

  async uninstallExtension(extensionId: string): Promise<void> {
    const toDelete: string[] = [];
    for (const [id, inst] of this.installed) {
      if (inst.extensionId === extensionId) {
        toDelete.push(id);
      }
    }
    toDelete.forEach(id => this.installed.delete(id));
    this.logger.log(`Uninstalled extension: ${extensionId}`);
  }

  async updateExtension(extensionId: string): Promise<InstalledExtension> {
    let installed: InstalledExtension | undefined;
    for (const inst of this.installed.values()) {
      if (inst.extensionId === extensionId) {
        installed = inst;
        break;
      }
    }

    if (!installed) {
      throw new Error(`Extension not installed: ${extensionId}`);
    }

    installed.lastUpdated = new Date();
    this.logger.log(`Updated extension: ${extensionId}`);
    return installed;
  }

  async listInstalledExtensions(): Promise<InstalledExtension[]> {
    return Array.from(this.installed.values());
  }

  async getInstalledExtension(extensionId: string): Promise<InstalledExtension> {
    for (const inst of this.installed.values()) {
      if (inst.extensionId === extensionId) {
        return inst;
      }
    }
    throw new Error(`Extension not installed: ${extensionId}`);
  }

  private initializeMarketplace(): void {
    const sampleExtensions: MarketplaceExtension[] = [
      {
        extensionId: 'ext_automation',
        extension: {
          extensionId: 'ext_automation',
          name: 'Advanced Automation',
          displayName: 'Advanced Automation',
          version: '1.0.0',
          description: 'Advanced task automation',
          type: ExtensionType.AUTOMATION,
          author: 'Goose Team',
          license: 'MIT' as any,
          status: 'available' as any,
          tags: ['automation', 'productivity'],
          keywords: ['automate', 'tasks', 'workflows'],
          rating: 4.8,
          downloads: 5000,
          reviews: 250,
          createdAt: new Date(),
          updatedAt: new Date(),
          deprecated: false,
        },
        featured: true,
        trending: true,
        verified: true,
        officialProvider: true,
        trustScore: 95,
        securityScanStatus: 'passed',
      },
    ];

    for (const ext of sampleExtensions) {
      this.marketplace.set(ext.extensionId, ext);
    }
  }

  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down Extension Marketplace Service');
    this.extensions.clear();
    this.marketplace.clear();
    this.installed.clear();
    this.versions.clear();
  }
}
