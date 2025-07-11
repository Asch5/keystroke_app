'use client';

import React, { ReactNode } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, RefreshCw, Home, ArrowLeft } from 'lucide-react';
import { errorLog } from '@/core/infrastructure/monitoring/clientLogger';
import { useRouter } from 'next/navigation';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
  title?: string | undefined;
  description?: string | undefined;
  showHomeButton?: boolean | undefined;
  showBackButton?: boolean | undefined;
  onRetry?: (() => void) | undefined;
}

/**
 * Base error fallback component with consistent styling and actions
 */
function BaseErrorFallback({
  error,
  resetErrorBoundary,
  title = 'Something went wrong',
  description = 'An unexpected error occurred. Please try again or contact support if the problem persists.',
  showHomeButton = true,
  showBackButton = true,
  onRetry,
}: ErrorFallbackProps) {
  const router = useRouter();

  const handleGoHome = () => {
    router.push('/dashboard');
  };

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="flex items-center justify-center min-h-[400px] p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <AlertCircle className="h-12 w-12 text-destructive" />
          </div>
          <CardTitle className="text-xl font-semibold">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground text-center">
            {description}
          </p>

          {process.env.NODE_ENV === 'development' && (
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer hover:text-foreground">
                Error Details (Development)
              </summary>
              <pre className="mt-2 whitespace-pre-wrap break-words p-2 bg-muted rounded">
                {error.message}
                {error.stack && '\n\nStack trace:\n' + error.stack}
              </pre>
            </details>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:gap-2">
            {onRetry && (
              <Button
                onClick={onRetry}
                variant="default"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            )}

            <Button
              onClick={resetErrorBoundary}
              variant={onRetry ? 'outline' : 'default'}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Reset
            </Button>

            {showBackButton && (
              <Button
                onClick={handleGoBack}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            )}

            {showHomeButton && (
              <Button
                onClick={handleGoHome}
                variant="ghost"
                className="flex items-center gap-2"
              >
                <Home className="h-4 w-4" />
                Home
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ErrorBoundaryBaseProps {
  children: ReactNode;
  fallbackTitle?: string | undefined;
  fallbackDescription?: string | undefined;
  showHomeButton?: boolean | undefined;
  showBackButton?: boolean | undefined;
  onRetry?: (() => void) | undefined;
  onError?: ((error: Error, errorInfo: React.ErrorInfo) => void) | undefined;
  errorContext?: string | undefined;
}

/**
 * Base error boundary component that provides consistent error handling
 * across the application with proper logging and user-friendly fallbacks
 */
export function ErrorBoundaryBase({
  children,
  fallbackTitle,
  fallbackDescription,
  showHomeButton,
  showBackButton,
  onRetry,
  onError,
  errorContext = 'Application',
}: ErrorBoundaryBaseProps) {
  const handleError = (error: Error, errorInfo: React.ErrorInfo) => {
    // Log error for monitoring and debugging
    errorLog(`${errorContext} Error Boundary: ${error.message}`, {
      errorInfo,
      timestamp: new Date().toISOString(),
      userAgent:
        typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
    });

    // Call custom error handler if provided
    onError?.(error, errorInfo);
  };

  return (
    <ErrorBoundary
      FallbackComponent={(props) => (
        <BaseErrorFallback
          {...props}
          title={fallbackTitle}
          description={fallbackDescription}
          showHomeButton={showHomeButton ?? true}
          showBackButton={showBackButton ?? true}
          onRetry={onRetry}
        />
      )}
      onError={handleError}
    >
      {children}
    </ErrorBoundary>
  );
}
