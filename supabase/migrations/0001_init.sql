-- Stud app schema — mirrors services/types.ts exactly, so a Supabase-backed
-- repository implementation can use the same shapes the local-store
-- implementation already uses. See supabase/README.md for how to run this.
--
-- Run order: this file only. It's written to be safe to re-run (uses
-- `create table if not exists` / `drop policy if exists`) while you're
-- iterating on it before going live.

-- ---------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ---------------------------------------------------------------------
-- profiles — one row per auth.users row, app-specific fields only.
-- Supabase Auth already owns email/password; this just adds name + role.
-- ---------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  name text not null,
  role text not null check (role in ('employee', 'manager')),
  created_at timestamptz not null default now()
);

-- Auto-create a profile row whenever someone signs up. `role`/`name` are
-- passed through Supabase Auth's signUp `options.data` (raw_user_meta_data).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'employee')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------
-- workplaces / employments
-- ---------------------------------------------------------------------
create table if not exists public.workplaces (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  manager_id uuid not null references public.profiles (id) on delete cascade
);

create table if not exists public.employments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  workplace_id uuid not null references public.workplaces (id) on delete cascade,
  role_title text not null,
  hourly_rate numeric(10, 2) not null default 0,
  -- User-configured tracking limit — NOT a legal/visa compliance claim.
  max_weekly_hours numeric(5, 2) not null default 24,
  unique (user_id, workplace_id)
);

-- ---------------------------------------------------------------------
-- availability
-- ---------------------------------------------------------------------
create table if not exists public.availability (
  user_id uuid not null references public.profiles (id) on delete cascade,
  day text not null check (day in ('Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun')),
  available boolean not null default false,
  sessions text[] not null default '{}', -- subset of {morning, afternoon, evening}
  primary key (user_id, day)
);

-- ---------------------------------------------------------------------
-- shifts
-- ---------------------------------------------------------------------
create table if not exists public.shifts (
  id uuid primary key default gen_random_uuid(),
  workplace_id uuid not null references public.workplaces (id) on delete cascade,
  role_title text not null,
  date date not null,
  start_time time not null,
  end_time time not null,
  assigned_user_id uuid references public.profiles (id) on delete set null,
  status text not null default 'draft' check (
    status in ('draft', 'published', 'awaiting_confirmation', 'confirmed', 'requires_attention', 'completed', 'cancelled')
  ),
  confirmation_due_at timestamptz,
  created_from_roster_draft_id uuid
);

-- ---------------------------------------------------------------------
-- shift release / replacement workflow (Feature 1)
-- ---------------------------------------------------------------------
create table if not exists public.shift_release_requests (
  id uuid primary key default gen_random_uuid(),
  shift_id uuid not null references public.shifts (id) on delete cascade,
  requested_by_user_id uuid not null references public.profiles (id),
  reason text not null default '',
  status text not null default 'pending_manager_review' check (
    status in ('pending_manager_review', 'approved_open_for_claims', 'declined', 'filled')
  ),
  interested_user_ids uuid[] not null default '{}',
  approved_replacement_user_id uuid references public.profiles (id),
  history jsonb not null default '[]', -- [{ at, actorUserId, action }]
  created_at timestamptz not null default now()
);

-- Race-safe "express interest" — appends the caller's own id under a
-- SECURITY DEFINER function instead of a raw client-side array UPDATE, so
-- two employees clicking at once can't clobber each other's entry.
create or replace function public.express_interest(p_request_id uuid)
returns public.shift_release_requests
language plpgsql
security definer set search_path = public
as $$
declare
  result public.shift_release_requests;
begin
  update public.shift_release_requests
  set interested_user_ids = array_append(interested_user_ids, auth.uid()),
      history = history || jsonb_build_object(
        'at', now(), 'actorUserId', auth.uid(), 'action', 'Expressed interest in taking this shift.'
      )
  where id = p_request_id
    and status = 'approved_open_for_claims'
    and not (auth.uid() = any(interested_user_ids))
  returning * into result;

  return result;
end;
$$;

-- ---------------------------------------------------------------------
-- time off
-- ---------------------------------------------------------------------
create table if not exists public.time_off_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  start_date date not null,
  end_date date not null,
  reason_type text not null,
  note text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined'))
);

-- ---------------------------------------------------------------------
-- time clock / payroll
-- ---------------------------------------------------------------------
create table if not exists public.time_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  workplace_id uuid not null references public.workplaces (id) on delete cascade,
  shift_id uuid references public.shifts (id) on delete set null,
  clock_in timestamptz not null,
  clock_out timestamptz,
  break_minutes integer not null default 0
);

create table if not exists public.payroll_lines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  workplace_id uuid not null references public.workplaces (id) on delete cascade,
  period_start date not null,
  period_end date not null,
  hours numeric(6, 2) not null,
  hourly_rate numeric(10, 2) not null,
  amount numeric(10, 2) not null,
  status text not null default 'estimated' check (status in ('estimated', 'pending_payment', 'paid'))
);

-- ---------------------------------------------------------------------
-- notifications
-- ---------------------------------------------------------------------
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  read boolean not null default false,
  created_at timestamptz not null default now(),
  related_shift_id uuid references public.shifts (id) on delete set null
);

-- ---------------------------------------------------------------------
-- AI roster assistant drafts (Feature 5) — shifts held as jsonb since a
-- draft is ephemeral/editable scratch state, not yet real Shift rows.
-- ---------------------------------------------------------------------
create table if not exists public.roster_drafts (
  id uuid primary key default gen_random_uuid(),
  workplace_id uuid not null references public.workplaces (id) on delete cascade,
  week_start date not null,
  status text not null default 'draft' check (status in ('draft', 'published')),
  shifts jsonb not null default '[]', -- RosterDraftShift[]
  created_at timestamptz not null default now()
);

-- Explicit grants for the SECURITY DEFINER functions above/below — Postgres
-- defaults new functions to PUBLIC-executable, but being explicit here
-- means this doesn't quietly depend on that default.
grant execute on function public.express_interest(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- RLS helper functions
-- ---------------------------------------------------------------------
create or replace function public.is_manager_of_workplace(p_workplace_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.workplaces w
    where w.id = p_workplace_id and w.manager_id = auth.uid()
  );
$$;

create or replace function public.is_employee_of_workplace(p_workplace_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.employments e
    where e.workplace_id = p_workplace_id and e.user_id = auth.uid()
  );
$$;

create or replace function public.manages_user(p_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.employments e
    join public.workplaces w on w.id = e.workplace_id
    where e.user_id = p_user_id and w.manager_id = auth.uid()
  );
$$;

-- RLS policies below call these as any authenticated role, so they need
-- execute rights too (see the express_interest grant above for why this
-- isn't left to the Postgres default).
grant execute on function public.is_manager_of_workplace(uuid) to authenticated;
grant execute on function public.is_employee_of_workplace(uuid) to authenticated;
grant execute on function public.manages_user(uuid) to authenticated;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.workplaces enable row level security;
alter table public.employments enable row level security;
alter table public.availability enable row level security;
alter table public.shifts enable row level security;
alter table public.shift_release_requests enable row level security;
alter table public.time_off_requests enable row level security;
alter table public.time_entries enable row level security;
alter table public.payroll_lines enable row level security;
alter table public.notifications enable row level security;
alter table public.roster_drafts enable row level security;

-- profiles: read your own row, or any employee you manage; update only your own.
drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select
  using (id = auth.uid() or public.manages_user(id));
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update
  using (id = auth.uid());

-- workplaces: manager has full control; employees can read workplaces they belong to.
drop policy if exists "workplaces_manager_all" on public.workplaces;
create policy "workplaces_manager_all" on public.workplaces for all
  using (manager_id = auth.uid()) with check (manager_id = auth.uid());
drop policy if exists "workplaces_employee_read" on public.workplaces;
create policy "workplaces_employee_read" on public.workplaces for select
  using (public.is_employee_of_workplace(id));

-- employments: manager controls employments at their workplaces; employee reads own.
drop policy if exists "employments_manager_all" on public.employments;
create policy "employments_manager_all" on public.employments for all
  using (public.is_manager_of_workplace(workplace_id)) with check (public.is_manager_of_workplace(workplace_id));
drop policy if exists "employments_employee_read_own" on public.employments;
create policy "employments_employee_read_own" on public.employments for select
  using (user_id = auth.uid());

-- availability: employee owns their own rows; manager can read employees' rows.
drop policy if exists "availability_owner_all" on public.availability;
create policy "availability_owner_all" on public.availability for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "availability_manager_read" on public.availability;
create policy "availability_manager_read" on public.availability for select
  using (public.manages_user(user_id));

-- shifts: manager controls shifts at their workplaces; assignee can read/update
-- (e.g. confirm) their own shift, and read open (unassigned) shifts there.
drop policy if exists "shifts_manager_all" on public.shifts;
create policy "shifts_manager_all" on public.shifts for all
  using (public.is_manager_of_workplace(workplace_id)) with check (public.is_manager_of_workplace(workplace_id));
drop policy if exists "shifts_employee_read" on public.shifts;
create policy "shifts_employee_read" on public.shifts for select
  using (assigned_user_id = auth.uid() or (assigned_user_id is null and public.is_employee_of_workplace(workplace_id)));
drop policy if exists "shifts_employee_update_own" on public.shifts;
create policy "shifts_employee_update_own" on public.shifts for update
  using (assigned_user_id = auth.uid()) with check (assigned_user_id = auth.uid());
-- Employees may also claim an open shift (assigned_user_id null -> themself);
-- covered by requestOpenShift going through a SECURITY DEFINER RPC in a
-- later pass if the plain UPDATE policy above proves too permissive.

-- shift_release_requests
drop policy if exists "release_requests_manager_all" on public.shift_release_requests;
create policy "release_requests_manager_all" on public.shift_release_requests for all
  using (public.is_manager_of_workplace((select workplace_id from public.shifts where id = shift_id)))
  with check (public.is_manager_of_workplace((select workplace_id from public.shifts where id = shift_id)));
drop policy if exists "release_requests_requester_read" on public.shift_release_requests;
create policy "release_requests_requester_read" on public.shift_release_requests for select
  using (requested_by_user_id = auth.uid());
drop policy if exists "release_requests_requester_insert" on public.shift_release_requests;
create policy "release_requests_requester_insert" on public.shift_release_requests for insert
  with check (requested_by_user_id = auth.uid());
drop policy if exists "release_requests_open_read" on public.shift_release_requests;
create policy "release_requests_open_read" on public.shift_release_requests for select
  using (
    status = 'approved_open_for_claims'
    and public.is_employee_of_workplace((select workplace_id from public.shifts where id = shift_id))
  );

-- time_off_requests
drop policy if exists "time_off_owner_all" on public.time_off_requests;
create policy "time_off_owner_all" on public.time_off_requests for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "time_off_manager_read_update" on public.time_off_requests;
create policy "time_off_manager_read_update" on public.time_off_requests for select
  using (public.manages_user(user_id));
drop policy if exists "time_off_manager_update" on public.time_off_requests;
create policy "time_off_manager_update" on public.time_off_requests for update
  using (public.manages_user(user_id)) with check (public.manages_user(user_id));

-- time_entries
drop policy if exists "time_entries_owner_all" on public.time_entries;
create policy "time_entries_owner_all" on public.time_entries for all
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "time_entries_manager_read" on public.time_entries;
create policy "time_entries_manager_read" on public.time_entries for select
  using (public.is_manager_of_workplace(workplace_id));

-- payroll_lines
drop policy if exists "payroll_manager_all" on public.payroll_lines;
create policy "payroll_manager_all" on public.payroll_lines for all
  using (public.is_manager_of_workplace(workplace_id)) with check (public.is_manager_of_workplace(workplace_id));
drop policy if exists "payroll_employee_read" on public.payroll_lines;
create policy "payroll_employee_read" on public.payroll_lines for select
  using (user_id = auth.uid());

-- notifications: recipient reads/updates their own; anyone authenticated
-- may insert (the app's own repository logic controls what actually gets
-- inserted, e.g. a manager's action notifying an employee).
drop policy if exists "notifications_owner_read" on public.notifications;
create policy "notifications_owner_read" on public.notifications for select
  using (user_id = auth.uid());
drop policy if exists "notifications_owner_update" on public.notifications;
create policy "notifications_owner_update" on public.notifications for update
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "notifications_authenticated_insert" on public.notifications;
create policy "notifications_authenticated_insert" on public.notifications for insert
  with check (auth.role() = 'authenticated');

-- roster_drafts: manager only.
drop policy if exists "roster_drafts_manager_all" on public.roster_drafts;
create policy "roster_drafts_manager_all" on public.roster_drafts for all
  using (public.is_manager_of_workplace(workplace_id)) with check (public.is_manager_of_workplace(workplace_id));
