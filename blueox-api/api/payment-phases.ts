import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../lib/cors';
import { sql } from '../lib/db';
import { getAuthedClient } from '../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authed = await getAuthedClient(req);
  if (!authed || authed.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const rows = await sql`SELECT * FROM client_payment_phases ORDER BY created_at DESC`;
  res.status(200).json(rows);
}
