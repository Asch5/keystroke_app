import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type {
  SessionState,
  UserLearningSession,
  UserSessionItem,
  CreateSessionRequest,
  UpdateSessionRequest,
  AddSessionItemRequest,
  SessionStatsResponse,
  SessionFilterOptions,
  PaginatedSessionsResponse,
} from '@/core/domains/user/types/session';

/**
 * Initial state for session management
 */
const initialState: SessionState = {
  currentSession: null,
  sessionItems: [],
  sessionHistory: [],
  isSessionActive: false,
  loading: false,
  error: null,
  sessionStats: null,
};

/**
 * Async thunks for session operations
 */

// Start a new learning session
export const startLearningSession = createAsyncThunk(
  'session/startLearningSession',
  async (request: CreateSessionRequest, { rejectWithValue }) => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message ?? 'Failed to start session');
      }

      const data = await response.json();
      return data.session as UserLearningSession;
    } catch {
      return rejectWithValue('Network error while starting session');
    }
  },
);

// End current session
export const endLearningSession = createAsyncThunk(
  'session/endLearningSession',
  async (
    {
      sessionId,
      updates,
    }: { sessionId: string; updates?: UpdateSessionRequest },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...updates,
          endTime: new Date(),
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        return rejectWithValue(error.message ?? 'Failed to end session');
      }

      const data = await response.json();
      return data.session as UserLearningSession;
    } catch {
      return rejectWithValue('Network error while ending session');
    }
  },
);

// Add session item
export const addSessionItem = createAsyncThunk(
  'session/addSessionItem',
  async (
    { sessionId, item }: { sessionId: string; item: AddSessionItemRequest },
    { rejectWithValue },
  ) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(item),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(
          errorData.message ?? 'Failed to add session item',
        );
      }

      const data = await response.json();
      return data.item as UserSessionItem;
    } catch {
      return rejectWithValue('Network error while adding session item');
    }
  },
);

// Fetch session statistics
export const fetchSessionStats = createAsyncThunk(
  'session/fetchSessionStats',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/sessions/stats?userId=${userId}`, {
        next: { revalidate: 300 }, // Cache for 5 minutes
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(
          errorData.message ?? 'Failed to fetch session stats',
        );
      }

      const data = await response.json();
      return data as SessionStatsResponse;
    } catch {
      return rejectWithValue('Network error while fetching session stats');
    }
  },
);

// Fetch session history with pagination and filtering
export const fetchSessionHistory = createAsyncThunk(
  'session/fetchSessionHistory',
  async (
    {
      userId,
      page = 1,
      pageSize = 20,
      filters,
    }: {
      userId: string;
      page?: number;
      pageSize?: number;
      filters?: SessionFilterOptions;
    },
    { rejectWithValue },
  ) => {
    try {
      const params = new URLSearchParams({
        userId,
        page: page.toString(),
        pageSize: pageSize.toString(),
        ...(filters?.sessionType && { sessionType: filters.sessionType }),
        ...(filters?.userListId && { userListId: filters.userListId }),
        ...(filters?.listId && { listId: filters.listId }),
        ...(filters?.startDate && {
          startDate: filters.startDate.toISOString(),
        }),
        ...(filters?.endDate && { endDate: filters.endDate.toISOString() }),
      });

      const response = await fetch(`/api/sessions/history?${params}`, {
        next: { revalidate: 60 }, // Cache for 1 minute
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(
          errorData.message ?? 'Failed to fetch session history',
        );
      }

      const data = await response.json();
      return data as PaginatedSessionsResponse;
    } catch {
      return rejectWithValue('Network error while fetching session history');
    }
  },
);

/**
 * Session slice with comprehensive state management
 */
const sessionSlice = createSlice({
  name: 'session',
  initialState,
  reducers: {
    // Optimistic updates for real-time session management
    updateSessionOptimistic: (
      state,
      action: PayloadAction<Partial<UserLearningSession>>,
    ) => {
      if (state.currentSession) {
        state.currentSession = { ...state.currentSession, ...action.payload };
      }
    },

    // Add session item optimistically
    addSessionItemOptimistic: (
      state,
      action: PayloadAction<UserSessionItem>,
    ) => {
      state.sessionItems.push(action.payload);

      // Update session counters optimistically
      if (state.currentSession) {
        state.currentSession.wordsStudied += 1;
        if (action.payload.isCorrect) {
          state.currentSession.correctAnswers += 1;
        } else {
          state.currentSession.incorrectAnswers += 1;
        }

        // Update completion percentage and score
        const totalAnswers =
          state.currentSession.correctAnswers +
          state.currentSession.incorrectAnswers;
        state.currentSession.score =
          totalAnswers > 0
            ? (state.currentSession.correctAnswers / totalAnswers) * 100
            : 0;
      }
    },

    // Reset session state
    resetSession: (state) => {
      state.currentSession = null;
      state.sessionItems = [];
      state.isSessionActive = false;
      state.error = null;
    },

    // Clear error state
    clearError: (state) => {
      state.error = null;
    },

    // Update session stats cache
    updateSessionStatsCache: (
      state,
      action: PayloadAction<SessionStatsResponse>,
    ) => {
      state.sessionStats = action.payload;
    },

    // Manual session pause/resume (for local state management)
    pauseSession: (state) => {
      if (state.currentSession) {
        state.isSessionActive = false;
      }
    },

    resumeSession: (state) => {
      if (state.currentSession) {
        state.isSessionActive = true;
      }
    },
  },
  extraReducers: (builder) => {
    // Start Learning Session
    builder
      .addCase(startLearningSession.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(startLearningSession.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSession = action.payload;
        state.sessionItems = [];
        state.isSessionActive = true;
        state.error = null;
      })
      .addCase(startLearningSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.isSessionActive = false;
      });

    // End Learning Session
    builder
      .addCase(endLearningSession.pending, (state) => {
        state.loading = true;
      })
      .addCase(endLearningSession.fulfilled, (state, action) => {
        state.loading = false;
        state.currentSession = action.payload;
        state.isSessionActive = false;
        // Add to history
        if (action.payload) {
          const existingIndex = state.sessionHistory.findIndex(
            (s) => s.id === action.payload.id,
          );
          if (existingIndex >= 0) {
            state.sessionHistory[existingIndex] = action.payload;
          } else {
            state.sessionHistory.unshift(action.payload);
          }
        }
      })
      .addCase(endLearningSession.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Add Session Item
    builder
      .addCase(addSessionItem.pending, () => {
        // Keep optimistic update, don't show loading for individual items
      })
      .addCase(addSessionItem.fulfilled, (state, action) => {
        // Replace optimistic item with real one if needed
        const index = state.sessionItems.findIndex(
          (item) => item.userDictionaryId === action.payload.userDictionaryId,
        );
        if (index >= 0) {
          state.sessionItems[index] = action.payload;
        }
      })
      .addCase(addSessionItem.rejected, (state, action) => {
        state.error = action.payload as string;
        // Remove optimistic item on failure
        // This would require more sophisticated logic to identify which item failed
      });

    // Fetch Session Stats
    builder
      .addCase(fetchSessionStats.fulfilled, (state, action) => {
        state.sessionStats = action.payload;
      })
      .addCase(fetchSessionStats.rejected, (state, action) => {
        state.error = action.payload as string;
      });

    // Fetch Session History
    builder
      .addCase(fetchSessionHistory.fulfilled, (state, action) => {
        if (action.meta.arg.page === 1) {
          // Replace history if first page
          state.sessionHistory = action.payload.sessions;
        } else {
          // Append for pagination
          state.sessionHistory.push(...action.payload.sessions);
        }
      })
      .addCase(fetchSessionHistory.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  updateSessionOptimistic,
  addSessionItemOptimistic,
  resetSession,
  clearError,
  updateSessionStatsCache,
  pauseSession,
  resumeSession,
} = sessionSlice.actions;

// Selectors
export const selectCurrentSession = (state: { session: SessionState }) =>
  state.session.currentSession;

export const selectSessionItems = (state: { session: SessionState }) =>
  state.session.sessionItems;

export const selectIsSessionActive = (state: { session: SessionState }) =>
  state.session.isSessionActive;

export const selectSessionLoading = (state: { session: SessionState }) =>
  state.session.loading;

export const selectSessionError = (state: { session: SessionState }) =>
  state.session.error;

export const selectSessionHistory = (state: { session: SessionState }) =>
  state.session.sessionHistory;

export const selectSessionStats = (state: { session: SessionState }) =>
  state.session.sessionStats;

// Computed selectors
export const selectSessionAccuracy = (state: { session: SessionState }) => {
  const session = state.session.currentSession;
  if (!session) return 0;

  const total = session.correctAnswers + session.incorrectAnswers;
  return total > 0 ? (session.correctAnswers / total) * 100 : 0;
};

export const selectSessionProgress = (state: { session: SessionState }) => {
  const session = state.session.currentSession;
  return session?.completionPercentage ?? 0;
};

export const selectRecentSessions = (state: { session: SessionState }) =>
  state.session.sessionHistory.slice(0, 5);

export default sessionSlice.reducer;
