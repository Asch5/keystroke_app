'use client';

import { AlertCircle, Image as ImageIcon } from 'lucide-react';
import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react';
import {
  errorLogSync,
  infoLogSync,
} from '@/core/infrastructure/monitoring/clientLogger';
import { cn } from '@/core/lib/utils';

interface AuthenticatedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  fill?: boolean;
  className?: string;
  fallbackClassName?: string;
  sizes?: string;
  priority?: boolean;
  onLoad?: () => void;
  onImageError?: (error: string) => void;
}

/**
 * AuthenticatedImage component that properly handles images from authenticated API endpoints.
 * This component solves the issue where Next.js Image component gets stuck loading
 * when trying to access authenticated endpoints like /api/images/.
 *
 * Key features:
 * - Automatically detects authenticated endpoints and uses img tag to bypass authentication issues
 * - Provides proper error handling and fallback UI
 * - Maintains Next.js Image optimization for non-authenticated sources
 * - Works seamlessly with your existing authentication system
 */
export function AuthenticatedImage({
  src,
  alt,
  width,
  height,
  fill = false,
  className,
  fallbackClassName,
  sizes,
  priority = false,
  onLoad,
  onImageError,
}: AuthenticatedImageProps) {
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);

  // Check if this is an authenticated endpoint
  const isAuthenticatedEndpoint = src.startsWith('/api/images/');

  // Monitor for stuck loading states in development
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && isLoading && !hasError) {
      timeoutRef.current = setTimeout(() => {
        errorLogSync('⏰ AuthenticatedImage stuck in loading state', {
          src,
          alt: alt.substring(0, 50),
          isAuthenticatedEndpoint,
          duration: '5+ seconds',
        });
      }, 5000);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isLoading, hasError, src, alt, isAuthenticatedEndpoint]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
    onLoad?.();

    // Clear timeout on successful load
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Log successful image load in development
    if (process.env.NODE_ENV === 'development') {
      infoLogSync('✅ AuthenticatedImage loaded successfully', {
        src,
        alt: alt.substring(0, 50),
        isAuthenticated: isAuthenticatedEndpoint,
      });
    }
  };

  const handleError = () => {
    setIsLoading(false);
    setHasError(true);
    const errorMsg = `Failed to load image: ${src}`;
    setErrorMessage(errorMsg);
    onImageError?.(errorMsg);

    // Clear timeout on error
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Log image failure for debugging
    if (process.env.NODE_ENV === 'development') {
      errorLogSync('❌ AuthenticatedImage load failed', {
        src,
        alt: alt.substring(0, 50),
        error: errorMsg,
        isAuthenticated: isAuthenticatedEndpoint,
      });
    }
  };

  // For authenticated endpoints, use img tag to bypass Next.js authentication issues
  if (isAuthenticatedEndpoint) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={cn('w-full h-full object-cover', className)}
        onLoad={handleLoad}
        onError={handleError}
        style={
          !fill && width && height
            ? { width: `${width}px`, height: `${height}px` }
            : undefined
        }
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

  // For external URLs (like Pexels), use img tag to avoid potential Next.js optimization issues
  const isExternalUrl = src.startsWith('http://') || src.startsWith('https://');

  if (isExternalUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={alt}
        className={cn('w-full h-full object-cover', className)}
        onLoad={handleLoad}
        onError={handleError}
        style={
          !fill && width && height
            ? { width: `${width}px`, height: `${height}px` }
            : undefined
        }
      />
    );
  }

  // For non-authenticated images, use Next.js Image with optimization
  return (
    <Image
      src={src}
      alt={alt}
      className={className}
      fill={fill}
      priority={priority}
      unoptimized={isAuthenticatedEndpoint}
      onLoad={handleLoad}
      onError={handleError}
      {...(width && { width })}
      {...(height && { height })}
      {...(sizes && { sizes })}
    />
  );
}
