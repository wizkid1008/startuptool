import {
  impactScale,
  maturityScale,
  MAX_CRITICALITY,
  MIN_CRITICALITY
} from "@/lib/smeat/scoring";

export type Tone = "good" | "warn" | "bad" | "info" | "ghost" | "neutral";

/** Maturity: 1 Advanced (strong) … 4 Nascent (weak). */
export function maturityTone(score: number): Tone {
  if (score <= 1) return "good";
  if (score === 2) return "info";
  if (score === 3) return "warn";
  return "bad";
}

/** Impact: 4 Critical (urgent) … 1 Not Needed. Runs opposite to maturity. */
export function impactTone(score: number): Tone {
  if (score >= 4) return "bad";
  if (score === 3) return "warn";
  if (score === 2) return "neutral";
  return "ghost";
}

/**
 * Criticality runs 1–16 (maturity × impact). A high score means a weak
 * capability the business critically needs, so it reads as a gap.
 */
export function criticalityTone(score: number): Tone {
  if (score >= 12) return "bad";
  if (score >= 8) return "warn";
  if (score >= 4) return "info";
  return "neutral";
}

export function criticalityBand(score: number) {
  if (score >= 12) return "Critical";
  if (score >= 8) return "High";
  if (score >= 4) return "Moderate";
  return "Low";
}

/** Percentage of the 1–16 range, for meters. */
export function criticalityPercent(score: number) {
  return Math.max(0, Math.min(100, (score / MAX_CRITICALITY) * 100));
}

/**
 * Readiness inverts average criticality onto 0–100. Criticality bottoms out at
 * 1 rather than 0, so the span is measured from MIN_CRITICALITY — otherwise a
 * perfect assessment would score 94 instead of 100.
 */
export function readinessScore(averageCriticality: number | null) {
  if (averageCriticality === null) return 0;
  const span = MAX_CRITICALITY - MIN_CRITICALITY;
  const pct = 100 - ((averageCriticality - MIN_CRITICALITY) / span) * 100;
  return Math.round(Math.max(0, Math.min(100, pct)));
}

export function readinessTone(readiness: number) {
  return readiness >= 70 ? "" : readiness >= 45 ? "warn" : "bad";
}

export function maturityLabel(score: number) {
  return maturityScale[score as keyof typeof maturityScale] ?? "Unknown";
}

export function impactLabel(score: number) {
  return impactScale[score as keyof typeof impactScale] ?? "Unknown";
}

const ASSESSMENT_STATUS_TONE: Record<string, Tone> = {
  draft: "ghost",
  researching: "info",
  scored: "good",
  reviewed: "good",
  finalized: "good",
  failed: "bad"
};

export function assessmentStatusTone(status: string): Tone {
  return ASSESSMENT_STATUS_TONE[status] ?? "neutral";
}

/** `.pill` takes no modifier for the neutral tone. */
export function pillClass(tone: Tone) {
  return tone === "neutral" ? "pill" : `pill ${tone}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric"
  });
}

export function formatRelative(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";

  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.round(hours / 24);
  if (days < 30) return `${days}d ago`;

  return formatDate(value);
}
