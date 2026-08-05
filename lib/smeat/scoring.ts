import { z } from "zod";
import { findSubdimension } from "@/lib/smeat/model";

export const maturityScale = {
  1: "Advanced",
  2: "Developing",
  3: "Emerging",
  4: "Nascent"
} as const;

export const impactScale = {
  1: "Critical",
  2: "Important",
  3: "Low",
  4: "Not Needed"
} as const;

export function computeOpportunityScore(maturityScore: number, impactScore: number) {
  const maturityGap = maturityScore - 1;
  const impactWeight = 5 - impactScore;
  return maturityGap * impactWeight;
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

export type AgentScoreResponse = z.infer<typeof agentScoreResponseSchema>;
