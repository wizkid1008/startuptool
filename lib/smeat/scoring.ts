import { z } from "zod";
import { findSubdimension } from "@/lib/smeat/model";

/**
 * Scales and formulas below are taken from `SMEAT Tool.xlsm`, which is the
 * source of truth. Both were previously wrong in this codebase: impact ran in
 * the opposite direction, and criticality used (maturity-1)*(5-impact).
 */

/** Functional maturity. 1 is the most developed, 4 the least. */
export const maturityScale = {
  1: "Advanced",
  2: "Developing",
  3: "Emerging",
  4: "Nascent"
} as const;

/**
 * Enterprise impact. 4 is the most critical — the reverse of maturity.
 * Wording condensed from the workbook's Instructions sheet.
 */
export const impactScale = {
  1: "Not Needed",
  2: "Not Critical",
  3: "Neutral",
  4: "Critical"
} as const;

/** Full impact definitions, verbatim from Instructions!B8:C11. */
export const impactDefinitions: Record<number, string> = {
  4: "This aspect of the business is critical to the success of the business",
  3: "This aspect of the business is of neutral importance to the success of the business",
  2: "This aspect of the business is not critical to the success of the business",
  1: "At this stage of the company this aspect of the business is not needed."
};

export const MIN_CRITICALITY = 1;
export const MAX_CRITICALITY = 16;

/**
 * Criticality = maturity x impact, per the workbook (e.g. Customer!G13 =
 * C13*E13). Range 1-16. A high score means an undeveloped capability that the
 * business critically needs.
 */
export function computeCriticalityScore(maturityScore: number, impactScore: number) {
  return maturityScore * impactScore;
}

function average(values: number[]) {
  if (values.length === 0) return null;
  return values.reduce((total, value) => total + value, 0) / values.length;
}

export type SegmentRollup = {
  maturity: number | null;
  impact: number | null;
  criticality: number | null;
  count: number;
};

/**
 * Segment totals, matching the workbook: maturity and impact are plain
 * averages of their subdimensions, and criticality is the rounded average of
 * the subdimension criticalities — not the product of the two averages.
 * See Customer!C3, D3 and E3 = ROUND(AVERAGE(E4:E7),0).
 */
export function rollUpSegment(
  rows: Array<{ maturity_score: number; impact_score: number; criticality_score?: number }>
): SegmentRollup {
  if (rows.length === 0) {
    return { maturity: null, impact: null, criticality: null, count: 0 };
  }

  const criticalities = rows.map((row) =>
    Number(row.criticality_score ?? computeCriticalityScore(row.maturity_score, row.impact_score))
  );
  const criticalityAverage = average(criticalities);

  return {
    maturity: average(rows.map((row) => row.maturity_score)),
    impact: average(rows.map((row) => row.impact_score)),
    criticality: criticalityAverage === null ? null : Math.round(criticalityAverage),
    count: rows.length
  };
}

export const scoreSchema = z.object({
  dimension_key: z.string().min(1),
  subdimension_key: z.string().min(1),
  maturity_score: z.number().int().min(1).max(4),
  impact_score: z.number().int().min(1).max(4),
  confidence: z.number().min(0).max(1).optional(),
  rationale: z.string().min(1),
  evidence: z
    .array(
      z.object({
        evidence_type: z.enum(["web", "document", "user_input", "model_inference"]),
        title: z.string().optional(),
        url: z.string().url().optional(),
        excerpt: z.string().optional(),
        confidence: z.number().min(0).max(1).optional()
      })
    )
    .default([])
});

export const agentScoreResponseSchema = z.object({
  company_name: z.string(),
  executive_summary: z.string(),
  scores: z.array(scoreSchema)
});

export type AgentScoreResponse = z.infer<typeof agentScoreResponseSchema>;

/**
 * A hallucinated key would persist and export fine but never render, since the
 * UI walks SMEAT_DIMENSIONS and looks scores up by key. Reject instead.
 */
export const canonicalScoreSchema = scoreSchema.superRefine((score, ctx) => {
  if (!findSubdimension(score.dimension_key, score.subdimension_key)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["subdimension_key"],
      message: `Unknown SMEAT key "${score.dimension_key}/${score.subdimension_key}"`
    });
  }
});

export const canonicalAgentScoreResponseSchema = agentScoreResponseSchema.extend({
  scores: z.array(canonicalScoreSchema)
});
