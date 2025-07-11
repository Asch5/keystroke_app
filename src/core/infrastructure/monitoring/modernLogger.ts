/**
 * Modern Centralized Logger (2025 Standards)
 * Consolidates all logging approaches with enhanced features
 */

import { clientLog, DebugUtils } from './clientLogger';
import { otelLogger } from './otelLogger';
import { serverLog } from './serverLogger';

// Enhanced log context interface
interface LogContext {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  traceId?: string;
  spanId?: string;
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
  [key: string]: unknown;
}

// Sensitive data patterns to redact
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /credential/i,
  /auth/i,
  /bearer/i,
  /api[_-]?key/i,
  /access[_-]?token/i,
  /refresh[_-]?token/i,
];

// PII patterns to sanitize
const PII_PATTERNS = [
  /email/i,
  /phone/i,
  /ssn/i,
  /credit[_-]?card/i,
  /cvv/i,
  /address/i,
];

class ModernLogger {
  private static instance: ModernLogger;
  private isProduction = process.env.NODE_ENV === 'production';
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = this.isProduction
    ? 'info'
    : 'debug';
  private enabledSources = new Set(['console', 'file', 'otel']);

  private constructor() {
    // Initialize OpenTelemetry logger
    otelLogger.initialize({
      serviceName: 'keystroke-app',
      serviceVersion: process.env.npm_package_version || '1.0.0',
    });
  }

  static getInstance(): ModernLogger {
    if (!ModernLogger.instance) {
      ModernLogger.instance = new ModernLogger();
    }
    return ModernLogger.instance;
  }

  /**
   * Configure logger settings
   */
  configure(config: {
    logLevel?: 'debug' | 'info' | 'warn' | 'error';
    enabledSources?: readonly ('console' | 'file' | 'otel')[];
    redactSensitiveData?: boolean;
  }): void {
    if (config.logLevel) {
      this.logLevel = config.logLevel;
    }
    if (config.enabledSources) {
      this.enabledSources = new Set(config.enabledSources);
    }
  }

  /**
   * Sanitize sensitive data from logs
   */
  private sanitizeData(data: unknown): unknown {
    if (!data || typeof data !== 'object') {
      return data;
    }

    if (Array.isArray(data)) {
      return data.map((item) => this.sanitizeData(item));
    }

    const sanitized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data)) {
      const keyLower = key.toLowerCase();

      // Check for sensitive data patterns
      const isSensitive = SENSITIVE_PATTERNS.some((pattern) =>
        pattern.test(keyLower),
      );
      const isPII = PII_PATTERNS.some((pattern) => pattern.test(keyLower));

      if (isSensitive) {
        sanitized[key] = '[REDACTED]';
      } else if (isPII && this.isProduction) {
        sanitized[key] = '[PII_MASKED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Check if log level should be processed
   */
  private shouldLog(level: 'debug' | 'info' | 'warn' | 'error'): boolean {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    return levels[level] >= levels[this.logLevel];
  }

  /**
   * Enhanced logging with automatic sanitization and multiple outputs
   */
  private async logToAll(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context?: LogContext,
    error?: Error,
  ): Promise<void> {
    if (!this.shouldLog(level)) {
      return;
    }

    // Sanitize context data
    const sanitizedContext = context
      ? (this.sanitizeData(context) as LogContext)
      : undefined;

    // Add automatic context enhancement
    const enhancedContext: LogContext = {
      ...sanitizedContext,
      timestamp: new Date().toISOString(),
      environment: this.isProduction ? 'production' : 'development',
      source: typeof window !== 'undefined' ? 'browser' : 'server',
      ...(error && {
        errorName: error.name,
        errorMessage: error.message,
        errorStack: this.isDevelopment ? error.stack : undefined,
      }),
    };

    // Log to enabled sources
    const promises: Promise<void>[] = [];

    if (this.enabledSources.has('console') || this.enabledSources.has('file')) {
      if (typeof window !== 'undefined') {
        promises.push(clientLog(message, level, enhancedContext));
      } else {
        if (level === 'debug') {
          // serverLog doesn't support debug level, use info instead
          promises.push(
            serverLog(message, 'info', {
              ...enhancedContext,
              originalLevel: 'debug',
            }),
          );
        } else {
          promises.push(serverLog(message, level, enhancedContext));
        }
      }
    }

    if (this.enabledSources.has('otel')) {
      promises.push(otelLogger.log(level, message, enhancedContext, error));
    }

    await Promise.allSettled(promises);
  }

  /**
   * Core logging methods
   */
  async debug(message: string, context?: LogContext): Promise<void> {
    return this.logToAll('debug', message, context);
  }

  async info(message: string, context?: LogContext): Promise<void> {
    return this.logToAll('info', message, context);
  }

  async warn(message: string, context?: LogContext): Promise<void> {
    return this.logToAll('warn', message, context);
  }

  async error(
    message: string,
    error?: Error,
    context?: LogContext,
  ): Promise<void> {
    return this.logToAll('error', message, context, error);
  }

  /**
   * Specialized logging methods for different use cases
   */

  // User action logging
  async userAction(
    action: string,
    component: string,
    context?: LogContext,
  ): Promise<void> {
    return this.info(`User action: ${action}`, {
      ...context,
      type: 'user_action',
      action,
      component,
    });
  }

  // API call logging
  async apiCall(
    method: string,
    url: string,
    statusCode?: number,
    duration?: number,
    context?: LogContext,
  ): Promise<void> {
    const level = statusCode && statusCode >= 400 ? 'error' : 'info';
    return this.logToAll(level, `API ${method} ${url}`, {
      ...context,
      type: 'api_call',
      httpMethod: method,
      httpUrl: url,
      httpStatusCode: statusCode,
      duration,
    });
  }

  // Performance logging
  async performance(
    operation: string,
    duration: number,
    context?: LogContext,
  ): Promise<void> {
    const level = duration > 1000 ? 'warn' : 'info';
    return this.logToAll(level, `Performance: ${operation} (${duration}ms)`, {
      ...context,
      type: 'performance',
      operation,
      duration,
    });
  }

  // Security event logging
  async security(event: string, context?: LogContext): Promise<void> {
    return this.warn(`Security: ${event}`, {
      ...context,
      type: 'security',
      event,
    });
  }

  // Business logic logging
  async business(event: string, context?: LogContext): Promise<void> {
    return this.info(`Business: ${event}`, {
      ...context,
      type: 'business',
      event,
    });
  }

  // Navigation/routing logging
  async navigation(
    from: string,
    to: string,
    context?: LogContext,
  ): Promise<void> {
    return this.info(`Navigation: ${from} → ${to}`, {
      ...context,
      type: 'navigation',
      from,
      to,
    });
  }

  // Database operation logging
  async database(
    operation: string,
    table: string,
    duration?: number,
    context?: LogContext,
  ): Promise<void> {
    return this.info(`DB: ${operation} on ${table}`, {
      ...context,
      type: 'database',
      operation,
      table,
      duration,
    });
  }

  // Component lifecycle logging
  async lifecycle(
    component: string,
    phase: 'mount' | 'unmount' | 'render' | 'update',
    context?: LogContext,
  ): Promise<void> {
    return this.debug(`Component ${component}: ${phase}`, {
      ...context,
      type: 'lifecycle',
      component,
      phase,
    });
  }

  /**
   * Batch logging for high-volume scenarios
   */
  private logQueue: Array<{
    level: 'debug' | 'info' | 'warn' | 'error';
    message: string;
    context?: LogContext;
    error?: Error;
  }> = [];

  queueLog(
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    context?: LogContext,
    error?: Error,
  ): void {
    this.logQueue.push({
      level,
      message,
      ...(context && { context }),
      ...(error && { error }),
    });
  }

  async flushQueue(): Promise<void> {
    const batch = [...this.logQueue];
    this.logQueue.length = 0;

    await Promise.allSettled(
      batch.map(({ level, message, context, error }) =>
        this.logToAll(level, message, context, error),
      ),
    );
  }

  /**
   * Integration with existing debug system
   */
  getDebugAnalysis() {
    return DebugUtils.getAllLogs();
  }

  searchLogs(query: string) {
    return DebugUtils.searchLogs(query);
  }

  getLogStats() {
    return DebugUtils.getLogStats();
  }

  /**
   * Shutdown all logging systems
   */
  async shutdown(): Promise<void> {
    await this.flushQueue();
    await otelLogger.shutdown();
  }
}

// Export singleton instance
export const modernLogger = ModernLogger.getInstance();

// Export convenience functions with automatic context enrichment
export const log = {
  debug: (message: string, context?: LogContext) =>
    modernLogger.debug(message, context),
  info: (message: string, context?: LogContext) =>
    modernLogger.info(message, context),
  warn: (message: string, context?: LogContext) =>
    modernLogger.warn(message, context),
  error: (message: string, error?: Error, context?: LogContext) =>
    modernLogger.error(message, error, context),

  // Specialized logging
  userAction: (action: string, component: string, context?: LogContext) =>
    modernLogger.userAction(action, component, context),
  apiCall: (
    method: string,
    url: string,
    statusCode?: number,
    duration?: number,
    context?: LogContext,
  ) => modernLogger.apiCall(method, url, statusCode, duration, context),
  performance: (operation: string, duration: number, context?: LogContext) =>
    modernLogger.performance(operation, duration, context),
  security: (event: string, context?: LogContext) =>
    modernLogger.security(event, context),
  business: (event: string, context?: LogContext) =>
    modernLogger.business(event, context),
  navigation: (from: string, to: string, context?: LogContext) =>
    modernLogger.navigation(from, to, context),
  database: (
    operation: string,
    table: string,
    duration?: number,
    context?: LogContext,
  ) => modernLogger.database(operation, table, duration, context),
  lifecycle: (
    component: string,
    phase: 'mount' | 'unmount' | 'render' | 'update',
    context?: LogContext,
  ) => modernLogger.lifecycle(component, phase, context),
};

// Configuration helper
export const configureLogging = (config: {
  logLevel?: 'debug' | 'info' | 'warn' | 'error';
  enabledSources?: readonly ('console' | 'file' | 'otel')[];
  redactSensitiveData?: boolean;
}) => modernLogger.configure(config);
