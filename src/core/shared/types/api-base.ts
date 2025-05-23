/**
 * Base API types for shared infrastructure
 */

// HTTP methods
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

// API error types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// Request configuration
export interface RequestConfig {
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
}

// Response metadata
export interface ResponseMetadata {
  requestId: string;
  timestamp: string;
  version: string;
  processingTime: number;
}

// Base API client interface
export interface ApiClient {
  get<T>(url: string, config?: Partial<RequestConfig>): Promise<T>;
  post<T>(
    url: string,
    data?: unknown,
    config?: Partial<RequestConfig>,
  ): Promise<T>;
  put<T>(
    url: string,
    data?: unknown,
    config?: Partial<RequestConfig>,
  ): Promise<T>;
  delete<T>(url: string, config?: Partial<RequestConfig>): Promise<T>;
  patch<T>(
    url: string,
    data?: unknown,
    config?: Partial<RequestConfig>,
  ): Promise<T>;
}
