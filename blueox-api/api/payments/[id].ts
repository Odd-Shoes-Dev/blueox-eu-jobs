import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../../lib/cors';
import { sql } from '../../lib/db';
import { getAuthedClient } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const authed = await getAuthedClient(req);
  if (!authed || authed.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const id = req.query.id as string;
  const { status } = req.body ?? {};
  const verifiedBy = status === 'verified' ? authed.id : null;

  const rows = await sql`
    UPDATE payments SET status = ${status}, verified_by = ${verifiedBy}, updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;
  res.status(200).json(rows[0] ?? null);
}
