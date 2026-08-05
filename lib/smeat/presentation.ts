import { impactScale, maturityScale } from "@/lib/smeat/scoring";

export type Tone = "good" | "warn" | "bad" | "info" | "ghost" | "neutral";

/** Maturity: 1 Advanced (strong) … 4 Nascent (weak). */
export function maturityTone(score: number): Tone {
  if (score <= 1) return "good";
  if (score === 2) return "info";
  if (score === 3) return "warn";
  return "bad";
}

/** Impact: 1 Critical (urgent) … 4 Not Needed. */
export function impactTone(score: number): Tone {
  if (score <= 1) return "bad";
  if (score === 2) return "warn";
  if (score === 3) return "neutral";
  return "ghost";
}

/**
 * Opportunity runs 0–12. A high score means a weak capability the business
 * critically needs, so it reads as a gap, not an achievement.
 */
export function opportunityTone(score: number): Tone {
  if (score >= 8) return "bad";
  if (score >= 4) return "warn";
  if (score >= 1) return "info";
  return "neutral";
}

export function opportunityBand(score: number) {
  if (score >= 8) return "Critical";
  if (score >= 4) return "Elevated";
  if (score >= 1) return "Minor";
  return "None";
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
