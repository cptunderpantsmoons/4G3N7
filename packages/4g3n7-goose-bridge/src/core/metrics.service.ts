/**
 * Metrics Service
 * Collects and exposes system metrics
 */

import { Injectable, Logger } from '@nestjs/common';

export interface MetricValue {
  value: number;
  timestamp: Date;
  tags?: Record<string, string>;
}

export interface Counter {
  name: string;
  value: number;
  tags: Record<string, string>;
}

export interface Gauge {
  name: string;
  value: number;
  tags: Record<string, string>;
}

export interface Histogram {
  name: string;
  count: number;
  sum: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
  tags: Record<string, string>;
}

@Injectable()
export class MetricsService {
  private readonly logger = new Logger(MetricsService.name);
  private counters: Map<string, Counter> = new Map();
  private gauges: Map<string, Gauge> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private timers: Map<string, number> = new Map();

  /**
   * Increment a counter
   */
  increment(name: string, value: number = 1, tags: Record<string, string> = {}): void {
    const key = this.getKey(name, tags);
    const existing = this.counters.get(key);

    if (existing) {
      existing.value += value;
    } else {
      this.counters.set(key, { name, value, tags });
    }
  }

  /**
   * Set a gauge value
   */
  gauge(name: string, value: number, tags: Record<string, string> = {}): void {
    const key = this.getKey(name, tags);
    this.gauges.set(key, { name, value, tags });
  }

  /**
   * Record a histogram value
   */
  histogram(name: string, value: number, tags: Record<string, string> = {}): void {
    const key = this.getKey(name, tags);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);

    // Keep only last 1000 values
    if (values.length > 1000) {
      this.histograms.set(key, values.slice(-1000));
    }
  }

  /**
   * Record timing
   */
  timing(name: string, duration: number, tags: Record<string, string> = {}): void {
    this.histogram(name, duration, tags);
  }

  /**
   * Start a timer
   */
  startTimer(name: string, tags: Record<string, string> = {}): () => void {
    const key = this.getKey(name, tags);
    const startTime = Date.now();
    this.timers.set(key, startTime);

    // Return a function to stop the timer
    return () => {
      const duration = Date.now() - startTime;
      this.timing(name, duration, tags);
      this.timers.delete(key);
    };
  }

  /**
   * Get counter value
   */
  getCounter(name: string, tags: Record<string, string> = {}): number {
    const key = this.getKey(name, tags);
    return this.counters.get(key)?.value || 0;
  }

  /**
   * Get gauge value
   */
  getGauge(name: string, tags: Record<string, string> = {}): number | null {
    const key = this.getKey(name, tags);
    return this.gauges.get(key)?.value ?? null;
  }

  /**
   * Get histogram statistics
   */
  getHistogram(name: string, tags: Record<string, string> = {}): Histogram | null {
    const key = this.getKey(name, tags);
    const values = this.histograms.get(key);

    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    const sum = sorted.reduce((a, b) => a + b, 0);
    const min = sorted[0];
    const max = sorted[count - 1];
    const avg = sum / count;

    return {
      name,
      count,
      sum,
      min,
      max,
      avg,
      p50: this.percentile(sorted, 50),
      p95: this.percentile(sorted, 95),
      p99: this.percentile(sorted, 99),
      tags,
    };
  }

  /**
   * Get all metrics
   */
  getAllMetrics() {
    const counters = Array.from(this.counters.values());
    const gauges = Array.from(this.gauges.values());
    const histograms: Histogram[] = [];

    for (const [key, values] of this.histograms.entries()) {
      const [name, tagsStr] = key.split('|');
      const tags = tagsStr ? JSON.parse(tagsStr) : {};
      const histogram = this.getHistogram(name, tags);
      if (histogram) {
        histograms.push(histogram);
      }
    }

    return {
      counters,
      gauges,
      histograms,
    };
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheus(): string {
    const lines: string[] = [];

    // Export counters
    for (const counter of this.counters.values()) {
      const tagsStr = this.formatTags(counter.tags);
      lines.push(`# TYPE ${counter.name} counter`);
      lines.push(`${counter.name}${tagsStr} ${counter.value}`);
    }

    // Export gauges
    for (const gauge of this.gauges.values()) {
      const tagsStr = this.formatTags(gauge.tags);
      lines.push(`# TYPE ${gauge.name} gauge`);
      lines.push(`${gauge.name}${tagsStr} ${gauge.value}`);
    }

    // Export histograms
    const histograms = this.getAllMetrics().histograms;
    for (const histogram of histograms) {
      const tagsStr = this.formatTags(histogram.tags);
      lines.push(`# TYPE ${histogram.name} summary`);
      lines.push(`${histogram.name}_count${tagsStr} ${histogram.count}`);
      lines.push(`${histogram.name}_sum${tagsStr} ${histogram.sum}`);
      lines.push(`${histogram.name}{quantile="0.5"${tagsStr.slice(1)} ${histogram.p50}`);
      lines.push(`${histogram.name}{quantile="0.95"${tagsStr.slice(1)} ${histogram.p95}`);
      lines.push(`${histogram.name}{quantile="0.99"${tagsStr.slice(1)} ${histogram.p99}`);
    }

    return lines.join('\n') + '\n';
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.counters.clear();
    this.gauges.clear();
    this.histograms.clear();
    this.timers.clear();
    this.logger.log('All metrics reset');
  }

  /**
   * Generate metric key
   */
  private getKey(name: string, tags: Record<string, string>): string {
    const tagsStr = Object.keys(tags).length > 0 ? JSON.stringify(tags) : '';
    return `${name}|${tagsStr}`;
  }

  /**
   * Calculate percentile
   */
  private percentile(sorted: number[], p: number): number {
    const index = Math.ceil((sorted.length * p) / 100) - 1;
    return sorted[Math.max(0, index)];
  }

  /**
   * Format tags for Prometheus
   */
  private formatTags(tags: Record<string, string>): string {
    if (Object.keys(tags).length === 0) {
      return '';
    }

    const pairs = Object.entries(tags).map(([k, v]) => `${k}="${v}"`);
    return `{${pairs.join(',')}}`;
  }
}
