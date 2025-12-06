/**
 * Phase 5.2 - Change Detector Service
 * 
 * Detects visual changes between images for monitoring and troubleshooting.
 * Tracks differences in regions, elements, and visual appearance.
 */

import { Injectable, Logger } from '@nestjs/common';
import {
  ChangeDetectionResult,
  PixelDifference,
  RegionChange,
  VisualChangeMonitor,
  VisualElement,
} from '../interfaces/computer-vision.interface';
import * as crypto from 'crypto';

@Injectable()
export class ChangeDetectorService {
  private readonly logger = new Logger(ChangeDetectorService.name);

  // Store change detection results
  private changeResults = new Map<string, ChangeDetectionResult>();
  // Monitor instances
  private monitors = new Map<string, VisualChangeMonitor>();
  // Track baseline images for monitors
  private baselines = new Map<string, Buffer>();

  constructor() {
    this.startMonitoringScheduler();
  }

  /**
   * Detect visual changes between two images
   */
  async detectChanges(baselineBuffer: Buffer, currentBuffer: Buffer): Promise<ChangeDetectionResult> {
    const baselineId = this.generateImageId(baselineBuffer);
    const currentId = this.generateImageId(currentBuffer);
    const resultId = `${baselineId}_${currentId}`;

    try {
      this.logger.log(`Detecting changes between images: ${baselineId} -> ${currentId}`);

      const pixelDifferences = this.comparePixels(baselineBuffer, currentBuffer);
      const overallDifference = this.calculateOverallDifference(pixelDifferences);
      const changeDetected = overallDifference > 0.01; // 1% threshold
      const regionChanges = this.identifyRegionChanges(pixelDifferences);
      const elementChanges: Array<{ elementId: string; oldState?: VisualElement; newState?: VisualElement; changeType: 'added' | 'removed' | 'modified' }> = []; // TODO: Extract from vision detection
      const significantAreas = this.findSignificantAreas(regionChanges);

      const result: ChangeDetectionResult = {
        baselineImageId: baselineId,
        currentImageId: currentId,
        timestamp: new Date(),
        changeDetected,
        overallDifference,
        pixelChanges: pixelDifferences,
        regionChanges,
        elementChanges,
        significantAreas,
      };

      this.changeResults.set(resultId, result);

      if (changeDetected) {
        this.logger.warn(`Significant changes detected: ${(overallDifference * 100).toFixed(2)}% difference`);
      }

      return result;
    } catch (error) {
      this.logger.error(`Error detecting changes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Start monitoring for visual changes
   */
  async startChangeMonitoring(monitorId: string, baseline: Buffer): Promise<VisualChangeMonitor> {
    this.logger.log(`Starting change monitor: ${monitorId}`);

    const monitor: VisualChangeMonitor = {
      monitorId,
      baselineImage: this.generateImageId(baseline),
      sensitivity: 'medium',
      checkInterval: 5000,
      isActive: true,
      history: [],
    };

    this.baselines.set(monitorId, baseline);
    this.monitors.set(monitorId, monitor);

    return monitor;
  }

  /**
   * Check for changes since baseline
   */
  async checkForChanges(monitorId: string, currentImage: Buffer): Promise<ChangeDetectionResult> {
    const monitor = this.monitors.get(monitorId);
    if (!monitor) {
      throw new Error(`Monitor not found: ${monitorId}`);
    }

    const baseline = this.baselines.get(monitorId);
    if (!baseline) {
      throw new Error(`Baseline not found for monitor: ${monitorId}`);
    }

    try {
      const result = await this.detectChanges(baseline, currentImage);

      monitor.lastCheckTime = new Date();
      monitor.history.push(result);

      // Keep only last 100 checks
      if (monitor.history.length > 100) {
        monitor.history.shift();
      }

      return result;
    } catch (error) {
      this.logger.error(`Error checking for changes: ${error.message}`);
      throw error;
    }
  }

  /**
   * Stop monitoring for changes
   */
  async stopChangeMonitoring(monitorId: string): Promise<void> {
    const monitor = this.monitors.get(monitorId);
    if (monitor) {
      monitor.isActive = false;
      this.logger.log(`Stopped change monitor: ${monitorId}`);
    }
  }

  /**
   * Generate unique image ID from buffer hash
   */
  private generateImageId(imageBuffer: Buffer): string {
    return `img_${crypto.createHash('sha256').update(imageBuffer).digest('hex').substring(0, 16)}`;
  }

  /**
   * Compare pixel values between two images
   */
  private comparePixels(image1: Buffer, image2: Buffer): PixelDifference[] {
    this.logger.debug('Comparing pixel values between images');

    // TODO: Implement actual pixel comparison
    // - Load both images
    // - Compare pixel by pixel
    // - Calculate color distance (Euclidean)
    // - Return differences above threshold

    const differences: PixelDifference[] = [];

    // TODO: Actual implementation with image library
    // Example difference:
    // {
    //   x: 100,
    //   y: 200,
    //   oldColor: { r: 255, g: 0, b: 0 },
    //   newColor: { r: 0, g: 255, b: 0 },
    //   euclideanDistance: 360.6
    // }

    return differences;
  }

  /**
   * Calculate overall difference percentage
   */
  private calculateOverallDifference(differences: PixelDifference[]): number {
    if (differences.length === 0) return 0;

    // Assume ~2 million pixels (1920x1080)
    // Normalize to percentage
    const totalPixels = 2073600;
    return Math.min(differences.length / totalPixels, 1.0);
  }

  /**
   * Identify regions with changes
   */
  private identifyRegionChanges(differences: PixelDifference[]): RegionChange[] {
    this.logger.debug(`Identifying regions with ${differences.length} pixel changes`);

    // TODO: Implement region clustering
    // - Group nearby pixel differences
    // - Create bounding boxes for changed regions
    // - Classify change type (added/removed/modified/moved/resized)
    // - Calculate confidence and percentage

    const regions: RegionChange[] = [];

    return regions;
  }

  /**
   * Find areas with significant changes
   */
  private findSignificantAreas(regionChanges: RegionChange[]): any[] {
    this.logger.debug(`Finding significant change areas from ${regionChanges.length} regions`);

    // TODO: Filter regions by significance
    // - Sort by percentage changed
    // - Filter out minor noise
    // - Return top N significant areas

    return regionChanges
      .filter(r => r.percentageChanged > 5) // More than 5% change
      .sort((a, b) => b.percentageChanged - a.percentageChanged)
      .slice(0, 10); // Top 10
  }

  /**
   * Get change detection result
   */
  getChangeResult(baselineId: string, currentId: string): ChangeDetectionResult | undefined {
    return this.changeResults.get(`${baselineId}_${currentId}`);
  }

  /**
   * Get monitor
   */
  getMonitor(monitorId: string): VisualChangeMonitor | undefined {
    return this.monitors.get(monitorId);
  }

  /**
   * List all active monitors
   */
  listActiveMonitors(): VisualChangeMonitor[] {
    return Array.from(this.monitors.values()).filter(m => m.isActive);
  }

  /**
   * Get monitor history
   */
  getMonitorHistory(monitorId: string, limit?: number): ChangeDetectionResult[] {
    const monitor = this.monitors.get(monitorId);
    if (!monitor) return [];

    let history = monitor.history;

    if (limit) {
      history = history.slice(-limit);
    }

    return history;
  }

  /**
   * Get change statistics for monitor
   */
  getMonitorStatistics(monitorId: string): {
    totalChecks: number;
    changesDetected: number;
    averageDifference: number;
    maxDifference: number;
    minDifference: number;
    lastCheckTime?: Date;
  } {
    const monitor = this.monitors.get(monitorId);
    if (!monitor) {
      return {
        totalChecks: 0,
        changesDetected: 0,
        averageDifference: 0,
        maxDifference: 0,
        minDifference: 0,
      };
    }

    const { history, lastCheckTime } = monitor;

    if (history.length === 0) {
      return {
        totalChecks: 0,
        changesDetected: 0,
        averageDifference: 0,
        maxDifference: 0,
        minDifference: 0,
        lastCheckTime,
      };
    }

    const differences = history.map(r => r.overallDifference);
    const changesDetected = history.filter(r => r.changeDetected).length;
    const avgDifference = differences.reduce((a, b) => a + b, 0) / differences.length;
    const maxDifference = Math.max(...differences);
    const minDifference = Math.min(...differences);

    return {
      totalChecks: history.length,
      changesDetected,
      averageDifference: avgDifference,
      maxDifference,
      minDifference,
      lastCheckTime,
    };
  }

  /**
   * List all change detection results
   */
  listChangeResults(limit?: number): ChangeDetectionResult[] {
    let results = Array.from(this.changeResults.values());

    if (limit) {
      results = results.slice(-limit);
    }

    return results;
  }

  /**
   * Clear change detection history
   */
  clearChangeResults(monitorId?: string): void {
    if (monitorId) {
      const monitor = this.monitors.get(monitorId);
      if (monitor) {
        monitor.history = [];
        this.logger.log(`Cleared history for monitor: ${monitorId}`);
      }
    } else {
      this.changeResults.clear();
      this.logger.log('Cleared all change detection results');
    }
  }

  /**
   * Delete monitor
   */
  deleteMonitor(monitorId: string): void {
    this.monitors.delete(monitorId);
    this.baselines.delete(monitorId);
    this.logger.log(`Deleted monitor: ${monitorId}`);
  }

  /**
   * Periodically check all active monitors
   */
  private startMonitoringScheduler(): void {
    const CHECK_INTERVAL = 5000; // 5 seconds

    setInterval(() => {
      for (const monitor of this.monitors.values()) {
        if (monitor.isActive) {
          // TODO: Capture current screenshot
          // TODO: Call checkForChanges
        }
      }
    }, CHECK_INTERVAL);
  }

  /**
   * Shutdown the service
   */
  async onApplicationShutdown(): Promise<void> {
    this.logger.log('Shutting down Change Detector Service');

    // Stop all monitors
    for (const monitor of this.monitors.values()) {
      monitor.isActive = false;
    }

    this.changeResults.clear();
    this.monitors.clear();
    this.baselines.clear();
  }
}
