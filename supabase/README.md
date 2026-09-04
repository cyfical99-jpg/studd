# Supabase setup

The app runs entirely on an on-device local store by default — no account
needed, everything already works. This is how you switch it to a real,
shared Supabase backend once you're ready.

## 1. Create a project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create
   a free account/project (pick any region close to you).
2. Wait for provisioning to finish (a couple of minutes).

## 2. Run the schema

1. In your project, open **SQL Editor** (left sidebar).
2. Open [`migrations/0001_init.sql`](migrations/0001_init.sql) from this repo,
   copy its entire contents, paste into the SQL Editor, and click **Run**.
   - It creates every table the app needs (profiles, workplaces, shifts,
     payroll, notifications, the AI roster drafts table, etc.), a trigger
     that turns a Supabase Auth sign-up into an app `profiles` row, and Row
     Level Security policies so employees only ever see their own data and
     managers only see their own workplaces' data.
   - Safe to re-run if you tweak it — it drops/recreates its own policies
     each time.
3. **Auth settings**: Authentication → Providers → Email. For quick local
   testing, turn **off** "Confirm email" (Authentication → Sign In / Providers
   → Email → uncheck "Confirm email") so `signUp` logs you straight in
   without needing to click a confirmation link first. Turn it back on before
   any real users touch this.

## 3. Get your API keys

Project Settings → **API**. You need two values:
- **Project URL** (`https://xxxxx.supabase.co`)
- **anon / public key** (a long JWT — this is safe to ship in the app; RLS is
  what actually protects data, not keeping this key secret)

## 4. Connect the app

```bash
cp .env.example .env
```

Edit `.env` and paste in the two values:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

Restart the dev server / rebuild the app (env vars are read at bundle time).
`services/config.ts` auto-detects these and switches auth over to Supabase —
nothing else to flip.

## 5. Create your first real accounts

Once connected, just use the app's own **Create an account** screen — sign
up once as a manager and once (or more) as an employee. That's the
supported path; don't hand-insert rows into `auth.users` (Supabase Auth
manages that table itself, with password hashing you can't easily replicate
by hand).

After that, to link an employee to a manager's workplace, run something like
this in the SQL Editor (swap in the real UUIDs, which you can find in
**Authentication → Users**, or `select id, email from public.profiles`):

```sql
insert into public.workplaces (name, manager_id)
values ('Cafe ABC', '<manager-uuid>')
returning id; -- copy this workplace id for the next statement

insert into public.employments (user_id, workplace_id, role_title, hourly_rate, max_weekly_hours)
values ('<employee-uuid>', '<workplace-id>', 'Waiter', 18, 24);
```

## What's live vs. still local right now

- ✅ **Auth** (`services/auth.ts`) — fully wired. Sign-up/sign-in/sign-out
  and session persistence go through real Supabase Auth once configured.
- 🚧 **Everything else** (`services/repositories/*` — shifts, availability,
  payroll, notifications, the AI roster assistant) still reads/writes the
  on-device local store regardless of this configuration, for now. The
  schema and RLS policies above are ready for it; wiring each repository to
  Supabase queries instead of `localStore` is the next pass — ask for it
  once you've confirmed sign-up/sign-in works against your project.
- 🚧 **Profile picture upload** (`services/repositories/workplacesRepo.ts`'s
  `updateAvatar`) is local-only by design — it stores a device-local file
  URI, which wouldn't resolve on anyone else's device anyway. Making this
  real needs a `profiles.avatar_url` column plus a Supabase Storage bucket
  (with its own access policies) to actually upload the file to; it
  currently throws a clear error if called while `USE_SUPABASE` is on,
  rather than silently no-op'ing.
