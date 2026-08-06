-- 0005: discovery answers.
--
-- The scoring agent previously worked from company profile fields and whatever
-- documents happened to be uploaded, which is thin evidence for 30 judgments.
-- Discovery runs first: the agent answers what the evidence supports, marks
-- what it cannot determine, and a human fills the gaps. Scoring then reads the
-- answers.
--
-- Safe to run more than once.

create table if not exists public.assessment_answers (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  dimension_key text not null,
  subdimension_key text not null,
  -- Matches DiscoveryQuestion.id in lib/smeat/questions.ts.
  question_id text not null,
  answer text,
  status text not null default 'needs_input'
    check (status in ('answered', 'needs_input', 'not_applicable')),
  source text not null default 'ai' check (source in ('ai', 'manual')),
  confidence numeric check (confidence between 0 and 1),
  -- Where the agent found this, so a reviewer can check rather than trust.
  evidence text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- One answer per question per assessment. The discovery pass upserts on this.
  unique (assessment_id, question_id)
);

create index if not exists assessment_answers_assessment_id_idx
  on public.assessment_answers(assessment_id);

create index if not exists assessment_answers_subdimension_idx
  on public.assessment_answers(assessment_id, dimension_key, subdimension_key);

drop trigger if exists set_updated_at on public.assessment_answers;
create trigger set_updated_at
  before update on public.assessment_answers
  for each row execute function public.set_updated_at();

alter table public.assessment_answers enable row level security;

drop policy if exists "organization members can read answers" on public.assessment_answers;
create policy "organization members can read answers"
  on public.assessment_answers for select
  using (
    assessment_id in (
      select a.id
      from public.assessments a
      join public.companies c on c.id = a.company_id
      join public.profiles p on p.organization_id = c.organization_id
      where p.id = auth.uid()
    )
  );

drop policy if exists "organization members can manage answers" on public.assessment_answers;
create policy "organization members can manage answers"
  on public.assessment_answers for all
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
