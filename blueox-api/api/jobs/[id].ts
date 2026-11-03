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
    const { title, company, location, country, job_type, description, requirements, salary_range, is_active } = req.body ?? {};
    const rows = await sql`
      UPDATE jobs SET
        title = ${title}, company = ${company}, location = ${location}, country = ${country},
        job_type = ${job_type}, description = ${description}, requirements = ${requirements},
        salary_range = ${salary_range}, is_active = ${is_active}, updated_at = now()
      WHERE id = ${id}
      RETURNING *
    `;
    return res.status(200).json(rows[0] ?? null);
  }

  if (req.method === 'DELETE') {
    await sql`DELETE FROM jobs WHERE id = ${id}`;
    return res.status(204).end();
  }

  res.status(405).json({ error: 'Method not allowed' });
}
