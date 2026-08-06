-- 0008: where an action came from, and why.
--
-- Actions were only ever typed by a person. Once an agent proposes them, the
-- distinction matters for the same reason it does on scores and answers: a
-- proposal a human has not looked at should not be indistinguishable from a
-- decision they made.
--
-- Safe to run more than once.

alter table public.assessment_actions
  add column if not exists source text not null default 'manual'
    check (source in ('ai', 'manual'));

-- Why the agent proposed it — the rubric gap it is meant to close.
alter table public.assessment_actions
  add column if not exists rationale text;

-- A proposal becomes a decision when someone accepts it. Until then it is
-- shown separately so an unreviewed list is never mistaken for a plan.
alter table public.assessment_actions
  add column if not exists accepted_at timestamptz;

create index if not exists assessment_actions_source_idx
  on public.assessment_actions(assessment_id, source);
