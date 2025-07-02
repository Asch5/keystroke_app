import { SessionType } from '@/core/types';

/**
 * Core session types based on Prisma schema
 */
export interface UserLearningSession {
  id: string;
  userId: string;
  userListId?: string | null;
  listId?: string | null;
  sessionType: SessionType;
  startTime: Date;
  endTime?: Date | null;
  duration?: number | null; // in seconds
  wordsStudied: number;
  wordsLearned: number;
  correctAnswers: number;
  incorrectAnswers: number;
  score?: number | null;
  completionPercentage: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserSessionItem {
  id: string;
  sessionId: string;
  userDictionaryId: string;
  isCorrect: boolean;
  responseTime?: number | null; // in milliseconds
  attemptsCount: number;
  createdAt: Date;
}

/**
 * Extended types with relations for UI usage
 */
export interface UserLearningSessionWithItems extends UserLearningSession {
  sessionItems: UserSessionItem[];
  userList?: {
    id: string;
    customNameOfList?: string | null;
    list?: {
      id: string;
      name: string;
    } | null;
  } | null;
  list?: {
    id: string;
    name: string;
  } | null;
}

export interface UserSessionItemWithDetails extends UserSessionItem {
  userDictionary: {
    id: string;
    definition: {
      id: number;
      definition: string;
    };
  };
}

/**
 * Redux state interfaces
 */
export interface SessionState {
  currentSession: UserLearningSession | null;
  sessionItems: UserSessionItem[];
  sessionHistory: UserLearningSession[];
  isSessionActive: boolean;
  loading: boolean;
  error: string | null;
  // Statistics cache
  sessionStats: SessionStatsResponse | null;
}

/**
 * API request/response types
 */
export interface CreateSessionRequest {
  userListId?: string;
  listId?: string;
  sessionType: SessionType;
}

export interface CreateSessionResponse {
  session: UserLearningSession;
}

export interface UpdateSessionRequest {
  endTime?: Date;
  duration?: number;
  wordsStudied?: number;
  wordsLearned?: number;
  correctAnswers?: number;
  incorrectAnswers?: number;
  score?: number;
  completionPercentage?: number;
}

export interface AddSessionItemRequest {
  userDictionaryId: string;
  isCorrect: boolean;
  responseTime?: number;
  attemptsCount?: number;
}

export interface SessionStatsResponse {
  totalSessions: number;
  totalWordsStudied: number;
  averageScore: number;
  streakDays: number;
  lastSessionDate: Date | null;
  recentSessions: UserLearningSession[];
}

/**
 * Pagination and filtering types
 */
export interface SessionFilterOptions {
  sessionType?: SessionType;
  startDate?: Date;
  endDate?: Date;
  userListId?: string;
  listId?: string;
}

export interface PaginatedSessionsResponse {
  sessions: UserLearningSession[];
  total: number;
  page: number;
  pageSize: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/**
 * Session analytics types
 */
export interface SessionAnalytics {
  sessionId: string;
  accuracy: number; // correctAnswers / totalAnswers
  averageResponseTime: number;
  improvementTrend: 'improving' | 'stable' | 'declining';
  difficultWords: string[]; // IDs of words with multiple mistakes
  strengths: string[]; // Areas where user performs well
  weaknesses: string[]; // Areas needing improvement
}

/**
 * Cache metadata for Next.js integration
 */
export interface SessionCacheMetadata {
  lastFetch: Date;
  expiresAt: Date;
  tags: string[];
}

export interface CachedSessionData<T> {
  data: T;
  metadata: SessionCacheMetadata;
}

/**
 * Hook return types
 */
export interface UseSessionReturn {
  currentSession: UserLearningSession | null;
  sessionItems: UserSessionItem[];
  isSessionActive: boolean;
  loading: boolean;
  error: string | null;
  startSession: (request: CreateSessionRequest) => Promise<UserLearningSession>;
  endSession: (updates?: UpdateSessionRequest) => Promise<void>;
  addSessionItem: (item: AddSessionItemRequest) => Promise<UserSessionItem>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  resetSession: () => void;
}

export interface UseSessionStatsReturn {
  stats: SessionStatsResponse | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export interface UseSessionHistoryReturn {
  sessions: UserLearningSession[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  filters: SessionFilterOptions;
  setFilters: (filters: SessionFilterOptions) => void;
}
