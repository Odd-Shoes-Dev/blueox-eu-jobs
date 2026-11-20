-- Reverse-engineered from the `Document` interface in blueox/src/lib/supabase.ts and
-- the insert/update payloads in blueox/src/pages/Portal.tsx,
-- blueox/src/components/chatbot/ChatbotInterface.tsx and blueox-admin/src/App.tsx.
-- `file_path` is the storage-provider object key (today a Supabase Storage path under
-- the 'client-documents' or 'documents' bucket) — stays a plain string once storage
-- moves to a new provider, just pointing at a different bucket/key scheme.
CREATE TABLE IF NOT EXISTS documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id       UUID REFERENCES clients(id) ON DELETE CASCADE,
  application_id  UUID REFERENCES applications(id) ON DELETE CASCADE,
  document_type   TEXT NOT NULL,
  file_name       TEXT NOT NULL,
  file_path       TEXT NOT NULL,
  file_size       BIGINT,
  mime_type       TEXT,
  is_verified     BOOLEAN NOT NULL DEFAULT false,
  verified_by     UUID REFERENCES clients(id),
  verified_at     TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS documents_client_id_idx ON documents (client_id);
CREATE INDEX IF NOT EXISTS documents_application_id_idx ON documents (application_id);
