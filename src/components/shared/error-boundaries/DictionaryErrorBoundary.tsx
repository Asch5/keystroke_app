'use client';

import React, { ReactNode } from 'react';
import { ErrorBoundaryBase } from './ErrorBoundaryBase';

interface DictionaryErrorBoundaryProps {
  children: ReactNode;
  onRetry?: () => void;
}

/**
 * Dictionary-specific error boundary that provides context-aware error handling
 * for dictionary pages and word management components
 */
export function DictionaryErrorBoundary({
  children,
  onRetry,
}: DictionaryErrorBoundaryProps) {
  return (
    <ErrorBoundaryBase
      fallbackTitle="Dictionary Error"
      fallbackDescription="An error occurred while loading your dictionary. Your vocabulary data is safe, but there may be a temporary issue with the display."
      showHomeButton={true}
      showBackButton={true}
      onRetry={onRetry ?? undefined}
      errorContext="Dictionary"
    >
      {children}
    </ErrorBoundaryBase>
  );
}
