'use client';

import React, { ReactNode } from 'react';
import { ErrorBoundaryBase } from './ErrorBoundaryBase';

interface SettingsErrorBoundaryProps {
  children: ReactNode;
  onRetry?: (() => void) | undefined;
}

/**
 * Settings-specific error boundary that provides context-aware error handling
 * for settings pages and configuration interfaces
 */
export function SettingsErrorBoundary({
  children,
  onRetry,
}: SettingsErrorBoundaryProps) {
  return (
    <ErrorBoundaryBase
      fallbackTitle="Settings Error"
      fallbackDescription="An error occurred while loading your settings. Your preferences are safe, but there may be a temporary display issue."
      showHomeButton={true}
      showBackButton={true}
      onRetry={onRetry}
      errorContext="Settings"
    >
      {children}
    </ErrorBoundaryBase>
  );
}
