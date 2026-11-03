-- WorkNest Supabase Complete Database Schema & Migration
-- Run this in your Supabase Project Dashboard -> SQL Editor -> New Query -> Run

create extension if not exists "uuid-ossp";
create schema if not exists extensions;
create extension if not exists pgcrypto with schema extensions;

-- ====================================================================
-- 1. PROFILES TABLE (Linked with Supabase Auth users)
-- ====================================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('worker', 'employer')),
  name text not null,
  email text not null,
  phone text,
  location text default 'Fort, Mumbai',
  company_name text,
  title text,
  bio text,
  hourly_rate text default '₹550/hr',
  availability text default 'Available Now',
  rating numeric(3, 1) default 5.0,
  reviews_count integer default 0,
  jobs_completed integer default 0,
  response_time text default '< 1 hr',
  verified boolean default true,
  skills text[] default '{}',
  badges text[] default '{}',
  profile_completion integer default 85,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ====================================================================
-- 2. JOBS TABLE
-- ====================================================================
create table if not exists public.jobs (
  id uuid default uuid_generate_v4() primary key,
  employer_id uuid references public.profiles(id) on delete cascade not null,
  company_name text not null,
  title text not null,
  category text not null,
  location text not null,
  pay_type text not null check (pay_type in ('Fixed', 'Hourly')),
  pay_rate text not null,
  duration text default '1 day',
  status text default 'active' check (status in ('active', 'closed')),
  urgent boolean default false,
  description text not null,
  requirements text[] default '{}',
  skills text[] default '{}',
  applicants_count integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ====================================================================
-- 3. APPLICATIONS TABLE
-- ====================================================================
create table if not exists public.applications (
  id uuid default uuid_generate_v4() primary key,
  job_id uuid references public.jobs(id) on delete cascade not null,
  worker_id uuid references public.profiles(id) on delete cascade not null,
  worker_name text not null,
  worker_role text,
  worker_rating numeric(3, 1) default 5.0,
  worker_reviews integer default 0,
  company_name text not null,
  job_title text not null,
  pay_rate text not null,
  expected_rate text,
  cover_note text not null,
  phone text,
  status text default 'pending' check (status in ('pending', 'under-review', 'shortlisted', 'accepted', 'rejected', 'withdrawn')),
  order_status text,
  otp_verified_at timestamp with time zone,
  applied_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (job_id, worker_id)
);
alter table public.applications add column if not exists order_status text;
alter table public.applications add column if not exists otp_verified_at timestamp with time zone;

create or replace function public.protect_application_otp_status()
returns trigger
language plpgsql
as $$
begin
  if current_setting('worknest.otp_status_write', true) is distinct from 'on'
      and (new.otp_verified_at is distinct from old.otp_verified_at
        or new.order_status is distinct from old.order_status) then
    raise exception 'OTP state can only be changed through the OTP verification function.';
  end if;
  return new;
end;
$$;
drop trigger if exists protect_application_otp_status on public.applications;
create trigger protect_application_otp_status
before update of otp_verified_at, order_status on public.applications
for each row execute function public.protect_application_otp_status();

-- OTP plaintext is readable only by the employer. The assigned worker verifies
-- against the stored hash through the restricted RPC below.
create table if not exists public.application_otps (
  application_id uuid primary key references public.applications(id) on delete cascade,
  otp_code text not null check (otp_code ~ '^[0-9]{4}$'),
  otp_hash text not null,
  salt text not null,
  attempts integer not null default 0,
  locked_at timestamp with time zone,
  verified_at timestamp with time zone,
  expires_at timestamp with time zone not null default (now() + interval '24 hours'),
  created_at timestamp with time zone not null default now()
);

-- Live worker position, visible only to the worker and the employer on that job.
create table if not exists public.live_locations (
  application_id uuid primary key references public.applications(id) on delete cascade,
  worker_id uuid references public.profiles(id) on delete cascade not null,
  latitude double precision not null check (latitude between -90 and 90),
  longitude double precision not null check (longitude between -180 and 180),
  accuracy double precision,
  updated_at timestamptz not null default now()
);

-- ====================================================================
-- 4. SAVED JOBS (BOOKMARKS)
-- ====================================================================
create table if not exists public.saved_jobs (
  id uuid default uuid_generate_v4() primary key,
  worker_id uuid references public.profiles(id) on delete cascade not null,
  job_id uuid references public.jobs(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (worker_id, job_id)
);

-- ====================================================================
-- 5. WORK HISTORY
-- ====================================================================
create table if not exists public.work_history (
  id uuid default uuid_generate_v4() primary key,
  application_id uuid unique references public.applications(id) on delete set null,
  worker_id uuid references public.profiles(id) on delete cascade not null,
  employer_id uuid references public.profiles(id) on delete set null,
  employer_name text not null,
  title text not null,
  category text,
  price text not null,
  completion_date text not null,
  status text default 'completed' check (status in ('ongoing', 'completed')),
  rating numeric(3, 1),
  review_text text,
  verified_by_employer boolean default true,
  skills_demonstrated text[] default '{}',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.work_history add column if not exists application_id uuid unique references public.applications(id) on delete set null;

-- Backfill accepted applications so existing orders can also be completed and rated.
insert into public.work_history (
  application_id, worker_id, employer_id, employer_name, title, category, price,
  completion_date, status, verified_by_employer, skills_demonstrated
)
select a.id, a.worker_id, j.employer_id, j.company_name, a.job_title, j.category,
  coalesce(nullif(a.expected_rate, ''), a.pay_rate), to_char(a.applied_at, 'Mon DD, YYYY'),
  'ongoing', true, coalesce(j.skills, '{}')
from public.applications a
join public.jobs j on j.id = a.job_id
where a.status = 'accepted'
on conflict (application_id) do nothing;

-- ====================================================================
-- 6. REVIEWS
-- ====================================================================
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  work_history_id uuid unique references public.work_history(id) on delete cascade,
  worker_id uuid references public.profiles(id) on delete cascade not null,
  employer_id uuid references public.profiles(id) on delete set null,
  employer_name text not null,
  title text not null,
  rating numeric(3, 1) not null check (rating >= 1.0 and rating <= 5.0),
  comment text not null,
  verified boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);
alter table public.reviews add column if not exists work_history_id uuid unique references public.work_history(id) on delete cascade;

-- ====================================================================
-- 7. CONVERSATIONS & 8. MESSAGES
-- ====================================================================
create table if not exists public.conversations (
  id uuid default uuid_generate_v4() primary key,
  participant1_id uuid references public.profiles(id) on delete cascade not null,
  participant2_id uuid references public.profiles(id) on delete cascade not null,
  participant1_name text not null,
  participant2_name text not null,
  job_id uuid references public.jobs(id) on delete set null,
  job_title text,
  last_message text,
  last_message_time text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.messages (
  id uuid default uuid_generate_v4() primary key,
  conversation_id uuid references public.conversations(id) on delete cascade not null,
  sender_id uuid references public.profiles(id) on delete cascade not null,
  sender_name text not null,
  text text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ====================================================================
-- 9. NOTIFICATIONS
-- ====================================================================
create table if not exists public.notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  type text not null check (type in ('application', 'message', 'review', 'job')),
  title text not null,
  message text not null,
  read boolean default false,
  link text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- ====================================================================
-- AUTOMATIC PROFILE TRIGGER ON SUPABASE AUTH SIGNUP
-- ====================================================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (
    id,
    email,
    role,
    name,
    company_name,
    title,
    location,
    phone
  ) values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'worker'),
    coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'companyName',
    new.raw_user_meta_data->>'title',
    coalesce(new.raw_user_meta_data->>'location', 'Fort, Mumbai'),
    new.raw_user_meta_data->>'phone'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Trigger execution
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================
alter table public.profiles enable row level security;
alter table public.jobs enable row level security;
alter table public.applications enable row level security;
alter table public.application_otps enable row level security;
alter table public.live_locations enable row level security;
alter table public.saved_jobs enable row level security;
alter table public.work_history enable row level security;
alter table public.reviews enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- Profiles
drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Jobs
drop policy if exists "Anyone can view jobs" on public.jobs;
create policy "Anyone can view jobs" on public.jobs for select using (true);
drop policy if exists "Employers can insert jobs" on public.jobs;
create policy "Employers can insert jobs" on public.jobs for insert with check (auth.uid() = employer_id);
drop policy if exists "Employers can update own jobs" on public.jobs;
create policy "Employers can update own jobs" on public.jobs for update using (auth.uid() = employer_id);

-- Applications
drop policy if exists "Workers can insert applications" on public.applications;
create policy "Workers can insert applications" on public.applications for insert with check (auth.uid() = worker_id);
drop policy if exists "Applications are viewable by worker or employer" on public.applications;
create policy "Applications are viewable by worker or employer" on public.applications for select using (
  auth.uid() = worker_id or exists (
    select 1 from public.jobs where jobs.id = applications.job_id and jobs.employer_id = auth.uid()
  )
);
drop policy if exists "Employers and workers can update application status" on public.applications;
create policy "Employers and workers can update application status" on public.applications for update using (
  auth.uid() = worker_id or exists (
    select 1 from public.jobs where jobs.id = applications.job_id and jobs.employer_id = auth.uid()
  )
);

drop policy if exists "Employers can view OTP for their accepted orders" on public.application_otps;
create policy "Employers can view OTP for their accepted orders" on public.application_otps for select using (
  exists (
    select 1 from public.applications a join public.jobs j on j.id = a.job_id
    where a.id = application_otps.application_id and j.employer_id = auth.uid()
  )
);

create or replace function public.ensure_application_otp(p_application_id uuid, p_otp_code text)
returns text
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_employer_id uuid;
  v_status text;
  v_salt text;
  v_code text;
begin
  if auth.uid() is null then raise exception 'Sign in is required.'; end if;
  if p_otp_code is null or p_otp_code !~ '^[0-9]{4}$' then raise exception 'OTP must be four digits.'; end if;

  select j.employer_id, a.status into v_employer_id, v_status
    from public.applications a join public.jobs j on j.id = a.job_id
    where a.id = p_application_id;
  if not found or v_employer_id is distinct from auth.uid() then
    raise exception 'Only the employer for this order can create its OTP.';
  end if;
  if v_status <> 'accepted' then raise exception 'Accept the application before creating an OTP.'; end if;

  v_salt := gen_random_uuid()::text;
  insert into public.application_otps (application_id, otp_code, otp_hash, salt)
    values (p_application_id, p_otp_code,
      encode(digest(v_salt || p_otp_code, 'sha256'), 'hex'), v_salt)
    on conflict (application_id) do nothing;
  select otp_code into v_code from public.application_otps where application_id = p_application_id;
  return v_code;
end;
$$;
revoke all on function public.ensure_application_otp(uuid, text) from public;
grant execute on function public.ensure_application_otp(uuid, text) to authenticated;

create or replace function public.verify_application_otp(p_application_id uuid, p_otp_code text)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_worker_id uuid;
  v_status text;
  v_otp public.application_otps%rowtype;
  v_next_attempt integer;
begin
  if auth.uid() is null then return jsonb_build_object('success', false, 'error', 'Sign in as the assigned worker to verify this OTP.'); end if;

  select a.worker_id, a.status into v_worker_id, v_status
    from public.applications a where a.id = p_application_id;
  if not found or v_worker_id is distinct from auth.uid() then
    return jsonb_build_object('success', false, 'error', 'Only the assigned worker can verify this order OTP.');
  end if;
  if v_status <> 'accepted' then return jsonb_build_object('success', false, 'error', 'This order is not accepted.'); end if;

  select * into v_otp from public.application_otps where application_id = p_application_id for update;
  if not found then return jsonb_build_object('success', false, 'error', 'The employer has not set up the OTP yet.'); end if;
  if v_otp.verified_at is not null then return jsonb_build_object('success', true, 'alreadyVerified', true); end if;
  if v_otp.locked_at is not null or v_otp.attempts >= 5 then
    return jsonb_build_object('success', false, 'error', 'Too many incorrect attempts. This OTP is locked; contact WorkNest support before trying again.');
  end if;
  if v_otp.expires_at <= now() then return jsonb_build_object('success', false, 'error', 'This OTP has expired. Ask the employer to reschedule the order.'); end if;

  if p_otp_code is null or encode(digest(v_otp.salt || trim(p_otp_code), 'sha256'), 'hex') <> v_otp.otp_hash then
    v_next_attempt := v_otp.attempts + 1;
    update public.application_otps set attempts = v_next_attempt,
      locked_at = case when v_next_attempt >= 5 then now() else null end
      where application_id = p_application_id;
    return jsonb_build_object('success', false,
      'error', case when v_next_attempt >= 5 then 'Too many incorrect attempts. This OTP is locked; contact WorkNest support before trying again.' else 'Invalid OTP. Check with the employer and try again.' end);
  end if;

  update public.application_otps set verified_at = now() where application_id = p_application_id;
  perform set_config('worknest.otp_status_write', 'on', true);
  update public.applications set otp_verified_at = now(), order_status = 'arrived_started'
    where id = p_application_id;
  return jsonb_build_object('success', true, 'alreadyVerified', false);
end;
$$;
revoke all on function public.verify_application_otp(uuid, text) from public;
grant execute on function public.verify_application_otp(uuid, text) to authenticated;

drop policy if exists "Workers can publish own live location" on public.live_locations;
create policy "Workers can publish own live location" on public.live_locations for insert with check (
  auth.uid() = worker_id and exists (
    select 1 from public.applications a where a.id = application_id and a.worker_id = auth.uid()
  )
);
drop policy if exists "Workers can update own live location" on public.live_locations;
create policy "Workers can update own live location" on public.live_locations for update using (
  auth.uid() = worker_id
);
drop policy if exists "Job parties can view live location" on public.live_locations;
create policy "Job parties can view live location" on public.live_locations for select using (
  auth.uid() = worker_id or exists (
    select 1 from public.applications a join public.jobs j on j.id = a.job_id
    where a.id = application_id and j.employer_id = auth.uid()
  )
);

-- Saved Jobs
drop policy if exists "Users manage own saved jobs" on public.saved_jobs;
create policy "Users manage own saved jobs" on public.saved_jobs for all using (auth.uid() = worker_id);

-- Work History & Reviews
drop policy if exists "Work history is viewable by all" on public.work_history;
create policy "Work history is viewable by all" on public.work_history for select using (true);
drop policy if exists "Employers can create own accepted work orders" on public.work_history;
create policy "Employers can create own accepted work orders" on public.work_history for insert with check (
  auth.uid() = employer_id and application_id is not null and exists (
    select 1 from public.applications a join public.jobs j on j.id = a.job_id
    where a.id = work_history.application_id and a.worker_id = work_history.worker_id
      and a.status = 'accepted' and j.employer_id = auth.uid()
  )
);
drop policy if exists "Employers can update own work history" on public.work_history;
create policy "Employers can update own work history" on public.work_history for update using (auth.uid() = employer_id);
drop policy if exists "Reviews are viewable by all" on public.reviews;
create policy "Reviews are viewable by all" on public.reviews for select using (true);
drop policy if exists "Authenticated users can create reviews" on public.reviews;
drop function if exists public.complete_work_history_with_review(uuid, numeric, text);
create function public.complete_work_history_with_review(p_history_id uuid, p_rating numeric, p_comment text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_history public.work_history%rowtype;
  v_review public.reviews%rowtype;
  v_average numeric(3, 1);
  v_count integer;
begin
  if auth.uid() is null then raise exception 'Sign in is required to complete an order.'; end if;
  if p_rating is null or p_rating < 1 or p_rating > 5 then raise exception 'Rating must be between 1 and 5.'; end if;

  select * into v_history from public.work_history where id = p_history_id for update;
  if not found then raise exception 'Order not found.'; end if;
  if v_history.employer_id is distinct from auth.uid() then raise exception 'Only this order''s employer can submit its rating.'; end if;
  if v_history.status <> 'ongoing' then raise exception 'This order has already been completed.'; end if;
  if v_history.application_id is not null and not exists (
    select 1 from public.applications a where a.id = v_history.application_id and a.status = 'accepted'
  ) then raise exception 'Only an accepted order can be completed and rated.'; end if;
  if exists (select 1 from public.reviews where work_history_id = v_history.id) then
    raise exception 'This order has already been rated.';
  end if;

  update public.work_history set status = 'completed', rating = p_rating,
    review_text = coalesce(nullif(trim(p_comment), ''), null), completion_date = to_char(now(), 'Mon DD, YYYY')
    where id = v_history.id returning * into v_history;

  insert into public.reviews (work_history_id, worker_id, employer_id, employer_name, title, rating, comment, verified)
    values (v_history.id, v_history.worker_id, v_history.employer_id, v_history.employer_name,
      v_history.title, p_rating, coalesce(nullif(trim(p_comment), ''), ''), true)
    returning * into v_review;

  select round(avg(rating), 1), count(*) into v_average, v_count
    from public.reviews where worker_id = v_history.worker_id;
  update public.profiles set rating = v_average, reviews_count = v_count where id = v_history.worker_id;

  return jsonb_build_object('history', to_jsonb(v_history), 'review', to_jsonb(v_review),
    'worker_rating', v_average, 'reviews_count', v_count);
end;
$$;
revoke all on function public.complete_work_history_with_review(uuid, numeric, text) from public;
grant execute on function public.complete_work_history_with_review(uuid, numeric, text) to authenticated;

-- Conversations & Messages
drop policy if exists "Conversation participants can select" on public.conversations;
create policy "Conversation participants can select" on public.conversations for select using (
  auth.uid() = participant1_id or auth.uid() = participant2_id
);
drop policy if exists "Conversation participants can insert" on public.conversations;
create policy "Conversation participants can insert" on public.conversations for insert with check (
  auth.uid() = participant1_id or auth.uid() = participant2_id
);
drop policy if exists "Conversation participants can update" on public.conversations;
create policy "Conversation participants can update" on public.conversations for update using (
  auth.uid() = participant1_id or auth.uid() = participant2_id
);
drop policy if exists "Conversation participants can view messages" on public.messages;
create policy "Conversation participants can view messages" on public.messages for select using (
  exists (
    select 1 from public.conversations where conversations.id = messages.conversation_id and
    (conversations.participant1_id = auth.uid() or conversations.participant2_id = auth.uid())
  )
);
drop policy if exists "Senders can insert messages" on public.messages;
create policy "Senders can insert messages" on public.messages for insert with check (auth.uid() = sender_id);

-- Notifications
drop policy if exists "Users manage own notifications" on public.notifications;
create policy "Users manage own notifications" on public.notifications for all using (auth.uid() = user_id);
drop policy if exists "Authenticated users can notify other users" on public.notifications;
create policy "Authenticated users can notify other users" on public.notifications for insert with check (auth.uid() is not null);

-- Enable Realtime for live chat and notifications
do $$
begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.notifications;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.applications;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.live_locations;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.work_history;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.reviews;
exception when duplicate_object then null;
end $$;
do $$
begin
  alter publication supabase_realtime add table public.profiles;
exception when duplicate_object then null;
end $$;
