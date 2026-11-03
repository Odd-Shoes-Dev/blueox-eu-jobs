import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../../lib/cors';
import { imagekit } from '../../lib/imagekit';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Public — no auth required. This only grants "can upload a file to ImageKit",
  // which matches the pre-migration reality: the Supabase anon key already made
  // both storage buckets effectively open to any caller holding it (a public key).
  const { token, expire, signature } = imagekit.getAuthenticationParameters();
  res.status(200).json({
    token,
    expire,
    signature,
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT,
  });
}
