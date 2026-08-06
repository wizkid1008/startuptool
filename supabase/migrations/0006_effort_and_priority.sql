-- 0006: effort, time, cost and estimate confidence, plus a derived priority.
--
-- Criticality ranks what is broken. It says nothing about how hard it is to
-- fix, so the tool could not answer "what should we do first". These four add
-- that, on the same 1-4 shape as maturity and impact.
--
-- Safe to run more than once.

alter table public.assessment_scores
  add column if not exists effort_score integer check (effort_score between 1 and 4);

alter table public.assessment_scores
  add column if not exists time_score integer check (time_score between 1 and 4);

alter table public.assessment_scores
  add column if not exists cost_score integer check (cost_score between 1 and 4);

-- Distinct from the existing `confidence`, which is the agent's confidence in
-- the maturity and impact ratings. This one is confidence in the estimate.
alter table public.assessment_scores
  add column if not exists estimate_confidence integer
    check (estimate_confidence between 1 and 4);

-- Priority = criticality x (5 - effort), range 1-64. A critical gap that is
-- cheap to fix outranks an equally critical one that takes a year.
--
-- Null when effort is unknown, rather than assuming a middle value — an
-- unestimated row should sort as unestimated, not as average.
do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'assessment_scores'
      and column_name = 'priority_score'
  ) then
    alter table public.assessment_scores
      add column priority_score numeric
      generated always as (
        case
          when effort_score is null then null
          else criticality_score * (5 - effort_score)
        end
      ) stored;
  end if;
end
$$;

create index if not exists assessment_scores_priority_idx
  on public.assessment_scores(assessment_id, priority_score desc nulls last);
