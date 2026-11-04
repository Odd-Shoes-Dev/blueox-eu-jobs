import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../lib/cors';
import { sql } from '../lib/db';
import { getAuthedClient } from '../lib/auth';
import { imagekit } from '../lib/imagekit';

// Flat file, id passed as ?id=... rather than a path segment — see applications.ts
// for why (Vercel's generic routing doesn't support optional catch-all segments).
// GET/POST /api/documents (no id), DELETE/PATCH /api/documents?id=:id.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const authed = await getAuthedClient(req);
  if (!authed) return res.status(401).json({ error: 'Unauthorized' });

  const id = req.query.id as string | undefined;

  if (!id) {
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

    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'DELETE') {
    const rows = await sql`SELECT * FROM documents WHERE id = ${id}`;
    const doc = rows[0];
    if (!doc) return res.status(404).json({ error: 'Not found' });
    if (authed.role !== 'admin' && doc.client_id !== authed.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    if (doc.imagekit_file_id) {
      try {
        await imagekit.deleteFile(doc.imagekit_file_id);
      } catch (err) {
        console.error('ImageKit delete failed:', err);
      }
    }
    await sql`DELETE FROM documents WHERE id = ${id}`;
    return res.status(204).end();
  }

  if (req.method === 'PATCH') {
    // Verify document — admin only.
    if (authed.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const rows = await sql`
      UPDATE documents SET is_verified = true, verified_by = ${authed.id}, verified_at = now()
      WHERE id = ${id}
      RETURNING *
    `;
    return res.status(200).json(rows[0] ?? null);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
