import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../../lib/cors';
import { getAuthedClient } from '../../lib/auth';
import { imagekit, findFileIdByPath } from '../../lib/imagekit';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Admin only — this is used for application attachments managed from the admin
  // dashboard (blueox-admin's deleteApplicationDocument), which are tracked only
  // as a path inside applications.data JSON, not a documents table row.
  const authed = await getAuthedClient(req);
  if (!authed || authed.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const { path } = req.body ?? {};
  if (!path) return res.status(400).json({ error: 'path is required' });

  const fileId = await findFileIdByPath(path);
  if (!fileId) return res.status(404).json({ error: 'File not found' });

  await imagekit.deleteFile(fileId);
  res.status(204).end();
}
