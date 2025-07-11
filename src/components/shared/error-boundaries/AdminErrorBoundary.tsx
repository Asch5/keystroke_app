'use client';

import React, { ReactNode } from 'react';
import { ErrorBoundaryBase } from './ErrorBoundaryBase';

interface AdminErrorBoundaryProps {
  children: ReactNode;
  onRetry?: (() => void) | undefined;
}

/**
 * Admin-specific error boundary that provides context-aware error handling
 * for admin pages and management interfaces
 */
export function AdminErrorBoundary({
  children,
  onRetry,
}: AdminErrorBoundaryProps) {
  return (
    <ErrorBoundaryBase
      fallbackTitle="Admin Panel Error"
      fallbackDescription="An error occurred in the admin panel. Please try refreshing the page or contact technical support if the issue persists."
      showHomeButton={true}
      showBackButton={true}
      onRetry={onRetry}
      errorContext="Admin"
    >
      {children}
    </ErrorBoundaryBase>
  );
}
