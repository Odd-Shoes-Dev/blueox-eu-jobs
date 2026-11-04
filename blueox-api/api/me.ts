import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../lib/cors';
import { getAuthedClient } from '../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const client = await getAuthedClient(req);
  if (!client) return res.status(401).json({ error: 'Unauthorized' });

  res.status(200).json({ client, isAdmin: client.role === 'admin' });
}
