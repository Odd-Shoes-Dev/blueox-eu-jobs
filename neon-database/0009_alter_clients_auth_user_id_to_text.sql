-- Stage 2 (Clerk auth): clients.auth_user_id was UUID because it held Supabase
-- Auth's auth.users.id. Clerk user ids are strings like 'user_2abc...', not UUIDs,
-- so this column needs to become TEXT before the new backend can write Clerk ids
-- into it. Safe to run even if the column already has Supabase UUID values in it —
-- UUID casts to TEXT losslessly.
ALTER TABLE clients ALTER COLUMN auth_user_id TYPE TEXT;

-- Recreate the unique index (dropping+recreating is simplest; TYPE changes don't
-- usually invalidate indexes but this keeps intent explicit and is a no-op if
-- Postgres already preserved it).
DROP INDEX IF EXISTS clients_auth_user_id_key;
CREATE UNIQUE INDEX IF NOT EXISTS clients_auth_user_id_key ON clients (auth_user_id);
