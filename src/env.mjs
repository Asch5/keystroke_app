import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  /**
   * Server-side environment variables schema
   * These are only available on the server-side
   */
  server: {
    // Database
    DATABASE_URL: z.string().url(),

    // Authentication
    NEXTAUTH_SECRET: z.string().min(1),
    AUTH_SECRET: z.string().min(1),
    NEXTAUTH_URL: z.string().url().optional(),
    AUTH_URL: z.string().url().optional(),

    // External APIs
    PEXELS_API_KEY: z.string().min(1),
    DICTIONARY_LEARNERS_API_KEY: z.string().min(1),
    DICTIONARY_INTERMEDIATE_API_KEY: z.string().min(1),
    GOOGLE_TTS_API_KEY: z.string().min(1).optional(),
    OPENAI_API_KEY: z.string().min(1).optional(),

    // Vercel Services
    BLOB_READ_WRITE_TOKEN: z.string().min(1).optional(),

    // Security
    API_SECRET_KEY: z.string().min(1).optional(),

    // Application
    NODE_ENV: z.enum(['development', 'production', 'test']),
  },

  /**
   * Client-side environment variables schema
   * These are exposed to the browser (prefixed with NEXT_PUBLIC_)
   */
  client: {
    NEXT_PUBLIC_APP_NAME: z.string().optional(),
    NEXT_PUBLIC_APP_VERSION: z.string().optional(),
    NEXT_PUBLIC_APP_URL: z.string().url().optional(),
    NEXT_PUBLIC_APP_ENV: z
      .enum(['development', 'production', 'test'])
      .optional(),
    NEXT_PUBLIC_DEBUG: z.string().optional(),
    NEXT_PUBLIC_LOG_LEVEL: z.string().optional(),
    NEXT_PUBLIC_DISABLE_ANALYTICS: z.string().optional(),
  },

  /**
   * Runtime environment variables
   * Map environment variables to the schema
   */
  runtimeEnv: {
    // Server variables
    DATABASE_URL: process.env.DATABASE_URL,
    NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET,
    AUTH_SECRET: process.env.AUTH_SECRET,
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    AUTH_URL: process.env.AUTH_URL,
    PEXELS_API_KEY: process.env.PEXELS_API_KEY,
    DICTIONARY_LEARNERS_API_KEY: process.env.DICTIONARY_LEARNERS_API_KEY,
    DICTIONARY_INTERMEDIATE_API_KEY:
      process.env.DICTIONARY_INTERMEDIATE_API_KEY,
    GOOGLE_TTS_API_KEY: process.env.GOOGLE_TTS_API_KEY,
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    API_SECRET_KEY: process.env.API_SECRET_KEY,
    NODE_ENV: process.env.NODE_ENV,

    // Client variables
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME,
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_DEBUG: process.env.NEXT_PUBLIC_DEBUG,
    NEXT_PUBLIC_LOG_LEVEL: process.env.NEXT_PUBLIC_LOG_LEVEL,
    NEXT_PUBLIC_DISABLE_ANALYTICS: process.env.NEXT_PUBLIC_DISABLE_ANALYTICS,
  },

  /**
   * Makes the type checker happy if you don't want to validate client variables
   */
  skipValidation: !!process.env.SKIP_ENV_VALIDATION,

  /**
   * Error formatter for missing environment variables
   */
  onValidationError: (error) => {
    console.error(
      '❌ Invalid environment variables:',
      error.flatten().fieldErrors,
    );
    throw new Error('Invalid environment variables');
  },

  /**
   * Throw a compile-time error if you try to destructure invalid variables
   */
  emptyStringAsUndefined: true,
});

console.log('=========================', env);
