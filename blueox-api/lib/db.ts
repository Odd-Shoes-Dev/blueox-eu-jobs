import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL is not set');
}

// Tagged-template SQL client. One shared instance per function invocation — the
// Neon serverless driver is HTTP-based, so there's no connection pool to manage.
export const sql = neon(process.env.DATABASE_URL);
