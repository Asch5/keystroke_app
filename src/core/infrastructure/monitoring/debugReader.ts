/**
 * Debug Reader - Autonomous debugging utility for AI system
 * Provides tools to read, analyze, and interpret logs automatically
 */

import { DebugUtils } from './clientLogger';
import { serverLog } from './serverLogger';

// Type definitions for better type safety
interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error';
  message: string;
  context?: unknown;
  environment: 'browser' | 'server';
  url?: string;
  userAgent?: string;
}

interface LogStats {
  total: number;
  byLevel: {
    debug: number;
    info: number;
    warn: number;
    error: number;
  };
  recentErrors: LogEntry[];
  environment: string;
}

export interface DebugAnalysis {
  summary: {
    totalLogs: number;
    errorCount: number;
    warningCount: number;
    recentActivity: boolean;
    criticalIssues: string[];
  };
  patterns: {
    commonErrors: Array<{ pattern: string; count: number; examples: string[] }>;
    performanceIssues: string[];
    userExperience: string[];
  };
  recommendations: string[];
  environment: {
    browser: boolean;
    server: boolean;
    development: boolean;
  };
}

export class DebugReader {
  /**
   * Autonomous log analysis for AI debugging
   */
  static async analyzeCurrentState(): Promise<DebugAnalysis> {
    const stats = DebugUtils.getLogStats();
    const recentLogs = DebugUtils.getRecentLogs(100);
    const errorLogs = DebugUtils.getErrorLogs();

    // Analyze patterns
    const commonErrors = this.findCommonErrorPatterns(errorLogs);
    const performanceIssues = this.detectPerformanceIssues(recentLogs);
    const uxIssues = this.detectUXIssues(recentLogs);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      stats,
      errorLogs,
      recentLogs,
    );

    // Check for critical issues
    const criticalIssues = this.identifyCriticalIssues(errorLogs);

    const analysis: DebugAnalysis = {
      summary: {
        totalLogs: stats.total,
        errorCount: stats.byLevel.error,
        warningCount: stats.byLevel.warn,
        recentActivity: recentLogs.length > 0,
        criticalIssues,
      },
      patterns: {
        commonErrors,
        performanceIssues,
        userExperience: uxIssues,
      },
      recommendations,
      environment: {
        browser: typeof window !== 'undefined',
        server: typeof window === 'undefined',
        development: process.env.NODE_ENV === 'development',
      },
    };

    // Log the analysis for future reference
    void serverLog('Debug analysis completed', 'info', {
      analysisId: Date.now(),
      summary: analysis.summary,
      criticalIssuesCount: criticalIssues.length,
    });

    return analysis;
  }

  /**
   * Search for specific issues in logs
   */
  static searchForIssue(query: string): Array<{
    timestamp: string;
    level: string;
    message: string;
    context?: unknown;
  }> {
    const results = DebugUtils.searchLogs(query);
    return results.map((log) => ({
      timestamp: log.timestamp,
      level: log.level,
      message: log.message,
      context: log.context,
    }));
  }

  /**
   * Monitor for authentication issues
   */
  static checkAuthenticationIssues(): string[] {
    const authPatterns = [
      'authentication failed',
      'unauthorized',
      'token expired',
      'session invalid',
      'login error',
      'auth error',
    ];

    const issues: string[] = [];
    authPatterns.forEach((pattern) => {
      const matches = DebugUtils.searchLogs(pattern);
      if (matches.length > 0) {
        issues.push(`Found ${matches.length} instances of "${pattern}"`);
      }
    });

    return issues;
  }

  /**
   * Monitor for database issues
   */
  static checkDatabaseIssues(): string[] {
    const dbPatterns = [
      'prisma error',
      'database connection',
      'query failed',
      'transaction failed',
      'constraint violation',
      'foreign key',
    ];

    const issues: string[] = [];
    dbPatterns.forEach((pattern) => {
      const matches = DebugUtils.searchLogs(pattern);
      if (matches.length > 0) {
        issues.push(`Found ${matches.length} database issues: "${pattern}"`);
      }
    });

    return issues;
  }

  /**
   * Monitor for API issues
   */
  static checkAPIIssues(): string[] {
    const apiPatterns = [
      'api error',
      'fetch failed',
      'network error',
      'timeout',
      'rate limit',
      'server error',
      '500',
      '404',
      '403',
    ];

    const issues: string[] = [];
    apiPatterns.forEach((pattern) => {
      const matches = DebugUtils.searchLogs(pattern);
      if (matches.length > 0) {
        issues.push(`Found ${matches.length} API issues: "${pattern}"`);
      }
    });

    return issues;
  }

  /**
   * Get comprehensive system health report
   */
  static async getSystemHealthReport(): Promise<{
    status: 'healthy' | 'warning' | 'critical';
    issues: {
      authentication: string[];
      database: string[];
      api: string[];
      performance: string[];
      userExperience: string[];
    };
    metrics: {
      errorRate: number;
      recentErrors: number;
      systemLoad: string;
    };
    recommendations: string[];
  }> {
    const authIssues = this.checkAuthenticationIssues();
    const dbIssues = this.checkDatabaseIssues();
    const apiIssues = this.checkAPIIssues();
    const stats = DebugUtils.getLogStats();
    const recentLogs = DebugUtils.getRecentLogs(50);
    const performanceIssues = this.detectPerformanceIssues(recentLogs);
    const uxIssues = this.detectUXIssues(recentLogs);

    const totalIssues = authIssues.length + dbIssues.length + apiIssues.length;
    const errorRate =
      stats.total > 0 ? (stats.byLevel.error / stats.total) * 100 : 0;
    const recentErrors = recentLogs.filter(
      (log) => log.level === 'error',
    ).length;

    let status: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (totalIssues > 10 || errorRate > 20) {
      status = 'critical';
    } else if (totalIssues > 5 || errorRate > 10) {
      status = 'warning';
    }

    const recommendations = this.generateSystemRecommendations(
      authIssues,
      dbIssues,
      apiIssues,
      errorRate,
      recentErrors,
    );

    return {
      status,
      issues: {
        authentication: authIssues,
        database: dbIssues,
        api: apiIssues,
        performance: performanceIssues,
        userExperience: uxIssues,
      },
      metrics: {
        errorRate: Math.round(errorRate * 100) / 100,
        recentErrors,
        systemLoad: this.assessSystemLoad(stats),
      },
      recommendations,
    };
  }

  /**
   * Export logs for external analysis
   */
  static exportLogsForAnalysis(): string {
    return DebugUtils.exportLogs();
  }

  // Private helper methods with proper typing
  private static findCommonErrorPatterns(
    errorLogs: LogEntry[],
  ): Array<{ pattern: string; count: number; examples: string[] }> {
    const patterns: Record<string, { count: number; examples: string[] }> = {};

    errorLogs.forEach((log) => {
      const message = log.message.toLowerCase();

      // Common error patterns
      const commonPatterns = [
        'network error',
        'authentication',
        'database',
        'validation',
        'timeout',
        'not found',
        'permission denied',
        'server error',
      ];

      commonPatterns.forEach((pattern) => {
        if (message.includes(pattern)) {
          if (!patterns[pattern]) {
            patterns[pattern] = { count: 0, examples: [] };
          }
          patterns[pattern].count++;
          if (patterns[pattern].examples.length < 3) {
            patterns[pattern].examples.push(log.message);
          }
        }
      });
    });

    return Object.entries(patterns).map(([pattern, data]) => ({
      pattern,
      count: data.count,
      examples: data.examples,
    }));
  }

  private static detectPerformanceIssues(logs: LogEntry[]): string[] {
    const issues: string[] = [];
    const performanceKeywords = [
      'slow',
      'timeout',
      'performance',
      'lag',
      'delay',
    ];

    performanceKeywords.forEach((keyword) => {
      const matches = logs.filter(
        (log) =>
          log.message.toLowerCase().includes(keyword) ||
          (log.context &&
            JSON.stringify(log.context).toLowerCase().includes(keyword)),
      );

      if (matches.length > 0) {
        issues.push(
          `Performance issue detected: ${keyword} (${matches.length} occurrences)`,
        );
      }
    });

    return issues;
  }

  private static detectUXIssues(logs: LogEntry[]): string[] {
    const issues: string[] = [];
    const uxKeywords = [
      'user error',
      'ui error',
      'click failed',
      'form error',
      'navigation',
    ];

    uxKeywords.forEach((keyword) => {
      const matches = logs.filter(
        (log) =>
          log.message.toLowerCase().includes(keyword) ||
          (log.context &&
            JSON.stringify(log.context).toLowerCase().includes(keyword)),
      );

      if (matches.length > 0) {
        issues.push(
          `UX issue detected: ${keyword} (${matches.length} occurrences)`,
        );
      }
    });

    return issues;
  }

  private static generateRecommendations(
    stats: LogStats,
    errorLogs: LogEntry[],
    recentLogs: LogEntry[],
  ): string[] {
    const recommendations: string[] = [];

    if (stats.byLevel.error > 10) {
      recommendations.push(
        'High error count detected. Review error logs and implement fixes.',
      );
    }

    if (stats.byLevel.warn > 20) {
      recommendations.push(
        'Many warnings detected. Address warnings to prevent future errors.',
      );
    }

    if (errorLogs.length > 0) {
      recommendations.push(
        'Recent errors found. Investigate and resolve critical issues.',
      );
    }

    if (recentLogs.length === 0) {
      recommendations.push(
        'No recent activity. System may be idle or logging may be disabled.',
      );
    }

    return recommendations;
  }

  private static identifyCriticalIssues(errorLogs: LogEntry[]): string[] {
    const critical: string[] = [];

    // Check for authentication failures
    const authErrors = errorLogs.filter(
      (log) =>
        log.message.toLowerCase().includes('auth') ||
        log.message.toLowerCase().includes('unauthorized'),
    );
    if (authErrors.length > 5) {
      critical.push('Multiple authentication failures detected');
    }

    // Check for database issues
    const dbErrors = errorLogs.filter(
      (log) =>
        log.message.toLowerCase().includes('database') ||
        log.message.toLowerCase().includes('prisma'),
    );
    if (dbErrors.length > 3) {
      critical.push('Database connectivity issues detected');
    }

    // Check for uncaught errors
    const uncaughtErrors = errorLogs.filter((log) =>
      log.message.toLowerCase().includes('uncaught'),
    );
    if (uncaughtErrors.length > 0) {
      critical.push(
        'Uncaught errors detected - may cause application instability',
      );
    }

    return critical;
  }

  private static generateSystemRecommendations(
    authIssues: string[],
    dbIssues: string[],
    apiIssues: string[],
    errorRate: number,
    recentErrors: number,
  ): string[] {
    const recommendations: string[] = [];

    if (authIssues.length > 0) {
      recommendations.push(
        'Review authentication system and session management',
      );
    }

    if (dbIssues.length > 0) {
      recommendations.push('Check database connectivity and query performance');
    }

    if (apiIssues.length > 0) {
      recommendations.push(
        'Investigate API endpoints and network connectivity',
      );
    }

    if (errorRate > 15) {
      recommendations.push(
        'High error rate - implement comprehensive error handling',
      );
    }

    if (recentErrors > 10) {
      recommendations.push(
        'Many recent errors - immediate investigation required',
      );
    }

    return recommendations;
  }

  private static assessSystemLoad(stats: LogStats): string {
    const totalLogs = stats.total;
    const errorRatio = totalLogs > 0 ? stats.byLevel.error / totalLogs : 0;

    if (totalLogs > 1000 && errorRatio > 0.1) {
      return 'High load with errors';
    } else if (totalLogs > 1000) {
      return 'High activity';
    } else if (errorRatio > 0.05) {
      return 'Moderate load with some errors';
    } else {
      return 'Normal';
    }
  }
}

// Export singleton instance for easy access
export const debugReader = DebugReader;
