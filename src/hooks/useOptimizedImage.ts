import { useState, useEffect, useCallback, useRef } from 'react';
import {
  infoLog,
  errorLog,
} from '@/core/infrastructure/monitoring/clientLogger';

interface UseOptimizedImageOptions {
  /** Enable lazy loading (default: true) */
  lazy?: boolean;
  /** Preload the image (default: false) */
  preload?: boolean;
  /** Root margin for intersection observer (default: '50px') */
  rootMargin?: string;
  /** Threshold for intersection observer (default: 0.1) */
  threshold?: number;
  /** Callback when image starts loading */
  onLoadStart?: () => void;
  /** Callback when image loads successfully */
  onLoadSuccess?: () => void;
  /** Callback when image fails to load */
  onLoadError?: (error: string) => void;
}

interface UseOptimizedImageReturn {
  /** Current image source (empty string if not loaded yet) */
  src: string;
  /** Loading state */
  isLoading: boolean;
  /** Error state */
  hasError: boolean;
  /** Error message */
  error: string | null;
  /** Ref to attach to img element for lazy loading */
  imageRef: React.RefObject<HTMLImageElement | null>;
  /** Manually trigger image load */
  loadImage: () => void;
  /** Reset error state and retry loading */
  retry: () => void;
}

/**
 * Optimized image loading hook with lazy loading, error handling, and performance monitoring
 *
 * Features:
 * - Lazy loading with Intersection Observer
 * - Preloading support
 * - Error handling and retry logic
 * - Performance monitoring
 * - Memory leak prevention
 *
 * @param imageSrc - The image source URL
 * @param options - Configuration options
 * @returns Image loading state and controls
 */
export function useOptimizedImage(
  imageSrc: string | undefined,
  options: UseOptimizedImageOptions = {},
): UseOptimizedImageReturn {
  const {
    lazy = true,
    preload = false,
    rootMargin = '50px',
    threshold = 0.1,
    onLoadStart,
    onLoadSuccess,
    onLoadError,
  } = options;

  const [src, setSrc] = useState<string>(preload && imageSrc ? imageSrc : '');
  const [isLoading, setIsLoading] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const imageRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const imageObjectRef = useRef<HTMLImageElement | null>(null);
  const loadStartTime = useRef<number>(0);

  /**
   * Load the image with performance monitoring
   */
  const loadImage = useCallback(() => {
    if (!imageSrc || src === imageSrc) return;

    setIsLoading(true);
    setHasError(false);
    setError(null);
    loadStartTime.current = performance.now();

    onLoadStart?.();

    // Create new image object for loading
    const img = new Image();
    imageObjectRef.current = img;

    const handleLoad = () => {
      const loadTime = performance.now() - loadStartTime.current;

      setSrc(imageSrc);
      setIsLoading(false);

      // Log performance metrics
      if (process.env.NODE_ENV === 'development') {
        infoLog(
          `Image loaded successfully in ${loadTime.toFixed(2)}ms: ${imageSrc.substring(0, 100)}...`,
        );
      }

      onLoadSuccess?.();
    };

    const handleError = () => {
      const loadTime = performance.now() - loadStartTime.current;
      const errorMessage = `Failed to load image after ${loadTime.toFixed(2)}ms`;

      setIsLoading(false);
      setHasError(true);
      setError(errorMessage);

      errorLog(`Image load failed: ${imageSrc}`, errorMessage);
      onLoadError?.(errorMessage);
    };

    img.addEventListener('load', handleLoad);
    img.addEventListener('error', handleError);

    // Start loading
    img.src = imageSrc;

    // Cleanup function
    return () => {
      img.removeEventListener('load', handleLoad);
      img.removeEventListener('error', handleError);
      imageObjectRef.current = null;
    };
  }, [imageSrc, src, onLoadStart, onLoadSuccess, onLoadError]);

  /**
   * Retry loading the image
   */
  const retry = useCallback(() => {
    setSrc('');
    setHasError(false);
    setError(null);
    loadImage();
  }, [loadImage]);

  /**
   * Set up intersection observer for lazy loading
   */
  useEffect(() => {
    if (!lazy || !imageSrc || src === imageSrc) return;

    const currentImageRef = imageRef.current;
    if (!currentImageRef) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry && entry.isIntersecting) {
          loadImage();
          observerRef.current?.disconnect();
        }
      },
      { rootMargin, threshold },
    );

    observerRef.current.observe(currentImageRef);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, imageSrc, src, loadImage, rootMargin, threshold]);

  /**
   * Handle immediate loading (non-lazy)
   */
  useEffect(() => {
    if (!lazy && imageSrc && src !== imageSrc) {
      loadImage();
    }
  }, [lazy, imageSrc, src, loadImage]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      // Cancel any ongoing image load
      if (imageObjectRef.current) {
        imageObjectRef.current.src = '';
        imageObjectRef.current = null;
      }

      // Disconnect observer
      observerRef.current?.disconnect();
    };
  }, []);

  return {
    src,
    isLoading,
    hasError,
    error,
    imageRef,
    loadImage,
    retry,
  };
}

/**
 * Hook for preloading multiple images
 * Useful for image galleries or carousels
 */
export function useImagePreloader(imageUrls: string[]): {
  loadedCount: number;
  totalCount: number;
  isComplete: boolean;
  loadedUrls: Set<string>;
  failedUrls: Set<string>;
} {
  const [loadedUrls, setLoadedUrls] = useState<Set<string>>(new Set());
  const [failedUrls, setFailedUrls] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (imageUrls.length === 0) return;

    const loadPromises = imageUrls.map((url) => {
      return new Promise<{ url: string; success: boolean }>((resolve) => {
        const img = new Image();

        const handleLoad = () => {
          setLoadedUrls((prev) => new Set(prev).add(url));
          resolve({ url, success: true });
        };

        const handleError = () => {
          setFailedUrls((prev) => new Set(prev).add(url));
          resolve({ url, success: false });
        };

        img.addEventListener('load', handleLoad);
        img.addEventListener('error', handleError);
        img.src = url;
      });
    });

    Promise.all(loadPromises).then((results) => {
      const successful = results.filter((r) => r.success).length;
      const failed = results.filter((r) => !r.success).length;

      if (process.env.NODE_ENV === 'development') {
        infoLog(
          `Image preloading complete: ${successful} successful, ${failed} failed`,
        );
      }
    });

    // Cleanup
    return () => {
      setLoadedUrls(new Set());
      setFailedUrls(new Set());
    };
  }, [imageUrls]);

  return {
    loadedCount: loadedUrls.size,
    totalCount: imageUrls.length,
    isComplete: loadedUrls.size + failedUrls.size === imageUrls.length,
    loadedUrls,
    failedUrls,
  };
}
