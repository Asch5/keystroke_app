'use server';

import fs from 'fs/promises';
import path from 'path';

/**
 * Logs a message to a server-side log file with timestamp and optional context.
 * This function can only be called from server components or server actions.
 */
export async function serverLog(
  message: string,
  level: 'info' | 'warn' | 'error',
  context?: unknown,
): Promise<void> {
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
  const logFilePath = path.join(process.cwd(), 'logs', 'server.log');
  const logEntry = `${logOutput}\n`; // Add newline for each entry

  try {
    await fs.mkdir(path.dirname(logFilePath), { recursive: true });
    await fs.appendFile(logFilePath, logEntry);
  } catch (err) {
    console.error(`[${timestamp}] [ERROR] Failed to write to log file:`, err);
  }
}
