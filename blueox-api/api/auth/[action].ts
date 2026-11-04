import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../../lib/cors';
import { sql } from '../../lib/db';
import { hashPassword, verifyPassword, generateToken } from '../../lib/password';
import { signSessionToken } from '../../lib/auth';
import { sendEmail } from '../../lib/email';

// Dynamic single-segment route: POST /api/auth/signup | login | verify-email |
// request-password-reset | reset-password. Consolidated from 5 files into one to
// stay under Vercel's Hobby-plan 12-serverless-function limit.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const action = req.query.action as string;

  if (action === 'signup') {
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
    return res.status(201).json({ token, client });
  }

  if (action === 'login') {
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
    return res.status(200).json({ token, client: safeClient });
  }

  if (action === 'verify-email') {
    const { token } = req.body ?? {};
    if (!token) return res.status(400).json({ error: 'token is required' });

    const rows = await sql`
      UPDATE clients
      SET email_verified = true, verification_token = NULL, verification_token_expires = NULL
      WHERE verification_token = ${token} AND verification_token_expires > now()
      RETURNING id
    `;
    if (rows.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });

    return res.status(200).json({ ok: true });
  }

  if (action === 'request-password-reset') {
    const { email } = req.body ?? {};
    if (!email) return res.status(400).json({ error: 'email is required' });

    const rows = await sql`SELECT id FROM clients WHERE email = ${email}`;
    // Always return 200 regardless of whether the email exists, so this endpoint
    // can't be used to probe which emails have accounts.
    if (rows.length > 0) {
      const resetToken = generateToken();
      await sql`
        UPDATE clients SET reset_token = ${resetToken}, reset_token_expires = now() + interval '1 hour'
        WHERE id = ${rows[0].id}
      `;
      await sendEmail(email, 'Reset your Blue OX password', `Reset your password using this token: ${resetToken}`);
    }

    return res.status(200).json({ ok: true });
  }

  if (action === 'reset-password') {
    const { token, newPassword } = req.body ?? {};
    if (!token || !newPassword) return res.status(400).json({ error: 'token and newPassword are required' });

    const rows = await sql`SELECT id FROM clients WHERE reset_token = ${token} AND reset_token_expires > now()`;
    if (rows.length === 0) return res.status(400).json({ error: 'Invalid or expired token' });

    const passwordHash = await hashPassword(newPassword);
    await sql`
      UPDATE clients SET password_hash = ${passwordHash}, reset_token = NULL, reset_token_expires = NULL
      WHERE id = ${rows[0].id}
    `;
    return res.status(200).json({ ok: true });
  }

  res.status(404).json({ error: 'Unknown auth action' });
}
