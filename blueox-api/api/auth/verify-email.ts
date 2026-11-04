import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../../lib/cors';
import { sql } from '../../lib/db';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token } = req.body ?? {};
  if (!token) return res.status(400).json({ error: 'token is required' });

  const rows = await sql`
    UPDATE clients
    SET email_verified = true, verification_token = NULL, verification_token_expires = NULL
    WHERE verification_token = ${token} AND verification_token_expires > now()
    RETURNING id
  `;
  if (rows.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });

  res.status(200).json({ ok: true });
}
