import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../lib/cors';
import { sql } from '../lib/db';
import { getAuthedClient } from '../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const authed = await getAuthedClient(req);
  if (!authed) return res.status(401).json({ error: 'Unauthorized' });

  if (req.method === 'GET') {
    const rows = authed.role === 'admin'
      ? await sql`SELECT * FROM documents ORDER BY created_at DESC`
      : await sql`SELECT * FROM documents WHERE client_id = ${authed.id} ORDER BY created_at DESC`;
    return res.status(200).json(rows);
  }

  if (req.method === 'POST') {
    // client_id is always the caller's own id — never trust the body for this,
    // it would let one client write document rows under another client's id.
    const { file_name, file_path, document_type, file_size, mime_type, imagekit_file_id } = req.body ?? {};
    const rows = await sql`
      INSERT INTO documents (client_id, file_name, file_path, document_type, file_size, mime_type, imagekit_file_id)
      VALUES (${authed.id}, ${file_name}, ${file_path}, ${document_type}, ${file_size ?? null}, ${mime_type ?? null}, ${imagekit_file_id ?? null})
      RETURNING *
    `;
    return res.status(201).json(rows[0]);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
