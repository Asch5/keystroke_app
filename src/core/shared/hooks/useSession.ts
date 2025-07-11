import { useCallback, useEffect } from 'react';
import type {
  CreateSessionRequest,
  UpdateSessionRequest,
  AddSessionItemRequest,
  UseSessionReturn,
  UserLearningSession,
  UserSessionItem,
} from '@/core/domains/user/types/session';
import { serverLog } from '@/core/infrastructure/monitoring/serverLogger';
import {
  startLearningSession,
  endLearningSession,
  addSessionItem as addSessionItemThunk,
  selectCurrentSession,
  selectSessionItems,
  selectIsSessionActive,
  selectSessionLoading,
  selectSessionError,
  selectSessionAccuracy,
  selectSessionProgress,
  resetSession,
  clearError,
  addSessionItemOptimistic,
  updateSessionOptimistic,
  pauseSession,
  resumeSession,
} from '@/core/state/features/sessionSlice';
import { useAppDispatch, useAppSelector } from '@/core/state/store';

/**
 * Hook for managing learning sessions with Redux integration
 */
export function useSession(): UseSessionReturn {
  const dispatch = useAppDispatch();

  // Session state from Redux
  const currentSession = useAppSelector(selectCurrentSession);
  const sessionItems = useAppSelector(selectSessionItems);
  const isSessionActive = useAppSelector(selectIsSessionActive);
  const loading = useAppSelector(selectSessionLoading);
  const error = useAppSelector(selectSessionError);
  const accuracy = useAppSelector(selectSessionAccuracy);
  const progress = useAppSelector(selectSessionProgress);

  /**
   * Start a new learning session
   */
  const startSession = useCallback(
    async (request: CreateSessionRequest): Promise<UserLearningSession> => {
      try {
        void serverLog('Starting new session via hook', 'info', { request });

        const result = await dispatch(startLearningSession(request)).unwrap();

        // Clear any previous errors
        dispatch(clearError());

        return result;
      } catch (error) {
        void serverLog('Failed to start session via hook', 'error', {
          error,
        });
        throw error;
      }
    },
    [dispatch],
  );

  /**
   * End the current session
   */
  const endSession = useCallback(
    async (updates?: UpdateSessionRequest): Promise<void> => {
      if (!currentSession) {
        throw new Error('No active session to end');
      }

      try {
        void serverLog('Ending session via hook', 'info', {
          sessionId: currentSession.id,
          updates,
        });

        // Calculate final updates
        const finalUpdates: UpdateSessionRequest = {
          ...updates,
          endTime: new Date(),
          // Auto-calculate completion percentage if not provided
          ...(updates?.completionPercentage === undefined && {
            completionPercentage: sessionItems.length > 0 ? 100 : 0,
          }),
        };

        await dispatch(
          endLearningSession({
            sessionId: currentSession.id,
            updates: finalUpdates,
          }),
        ).unwrap();

        dispatch(clearError());
      } catch (error) {
        void serverLog('Failed to end session via hook', 'error', { error });
        throw error;
      }
    },
    [currentSession, sessionItems.length, dispatch],
  );

  /**
   * Add a session item with optimistic updates
   */
  const addSessionItem = useCallback(
    async (item: AddSessionItemRequest): Promise<UserSessionItem> => {
      if (!currentSession) {
        throw new Error('No active session to add item to');
      }

      try {
        // Create optimistic session item
        const optimisticItem: UserSessionItem = {
          id: `temp-${Date.now()}`, // Temporary ID
          sessionId: currentSession.id,
          userDictionaryId: item.userDictionaryId,
          isCorrect: item.isCorrect,
          responseTime: item.responseTime || null,
          attemptsCount: item.attemptsCount || 1,
          createdAt: new Date(),
        };

        // Add optimistic update immediately for better UX
        dispatch(addSessionItemOptimistic(optimisticItem));

        // Send to server
        const result = await dispatch(
          addSessionItemThunk({
            sessionId: currentSession.id,
            item,
          }),
        ).unwrap();

        void serverLog('Session item added successfully', 'info', {
          sessionId: currentSession.id,
          itemId: result.id,
        });

        return result;
      } catch (error) {
        void serverLog('Failed to add session item via hook', 'error', {
          error,
        });
        throw error;
      }
    },
    [currentSession, dispatch],
  );

  /**
   * Pause the current session (local state only)
   */
  const pauseCurrentSession = useCallback(async (): Promise<void> => {
    if (!currentSession || !isSessionActive) {
      return;
    }

    try {
      dispatch(pauseSession());

      // Optional: Update session on server to track pause time
      dispatch(
        updateSessionOptimistic({
          ...currentSession,
          // Could add pausedAt timestamp if schema supports it
        }),
      );

      void serverLog('Session paused', 'info', {
        sessionId: currentSession.id,
      });
    } catch (error) {
      void serverLog('Failed to pause session', 'error', { error });
      throw error;
    }
  }, [currentSession, isSessionActive, dispatch]);

  /**
   * Resume the current session (local state only)
   */
  const resumeCurrentSession = useCallback(async (): Promise<void> => {
    if (!currentSession || isSessionActive) {
      return;
    }

    try {
      dispatch(resumeSession());

      void serverLog('Session resumed', 'info', {
        sessionId: currentSession.id,
      });
    } catch (error) {
      void serverLog('Failed to resume session', 'error', { error });
      throw error;
    }
  }, [currentSession, isSessionActive, dispatch]);

  /**
   * Reset session state (local only)
   */
  const resetCurrentSession = useCallback((): void => {
    dispatch(resetSession());
    void serverLog('Session state reset', 'info');
  }, [dispatch]);

  /**
   * Auto-save session progress periodically
   */
  useEffect(() => {
    if (!currentSession || !isSessionActive) {
      return;
    }

    const autoSaveInterval = setInterval(() => {
      try {
        // Auto-update session with current progress
        const updates: UpdateSessionRequest = {
          wordsStudied: sessionItems.length,
          correctAnswers: sessionItems.filter((item) => item.isCorrect).length,
          incorrectAnswers: sessionItems.filter((item) => !item.isCorrect)
            .length,
          score: accuracy,
          completionPercentage: progress,
        };

        // Only update if there are actual changes
        if (sessionItems.length > 0) {
          dispatch(
            updateSessionOptimistic({
              ...currentSession,
              ...updates,
            }),
          );
        }
      } catch (error) {
        void serverLog('Auto-save session failed', 'error', { error });
      }
    }, 30000); // Auto-save every 30 seconds

    return () => clearInterval(autoSaveInterval);
  }, [
    currentSession,
    isSessionActive,
    sessionItems,
    accuracy,
    progress,
    dispatch,
  ]);

  /**
   * Handle session cleanup on unmount or when session becomes inactive
   */
  useEffect(() => {
    return () => {
      // Optional: Auto-end session if component unmounts and session is still active
      // This could be configurable based on app requirements
      if (currentSession && isSessionActive) {
        void serverLog('Component unmounting with active session', 'info', {
          sessionId: currentSession.id,
        });
        // Could dispatch endLearningSession here if needed
      }
    };
  }, [currentSession, isSessionActive]);

  return {
    currentSession,
    sessionItems,
    isSessionActive,
    loading,
    error,
    startSession,
    endSession,
    addSessionItem,
    pauseSession: pauseCurrentSession,
    resumeSession: resumeCurrentSession,
    resetSession: resetCurrentSession,
  };
}
