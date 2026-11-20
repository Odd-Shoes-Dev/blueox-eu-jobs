import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../lib/cors';
import { sql } from '../lib/db';
import { getAuthedClient, getAuthedPartner, getCandidateByAccessToken } from '../lib/auth';
import { generateToken } from '../lib/password';

const EDITABLE_FIELDS = [
  'full_name', 'date_of_birth', 'nationality', 'phone', 'email',
  'country_of_residence', 'eu_citizenship', 'target_country', 'job_category',
  'driving_licence', 'driving_licence_conversion_status', 'video_url',
] as const;

const REQUIRED_TO_SUBMIT = ['full_name', 'date_of_birth', 'nationality', 'email'] as const;

// `date_of_birth` is a plain DATE column — every query below casts it to
// text (`date_of_birth::text`) so it comes back as a plain 'YYYY-MM-DD'
// string instead of a JS Date, which the pg driver would otherwise construct
// in the server process's local timezone and shift by a day.

// Hosts two otherwise-unrelated resources behind the same file/Vercel function —
// blueox-api was already at 12/12 (the Hobby-plan hard cap) before the Partner
// Portal, so this extends clients.ts's routing instead of adding a new file, same
// consolidation principle as every other `?id=`/`?resource=` flat file here.
//
// No `resource` param: GET /api/clients — unchanged, admin-only client list.
//
// `resource=partner-candidates` — the Partner Portal:
//   GET/POST /api/clients?resource=partner-candidates (no id) — partner JWT.
//     Lists/creates that partner's own candidates. Admin: GET with
//     &partner_id= lists that partner's candidates (read-only, no POST).
//   GET/PATCH/DELETE ...&id=:id — partner JWT (must own it). Admin: GET only,
//     any candidate, no ownership check — read-only visibility, no editing
//     here yet.
//   GET/PATCH ...&token=:accessToken — candidate self-service, no id needed
//     (the token alone resolves to exactly one row).
//   PATCH ...&action=submit — candidate-token only, draft -> submitted.
//   PATCH ...&action=lock | request-changes — partner JWT only.
//
// `resource=partner` — admin only, read/approve/suspend a partner's
//   registration_status: GET/PATCH ...&id=:id.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const resource = req.query.resource as string | undefined;

  if (!resource) {
    if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
    const authed = await getAuthedClient(req);
    if (!authed || authed.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const rows = await sql`SELECT * FROM clients ORDER BY created_at DESC`;
    return res.status(200).json(rows);
  }

  const id = req.query.id as string | undefined;

  if (resource === 'partner') {
    const authed = await getAuthedClient(req);
    if (!authed || authed.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    if (!id) return res.status(400).json({ error: 'id is required' });

    if (req.method === 'GET') {
      const rows = await sql`
        SELECT id, company_name, contact_person_name, contact_email, contact_phone, email,
               registration_status, registration_number, tax_id, business_activity_notes,
               billing_contact_name, billing_email, billing_address, invoicing_enabled,
               created_at, updated_at
        FROM partners WHERE id = ${id}
      `;
      if (!rows[0]) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(rows[0]);
    }

    if (req.method === 'PATCH') {
      const { registration_status } = req.body ?? {};
      if (!['pending_review', 'approved', 'rejected', 'suspended'].includes(registration_status)) {
        return res.status(400).json({ error: 'Invalid registration_status' });
      }
      const rows = await sql`
        UPDATE partners SET registration_status = ${registration_status}, updated_at = now()
        WHERE id = ${id}
        RETURNING id, company_name, contact_email, registration_status
      `;
      if (!rows[0]) return res.status(404).json({ error: 'Not found' });
      return res.status(200).json(rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (resource !== 'partner-candidates') return res.status(404).json({ error: 'Unknown resource' });

  // Resolve caller: a partner JWT, a candidate access token, or an admin
  // client — mutually exclusive in practice. Candidate-token requests never
  // need ?id= at all; getCandidateByAccessToken already fetched the full row.
  const authedPartner = await getAuthedPartner(req);
  const tokenParam = (req.query.token as string | undefined) ?? (req.body as { token?: string } | undefined)?.token;
  const candidate = authedPartner ? null : await getCandidateByAccessToken(tokenParam);
  const isAdmin = !authedPartner && !candidate
    ? (await getAuthedClient(req))?.role === 'admin'
    : false;

  if (!authedPartner && !candidate && !isAdmin) return res.status(401).json({ error: 'Unauthorized' });

  if ((authedPartner || isAdmin) && !id) {
    if (req.method === 'GET') {
      const partnerId = authedPartner ? authedPartner.id : (req.query.partner_id as string | undefined);
      if (!partnerId) return res.status(400).json({ error: 'partner_id is required' });
      const rows = await sql`
        SELECT id, partner_id, access_token, status, changes_requested_note,
               full_name, date_of_birth::text AS date_of_birth, nationality, phone, email,
               country_of_residence, eu_citizenship, target_country, job_category,
               driving_licence, driving_licence_conversion_status, video_url,
               placement_status, placed_job_id, placed_at, created_at, updated_at
        FROM partner_candidates WHERE partner_id = ${partnerId} ORDER BY created_at DESC
      `;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      if (!authedPartner) return res.status(403).json({ error: 'Forbidden' });
      const accessToken = generateToken();
      const rows = await sql`
        INSERT INTO partner_candidates (partner_id, access_token)
        VALUES (${authedPartner.id}, ${accessToken})
        RETURNING id, partner_id, access_token, status, changes_requested_note,
          full_name, date_of_birth::text AS date_of_birth, nationality, phone, email,
          country_of_residence, eu_citizenship, target_country, job_category,
          driving_licence, driving_licence_conversion_status, video_url,
          placement_status, placed_job_id, placed_at, created_at, updated_at
      `;
      return res.status(201).json(rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  // From here on we're operating on one specific candidate row.
  let row: Record<string, unknown> | undefined;
  if (candidate) {
    row = candidate as Record<string, unknown>;
  } else {
    if (!id) return res.status(400).json({ error: 'id is required' });
    const rows = await sql`
      SELECT id, partner_id, access_token, status, changes_requested_note,
             full_name, date_of_birth::text AS date_of_birth, nationality, phone, email,
             country_of_residence, eu_citizenship, target_country, job_category,
             driving_licence, driving_licence_conversion_status, video_url,
             placement_status, placed_job_id, placed_at, created_at, updated_at
      FROM partner_candidates WHERE id = ${id}
    `;
    row = rows[0];
    if (!row) return res.status(404).json({ error: 'Not found' });
    if (!isAdmin && row.partner_id !== authedPartner!.id) return res.status(403).json({ error: 'Forbidden' });
  }

  // Admin access is read-only for now — no editing/locking/deleting a
  // candidate from here yet, just visibility into what a partner submitted.
  if (isAdmin && req.method !== 'GET') {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const targetId = row.id as string;
  const action = req.query.action as string | undefined;

  if (req.method === 'GET') {
    if (candidate) {
      const { access_token, ...candidateView } = row;
      void access_token;
      return res.status(200).json(candidateView);
    }
    return res.status(200).json(row);
  }

  if (req.method === 'DELETE') {
    if (!authedPartner) return res.status(403).json({ error: 'Forbidden' });
    await sql`DELETE FROM partner_candidates WHERE id = ${targetId}`;
    return res.status(204).end();
  }

  if (req.method === 'PATCH') {
    if (action === 'lock') {
      if (!authedPartner) return res.status(403).json({ error: 'Forbidden' });
      const updated = await sql`
        UPDATE partner_candidates SET status = 'locked', updated_at = now()
        WHERE id = ${targetId}
        RETURNING id, partner_id, access_token, status, changes_requested_note,
          full_name, date_of_birth::text AS date_of_birth, nationality, phone, email,
          country_of_residence, eu_citizenship, target_country, job_category,
          driving_licence, driving_licence_conversion_status, video_url,
          placement_status, placed_job_id, placed_at, created_at, updated_at
      `;
      return res.status(200).json(updated[0]);
    }

    if (action === 'request-changes') {
      if (!authedPartner) return res.status(403).json({ error: 'Forbidden' });
      const { note } = req.body ?? {};
      if (!note) return res.status(400).json({ error: 'note is required' });
      const updated = await sql`
        UPDATE partner_candidates
        SET status = 'changes_requested', changes_requested_note = ${note}, updated_at = now()
        WHERE id = ${targetId}
        RETURNING id, partner_id, access_token, status, changes_requested_note,
          full_name, date_of_birth::text AS date_of_birth, nationality, phone, email,
          country_of_residence, eu_citizenship, target_country, job_category,
          driving_licence, driving_licence_conversion_status, video_url,
          placement_status, placed_job_id, placed_at, created_at, updated_at
      `;
      return res.status(200).json(updated[0]);
    }

    if (action === 'submit') {
      if (!candidate) return res.status(403).json({ error: 'Forbidden' });
      if (row.status !== 'draft') return res.status(403).json({ error: 'Cannot submit from the current status' });
      const missing = REQUIRED_TO_SUBMIT.filter((f) => !row![f]);
      if (missing.length > 0) {
        return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
      }
      const updated = await sql`
        UPDATE partner_candidates SET status = 'submitted', updated_at = now()
        WHERE id = ${targetId}
        RETURNING id, partner_id, access_token, status, changes_requested_note,
          full_name, date_of_birth::text AS date_of_birth, nationality, phone, email,
          country_of_residence, eu_citizenship, target_country, job_category,
          driving_licence, driving_licence_conversion_status, video_url,
          placement_status, placed_job_id, placed_at, created_at, updated_at
      `;
      return res.status(200).json(updated[0]);
    }

    if (action) return res.status(400).json({ error: 'Unknown action' });

    // Plain field update — partner can edit regardless of status; a candidate
    // can only edit while draft/changes_requested, and a write while
    // changes_requested auto-reopens the record to draft.
    if (candidate && !['draft', 'changes_requested'].includes(row.status as string)) {
      return res.status(403).json({ error: 'This record is locked and cannot be edited right now' });
    }

    const b = (req.body ?? {}) as Record<string, unknown>;
    const values = Object.fromEntries(EDITABLE_FIELDS.map((f) => [f, b[f] ?? row![f]]));
    const reopening = candidate && row.status === 'changes_requested';

    const updated = await sql`
      UPDATE partner_candidates SET
        full_name = ${values.full_name as string | null},
        date_of_birth = ${values.date_of_birth as string | null},
        nationality = ${values.nationality as string | null},
        phone = ${values.phone as string | null},
        email = ${values.email as string | null},
        country_of_residence = ${values.country_of_residence as string | null},
        eu_citizenship = ${values.eu_citizenship as boolean | null},
        target_country = ${values.target_country as string | null},
        job_category = ${values.job_category as string | null},
        driving_licence = ${values.driving_licence as boolean | null},
        driving_licence_conversion_status = ${values.driving_licence_conversion_status as string | null},
        video_url = ${values.video_url as string | null},
        status = ${reopening ? 'draft' : row.status as string},
        changes_requested_note = ${reopening ? null : row.changes_requested_note as string | null},
        updated_at = now()
      WHERE id = ${targetId}
      RETURNING id, partner_id, access_token, status, changes_requested_note,
        full_name, date_of_birth::text AS date_of_birth, nationality, phone, email,
        country_of_residence, eu_citizenship, target_country, job_category,
        driving_licence, driving_licence_conversion_status, video_url,
        placement_status, placed_job_id, placed_at, created_at, updated_at
    `;
    return res.status(200).json(updated[0]);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
