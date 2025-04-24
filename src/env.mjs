import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    PEXELS_API_KEY: z.string().min(1),
    DATABASE_URL: z.string().url(),
    NODE_ENV: z.enum(['development', 'production', 'test']),
  },
  client: {
    // Add client-side env vars here if needed
  },
  runtimeEnv: {
    PEXELS_API_KEY: process.env.PEXELS_API_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    NODE_ENV: process.env.NODE_ENV,
  },
});

console.log('=========================', env);
