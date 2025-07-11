/**
 * Performance Optimization Utilities
 * Comprehensive performance monitoring and optimization helpers
 * Following Cursor Rules for performance monitoring and optimization
 */

import {
  infoLog,
  errorLog,
  warnLog,
} from '@/core/infrastructure/monitoring/clientLogger';

// Performance thresholds for Core Web Vitals
export const PERFORMANCE_THRESHOLDS = {
  LCP: { good: 2500, poor: 4000 }, // Largest Contentful Paint
  FID: { good: 100, poor: 300 }, // First Input Delay
  CLS: { good: 0.1, poor: 0.25 }, // Cumulative Layout Shift
  FCP: { good: 1800, poor: 3000 }, // First Contentful Paint
  TTFB: { good: 800, poor: 1800 }, // Time to First Byte
  INP: { good: 200, poor: 500 }, // Interaction to Next Paint
} as const;

// Type definitions for better TypeScript support
interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface WindowWithPerformanceSummary extends Window {
  performanceSummary?: () => void;
}

declare global {
  interface Performance {
    memory?: PerformanceMemory;
  }
}

/**
 * Bundle Size Monitor
 * Tracks and reports on bundle sizes and loading performance
 */
export class BundleSizeMonitor {
  private static instance: BundleSizeMonitor;
  private performanceEntries: PerformanceEntry[] = [];

  static getInstance(): BundleSizeMonitor {
    if (!BundleSizeMonitor.instance) {
      BundleSizeMonitor.instance = new BundleSizeMonitor();
    }
    return BundleSizeMonitor.instance;
  }

  /**
   * Initialize bundle monitoring
   */
  init(): void {
    if (typeof window === 'undefined') return;

    // Monitor resource loading performance
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      this.performanceEntries.push(...entries);

      entries.forEach((entry) => {
        if (entry.entryType === 'resource') {
          this.analyzeResourcePerformance(entry as PerformanceResourceTiming);
        }
      });
    });

    try {
      observer.observe({ entryTypes: ['resource', 'navigation'] });
      infoLog('Bundle Size Monitor initialized');
    } catch (error) {
      errorLog('Failed to initialize Bundle Size Monitor', String(error));
    }
  }

  /**
   * Analyze resource loading performance
   */
  private analyzeResourcePerformance(entry: PerformanceResourceTiming): void {
    const size =
      (entry as PerformanceResourceTiming & { transferSize?: number })
        .transferSize ?? 0;
    const duration = entry.duration;

    // Flag large resources
    if (size > 1000000) {
      // 1MB
      warnLog('Large resource detected', {
        name: entry.name,
        size: `${(size / 1024 / 1024).toFixed(2)}MB`,
        duration: `${duration.toFixed(0)}ms`,
        type: entry.initiatorType,
      });
    }

    // Flag slow loading resources
    if (duration > 3000) {
      // 3 seconds
      warnLog('Slow loading resource', {
        name: entry.name,
        duration: `${duration.toFixed(0)}ms`,
        size: size ? `${(size / 1024).toFixed(0)}KB` : 'unknown',
      });
    }
  }

  /**
   * Get bundle size analysis report
   */
  getBundleAnalysis(): {
    totalResources: number;
    totalSize: number;
    largeResources: Array<{ name: string; size: number; duration: number }>;
    slowResources: Array<{ name: string; duration: number; size: number }>;
  } {
    const resourceEntries = this.performanceEntries.filter(
      (entry) => entry.entryType === 'resource',
    ) as PerformanceResourceTiming[];

    const totalSize = resourceEntries.reduce((sum, entry) => {
      return (
        sum +
        ((entry as PerformanceResourceTiming & { transferSize?: number })
          .transferSize ?? 0)
      );
    }, 0);

    const largeResources = resourceEntries
      .filter(
        (entry) =>
          ((entry as PerformanceResourceTiming & { transferSize?: number })
            .transferSize ?? 0) > 500000,
      ) // 500KB
      .map((entry) => ({
        name: entry.name,
        size:
          (entry as PerformanceResourceTiming & { transferSize?: number })
            .transferSize ?? 0,
        duration: entry.duration,
      }))
      .sort((a, b) => b.size - a.size);

    const slowResources = resourceEntries
      .filter((entry) => entry.duration > 2000) // 2 seconds
      .map((entry) => ({
        name: entry.name,
        duration: entry.duration,
        size:
          (entry as PerformanceResourceTiming & { transferSize?: number })
            .transferSize ?? 0,
      }))
      .sort((a, b) => b.duration - a.duration);

    return {
      totalResources: resourceEntries.length,
      totalSize,
      largeResources,
      slowResources,
    };
  }

  /**
   * Log performance recommendations
   */
  logRecommendations(): void {
    const analysis = this.getBundleAnalysis();

    // Log bundle performance analysis summary
    infoLog('Bundle Performance Analysis', {
      totalResources: analysis.totalResources,
      totalSize: `${(analysis.totalSize / 1024 / 1024).toFixed(2)}MB`,
      largeResourcesCount: analysis.largeResources.length,
      slowResourcesCount: analysis.slowResources.length,
    });

    // Log large resources if any
    if (analysis.largeResources.length > 0) {
      warnLog('Large Resources Detected (>500KB)', {
        resources: analysis.largeResources.map((resource) => ({
          name: resource.name,
          size: `${(resource.size / 1024).toFixed(0)}KB`,
          duration: `${resource.duration.toFixed(0)}ms`,
        })),
      });
    }

    // Log slow resources if any
    if (analysis.slowResources.length > 0) {
      warnLog('Slow Resources Detected (>2s)', {
        resources: analysis.slowResources.map((resource) => ({
          name: resource.name,
          duration: `${resource.duration.toFixed(0)}ms`,
          size: `${(resource.size / 1024).toFixed(0)}KB`,
        })),
      });
    }
  }
}

/**
 * Component Performance Tracker
 * Tracks component render performance and identifies bottlenecks
 */
export class ComponentPerformanceTracker {
  private renderTimes = new Map<string, number[]>();
  private static instance: ComponentPerformanceTracker;

  static getInstance(): ComponentPerformanceTracker {
    if (!ComponentPerformanceTracker.instance) {
      ComponentPerformanceTracker.instance = new ComponentPerformanceTracker();
    }
    return ComponentPerformanceTracker.instance;
  }

  /**
   * Start tracking component render
   */
  startRender(componentName: string): () => void {
    const startTime = performance.now();

    return () => {
      const endTime = performance.now();
      const renderTime = endTime - startTime;
      this.recordRenderTime(componentName, renderTime);
    };
  }

  /**
   * Record component render time
   */
  private recordRenderTime(componentName: string, renderTime: number): void {
    if (!this.renderTimes.has(componentName)) {
      this.renderTimes.set(componentName, []);
    }

    const times = this.renderTimes.get(componentName)!;
    times.push(renderTime);

    // Keep only last 10 renders
    if (times.length > 10) {
      times.shift();
    }

    // Warn about slow renders
    if (renderTime > 16) {
      // 16ms = 60fps threshold
      warnLog('Slow render detected', {
        componentName,
        renderTime: `${renderTime.toFixed(2)}ms`,
        threshold: '16ms (60fps)',
      });
    }
  }

  /**
   * Get performance statistics for a component
   */
  getComponentStats(componentName: string): {
    averageRenderTime: number;
    maxRenderTime: number;
    minRenderTime: number;
    totalRenders: number;
  } | null {
    const times = this.renderTimes.get(componentName);
    if (!times || times.length === 0) return null;

    return {
      averageRenderTime:
        times.reduce((sum, time) => sum + time, 0) / times.length,
      maxRenderTime: Math.max(...times),
      minRenderTime: Math.min(...times),
      totalRenders: times.length,
    };
  }

  /**
   * Get all component performance statistics
   */
  getAllStats(): Map<
    string,
    ReturnType<ComponentPerformanceTracker['getComponentStats']>
  > {
    const stats = new Map();
    for (const [componentName] of this.renderTimes) {
      stats.set(componentName, this.getComponentStats(componentName));
    }
    return stats;
  }

  /**
   * Log performance summary
   */
  logPerformanceSummary(): void {
    const allStats = this.getAllStats();

    // Sort by average render time (slowest first)
    const sortedStats = Array.from(allStats.entries())
      .filter(([, stats]) => stats !== null)
      .sort(
        ([, a], [, b]) =>
          (b?.averageRenderTime ?? 0) - (a?.averageRenderTime ?? 0),
      );

    const performanceData = sortedStats
      .map(([componentName, stats]) => {
        if (stats) {
          return {
            componentName,
            averageRenderTime: `${stats.averageRenderTime.toFixed(2)}ms`,
            maxRenderTime: `${stats.maxRenderTime.toFixed(2)}ms`,
            totalRenders: stats.totalRenders,
          };
        }
        return null;
      })
      .filter(Boolean);

    infoLog('Component Performance Summary', {
      totalComponents: performanceData.length,
      components: performanceData,
    });
  }
}

/**
 * React Hook for component performance tracking
 */
export function useComponentPerformance(componentName: string): void {
  if (typeof window === 'undefined' || process.env.NODE_ENV !== 'development') {
    return;
  }

  const tracker = ComponentPerformanceTracker.getInstance();
  const endRender = tracker.startRender(componentName);

  // End tracking after render
  setTimeout(endRender, 0);
}

/**
 * Memory Usage Monitor
 * Tracks memory usage and detects potential memory leaks
 */
export class MemoryUsageMonitor {
  private static instance: MemoryUsageMonitor;
  private measurements: Array<{ timestamp: number; usedJSHeapSize: number }> =
    [];

  static getInstance(): MemoryUsageMonitor {
    if (!MemoryUsageMonitor.instance) {
      MemoryUsageMonitor.instance = new MemoryUsageMonitor();
    }
    return MemoryUsageMonitor.instance;
  }

  /**
   * Start monitoring memory usage
   */
  startMonitoring(): void {
    if (typeof window === 'undefined' || !performance.memory) {
      warnLog('Memory monitoring not supported in this environment');
      return;
    }

    // Take measurement every 30 seconds
    const measureInterval = setInterval(() => {
      this.takeMeasurement();
    }, 30000);

    // Initial measurement
    this.takeMeasurement();

    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
      clearInterval(measureInterval);
    });

    infoLog('Memory Usage Monitor started');
  }

  /**
   * Take a memory measurement
   */
  private takeMeasurement(): void {
    if (!performance.memory) return;

    const memory = performance.memory;
    const measurement = {
      timestamp: Date.now(),
      usedJSHeapSize: memory.usedJSHeapSize,
    };

    this.measurements.push(measurement);

    // Keep only last 100 measurements
    if (this.measurements.length > 100) {
      this.measurements.shift();
    }

    // Check for potential memory leaks
    this.checkForMemoryLeaks();
  }

  /**
   * Check for potential memory leaks
   */
  private checkForMemoryLeaks(): void {
    if (this.measurements.length < 10) return;

    const recent = this.measurements.slice(-10);
    const oldest = recent[0];
    const newest = recent[recent.length - 1];

    if (!oldest || !newest) return;

    const memoryIncrease = newest.usedJSHeapSize - oldest.usedJSHeapSize;
    const timeSpan = newest.timestamp - oldest.timestamp;

    // If memory increased by more than 50MB in the last 10 measurements
    if (memoryIncrease > 50 * 1024 * 1024) {
      warnLog('Potential memory leak detected', {
        increase: `${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`,
        timeSpan: `${(timeSpan / 1000).toFixed(0)}s`,
        currentUsage: `${(newest.usedJSHeapSize / 1024 / 1024).toFixed(2)}MB`,
      });
    }
  }

  /**
   * Get current memory usage statistics
   */
  getMemoryStats(): {
    current: number;
    peak: number;
    average: number;
    measurements: number;
  } | null {
    if (this.measurements.length === 0) return null;

    const lastMeasurement = this.measurements[this.measurements.length - 1];
    if (!lastMeasurement) return null;

    const current = lastMeasurement.usedJSHeapSize;
    const peak = Math.max(...this.measurements.map((m) => m.usedJSHeapSize));
    const average =
      this.measurements.reduce((sum, m) => sum + m.usedJSHeapSize, 0) /
      this.measurements.length;

    return {
      current: current / 1024 / 1024, // Convert to MB
      peak: peak / 1024 / 1024,
      average: average / 1024 / 1024,
      measurements: this.measurements.length,
    };
  }
}

/**
 * Initialize all performance monitoring
 */
export function initializePerformanceMonitoring(): void {
  if (typeof window === 'undefined') return;

  // Initialize all monitors
  BundleSizeMonitor.getInstance().init();
  ComponentPerformanceTracker.getInstance();
  MemoryUsageMonitor.getInstance().startMonitoring();

  // Global performance summary function for debugging
  (window as WindowWithPerformanceSummary).performanceSummary = () => {
    infoLog('Performance Summary - Starting comprehensive analysis');

    BundleSizeMonitor.getInstance().logRecommendations();
    ComponentPerformanceTracker.getInstance().logPerformanceSummary();

    const memoryStats = MemoryUsageMonitor.getInstance().getMemoryStats();
    if (memoryStats) {
      infoLog('Memory Usage Statistics', {
        current: `${memoryStats.current.toFixed(2)}MB`,
        peak: `${memoryStats.peak.toFixed(2)}MB`,
        average: `${memoryStats.average.toFixed(2)}MB`,
        measurements: memoryStats.measurements,
      });
    }

    infoLog('Performance Summary - Analysis complete');
  };

  infoLog(
    'Performance monitoring initialized - use window.performanceSummary() for debug info',
  );
}
