'use client';

import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';
import { ReactNode, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/core/shared/utils/common/cn';

interface PracticeGameContainerProps {
  children: ReactNode;
  isLoading?: boolean;
  error?: Error | null;
  gameTitle?: string;
  onRetry?: () => void;
  onReset?: () => void;
  className?: string;
  'aria-label'?: string;
}

/**
 * Error fallback component for practice games
 */
function GameErrorFallback({
  error,
  resetErrorBoundary,
  onRetry,
}: {
  error: Error;
  resetErrorBoundary: () => void;
  onRetry?: (() => void) | undefined;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4 text-center">
      <AlertCircle className="h-12 w-12 text-destructive" />
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Something went wrong</h3>
        <p className="text-sm text-muted-foreground max-w-md">
          {error.message ||
            'An unexpected error occurred while loading the practice game.'}
        </p>
      </div>
      <div className="flex gap-2">
        {onRetry && (
          <Button
            variant="outline"
            onClick={onRetry}
            className="flex items-center gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
        <Button
          onClick={resetErrorBoundary}
          className="flex items-center gap-2"
        >
          <RefreshCw className="h-4 w-4" />
          Reset Game
        </Button>
      </div>
    </div>
  );
}

/**
 * Loading state component for practice games
 */
function GameLoadingState({ gameTitle }: { gameTitle?: string | undefined }) {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      <div className="space-y-1 text-center">
        <p className="text-sm font-medium">
          {gameTitle ? `Loading ${gameTitle}...` : 'Loading practice game...'}
        </p>
        <p className="text-xs text-muted-foreground">
          Preparing your vocabulary session
        </p>
      </div>
    </div>
  );
}

/**
 * Universal container for all practice game components
 * Provides error boundaries, loading states, accessibility, and consistent layout
 */
export function PracticeGameContainer({
  children,
  isLoading = false,
  error = null,
  gameTitle,
  onRetry,
  onReset,
  className,
  'aria-label': ariaLabel,
}: PracticeGameContainerProps) {
  // Set up keyboard shortcuts for common game actions
  useEffect(() => {
    const handleKeyboardShortcuts = (event: KeyboardEvent) => {
      // Escape key to reset/retry if there's an error
      if (event.key === 'Escape' && (error || isLoading)) {
        event.preventDefault();
        if (error && onRetry) {
          onRetry();
        } else if (error && onReset) {
          onReset();
        }
      }

      // F5 key to retry
      if (event.key === 'F5' && error && onRetry) {
        event.preventDefault();
        onRetry();
      }
    };

    document.addEventListener('keydown', handleKeyboardShortcuts);
    return () => {
      document.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, [error, isLoading, onRetry, onReset]);

  // Create a wrapper component for the ErrorBoundary to handle the props correctly
  const ErrorBoundaryWrapper = ({ children }: { children: ReactNode }) => {
    const handleReset = () => {
      if (onReset) onReset();
    };

    // Convert the function to match the expected signature
    const resetHandler = () => {
      handleReset();
    };

    return (
      <ErrorBoundary
        FallbackComponent={(props) => (
          <GameErrorFallback {...props} onRetry={onRetry || undefined} />
        )}
        onReset={resetHandler}
      >
        {children}
      </ErrorBoundary>
    );
  };

  return (
    <Card
      className={cn('w-full max-w-4xl mx-auto', className)}
      role="region"
      aria-label={ariaLabel || `${gameTitle || 'Practice'} game area`}
    >
      <CardContent className="p-6">
        <ErrorBoundaryWrapper>
          {isLoading ? (
            <GameLoadingState gameTitle={gameTitle || undefined} />
          ) : error ? (
            <GameErrorFallback
              error={error}
              resetErrorBoundary={() => onReset?.()}
              onRetry={onRetry || undefined}
            />
          ) : (
            <div className="space-y-6">
              {gameTitle && (
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-muted-foreground">
                    {gameTitle}
                  </h2>
                </div>
              )}
              {children}
            </div>
          )}
        </ErrorBoundaryWrapper>
      </CardContent>
    </Card>
  );
}
