create extension if not exists "pgcrypto";

insert into storage.buckets (id, name, public)
values ('company-documents', 'company-documents', false)
on conflict (id) do nothing;

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete set null,
  full_name text,
  role text not null default 'member' check (role in ('owner', 'admin', 'member', 'viewer')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  name text not null,
  website text,
  linkedin_url text,
  crunchbase_url text,
  industry text,
  stage text,
  geography text,
  employee_count_range text,
  description text,
  status text not null default 'active' check (status in ('active', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.company_documents (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null,
  document_type text,
  parsed_text text,
  created_at timestamptz not null default now()
);

create table if not exists public.assessments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  status text not null default 'draft' check (status in ('draft', 'researching', 'scored', 'reviewed', 'finalized', 'failed')),
  model_provider text,
  model_name text,
  executive_summary text,
  created_by uuid references auth.users(id) on delete set null,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.assessment_scores (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  dimension_key text not null,
  subdimension_key text not null,
  maturity_score integer not null check (maturity_score between 1 and 4),
  impact_score integer not null check (impact_score between 1 and 4),
  opportunity_score numeric not null,
  confidence numeric check (confidence between 0 and 1),
  source text not null default 'manual' check (source in ('ai', 'manual', 'import')),
  rationale text,
  reviewer_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (assessment_id, dimension_key, subdimension_key)
);

create table if not exists public.assessment_evidence (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  assessment_score_id uuid references public.assessment_scores(id) on delete cascade,
  evidence_type text not null check (evidence_type in ('web', 'document', 'user_input', 'model_inference')),
  title text,
  url text,
  excerpt text,
  confidence numeric check (confidence between 0 and 1),
  created_at timestamptz not null default now()
);

create table if not exists public.agent_runs (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid references public.assessments(id) on delete set null,
  run_type text not null check (run_type in ('research', 'scoring', 'analysis', 'import', 'export')),
  status text not null check (status in ('queued', 'running', 'succeeded', 'failed')),
  input_payload jsonb,
  output_payload jsonb,
  error text,
  model_provider text,
  model_name text,
  created_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.excel_imports (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  uploaded_by uuid references auth.users(id) on delete set null,
  file_path text,
  status text not null default 'uploaded' check (status in ('uploaded', 'validated', 'imported', 'failed')),
  row_count integer not null default 0,
  error_report jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.excel_exports (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  file_path text,
  export_type text not null default 'assessment',
  created_at timestamptz not null default now()
);

create index if not exists companies_organization_id_idx on public.companies(organization_id);
create index if not exists assessments_company_id_idx on public.assessments(company_id);
create index if not exists assessment_scores_assessment_id_idx on public.assessment_scores(assessment_id);
create index if not exists assessment_evidence_assessment_id_idx on public.assessment_evidence(assessment_id);
create index if not exists agent_runs_assessment_id_idx on public.agent_runs(assessment_id);

alter table public.organizations enable row level security;
alter table public.profiles enable row level security;
alter table public.companies enable row level security;
alter table public.company_documents enable row level security;
alter table public.assessments enable row level security;
alter table public.assessment_scores enable row level security;
alter table public.assessment_evidence enable row level security;
alter table public.agent_runs enable row level security;
alter table public.excel_imports enable row level security;
alter table public.excel_exports enable row level security;

-- Postgres has no `create policy if not exists`, so pasting this file a second
-- time would fail here and leave the schema half-applied. Dropping first makes
-- the whole file safe to re-run.
drop policy if exists "profiles can read own profile" on public.profiles;
drop policy if exists "organization members can read companies" on public.companies;
drop policy if exists "organization members can manage companies" on public.companies;
drop policy if exists "organization members can read assessments" on public.assessments;
drop policy if exists "organization members can manage assessments" on public.assessments;
drop policy if exists "organization members can read documents" on public.company_documents;
drop policy if exists "organization members can manage documents" on public.company_documents;
drop policy if exists "organization members can read scores" on public.assessment_scores;
drop policy if exists "organization members can manage scores" on public.assessment_scores;
drop policy if exists "organization members can read evidence" on public.assessment_evidence;
drop policy if exists "organization members can manage evidence" on public.assessment_evidence;
drop policy if exists "organization members can read agent runs" on public.agent_runs;
drop policy if exists "organization members can read imports" on public.excel_imports;
drop policy if exists "organization members can read exports" on public.excel_exports;

create policy "profiles can read own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "organization members can read companies"
  on public.companies for select
  using (
    organization_id in (
      select organization_id from public.profiles where id = auth.uid()
    )
  );

create policy "organization members can manage companies"
  on public.companies for all
  using (
    organization_id in (
      select organization_id from public.profiles where id = auth.uid()
    )
  )
  with check (
    organization_id in (
      select organization_id from public.profiles where id = auth.uid()
    )
  );

create policy "organization members can read assessments"
  on public.assessments for select
  using (
    company_id in (
      select c.id
      from public.companies c
      join public.profiles p on p.organization_id = c.organization_id
      where p.id = auth.uid()
    )
  );

create policy "organization members can manage assessments"
  on public.assessments for all
  using (
    company_id in (
      select c.id
      from public.companies c
      join public.profiles p on p.organization_id = c.organization_id
      where p.id = auth.uid()
    )
  )
  with check (
    company_id in (
      select c.id
      from public.companies c
      join public.profiles p on p.organization_id = c.organization_id
      where p.id = auth.uid()
    )
  );

create policy "organization members can read documents"
  on public.company_documents for select
  using (
    company_id in (
      select c.id
      from public.companies c
      join public.profiles p on p.organization_id = c.organization_id
      where p.id = auth.uid()
    )
  );

create policy "organization members can manage documents"
  on public.company_documents for all
  using (
    company_id in (
      select c.id
      from public.companies c
      join public.profiles p on p.organization_id = c.organization_id
      where p.id = auth.uid()
    )
  )
  with check (
    company_id in (
      select c.id
      from public.companies c
      join public.profiles p on p.organization_id = c.organization_id
      where p.id = auth.uid()
    )
  );

create policy "organization members can read scores"
  on public.assessment_scores for select
  using (
    assessment_id in (
      select a.id
      from public.assessments a
      join public.companies c on c.id = a.company_id
      join public.profiles p on p.organization_id = c.organization_id
      where p.id = auth.uid()
    )
  );

create policy "organization members can manage scores"
  on public.assessment_scores for all
  using (
    assessment_id in (
      select a.id
      from public.assessments a
      join public.companies c on c.id = a.company_id
      join public.profiles p on p.organization_id = c.organization_id
      where p.id = auth.uid()
    )
  )
  with check (
    assessment_id in (
      select a.id
      from public.assessments a
      join public.companies c on c.id = a.company_id
      join public.profiles p on p.organization_id = c.organization_id
      where p.id = auth.uid()
    )
  );

create policy "organization members can read evidence"
  on public.assessment_evidence for select
  using (
    assessment_id in (
      select a.id
      from public.assessments a
      join public.companies c on c.id = a.company_id
      join public.profiles p on p.organization_id = c.organization_id
      where p.id = auth.uid()
    )
  );

create policy "organization members can manage evidence"
  on public.assessment_evidence for all
  using (
    assessment_id in (
      select a.id
      from public.assessments a
      join public.companies c on c.id = a.company_id
      join public.profiles p on p.organization_id = c.organization_id
      where p.id = auth.uid()
    )
  )
  with check (
    assessment_id in (
      select a.id
      from public.assessments a
      join public.companies c on c.id = a.company_id
      join public.profiles p on p.organization_id = c.organization_id
      where p.id = auth.uid()
    )
  );

create policy "organization members can read agent runs"
  on public.agent_runs for select
  using (
    assessment_id in (
      select a.id
      from public.assessments a
      join public.companies c on c.id = a.company_id
      join public.profiles p on p.organization_id = c.organization_id
      where p.id = auth.uid()
    )
  );

create policy "organization members can read imports"
  on public.excel_imports for select
  using (
    organization_id in (
      select organization_id from public.profiles where id = auth.uid()
    )
  );

create policy "organization members can read exports"
  on public.excel_exports for select
  using (
    assessment_id in (
      select a.id
      from public.assessments a
      join public.companies c on c.id = a.company_id
      join public.profiles p on p.organization_id = c.organization_id
      where p.id = auth.uid()
    )
  );
