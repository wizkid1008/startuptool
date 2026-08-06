-- Has every migration been applied?
--
-- One row per migration: "ok" or "MISSING", in order, with the file to run if
-- something is absent. Read-only — safe to run any time, as often as you like.
--
-- Paste the whole file into the Supabase SQL editor and run it.

with cols as (
  select table_name, column_name
  from information_schema.columns
  where table_schema = 'public'
),
tbls as (
  select table_name from information_schema.tables where table_schema = 'public'
),
trg as (
  select tgname from pg_trigger where not tgisinternal
),
pol as (
  select schemaname, tablename, policyname from pg_policies
),
checks as (
  select 1 as seq, '0001_initial_schema' as migration,
    (select count(*) from tbls where table_name in (
       'organizations','profiles','companies','company_documents','assessments',
       'assessment_scores','assessment_evidence','agent_runs')) = 8 as applied

  union all
  select 2, '0002_org_defaults_and_timestamps',
    exists (select 1 from trg where tgname = 'set_updated_at')
    and exists (select 1 from public.organizations
                where id = '00000000-0000-0000-0000-000000000001')

  union all
  select 3, '0003_criticality_and_auth',
    exists (select 1 from cols
            where table_name='assessment_scores' and column_name='criticality_score')
    and not exists (select 1 from cols
            where table_name='assessment_scores' and column_name='opportunity_score')
    and exists (select 1 from trg where tgname = 'on_auth_user_created')
    and exists (select 1 from pol where schemaname='storage')

  union all
  select 4, '0004_assessment_actions',
    exists (select 1 from tbls where table_name='assessment_actions')

  union all
  select 5, '0005_assessment_answers',
    exists (select 1 from tbls where table_name='assessment_answers')

  union all
  select 6, '0006_effort_and_priority',
    (select count(*) from cols
     where table_name='assessment_scores'
       and column_name in ('effort_score','time_score','cost_score',
                           'estimate_confidence','priority_score')) = 5

  union all
  select 7, '0007_answer_selected_level',
    (select count(*) from cols
     where table_name='assessment_answers'
       and column_name in ('selected_level','suggested_level')) = 2

  union all
  select 8, '0008_action_provenance',
    (select count(*) from cols
     where table_name='assessment_actions'
       and column_name in ('source','rationale','accepted_at')) = 3

  union all
  select 9, '0009_action_schedule',
    (select count(*) from cols
     where table_name='assessment_actions'
       and column_name in ('start_date','end_date')) = 2

  -- Checks the trigger was replaced, not just that the table exists. Creating
  -- the table without rewriting handle_new_user would leave signups still
  -- joining the default organization, which is the whole point of 0010.
  union all
  select 10, '0010_invite_only_membership',
    exists (select 1 from tbls where table_name='organization_invites')
    and exists (select 1 from cols
                where table_name='organization_invites' and column_name='accepted_at')
    and exists (
      select 1 from pg_proc p
      join pg_namespace n on n.oid = p.pronamespace
      where n.nspname = 'public'
        and p.proname = 'handle_new_user'
        and pg_get_functiondef(p.oid) like '%organization_invites%'
    )
)
select
  migration,
  case when applied then 'ok' else 'MISSING' end as status,
  case when applied then '' else 'run supabase/migrations/' || migration || '.sql' end as todo
from checks
order by seq;
