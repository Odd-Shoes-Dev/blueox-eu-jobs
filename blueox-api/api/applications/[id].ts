import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../../lib/cors';
import { sql } from '../../lib/db';
import { getAuthedClient } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const authed = await getAuthedClient(req);
  if (!authed || authed.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const id = req.query.id as string;

  if (req.method === 'PATCH') {
    // Covers both Admin.tsx's status-only update and App.tsx's full
    // (data + status) edit — any field left out of the body keeps its current value.
    const existingRows = await sql`SELECT * FROM applications WHERE id = ${id}`;
    const existing = existingRows[0];
    if (!existing) return res.status(404).json({ error: 'Not found' });

    const status = req.body?.status ?? existing.status;
    const data = req.body?.data !== undefined ? req.body.data : existing.data;

    const rows = await sql`
      UPDATE applications SET status = ${status}, data = ${data}, updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;
    return res.status(200).json(rows[0]);
  }

  if (req.method === 'DELETE') {
    await sql`DELETE FROM applications WHERE id = ${id}`;
    return res.status(204).end();
  }

  res.status(405).json({ error: 'Method not allowed' });
}
