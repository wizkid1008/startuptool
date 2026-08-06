# Flow review

Written 2026-08-06, for the session on tying the pieces together.

The parts all exist. What's missing is the connective tissue: nothing tells a
user where they are, what to do next, or when they're finished. Below is what I
think is actually broken about the flow, roughly in the order I'd fix it.

---

## 1. The 4-step flow was lost in the rebuild

Your original static site has an explicit path, and says so on the homepage:

```
1. Company Profile   2. AI Research   3. Review & Edit   4. Strategic Analysis
```

Four pages, a stepper across the top, and locked steps you can't skip. Someone
who has never seen SMEAT knows exactly where they are.

The Next.js app has all four capabilities and **no path through them**. You land
on an assessment page with a heat map full of dashes, a "Run agent score"
button, and a "Discovery" button in the corner. Nothing indicates that discovery
should come first, or that scoring without it produces a worse result.

**This is the single biggest gap.** Everything below is a symptom of it.

Suggested: a stepper on the assessment page mirroring the workbook —
`Profile → Discovery → Score → Review → Actions` — showing which stage is
complete, which is current, and what's blocking the next one.

## 2. Discovery is optional and invisible

It's a secondary button. Scoring runs happily without it, silently producing
thinner results. The assessment page never mentions that 90 questions exist or
that 60 of them are unanswered.

Suggested: surface discovery coverage on the assessment page ("38 of 90
answered · 22 need your input"), and warn before scoring with low coverage
rather than after.

## 3. Nothing can be marked finished

`assessments.status` allows `draft, researching, scored, reviewed, finalized,
failed`. Only four are ever set. **Nothing writes `finalized`**, and `reviewed`
is written only by the Excel importer.

So an assessment sits on `scored` forever, no matter how much review happens.
There's no "this is done" and therefore no way to tell a finished engagement
from an abandoned one.

Suggested: a "Mark as reviewed" action once every subdimension has been seen,
and "Finalise" to lock it. Locking also gives re-scoring a meaningful guard.

## 4. Documents are on the wrong page

Uploads live on the company page. Discovery reads them. But during discovery —
exactly when you realise you need the pitch deck — you have to navigate away,
upload, come back, and re-run.

Suggested: document upload on the discovery page, since that's where the need
arises.

## 5. Actions have no home

They're inside subdimension panels, behind a segment selection and an accordion.
The *output* of an engagement — who does what by when — is scattered across
thirty collapsed sections. There is no "all actions" view, per assessment or
across companies.

Suggested: an actions view per assessment, and a cross-company one. This is what
a client actually receives.

## 6. The company page shows nothing about the company

It lists assessments as rows with a status pill. No current scores, no trend, no
readiness. You have to open an assessment to learn anything.

## 7. Excel import creates a new assessment

Importing a workbook always creates a *new* assessment rather than updating the
one you're looking at. Reasonable as an import path, confusing as an edit path,
and there's no way to import into an existing assessment.

## 8. Re-scoring is destructive in ways the UI doesn't admit

`runScoring` deletes every score and evidence row before writing new ones. That
means:

- Every human edit to maturity, impact, effort and reviewer notes is discarded.
  The UI warns about this only *after* a failure, never before you click.
- Actions were being orphaned — fixed on 2026-08-06, they now re-attach by
  subdimension — but the underlying pattern is still delete-and-replace.

Suggested: warn before re-scoring when manual edits exist, and consider
preserving human-edited rows the way discovery already preserves manual answers.

## 9. No comparison beyond the immediately previous assessment

`MovementSince` compares against the last scored assessment only. There's no way
to pick two and compare, which is what you'd want across a year of engagement.

## 10. First-run experience

A new login lands on an Overview of zeros. No guidance toward adding a company,
uploading documents, or what a good first pass looks like.

---

## What I'd do first

1. **The stepper.** It makes the intended path visible and fixes items 2, 3 and
   10 by implication.
2. **Actions view.** It's the deliverable and it's currently unreachable.
3. **Re-score guard.** Silent destruction of human work is the most damaging
   thing still in the app.

Items 4–7 and 9 are worth doing but none of them change whether the tool is
usable end to end.

---

## Known bugs still open

- **`xlsx@0.18.5`** carries published advisories on npm and parses uploaded
  files. Replacing it means rewriting import and export.
- **`@anthropic-ai/sdk@^0.25.0`** is many versions old. Structured outputs would
  remove the JSON-extraction fallback in both agents entirely.
- **No `package-lock.json`.** `.github/workflows/lockfile.yml` will generate one
  — trigger it manually from the Actions tab.
- **`lib/supabase/types.ts` is hand-maintained** and has caused two failures. It
  should be replaced with `supabase gen types typescript` output.
- **The live static site's AI endpoint** (`startuptool-eight.vercel.app/api/analyze`)
  has `Access-Control-Allow-Origin: *` and no authentication. Anyone with the
  URL can spend your Anthropic credits. Unrelated to this branch, still true.
