/**
 * Performance monitoring utility for comprehensive tracking of Core Web Vitals
 * and application performance metrics. Complements Vercel Speed Insights.
 *
 * Implements autonomous performance pattern recognition and debugging capabilities
 * as required by the cursor rules for performance monitoring.
 */

import { infoLog, warnLog, errorLog } from './clientLogger';

interface PerformanceMetrics {
  timestamp: string;
  url: string;
  metrics: {
    [key: string]: number;
  };
  issues: string[];
  recommendations: string[];
}

// Performance thresholds based on Core Web Vitals
const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  TTFB: { good: 800, poor: 1800 },
  INP: { good: 200, poor: 500 },
} as const;

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = [];
  private observer: PerformanceObserver | null = null;
  private initialized = false;

  constructor() {
    if (typeof window !== 'undefined') {
      this.initialize();
    }
  }

  /**
   * Initialize performance monitoring
   */
  private initialize(): void {
    if (this.initialized || typeof window === 'undefined') return;

    try {
      // Initialize Performance Observer for comprehensive metrics
      this.observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          this.processPerformanceEntry(entry);
        });
      });

      // Observe all performance entry types
      const entryTypes = [
        'navigation',
        'resource',
        'paint',
        'layout-shift',
        'first-input',
        'largest-contentful-paint',
      ];

      entryTypes.forEach((type) => {
        try {
          this.observer?.observe({ type, buffered: true });
        } catch {
          // Entry type not supported, skip
          console.debug(`Performance entry type "${type}" not supported`);
        }
      });

      // Monitor page visibility changes for accurate metrics
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.captureCurrentMetrics();
        }
      });

      // Capture metrics before page unload
      window.addEventListener('beforeunload', () => {
        this.captureCurrentMetrics();
      });

      this.initialized = true;
      infoLog('Performance Monitor initialized with Core Web Vitals tracking');
    } catch (error) {
      errorLog('Failed to initialize Performance Monitor', String(error));
    }
  }

  /**
   * Process individual performance entries
   */
  private processPerformanceEntry(entry: PerformanceEntry): void {
    switch (entry.entryType) {
      case 'navigation':
        this.analyzeNavigationTiming(entry as PerformanceNavigationTiming);
        break;
      case 'paint':
        this.analyzePaintTiming(entry);
        break;
      case 'layout-shift':
        this.analyzeLayoutShift(entry as PerformanceEntry & { value: number });
        break;
      case 'largest-contentful-paint':
        this.analyzeLCP(entry as PerformanceEntry & { size: number });
        break;
      case 'first-input':
        this.analyzeFID(
          entry as PerformanceEntry & { processingStart: number },
        );
        break;
      case 'resource':
        this.analyzeResourceTiming(entry as PerformanceResourceTiming);
        break;
    }
  }

  /**
   * Analyze navigation timing for TTFB and other metrics
   */
  private analyzeNavigationTiming(entry: PerformanceNavigationTiming): void {
    const ttfb = entry.responseStart - entry.requestStart;
    const domComplete = entry.domComplete - entry.fetchStart;
    const loadComplete = entry.loadEventEnd - entry.fetchStart;

    const metrics = {
      TTFB: ttfb,
      'DOM Complete': domComplete,
      'Load Complete': loadComplete,
      'DNS Lookup': entry.domainLookupEnd - entry.domainLookupStart,
      'TCP Connect': entry.connectEnd - entry.connectStart,
    };

    // Detect performance issues
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (ttfb > PERFORMANCE_THRESHOLDS.TTFB.poor) {
      issues.push(`High TTFB: ${ttfb.toFixed(0)}ms`);
      recommendations.push('Optimize server response time or consider CDN');
    }

    if (domComplete > 5000) {
      issues.push(`Slow DOM processing: ${domComplete.toFixed(0)}ms`);
      recommendations.push('Optimize DOM complexity and JavaScript execution');
    }

    this.recordMetrics('Navigation', metrics, issues, recommendations);
  }

  /**
   * Analyze paint timing metrics
   */
  private analyzePaintTiming(entry: PerformanceEntry): void {
    const fcp = entry.startTime;

    if (entry.name === 'first-contentful-paint') {
      const issues: string[] = [];
      const recommendations: string[] = [];

      if (fcp > PERFORMANCE_THRESHOLDS.FCP.poor) {
        issues.push(`Slow First Contentful Paint: ${fcp.toFixed(0)}ms`);
        recommendations.push(
          'Optimize critical rendering path and reduce render-blocking resources',
        );
      }

      this.recordMetrics('Paint', { FCP: fcp }, issues, recommendations);
    }
  }

  /**
   * Analyze Cumulative Layout Shift
   */
  private analyzeLayoutShift(
    entry: PerformanceEntry & { value: number },
  ): void {
    const cls = entry.value;
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (cls > PERFORMANCE_THRESHOLDS.CLS.poor) {
      issues.push(`High Cumulative Layout Shift: ${cls.toFixed(3)}`);
      recommendations.push(
        'Add size attributes to images and reserve space for dynamic content',
      );
    }

    this.recordMetrics('Layout', { CLS: cls }, issues, recommendations);
  }

  /**
   * Analyze Largest Contentful Paint
   */
  private analyzeLCP(entry: PerformanceEntry & { size: number }): void {
    const lcp = entry.startTime;
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (lcp > PERFORMANCE_THRESHOLDS.LCP.poor) {
      issues.push(`Slow Largest Contentful Paint: ${lcp.toFixed(0)}ms`);
      recommendations.push(
        'Optimize images, preload critical resources, and improve server response',
      );
    }

    this.recordMetrics('LCP', { LCP: lcp }, issues, recommendations);
  }

  /**
   * Analyze First Input Delay
   */
  private analyzeFID(
    entry: PerformanceEntry & { processingStart: number },
  ): void {
    const fid = entry.processingStart - entry.startTime;
    const issues: string[] = [];
    const recommendations: string[] = [];

    if (fid > PERFORMANCE_THRESHOLDS.FID.poor) {
      issues.push(`High First Input Delay: ${fid.toFixed(0)}ms`);
      recommendations.push(
        'Reduce JavaScript execution time and break up long tasks',
      );
    }

    this.recordMetrics('Interaction', { FID: fid }, issues, recommendations);
  }

  /**
   * Analyze resource loading performance
   */
  private analyzeResourceTiming(entry: PerformanceResourceTiming): void {
    const duration = entry.responseEnd - entry.requestStart;
    const size = entry.transferSize ?? 0;

    // Detect slow resources
    if (duration > 2000) {
      warnLog(`Slow resource detected: ${entry.name}`, {
        duration: `${duration.toFixed(0)}ms`,
        size: `${(size / 1024).toFixed(1)}KB`,
        type: entry.initiatorType,
      });
    }

    // Detect large resources
    if (size > 1024 * 1024) {
      // 1MB+
      warnLog(`Large resource detected: ${entry.name}`, {
        size: `${(size / 1024 / 1024).toFixed(1)}MB`,
        duration: `${duration.toFixed(0)}ms`,
      });
    }
  }

  /**
   * Record performance metrics for analysis
   */
  private recordMetrics(
    category: string,
    metrics: Record<string, number>,
    issues: string[] = [],
    recommendations: string[] = [],
  ): void {
    const performanceData: PerformanceMetrics = {
      timestamp: new Date().toISOString(),
      url: window.location.href,
      metrics,
      issues,
      recommendations,
    };

    this.metrics.push(performanceData);

    // Log significant performance issues
    if (issues.length > 0) {
      warnLog(`Performance Issues Detected - ${category}`, {
        issues,
        recommendations,
        metrics,
      });
    }
  }

  /**
   * Capture current performance state
   */
  private captureCurrentMetrics(): void {
    if (typeof window === 'undefined') return;

    try {
      const navigation = performance.getEntriesByType(
        'navigation',
      )[0] as PerformanceNavigationTiming;
      const paint = performance.getEntriesByType('paint');

      const currentMetrics = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        navigation: navigation
          ? {
              TTFB: navigation.responseStart - navigation.requestStart,
              DOMContentLoaded:
                navigation.domContentLoadedEventEnd - navigation.fetchStart,
              Load: navigation.loadEventEnd - navigation.fetchStart,
            }
          : {},
        paint: paint.reduce(
          (acc, entry) => {
            acc[entry.name] = entry.startTime;
            return acc;
          },
          {} as Record<string, number>,
        ),
      };

      infoLog('Performance snapshot captured', currentMetrics);
    } catch (error) {
      errorLog('Failed to capture performance metrics', String(error));
    }
  }

  /**
   * Get performance analytics summary
   */
  public getPerformanceAnalytics(): {
    totalIssues: number;
    criticalIssues: string[];
    recommendations: string[];
    averageMetrics: Record<string, number>;
  } {
    const allIssues = this.metrics.flatMap((m) => m.issues);
    const allRecommendations = this.metrics.flatMap((m) => m.recommendations);

    // Calculate average metrics
    const allMetrics = this.metrics.flatMap((m) => Object.entries(m.metrics));
    const averageMetrics: Record<string, number> = {};

    allMetrics.forEach(([key, value]) => {
      if (!averageMetrics[key]) {
        averageMetrics[key] = value;
      } else {
        averageMetrics[key] = (averageMetrics[key] + value) / 2;
      }
    });

    return {
      totalIssues: allIssues.length,
      criticalIssues: [...new Set(allIssues)],
      recommendations: [...new Set(allRecommendations)],
      averageMetrics,
    };
  }

  /**
   * Cleanup resources
   */
  public destroy(): void {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
    this.initialized = false;
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

// Global access for debugging in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (
    window as Window & { KeystrokePerformance?: PerformanceMonitor }
  ).KeystrokePerformance = performanceMonitor;
}
