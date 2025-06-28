import {
  infoLog,
  warnLog,
  errorLog,
} from '@/core/infrastructure/monitoring/clientLogger';

type LogContext =
  | Record<string, unknown>
  | unknown[]
  | string
  | number
  | boolean
  | null;

/**
 * @deprecated This utility is deprecated. Please use the logging functions from
 * '@/core/infrastructure/monitoring/clientLogger' instead:
 * - debugLog(message, context)
 * - infoLog(message, context)
 * - warnLog(message, context)
 * - errorLog(message, context)
 * - clientLog(message, level, context)
 *
 * Legacy logging utility for backward compatibility.
 * This version is safe to use in both client and server code.
 * @param message The message to log.
 * @param level The log level (INFO, WARN, ERROR). Defaults to INFO.
 * @param context Optional context data to include with the log.
 */
export async function clientLog(
  message: string,
  level: 'info' | 'warn' | 'error' = 'info',
  context?: LogContext,
): Promise<void> {
  // Use the proper logging infrastructure
  switch (level) {
    case 'warn':
      await warnLog(message, context);
      break;
    case 'error':
      await errorLog(message, context);
      break;
    case 'info':
    default:
      await infoLog(message, context);
  }
}

// Export convenience functions for easier migration
export {
  infoLog,
  warnLog,
  errorLog,
} from '@/core/infrastructure/monitoring/clientLogger';

// Also export debugLog separately for completeness
export { debugLog } from '@/core/infrastructure/monitoring/clientLogger';
