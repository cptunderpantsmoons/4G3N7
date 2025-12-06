import { Injectable, Logger } from '@nestjs/common';
import * as puppeteer from 'puppeteer';
import * as cheerio from 'cheerio';
import { BaseExtension } from './base.extension';
import {
  ExtensionManifest,
  ExtensionCapability,
  GooseTask,
  GooseResult,
} from '../interfaces/types';

export interface ScrapingRequest {
  url: string;
  selectors: ScrapingSelector[];
  options?: ScrapingOptions;
}

export interface ScrapingSelector {
  name: string;
  selector: string;
  type: 'text' | 'attribute' | 'html';
  attribute?: string;
  multiple?: boolean;
}

export interface ScrapingOptions {
  timeout?: number;
  javascript?: boolean;
  headless?: boolean;
  cookies?: Record<string, string>;
  userAgent?: string;
  waitFor?: string;
  scrollAmount?: number;
}

export interface ScrapingResult {
  url: string;
  timestamp: Date;
  data: Record<string, any>[];
  metadata?: {
    title?: string;
    redirectUrl?: string;
  };
}

/**
 * Web Scraper Extension
 * Provides web scraping and HTML extraction capabilities
 */
@Injectable()
export class WebScraperExtension extends BaseExtension {
  private readonly logger = new Logger(WebScraperExtension.name);
  private browser: puppeteer.Browser | null = null;

  getManifest(): ExtensionManifest {
    return {
      id: 'web-scraper',
      name: 'Web Scraper',
      version: '1.0.0',
      description: 'Web scraping and HTML extraction extension',
      author: '4G3N7 Team',
      entryPoint: 'src/extensions/web-scraper.extension.ts',
      permissions: ['web:read', 'storage:write'],
      capabilities: [
        {
          id: 'scrape-url',
          name: 'Scrape URL',
          description: 'Scrape content from a URL with selectors',
          operations: ['scrape_url'],
          requiredPermissions: ['web:read'],
        },
        {
          id: 'extract-structured',
          name: 'Extract Structured Data',
          description: 'Extract structured data from HTML content',
          operations: ['extract_structured'],
          requiredPermissions: ['storage:write'],
        },
      ],
    };
  }

  async execute(task: GooseTask): Promise<GooseResult> {
    const startTime = Date.now();
    const { type, payload } = task;

    this.context.logger.info(`Web Scraper executing task: ${type}`, {
      taskId: task.taskId,
    });

    try {
      let result: any;

      switch (type) {
        case 'scrape_url':
          result = await this.scrapeUrl(
            payload.url,
            payload.selectors,
            payload.options
          );
          break;
        case 'extract_structured':
          result = await this.extractStructuredFromHtml(
            payload.html,
            payload.selectors
          );
          break;
        default:
          throw new Error(`Unknown task type: ${type}`);
      }

      const duration = Date.now() - startTime;
      return {
        taskId: task.taskId,
        result,
        metadata: {
          duration,
          extensionVersion: this.getManifest().version,
          completedAt: new Date(),
        },
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorObj = error instanceof Error ? error : new Error(String(error));

      this.context.logger.error(`Web Scraper task failed: ${type}`, errorObj, {
        taskId: task.taskId,
      });

      return {
        taskId: task.taskId,
        result: {},
        metadata: {
          duration,
          extensionVersion: this.getManifest().version,
          completedAt: new Date(),
        },
        error: {
          code: 'WEB_SCRAPER_ERROR',
          message: errorObj.message,
          stack: errorObj.stack,
        },
      };
    }
  }

  /**
   * Scrape a URL and extract data based on selectors
   */
  async scrapeUrl(
    url: string,
    selectors: ScrapingSelector[],
    options?: ScrapingOptions
  ): Promise<ScrapingResult> {
    try {
      this.context.logger.info(`Scraping URL: ${url}`);

      const defaultOptions: ScrapingOptions = {
        timeout: 30000,
        javascript: false,
        headless: true,
        ...options,
      };

      let html: string;
      let title: string | undefined;

      if (defaultOptions.javascript) {
        // Use Puppeteer for JavaScript rendering
        const page = await this.openPage(url, defaultOptions);
        html = await page.content();
        title = await page.title();

        if (defaultOptions.waitFor) {
          await page.waitForSelector(defaultOptions.waitFor, {
            timeout: defaultOptions.timeout,
          });
        }

        if (defaultOptions.scrollAmount) {
          await this.scrollPage(page, defaultOptions.scrollAmount);
        }

        await page.close();
      } else {
        // Use simple HTML fetch with AbortController for timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(
          () => controller.abort(),
          defaultOptions.timeout
        );

        try {
          const response = await fetch(url, {
            signal: controller.signal,
            headers: defaultOptions.userAgent
              ? { 'User-Agent': defaultOptions.userAgent }
              : {},
          });
          html = await response.text();
        } finally {
          clearTimeout(timeoutId);
        }
      }

      // Extract data from HTML
      const data = this.extractFromHtml(html, selectors);

      return {
        url,
        timestamp: new Date(),
        data,
        metadata: {
          title,
          redirectUrl: url,
        },
      };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.context.logger.error(`Error scraping URL: ${url}`, errorObj);
      throw error;
    }
  }

  /**
   * Extract structured data from HTML content
   */
  async extractStructuredFromHtml(
    html: string,
    selectors: ScrapingSelector[]
  ): Promise<ScrapingResult> {
    try {
      this.context.logger.info('Extracting structured data from HTML');

      const data = this.extractFromHtml(html, selectors);

      return {
        url: 'memory',
        timestamp: new Date(),
        data,
      };
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.context.logger.error('Error extracting structured data', errorObj);
      throw error;
    }
  }

  /**
   * Extract data from HTML using selectors
   */
  private extractFromHtml(
    html: string,
    selectors: ScrapingSelector[]
  ): Record<string, any>[] {
    const $ = cheerio.load(html);
    const results: Record<string, any>[] = [];

    // Determine if we have multiple items or single item
    const maxItems = Math.max(
      ...selectors
        .filter((s) => s.multiple)
        .map((s) => $(s.selector).length || 1)
    );

    if (maxItems > 1) {
      // Multiple items extraction
      for (let i = 0; i < maxItems; i++) {
        const item: Record<string, any> = {};
        for (const selector of selectors) {
          item[selector.name] = this.extractValue($, selector, i);
        }
        results.push(item);
      }
    } else {
      // Single item extraction
      const item: Record<string, any> = {};
      for (const selector of selectors) {
        item[selector.name] = this.extractValue($, selector, 0);
      }
      results.push(item);
    }

    return results;
  }

  /**
   * Extract a value using a selector
   */
  private extractValue(
    $: any,
    selector: ScrapingSelector,
    index: number = 0
  ): any {
    try {
      const elements = $(selector.selector);
      if (elements.length === 0) {
        return null;
      }

      const element = elements.eq(index);

      switch (selector.type) {
        case 'text':
          return element.text().trim();
        case 'attribute':
          return element.attr(selector.attribute || 'href');
        case 'html':
          return element.html();
        default:
          return element.text().trim();
      }
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.context.logger.warn(
        `Error extracting value for selector ${selector.name}`,
        errorObj
      );
      return null;
    }
  }

  /**
   * Open a page with Puppeteer
   */
  private async openPage(
    url: string,
    options: ScrapingOptions
  ): Promise<puppeteer.Page> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: options.headless !== false,
      });
    }

    const page = await this.browser.newPage();

    // Set cookies if provided
    if (options.cookies) {
      await page.setCookie(
        ...Object.entries(options.cookies).map(([name, value]) => ({
          name,
          value,
          url,
        }))
      );
    }

    // Set user agent
    if (options.userAgent) {
      await page.setUserAgent(options.userAgent);
    }

    // Navigate to URL
    await page.goto(url, {
      waitUntil: 'networkidle2',
      timeout: options.timeout || 30000,
    });

    return page;
  }

  /**
   * Scroll page to load lazy-loaded content
   */
  private async scrollPage(
    page: puppeteer.Page,
    amount: number
  ): Promise<void> {
    await page.evaluate((scrollAmount: number) => {
      window.scrollBy(0, scrollAmount);
    }, amount);

    // Wait for any new content to load
    await page.waitForTimeout(1000);
  }

  async onUnload(): Promise<void> {
    try {
      if (this.browser) {
        await this.browser.close();
        this.browser = null;
      }
      this.context.logger.info('Web Scraper Extension unloaded');
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      this.context.logger.error('Error unloading Web Scraper Extension', errorObj);
    }
  }
}
