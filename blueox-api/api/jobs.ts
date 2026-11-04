import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../lib/cors';
import { sql } from '../lib/db';
import { getAuthedClient } from '../lib/auth';

// Flat file, id passed as ?id=... rather than a path segment — see applications.ts
// for why (Vercel's generic routing doesn't support optional catch-all segments).
// GET/POST /api/jobs (no id), PATCH/DELETE /api/jobs?id=:id.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const id = req.query.id as string | undefined;

  if (!id) {
    if (req.method === 'GET') {
      // Public — matches the previous fully-open "anon select" RLS policy on jobs.
      const activeOnly = req.query.active === 'true';
      const rows = activeOnly
        ? await sql`SELECT * FROM jobs WHERE is_active = true ORDER BY created_at DESC`
        : await sql`SELECT * FROM jobs ORDER BY created_at DESC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const authed = await getAuthedClient(req);
      if (!authed || authed.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

      const { title, company, location, country, job_type, description, requirements, salary_range } = req.body ?? {};
      const rows = await sql`
        INSERT INTO jobs (title, company, location, country, job_type, description, requirements, salary_range, is_active)
        VALUES (${title}, ${company}, ${location}, ${country}, ${job_type}, ${description}, ${requirements}, ${salary_range}, true)
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authed = await getAuthedClient(req);
  if (!authed || authed.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

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
