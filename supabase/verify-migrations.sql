-- Verifies every migration has been applied. One row, one column per
-- migration, "ok" or "MISSING". Read-only — safe to run any time.

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
)
select
  case when (select count(*) from tbls where table_name in (
         'organizations','profiles','companies','company_documents','assessments',
         'assessment_scores','assessment_evidence','agent_runs')) = 8
       then 'ok' else 'MISSING' end                                as m0001_schema,

  case when exists (select 1 from trg where tgname = 'set_updated_at')
        and exists (select 1 from public.organizations
                    where id = '00000000-0000-0000-0000-000000000001')
       then 'ok' else 'MISSING' end                                as m0002_org_timestamps,

  case when exists (select 1 from cols
                    where table_name='assessment_scores' and column_name='criticality_score')
        and not exists (select 1 from cols
                    where table_name='assessment_scores' and column_name='opportunity_score')
        and exists (select 1 from trg where tgname = 'on_auth_user_created')
        and exists (select 1 from pol where schemaname='storage')
       then 'ok' else 'MISSING' end                                as m0003_criticality_auth,

  case when exists (select 1 from tbls where table_name='assessment_actions')
       then 'ok' else 'MISSING' end                                as m0004_actions,

  case when exists (select 1 from tbls where table_name='assessment_answers')
       then 'ok' else 'MISSING' end                                as m0005_answers,

  case when (select count(*) from cols
             where table_name='assessment_scores'
               and column_name in ('effort_score','time_score','cost_score',
                                   'estimate_confidence','priority_score')) = 5
       then 'ok' else 'MISSING' end                                as m0006_effort_priority,

  case when (select count(*) from cols
             where table_name='assessment_answers'
               and column_name in ('selected_level','suggested_level')) = 2
       then 'ok' else 'MISSING' end                                as m0007_answer_levels,

  case when (select count(*) from cols
             where table_name='assessment_actions'
               and column_name in ('source','rationale','accepted_at')) = 3
       then 'ok' else 'MISSING' end                                as m0008_action_provenance,

  case when (select count(*) from cols
             where table_name='assessment_actions'
               and column_name in ('start_date','end_date')) = 2
       then 'ok' else 'MISSING' end                                as m0009_action_schedule,

  case when exists (select 1 from tbls where table_name='organization_invites')
         and exists (select 1 from cols
                     where table_name='organization_invites' and column_name='accepted_at')
       then 'ok' else 'MISSING' end                                as m0010_invite_only,

  (select count(*) from pol where schemaname in ('public','storage'))::text
                                                                   as policy_count;
