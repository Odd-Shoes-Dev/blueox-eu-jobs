import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../lib/cors';
import { sql } from '../lib/db';
import { getAuthedClient } from '../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

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

  res.status(405).json({ error: 'Method not allowed' });
}
