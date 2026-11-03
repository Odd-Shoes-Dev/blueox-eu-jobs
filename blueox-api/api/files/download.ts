import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../../lib/cors';
import { getAuthedClient } from '../../lib/auth';
import { imagekit } from '../../lib/imagekit';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Requires a logged-in caller (any role) — matches reality: every page that
  // downloads a document (Portal, Admin) was already behind a login-gated route.
  const authed = await getAuthedClient(req);
  if (!authed) return res.status(401).json({ error: 'Unauthorized' });

  const path = req.query.path as string | undefined;
  if (!path) return res.status(400).json({ error: 'path is required' });

  const url = imagekit.url({ path: `/${path}`.replace(/\/+/g, '/'), signed: true, expireSeconds: 300 });
  res.status(200).json({ url });
}
