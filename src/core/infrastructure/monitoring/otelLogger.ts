/**
 * OpenTelemetry-compatible logging service for modern observability
 * Mock implementation ready for when OpenTelemetry packages are added
 * Extends the existing logging system with OTel-compatible standards
 */

import { trace } from '@opentelemetry/api';
import { clientLog } from './clientLogger';
import { serverLog } from './serverLogger';

// Type definitions for OpenTelemetry log record
interface OTelLogRecord {
  timestamp: number;
  observedTimestamp: number;
  severityNumber: number;
  severityText: string;
  body: string;
  attributes: Record<string, unknown>;
}

// Mock OpenTelemetry classes until packages are properly installed
class MockLoggerProvider {
  private serviceName: string;

  constructor(config: { serviceName: string }) {
    this.serviceName = config.serviceName;
  }

  getLogger() {
    return {
      emit: (logRecord: OTelLogRecord) => {
        // Mock implementation - could send to external service here
        console.log(`[OTEL-MOCK] ${this.serviceName}:`, logRecord);
      },
    };
  }

  async shutdown(): Promise<void> {
    console.log(`[OTEL-MOCK] Logger provider ${this.serviceName} shut down`);
  }
}

class OTelLogger {
  private isInitialized = false;
  private loggerProvider: MockLoggerProvider | null = null;
  private logger: { emit: (logRecord: OTelLogRecord) => void } | null = null;

  /**
   * Initialize OpenTelemetry logger with configuration
   */
  initialize(
    config: {
      serviceName?: string;
      serviceVersion?: string;
      otlpEndpoint?: string;
      headers?: Record<string, string>;
    } = {},
  ) {
    if (this.isInitialized || typeof window !== 'undefined') {
      return; // Only initialize on server side
    }

    try {
      const {
        serviceName = 'keystroke-app',
        // serviceVersion and other parameters are preserved for future use
      } = config;

      // Create mock logger provider (will be replaced with real implementation)
      this.loggerProvider = new MockLoggerProvider({
        serviceName,
      });

      this.logger = this.loggerProvider.getLogger();
      this.isInitialized = true;

      console.log(
        '✅ OpenTelemetry-compatible logs exporter initialized (mock)',
      );
    } catch (error) {
      console.error(
        '❌ Failed to initialize OpenTelemetry logs exporter:',
        error,
      );
    }
  }

  /**
   * Enhanced logging with OpenTelemetry correlation
   */
  async log(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context?: Record<string, unknown>,
    error?: Error,
  ): Promise<void> {
    // Get current trace context if available
    let traceContext = {};
    try {
      const activeSpan = trace.getActiveSpan();
      const spanContext = activeSpan?.spanContext();

      if (spanContext) {
        traceContext = {
          traceId: spanContext.traceId,
          spanId: spanContext.spanId,
          traceFlags: spanContext.traceFlags,
        };
      }
    } catch {
      // Ignore trace context errors when OpenTelemetry is not fully set up
    }

    const enrichedContext = {
      ...context,
      ...traceContext,
      timestamp: new Date().toISOString(),
      environment: typeof window !== 'undefined' ? 'browser' : 'server',
    };

    // Log to existing system first (maintains backward compatibility)
    if (typeof window !== 'undefined') {
      // Browser environment - use clientLog
      await clientLog(message, level, enrichedContext);
    } else {
      // Server environment - use serverLog (handle debug level)
      if (level === 'debug') {
        // serverLog doesn't support debug level, use info instead
        await serverLog(message, 'info', {
          ...enrichedContext,
          originalLevel: 'debug',
        });
      } else {
        await serverLog(
          message,
          level as 'info' | 'warn' | 'error',
          enrichedContext,
        );
      }
    }

    // Export to OpenTelemetry mock (server-side only)
    if (this.isInitialized && this.logger && typeof window === 'undefined') {
      this.exportToOTel(level, message, enrichedContext, error);
    }
  }

  /**
   * Export log entry to OpenTelemetry collector (mock implementation)
   */
  private exportToOTel(
    level: string,
    message: string,
    context: Record<string, unknown>,
    error?: Error,
  ): void {
    try {
      const attributes: Record<string, unknown> = {
        ...context,
        'log.level': level,
        'service.name': 'keystroke-app',
      };

      // Add error details if present
      if (error) {
        attributes['error.name'] = error.name;
        attributes['error.message'] = error.message;
        attributes['error.stack'] = error.stack;
      }

      // Convert to OpenTelemetry log record
      const logRecord = {
        timestamp: Date.now() * 1000000, // Convert to nanoseconds
        observedTimestamp: Date.now() * 1000000,
        severityNumber: this.getSeverityNumber(level),
        severityText: level.toUpperCase(),
        body: message,
        attributes,
      };

      this.logger?.emit(logRecord);
    } catch (error) {
      console.error('Failed to export log to OpenTelemetry:', error);
    }
  }

  /**
   * Convert log level to OpenTelemetry severity number
   */
  private getSeverityNumber(level: string): number {
    switch (level) {
      case 'debug':
        return 5; // DEBUG
      case 'info':
        return 9; // INFO
      case 'warn':
        return 13; // WARN
      case 'error':
        return 17; // ERROR
      default:
        return 9; // Default to INFO
    }
  }

  /**
   * Convenience methods
   */
  async debug(
    message: string,
    context?: Record<string, unknown>,
  ): Promise<void> {
    return this.log('debug', message, context);
  }

  async info(
    message: string,
    context?: Record<string, unknown>,
  ): Promise<void> {
    return this.log('info', message, context);
  }

  async warn(
    message: string,
    context?: Record<string, unknown>,
  ): Promise<void> {
    return this.log('warn', message, context);
  }

  async error(
    message: string,
    error?: Error,
    context?: Record<string, unknown>,
  ): Promise<void> {
    return this.log('error', message, context, error);
  }

  /**
   * Performance logging with automatic timing
   */
  async performance(
    operation: string,
    duration: number,
    context?: Record<string, unknown>,
  ): Promise<void> {
    const level = duration > 1000 ? 'warn' : 'info';
    return this.log(level, `Performance: ${operation} took ${duration}ms`, {
      ...context,
      operation,
      duration,
      type: 'performance',
    });
  }

  /**
   * Business event logging
   */
  async business(
    event: string,
    context?: Record<string, unknown>,
  ): Promise<void> {
    return this.log('info', `Business event: ${event}`, {
      ...context,
      event,
      type: 'business',
    });
  }

  /**
   * Security event logging
   */
  async security(
    event: string,
    context?: Record<string, unknown>,
  ): Promise<void> {
    return this.log('warn', `Security event: ${event}`, {
      ...context,
      event,
      type: 'security',
    });
  }

  /**
   * Request logging with correlation
   */
  async request(
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: Record<string, unknown>,
  ): Promise<void> {
    return this.log('info', `${method} ${url} ${statusCode}`, {
      ...context,
      httpMethod: method,
      httpUrl: url,
      httpStatusCode: statusCode,
      duration,
      type: 'request',
    });
  }

  /**
   * Shutdown OpenTelemetry logger
   */
  async shutdown(): Promise<void> {
    if (this.loggerProvider) {
      await this.loggerProvider.shutdown();
      this.isInitialized = false;
    }
  }
}

// Export singleton instance
export const otelLogger = new OTelLogger();

// Export convenience functions
export const otelLog = {
  debug: (message: string, context?: Record<string, unknown>) =>
    otelLogger.debug(message, context),
  info: (message: string, context?: Record<string, unknown>) =>
    otelLogger.info(message, context),
  warn: (message: string, context?: Record<string, unknown>) =>
    otelLogger.warn(message, context),
  error: (message: string, error?: Error, context?: Record<string, unknown>) =>
    otelLogger.error(message, error, context),
  performance: (
    operation: string,
    duration: number,
    context?: Record<string, unknown>,
  ) => otelLogger.performance(operation, duration, context),
  business: (event: string, context?: Record<string, unknown>) =>
    otelLogger.business(event, context),
  security: (event: string, context?: Record<string, unknown>) =>
    otelLogger.security(event, context),
  request: (
    method: string,
    url: string,
    statusCode: number,
    duration: number,
    context?: Record<string, unknown>,
  ) => otelLogger.request(method, url, statusCode, duration, context),
};
