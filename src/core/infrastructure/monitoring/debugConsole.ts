/**
 * Debug Console Utility
 *
 * Provides convenient functions for developers to access organized debug information
 * from the browser console. Eliminates the need to manually copy scattered console logs.
 *
 * Usage in browser console:
 * - window.debug.status() - Get current debug status
 * - window.debug.report() - Get full debug report
 * - window.debug.export() - Export all debug data
 * - window.debug.issues() - Get current issues summary
 * - window.debug.clear() - Clear debug session
 */

import { DebugUtils } from './clientLogger';
import { debugReader } from './debugReader';
import PracticeDebugger from './practiceDebugger';

interface DebugConsole {
  /**
   * Get current practice debug status
   */
  status(): void;

  /**
   * Generate and display full debug report
   */
  report(): Promise<void>;

  /**
   * Export all debug data as JSON
   */
  export(): string;

  /**
   * Get current issues summary
   */
  issues(): {
    summary: ReturnType<typeof PracticeDebugger.getDebugSummary>;
    systemHealth: ReturnType<typeof debugReader.getSystemHealthReport>;
  };

  /**
   * Clear current debug session
   */
  clear(): void;

  /**
   * Get recent logs for quick debugging
   */
  logs(count?: number): void;

  /**
   * Search logs for specific content
   */
  search(query: string): void;

  /**
   * Get help information
   */
  help(): void;
}

export const debugConsole: DebugConsole = {
  status() {
    const summary = PracticeDebugger.getDebugSummary();
    const logStats = DebugUtils.getLogStats();

    console.group('🔧 Practice Debug Status');
    console.log('Session ID:', summary.sessionId ?? 'No active session');
    console.log('Issues Found:', summary.issues);
    console.log('Quick Fixes:', summary.quickFixes);

    console.groupCollapsed('📊 Log Statistics');
    console.log('Total Logs:', logStats.total);
    console.log('By Level:', logStats.byLevel);
    console.log('Environment:', logStats.environment);
    console.groupEnd();

    if (summary.recommendations.length > 0) {
      console.groupCollapsed('💡 Recommendations');
      summary.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
      console.groupEnd();
    }

    console.groupEnd();
  },

  async report() {
    console.group('📋 Full Practice Debug Report');

    try {
      const practiceReport = await PracticeDebugger.generateDebugReport();
      const systemHealth = await debugReader.getSystemHealthReport();

      if (practiceReport) {
        console.groupCollapsed('🎯 Practice Session Report');
        console.log('Session:', practiceReport.session);
        console.log(
          'Current Word:',
          practiceReport.currentWord?.currentWord?.wordText ?? 'None',
        );
        console.log('Issues:', practiceReport.issues);
        console.log('Recommendations:', practiceReport.recommendations);
        console.groupEnd();
      }

      console.groupCollapsed('🏥 System Health');
      console.log('Status:', systemHealth.status);
      console.log('Metrics:', systemHealth.metrics);
      console.log('Issues:', systemHealth.issues);
      console.groupEnd();
    } catch (error) {
      console.error('Failed to generate report:', error);
    }

    console.groupEnd();
  },

  export() {
    const practiceData = PracticeDebugger.exportDebugData();
    const systemData = DebugUtils.exportLogs();

    const combinedData = {
      timestamp: new Date().toISOString(),
      practice: JSON.parse(practiceData),
      system: JSON.parse(systemData),
    };

    const dataStr = JSON.stringify(combinedData, null, 2);

    console.group('📤 Debug Data Export');
    console.log('Copy the following JSON data:');
    console.log(dataStr);
    console.groupEnd();

    return dataStr;
  },

  issues() {
    const summary = PracticeDebugger.getDebugSummary();
    const systemHealth = debugReader.getSystemHealthReport();

    console.group('⚠️ Current Issues Summary');

    console.groupCollapsed('🎯 Practice Issues');
    console.log('Total Issues:', summary.issues);
    console.log('Quick Fixes:', summary.quickFixes);
    console.groupEnd();

    console.groupCollapsed('🏥 System Issues');
    systemHealth.then((health) => {
      console.log('Status:', health.status);
      console.log('Authentication:', health.issues.authentication);
      console.log('Database:', health.issues.database);
      console.log('API:', health.issues.api);
      console.log('Performance:', health.issues.performance);
    });
    console.groupEnd();

    console.groupEnd();

    return {
      summary,
      systemHealth,
    };
  },

  clear() {
    PracticeDebugger.clearSession();
    DebugUtils.clearLogs();
    console.log('🧹 Debug session cleared');
  },

  logs(count = 20) {
    const recentLogs = DebugUtils.getRecentLogs(count);

    console.group(`📜 Recent Logs (${count})`);
    recentLogs.forEach((log) => {
      const method =
        log.level === 'error' ? 'error' : log.level === 'warn' ? 'warn' : 'log';
      console[method](`[${log.timestamp}] ${log.message}`, log.context ?? '');
    });
    console.groupEnd();
  },

  search(query: string) {
    const results = DebugUtils.searchLogs(query);

    console.group(`🔍 Search Results for "${query}" (${results.length})`);
    results.forEach((log) => {
      const method =
        log.level === 'error' ? 'error' : log.level === 'warn' ? 'warn' : 'log';
      console[method](`[${log.timestamp}] ${log.message}`, log.context ?? '');
    });
    console.groupEnd();
  },

  help() {
    console.group('🚀 Debug Console Help');
    console.log('Available commands:');
    console.log('');
    console.log('📊 debug.status()     - Get current debug status');
    console.log('📋 debug.report()     - Generate full debug report');
    console.log('📤 debug.export()     - Export all debug data as JSON');
    console.log('⚠️  debug.issues()     - Get issues summary');
    console.log('🧹 debug.clear()      - Clear debug session');
    console.log('📜 debug.logs(20)     - Show recent logs (default: 20)');
    console.log('🔍 debug.search(text) - Search logs for specific text');
    console.log('🚀 debug.help()       - Show this help');
    console.log('');
    console.log('Examples:');
    console.log('  debug.search("audio")     - Find audio-related logs');
    console.log('  debug.search("image")     - Find image-related logs');
    console.log('  debug.logs(50)            - Show last 50 log entries');
    console.groupEnd();
  },
};

// Make available globally in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  (window as unknown as { debug: DebugConsole }).debug = debugConsole;

  // Show welcome message
  console.log(
    '🔧 Debug Console initialized! Type debug.help() for available commands.',
  );
}

export default debugConsole;
