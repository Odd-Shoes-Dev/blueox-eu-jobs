-- Reverse-engineered from app code: this table was never captured as a tracked
-- Supabase migration (created ad hoc in the Supabase dashboard). Columns come from
-- the `Client` interface in blueox/src/lib/supabase.ts and the columns referenced in
-- both apps' AuthContext.tsx / Admin.tsx / App.tsx. Sanity-check against the live
-- Supabase `clients` table before relying on this.
--
-- `auth_user_id` pointed at Supabase Auth's `auth.users.id`; once auth moves to
-- Clerk this column will hold the Clerk user id instead (still just a text/uuid key,
-- no FK to a local auth schema since Neon has none).
CREATE TABLE IF NOT EXISTS clients (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id    UUID,
  email           TEXT NOT NULL,
  full_name       TEXT NOT NULL,
  phone           TEXT,
  address         TEXT,
  nationality     TEXT,
  date_of_birth   DATE,
  role            TEXT NOT NULL DEFAULT 'student'
                    CHECK (role IN ('admin', 'student', 'workforce')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS clients_auth_user_id_key ON clients (auth_user_id);
CREATE INDEX IF NOT EXISTS clients_email_idx ON clients (email);
CREATE INDEX IF NOT EXISTS clients_role_idx ON clients (role);
