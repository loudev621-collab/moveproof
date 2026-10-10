-- MoveProof database. Paste into Supabase > SQL Editor and click Run (or `supabase db push`).

-- ============ Tables ============
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  full_name text,
  stripe_customer_id text unique,
  plan text not null default 'free' check (plan in ('free','landlord')),
  plan_status text,
  created_at timestamptz not null default now()
);

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles on delete cascade,
  nickname text not null,
  address_line text not null,
  unit text,
  city text not null,
  state text not null,
  zip text not null,
  role text not null check (role in ('renter','landlord')),
  paid boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.walkthroughs (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties on delete cascade,
  owner_id uuid not null references public.profiles on delete cascade,
  kind text not null check (kind in ('move_in','move_out','other')),
  status text not null default 'in_progress' check (status in ('in_progress','completed')),
  other_party_name text,
  notes text,
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  walkthrough_id uuid not null references public.walkthroughs on delete cascade,
  owner_id uuid not null references public.profiles on delete cascade,
  name text not null,
  position int not null default 0,
  condition text check (condition in ('good','fair','damaged')),
  notes text,
  created_at timestamptz not null default now()
);

create table public.photos (
  id uuid primary key default gen_random_uuid(),
  room_id uuid not null references public.rooms on delete cascade,
  walkthrough_id uuid not null references public.walkthroughs on delete cascade,
  owner_id uuid not null references public.profiles on delete cascade,
  storage_path text not null unique,
  sha256 text not null check (sha256 ~ '^[0-9a-f]{64}$'),
  bytes int,
  caption text,
  device_time timestamptz,                       -- the phone's clock (can be wrong)
  uploaded_at timestamptz not null default now(),-- the server's clock (the one reports rely on)
  hash_verified boolean                          -- set when a report rechecks the file
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  walkthrough_id uuid not null references public.walkthroughs on delete cascade,
  owner_id uuid not null references public.profiles on delete cascade,
  verify_code text not null unique,
  pdf_path text not null,
  pdf_sha256 text not null,
  photo_count int not null,
  generated_at timestamptz not null default now()
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles on delete cascade,
  property_id uuid references public.properties on delete set null,
  stripe_session_id text unique,
  kind text not null check (kind in ('home_pass','landlord')),
  amount_cents int,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index on public.properties (owner_id);
create index on public.walkthroughs (property_id);
create index on public.rooms (walkthrough_id);
create index on public.photos (room_id);
create index on public.reports (walkthrough_id);

-- ============ Triggers ============
-- New login -> profile row.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- The server's clock always sets uploaded_at, whatever the phone sends.
create or replace function public.stamp_photo()
returns trigger language plpgsql as $$
begin
  new.uploaded_at := now();
  new.hash_verified := null;
  return new;
end;
$$;
create trigger photos_stamp before insert on public.photos
  for each row execute function public.stamp_photo();

-- Record the moment a walkthrough is locked.
create or replace function public.stamp_completion()
returns trigger language plpgsql as $$
begin
  if new.status = 'completed' and old.status = 'in_progress' then
    new.completed_at := now();
  end if;
  return new;
end;
$$;
create trigger walkthroughs_stamp before update on public.walkthroughs
  for each row execute function public.stamp_completion();

-- Helper: is this walkthrough mine and still open?
create or replace function public.walkthrough_open(w_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.walkthroughs
    where id = w_id and owner_id = auth.uid() and status = 'in_progress'
  );
$$;

-- Public verify page: returns only these facts, never photos or addresses.
create or replace function public.verify_report(code text)
returns table (generated_at timestamptz, photo_count int, pdf_sha256 text, kind text)
language sql stable security definer set search_path = public as $$
  select r.generated_at, r.photo_count, r.pdf_sha256, w.kind
  from public.reports r join public.walkthroughs w on w.id = r.walkthrough_id
  where r.verify_code = upper(code);
$$;
grant execute on function public.verify_report(text) to anon, authenticated;

-- ============ Row-level security ============
alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.walkthroughs enable row level security;
alter table public.rooms enable row level security;
alter table public.photos enable row level security;
alter table public.reports enable row level security;
alter table public.payments enable row level security;

-- Profiles: read your own. Plan fields are written only by the server (Stripe webhook).
create policy "read own profile" on public.profiles for select using (id = auth.uid());

-- Homes: read and add your own. No update policy, so nobody can mark a home paid from the app.
create policy "read own homes" on public.properties for select using (owner_id = auth.uid());
create policy "add own home" on public.properties for insert
  with check (owner_id = auth.uid() and paid = false);

-- Walkthroughs: start your own; edit only while in progress; once completed, locked for good.
create policy "read own walkthroughs" on public.walkthroughs for select using (owner_id = auth.uid());
create policy "start walkthrough" on public.walkthroughs for insert
  with check (
    owner_id = auth.uid() and status = 'in_progress'
    and exists (select 1 from public.properties p where p.id = property_id and p.owner_id = auth.uid())
  );
create policy "edit open walkthrough" on public.walkthroughs for update
  using (owner_id = auth.uid() and status = 'in_progress')
  with check (owner_id = auth.uid());

-- Rooms and photos: changeable only while the walkthrough is open.
create policy "read own rooms" on public.rooms for select using (owner_id = auth.uid());
create policy "add room" on public.rooms for insert
  with check (owner_id = auth.uid() and public.walkthrough_open(walkthrough_id));
create policy "edit room" on public.rooms for update
  using (owner_id = auth.uid() and public.walkthrough_open(walkthrough_id))
  with check (owner_id = auth.uid() and public.walkthrough_open(walkthrough_id));
create policy "delete room" on public.rooms for delete
  using (owner_id = auth.uid() and public.walkthrough_open(walkthrough_id));

create policy "read own photos" on public.photos for select using (owner_id = auth.uid());
create policy "add photo" on public.photos for insert
  with check (
    owner_id = auth.uid() and public.walkthrough_open(walkthrough_id)
    and exists (select 1 from public.rooms r where r.id = room_id and r.walkthrough_id = photos.walkthrough_id)
  );
create policy "delete photo" on public.photos for delete
  using (owner_id = auth.uid() and public.walkthrough_open(walkthrough_id));

create policy "read own reports" on public.reports for select using (owner_id = auth.uid());
create policy "read own payments" on public.payments for select using (owner_id = auth.uid());

-- ============ Private storage ============
insert into storage.buckets (id, name, public) values ('evidence', 'evidence', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('reports', 'reports', false) on conflict (id) do nothing;

-- Photos live at evidence/<user id>/<walkthrough id>/<photo id>.jpg
create policy "upload photo to open walkthrough" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.walkthrough_open(((storage.foldername(name))[2])::uuid)
  );
create policy "read own photo files" on storage.objects for select to authenticated
  using (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);
create policy "delete photo file from open walkthrough" on storage.objects for delete to authenticated
  using (
    bucket_id = 'evidence'
    and (storage.foldername(name))[1] = auth.uid()::text
    and public.walkthrough_open(((storage.foldername(name))[2])::uuid)
  );

-- Reports live at reports/<user id>/<walkthrough id>/<code>.pdf and are written by the server.
create policy "read own report files" on storage.objects for select to authenticated
  using (bucket_id = 'reports' and (storage.foldername(name))[1] = auth.uid()::text);
