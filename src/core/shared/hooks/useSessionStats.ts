import { useCallback, useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/core/state/store';
import {
  fetchSessionStats,
  selectSessionStats,
  updateSessionStatsCache,
} from '@/core/state/features/sessionSlice';
import { selectUser } from '@/core/state/features/authSlice';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import type { UseSessionStatsReturn } from '@/core/domains/user/types/session';

/**
 * Hook for managing session statistics with caching
 */
export function useSessionStats(userId?: string): UseSessionStatsReturn {
  const dispatch = useAppDispatch();
  const currentUser = useAppSelector(selectUser);
  const cachedStats = useAppSelector(selectSessionStats);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastFetch, setLastFetch] = useState<Date | null>(null);

  // Use provided userId or fall back to current user
  const targetUserId = userId || currentUser?.id;

  /**
   * Fetch session statistics
   */
  const fetchStats = useCallback(async (): Promise<void> => {
    if (!targetUserId) {
      setError('No user ID available');
      return;
    }

    // Don't refetch if we have recent data (less than 5 minutes old)
    if (
      cachedStats &&
      lastFetch &&
      Date.now() - lastFetch.getTime() < 5 * 60 * 1000
    ) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      serverLog('Fetching session stats via hook', 'info', {
        userId: targetUserId,
      });

      const result = await dispatch(fetchSessionStats(targetUserId)).unwrap();

      // Update cache and timestamp
      dispatch(updateSessionStatsCache(result));
      setLastFetch(new Date());

      serverLog('Session stats fetched successfully', 'info', {
        userId: targetUserId,
        totalSessions: result.totalSessions,
      });
    } catch (fetchError) {
      const errorMessage =
        fetchError instanceof Error
          ? fetchError.message
          : 'Failed to fetch session stats';
      setError(errorMessage);
      serverLog('Failed to fetch session stats via hook', 'error', {
        userId: targetUserId,
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [targetUserId, cachedStats, lastFetch, dispatch]);

  /**
   * Force refetch (ignoring cache)
   */
  const refetch = useCallback(async (): Promise<void> => {
    if (!targetUserId) {
      setError('No user ID available');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      serverLog('Force refetching session stats', 'info', {
        userId: targetUserId,
      });

      const result = await dispatch(fetchSessionStats(targetUserId)).unwrap();

      // Update cache and timestamp
      dispatch(updateSessionStatsCache(result));
      setLastFetch(new Date());
    } catch (fetchError) {
      const errorMessage =
        fetchError instanceof Error
          ? fetchError.message
          : 'Failed to fetch session stats';
      setError(errorMessage);
      serverLog('Failed to force refetch session stats', 'error', {
        userId: targetUserId,
        error: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  }, [targetUserId, dispatch]);

  /**
   * Auto-fetch on mount and when userId changes
   */
  useEffect(() => {
    if (targetUserId) {
      fetchStats();
    }
  }, [targetUserId, fetchStats]);

  /**
   * Auto-refresh stats periodically
   */
  useEffect(() => {
    if (!targetUserId) return;

    const refreshInterval = setInterval(
      () => {
        // Only auto-refresh if the user is likely active (document is visible)
        if (!document.hidden) {
          fetchStats();
        }
      },
      5 * 60 * 1000,
    ); // Refresh every 5 minutes

    return () => clearInterval(refreshInterval);
  }, [targetUserId, fetchStats]);

  /**
   * Refresh when the page becomes visible again
   */
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden && targetUserId) {
        // Refresh stats when user returns to the page
        fetchStats();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [targetUserId, fetchStats]);

  return {
    stats: cachedStats,
    loading,
    error,
    refetch,
  };
}

/**
 * Hook for real-time session statistics (updates with current session)
 */
export function useRealTimeSessionStats(
  userId?: string,
): UseSessionStatsReturn & {
  isStale: boolean;
  lastUpdate: Date | null;
} {
  const basicStats = useSessionStats(userId);
  const [isStale, setIsStale] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Mark stats as stale when they're older than 2 minutes
  useEffect(() => {
    if (!basicStats.stats) return;

    const checkStaleInterval = setInterval(() => {
      if (lastUpdate) {
        const minutesOld = (Date.now() - lastUpdate.getTime()) / (1000 * 60);
        setIsStale(minutesOld > 2);
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(checkStaleInterval);
  }, [lastUpdate, basicStats.stats]);

  // Update timestamp when stats change
  useEffect(() => {
    if (basicStats.stats) {
      setLastUpdate(new Date());
      setIsStale(false);
    }
  }, [basicStats.stats]);

  return {
    ...basicStats,
    isStale,
    lastUpdate,
  };
}
