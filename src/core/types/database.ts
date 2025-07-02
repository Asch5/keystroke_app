// Internal database types to replace Prisma types
// This avoids bundling Prisma types into client code

import { PrismaClient } from '@prisma/client';

// Transaction client type
export type DatabaseTransactionClient = Parameters<
  Parameters<PrismaClient['$transaction']>[0]
>[0];

// JSON value type
export type DatabaseJsonValue =
  | string
  | number
  | boolean
  | null
  | { [key: string]: DatabaseJsonValue }
  | DatabaseJsonValue[];

// Transaction isolation levels
export enum DatabaseTransactionIsolationLevel {
  ReadUncommitted = 'ReadUncommitted',
  ReadCommitted = 'ReadCommitted',
  RepeatableRead = 'RepeatableRead',
  Serializable = 'Serializable',
}

// Internal error types to replace Prisma error types
export class DatabaseKnownRequestError extends Error {
  code: string;
  meta?: Record<string, unknown>;

  constructor(message: string, code: string, meta?: Record<string, unknown>) {
    super(message);
    this.name = 'DatabaseKnownRequestError';
    this.code = code;
    if (meta !== undefined) {
      this.meta = meta;
    }
  }
}

export class DatabaseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseValidationError';
  }
}

export class DatabaseNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseNotFoundError';
  }
}

export class DatabaseInitializationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseInitializationError';
  }
}

// Common Prisma error codes
export const DATABASE_ERROR_CODES = {
  UNIQUE_CONSTRAINT_FAILED: 'P2002',
  FOREIGN_KEY_CONSTRAINT_FAILED: 'P2003',
  RECORD_NOT_FOUND: 'P2025',
  TRANSACTION_TIMEOUT: 'P2028',
  CONNECTION_ERROR: 'P1001',
  AUTHENTICATION_FAILED: 'P1002',
} as const;

// Utility function to check if an error is a database error
export function isDatabaseError(
  error: unknown,
): error is DatabaseKnownRequestError {
  return error instanceof DatabaseKnownRequestError;
}

// Utility function to check for specific error codes
export function isDatabaseErrorCode(error: unknown, code: string): boolean {
  return isDatabaseError(error) && error.code === code;
}
