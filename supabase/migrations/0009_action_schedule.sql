-- 0009: when the work happens.
--
-- An action already knows who owns it and when it is due. A Gantt needs the
-- other two facts: when it starts and how long it runs. Stored as explicit
-- dates rather than a duration, because the schedule gets adjusted by hand
-- after it is proposed and a duration would have to be recalculated on every
-- edit.
--
-- due_date is left alone. It is a commitment; end_date is a plan, and the
-- difference between them is worth being able to see.
--
-- Safe to run more than once.

alter table public.assessment_actions
  add column if not exists start_date date;

alter table public.assessment_actions
  add column if not exists end_date date;

-- A bar cannot end before it starts. Written as a trigger-free check so a bad
-- edit fails at the write rather than drawing a negative bar.
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'assessment_actions_dates_ordered'
  ) then
    alter table public.assessment_actions
      add constraint assessment_actions_dates_ordered
      check (start_date is null or end_date is null or end_date >= start_date);
  end if;
end $$;

create index if not exists assessment_actions_schedule_idx
  on public.assessment_actions(assessment_id, start_date);
