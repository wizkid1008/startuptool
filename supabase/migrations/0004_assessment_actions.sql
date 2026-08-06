-- 0004: client actions.
--
-- The workbook has a "Client Actions" block under every subdimension, captured
-- as free text. Modelling them as rows instead makes them trackable — owner,
-- due date, status — which is what turns an assessment into a programme of
-- work rather than a report.
--
-- Safe to run more than once.

create table if not exists public.assessment_actions (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  -- Nullable so an action can outlive a re-score, which deletes and recreates
  -- the score rows.
  assessment_score_id uuid references public.assessment_scores(id) on delete set null,
  dimension_key text,
  subdimension_key text,
  title text not null,
  detail text,
  owner text,
  due_date date,
  status text not null default 'open'
    check (status in ('open', 'in_progress', 'done', 'dropped')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists assessment_actions_assessment_id_idx
  on public.assessment_actions(assessment_id);

create index if not exists assessment_actions_score_id_idx
  on public.assessment_actions(assessment_score_id);

drop trigger if exists set_updated_at on public.assessment_actions;
create trigger set_updated_at
  before update on public.assessment_actions
  for each row execute function public.set_updated_at();

alter table public.assessment_actions enable row level security;

-- Same organization scoping as every other assessment-owned table.
drop policy if exists "organization members can read actions" on public.assessment_actions;
create policy "organization members can read actions"
  on public.assessment_actions for select
  using (
    assessment_id in (
      select a.id
      from public.assessments a
      join public.companies c on c.id = a.company_id
      join public.profiles p on p.organization_id = c.organization_id
      where p.id = auth.uid()
    )
  );

drop policy if exists "organization members can manage actions" on public.assessment_actions;
create policy "organization members can manage actions"
  on public.assessment_actions for all
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
