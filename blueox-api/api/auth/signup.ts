import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../../lib/cors';
import { sql } from '../../lib/db';
import { hashPassword, generateToken } from '../../lib/password';
import { signSessionToken } from '../../lib/auth';
import { sendEmail } from '../../lib/email';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { email, password, full_name, role, phone } = req.body ?? {};
  if (!email || !password || !full_name) {
    return res.status(400).json({ error: 'email, password, and full_name are required' });
  }

  const existing = await sql`SELECT id FROM clients WHERE email = ${email}`;
  if (existing.length > 0) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await hashPassword(password);
  const verificationToken = generateToken();
  const safeRole = role === 'workforce' ? 'workforce' : 'student';

  const rows = await sql`
    INSERT INTO clients (email, full_name, role, phone, password_hash, verification_token, verification_token_expires)
    VALUES (${email}, ${full_name}, ${safeRole}, ${phone ?? null}, ${passwordHash}, ${verificationToken}, now() + interval '24 hours')
    RETURNING id, auth_user_id, email, full_name, role
  `;
  const client = rows[0];

  await sendEmail(
    email,
    'Verify your Blue OX account',
    `Welcome to Blue OX! Verify your email using this token: ${verificationToken}`
  );

  const token = signSessionToken(client.id);
  res.status(201).json({ token, client });
}
