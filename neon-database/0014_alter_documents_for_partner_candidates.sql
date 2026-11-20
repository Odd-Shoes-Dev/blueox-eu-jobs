-- Partner-submitted candidates upload documents (passport, CV, certificates —
-- NOT the skills video, which is a plain link on partner_candidates.video_url)
-- through the same `documents` table client-portal uploads already use.
ALTER TABLE documents ADD COLUMN IF NOT EXISTS partner_candidate_id UUID
  REFERENCES partner_candidates(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS documents_partner_candidate_id_idx ON documents (partner_candidate_id);

-- Every document belongs to exactly one owner — a client-portal upload XOR a
-- partner-candidate upload, never both and never neither. Safe to add now:
-- every existing row already has client_id set and partner_candidate_id is
-- new/null for all of them, so the constraint holds without a backfill.
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_owner_xor_chk;
ALTER TABLE documents ADD CONSTRAINT documents_owner_xor_chk
  CHECK ((client_id IS NOT NULL)::int + (partner_candidate_id IS NOT NULL)::int = 1);
