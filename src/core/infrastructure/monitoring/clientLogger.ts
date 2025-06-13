/**
 * Client-side logging utility with environment detection and autonomous debugging capabilities.
 * Handles both browser and server-side environments appropriately.
 */

// Environment detection utilities
const isBrowser = () => typeof window !== 'undefined';
const isServer = () => typeof window === 'undefined';
const isDevelopment = () => process.env.NODE_ENV === 'development';

// Type definitions for better type safety
type LogLevel = 'debug' | 'info' | 'warn' | 'error';
type LogContext =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: LogContext;
  environment: 'browser' | 'server';
  url?: string;
  userAgent?: string;
}

// In-memory log storage for autonomous debugging
class LogStorage {
  private logs: LogEntry[] = [];
  private maxLogs = 1000; // Prevent memory leaks

  add(entry: LogEntry): void {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift(); // Remove oldest log
    }
  }

  getAll(): LogEntry[] {
    return [...this.logs];
  }

  getByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter((log) => log.level === level);
  }

  getRecent(count: number = 50): LogEntry[] {
    return this.logs.slice(-count);
  }

  clear(): void {
    this.logs.length = 0;
  }

  search(query: string): LogEntry[] {
    const lowerQuery = query.toLowerCase();
    return this.logs.filter(
      (log) =>
        log.message.toLowerCase().includes(lowerQuery) ||
        JSON.stringify(log.context).toLowerCase().includes(lowerQuery),
    );
  }
}

// Global log storage instance
const logStorage = new LogStorage();

/**
 * Core logging function with environment-aware behavior
 */
export async function clientLog(
  message: string,
  level: LogLevel = 'info',
  context?: LogContext,
  force = false,
): Promise<void> {
  if (!isDevelopment() && !force) return;

  const timestamp = new Date().toISOString();
  const logOutput = `[${timestamp}] [${level.toUpperCase()}] ${message}`;

  // Create log entry for storage
  const logEntry: LogEntry = {
    timestamp,
    level,
    message,
    environment: isBrowser() ? 'browser' : 'server',
    ...(context !== undefined && { context }),
    ...(isBrowser() && {
      url: window.location.href,
      userAgent: navigator.userAgent,
    }),
  };

  // Store log for autonomous debugging
  logStorage.add(logEntry);

  // Console logging (works in both environments)
  if (context !== undefined) {
    try {
      console[level](logOutput, context);
    } catch {
      console[level](logOutput, '[Unable to log context]');
    }
  } else {
    console[level](logOutput);
  }

  // Server-side file logging with safe dynamic imports
  if (isServer()) {
    try {
      // Use eval to prevent webpack from analyzing the import
      const dynamicImport = new Function(
        'specifier',
        'return import(specifier)',
      );

      Promise.all([dynamicImport('fs/promises'), dynamicImport('path')])
        .then(async ([fs, path]) => {
          const logFilePath = path.join(process.cwd(), 'logs', 'client.log');
          const logEntryString = JSON.stringify(logEntry) + '\n';

          await fs.mkdir(path.dirname(logFilePath), { recursive: true });
          await fs.appendFile(logFilePath, logEntryString);
        })
        .catch((err) => {
          console.error(
            `[${timestamp}] [ERROR] Failed to write to client.log:`,
            err,
          );
        });
    } catch {
      // Fallback to console logging
      console.log(`[SERVER] ${logOutput}`, context);
    }
  }

  // Browser-side storage (localStorage for persistence)
  if (isBrowser()) {
    try {
      const existingLogs = localStorage.getItem('keystroke_client_logs');
      const logs: LogEntry[] = existingLogs ? JSON.parse(existingLogs) : [];
      logs.push(logEntry);

      // Keep only last 500 logs in localStorage to prevent storage bloat
      if (logs.length > 500) {
        logs.splice(0, logs.length - 500);
      }

      localStorage.setItem('keystroke_client_logs', JSON.stringify(logs));
    } catch (err) {
      console.warn('Failed to store log in localStorage:', err);
    }
  }
}

/**
 * Autonomous debugging utilities for AI system
 */
export const DebugUtils = {
  /**
   * Get all logs for autonomous analysis
   */
  getAllLogs(): LogEntry[] {
    return logStorage.getAll();
  },

  /**
   * Get recent logs for quick debugging
   */
  getRecentLogs(count: number = 50): LogEntry[] {
    return logStorage.getRecent(count);
  },

  /**
   * Get error logs for issue identification
   */
  getErrorLogs(): LogEntry[] {
    return logStorage.getByLevel('error');
  },

  /**
   * Search logs by content for specific issues
   */
  searchLogs(query: string): LogEntry[] {
    return logStorage.search(query);
  },

  /**
   * Get browser console logs (if available)
   */
  getBrowserLogs(): LogEntry[] {
    if (!isBrowser()) return [];

    try {
      const stored = localStorage.getItem('keystroke_client_logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  /**
   * Export logs for analysis
   */
  exportLogs(): string {
    const allLogs = this.getAllLogs();
    const browserLogs = this.getBrowserLogs();

    return JSON.stringify(
      {
        memoryLogs: allLogs,
        browserLogs: browserLogs,
        exportedAt: new Date().toISOString(),
        environment: isBrowser() ? 'browser' : 'server',
      },
      null,
      2,
    );
  },

  /**
   * Clear all logs
   */
  clearLogs(): void {
    logStorage.clear();
    if (isBrowser()) {
      localStorage.removeItem('keystroke_client_logs');
    }
  },

  /**
   * Get log statistics for autonomous monitoring
   */
  getLogStats(): {
    total: number;
    byLevel: Record<LogLevel, number>;
    recentErrors: LogEntry[];
    environment: string;
  } {
    const logs = logStorage.getAll();
    const stats = {
      total: logs.length,
      byLevel: {
        debug: 0,
        info: 0,
        warn: 0,
        error: 0,
      } as Record<LogLevel, number>,
      recentErrors: logs.filter((log) => log.level === 'error').slice(-10),
      environment: isBrowser() ? 'browser' : 'server',
    };

    logs.forEach((log) => {
      stats.byLevel[log.level]++;
    });

    return stats;
  },

  /**
   * Monitor for specific patterns (autonomous debugging)
   */
  monitorPatterns(patterns: string[]): LogEntry[] {
    const logs = logStorage.getAll();
    return logs.filter((log) =>
      patterns.some(
        (pattern) =>
          log.message.toLowerCase().includes(pattern.toLowerCase()) ||
          JSON.stringify(log.context)
            .toLowerCase()
            .includes(pattern.toLowerCase()),
      ),
    );
  },
};

/**
 * Convenience functions with proper async handling
 */
export async function debugLog(
  message: string,
  context?: LogContext,
): Promise<void> {
  return clientLog(message, 'debug', context);
}

export async function infoLog(
  message: string,
  context?: LogContext,
): Promise<void> {
  return clientLog(message, 'info', context);
}

export async function warnLog(
  message: string,
  context?: LogContext,
): Promise<void> {
  return clientLog(message, 'warn', context);
}

export async function errorLog(
  message: string,
  context?: LogContext,
): Promise<void> {
  return clientLog(message, 'error', context);
}

/**
 * Synchronous convenience functions for fire-and-forget logging
 */
export function debugLogSync(message: string, context?: LogContext): void {
  clientLog(message, 'debug', context).catch((err) =>
    console.error('Failed to log debug message:', err),
  );
}

export function infoLogSync(message: string, context?: LogContext): void {
  clientLog(message, 'info', context).catch((err) =>
    console.error('Failed to log info message:', err),
  );
}

export function warnLogSync(message: string, context?: LogContext): void {
  clientLog(message, 'warn', context).catch((err) =>
    console.error('Failed to log warn message:', err),
  );
}

export function errorLogSync(message: string, context?: LogContext): void {
  clientLog(message, 'error', context).catch((err) =>
    console.error('Failed to log error message:', err),
  );
}

/**
 * Global error handler for autonomous debugging
 */
if (isBrowser()) {
  window.addEventListener('error', (event) => {
    errorLogSync('Uncaught Error', {
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error?.stack,
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    errorLogSync('Unhandled Promise Rejection', {
      reason: event.reason,
      promise: event.promise,
    });
  });
}

// Export for global access in development
if (isDevelopment() && isBrowser()) {
  (window as unknown as Record<string, unknown>).KeystrokeDebug = DebugUtils;
}
