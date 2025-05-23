/**
 * Database-related shared types
 */

// Database operation results
export interface DatabaseResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  affectedRows?: number;
}

// Transaction context
export interface TransactionContext {
  id: string;
  startTime: Date;
  operations: string[];
}

// Database connection config
export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
  poolSize?: number;
  timeout?: number;
}

// Query options
export interface QueryOptions {
  timeout?: number;
  retries?: number;
  cache?: boolean;
  cacheTTL?: number;
}

// Soft delete interface
export interface SoftDeletable {
  deletedAt: Date | null;
  isDeleted: boolean;
}

// Audit fields
export interface Auditable {
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}
