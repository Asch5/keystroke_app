'use client';

import { useEffect } from 'react';
import { initializePerformanceMonitoring } from '@/lib/performance-optimizations';

interface PerformanceMonitoringProviderProps {
  children: React.ReactNode;
}

/**
 * Performance Monitoring Provider
 * Initializes comprehensive performance monitoring for the application
 *
 * Features:
 * - Bundle size monitoring
 * - Component render tracking
 * - Memory usage monitoring
 * - Core Web Vitals tracking
 */
export function PerformanceMonitoringProvider({
  children,
}: PerformanceMonitoringProviderProps) {
  useEffect(() => {
    // Only initialize in development mode or when explicitly enabled
    if (
      process.env.NODE_ENV === 'development' ||
      process.env.ENABLE_PERFORMANCE_MONITORING === 'true'
    ) {
      initializePerformanceMonitoring();
    }
  }, []);

  return <>{children}</>;
}
