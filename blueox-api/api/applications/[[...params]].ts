import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../../lib/cors';
import { sql } from '../../lib/db';
import { getAuthedClient } from '../../lib/auth';

// Catch-all: GET/POST /api/applications (no id), PATCH/DELETE /api/applications/:id.
// Consolidated from two files (applications.ts + applications/[id].ts) to stay
// under Vercel's Hobby-plan 12-serverless-function limit.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const params = req.query.params;
  const id = Array.isArray(params) ? params[0] : undefined;

  if (!id) {
    if (req.method === 'GET') {
      const authed = await getAuthedClient(req);
      if (!authed) return res.status(401).json({ error: 'Unauthorized' });

      const rows = authed.role === 'admin'
        ? await sql`SELECT * FROM applications ORDER BY created_at DESC`
        : await sql`SELECT * FROM applications WHERE client_id = ${authed.id} ORDER BY created_at DESC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      // Public — matches the previous fully-open "anon insert" RLS policy on
      // applications (anonymous chatbot submissions, and the post-login/signup
      // conversation-to-application save in Login.tsx).
      const {
        client_id, user_path, application_type, target_country, status, data,
        conversation_context, created_at,
      } = req.body ?? {};
      const rows = await sql`
        INSERT INTO applications (client_id, user_path, application_type, target_country, status, data, conversation_context, created_at)
        VALUES (${client_id ?? null}, ${user_path ?? null}, ${application_type ?? null}, ${target_country ?? null},
                ${status ?? 'pending'}, ${data ?? null}, ${conversation_context ?? null}, ${created_at ?? new Date().toISOString()})
        RETURNING *
      `;
      return res.status(201).json(rows);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authed = await getAuthedClient(req);
  if (!authed || authed.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

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
