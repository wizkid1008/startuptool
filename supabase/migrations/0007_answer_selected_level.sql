-- 0007: a selected maturity level on a discovery answer.
--
-- Most answers are really a judgment about which level the company sits at.
-- Forcing that through free text loses the structure and makes it useless to
-- the scoring pass. This records the level directly; prose stays optional and
-- complementary.
--
-- Safe to run more than once.

alter table public.assessment_answers
  add column if not exists selected_level integer
    check (selected_level between 1 and 4);

-- The agent's own suggestion, kept apart from the human's choice so a re-run
-- never silently overwrites a considered answer.
alter table public.assessment_answers
  add column if not exists suggested_level integer
    check (suggested_level between 1 and 4);
