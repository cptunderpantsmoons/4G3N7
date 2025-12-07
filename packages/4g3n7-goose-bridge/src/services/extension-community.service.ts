/**
 * Phase 6.2 - Extension Community Service
 * Community features, reviews, documentation, and support
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  ExtensionReview,
  ExtensionIssue,
  ExtensionDocumentation,
  ExtensionRelease,
} from '../interfaces/ui-extension-management.interface';

@Injectable()
export class ExtensionCommunityService {
  private readonly logger = new Logger(ExtensionCommunityService.name);

  private reviews = new Map<string, ExtensionReview[]>();
  private issues = new Map<string, ExtensionIssue[]>();
  private documentation = new Map<string, ExtensionDocumentation[]>();
  private releases = new Map<string, ExtensionRelease[]>();

  async getExtensionReviews(extensionId: string): Promise<ExtensionReview[]> {
    this.logger.debug(`Getting reviews for extension: ${extensionId}`);

    let revs = this.reviews.get(extensionId);
    if (!revs) {
      revs = [
        {
          reviewId: 'rev_1',
          extensionId,
          userId: 'user_1',
          userName: 'John Developer',
          rating: 5,
          title: 'Excellent extension!',
          text: 'This extension works perfectly and saves me a lot of time.',
          helpful: 42,
          unhelpful: 2,
          createdAt: new Date(),
        },
      ];
      this.reviews.set(extensionId, revs);
    }

    return revs;
  }

  async submitExtensionReview(extensionId: string, review: ExtensionReview): Promise<void> {
    this.logger.log(`Submitted review for extension: ${extensionId}`);

    if (!this.reviews.has(extensionId)) {
      this.reviews.set(extensionId, []);
    }

    review.createdAt = new Date();
    this.reviews.get(extensionId)!.push(review);
  }

  async getExtensionIssues(extensionId: string): Promise<ExtensionIssue[]> {
    this.logger.debug(`Getting issues for extension: ${extensionId}`);

    let issues = this.issues.get(extensionId);
    if (!issues) {
      issues = [];
      this.issues.set(extensionId, issues);
    }

    return issues;
  }

  async reportExtensionIssue(extensionId: string, issue: ExtensionIssue): Promise<void> {
    this.logger.log(`Reported issue for extension: ${extensionId} - ${issue.title}`);

    if (!this.issues.has(extensionId)) {
      this.issues.set(extensionId, []);
    }

    issue.createdAt = new Date();
    this.issues.get(extensionId)!.push(issue);
  }

  async getExtensionDocumentation(extensionId: string): Promise<ExtensionDocumentation[]> {
    this.logger.debug(`Getting documentation for extension: ${extensionId}`);

    let docs = this.documentation.get(extensionId);
    if (!docs) {
      docs = [
        {
          docId: 'doc_readme',
          extensionId,
          title: 'README',
          content: '# Extension Documentation\n\nWelcome to the extension docs.',
          type: 'readme',
          language: 'en',
          lastUpdated: new Date(),
          version: '1.0.0',
        },
        {
          docId: 'doc_guide',
          extensionId,
          title: 'Getting Started Guide',
          content: '# Getting Started\n\nFollow these steps to get started...',
          type: 'guide',
          language: 'en',
          lastUpdated: new Date(),
          version: '1.0.0',
        },
      ];
      this.documentation.set(extensionId, docs);
    }

    return docs;
  }

  async listExtensionReleases(extensionId: string, limit: number = 10): Promise<ExtensionRelease[]> {
    this.logger.debug(`Listing releases for extension: ${extensionId}`);

    let rels = this.releases.get(extensionId);
    if (!rels) {
      rels = [
        {
          releaseId: 'rel_1',
          extensionId,
          version: '1.0.0',
          releaseDate: new Date(),
          prerelease: false,
          changelog: '- Initial release\n- Feature 1\n- Feature 2',
          downloadUrl: `https://marketplace.example.com/${extensionId}/1.0.0`,
          size: 1048576,
          downloads: 1000,
        },
      ];
      this.releases.set(extensionId, rels);
    }

    return rels.slice(-limit);
  }

  async getLatestRelease(extensionId: string): Promise<ExtensionRelease | null> {
    const releases = await this.listExtensionReleases(extensionId, 1);
    return releases.length > 0 ? releases[0] : null;
  }

  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down Extension Community Service');
    this.reviews.clear();
    this.issues.clear();
    this.documentation.clear();
    this.releases.clear();
  }
}
