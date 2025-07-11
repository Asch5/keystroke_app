'use client';

import React, { ReactNode } from 'react';
import { ErrorBoundaryBase } from './ErrorBoundaryBase';

interface PracticeErrorBoundaryProps {
  children: ReactNode;
  onRetry?: (() => void) | undefined;
  onResetSession?: (() => void) | undefined;
}

/**
 * Practice-specific error boundary that provides context-aware error handling
 * for practice sessions and learning activities
 */
export function PracticeErrorBoundary({
  children,
  onRetry,
  onResetSession,
}: PracticeErrorBoundaryProps) {
  const handleRetry = () => {
    // Try the custom retry first, then session reset as fallback
    if (onRetry) {
      onRetry();
    } else if (onResetSession) {
      onResetSession();
    }
  };

  return (
    <ErrorBoundaryBase
      fallbackTitle="Practice Session Error"
      fallbackDescription="An error occurred during your practice session. Your progress has been saved, but you may need to restart this exercise."
      showHomeButton={true}
      showBackButton={true}
      onRetry={handleRetry}
      errorContext="Practice"
    >
      {children}
    </ErrorBoundaryBase>
  );
}
