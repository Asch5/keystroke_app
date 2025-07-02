import { PrismaOperationError } from '@/core/shared/database/middleware';
import {
  DatabaseKnownRequestError,
  DatabaseValidationError,
  DatabaseInitializationError,
} from '@/core/types/database';

/**
 * Type for the error response structure
 */
interface ErrorResponse {
  message: string;
  code: string;
  status: number;
}

/**
 * Handles Prisma errors and returns a standardized error response
 */
export function handlePrismaError(error: unknown): ErrorResponse {
  // Handle custom PrismaOperationError
  if (error instanceof PrismaOperationError) {
    return {
      message: error.message,
      code: 'DATABASE_ERROR',
      status: 500,
    };
  }

  // Handle Prisma's known request errors
  if (error instanceof DatabaseKnownRequestError) {
    switch (error.code) {
      case 'P2002':
        return {
          message: 'A unique constraint would be violated.',
          code: 'UNIQUE_CONSTRAINT_VIOLATION',
          status: 409,
        };
      case 'P2025':
        return {
          message: 'Record not found.',
          code: 'NOT_FOUND',
          status: 404,
        };
      case 'P2014':
        return {
          message:
            'The change you are trying to make would violate the required relation.',
          code: 'RELATION_VIOLATION',
          status: 400,
        };
      case 'P2003':
        return {
          message: 'Foreign key constraint failed.',
          code: 'FOREIGN_KEY_VIOLATION',
          status: 400,
        };
      default:
        return {
          message: `Database error: ${error.message}`,
          code: 'DATABASE_ERROR',
          status: 500,
        };
    }
  }

  // Handle Prisma validation errors
  if (error instanceof DatabaseValidationError) {
    return {
      message: 'Invalid data provided.',
      code: 'VALIDATION_ERROR',
      status: 400,
    };
  }

  // Handle Prisma initialization errors
  if (error instanceof DatabaseInitializationError) {
    return {
      message: 'Failed to initialize database connection.',
      code: 'DATABASE_CONNECTION_ERROR',
      status: 503,
    };
  }

  // Handle unknown errors
  return {
    message: 'An unexpected error occurred.',
    code: 'INTERNAL_SERVER_ERROR',
    status: 500,
  };
}

/**
 * Example usage in an API route:
 *
 * try {
 *   const result = await prisma.user.findMany();
 *   return Response.json(result);
 * } catch (error) {
 *   const errorResponse = handlePrismaError(error);
 *   return Response.json(errorResponse, { status: errorResponse.status });
 * }
 */
