-- Direct port of supabase/tables/jobs.sql, with the Supabase RLS policies and
-- "ENABLE ROW LEVEL SECURITY" statement dropped (Neon has no RLS-based public access
-- model; job visibility becomes an app-level "public GET /jobs" check later).
CREATE TABLE IF NOT EXISTS jobs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         VARCHAR(255) NOT NULL,
  company       VARCHAR(255) NOT NULL,
  location      VARCHAR(255) NOT NULL,
  country       VARCHAR(100) NOT NULL,
  job_type      VARCHAR(50) NOT NULL,
  description   TEXT NOT NULL,
  requirements  TEXT,
  salary_range  VARCHAR(100),
  skills        TEXT[],
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS jobs_country_idx ON jobs (country);
CREATE INDEX IF NOT EXISTS jobs_is_active_idx ON jobs (is_active);
CREATE INDEX IF NOT EXISTS jobs_job_type_idx ON jobs (job_type);
