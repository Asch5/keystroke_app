/**
 * Logs a message with a timestamp and optional context.
 * This version is safe to use in both client and server code.
 * @param message The message to log.
 * @param level The log level (INFO, WARN, ERROR). Defaults to INFO.
 * @param context Optional context data to include with the log.
 */
export function clientLog(
  message: string,
  level: 'info' | 'warn' | 'error',
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
    case 'warn':
      console.warn(logOutput);
      break;
    case 'error':
      console.error(logOutput);
      break;
    case 'info':
    default:
      console.log(logOutput);
  }
}
