# Architecture Notes

## Core Domains

### Companies

Companies are the root assessment target. A company has profile metadata, market context fields, and future document attachments.

### Assessments

Assessments represent one SMEAT scoring event for one company. This allows historical comparison, re-scoring, and review workflows.

### Scores

Scores are stored per canonical dimension/subdimension pair. Each score contains:

- maturity score
- impact score
- computed opportunity score
- confidence
- source
- rationale
- reviewer note

### Evidence

Evidence is separate from scores so that multiple sources can support a single score and assessment-level evidence can exist before final scoring.

### Agent Runs

Agent runs record all AI/import/export operations with status, model metadata, payloads, errors, and completion time.

## Agent Boundary

The formal agent lives server-side in `app/api/agent/score/route.ts`.

It:

1. Loads the assessment and company.
2. Creates an `agent_runs` record.
3. Builds a canonical SMEAT prompt.
4. Calls Anthropic.
5. Validates the JSON response with Zod.
6. Computes opportunity scores server-side.
7. Persists scores and evidence.
8. Marks the assessment as scored or failed.

## Why This Shape

The original prototype kept assessment data in `localStorage`. This rebuild moves durable state into Supabase and treats AI output as untrusted until validated. That makes the system auditable, multi-company, import/export friendly, and ready for authentication.
