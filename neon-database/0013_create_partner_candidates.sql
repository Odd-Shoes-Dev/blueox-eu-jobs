-- A candidate a partner submits — owned by the partner, not an independent
-- `clients` account (no login/password for the candidate). The candidate
-- self-serves their own details via the unique, non-expiring `access_token`
-- (same risk tier as clients.verification_token/reset_token — not signed, not
-- expiring, matched directly against this row per request).
CREATE TABLE IF NOT EXISTS partner_candidates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES partners(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'submitted', 'locked', 'changes_requested')),
  changes_requested_note TEXT,

  full_name TEXT,
  date_of_birth DATE,
  nationality TEXT,
  phone TEXT,
  email TEXT,
  country_of_residence TEXT,
  eu_citizenship BOOLEAN,
  target_country TEXT,
  job_category TEXT,
  driving_licence BOOLEAN,
  driving_licence_conversion_status TEXT,
  -- Link to an externally-hosted skills/intro video (YouTube, Google Drive,
  -- etc.) — link-only by design, no file upload. Plain URL, validated
  -- client-side only (looks like a URL), nothing more.
  video_url TEXT,

  placement_status TEXT NOT NULL DEFAULT 'not_placed'
    CHECK (placement_status IN ('not_placed', 'matched', 'placed', 'invoiced')),
  placed_job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
  placed_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS partner_candidates_access_token_key ON partner_candidates (access_token);
CREATE INDEX IF NOT EXISTS partner_candidates_partner_id_idx ON partner_candidates (partner_id);
CREATE INDEX IF NOT EXISTS partner_candidates_status_idx ON partner_candidates (status);
