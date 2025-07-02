// Database error handler to convert Prisma errors to internal types
// This prevents Prisma types from being bundled into client code

import {
  PrismaClientKnownRequestError,
  PrismaClientValidationError,
} from '@prisma/client/runtime/library';
import {
  DatabaseKnownRequestError,
  DatabaseValidationError,
  DatabaseNotFoundError,
  DATABASE_ERROR_CODES,
} from '@/core/types/database';

/**
 * Handles database errors by converting Prisma errors to internal error types
 * This prevents Prisma types from being exposed to client code
 */
export function handleDatabaseError(error: unknown): never {
  // Convert Prisma errors to internal error types
  if (error instanceof PrismaClientKnownRequestError) {
    throw new DatabaseKnownRequestError(error.message, error.code, error.meta);
  }

  if (error instanceof PrismaClientValidationError) {
    throw new DatabaseValidationError(error.message);
  }

  // Handle specific error types
  if (error instanceof Error) {
    // Check for common database error patterns
    if (
      error.message.includes('Record to update not found') ||
      error.message.includes('Record to delete does not exist')
    ) {
      throw new DatabaseNotFoundError(error.message);
    }

    // Check for unique constraint violations
    if (error.message.includes('Unique constraint failed')) {
      throw new DatabaseKnownRequestError(
        error.message,
        DATABASE_ERROR_CODES.UNIQUE_CONSTRAINT_FAILED,
      );
    }

    // Check for foreign key constraint violations
    if (error.message.includes('Foreign key constraint failed')) {
      throw new DatabaseKnownRequestError(
        error.message,
        DATABASE_ERROR_CODES.FOREIGN_KEY_CONSTRAINT_FAILED,
      );
    }

    // Check for transaction timeouts
    if (
      error.message.includes('Transaction timeout') ||
      error.message.includes('Transaction was invalidated')
    ) {
      throw new DatabaseKnownRequestError(
        error.message,
        DATABASE_ERROR_CODES.TRANSACTION_TIMEOUT,
      );
    }
  }

  // If it's not a recognized database error, re-throw as-is
  throw error;
}

/**
 * Safely executes a database operation and handles errors
 */
export async function safeDatabaseOperation<T>(
  operation: () => Promise<T>,
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    return handleDatabaseError(error);
  }
}

/**
 * Checks if an error is a specific database error code
 */
export function isSpecificDatabaseError(error: unknown, code: string): boolean {
  return error instanceof DatabaseKnownRequestError && error.code === code;
}

/**
 * Gets a user-friendly error message from a database error
 */
export function getDatabaseErrorMessage(error: unknown): string {
  if (error instanceof DatabaseKnownRequestError) {
    switch (error.code) {
      case DATABASE_ERROR_CODES.UNIQUE_CONSTRAINT_FAILED:
        return 'A record with this information already exists. Please check for duplicates.';
      case DATABASE_ERROR_CODES.FOREIGN_KEY_CONSTRAINT_FAILED:
        return 'Cannot complete this operation due to related data constraints.';
      case DATABASE_ERROR_CODES.RECORD_NOT_FOUND:
        return 'The requested record was not found.';
      case DATABASE_ERROR_CODES.TRANSACTION_TIMEOUT:
        return 'The operation timed out. Please try again.';
      case DATABASE_ERROR_CODES.CONNECTION_ERROR:
        return 'Database connection error. Please try again later.';
      case DATABASE_ERROR_CODES.AUTHENTICATION_FAILED:
        return 'Database authentication failed.';
      default:
        return error.message;
    }
  }

  if (error instanceof DatabaseValidationError) {
    return 'Invalid data provided. Please check your input.';
  }

  if (error instanceof DatabaseNotFoundError) {
    return error.message;
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'An unexpected error occurred.';
}
