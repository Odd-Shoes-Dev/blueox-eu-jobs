-- Custom email/password auth (Clerk kept installed but not active for now — see
-- blueox-api/AUTH.md). auth_user_id stays reserved for Clerk's id, untouched by
-- this flow; clients.id itself is the identity used in the JWT's `sub` claim.
ALTER TABLE clients ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS verification_token TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMPTZ;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS reset_token TEXT;
ALTER TABLE clients ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS clients_email_key ON clients (email);
