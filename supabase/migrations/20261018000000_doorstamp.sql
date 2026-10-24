-- Doorstamp update: California AB 2801 records, share links, price per move.
-- Run ONCE, after 20261008000000_init.sql: Supabase > SQL Editor > New query > paste all > Run.

-- 1. New walkthrough type for landlords: photos after repairs or cleaning (AB 2801 step 3).
alter table public.walkthroughs drop constraint if exists walkthroughs_kind_check;
alter table public.walkthroughs add constraint walkthroughs_kind_check
  check (kind in ('move_in', 'move_out', 'after_repairs', 'other'));

-- 2. Payments: one-time Move Pass per address. Old kinds stay valid for past test rows.
alter table public.payments drop constraint if exists payments_kind_check;
alter table public.payments add constraint payments_kind_check
  check (kind in ('move_pass', 'home_pass', 'landlord'));

-- 3. Share links: the other party opens a link in any browser. No account, no app.
create table if not exists public.shares (
  id uuid primary key default gen_random_uuid(),
  walkthrough_id uuid not null references public.walkthroughs on delete cascade,
  owner_id uuid not null references public.profiles on delete cascade,
  token text not null unique check (char_length(token) >= 32),
  created_at timestamptz not null default now(),
  revoked_at timestamptz,
  first_viewed_at timestamptz,
  view_count int not null default 0,
  acknowledged_at timestamptz,
  ack_name text check (char_length(ack_name) <= 80),
  ack_note text check (char_length(ack_note) <= 500)
);
create index if not exists shares_walkthrough_idx on public.shares (walkthrough_id);

alter table public.shares enable row level security;
-- Owners can read their own links. Creating, turning off, viewing and acknowledging
-- all happen on the server, which checks the owner or the secret link first.
drop policy if exists "read own shares" on public.shares;
create policy "read own shares" on public.shares for select using (owner_id = auth.uid());
