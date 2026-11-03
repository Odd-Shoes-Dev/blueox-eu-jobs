import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../lib/cors';
import { sql } from '../lib/db';
import { getAuthedClient } from '../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

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

  res.status(405).json({ error: 'Method not allowed' });
}
