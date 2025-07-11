'use client';

import React, { ReactNode } from 'react';
import { ErrorBoundaryBase } from './ErrorBoundaryBase';

interface DashboardErrorBoundaryProps {
  children: ReactNode;
}

/**
 * Dashboard-specific error boundary that provides context-aware error handling
 * for dashboard pages and components
 */
export function DashboardErrorBoundary({
  children,
}: DashboardErrorBoundaryProps) {
  return (
    <ErrorBoundaryBase
      fallbackTitle="Dashboard Error"
      fallbackDescription="An error occurred while loading the dashboard. Please try refreshing the page or navigate to another section."
      showHomeButton={false} // We're already in dashboard context
      showBackButton={true}
      errorContext="Dashboard"
    >
      {children}
    </ErrorBoundaryBase>
  );
}
