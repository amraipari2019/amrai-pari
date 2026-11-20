-- =====================================================================
-- Amrai Pari Foundation — database schema
-- Run once in Supabase → SQL Editor (or `supabase db push`).
-- Safe design: every table has Row Level Security. Visitors can only read
-- published content and submit forms; staff permissions come from
-- public.role_permissions, which the website also reads, so the database
-- and the admin panel always agree.
-- =====================================================================

-- gen_random_uuid() is built into Postgres 13+, no extension needed.

-- ---------------------------------------------------------------------
-- Roles & permissions
-- ---------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum (
    'super_admin', 'content_manager', 'program_manager',
    'finance_manager', 'volunteer_coordinator', 'viewer'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text,
  full_name text,
  role public.app_role not null default 'viewer',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.role_permissions (
  role public.app_role not null,
  module text not null,
  action text not null check (action in ('read', 'write')),
  primary key (role, module, action)
);

-- Modules: content, events, gallery, impact, volunteers, assistance,
-- messages, partnerships, registrations, settings, users, audit
insert into public.role_permissions (role, module, action)
select r::public.app_role, m, a
from (values
  -- super_admin: everything
  ('super_admin','content','read'),('super_admin','content','write'),
  ('super_admin','events','read'),('super_admin','events','write'),
  ('super_admin','gallery','read'),('super_admin','gallery','write'),
  ('super_admin','impact','read'),('super_admin','impact','write'),
  ('super_admin','volunteers','read'),('super_admin','volunteers','write'),
  ('super_admin','assistance','read'),('super_admin','assistance','write'),
  ('super_admin','messages','read'),('super_admin','messages','write'),
  ('super_admin','partnerships','read'),('super_admin','partnerships','write'),
  ('super_admin','registrations','read'),('super_admin','registrations','write'),
  ('super_admin','settings','read'),('super_admin','settings','write'),
  ('super_admin','users','read'),('super_admin','users','write'),
  ('super_admin','audit','read'),
  -- content_manager: website content and public messages
  ('content_manager','content','read'),('content_manager','content','write'),
  ('content_manager','events','read'),('content_manager','events','write'),
  ('content_manager','gallery','read'),('content_manager','gallery','write'),
  ('content_manager','impact','read'),
  ('content_manager','messages','read'),('content_manager','messages','write'),
  ('content_manager','settings','read'),
  -- program_manager: programs, projects, events, people asking for help
  ('program_manager','content','read'),('program_manager','content','write'),
  ('program_manager','events','read'),('program_manager','events','write'),
  ('program_manager','gallery','read'),('program_manager','gallery','write'),
  ('program_manager','impact','read'),('program_manager','impact','write'),
  ('program_manager','assistance','read'),('program_manager','assistance','write'),
  ('program_manager','registrations','read'),('program_manager','registrations','write'),
  ('program_manager','partnerships','read'),
  -- finance_manager: payment details, verified figures, partnerships
  ('finance_manager','content','read'),
  ('finance_manager','impact','read'),('finance_manager','impact','write'),
  ('finance_manager','settings','read'),('finance_manager','settings','write'),
  ('finance_manager','partnerships','read'),('finance_manager','partnerships','write'),
  -- volunteer_coordinator: volunteers and event sign-ups
  ('volunteer_coordinator','content','read'),
  ('volunteer_coordinator','events','read'),('volunteer_coordinator','events','write'),
  ('volunteer_coordinator','volunteers','read'),('volunteer_coordinator','volunteers','write'),
  ('volunteer_coordinator','registrations','read'),('volunteer_coordinator','registrations','write'),
  -- viewer: read-only content
  ('viewer','content','read'),('viewer','events','read'),('viewer','gallery','read'),
  ('viewer','impact','read')
) as t(r, m, a)
on conflict do nothing;

create or replace function public.current_role()
returns public.app_role
language sql stable security definer set search_path = public
as $$
  select role from public.profiles where id = auth.uid() and is_active
$$;

create or replace function public.has_permission(p_module text, p_action text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles p
    join public.role_permissions rp on rp.role = p.role
    where p.id = auth.uid() and p.is_active
      and rp.module = p_module and rp.action = p_action
  )
$$;

create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and is_active)
$$;

-- New sign-ups get a profile. The very first account becomes super_admin;
-- everyone after that starts as viewer until a super_admin promotes them.
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id, new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    case when exists (select 1 from public.profiles where role = 'super_admin')
         then 'viewer'::public.app_role else 'super_admin'::public.app_role end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table if not exists public.audit_logs (
  id bigint generated always as identity primary key,
  actor uuid,
  actor_email text,
  action text not null,
  table_name text not null,
  record_id text,
  changes jsonb,
  created_at timestamptz not null default now()
);

create or replace function public.write_audit_log()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  rec jsonb := case when tg_op = 'DELETE' then to_jsonb(old) else to_jsonb(new) end;
begin
  insert into public.audit_logs (actor, actor_email, action, table_name, record_id, changes)
  values (
    auth.uid(),
    (select email from public.profiles where id = auth.uid()),
    lower(tg_op), tg_table_name, rec ->> 'id',
    case when tg_op = 'UPDATE' then jsonb_build_object('before', to_jsonb(old), 'after', to_jsonb(new))
         else rec end
  );
  return null;
end $$;

-- ---------------------------------------------------------------------
-- Site settings (one row, id = 1)
-- ---------------------------------------------------------------------
create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  email text, phone text, whatsapp text,
  address_en text, address_bn text,
  map_embed_url text,
  facebook_url text default 'https://www.facebook.com/share/1NA6EcdAW6/',
  youtube_url text,
  registration_authority text, registration_number text,
  mission_en text, mission_bn text,
  vision_en text, vision_bn text,
  story_en text, story_bn text,
  bkash_number text, bkash_type text,
  nagad_number text,
  bank_name text, bank_branch text, bank_account_name text,
  bank_account_number text, bank_routing_number text,
  contribute_note_en text, contribute_note_bn text,
  updated_at timestamptz not null default now()
);
insert into public.site_settings (id) values (1) on conflict do nothing;

-- ---------------------------------------------------------------------
-- Content tables (bilingual: *_en / *_bn)
-- ---------------------------------------------------------------------
create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title_en text not null, title_bn text,
  summary_en text, summary_bn text,
  body_en text, body_bn text,
  icon text default 'heart-handshake',
  cover_image_url text,
  sort_order int not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  program_id uuid references public.programs (id) on delete set null,
  title_en text not null, title_bn text,
  summary_en text, summary_bn text,
  body_en text, body_bn text,
  location_en text, location_bn text,
  status text not null default 'ongoing' check (status in ('planned', 'ongoing', 'completed')),
  start_date date, end_date date,
  cover_image_url text,
  sort_order int not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title_en text not null, title_bn text,
  summary_en text, summary_bn text,
  body_en text, body_bn text,
  location_en text, location_bn text,
  starts_at timestamptz not null,
  ends_at timestamptz,
  cover_image_url text,
  registration_open boolean not null default false,
  capacity int,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_albums (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9-]+$'),
  title_en text not null, title_bn text,
  description_en text, description_bn text,
  cover_image_url text,
  album_date date,
  sort_order int not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  album_id uuid not null references public.gallery_albums (id) on delete cascade,
  image_url text not null,
  caption_en text, caption_bn text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  name_en text not null, name_bn text,
  role_en text, role_bn text,
  bio_en text, bio_bn text,
  photo_url text,
  team_group text not null default 'executive'
    check (team_group in ('founder', 'executive', 'advisor', 'volunteer')),
  sort_order int not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.faqs (
  id uuid primary key default gen_random_uuid(),
  question_en text not null, question_bn text,
  answer_en text not null, answer_bn text,
  sort_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.impact_stats (
  id uuid primary key default gen_random_uuid(),
  label_en text not null, label_bn text,
  value text not null,
  source text,
  as_of date,
  is_verified boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  website_url text,
  description_en text, description_bn text,
  sort_order int not null default 0,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Submissions (visitors may INSERT only; staff read/update by permission)
-- ---------------------------------------------------------------------
create table if not exists public.volunteer_applications (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  full_name text not null,
  email text, phone text not null,
  area text, occupation text,
  interests text[] not null default '{}',
  availability text,
  skills text, message text,
  consent boolean not null check (consent),
  locale text,
  status text not null default 'new' check (status in ('new', 'contacted', 'accepted', 'declined', 'archived')),
  staff_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assistance_requests (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  full_name text not null,
  phone text not null, email text,
  address text,
  assistance_type text not null,
  household_size int,
  description text not null,
  consent boolean not null check (consent),
  locale text,
  status text not null default 'new' check (status in ('new', 'reviewing', 'approved', 'referred', 'closed')),
  staff_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  full_name text not null,
  email text, phone text,
  subject text, message text not null,
  locale text,
  status text not null default 'new' check (status in ('new', 'replied', 'archived')),
  staff_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.partnership_inquiries (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  organization text not null,
  contact_person text not null,
  email text not null, phone text,
  partnership_type text,
  message text not null,
  locale text,
  status text not null default 'new' check (status in ('new', 'in_discussion', 'agreed', 'declined', 'archived')),
  staff_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  event_id uuid not null references public.events (id) on delete cascade,
  full_name text not null,
  phone text not null, email text,
  attendees int not null default 1 check (attendees between 1 and 10),
  locale text,
  status text not null default 'registered' check (status in ('registered', 'confirmed', 'attended', 'cancelled')),
  staff_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Flood guard: the website already filters bots (honeypot + optional Turnstile).
-- This stops bulk inserts that bypass the website: max 30 rows per table per minute.
create or replace function public.limit_submission_rate()
returns trigger language plpgsql security definer set search_path = public as $$
declare recent int;
begin
  execute format('select count(*) from public.%I where created_at > now() - interval ''1 minute''', tg_table_name)
    into recent;
  if recent >= 30 then
    raise exception 'Too many submissions, please try again in a minute.';
  end if;
  return new;
end $$;

-- ---------------------------------------------------------------------
-- Triggers: updated_at, audit, rate limit
-- ---------------------------------------------------------------------
do $$
declare t text;
begin
  foreach t in array array[
    'site_settings','programs','projects','events','gallery_albums','gallery_photos',
    'team_members','faqs','impact_stats','partners',
    'volunteer_applications','assistance_requests','contact_messages',
    'partnership_inquiries','event_registrations'
  ] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$I', t);
    execute format('create trigger touch_%1$s before update on public.%1$I for each row execute function public.touch_updated_at()', t);
  end loop;

  -- Audit every staff change to content, settings and submission status.
  foreach t in array array[
    'site_settings','programs','projects','events','gallery_albums','gallery_photos',
    'team_members','faqs','impact_stats','partners','profiles','role_permissions'
  ] loop
    execute format('drop trigger if exists audit_%1$s on public.%1$I', t);
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$I for each row execute function public.write_audit_log()', t);
  end loop;
  foreach t in array array[
    'volunteer_applications','assistance_requests','contact_messages',
    'partnership_inquiries','event_registrations'
  ] loop
    execute format('drop trigger if exists audit_%1$s on public.%1$I', t);
    execute format('create trigger audit_%1$s after update or delete on public.%1$I for each row execute function public.write_audit_log()', t);
    execute format('drop trigger if exists rate_%1$s on public.%1$I', t);
    execute format('create trigger rate_%1$s before insert on public.%1$I for each row execute function public.limit_submission_rate()', t);
  end loop;
end $$;

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.role_permissions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.site_settings enable row level security;
alter table public.programs enable row level security;
alter table public.projects enable row level security;
alter table public.events enable row level security;
alter table public.gallery_albums enable row level security;
alter table public.gallery_photos enable row level security;
alter table public.team_members enable row level security;
alter table public.faqs enable row level security;
alter table public.impact_stats enable row level security;
alter table public.partners enable row level security;
alter table public.volunteer_applications enable row level security;
alter table public.assistance_requests enable row level security;
alter table public.contact_messages enable row level security;
alter table public.partnership_inquiries enable row level security;
alter table public.event_registrations enable row level security;

-- profiles: see your own; user managers see all; only super_admin changes roles
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles for select to authenticated
  using (id = auth.uid() or public.has_permission('users', 'read'));
drop policy if exists "profiles admin write" on public.profiles;
create policy "profiles admin write" on public.profiles for update to authenticated
  using (public.has_permission('users', 'write'))
  with check (public.has_permission('users', 'write'));

drop policy if exists "permissions readable by staff" on public.role_permissions;
create policy "permissions readable by staff" on public.role_permissions for select to authenticated
  using (public.is_staff());

drop policy if exists "audit read" on public.audit_logs;
create policy "audit read" on public.audit_logs for select to authenticated
  using (public.has_permission('audit', 'read'));

-- settings: public can read (only shows what admins entered), finance/super write
drop policy if exists "settings public read" on public.site_settings;
create policy "settings public read" on public.site_settings for select using (true);
drop policy if exists "settings write" on public.site_settings;
create policy "settings write" on public.site_settings for update to authenticated
  using (public.has_permission('settings', 'write'))
  with check (public.has_permission('settings', 'write'));

-- Content tables: generic policies by module
do $$
declare
  rec record;
begin
  for rec in select * from (values
    ('programs', 'content', 'is_published'),
    ('projects', 'content', 'is_published'),
    ('team_members', 'content', 'is_published'),
    ('faqs', 'content', 'is_published'),
    ('partners', 'content', 'is_published'),
    ('events', 'events', 'is_published'),
    ('gallery_albums', 'gallery', 'is_published'),
    ('impact_stats', 'impact', 'is_verified')
  ) as v(tbl, module, flag) loop
    execute format('drop policy if exists "public read" on public.%I', rec.tbl);
    execute format('create policy "public read" on public.%I for select using (%I or public.has_permission(%L, ''read''))',
                   rec.tbl, rec.flag, rec.module);
    execute format('drop policy if exists "staff insert" on public.%I', rec.tbl);
    execute format('create policy "staff insert" on public.%I for insert to authenticated with check (public.has_permission(%L, ''write''))',
                   rec.tbl, rec.module);
    execute format('drop policy if exists "staff update" on public.%I', rec.tbl);
    execute format('create policy "staff update" on public.%I for update to authenticated using (public.has_permission(%L, ''write'')) with check (public.has_permission(%L, ''write''))',
                   rec.tbl, rec.module, rec.module);
    execute format('drop policy if exists "staff delete" on public.%I', rec.tbl);
    execute format('create policy "staff delete" on public.%I for delete to authenticated using (public.has_permission(%L, ''write''))',
                   rec.tbl, rec.module);
  end loop;
end $$;

-- gallery photos follow their album
drop policy if exists "public read" on public.gallery_photos;
create policy "public read" on public.gallery_photos for select using (
  exists (select 1 from public.gallery_albums a where a.id = album_id and a.is_published)
  or public.has_permission('gallery', 'read'));
drop policy if exists "staff write" on public.gallery_photos;
create policy "staff write" on public.gallery_photos for all to authenticated
  using (public.has_permission('gallery', 'write'))
  with check (public.has_permission('gallery', 'write'));

-- Submissions: anyone may insert (validated by the website first); staff read/update.
do $$
declare
  rec record;
begin
  for rec in select * from (values
    ('volunteer_applications', 'volunteers'),
    ('assistance_requests', 'assistance'),
    ('contact_messages', 'messages'),
    ('partnership_inquiries', 'partnerships'),
    ('event_registrations', 'registrations')
  ) as v(tbl, module) loop
    execute format('drop policy if exists "anyone submits" on public.%I', rec.tbl);
    execute format('create policy "anyone submits" on public.%I for insert to anon, authenticated with check (true)', rec.tbl);
    execute format('drop policy if exists "staff read" on public.%I', rec.tbl);
    execute format('create policy "staff read" on public.%I for select to authenticated using (public.has_permission(%L, ''read''))', rec.tbl, rec.module);
    execute format('drop policy if exists "staff update" on public.%I', rec.tbl);
    execute format('create policy "staff update" on public.%I for update to authenticated using (public.has_permission(%L, ''write'')) with check (public.has_permission(%L, ''write''))', rec.tbl, rec.module, rec.module);
    execute format('drop policy if exists "staff delete" on public.%I', rec.tbl);
    execute format('create policy "staff delete" on public.%I for delete to authenticated using (public.has_permission(%L, ''write''))', rec.tbl, rec.module);
  end loop;
end $$;

-- Event registration only for published events that are open.
drop policy if exists "anyone submits" on public.event_registrations;
create policy "anyone submits" on public.event_registrations for insert to anon, authenticated
  with check (exists (select 1 from public.events e where e.id = event_id and e.is_published and e.registration_open));

-- ---------------------------------------------------------------------
-- Storage: public "media" bucket for images and PDFs
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('media', 'media', true, 5242880,
        array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'application/pdf'])
on conflict (id) do nothing;

drop policy if exists "media staff upload" on storage.objects;
create policy "media staff upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'media' and (
    public.has_permission('content', 'write') or public.has_permission('gallery', 'write')
    or public.has_permission('events', 'write') or public.has_permission('settings', 'write')));
drop policy if exists "media staff update" on storage.objects;
create policy "media staff update" on storage.objects for update to authenticated
  using (bucket_id = 'media' and public.is_staff());
drop policy if exists "media staff delete" on storage.objects;
create policy "media staff delete" on storage.objects for delete to authenticated
  using (bucket_id = 'media' and (public.has_permission('content', 'write') or public.has_permission('gallery', 'write')));

-- Helpful indexes
create index if not exists events_starts_idx on public.events (starts_at);
create index if not exists photos_album_idx on public.gallery_photos (album_id, sort_order);
create index if not exists audit_created_idx on public.audit_logs (created_at desc);
