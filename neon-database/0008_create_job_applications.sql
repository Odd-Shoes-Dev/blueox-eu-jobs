-- Direct port of supabase/tables/job_applications.sql, RLS policies dropped as in
-- 0003_create_jobs.sql.
--
-- NOTE: the tracked migration history for this table is self-contradictory.
-- 1765551510_setup_jobs_and_job_applications.sql first creates job_applications with
-- a SERIAL id. 1765551555_fix_rls_allow_anon_inserts.sql later runs
-- `CREATE TABLE IF NOT EXISTS job_applications (... id UUID ...)` — but Postgres'
-- IF NOT EXISTS means that statement is a no-op if the SERIAL-PK table from the first
-- migration already exists, so it would NOT have actually switched the id column to
-- UUID on a database where both migrations ran in order. This file follows
-- supabase/tables/jobs.sql's sibling file (the presumed canonical/current schema,
-- UUID id), but you should confirm the live Supabase table's actual `id` column type
-- before trusting this.
CREATE TABLE IF NOT EXISTS job_applications (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id      UUID REFERENCES applications(id) ON DELETE CASCADE,
  job_id              UUID REFERENCES jobs(id) ON DELETE CASCADE,
  selected_by_user     BOOLEAN DEFAULT true,
  created_at          TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS job_applications_application_id_idx ON job_applications (application_id);
CREATE INDEX IF NOT EXISTS job_applications_job_id_idx ON job_applications (job_id);
