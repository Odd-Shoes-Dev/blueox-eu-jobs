// Custom email/password auth. Clerk is intentionally NOT used right now (kept
// installed and dormant — see AUTH.md for how to switch back). This file keeps the
// exact same exported shape the Clerk version had (getAuthedClient(req) ->
// AuthedClient | null) so every other endpoint that imports it needed no changes.
import type { VercelRequest } from '@vercel/node';
import jwt from 'jsonwebtoken';
import { sql } from './db';

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET is not set');
}
const JWT_SECRET = process.env.JWT_SECRET;

export interface AuthedClient {
  id: string;
  auth_user_id: string | null;
  email: string;
  full_name: string;
  role: 'admin' | 'student' | 'workforce';
}

/** Signs a session token for a client. `sub` is clients.id directly — unlike the
 * Clerk version, there's no external id to map through. */
export function signSessionToken(clientId: string): string {
  return jwt.sign({ sub: clientId }, JWT_SECRET, { expiresIn: '30d' });
}

function getClientIdFromToken(req: VercelRequest): string | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload === 'string' || !payload.sub) return null;
    return payload.sub;
  } catch {
    return null;
  }
}

export async function getAuthedClient(req: VercelRequest): Promise<AuthedClient | null> {
  const clientId = getClientIdFromToken(req);
  if (!clientId) return null;
  const rows = await sql`
    SELECT id, auth_user_id, email, full_name, role FROM clients WHERE id = ${clientId}
  `;
  return (rows[0] as AuthedClient) ?? null;
}
