# Deploying to Vercel

This app is built for Vercel: Next.js App Router with Node-runtime API routes for
AI generation and PDF export, Prisma + Postgres, and Vercel Blob for evidence
file uploads.

## 1. Provision a production Postgres database

In your Vercel team dashboard → **Storage** tab → create a Postgres database
(Neon-backed). Copy the **pooled** connection string it gives you — pooled,
not direct, since serverless functions open a new connection per invocation
and a direct connection string will exhaust the database's connection limit
under any real concurrency.

## 2. Import the repo into a Vercel project

Dashboard → **Add New… → Project** → import `kamelbshara/kbws`, branch
`claude/school-intelligence-platform-3en1dd` (or merge it to `main` first,
whichever you prefer — the project just needs to point at whichever branch
you want live).

## 3. Connect Vercel Blob storage

Same **Storage** tab → create a Blob store → connect it to this project.
This automatically injects `BLOB_READ_WRITE_TOKEN` into the project's env
vars — you don't need to copy it manually. Without this set, initiative
evidence file uploads silently fall back to writing under `public/uploads`,
which does not work on Vercel (the serverless filesystem is ephemeral and
those files would vanish and 404).

## 4. Set environment variables

In Project Settings → Environment Variables, set for the Production
environment (see `.env.example` for the full annotated list):

| Variable | Value |
|---|---|
| `DATABASE_URL` | the pooled connection string from step 1 |
| `AUTH_SECRET` | generate with `node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"` |
| `NEXTAUTH_URL` | your deployed URL, e.g. `https://kbws.vercel.app` |
| `OPENAI_API_KEY` | your OpenAI key |
| `OPENAI_MODEL` | optional, defaults to `gpt-4o-mini` |
| `BLOB_READ_WRITE_TOKEN` | auto-injected by step 3 |
| `RESEND_API_KEY` | optional — without it, password-reset/notification emails just log to the server console instead of sending. Resend's free tier is enough for a pilot. |

## 5. Deploy

Trigger the deploy from the Vercel dashboard. The build runs `prisma
generate && next build` automatically (wired into `package.json`).

## 6. Apply migrations and seed the database

The build does **not** run migrations automatically (deliberately — a build
failing because the database was briefly unreachable is worse than running
this as its own explicit step). Once the database from step 1 exists, run
these from your machine (or from this session, if you'd rather I run them
directly against your `DATABASE_URL`):

```bash
DATABASE_URL="<production pooled url>" npx prisma migrate deploy

DATABASE_URL="<production pooled url>" npm run db:seed:permissions
DATABASE_URL="<production pooled url>" npm run db:seed:super-admin
DATABASE_URL="<production pooled url>" npm run db:seed:demo
```

- `db:seed:permissions` — optional; pre-populates the admin-editable
  permission groups shown at `/admin/permissions`. The app works correctly
  without it (falls back to the same hardcoded defaults).
- `db:seed:super-admin` — creates the platform admin account:
  `kamelbesharah@gmail.com` / `Freed@2045`, no fixed school, can switch
  between every school via the header's school switcher.
- `db:seed:demo` — stands up "Demo Trial School" with realistic data across
  every module for demoing the platform. Login as e.g.
  `principal@demo.school.edu` / `Demo@2026!` (see the script's console
  output for the full account list). Tear it down cleanly any time with:

  ```bash
  DATABASE_URL="<production pooled url>" npm run db:cleanup:demo
  ```

  Cleanup is idempotent, safe to run whether or not the demo school
  currently exists, and never touches real school data or the shared
  Grade/Subject catalog.

## 7. Verify

- Log in as the super admin, confirm you can switch to the demo school.
- Generate a lesson plan / initiative / assessment for real (needs
  `OPENAI_API_KEY` to be live) and confirm the AI quality score renders.
- Upload an evidence file on an initiative and confirm the link renders and
  is reachable (confirms Blob is wired correctly).
- Print a lesson plan / initiative / operational plan to PDF and confirm
  Arabic text renders correctly, not empty boxes (confirms the font-tracing
  fix took effect in this deployment).
- Trigger a password reset and confirm the email actually arrives (only
  meaningful if `RESEND_API_KEY` is set — otherwise it's expected to only
  appear in the function logs).

## Known gaps

- OpenAI generation and outbound email have never been live-tested against
  real credentials in the development sandbox this app was built in — they
  are only exercised in production once real keys are set. Expect to
  triage real issues here after the first live pass.
- No rate limiting on login or password-reset endpoints. Acceptable for a
  small pilot; worth adding before a wider rollout.
