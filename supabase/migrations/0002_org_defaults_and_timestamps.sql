-- 0002: organization defaults, updated_at triggers, missing index.
--
-- Safe to run more than once.

-- ---------------------------------------------------------------------------
-- updated_at was defaulted but never maintained
-- ---------------------------------------------------------------------------
-- Five tables carry an `updated_at` column with a default of now(), but no
-- trigger ever advanced it, so it always equalled created_at. The company page
-- renders it as "Updated", which was therefore always wrong.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_updated_at on public.organizations;
create trigger set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.profiles;
create trigger set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.companies;
create trigger set_updated_at
  before update on public.companies
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.assessments;
create trigger set_updated_at
  before update on public.assessments
  for each row execute function public.set_updated_at();

drop trigger if exists set_updated_at on public.assessment_scores;
create trigger set_updated_at
  before update on public.assessment_scores
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- companies.organization_id was always NULL
-- ---------------------------------------------------------------------------
-- Nothing in the application sets organization_id, so every company row had it
-- NULL. Every RLS policy matches on `organization_id in (select ...)`, and
-- `NULL in (...)` is never true — so the moment authentication is switched on,
-- every row would become invisible to every user.
--
-- A single default organization is assumed here. That is the right shape for
-- one team using the tool; if SMEAT ever serves multiple tenants, replace this
-- default with real organization assignment at signup.

insert into public.organizations (id, name)
values ('00000000-0000-0000-0000-000000000001', 'Default Organization')
on conflict (id) do nothing;

update public.companies
  set organization_id = '00000000-0000-0000-0000-000000000001'
  where organization_id is null;

alter table public.companies
  alter column organization_id set default '00000000-0000-0000-0000-000000000001';

alter table public.companies
  alter column organization_id set not null;

-- ---------------------------------------------------------------------------
-- Missing index
-- ---------------------------------------------------------------------------
-- company_documents is always queried by company_id but had no index on it.

create index if not exists company_documents_company_id_idx
  on public.company_documents(company_id);

-- ---------------------------------------------------------------------------
-- Still outstanding, deliberately not done here
-- ---------------------------------------------------------------------------
-- 1. The `company-documents` storage bucket has no access policies. Uploads
--    work today only because the server uses the service role key, which
--    bypasses them. Policies have to be written against the auth model, so
--    they belong in the migration that introduces authentication.
-- 2. agent_runs, excel_imports and excel_exports have SELECT policies but no
--    INSERT policies, for the same reason.
