-- 0003: rename opportunity_score to criticality_score, and lay the groundwork
-- for organization-shared authentication.
--
-- Safe to run more than once.

-- ---------------------------------------------------------------------------
-- Rename to match the workbook
-- ---------------------------------------------------------------------------
-- SMEAT Tool.xlsm calls this the Criticality Score (maturity x impact, 1-16).
-- The app previously called it opportunity_score and computed it differently.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'assessment_scores'
      and column_name = 'opportunity_score'
  ) then
    alter table public.assessment_scores
      rename column opportunity_score to criticality_score;
  end if;
end
$$;

-- ---------------------------------------------------------------------------
-- Create a profile whenever someone signs up
-- ---------------------------------------------------------------------------
-- Every RLS policy resolves access through public.profiles. Without this
-- trigger a new user authenticates successfully and then sees nothing at all,
-- because no profile row exists to join against.
--
-- New users join the default organization from 0002. Replace this with real
-- invitations when SMEAT serves more than one team.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, organization_id, full_name, role)
  values (
    new.id,
    '00000000-0000-0000-0000-000000000001',
    coalesce(new.raw_user_meta_data ->> 'full_name', new.email),
    'member'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Backfill anyone who signed up before this trigger existed.
insert into public.profiles (id, organization_id, full_name, role)
select u.id, '00000000-0000-0000-0000-000000000001', u.email, 'member'
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- ---------------------------------------------------------------------------
-- Policies that were missing
-- ---------------------------------------------------------------------------
-- 0001 granted SELECT on these but never INSERT, so they worked only because
-- the server used the service role key and bypassed RLS entirely.

drop policy if exists "profiles can insert own profile" on public.profiles;
create policy "profiles can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "profiles can update own profile" on public.profiles;
create policy "profiles can update own profile"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

drop policy if exists "organization members can read own organization" on public.organizations;
create policy "organization members can read own organization"
  on public.organizations for select
  using (
    id in (select organization_id from public.profiles where id = auth.uid())
  );

drop policy if exists "organization members can write agent runs" on public.agent_runs;
create policy "organization members can write agent runs"
  on public.agent_runs for all
  using (
    assessment_id in (
      select a.id from public.assessments a
      join public.companies c on c.id = a.company_id
      join public.profiles p on p.organization_id = c.organization_id
      where p.id = auth.uid()
    )
  )
  with check (
    assessment_id in (
      select a.id from public.assessments a
      join public.companies c on c.id = a.company_id
      join public.profiles p on p.organization_id = c.organization_id
      where p.id = auth.uid()
    )
  );

-- ---------------------------------------------------------------------------
-- Storage policies for the company-documents bucket
-- ---------------------------------------------------------------------------
-- Uploads are keyed as "<company_id>/<timestamp>-<filename>", so the first
-- path segment identifies the company. Compared as text rather than cast to
-- uuid, since a malformed path would otherwise raise inside the policy.

drop policy if exists "org members can read company documents" on storage.objects;
create policy "org members can read company documents"
  on storage.objects for select
  using (
    bucket_id = 'company-documents'
    and (storage.foldername(name))[1] in (
      select c.id::text
      from public.companies c
      join public.profiles p on p.organization_id = c.organization_id
      where p.id = auth.uid()
    )
  );

drop policy if exists "org members can upload company documents" on storage.objects;
create policy "org members can upload company documents"
  on storage.objects for insert
  with check (
    bucket_id = 'company-documents'
    and (storage.foldername(name))[1] in (
      select c.id::text
      from public.companies c
      join public.profiles p on p.organization_id = c.organization_id
      where p.id = auth.uid()
    )
  );

drop policy if exists "org members can delete company documents" on storage.objects;
create policy "org members can delete company documents"
  on storage.objects for delete
  using (
    bucket_id = 'company-documents'
    and (storage.foldername(name))[1] in (
      select c.id::text
      from public.companies c
      join public.profiles p on p.organization_id = c.organization_id
      where p.id = auth.uid()
    )
  );
