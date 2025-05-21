export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Logs a message with a timestamp and optional context.
 * This version is safe to use in both client and server code.
 * @param message The message to log.
 * @param level The log level (INFO, WARN, ERROR). Defaults to INFO.
 * @param context Optional context data to include with the log.
 */
export function serverLog(
  message: string,
  level: LogLevel = LogLevel.INFO,
  context?: unknown,
): void {
  const timestamp = new Date().toISOString();
  let logOutput = `[${timestamp}] [${level}] ${message}`;

  if (context !== undefined) {
    try {
      logOutput += ` Context: ${JSON.stringify(context)}`;
    } catch (e) {
      logOutput += ` Context: [Unable to stringify context]`;
      console.error(
        `[${timestamp}] [ERROR] Failed to stringify log context:`,
        e,
      );
    }
  }

  // Console logging based on level
  switch (level) {
    case LogLevel.WARN:
      console.warn(logOutput);
      break;
    case LogLevel.ERROR:
      console.error(logOutput);
      break;
    case LogLevel.INFO:
    default:
      console.log(logOutput);
  }
}
