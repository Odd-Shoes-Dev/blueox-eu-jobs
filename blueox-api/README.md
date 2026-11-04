# blueox-api

Shared backend for `blueox` and `blueox-admin`. Deploy as its own Vercel project
(Root Directory: `blueox-api`, no framework preset — Vercel auto-detects the `api/`
folder as serverless functions).

## Why this exists

Neon (Postgres) can't be queried from the browser, and ImageKit's private key can't
go in frontend code. This backend is the one place those secrets live; both
frontends call it over HTTPS and send their session token in
`Authorization: Bearer <token>`.

## Routes are consolidated to fit Vercel's Hobby-plan function limit

The Hobby plan caps a deployment at 12 serverless functions (one per file under
`api/`). Related endpoints are grouped into a single file using Vercel's catch-all
(`[[...params]].ts`) and dynamic (`[action].ts`) route conventions rather than one
file per operation — e.g. `api/applications/[[...params]].ts` handles both
`GET/POST /api/applications` and `PATCH/DELETE /api/applications/:id`. Currently 10
functions total. If you add a genuinely new resource, prefer extending an existing
catch-all file's routing over adding a new top-level file, to keep headroom under 12.

## Auth: currently custom email/password, Clerk kept dormant

See `AUTH.md` for the full picture — Clerk is installed but not called by anything
active right now. Session tokens are self-issued JWTs (`lib/auth.ts`,
`JWT_SECRET`), not Clerk tokens.

## Environment variables (set in the Vercel project)

- `DATABASE_URL` — Neon connection string
- `JWT_SECRET` — signs/verifies session tokens; rotating it logs everyone out
- `CLERK_SECRET_KEY` — NOT currently used (Clerk is dormant, see `AUTH.md`); kept so
  re-enabling Clerk later doesn't mean re-doing setup
- `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY`, `IMAGEKIT_URL_ENDPOINT` — from ImageKit
- `IMAGEKIT_ROOT_FOLDER` — scopes every path this backend touches under one folder
  in the ImageKit media library (e.g. `/blueox`), since the account's media library
  holds other projects' folders too. The frontends never configure this themselves —
  `GET /api/imagekit-auth` hands it to them, so it only ever needs to change in one
  place.
- `ALLOWED_ORIGINS` — comma-separated list of frontend origins allowed to call this
  API (e.g. `https://blueoxjobs.eu,https://www.blueoxjobs.eu,https://admin.blueoxjobs.eu,http://localhost:3000,http://localhost:3001`)

## Authorization model (replaces Supabase RLS)

- `GET /api/jobs`, `POST /api/applications`, and every `POST /api/auth/*` route are
  public — no token needed (matches the fully-open Supabase RLS these had before:
  public job browsing, anonymous chatbot application submission, and signup/login
  themselves obviously can't require a token).
- `GET /api/imagekit-auth` is also public — ImageKit's signed upload params alone
  only grant "can upload a file", which matches today's reality: the Supabase anon
  key already made both storage buckets effectively open to any caller.
- Everything else requires a valid session token. Non-admin callers are filtered to
  their own `client_id` server-side (see `lib/auth.ts`'s `getAuthedClient`); admins
  (`clients.role = 'admin'`) see everything.

## File storage model

Uploads go **directly from the browser to ImageKit** using signed params this API
hands out (`GET /api/imagekit-auth`) — files never pass through this backend, so
there's no multipart-upload code here and no Vercel function body-size limit to
worry about. Files are uploaded as private; `GET /api/files?path=...` returns a
short-lived signed URL for viewing/downloading one. Deleting a file needs ImageKit's
`fileId` (not just its path) — `documents` rows store it in `imagekit_file_id` at
upload time; for path-only-tracked attachments (chatbot/admin application
attachments, which live inside `applications.data` JSON, not a table row)
`POST /api/files` resolves the `fileId` from the path via ImageKit's `listFiles`
first.
