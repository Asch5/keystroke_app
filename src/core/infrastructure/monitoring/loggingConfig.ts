/**
 * Centralized Logging Configuration (2025 Standards)
 * Environment-aware logging setup with best practices
 */

import { modernLogger, configureLogging } from './modernLogger';
import { otelLogger } from './otelLogger';

// Environment-specific logging configurations
const LOGGING_CONFIGS = {
  development: {
    logLevel: 'debug' as const,
    enabledSources: ['console', 'file'] as const,
    redactSensitiveData: false,
    enablePerformanceLogging: true,
    enableVerboseErrors: true,
    flushInterval: 1000, // 1 second for immediate feedback
  },

  testing: {
    logLevel: 'warn' as const,
    enabledSources: ['console'] as const,
    redactSensitiveData: true,
    enablePerformanceLogging: false,
    enableVerboseErrors: true,
    flushInterval: 5000,
  },

  staging: {
    logLevel: 'info' as const,
    enabledSources: ['console', 'file', 'otel'] as const,
    redactSensitiveData: true,
    enablePerformanceLogging: true,
    enableVerboseErrors: false,
    flushInterval: 5000,
  },

  production: {
    logLevel: 'warn' as const,
    enabledSources: ['otel'] as const,
    redactSensitiveData: true,
    enablePerformanceLogging: false,
    enableVerboseErrors: false,
    flushInterval: 10000, // 10 seconds for efficiency
  },
};

// Logging destinations configuration
interface LoggingDestination {
  name: string;
  endpoint?: string | undefined;
  headers?: Record<string, string>;
  batchSize?: number;
  enabled: boolean;
}

const LOGGING_DESTINATIONS: Record<string, LoggingDestination[]> = {
  development: [
    { name: 'console', enabled: true },
    { name: 'file', enabled: true },
  ],

  staging: [
    { name: 'console', enabled: true },
    { name: 'file', enabled: true },
    {
      name: 'otel',
      endpoint:
        process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT ||
        'http://localhost:4318/v1/logs',
      batchSize: 50,
      enabled: true,
    },
  ],

  production: [
    {
      name: 'otel',
      endpoint:
        process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT ||
        'https://api.honeycomb.io/v1/logs',
      headers: {
        'x-honeycomb-team': process.env.HONEYCOMB_API_KEY || '',
        'x-honeycomb-dataset': process.env.HONEYCOMB_DATASET || 'keystroke-app',
      },
      batchSize: 100,
      enabled: !!process.env.OTEL_EXPORTER_OTLP_LOGS_ENDPOINT,
    },
    {
      name: 'datadog',
      endpoint: process.env.DATADOG_LOGS_ENDPOINT || undefined,
      headers: {
        'DD-API-KEY': process.env.DATADOG_API_KEY || '',
      },
      batchSize: 100,
      enabled: !!process.env.DATADOG_API_KEY,
    },
  ],
};

// Performance monitoring configuration
const PERFORMANCE_CONFIG = {
  development: {
    enableRenderProfiling: true,
    enableMemoryTracking: true,
    enableNetworkProfiling: true,
    slowRenderThreshold: 16, // 1 frame at 60fps
    memoryLeakThreshold: 50 * 1024 * 1024, // 50MB
  },

  production: {
    enableRenderProfiling: false,
    enableMemoryTracking: false,
    enableNetworkProfiling: true,
    slowRenderThreshold: 100, // More lenient in production
    memoryLeakThreshold: 100 * 1024 * 1024, // 100MB
  },

  testing: {
    enableRenderProfiling: false,
    enableMemoryTracking: false,
    enableNetworkProfiling: false,
    slowRenderThreshold: 100,
    memoryLeakThreshold: 100 * 1024 * 1024,
  },

  staging: {
    enableRenderProfiling: false,
    enableMemoryTracking: true,
    enableNetworkProfiling: true,
    slowRenderThreshold: 50,
    memoryLeakThreshold: 75 * 1024 * 1024,
  },
};

// Security and privacy configuration
const SECURITY_CONFIG = {
  development: {
    maskPII: false,
    redactSensitiveFields: false,
    enableSecurityEventLogging: true,
    logUserActions: true,
  },

  production: {
    maskPII: true,
    redactSensitiveFields: true,
    enableSecurityEventLogging: true,
    logUserActions: false, // Disable detailed user action logging for privacy
  },

  testing: {
    maskPII: true,
    redactSensitiveFields: true,
    enableSecurityEventLogging: false,
    logUserActions: false,
  },

  staging: {
    maskPII: true,
    redactSensitiveFields: true,
    enableSecurityEventLogging: true,
    logUserActions: false,
  },
};

class LoggingConfigurator {
  private static instance: LoggingConfigurator;
  private environment: keyof typeof LOGGING_CONFIGS;
  private isInitialized = false;

  private constructor() {
    this.environment =
      (process.env.NODE_ENV as keyof typeof LOGGING_CONFIGS) || 'development';
  }

  static getInstance(): LoggingConfigurator {
    if (!LoggingConfigurator.instance) {
      LoggingConfigurator.instance = new LoggingConfigurator();
    }
    return LoggingConfigurator.instance;
  }

  /**
   * Initialize logging configuration based on environment
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    const config = LOGGING_CONFIGS[this.environment];
    const destinations = LOGGING_DESTINATIONS[this.environment] || [];

    // Configure the modern logger
    configureLogging({
      logLevel: config.logLevel,
      enabledSources: config.enabledSources,
      redactSensitiveData: config.redactSensitiveData,
    });

    // Initialize OpenTelemetry if enabled
    const otelDestination = destinations.find(
      (d) => d.name === 'otel' && d.enabled,
    );
    if (otelDestination?.endpoint) {
      otelLogger.initialize({
        serviceName: 'keystroke-app',
        serviceVersion: process.env.npm_package_version || '1.0.0',
        otlpEndpoint: otelDestination.endpoint,
        ...(otelDestination.headers && { headers: otelDestination.headers }),
      });
    }

    // Set up performance monitoring
    if (config.enablePerformanceLogging && typeof window !== 'undefined') {
      this.setupPerformanceMonitoring();
    }

    // Set up error handling
    this.setupGlobalErrorHandling();

    // Set up periodic log flushing
    this.setupLogFlushing(config.flushInterval);

    this.isInitialized = true;

    await modernLogger.info('Logging system initialized', {
      environment: this.environment,
      config: {
        logLevel: config.logLevel,
        enabledSources: config.enabledSources,
        destinations: destinations.filter((d) => d.enabled).map((d) => d.name),
      },
    });
  }

  /**
   * Set up performance monitoring based on environment
   */
  private setupPerformanceMonitoring(): void {
    const perfConfig =
      PERFORMANCE_CONFIG[this.environment] || PERFORMANCE_CONFIG.development;

    if (perfConfig.enableRenderProfiling) {
      // Monitor long tasks
      if ('PerformanceObserver' in window) {
        const observer = new PerformanceObserver((list) => {
          list.getEntries().forEach((entry) => {
            if (entry.duration > 50) {
              // Long task threshold
              modernLogger.performance('Long task detected', entry.duration, {
                taskType: entry.name,
                startTime: entry.startTime,
              });
            }
          });
        });

        observer.observe({ entryTypes: ['longtask'] });
      }
    }

    if (perfConfig.enableMemoryTracking && 'memory' in performance) {
      // Monitor memory usage
      setInterval(() => {
        const memory = (
          performance as Performance & {
            memory?: {
              usedJSHeapSize: number;
              totalJSHeapSize: number;
              jsHeapSizeLimit: number;
            };
          }
        ).memory;
        if (memory && memory.usedJSHeapSize > perfConfig.memoryLeakThreshold) {
          modernLogger.warn('High memory usage detected', {
            usedJSHeapSize: memory.usedJSHeapSize,
            totalJSHeapSize: memory.totalJSHeapSize,
            threshold: perfConfig.memoryLeakThreshold,
          });
        }
      }, 30000); // Check every 30 seconds
    }
  }

  /**
   * Set up global error handling
   */
  private setupGlobalErrorHandling(): void {
    if (typeof window !== 'undefined') {
      // Unhandled JavaScript errors
      window.addEventListener('error', (event) => {
        modernLogger.error('Unhandled JavaScript error', event.error, {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
          type: 'javascript_error',
        });
      });

      // Unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        modernLogger.error('Unhandled promise rejection', event.reason, {
          type: 'promise_rejection',
        });
      });

      // Resource loading errors
      window.addEventListener(
        'error',
        (event) => {
          if (event.target && event.target !== window) {
            const target = event.target as HTMLElement & {
              src?: string;
              href?: string;
            };
            modernLogger.error('Resource loading error', undefined, {
              type: 'resource_error',
              source: target.src || target.href || 'unknown',
              tagName: target.tagName || 'unknown',
            });
          }
        },
        true,
      );
    }

    // Node.js error handling
    if (typeof process !== 'undefined') {
      process.on('uncaughtException', (error) => {
        modernLogger.error('Uncaught exception', error, {
          type: 'uncaught_exception',
        });
      });

      process.on('unhandledRejection', (reason, promise) => {
        modernLogger.error('Unhandled rejection', reason as Error, {
          type: 'unhandled_rejection',
          promise: promise.toString(),
        });
      });
    }
  }

  /**
   * Set up periodic log flushing
   */
  private setupLogFlushing(interval: number): void {
    setInterval(async () => {
      try {
        await modernLogger.flushQueue();
      } catch (error) {
        console.error('Error flushing log queue:', error);
      }
    }, interval);

    // Flush on page unload (browser only)
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', async () => {
        await modernLogger.flushQueue();
      });
    }
  }

  /**
   * Get current configuration
   */
  getConfig() {
    return {
      environment: this.environment,
      logging: LOGGING_CONFIGS[this.environment],
      performance: PERFORMANCE_CONFIG[this.environment],
      security: SECURITY_CONFIG[this.environment],
      destinations: LOGGING_DESTINATIONS[this.environment],
    };
  }

  /**
   * Update configuration at runtime
   */
  updateConfig(updates: Partial<typeof LOGGING_CONFIGS.development>): void {
    const currentConfig = LOGGING_CONFIGS[this.environment];
    Object.assign(currentConfig, updates);

    configureLogging({
      logLevel: currentConfig.logLevel,
      enabledSources: currentConfig.enabledSources,
      redactSensitiveData: currentConfig.redactSensitiveData,
    });
  }
}

// Export singleton instance
export const loggingConfigurator = LoggingConfigurator.getInstance();

// Export configuration presets
export { LOGGING_CONFIGS, PERFORMANCE_CONFIG, SECURITY_CONFIG };

// Convenience function to initialize logging
export async function initializeLogging(): Promise<void> {
  await loggingConfigurator.initialize();
}

// Environment-specific helpers
export const isLoggingVerbose = () => {
  const config =
    LOGGING_CONFIGS[process.env.NODE_ENV as keyof typeof LOGGING_CONFIGS];
  return config?.logLevel === 'debug';
};

export const shouldLogPerformance = () => {
  const config =
    LOGGING_CONFIGS[process.env.NODE_ENV as keyof typeof LOGGING_CONFIGS];
  return config?.enablePerformanceLogging ?? false;
};

export const shouldRedactSensitiveData = () => {
  const config =
    LOGGING_CONFIGS[process.env.NODE_ENV as keyof typeof LOGGING_CONFIGS];
  return config?.redactSensitiveData ?? true;
};
