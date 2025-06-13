'use client';

import { useState } from 'react';
import Image from 'next/image';
import { AlertCircle, Image as ImageIcon } from 'lucide-react';
import { cn } from '@/core/lib/utils';

interface ImageWithFallbackProps {
  src: string;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  fallbackClassName?: string;
  sizes?: string;
  priority?: boolean;
  unoptimized?: boolean;
  onLoad?: () => void;
  onError?: (error: string) => void;
}

/**
 * ImageWithFallback component provides robust image display with graceful error handling,
 * loading states, and debugging capabilities for development.
 *
 * Features:
 * - Loading spinner while image loads
 * - Graceful fallback UI when image fails to load
 * - Clear error feedback for debugging
 * - Maintains all Next.js Image optimization features
 * - Proper accessibility support
 */
export function ImageWithFallback({
  src,
  alt,
  fill = false,
  width,
  height,
  className,
  fallbackClassName,
  sizes,
  priority = false,
  unoptimized = false,
  onLoad,
  onError,
}: ImageWithFallbackProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    const errorMsg = `Failed to load image: ${src}`;
    setErrorMessage(errorMsg);
    onError?.(errorMsg);

    // Development debugging
    if (process.env.NODE_ENV === 'development') {
      console.warn('🖼️ Image load failed:', {
        src,
        alt,
        error: errorMsg,
        timestamp: new Date().toISOString(),
      });
    }
  };

  // Check if this is an authenticated endpoint and needs special handling
  const isAuthenticatedEndpoint = src.startsWith('/api/images/');
  const shouldBeUnoptimized = unoptimized || isAuthenticatedEndpoint;

  // For authenticated endpoints, render immediately to avoid loading state issues
  if (isAuthenticatedEndpoint) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        {...(width !== undefined && { width })}
        {...(height !== undefined && { height })}
        className={className}
        sizes={sizes}
        priority={priority}
        unoptimized={shouldBeUnoptimized}
        onLoad={handleLoad}
        onError={handleError}
      />
    );
  }

  // Loading state
  if (isLoading && !hasError) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted animate-pulse',
          fill ? 'absolute inset-0' : '',
          className,
        )}
        style={
          !fill && width && height
            ? { width: `${width}px`, height: `${height}px` }
            : undefined
        }
      >
        <ImageIcon className="h-8 w-8 text-muted-foreground" />
      </div>
    );
  }

  // Error state with fallback UI
  if (hasError) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center bg-muted/50 border border-dashed border-muted-foreground/30 rounded-md',
          fill ? 'absolute inset-0' : '',
          fallbackClassName || className,
        )}
        style={
          !fill && width && height
            ? { width: `${width}px`, height: `${height}px` }
            : undefined
        }
      >
        <AlertCircle className="h-6 w-6 text-muted-foreground mb-2" />
        <span className="text-xs text-muted-foreground text-center px-2">
          Image unavailable
        </span>
        {process.env.NODE_ENV === 'development' && (
          <span className="text-xs text-destructive text-center px-2 mt-1">
            {errorMessage}
          </span>
        )}
      </div>
    );
  }

  // Successful image render
  return (
    <>
      <Image
        src={src}
        alt={alt}
        fill={fill}
        {...(width !== undefined && { width })}
        {...(height !== undefined && { height })}
        className={className}
        sizes={sizes}
        priority={priority}
        unoptimized={shouldBeUnoptimized}
        onLoad={handleLoad}
        onError={handleError}
      />
    </>
  );
}
