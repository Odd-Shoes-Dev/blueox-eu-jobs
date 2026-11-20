import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../lib/cors';
import { sql } from '../lib/db';
import { getAuthedClient, getAuthedPartner, getCandidateByAccessToken } from '../lib/auth';
import { imagekit } from '../lib/imagekit';

// Flat file, id passed as ?id=... rather than a path segment — see applications.ts
// for why (Vercel's generic routing doesn't support optional catch-all segments).
// GET/POST /api/documents (no id), DELETE/PATCH /api/documents?id=:id.
//
// Three caller types, resolved in order: an authed client (student/workforce/
// admin), an authed partner, or a candidate access token (?token=). Exactly one
// of client_id/partner_candidate_id is ever set on a document row — see the
// documents_owner_xor_chk constraint in 0014_alter_documents_for_partner_candidates.sql.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  const authed = await getAuthedClient(req);
  const authedPartner = authed ? null : await getAuthedPartner(req);
  const tokenParam = (req.query.token as string | undefined) ?? (req.body as { token?: string } | undefined)?.token;
  const candidate = authed || authedPartner ? null : await getCandidateByAccessToken(tokenParam);

  if (!authed && !authedPartner && !candidate) return res.status(401).json({ error: 'Unauthorized' });

  const id = req.query.id as string | undefined;

  if (!id) {
    if (req.method === 'GET') {
      if (authed) {
        const rows = authed.role === 'admin'
          ? await sql`SELECT * FROM documents ORDER BY created_at DESC`
          : await sql`SELECT * FROM documents WHERE client_id = ${authed.id} ORDER BY created_at DESC`;
        return res.status(200).json(rows);
      }
      if (authedPartner) {
        const rows = await sql`
          SELECT d.* FROM documents d
          JOIN partner_candidates pc ON pc.id = d.partner_candidate_id
          WHERE pc.partner_id = ${authedPartner.id}
          ORDER BY d.created_at DESC
        `;
        return res.status(200).json(rows);
      }
      // candidate
      const rows = await sql`SELECT * FROM documents WHERE partner_candidate_id = ${candidate!.id} ORDER BY created_at DESC`;
      return res.status(200).json(rows);
    }

    if (req.method === 'POST') {
      const { file_name, file_path, document_type, file_size, mime_type, imagekit_file_id } = req.body ?? {};

      if (authed) {
        // client_id is always the caller's own id — never trust the body for
        // this, it would let one client write document rows under another
        // client's id.
        const rows = await sql`
          INSERT INTO documents (client_id, file_name, file_path, document_type, file_size, mime_type, imagekit_file_id)
          VALUES (${authed.id}, ${file_name}, ${file_path}, ${document_type}, ${file_size ?? null}, ${mime_type ?? null}, ${imagekit_file_id ?? null})
          RETURNING *
        `;
        return res.status(201).json(rows[0]);
      }

      if (authedPartner) {
        // partner_candidate_id comes from the body, but ownership is verified
        // server-side before trusting it — never let a partner attach a
        // document to a candidate that isn't theirs.
        const { partner_candidate_id } = req.body ?? {};
        if (!partner_candidate_id) return res.status(400).json({ error: 'partner_candidate_id is required' });
        const owned = await sql`SELECT 1 FROM partner_candidates WHERE id = ${partner_candidate_id} AND partner_id = ${authedPartner.id}`;
        if (owned.length === 0) return res.status(403).json({ error: 'Forbidden' });

        const rows = await sql`
          INSERT INTO documents (partner_candidate_id, file_name, file_path, document_type, file_size, mime_type)
          VALUES (${partner_candidate_id}, ${file_name}, ${file_path}, ${document_type}, ${file_size ?? null}, ${mime_type ?? null})
          RETURNING *
        `;
        return res.status(201).json(rows[0]);
      }

      // candidate — partner_candidate_id is always the caller's own resolved
      // row id, never trusted from the body.
      const rows = await sql`
        INSERT INTO documents (partner_candidate_id, file_name, file_path, document_type, file_size, mime_type)
        VALUES (${candidate!.id}, ${file_name}, ${file_path}, ${document_type}, ${file_size ?? null}, ${mime_type ?? null})
        RETURNING *
      `;
      return res.status(201).json(rows[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (req.method === 'DELETE') {
    const rows = await sql`SELECT * FROM documents WHERE id = ${id}`;
    const doc = rows[0];
    if (!doc) return res.status(404).json({ error: 'Not found' });

    if (authed) {
      if (authed.role !== 'admin' && doc.client_id !== authed.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    } else if (authedPartner) {
      if (!doc.partner_candidate_id) return res.status(403).json({ error: 'Forbidden' });
      const owned = await sql`SELECT 1 FROM partner_candidates WHERE id = ${doc.partner_candidate_id} AND partner_id = ${authedPartner.id}`;
      if (owned.length === 0) return res.status(403).json({ error: 'Forbidden' });
    } else {
      if (doc.partner_candidate_id !== candidate!.id) return res.status(403).json({ error: 'Forbidden' });
    }

    if (doc.imagekit_file_id) {
      try {
        await imagekit.deleteFile(doc.imagekit_file_id);
      } catch (err) {
        console.error('ImageKit delete failed:', err);
      }
    }
    await sql`DELETE FROM documents WHERE id = ${id}`;
    return res.status(204).end();
  }

  if (req.method === 'PATCH') {
    // Verify document — admin only.
    if (!authed || authed.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const rows = await sql`
      UPDATE documents SET is_verified = true, verified_by = ${authed.id}, verified_at = now()
      WHERE id = ${id}
      RETURNING *
    `;
    return res.status(200).json(rows[0] ?? null);
  }

  res.status(405).json({ error: 'Method not allowed' });
}
