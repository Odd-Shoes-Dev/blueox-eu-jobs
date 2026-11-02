# Neon database — manual migration files

Plain `CREATE TABLE` DDL for the Blue OX schema, reconstructed from the current
Supabase setup so it can be run by hand against a Neon Postgres database. No RLS
policies are included — Neon has no Supabase Auth/Storage schema, so `auth.uid()`,
`anon`/`service_role`-scoped policies, and `storage.objects` policies all have no
equivalent here. Access control for these tables (row ownership, admin-only writes,
etc.) is meant to move into application-level checks in the backend API that will sit
in front of Neon, not into SQL.

## Provenance

- `clients` and `applications` were never captured as tracked `CREATE TABLE`
  migrations in the Supabase project (they were created ad hoc in the Supabase
  dashboard/SQL editor) — their schemas here are **reverse-engineered from app code**
  (TypeScript interfaces + observed `.insert()`/`.update()` payloads). **Double-check
  these two against your live Supabase `clients`/`applications` tables before relying
  on them** — there may be columns in the dashboard that no app code ever touched, and
  this reconstruction can't see those.
- `jobs` and `job_applications` are direct ports of `supabase/tables/jobs.sql` and
  `supabase/tables/job_applications.sql`, just with the RLS statements removed.
- `documents`, `payments`, and `client_payment_phases` are reverse-engineered the same
  way as `clients`/`applications` (no tracked migration existed for them either).

## Run order

Run each file in numeric order against your Neon connection string:

```bash
psql "$NEON_DATABASE_URL" -f 0001_extensions.sql
psql "$NEON_DATABASE_URL" -f 0002_create_clients.sql
psql "$NEON_DATABASE_URL" -f 0003_create_jobs.sql
psql "$NEON_DATABASE_URL" -f 0004_create_applications.sql
psql "$NEON_DATABASE_URL" -f 0005_create_documents.sql
psql "$NEON_DATABASE_URL" -f 0006_create_payments.sql
psql "$NEON_DATABASE_URL" -f 0007_create_client_payment_phases.sql
psql "$NEON_DATABASE_URL" -f 0008_create_job_applications.sql
```

Order matters because of foreign keys: `clients` and `jobs` have none and go first;
`applications` references `clients`; `documents`/`payments`/`client_payment_phases`
reference `clients`/`applications`; `job_applications` references both `applications`
and `jobs`.

Every `CREATE TABLE` uses `IF NOT EXISTS`, so re-running a file is safe.

## Not included here

- Seed data (the 5 sample `jobs` rows from
  `supabase/migrations/1765551510_setup_jobs_and_job_applications.sql`) — add your own
  seed script if you want sample jobs in Neon.
- Any RLS/authorization — see the note above.
- Storage buckets — Neon is Postgres-only; file storage is a separate provider
  decision (not yet made) and isn't part of this schema.
