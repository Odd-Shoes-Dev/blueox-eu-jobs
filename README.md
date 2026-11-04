# Blue OX Jobs Platform

A job placement and workforce development platform built with React, TypeScript,
Neon (Postgres), and ImageKit.

## Project structure

Three separate projects, each deployed as its own Vercel project:

- **`blueox/`** — main site: AI consultant chatbot, student/workforce portals, job
  listings, document upload
- **`blueox-admin/`** — admin CRM: application review, client/job/payment management
- **`blueox-api/`** — shared backend both frontends call over HTTPS; the only place
  that holds database/storage secrets (see `blueox-api/README.md`)

Supporting folders:
- **`neon-database/`** — hand-run SQL migration files for the Neon schema (no ORM,
  no auto-apply — see `neon-database/README.md` for run order)
- **`blueox-api/AUTH.md`** — current auth setup: custom email/password is active
  right now; Clerk is installed but dormant, with instructions to re-enable it

## Technology stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui
- **Backend**: Vercel serverless functions (`blueox-api`), no framework
- **Database**: Neon (Postgres), queried only from `blueox-api` — never from the browser
- **File storage**: ImageKit — files upload directly from the browser to ImageKit
  using signed params `blueox-api` hands out; `blueox-api` never sees the file bytes
- **Auth**: custom JWT-based email/password (see `blueox-api/AUTH.md`)
- **Deployment**: Vercel (three separate projects, one GitHub repo)

## Quick start — running all three locally

You need all three running at once for the frontends to work, since they call
`blueox-api` directly even in development.

### Prerequisites
- Node.js 18+
- npm
- A Neon database with `neon-database/*.sql` already run against it (see that
  folder's README)
- An ImageKit account (public key, private key, URL endpoint)
- The [Vercel CLI](https://vercel.com/docs/cli) (`npm i -g vercel`), used to run
  `blueox-api` locally — it's a set of serverless functions, not a dev server you
  can `npm run dev`

### 1. Install dependencies

```bash
cd blueox && npm install
cd ../blueox-admin && npm install
cd ../blueox-api && npm install
```

### 2. Set up environment variables

Each project has a `.env.example` documenting what it needs — copy it to `.env` and
fill in real values:

```bash
cp blueox/.env.example blueox/.env
cp blueox-admin/.env.example blueox-admin/.env
cp blueox-api/.env.example blueox-api/.env
```

`blueox-api/.env` needs your Neon connection string, a random `JWT_SECRET`
(`node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`), your
ImageKit keys, and `ALLOWED_ORIGINS` (for local dev, the defaults —
`http://localhost:3000,http://localhost:3001` — are already correct).

`blueox/.env` and `blueox-admin/.env` just need `VITE_API_BASE_URL` pointing at
wherever you run `blueox-api` (`http://localhost:3002` by default, see below).

### 3. Run all three (three separate terminals)

```bash
# Terminal 1 — backend
cd blueox-api && vercel dev --listen 3002

# Terminal 2 — main site
cd blueox && npm run dev -- --port 3000

# Terminal 3 — admin CRM
cd blueox-admin && npm run dev -- --port 3001
```

The ports are pinned explicitly because Vite's actual default (`5173`) doesn't match
what `ALLOWED_ORIGINS`/`VITE_API_BASE_URL` assume — using `3000`/`3001`/`3002` avoids
a CORS mismatch.

### Creating an admin account

There's no self-service admin signup. Sign up normally through `blueox`'s `/login`,
then in the Neon SQL console:

```sql
UPDATE clients SET role = 'admin' WHERE email = 'your@email.com';
```

Reload the page afterward — role is only re-fetched on page load, not live.

## Build for production

```bash
cd blueox && npm run build
cd blueox-admin && npm run build
cd blueox-api && npm run build   # just tsc --noEmit — no bundling, Vercel compiles api/*.ts itself
```

## Deployment

Three separate Vercel projects, same GitHub repo, different Root Directory each
(`blueox`, `blueox-admin`, `blueox-api`). Things that commonly trip up a fresh
deploy — see git history / `blueox-api/README.md` for the full detail on each:

- **Order matters**: deploy `blueox-api` first and grab its real URL before setting
  `VITE_API_BASE_URL` on the other two.
- **`VITE_*` env vars are baked in at build time**, not read at runtime — changing
  them in the Vercel dashboard does nothing until you trigger a new build.
- **`ALLOWED_ORIGINS`** on `blueox-api` must list the frontends' actual production
  origins (not `localhost`), or every request fails CORS.
- **Vercel Hobby plan caps a deployment at 12 serverless functions** —
  `blueox-api`'s routes are deliberately consolidated to stay under that; see its
  README before adding new top-level `api/*.ts` files.
- Both frontends are SPAs (React Router) and need a catch-all rewrite in
  `vercel.json` (already present) so direct loads/reloads of routes like `/login`
  don't 404.

## Database schema

See `neon-database/` for the actual `CREATE TABLE` files. Core tables: `clients`,
`applications`, `documents`, `jobs`, `payments`, `client_payment_phases`. Access
control (who can read/write what) lives in `blueox-api`'s route handlers, not in the
database — Neon has no Supabase-style Row Level Security equivalent.

## Contributing

1. Create a feature branch
2. Make your changes
3. Test thoroughly against all three running locally
4. Submit a pull request

## License

Proprietary - Blue OX Jobs Platform

## Support

For technical support or questions, please contact the development team.
