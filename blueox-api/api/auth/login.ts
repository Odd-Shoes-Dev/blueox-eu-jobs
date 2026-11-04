import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../../lib/cors';
import { sql } from '../../lib/db';
import { verifyPassword } from '../../lib/password';
import { signSessionToken } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password } = req.body ?? {};
  if (!email || !password) return res.status(400).json({ error: 'email and password are required' });

  const rows = await sql`SELECT * FROM clients WHERE email = ${email}`;
  const client = rows[0];
  if (!client || !client.password_hash) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await verifyPassword(password, client.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = signSessionToken(client.id);
  const { password_hash, verification_token, reset_token, ...safeClient } = client;
  res.status(200).json({ token, client: safeClient });
}
