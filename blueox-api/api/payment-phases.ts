import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../lib/cors';
import { sql } from '../lib/db';
import { getAuthedClient } from '../lib/auth';

// Flat file, id passed as ?id=... rather than a path segment — see applications.ts
// for why (Vercel's generic routing doesn't support optional catch-all segments).
// GET /api/payment-phases (no id), PATCH /api/payment-phases?id=:id.
const ALLOWED_FIELDS = [
  'phase_1_down_payment', 'phase_1_amount', 'phase_1_date',
  'phase_2_embassy_fee', 'phase_2_amount', 'phase_2_date',
  'phase_3_after_visa_fee', 'phase_3_amount', 'phase_3_date',
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const authed = await getAuthedClient(req);
  if (!authed || authed.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const id = req.query.id as string | undefined;

  if (!id) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const rows = await sql`SELECT * FROM client_payment_phases ORDER BY created_at DESC`;
    return res.status(200).json(rows);
  }

  if (req.method !== 'PATCH') return res.status(405).json({ error: 'Method not allowed' });

  const body: Record<string, unknown> = req.body ?? {};

  const existingRows = await sql`SELECT * FROM client_payment_phases WHERE id = ${id}`;
  const existing = existingRows[0];
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const merged = { ...existing };
  for (const field of ALLOWED_FIELDS) {
    if (field in body) merged[field] = body[field];
  }

  const rows = await sql`
    UPDATE client_payment_phases SET
      phase_1_down_payment = ${merged.phase_1_down_payment},
      phase_1_amount = ${merged.phase_1_amount},
      phase_1_date = ${merged.phase_1_date},
      phase_2_embassy_fee = ${merged.phase_2_embassy_fee},
      phase_2_amount = ${merged.phase_2_amount},
      phase_2_date = ${merged.phase_2_date},
      phase_3_after_visa_fee = ${merged.phase_3_after_visa_fee},
      phase_3_amount = ${merged.phase_3_amount},
      phase_3_date = ${merged.phase_3_date},
      updated_at = now()
    WHERE id = ${id}
    RETURNING *
  `;
  res.status(200).json(rows[0]);
}
