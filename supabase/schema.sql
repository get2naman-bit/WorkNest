-- WorkNest Supabase Complete Database Schema & Migration
-- Run this in your Supabase Project Dashboard -> SQL Editor -> New Query -> Run

create extension if not exists "uuid-ossp";

-- ====================================================================
-- 1. PROFILES TABLE (Linked with Supabase Auth users)
-- ====================================================================
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  role text not null check (role in ('worker', 'employer')),
  name text not null,
  email text not null,
  phone text,
  location text default 'Austin, TX',
  company_name text,
  title text,
  bio text,
  hourly_rate text default '$45/hr',
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
  applied_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (job_id, worker_id)
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

-- ====================================================================
-- 6. REVIEWS
-- ====================================================================
create table if not exists public.reviews (
  id uuid default uuid_generate_v4() primary key,
  worker_id uuid references public.profiles(id) on delete cascade not null,
  employer_id uuid references public.profiles(id) on delete set null,
  employer_name text not null,
  title text not null,
  rating numeric(3, 1) not null check (rating >= 1.0 and rating <= 5.0),
  comment text not null,
  verified boolean default true,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

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
    coalesce(new.raw_user_meta_data->>'location', 'Austin, TX'),
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
alter table public.saved_jobs enable row level security;
alter table public.work_history enable row level security;
alter table public.reviews enable row level security;
alter table public.conversations enable row level security;
alter table public.messages enable row level security;
alter table public.notifications enable row level security;

-- Profiles
create policy "Public profiles are viewable by everyone" on public.profiles for select using (true);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);

-- Jobs
create policy "Anyone can view jobs" on public.jobs for select using (true);
create policy "Employers can insert jobs" on public.jobs for insert with check (auth.uid() = employer_id);
create policy "Employers can update own jobs" on public.jobs for update using (auth.uid() = employer_id);

-- Applications
create policy "Workers can insert applications" on public.applications for insert with check (auth.uid() = worker_id);
create policy "Applications are viewable by worker or employer" on public.applications for select using (
  auth.uid() = worker_id or exists (
    select 1 from public.jobs where jobs.id = applications.job_id and jobs.employer_id = auth.uid()
  )
);
create policy "Employers and workers can update application status" on public.applications for update using (
  auth.uid() = worker_id or exists (
    select 1 from public.jobs where jobs.id = applications.job_id and jobs.employer_id = auth.uid()
  )
);

-- Saved Jobs
create policy "Users manage own saved jobs" on public.saved_jobs for all using (auth.uid() = worker_id);

-- Work History & Reviews
create policy "Work history is viewable by all" on public.work_history for select using (true);
create policy "Employers can update own work history" on public.work_history for update using (auth.uid() = employer_id);
create policy "Reviews are viewable by all" on public.reviews for select using (true);
create policy "Authenticated users can create reviews" on public.reviews for insert with check (auth.role() = 'authenticated');

-- Conversations & Messages
create policy "Conversation participants can select" on public.conversations for select using (
  auth.uid() = participant1_id or auth.uid() = participant2_id
);
create policy "Conversation participants can insert" on public.conversations for insert with check (
  auth.uid() = participant1_id or auth.uid() = participant2_id
);
create policy "Conversation participants can update" on public.conversations for update using (
  auth.uid() = participant1_id or auth.uid() = participant2_id
);
create policy "Conversation participants can view messages" on public.messages for select using (
  exists (
    select 1 from public.conversations where conversations.id = messages.conversation_id and
    (conversations.participant1_id = auth.uid() or conversations.participant2_id = auth.uid())
  )
);
create policy "Senders can insert messages" on public.messages for insert with check (auth.uid() = sender_id);

-- Notifications
create policy "Users manage own notifications" on public.notifications for all using (auth.uid() = user_id);
create policy "Authenticated users can notify other users" on public.notifications for insert with check (auth.uid() is not null);

-- Enable Realtime for live chat and notifications
alter publication supabase_realtime add table public.messages;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.applications;
