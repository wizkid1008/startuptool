# SMEAT Opportunity Scoring Agent

Production-oriented rebuild of the SMEAT prototype as a Next.js + TypeScript + Supabase application.

## What This Implements

- Company pipeline backed by Supabase.
- Formal assessment records.
- Canonical SMEAT dimensions and subdimensions.
- Opportunity scoring formula:

```text
maturity_gap = maturity_score - 1
impact_weight = 5 - impact_score
opportunity_score = maturity_gap * impact_weight
```

- Anthropic-backed scoring agent endpoint.
- Stored rationale, confidence, evidence, and agent run history.
- Excel import for score workbooks.
- Excel export for company profile, scores, and evidence.

## Stack

- Next.js App Router
- TypeScript
- Supabase Postgres, Auth-ready RLS, and future Storage support
- Anthropic SDK
- XLSX import/export
- Zod validation

## Setup

1. Install dependencies.

```bash
npm install
```

2. Create a Supabase project.

3. Run the migration in `supabase/migrations/0001_initial_schema.sql`.

4. Copy `.env.example` to `.env.local`.

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ANTHROPIC_API_KEY=
```

5. Start the app.

```bash
npm run dev
```

## Workbook Import Format

The first sheet must contain these columns:

```text
dimension_key
subdimension_key
maturity_score
impact_score
confidence
rationale
```

Valid `dimension_key` values are:

```text
customer, people, operations, finance, analytics, risk, impact
```

Use the subdimension keys from `lib/smeat/model.ts`.

## Current Security Model

The schema includes RLS policies, but this first production slice uses the Supabase service role from server routes so it can run before auth UI is added. The next hardening step is to add Supabase Auth, session-aware server clients, organization creation, and authenticated route protection.

## Next Build Steps

1. Add Supabase Auth and organization onboarding.
2. Add document upload to Supabase Storage.
3. Add document parsing and evidence extraction.
4. Add human review/override editing for score rows.
5. Add agent run progress states and retry controls.
6. Add tests for scoring, validation, import, export, and RLS.
7. Add deployment config for Vercel and Supabase environments.
