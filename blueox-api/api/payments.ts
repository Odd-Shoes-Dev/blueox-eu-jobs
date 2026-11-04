import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../lib/cors';
import { sql } from '../lib/db';
import { getAuthedClient } from '../lib/auth';

// Flat file, id passed as ?id=... rather than a path segment — see applications.ts
// for why (Vercel's generic routing doesn't support optional catch-all segments).
// GET/POST /api/payments (no id), PATCH /api/payments?id=:id.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const authed = await getAuthedClient(req);
  if (!authed || authed.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const id = req.query.id as string | undefined;

  if (!id) {
    if (req.method === 'GET') {
      const rows = await sql`SELECT * FROM payments ORDER BY created_at DESC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { client_id, phase, amount } = req.body ?? {};
      const rows = await sql`
        INSERT INTO payments (client_id, phase, amount, currency, status)
        VALUES (${client_id}, ${phase}, ${amount}, 'EUR', 'pending')
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'PATCH') {
    const { status } = req.body ?? {};
    const verifiedBy = status === 'verified' ? authed.id : null;

    const rows = await sql`
      UPDATE payments SET status = ${status}, verified_by = ${verifiedBy}, updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;
    return res.status(200).json(rows[0] ?? null);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
