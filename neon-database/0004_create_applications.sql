-- Reverse-engineered from app code (never a tracked CREATE TABLE migration) plus the
-- two tracked ALTERs that do exist:
--   supabase/migrations/1765552314_allow_null_client_id.sql  -> client_id is nullable
--   supabase/migrations/1765552702_update_application_type_constraint.sql -> application_type CHECK
-- `data` holds the free-form chatbot/application-flow payload (jsonb in Supabase too).
-- `status`/`conversation_context` columns observed in blueox/src/pages/Login.tsx and
-- components/chatbot/ChatbotInterface.tsx inserts.
--
-- NOTE: blueox/src/pages/Login.tsx's createApplicationFromConversation computes
-- application_type as 'university', 'student_job', 'employer', or 'workforce' —
-- three of those four values ('university', 'employer', 'workforce') are NOT in the
-- CHECK constraint below (which mirrors the live, tracked Supabase constraint). That
-- insert already fails against the real Supabase CHECK today; this port does not fix
-- that app-code bug, it just carries it over faithfully. Worth fixing in Login.tsx
-- during the Phase 1 refactor, independent of this schema file.
CREATE TABLE IF NOT EXISTS applications (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id               UUID REFERENCES clients(id) ON DELETE SET NULL,
  user_path                TEXT,
  application_type         TEXT
                              CHECK (application_type IN (
                                'student_university', 'student_job', 'worker_job', 'company'
                              )),
  target_country           TEXT,
  status                   TEXT NOT NULL DEFAULT 'pending',
  data                      JSONB,
  conversation_context      JSONB,
  created_at               TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at               TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS applications_client_id_idx ON applications (client_id);
CREATE INDEX IF NOT EXISTS applications_status_idx ON applications (status);
