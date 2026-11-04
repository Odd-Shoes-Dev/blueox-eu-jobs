import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../../lib/cors';
import { sql } from '../../lib/db';
import { generateToken } from '../../lib/password';
import { sendEmail } from '../../lib/email';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

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

  res.status(200).json({ ok: true });
}
