import type { VercelRequest, VercelResponse } from '@vercel/node';
import { applyCors } from '../lib/cors';
import { sql } from '../lib/db';
import { getAuthedClient, getAuthedPartner, getCandidateByAccessToken } from '../lib/auth';
import { imagekit, toRootScopedPath, findFileIdByPath } from '../lib/imagekit';

// GET /api/files?path=... -> signed download/preview URL. POST /api/files {path}
// -> delete a file (admin only). Consolidated from files/download.ts +
// files/delete.ts to stay under Vercel's Hobby-plan 12-serverless-function limit.
export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (applyCors(req, res)) return;

  if (req.method === 'GET') {
    const path = req.query.path as string | undefined;
    if (!path) return res.status(400).json({ error: 'path is required' });

    const authed = await getAuthedClient(req);
    const authedPartner = authed ? null : await getAuthedPartner(req);
    const candidate = authed || authedPartner
      ? null
      : await getCandidateByAccessToken(req.query.token as string | undefined);

    if (!authed && !authedPartner && !candidate) return res.status(401).json({ error: 'Unauthorized' });

    // Partner/candidate callers are newer and non-expiring-token-based, so
    // their access is scoped to a document they actually own — looked up by
    // path — rather than "any valid login can fetch any path" (the existing,
    // more permissive behavior kept for authed clients/admins below).
    if (authedPartner || candidate) {
      const rows = await sql`SELECT partner_candidate_id FROM documents WHERE file_path = ${path}`;
      const doc = rows[0];
      if (!doc || !doc.partner_candidate_id) return res.status(404).json({ error: 'Not found' });

      if (authedPartner) {
        const owned = await sql`SELECT 1 FROM partner_candidates WHERE id = ${doc.partner_candidate_id} AND partner_id = ${authedPartner.id}`;
        if (owned.length === 0) return res.status(403).json({ error: 'Forbidden' });
      } else if (doc.partner_candidate_id !== candidate!.id) {
        return res.status(403).json({ error: 'Forbidden' });
      }
    }

    const url = imagekit.url({ path: toRootScopedPath(path), signed: true, expireSeconds: 300 });
    return res.status(200).json({ url });
  }

  if (req.method === 'POST') {
    // Admin only — this is used for application attachments managed from the admin
    // dashboard (blueox-admin's deleteApplicationDocument), which are tracked only
    // as a path inside applications.data JSON, not a documents table row.
    const authed = await getAuthedClient(req);
    if (!authed || authed.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const { path } = req.body ?? {};
    if (!path) return res.status(400).json({ error: 'path is required' });

    const fileId = await findFileIdByPath(path);
    if (!fileId) return res.status(404).json({ error: 'File not found' });

    await imagekit.deleteFile(fileId);
    return res.status(204).end();
  }

  res.status(405).json({ error: 'Method not allowed' });
}
