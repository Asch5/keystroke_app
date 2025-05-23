/**
 * Common shared types across domains
 */

// Generic API response wrapper
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  searchQuery?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  totalCount: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

// Common entity base
export interface BaseEntity {
  id: number;
  createdAt: Date;
  updatedAt: Date;
}

// Status types
export type Status = 'active' | 'inactive' | 'pending' | 'suspended';

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

// Loading states
export type LoadingState = 'idle' | 'loading' | 'succeeded' | 'failed';

// Sort order
export type SortOrder = 'asc' | 'desc';
