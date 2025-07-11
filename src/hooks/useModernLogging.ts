/**
 * React Hooks for Modern Logging (2025 Standards)
 * Provides component-aware logging with automatic context enrichment
 */

import { useRouter } from 'next/router';
import { useCallback, useEffect, useRef } from 'react';
import { log } from '@/core/infrastructure/monitoring/modernLogger';

// Performance monitoring hook
export function usePerformanceLogging(
  componentName: string,
  threshold: number = 16,
) {
  const renderCount = useRef(0);
  const startTime = useRef(0);
  const lastRenderTime = useRef(0);

  useEffect(() => {
    const endTime = performance.now();
    renderCount.current += 1;
    lastRenderTime.current = endTime - startTime.current;

    // Log slow renders
    if (lastRenderTime.current > threshold) {
      log.performance('Slow component render', lastRenderTime.current, {
        component: componentName,
        renderCount: renderCount.current,
        threshold,
      });
    }

    // Log component lifecycle
    log.lifecycle(componentName, 'render', {
      renderCount: renderCount.current,
      renderTime: lastRenderTime.current,
    });

    return () => {
      startTime.current = performance.now();
    };
  });

  // Log mount/unmount
  useEffect(() => {
    log.lifecycle(componentName, 'mount', { component: componentName });
    startTime.current = performance.now();

    return () => {
      log.lifecycle(componentName, 'unmount', {
        component: componentName,
        totalRenders: renderCount.current,
      });
    };
  }, [componentName]);

  return {
    renderCount: renderCount.current,
    lastRenderTime: lastRenderTime.current,
  };
}

// User interaction logging hook
export function useUserInteractionLogging(componentName: string) {
  const logInteraction = useCallback(
    (
      action: string,
      elementId?: string,
      additionalContext?: Record<string, unknown>,
    ) => {
      log.userAction(action, componentName, {
        elementId,
        ...additionalContext,
      });
    },
    [componentName],
  );

  const logClick = useCallback(
    (elementId: string, additionalContext?: Record<string, unknown>) => {
      logInteraction('click', elementId, additionalContext);
    },
    [logInteraction],
  );

  const logSubmit = useCallback(
    (
      formId: string,
      success: boolean = true,
      additionalContext?: Record<string, unknown>,
    ) => {
      logInteraction('form_submit', formId, { success, ...additionalContext });
    },
    [logInteraction],
  );

  const logInput = useCallback(
    (
      fieldId: string,
      fieldType: string,
      additionalContext?: Record<string, unknown>,
    ) => {
      logInteraction('input_change', fieldId, {
        fieldType,
        ...additionalContext,
      });
    },
    [logInteraction],
  );

  return {
    logInteraction,
    logClick,
    logSubmit,
    logInput,
  };
}

// API call logging hook
export function useApiLogging() {
  const logApiCall = useCallback(
    async <T>(
      apiCall: () => Promise<T>,
      method: string,
      url: string,
      context?: Record<string, unknown>,
    ): Promise<T> => {
      const startTime = performance.now();

      try {
        log.apiCall(method, url, undefined, undefined, {
          ...context,
          phase: 'start',
        });

        const result = await apiCall();
        const duration = performance.now() - startTime;

        log.apiCall(method, url, 200, duration, {
          ...context,
          phase: 'success',
        });
        return result;
      } catch (error) {
        const duration = performance.now() - startTime;
        const statusCode =
          error instanceof Error && 'status' in error
            ? (error as Error & { status: number }).status
            : 500;

        log.apiCall(method, url, statusCode, duration, {
          ...context,
          phase: 'error',
        });
        log.error(`API call failed: ${method} ${url}`, error as Error, context);

        throw error;
      }
    },
    [],
  );

  return { logApiCall };
}

// Route change logging hook
export function useRouteLogging() {
  const router = useRouter();
  const previousRoute = useRef<string>('');

  useEffect(() => {
    const handleRouteChange = (url: string) => {
      const from = previousRoute.current ?? 'initial';
      log.navigation(from, url, {
        routerMethod: 'push',
        timestamp: new Date().toISOString(),
      });
      previousRoute.current = url;
    };

    const handleRouteError = (err: Error, url: string) => {
      log.error('Route navigation error', err, {
        targetUrl: url,
        fromUrl: previousRoute.current,
      });
    };

    router.events.on('routeChangeComplete', handleRouteChange);
    router.events.on('routeChangeError', handleRouteError);

    // Log initial route
    if (!previousRoute.current) {
      previousRoute.current = router.asPath;
      log.navigation('initial', router.asPath, { type: 'initial_load' });
    }

    return () => {
      router.events.off('routeChangeComplete', handleRouteChange);
      router.events.off('routeChangeError', handleRouteError);
    };
  }, [router]);
}

// Error boundary logging hook
export function useErrorLogging(componentName: string) {
  const logError = useCallback(
    (error: Error, errorInfo?: { componentStack?: string }) => {
      log.error(`Unhandled error in ${componentName}`, error, {
        component: componentName,
        componentStack: errorInfo?.componentStack,
        type: 'component_error',
      });
    },
    [componentName],
  );

  const logWarning = useCallback(
    (message: string, context?: Record<string, unknown>) => {
      log.warn(`Warning in ${componentName}: ${message}`, {
        component: componentName,
        ...context,
      });
    },
    [componentName],
  );

  return { logError, logWarning };
}

// State change logging hook
export function useStateLogging<T>(
  stateName: string,
  value: T,
  componentName: string,
) {
  const previousValue = useRef<T>(value);
  const changeCount = useRef(0);

  useEffect(() => {
    if (previousValue.current !== value) {
      changeCount.current += 1;

      log.debug(`State change: ${stateName}`, {
        component: componentName,
        stateName,
        previousValue: previousValue.current,
        newValue: value,
        changeCount: changeCount.current,
      });

      previousValue.current = value;
    }
  }, [value, stateName, componentName]);

  return changeCount.current;
}

// Custom hook for logging component props changes
export function usePropsLogging(
  props: Record<string, unknown>,
  componentName: string,
) {
  const previousProps = useRef<Record<string, unknown>>(props);

  useEffect(() => {
    const changedProps: Record<string, { from: unknown; to: unknown }> = {};

    Object.keys(props).forEach((key) => {
      if (previousProps.current[key] !== props[key]) {
        changedProps[key] = {
          from: previousProps.current[key],
          to: props[key],
        };
      }
    });

    if (Object.keys(changedProps).length > 0) {
      log.debug(`Props changed in ${componentName}`, {
        component: componentName,
        changedProps,
      });
    }

    previousProps.current = props;
  }, [props, componentName]);
}

// Business event logging hook
export function useBusinessLogging() {
  const logBusinessEvent = useCallback(
    (event: string, context?: Record<string, unknown>) => {
      log.business(event, context);
    },
    [],
  );

  const logUserRegistration = useCallback(
    (userId: string, method: string) => {
      logBusinessEvent('user_registration', { userId, method });
    },
    [logBusinessEvent],
  );

  const logUserLogin = useCallback(
    (userId: string, method: string) => {
      logBusinessEvent('user_login', { userId, method });
    },
    [logBusinessEvent],
  );

  const logUserLogout = useCallback(
    (userId: string, sessionDuration?: number) => {
      logBusinessEvent('user_logout', { userId, sessionDuration });
    },
    [logBusinessEvent],
  );

  const logFeatureUsage = useCallback(
    (feature: string, userId?: string) => {
      logBusinessEvent('feature_usage', { feature, userId });
    },
    [logBusinessEvent],
  );

  return {
    logBusinessEvent,
    logUserRegistration,
    logUserLogin,
    logUserLogout,
    logFeatureUsage,
  };
}

// Security logging hook
export function useSecurityLogging() {
  const logSecurityEvent = useCallback(
    (event: string, context?: Record<string, unknown>) => {
      log.security(event, context);
    },
    [],
  );

  const logFailedLogin = useCallback(
    (email: string, reason: string) => {
      logSecurityEvent('failed_login_attempt', {
        email: email.replace(/(.{2}).*(@.*)/, '$1***$2'), // Partially mask email
        reason,
      });
    },
    [logSecurityEvent],
  );

  const logSuspiciousActivity = useCallback(
    (activity: string, context?: Record<string, unknown>) => {
      logSecurityEvent('suspicious_activity', { activity, ...context });
    },
    [logSecurityEvent],
  );

  const logPermissionDenied = useCallback(
    (resource: string, action: string, userId?: string) => {
      logSecurityEvent('permission_denied', { resource, action, userId });
    },
    [logSecurityEvent],
  );

  return {
    logSecurityEvent,
    logFailedLogin,
    logSuspiciousActivity,
    logPermissionDenied,
  };
}

// Comprehensive logging hook that combines multiple logging concerns
export function useComprehensiveLogging(componentName: string) {
  const performance = usePerformanceLogging(componentName);
  const userInteraction = useUserInteractionLogging(componentName);
  const { logApiCall } = useApiLogging();
  const { logError, logWarning } = useErrorLogging(componentName);
  const business = useBusinessLogging();
  const security = useSecurityLogging();

  return {
    ...performance,
    ...userInteraction,
    logApiCall,
    logError,
    logWarning,
    ...business,
    ...security,
  };
}
