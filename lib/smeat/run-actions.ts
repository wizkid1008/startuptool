import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { requireEnv } from "@/lib/env";
import { ACTION_CRITICALITY_FLOOR } from "@/lib/smeat/actions";
import { effortScale } from "@/lib/smeat/effort";
import { SMEAT_DIMENSIONS, findSubdimension } from "@/lib/smeat/model";
import { impactLabel, maturityLabel } from "@/lib/smeat/presentation";
import { rubricFor } from "@/lib/smeat/rubric";
import { createServiceClient } from "@/lib/supabase/server";

export const ACTIONS_MODEL = "claude-sonnet-5";

const MAX_TOKENS_PER_DIMENSION = 6000;

const proposalSchema = z.object({
  subdimension_key: z.string().min(1),
  title: z.string().min(1).max(300),
  rationale: z.string().min(1),
  suggested_effort: z.number().int().min(1).max(4).optional()
});

const responseSchema = z.object({ actions: z.array(proposalSchema) });

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  return trimmed;
}

type ScoreRow = {
  id: string;
  dimension_key: string;
  subdimension_key: string;
  maturity_score: number;
  impact_score: number;
  criticality_score: number;
  rationale: string | null;
  reviewer_note: string | null;
};

/**
 * The rubric already describes the target.
 *
 * A subdimension at maturity 3 has its destination written down: the level 2
 * definition. So a proposal is not invention — it is "what closes the distance
 * between these two paragraphs", which is a far better basis than asking a
 * model to think of something useful.
 */
function buildPrompt(
  dimensionLabel: string,
  rows: ScoreRow[],
  answers: Array<{ subdimension_key: string; answer: string | null; question_id: string }>
) {
  const items = rows.map((row) => {
    const rubric = rubricFor(row.dimension_key, row.subdimension_key);
    const target = Math.max(1, row.maturity_score - 1);

    return {
      subdimension_key: row.subdimension_key,
      subdimension: findSubdimension(row.dimension_key, row.subdimension_key)?.label,
      current_level: `${row.maturity_score} (${maturityLabel(row.maturity_score)})`,
      current_state: rubric?.levels.find((l) => l.level === row.maturity_score)?.bullets ?? [],
      target_level: `${target} (${maturityLabel(target)})`,
      target_state: rubric?.levels.find((l) => l.level === target)?.bullets ?? [],
      impact: `${row.impact_score} (${impactLabel(row.impact_score)})`,
      criticality: Number(row.criticality_score),
      agent_rationale: row.rationale,
      reviewer_note: row.reviewer_note,
      what_we_learned: answers
        .filter((answer) => answer.subdimension_key === row.subdimension_key && answer.answer)
        .map((answer) => answer.answer)
    };
  });

  return `You are proposing actions for the ${dimensionLabel} dimension of a
SMEAT enterprise assessment.

Each item below has a current state and a target state, both taken verbatim
from the assessment rubric. Your job is to propose the concrete work that moves
the business from the first to the second. You are not inventing goals — the
target is already written down.

${JSON.stringify(items, null, 2)}

For each subdimension propose one to three actions. An action must:

- Name something a person could start on Monday. "Improve pricing" is not an
  action; "Set list prices per customer segment using the last 12 months of
  deal data" is.
- Close a specific part of the distance between current_state and
  target_state. Say which part in the rationale.
- Be grounded in what_we_learned where there is anything there. Do not
  contradict it, and do not assume facts it does not contain.
- Suit the company's stage. A seed-stage business does not need a governance
  committee.

suggested_effort is 1 to 4 for the work you are proposing:
${JSON.stringify(
  Object.fromEntries(
    ([1, 2, 3, 4] as const).map((level) => [level, effortScale[level].definition])
  ),
  null,
  2
)}

Return only valid JSON:
{
  "actions": [
    {
      "subdimension_key": "${rows[0]?.subdimension_key ?? "example"}",
      "title": "the thing to do",
      "rationale": "which part of the gap this closes, and why now",
      "suggested_effort": 2
    }
  ]
}`;
}

/**
 * Proposes actions for the subdimensions that matter, one dimension at a time.
 *
 * Split per dimension for the same reason as discovery: a single call for
 * everything truncated and lost the lot. Dispatched rather than awaited — see
 * ./run-scoring.
 */
export async function runActionProposals(assessmentId: string, runId: string | null) {
  const supabase = createServiceClient();

  try {
    const { data: scores, error: scoresError } = await supabase
      .from("assessment_scores")
      .select(
        "id,dimension_key,subdimension_key,maturity_score,impact_score,criticality_score,rationale,reviewer_note"
      )
      .eq("assessment_id", assessmentId)
      .gte("criticality_score", ACTION_CRITICALITY_FLOOR);

    if (scoresError) {
      throw new Error(scoresError.message);
    }

    if (!scores || scores.length === 0) {
      throw new Error(
        `No subdimension scores at or above criticality ${ACTION_CRITICALITY_FLOOR}. Score the assessment first.`
      );
    }

    const { data: answers } = await supabase
      .from("assessment_answers")
      .select("subdimension_key,question_id,answer")
      .eq("assessment_id", assessmentId)
      .eq("status", "answered");

    // Replace previous proposals, but never anything a person wrote or has
    // already accepted.
    await supabase
      .from("assessment_actions")
      .delete()
      .eq("assessment_id", assessmentId)
      .eq("source", "ai")
      .is("accepted_at", null);

    const scoreIdByKey = new Map(scores.map((row) => [row.subdimension_key, row.id]));
    const client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });

    let proposed = 0;
    const failures: string[] = [];

    for (const dimension of SMEAT_DIMENSIONS) {
      const rows = scores.filter((row) => row.dimension_key === dimension.key);
      if (rows.length === 0) continue;

      try {
        const response = await client.messages.create({
          model: ACTIONS_MODEL,
          max_tokens: MAX_TOKENS_PER_DIMENSION,
          messages: [
            {
              role: "user",
              content: buildPrompt(dimension.label, rows, answers ?? [])
            }
          ]
        });

        if (response.stop_reason === "max_tokens") {
          throw new Error("output limit reached");
        }

        const text = response.content
          .map((block) => ("text" in block ? block.text : ""))
          .join("");
        const validated = responseSchema.parse(JSON.parse(extractJson(text)));

        const inserts = validated.actions
          .filter((action) => scoreIdByKey.has(action.subdimension_key))
          .map((action) => ({
            assessment_id: assessmentId,
            assessment_score_id: scoreIdByKey.get(action.subdimension_key) ?? null,
            dimension_key: dimension.key,
            subdimension_key: action.subdimension_key,
            title: action.title,
            detail: action.suggested_effort
              ? `Suggested effort: ${action.suggested_effort} · ${effortScale[action.suggested_effort as 1 | 2 | 3 | 4].label}`
              : null,
            rationale: action.rationale,
            source: "ai",
            status: "open"
          }));

        if (inserts.length > 0) {
          const { error } = await supabase.from("assessment_actions").insert(inserts);
          if (error) throw new Error(error.message);
          proposed += inserts.length;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "unknown error";
        failures.push(`${dimension.label}: ${message}`);
      }
    }

    if (proposed === 0) {
      throw new Error(
        failures.length > 0
          ? `No actions proposed. ${failures.join("; ")}`
          : "The model returned no usable proposals"
      );
    }

    if (runId) {
      await supabase
        .from("agent_runs")
        .update({
          status: failures.length === 0 ? "succeeded" : "failed",
          error:
            failures.length === 0
              ? null
              : `${failures.length} dimensions failed — ${failures.join("; ")}`,
          output_payload: { proposed, considered: scores.length, failed: failures },
          completed_at: new Date().toISOString()
        })
        .eq("id", runId);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown proposal error";

    if (runId) {
      await supabase
        .from("agent_runs")
        .update({ status: "failed", error: message, completed_at: new Date().toISOString() })
        .eq("id", runId);
    }
  }
}
