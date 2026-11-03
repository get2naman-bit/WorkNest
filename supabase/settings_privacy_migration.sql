-- Adds the public Digital Identity visibility setting to existing projects.
alter table public.profiles
  add column if not exists public_profile boolean not null default true;

drop policy if exists "Public profiles are viewable by everyone" on public.profiles;
create policy "Public profiles are viewable by everyone" on public.profiles for select using (
  public_profile = true or auth.uid() = id
);
