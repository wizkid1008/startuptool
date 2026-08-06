import { MAX_CRITICALITY } from "@/lib/smeat/scoring";

/**
 * Effort, time, cost and estimate confidence.
 *
 * All four run 1-4 to match maturity and impact. Effort, time and cost run
 * low-to-high — 1 is cheap and fast, 4 is expensive and slow — so that a low
 * number always means "easier", which is the opposite direction to impact and
 * worth keeping in mind when reading a row.
 */

export type Scale = Record<1 | 2 | 3 | 4, { label: string; definition: string }>;

export const effortScale: Scale = {
  1: {
    label: "Minimal",
    definition:
      "Days to a few weeks. Existing team, no new systems, no budget approval. Mostly a decision and some discipline."
  },
  2: {
    label: "Moderate",
    definition:
      "One to three months. Reallocating people you already have, minor tooling, no structural change."
  },
  3: {
    label: "Substantial",
    definition:
      "A quarter or two. A hire or a vendor, a budget line, cross-functional coordination."
  },
  4: {
    label: "Major",
    definition:
      "Six months or more. Structural: a new function, a platform migration, an operating-model shift."
  }
};

export const timeScale: Scale = {
  1: { label: "Weeks", definition: "Benefit visible within weeks." },
  2: { label: "1–3 months", definition: "Benefit visible within a quarter." },
  3: { label: "3–9 months", definition: "Benefit visible within the year." },
  4: { label: "9+ months", definition: "Benefit takes most of a year or longer to show." }
};

export const costScale: Scale = {
  1: { label: "Negligible", definition: "Absorbed within the current budget." },
  2: { label: "Modest", definition: "A small line item, approved without difficulty." },
  3: {
    label: "Significant",
    definition: "Needs explicit approval and trades against something else."
  },
  4: {
    label: "Major",
    definition: "A material capital or headcount commitment."
  }
};

export const estimateConfidenceScale: Scale = {
  1: { label: "Speculative", definition: "Little evidence; a first impression." },
  2: { label: "Indicative", definition: "An informed guess, not yet validated." },
  3: { label: "Reasoned", definition: "Grounded in evidence gathered during the assessment." },
  4: { label: "Validated", definition: "Confirmed with the client, or from comparable work." }
};

export const MIN_PRIORITY = 1;
export const MAX_PRIORITY = MAX_CRITICALITY * 4; // 64

/**
 * Priority = criticality x (5 - effort). Mirrors the generated column in
 * migration 0006 — change both together.
 *
 * Time and cost stay out of this on purpose. Folding all four into one number
 * over-penalises anything expensive and buries the reasoning; they are shown
 * alongside so a human can weigh them.
 */
export function computePriorityScore(criticality: number, effort: number | null | undefined) {
  if (effort === null || effort === undefined) return null;
  return criticality * (5 - effort);
}

export function priorityBand(priority: number) {
  if (priority >= 40) return "Do first";
  if (priority >= 24) return "Do next";
  if (priority >= 10) return "Schedule";
  return "Defer";
}

export function priorityTone(priority: number) {
  if (priority >= 40) return "bad";
  if (priority >= 24) return "warn";
  if (priority >= 10) return "info";
  return "neutral";
}

export type Quadrant = "quick_win" | "major_project" | "fill_in" | "thankless";

export const QUADRANT_LABEL: Record<Quadrant, string> = {
  quick_win: "Quick win",
  major_project: "Major project",
  fill_in: "Fill-in",
  thankless: "Thankless"
};

export const QUADRANT_NOTE: Record<Quadrant, string> = {
  quick_win: "Matters a lot, cheap to fix. Start here.",
  major_project: "Matters a lot, expensive. Needs a plan and a budget.",
  fill_in: "Cheap, but low consequence. Do when capacity allows.",
  thankless: "Expensive and low consequence. Question whether to do it at all."
};

/** The standard impact/effort quadrants, using the midpoints of both scales. */
export function quadrantFor(criticality: number, effort: number | null | undefined): Quadrant | null {
  if (effort === null || effort === undefined) return null;
  const high = criticality >= 8;
  const cheap = effort <= 2;

  if (high && cheap) return "quick_win";
  if (high && !cheap) return "major_project";
  if (!high && cheap) return "fill_in";
  return "thankless";
}

export function scaleLabel(scale: Scale, value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return scale[value as 1 | 2 | 3 | 4]?.label ?? "—";
}
