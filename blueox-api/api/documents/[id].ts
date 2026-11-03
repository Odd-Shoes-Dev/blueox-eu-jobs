import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../../lib/cors';
import { sql } from '../../lib/db';
import { getAuthedClient } from '../../lib/auth';
import { imagekit } from '../../lib/imagekit';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const authed = await getAuthedClient(req);
  if (!authed) return res.status(401).json({ error: 'Unauthorized' });

  const id = req.query.id as string;

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
