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

export interface AuthedPartner {
  id: string;
  company_name: string;
  contact_email: string;
  registration_status: string;
}

/** Signs a session token for a client. `sub` is clients.id directly — unlike the
 * Clerk version, there's no external id to map through. Existing tokens issued
 * before the Partner Portal have no `typ` claim at all — getAuthedClient still
 * accepts those, so this doesn't need to change to add `typ: 'client'` here. */
export function signSessionToken(clientId: string): string {
  return jwt.sign({ sub: clientId }, JWT_SECRET, { expiresIn: '30d' });
}

/** Signs a session token for a partner. Always carries `typ: 'partner'`, so a
 * partner token can never be misread as a client id by getAuthedClient. */
export function signPartnerSessionToken(partnerId: string): string {
  return jwt.sign({ sub: partnerId, typ: 'partner' }, JWT_SECRET, { expiresIn: '30d' });
}

interface TokenPayload {
  sub: string;
  typ?: string;
}

function getTokenPayload(req: VercelRequest): TokenPayload | null {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return null;
  const token = header.slice('Bearer '.length);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (typeof payload === 'string' || !payload.sub) return null;
    return { sub: payload.sub, typ: typeof payload.typ === 'string' ? payload.typ : undefined };
  } catch {
    return null;
  }
}

export async function getAuthedClient(req: VercelRequest): Promise<AuthedClient | null> {
  const payload = getTokenPayload(req);
  // A legacy client token has no `typ` at all — still accepted. A partner
  // token always carries `typ: 'partner'` — explicitly rejected here so it's
  // never misread against the clients table.
  if (!payload || (payload.typ && payload.typ !== 'client')) return null;
  const rows = await sql`
    SELECT id, auth_user_id, email, full_name, role FROM clients WHERE id = ${payload.sub}
  `;
  return (rows[0] as AuthedClient) ?? null;
}

export async function getAuthedPartner(req: VercelRequest): Promise<AuthedPartner | null> {
  const payload = getTokenPayload(req);
  if (!payload || payload.typ !== 'partner') return null;
  const rows = await sql`
    SELECT id, company_name, contact_email, registration_status FROM partners WHERE id = ${payload.sub}
  `;
  return (rows[0] as AuthedPartner) ?? null;
}

/** Candidate self-service auth — not a JWT at all. The access_token travels as a
 * query param or body field and is matched directly against partner_candidates
 * per request: not signed, not expiring, scoped to exactly that one row (same
 * risk tier as clients.verification_token/reset_token). */
export async function getCandidateByAccessToken(token: string | undefined) {
  if (!token) return null;
  // date_of_birth is a plain DATE column — cast to text so it comes back as
  // 'YYYY-MM-DD' instead of a JS Date, which the pg driver would otherwise
  // construct in the server process's local timezone and shift by a day.
  const rows = await sql`
    SELECT id, partner_id, access_token, status, changes_requested_note,
           full_name, date_of_birth::text AS date_of_birth, nationality, phone, email,
           country_of_residence, eu_citizenship, target_country, job_category,
           driving_licence, driving_licence_conversion_status, video_url,
           placement_status, placed_job_id, placed_at, created_at, updated_at
    FROM partner_candidates WHERE access_token = ${token}
  `;
  return rows[0] ?? null;
}
