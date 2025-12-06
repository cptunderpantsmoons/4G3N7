import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import * as puppeteer from 'puppeteer';

export interface BrowserSession {
  id: string;
  browser: puppeteer.Browser;
  pages: Map<string, puppeteer.Page>;
  createdAt: Date;
  lastAccessedAt: Date;
  timeout: number;
}

export interface FormData {
  [key: string]: string | string[] | number | boolean;
}

export interface FormSubmissionResult {
  success: boolean;
  newUrl?: string;
  redirected: boolean;
  content?: string;
  error?: string;
}

export interface PageNavigationResult {
  url: string;
  title: string;
  content: string;
  statusCode: number;
}

/**
 * Web Automation Service
 * Manages browser sessions and page automation for complex web interactions
 */
@Injectable()
export class WebAutomationService implements OnModuleDestroy {
  private readonly logger = new Logger(WebAutomationService.name);
  private sessions: Map<string, BrowserSession> = new Map();
  private sessionTimeout: number = 30 * 60 * 1000; // 30 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Start cleanup interval to remove expired sessions
    this.startCleanupInterval();
  }

  /**
   * Create a new browser session
   */
  async createSession(sessionId: string): Promise<BrowserSession> {
    try {
      this.logger.log(`Creating new browser session: ${sessionId}`);

      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });

      const session: BrowserSession = {
        id: sessionId,
        browser,
        pages: new Map(),
        createdAt: new Date(),
        lastAccessedAt: new Date(),
        timeout: this.sessionTimeout,
      };

      this.sessions.set(sessionId, session);
      this.logger.log(`Browser session created: ${sessionId}`);

      return session;
    } catch (error) {
      this.logger.error(`Failed to create browser session: ${sessionId}`, error);
      throw error;
    }
  }

  /**
   * Get existing session or create new one
   */
  async getOrCreateSession(sessionId: string): Promise<BrowserSession> {
    let session = this.sessions.get(sessionId);

    if (!session) {
      session = await this.createSession(sessionId);
    } else {
      session.lastAccessedAt = new Date();
    }

    return session;
  }

  /**
   * Close a session
   */
  async closeSession(sessionId: string): Promise<void> {
    try {
      const session = this.sessions.get(sessionId);
      if (!session) {
        this.logger.warn(`Session not found: ${sessionId}`);
        return;
      }

      // Close all pages
      for (const [pageId, page] of session.pages.entries()) {
        try {
          await page.close();
        } catch (error) {
          this.logger.warn(`Failed to close page ${pageId}`, error);
        }
      }

      // Close browser
      await session.browser.close();
      this.sessions.delete(sessionId);

      this.logger.log(`Session closed: ${sessionId}`);
    } catch (error) {
      this.logger.error(`Error closing session: ${sessionId}`, error);
    }
  }

  /**
   * Navigate to a URL
   */
  async navigateTo(
    sessionId: string,
    pageId: string,
    url: string
  ): Promise<PageNavigationResult> {
    try {
      const session = await this.getOrCreateSession(sessionId);
      let page = session.pages.get(pageId);

      if (!page) {
        page = await session.browser.newPage();
        session.pages.set(pageId, page);
      }

      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      const title = await page.title();
      const content = await page.content();

      return {
        url: page.url(),
        title,
        content,
        statusCode: response?.status() || 0,
      };
    } catch (error) {
      this.logger.error(`Error navigating to ${url}`, error);
      throw error;
    }
  }

  /**
   * Fill and submit a form
   */
  async submitForm(
    sessionId: string,
    pageId: string,
    formSelector: string,
    formData: FormData,
    submitButtonSelector?: string
  ): Promise<FormSubmissionResult> {
    try {
      const session = await this.getOrCreateSession(sessionId);
      const page = session.pages.get(pageId);

      if (!page) {
        throw new Error(`Page not found: ${pageId}`);
      }

      this.logger.log(`Submitting form in page ${pageId}`, {
        formSelector,
        fields: Object.keys(formData),
      });

      // Wait for form to be visible
      await page.waitForSelector(formSelector, { timeout: 5000 });

      // Fill form fields
      for (const [name, value] of Object.entries(formData)) {
        const inputSelector = `${formSelector} [name="${name}"]`;
        const element = await page.$(inputSelector);

        if (!element) {
          this.logger.warn(`Form field not found: ${name}`);
          continue;
        }

        // Clear existing value
        await page.evaluate((sel) => {
          const el = document.querySelector(sel) as HTMLInputElement;
          if (el) el.value = '';
        }, inputSelector);

        // Set new value
        if (Array.isArray(value)) {
          for (const val of value) {
            await page.type(inputSelector, String(val));
          }
        } else {
          await page.type(inputSelector, String(value));
        }
      }

      // Submit form
      const previousUrl = page.url();
      const submitSelector = submitButtonSelector || `${formSelector} [type="submit"]`;
      await page.click(submitSelector);

      // Wait for navigation
      await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {
        // Navigation might not happen
      });

      const result: FormSubmissionResult = {
        success: true,
        newUrl: page.url(),
        redirected: page.url() !== previousUrl,
        content: await page.content(),
      };

      this.logger.log(`Form submitted successfully in page ${pageId}`, result);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`Error submitting form in page ${pageId}`, error);

      return {
        success: false,
        redirected: false,
        error: errorMsg,
      };
    }
  }

  /**
   * Click an element
   */
  async click(
    sessionId: string,
    pageId: string,
    selector: string
  ): Promise<void> {
    try {
      const session = await this.getOrCreateSession(sessionId);
      const page = session.pages.get(pageId);

      if (!page) {
        throw new Error(`Page not found: ${pageId}`);
      }

      await page.waitForSelector(selector, { timeout: 5000 });
      await page.click(selector);

      this.logger.log(`Clicked element: ${selector} in page ${pageId}`);
    } catch (error) {
      this.logger.error(`Error clicking element: ${selector}`, error);
      throw error;
    }
  }

  /**
   * Type text into an element
   */
  async type(
    sessionId: string,
    pageId: string,
    selector: string,
    text: string
  ): Promise<void> {
    try {
      const session = await this.getOrCreateSession(sessionId);
      const page = session.pages.get(pageId);

      if (!page) {
        throw new Error(`Page not found: ${pageId}`);
      }

      await page.waitForSelector(selector, { timeout: 5000 });
      await page.type(selector, text);

      this.logger.log(`Typed text in element: ${selector} in page ${pageId}`);
    } catch (error) {
      this.logger.error(`Error typing in element: ${selector}`, error);
      throw error;
    }
  }

  /**
   * Wait for an element to appear
   */
  async waitForElement(
    sessionId: string,
    pageId: string,
    selector: string,
    timeout: number = 5000
  ): Promise<void> {
    try {
      const session = await this.getOrCreateSession(sessionId);
      const page = session.pages.get(pageId);

      if (!page) {
        throw new Error(`Page not found: ${pageId}`);
      }

      await page.waitForSelector(selector, { timeout });
      this.logger.log(`Element appeared: ${selector} in page ${pageId}`);
    } catch (error) {
      this.logger.error(`Error waiting for element: ${selector}`, error);
      throw error;
    }
  }

  /**
   * Execute JavaScript in page context
   */
  async executeScript(
    sessionId: string,
    pageId: string,
    script: string,
    args?: any[]
  ): Promise<any> {
    try {
      const session = await this.getOrCreateSession(sessionId);
      const page = session.pages.get(pageId);

      if (!page) {
        throw new Error(`Page not found: ${pageId}`);
      }

      const result = await page.evaluate(script, ...(args || []));
      this.logger.log(`Script executed in page ${pageId}`);
      return result;
    } catch (error) {
      this.logger.error(`Error executing script in page ${pageId}`, error);
      throw error;
    }
  }

  /**
   * Take a screenshot
   */
  async screenshot(
    sessionId: string,
    pageId: string,
    filename?: string
  ): Promise<Buffer> {
    try {
      const session = await this.getOrCreateSession(sessionId);
      const page = session.pages.get(pageId);

      if (!page) {
        throw new Error(`Page not found: ${pageId}`);
      }

      const buffer = await page.screenshot({
        path: filename,
        fullPage: true,
      });

      this.logger.log(`Screenshot taken for page ${pageId}`);
      return buffer as Buffer;
    } catch (error) {
      this.logger.error(`Error taking screenshot in page ${pageId}`, error);
      throw error;
    }
  }

  /**
   * Get page content
   */
  async getContent(sessionId: string, pageId: string): Promise<string> {
    try {
      const session = await this.getOrCreateSession(sessionId);
      const page = session.pages.get(pageId);

      if (!page) {
        throw new Error(`Page not found: ${pageId}`);
      }

      return await page.content();
    } catch (error) {
      this.logger.error(`Error getting page content for page ${pageId}`, error);
      throw error;
    }
  }

  /**
   * Set cookies for a session
   */
  async setCookies(
    sessionId: string,
    pageId: string,
    cookies: Array<{
      name: string;
      value: string;
      domain?: string;
      path?: string;
    }>
  ): Promise<void> {
    try {
      const session = await this.getOrCreateSession(sessionId);
      let page = session.pages.get(pageId);

      if (!page) {
        page = await session.browser.newPage();
        session.pages.set(pageId, page);
      }

      await page.setCookie(...(cookies as any[]));
      this.logger.log(`Set ${cookies.length} cookies for page ${pageId}`);
    } catch (error) {
      this.logger.error(`Error setting cookies for page ${pageId}`, error);
      throw error;
    }
  }

  /**
   * Get all sessions
   */
  getSessions(): BrowserSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Get session info
   */
  getSessionInfo(sessionId: string): BrowserSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Start cleanup interval
   */
  private startCleanupInterval(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();

      for (const [sessionId, session] of this.sessions.entries()) {
        const elapsedTime = now - session.lastAccessedAt.getTime();

        if (elapsedTime > session.timeout) {
          this.logger.log(`Closing expired session: ${sessionId}`);
          this.closeSession(sessionId).catch((error) => {
            this.logger.error(`Error closing expired session: ${sessionId}`, error);
          });
        }
      }
    }, 5 * 60 * 1000); // Check every 5 minutes
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy(): Promise<void> {
    // Clear cleanup interval
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }

    // Close all sessions
    const sessionIds = Array.from(this.sessions.keys());
    for (const sessionId of sessionIds) {
      await this.closeSession(sessionId);
    }

    this.logger.log('Web Automation Service destroyed');
  }
}
