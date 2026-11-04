import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../lib/cors';
import { getAuthedClient } from '../lib/auth';
import { imagekit, toRootScopedPath, findFileIdByPath } from '../lib/imagekit';

// GET /api/files?path=... -> signed download/preview URL (any logged-in caller).
// POST /api/files {path} -> delete a file (admin only). Consolidated from
// files/download.ts + files/delete.ts to stay under Vercel's Hobby-plan
// 12-serverless-function limit.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method === 'GET') {
    // Requires a logged-in caller (any role) — matches reality: every page that
    // downloads a document (Portal, Admin) was already behind a login-gated route.
    const authed = await getAuthedClient(req);
    if (!authed) return res.status(401).json({ error: 'Unauthorized' });

    const path = req.query.path as string | undefined;
    if (!path) return res.status(400).json({ error: 'path is required' });

    const url = imagekit.url({ path: toRootScopedPath(path), signed: true, expireSeconds: 300 });
    return res.status(200).json({ url });
  }

  if (req.method === 'POST') {
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
    return res.status(204).end();
  }

  res.status(405).json({ error: 'Method not allowed' });
}
