# Auth: currently custom email/password, Clerk kept dormant

**Active right now:** plain email + password, signed with our own JWT
(`lib/auth.ts`, `lib/password.ts`, `api/auth/*`). No third-party auth provider is
called for sign-in/sign-up. Email verification and password-reset *flows* exist
(tokens, DB columns, endpoints) but actually sending those emails is stubbed —
`lib/email.ts` just logs to the console. Wire up a real provider (Resend was
mentioned) by rewriting `sendEmail()` there; no caller needs to change.

**Why:** Clerk was originally chosen mainly for free Google sign-in. Since Google
sign-in isn't needed right now, and standing Clerk up took real setup time, we
swapped to a self-contained email/password flow instead — without deleting the
Clerk integration, since Google sign-in may come back later.

## What's dormant vs active

| | Active now | Dormant (Clerk) |
|---|---|---|
| Backend session verification | `lib/auth.ts` (`getAuthedClient`, JWT-based) | `clerk-reference/lib-auth.clerk.ts` |
| Backend Clerk client | — | `clerk-reference/lib-clerk.clerk.ts` |
| `/api/me` | `api/me.ts` (reads existing session only) | `clerk-reference/api-me.clerk.ts` (also upserts a `clients` row from Clerk's profile) |
| Sign-up/sign-in | `api/auth/[action].ts` (`signup`/`login`/etc.) | handled client-side by Clerk's `<SignIn/>`/`<SignUp/>` — no backend endpoint existed for this |
| Frontend auth context | `blueox/src/contexts/AuthContext.tsx`, `blueox-admin/src/contexts/AuthContext.tsx` (custom) | each app's own `AuthContext.clerk.tsx` |
| Frontend token source | `blueox/src/services/authService.ts` (localStorage) | each app's own `authService.clerk.ts` (`window.Clerk.session.getToken()`) |
| Frontend login UI | `blueox/src/pages/Login.tsx` (plain form), `blueox-admin`'s `LoginPage` in `App.tsx` (plain form) | `blueox/src/pages/Login.clerk.tsx`, and the Clerk `<SignIn/>` version left as a comment in `blueox-admin/src/App.tsx` |
| App entry point | `main.tsx` renders `<App/>` directly | `main.tsx`'s Clerk version backed up as `main.clerk.tsx` in each app |
| `@clerk/clerk-react` / `@clerk/backend` packages | still installed, just unused | — |

The `clerk-reference/` folder here sits outside `tsconfig.json`'s `include` (only
`api`/`lib` are typechecked/built) **and** outside the live `api/` tree, so none of
it is typechecked, bundled, or deployed as a route. It's reference-only.

## Why clients.auth_user_id still exists

`clients.auth_user_id` (TEXT) is reserved for whichever external provider's id,
untouched by the custom auth flow — custom sessions use `clients.id` directly as
the JWT's `sub`. Re-enabling Clerk writes into `auth_user_id` again; it's simply
unused (NULL) for every account created while custom auth is active.

## How to re-enable Clerk later

1. Backend: `mv clerk-reference/lib-auth.clerk.ts lib/auth.ts` and
   `mv clerk-reference/lib-clerk.clerk.ts lib/clerk.ts` (fix the one import path
   each references internally — they were adjusted to point back into
   `clerk-reference/`), `mv clerk-reference/api-me.clerk.ts api/me.ts`. Remove or
   keep `api/auth/*` (they're harmless either way, just unused if Clerk's
   `<SignIn/>`/`<SignUp/>` own the UI again).
2. Each frontend: restore `AuthContext.clerk.tsx` → `AuthContext.tsx`,
   `authService.clerk.ts` → `authService.ts`, `main.clerk.tsx` → `main.tsx`; in
   `blueox`, restore `Login.clerk.tsx` → `Login.tsx`; in `blueox-admin`, swap
   `App.tsx`'s `LoginPage` body back to the commented-out `<SignIn/>` version.
3. Set `VITE_CLERK_PUBLISHABLE_KEY` back in both frontends' `.env` (already
   documented in each `.env.example`) and confirm `CLERK_SECRET_KEY` is set here.
4. Existing custom-auth accounts won't have a Clerk identity — they'd need to sign
   up again through Clerk, or you migrate them (out of scope here).
