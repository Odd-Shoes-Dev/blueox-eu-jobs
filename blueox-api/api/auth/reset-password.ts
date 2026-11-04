import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../../lib/cors';
import { sql } from '../../lib/db';
import { hashPassword } from '../../lib/password';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { token, newPassword } = req.body ?? {};
  if (!token || !newPassword) return res.status(400).json({ error: 'token and newPassword are required' });

  const rows = await sql`SELECT id FROM clients WHERE reset_token = ${token} AND reset_token_expires > now()`;
  if (rows.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });

  const passwordHash = await hashPassword(newPassword);
  await sql`
    UPDATE clients SET password_hash = ${passwordHash}, reset_token = NULL, reset_token_expires = NULL
    WHERE id = ${rows[0].id}
  `;
  res.status(200).json({ ok: true });
}
