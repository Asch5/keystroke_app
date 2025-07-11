'use client';

import { SpeedInsights as VercelSpeedInsights } from '@vercel/speed-insights/next';
import { useEffect } from 'react';
import { infoLog } from '@/core/infrastructure/monitoring/clientLogger';

/**
 * Enhanced Speed Insights component with comprehensive performance monitoring
 * Implements Real User Monitoring (RUM) and Core Web Vitals tracking
 * as required by the cursor rules for performance monitoring
 */
export function SpeedInsights() {
  useEffect(() => {
    // Log Speed Insights initialization for debugging
    if (process.env.NODE_ENV === 'development') {
      infoLog('Speed Insights initialized for performance monitoring');
    }

    // Initialize comprehensive performance monitoring
    const initPerformanceMonitor = async () => {
      try {
        // Import and initialize performance monitor
        await import('@/core/infrastructure/monitoring/performanceMonitor');

        if (process.env.NODE_ENV === 'development') {
          infoLog('Performance Monitor integrated with Speed Insights');
        }
      } catch (error) {
        console.warn('Failed to initialize performance monitor:', error);
      }
    };

    initPerformanceMonitor();
  }, []);

  return (
    <VercelSpeedInsights
      debug={process.env.NODE_ENV === 'development'}
      sampleRate={1.0} // 100% sampling for comprehensive monitoring
    />
  );
}

export default SpeedInsights;
