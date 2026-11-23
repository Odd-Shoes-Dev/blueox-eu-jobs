import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../lib/cors';
import { sql } from '../lib/db';
import { getAuthedClient } from '../lib/auth';

// One-shot endpoint for the admin dashboards' initial load. Both frontends used to
// fetch clients/applications/documents/payments/(payment-phases)/jobs as 5-6
// separate HTTP requests, each independently re-verifying auth (its own Neon query)
// and each a different serverless function that could cold-start on its own. This
// bundles all of it into one function invocation: one cold start, one auth check,
// every query run concurrently server-side instead of as separate round trips from
// the browser. blueox doesn't use paymentPhases — harmless to send it anyway.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const authed = await getAuthedClient(req);
  if (!authed || authed.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

  const [clients, applications, documents, payments, paymentPhases, jobs, partners] = await Promise.all([
    sql`SELECT * FROM clients ORDER BY created_at DESC`,
    sql`SELECT * FROM applications ORDER BY created_at DESC`,
    sql`SELECT * FROM documents ORDER BY created_at DESC`,
    sql`SELECT * FROM payments ORDER BY created_at DESC`,
    sql`SELECT * FROM client_payment_phases ORDER BY created_at DESC`,
    sql`SELECT * FROM jobs ORDER BY created_at DESC`,
    // Read-only partner visibility for blueox-admin — no candidate editing here,
    // just the list plus the registration_status approve/suspend toggle (done via
    // PATCH /api/partner-candidates?resource=partner&id=, not this endpoint).
    // candidate_count excludes drafts — a candidate the partner/candidate hasn't
    // finished filling in yet isn't something admin needs visibility into; see
    // the matching `status !== 'draft'` filter on the frontend's candidate list.
    sql`SELECT id, company_name, contact_person_name, contact_email, contact_phone,
               registration_status, code, created_at,
               (SELECT count(*) FROM partner_candidates pc WHERE pc.partner_id = partners.id AND pc.status != 'draft') AS candidate_count
        FROM partners ORDER BY created_at DESC`,
  ]);

  res.status(200).json({ clients, applications, documents, payments, paymentPhases, jobs, partners });
}
