import type { VercelRequest } from '@vercel/node';
import { verifyToken } from '@clerk/backend';
import { sql } from '../lib/db';

export interface AuthedClient {
  id: string;
  auth_user_id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'student' | 'workforce';
}

/** Verifies the Clerk session token in the Authorization header. Returns the
 * Clerk user id (the JWT's `sub`), or null if missing/invalid. */
export async function getClerkUserId(req: VercelRequest): Promise<string | null> {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length);
  try {
    const payload = await verifyToken(token, { secretKey: process.env.CLERK_SECRET_KEY! });
    return payload.sub ?? null;
  } catch {
    return null;
  }
}

/** Verifies the token and loads the matching `clients` row. Returns null if the
 * token is missing/invalid, or if no clients row exists yet for this Clerk user
 * (callers should direct the frontend to hit GET /api/me first, which creates it). */
export async function getAuthedClient(req: VercelRequest): Promise<AuthedClient | null> {
  const clerkUserId = await getClerkUserId(req);
  if (!clerkUserId) return null;
  const rows = await sql`
    SELECT id, auth_user_id, email, full_name, role FROM clients WHERE auth_user_id = ${clerkUserId}
  `;
  return (rows[0] as AuthedClient) ?? null;
}
