import {
  DatabaseKnownRequestError,
  DatabaseValidationError,
} from '@/core/types/database';
import { MiddlewareParams } from '@/core/types/prisma-substitutes';

/**
 * Custom error class for Prisma operations
 */
export class PrismaOperationError extends Error {
  constructor(
    message: string,
    public readonly operation: string,
    public readonly model: string,
    public readonly args: Record<string, unknown>,
    public readonly error:
      | Error
      | DatabaseKnownRequestError
      | DatabaseValidationError,
  ) {
    super(message);
    this.name = 'PrismaOperationError';
  }
}

type MiddlewareReturn = Promise<unknown>;

/**
 * Middleware for logging query performance
 */
export const performanceMiddleware = async (
  params: MiddlewareParams,
  next: (params: MiddlewareParams) => MiddlewareReturn,
) => {
  const startTime = performance.now();
  const result = await next(params);
  const endTime = performance.now();
  const duration = endTime - startTime;

  // Log slow queries (over 100ms)
  if (duration > 100) {
    console.warn(
      `[Prisma Slow Query] ${params.model}.${params.action} took ${duration.toFixed(2)}ms`,
    );
  }

  // Log all queries in development
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `[Prisma Query] ${params.model}.${params.action} took ${duration.toFixed(2)}ms`,
    );
  }

  return result;
};

/**
 * Middleware for error handling
 */
export const errorHandlingMiddleware = async (
  params: MiddlewareParams,
  next: (params: MiddlewareParams) => MiddlewareReturn,
) => {
  try {
    return await next(params);
  } catch (error) {
    if (!(error instanceof Error)) {
      throw new PrismaOperationError(
        'Unknown error type',
        params.action,
        params.model ?? 'unknown',
        params.args,
        new Error(String(error)),
      );
    }

    // Handle specific Prisma errors
    if (error instanceof DatabaseKnownRequestError) {
      switch (error.code) {
        case 'P2002':
          throw new PrismaOperationError(
            'Unique constraint violation',
            params.action,
            params.model ?? 'unknown',
            params.args,
            error,
          );
        case 'P2025':
          throw new PrismaOperationError(
            'Record not found',
            params.action,
            params.model ?? 'unknown',
            params.args,
            error,
          );
        default:
          throw new PrismaOperationError(
            `Database error: ${error.message}`,
            params.action,
            params.model ?? 'unknown',
            params.args,
            error,
          );
      }
    }

    // Handle validation errors
    if (error instanceof DatabaseValidationError) {
      throw new PrismaOperationError(
        'Validation error in database query',
        params.action,
        params.model ?? 'unknown',
        params.args,
        error,
      );
    }

    // Handle unknown errors
    throw new PrismaOperationError(
      'Unknown database error occurred',
      params.action,
      params.model ?? 'unknown',
      params.args,
      error,
    );
  }
};

// Models that support soft delete
const SOFT_DELETE_MODELS = new Set([
  'User',
  'MainDictionary',
  'DictionaryExample',
  'Synonym',
  'DictionarySynonym',
  'UserDictionary',
  'UserDictionaryExample',
  'UserSynonym',
  'UserDictionarySynonym',
  'List',
  'ListWord',
  'UserList',
  'UserListWord',
]);

/**
 * Middleware for soft delete handling
 */
export const softDeleteMiddleware = async (
  params: MiddlewareParams,
  next: (params: MiddlewareParams) => MiddlewareReturn,
) => {
  // Only apply soft delete logic to models that support it
  if (!params.model || !SOFT_DELETE_MODELS.has(params.model)) {
    return next(params);
  }

  // Add deletedAt filter for queries if not explicitly included
  if (params.action === 'findMany' || params.action === 'findFirst') {
    if (params.args.where === undefined) {
      params.args.where = {};
    }

    const whereClause = params.args.where as Record<string, unknown>;
    // Only add the deletedAt filter if it's not already specified
    if (whereClause.deletedAt === undefined) {
      whereClause.deletedAt = null;
    }
  }

  // Handle soft deletes
  if (params.action === 'delete') {
    // Convert delete operations to updates
    params.action = 'update';
    params.args.data = { deletedAt: new Date() };
  }

  return next(params);
};

/**
 * Middleware for query batching optimization
 */
export const batchingMiddleware = async (
  params: MiddlewareParams,
  next: (params: MiddlewareParams) => MiddlewareReturn,
) => {
  // Add dataloader implementation here if needed
  return next(params);
};
