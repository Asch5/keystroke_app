import fs from 'fs/promises'; // Import for async file operations
import path from 'path'; // For handling file paths

export enum LogLevel {
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Logs a message on the server side with a timestamp and optional context.
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

  // Write to log file asynchronously
  const logFilePath = path.join(process.cwd(), 'logs', 'server.log'); // Path relative to project root
  const logEntry = `${logOutput}\n`; // Add newline for each entry

  fs.mkdir(path.dirname(logFilePath), { recursive: true }) // Ensure directory exists
    .then(() => fs.appendFile(logFilePath, logEntry))
    .catch((err) => {
      console.error(`[${timestamp}] [ERROR] Failed to write to log file:`, err);
    });

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
