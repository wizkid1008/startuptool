import { z } from "zod";

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

export type AgentScoreResponse = z.infer<typeof agentScoreResponseSchema>;
