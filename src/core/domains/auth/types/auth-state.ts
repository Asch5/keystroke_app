import { UserBasicData } from '@/core/domains/user/types/user-entity';

/**
 * Auth state types for auth domain
 */

// Auth form state types
export interface StateAuth {
  errors?: {
    email?: string[];
    password?: string[];
  };
  message?: string;
}

export interface StateSignup {
  errors?: {
    name?: string[];
    email?: string[];
    password?: string[];
    confirmPassword?: string[];
  };
  message?: string;
}

// Auth slice state
export interface AuthState {
  user: UserBasicData | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Auth action types
export type AuthAction =
  | { type: 'AUTH_START' }
  | { type: 'AUTH_SUCCESS'; payload: UserBasicData }
  | { type: 'AUTH_FAILURE'; payload: string }
  | { type: 'AUTH_LOGOUT' };
