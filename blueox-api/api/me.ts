import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../lib/cors';
import { sql } from '../lib/db';
import { getClerkUserId } from '../lib/auth';
import { clerkClient } from '../lib/clerk';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const clerkUserId = await getClerkUserId(req);
  if (!clerkUserId) return res.status(401).json({ error: 'Unauthorized' });

  let rows = await sql`SELECT * FROM clients WHERE auth_user_id = ${clerkUserId}`;

  if (rows.length === 0) {
    // First authenticated request for this Clerk user — create their clients row,
    // mirroring what AuthContext's signUp used to do synchronously at signup time.
    const user = await clerkClient.users.getUser(clerkUserId);
    const email = user.emailAddresses[0]?.emailAddress ?? '';
    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ') || email;
    rows = await sql`
      INSERT INTO clients (auth_user_id, email, full_name, role)
      VALUES (${clerkUserId}, ${email}, ${fullName}, 'student')
      RETURNING *
    `;
  }

  const client = rows[0];
  res.status(200).json({ client, isAdmin: client.role === 'admin' });
}
