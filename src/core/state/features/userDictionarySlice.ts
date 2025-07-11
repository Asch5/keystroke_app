import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
  debugLog,
  infoLog,
  errorLog,
} from '@/core/infrastructure/monitoring/clientLogger';
import type { RootState } from '@/core/state/store';
//import { prisma } from '@/lib/prisma';

/**
 * Interface representing an item in the user's dictionary
 */
export interface UserDictionaryItem {
  id: string;
  word: string;
  translation: string;
  category: string;
  difficulty: string;
  progress: number;
  isLearned: boolean;
  isNeedsReview: boolean;
  isDifficultToLearn: boolean;
  reviewCount: number;
  lastReviewedAt: string | null;
  timeWordWasStartedToLearn: string | null;
}

/**
 * State interface for the user dictionary slice
 */
interface UserDictionaryState {
  items: UserDictionaryItem[];
  status: 'idle' | 'loading' | 'succeeded' | 'failed';
  error: string | null;
  sortBy: 'word' | 'difficulty' | 'progress' | 'reviewCount' | 'lastReviewedAt';
  sortOrder: 'asc' | 'desc';
}

const initialState: UserDictionaryState = {
  items: [],
  status: 'idle',
  error: null,
  sortBy: 'word',
  sortOrder: 'asc',
};

// Type for API error response
interface ApiErrorResponse {
  message: string;
  status?: number;
  data?: unknown;
  error?: unknown;
}

/**
 * Async thunk to fetch user dictionary items
 */
export const fetchUserDictionary = createAsyncThunk(
  'userDictionary/fetchUserDictionary',
  async (userId: string, { rejectWithValue }) => {
    try {
      await debugLog(`Fetching dictionary for user ID: ${userId}`);

      // Use Pages API route instead of App Router API
      const apiUrl = `${window.location.origin}/api/user-dictionary?userId=${userId}`;
      await debugLog('API URL being called', { apiUrl });

      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'include', // Include cookies for auth
        cache: 'no-store', // Prevent caching issues
      });

      await debugLog('API Response received', {
        status: response.status,
        statusText: response.statusText,
      });

      await debugLog('API Response headers', {
        headers: Object.fromEntries([...response.headers.entries()]),
      });

      if (!response.ok) {
        // Try to read the error message from the response
        let errorMessage = 'Failed to fetch user dictionary';
        let errorData: unknown = null;

        try {
          const contentType = response.headers.get('content-type');
          await debugLog('Response content type', { contentType });

          if (contentType && contentType.includes('application/json')) {
            errorData = await response.json();
            errorMessage =
              (errorData as Record<string, string>).error || errorMessage;
          } else {
            // If not JSON, get the raw text
            const textError = await response.text();
            await errorLog('Raw error response received', {
              textError: textError.substring(0, 500),
            });

            // If it starts with <!DOCTYPE, it's likely an HTML error page
            if (textError.trim().startsWith('<!DOCTYPE')) {
              errorMessage =
                'Server returned an HTML error page instead of JSON';
            } else {
              errorMessage = textError || errorMessage;
            }
          }
        } catch (parseError) {
          await errorLog('Error parsing error response', { parseError });
          const textError = await response
            .text()
            .catch(() => 'Could not read response body');
          await errorLog('Raw error response fallback', {
            textError: textError.substring(0, 500),
          });
        }

        return rejectWithValue({
          message: errorMessage,
          status: response.status,
          data: errorData,
        } as ApiErrorResponse);
      }

      // Check content type
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        await errorLog('Response is not JSON', { contentType });
        const text = await response.text();
        await errorLog('Non-JSON response body', { responseBody: text });
        return rejectWithValue({
          message: 'Response is not JSON',
          data: text,
        } as ApiErrorResponse);
      }

      const data = await response.json();
      await infoLog('User dictionary data fetched successfully', {
        itemCount: data.length,
      });
      return data;
    } catch (error) {
      await errorLog('Error in fetchUserDictionary', { error });
      return rejectWithValue({
        message:
          error instanceof Error ? error.message : 'An unknown error occurred',
        error: error,
      } as ApiErrorResponse);
    }
  },
);

/**
 * Redux slice for managing user dictionary state
 */
const userDictionarySlice = createSlice({
  name: 'userDictionary',
  initialState,
  reducers: {
    setSortBy: (state, action) => {
      if (state.sortBy === action.payload) {
        // If clicking the same column, toggle sort order
        state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        // If clicking a different column, set it and default to ascending
        state.sortBy = action.payload;
        state.sortOrder = 'asc';
      }
    },
    clearUserDictionary: (state) => {
      state.items = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserDictionary.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchUserDictionary.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.items = action.payload;
        state.error = null;
      })
      .addCase(fetchUserDictionary.rejected, (state, action) => {
        state.status = 'failed';
        // Handle rejection with custom error payload
        if (action.payload) {
          state.error = (action.payload as ApiErrorResponse).message;
        } else {
          state.error =
            action.error.message ?? 'Failed to fetch user dictionary';
        }
      });
  },
});

export const { setSortBy, clearUserDictionary } = userDictionarySlice.actions;
export default userDictionarySlice.reducer;

// Selectors
/**
 * Selector to get sorted user dictionary items
 */
export const selectUserDictionary = (state: RootState) => {
  const { items, sortBy, sortOrder } = state.userDictionary;

  return [...items].sort((a, b) => {
    let comparison = 0;

    switch (sortBy) {
      case 'word':
        comparison = a.word.localeCompare(b.word);
        break;
      case 'difficulty':
        comparison = a.difficulty.localeCompare(b.difficulty);
        break;
      case 'progress':
        comparison = a.progress - b.progress;
        break;
      case 'reviewCount':
        comparison = a.reviewCount - b.reviewCount;
        break;
      case 'lastReviewedAt': {
        const dateA = a.lastReviewedAt
          ? new Date(a.lastReviewedAt).getTime()
          : 0;
        const dateB = b.lastReviewedAt
          ? new Date(b.lastReviewedAt).getTime()
          : 0;
        comparison = dateA - dateB;
        break;
      }
      default:
        comparison = 0;
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
};

/**
 * Selector to get loading status
 */
export const selectUserDictionaryStatus = (state: RootState) =>
  state.userDictionary.status;

/**
 * Selector to get error message
 */
export const selectUserDictionaryError = (state: RootState) =>
  state.userDictionary.error;
