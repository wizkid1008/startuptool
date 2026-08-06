import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { requireEnv } from "@/lib/env";
import { SMEAT_DIMENSIONS } from "@/lib/smeat/model";
import { ALL_QUESTIONS, DISCOVERY_QUESTIONS, type DiscoverySet } from "@/lib/smeat/questions";
import { createServiceClient } from "@/lib/supabase/server";

export const DISCOVERY_MODEL = "claude-sonnet-5";

/**
 * One call per dimension rather than one for all ninety questions.
 *
 * The single-call version truncated: 90 answers with evidence exceeded 16k
 * output tokens and the whole run was lost. Seven calls of 8-15 questions each
 * are individually small enough to complete, and answers are written after
 * every dimension so a failure late in the run keeps everything before it.
 */
const MAX_TOKENS_PER_DIMENSION = 8000;

const QUESTION_INDEX = new Map(
  DISCOVERY_QUESTIONS.flatMap((set) =>
    set.questions.map((question) => [
      question.id,
      { dimension_key: set.dimension_key, subdimension_key: set.subdimension_key }
    ])
  )
);

const answerSchema = z.object({
  question_id: z.string().min(1),
  status: z.enum(["answered", "needs_input", "not_applicable"]),
  answer: z.string().optional(),
  evidence: z.string().optional(),
  confidence: z.number().min(0).max(1).optional(),
  suggested_level: z.number().int().min(1).max(4).optional()
});

const responseSchema = z.object({ answers: z.array(answerSchema) });

type Company = Record<string, unknown>;
type Document = {
  file_name: string;
  document_type?: string | null;
  parsed_text?: string | null;
};

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  return trimmed;
}

function buildPrompt(
  dimensionLabel: string,
  sets: DiscoverySet[],
  company: Company,
  documents: Document[]
) {
  const questions = sets.map((set) => ({
    subdimension: set.subdimension_key,
    questions: set.questions.map((question) => ({
      question_id: question.id,
      prompt: question.prompt,
      answer_at_each_level: question.listenFor
    }))
  }));

  return `You are running the discovery stage of a SMEAT enterprise assessment,
covering the ${dimensionLabel} dimension only.

Your job is NOT to score anything. It is to establish what is actually known
about this company, and to be explicit about what is not.

Company:
${JSON.stringify(company, null, 2)}

Source documents:
${JSON.stringify(
  documents.map((document) => ({
    file_name: document.file_name,
    document_type: document.document_type,
    excerpt: document.parsed_text?.slice(0, 12000) ?? null
  })),
  null,
  2
)}

Questions for ${dimensionLabel}:
${JSON.stringify(questions, null, 2)}

For every question, return one entry:

- status "answered" only when the company profile or a document genuinely
  supports an answer. Quote or paraphrase the supporting text in "evidence"
  and name the file it came from.
- status "needs_input" when the evidence does not settle it. This is the
  expected outcome for most questions when little has been uploaded, and it is
  far more useful than a plausible guess. Leave "answer" empty and use
  "evidence" to say what specifically would resolve it.
- status "not_applicable" only when the question genuinely cannot apply to this
  business. Explain why in "evidence".

"answer_at_each_level" tells you what an answer at each maturity level sounds
like. Use it to judge whether the evidence is specific enough to distinguish
between levels. If it only distinguishes "some" from "none", that is
needs_input, not answered.

"confidence" is 0 to 1 and reflects how well the evidence supports the answer.

"suggested_level" is 1 to 4 and is your read of which level the evidence points
to. Include it only when status is "answered".

Rules:
- Never invent facts, figures, or document contents.
- Do not infer from the industry or company stage what a company probably does.
  Absence of evidence is needs_input.
- Keep "answer" and "evidence" to one or two sentences each.
- Return every question_id listed above exactly once, and no others.

Return only valid JSON:
{
  "answers": [
    {
      "question_id": "${sets[0]?.questions[0]?.id ?? "example.id"}",
      "status": "needs_input",
      "evidence": "what would resolve this",
      "confidence": 0.2
    }
  ]
}`;
}

/**
 * Runs discovery and persists the answers, one dimension at a time.
 *
 * Dispatched rather than awaited — see ./run-scoring. Uses the service-role
 * client because the response has already been sent; authorization happened
 * before dispatch.
 */
export async function runDiscovery(assessmentId: string, runId: string | null) {
  const supabase = createServiceClient();

  const progress = async (payload: Record<string, unknown>) => {
    if (!runId) return;
    await supabase.from("agent_runs").update({ output_payload: payload }).eq("id", runId);
  };

  try {
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select("id,company_id")
      .eq("id", assessmentId)
      .single();

    if (assessmentError || !assessment) {
      throw new Error(assessmentError?.message ?? "Assessment not found");
    }

    const { data: company, error: companyError } = await supabase
      .from("companies")
      .select("name,website,industry,stage,geography,employee_count_range,description")
      .eq("id", assessment.company_id)
      .single();

    if (companyError || !company) {
      throw new Error(companyError?.message ?? "Company not found");
    }

    const { data: documents } = await supabase
      .from("company_documents")
      .select("file_name,document_type,parsed_text")
      .eq("company_id", assessment.company_id);

    // A person's answer is never overwritten by a run.
    const { data: manual } = await supabase
      .from("assessment_answers")
      .select("question_id")
      .eq("assessment_id", assessmentId)
      .eq("source", "manual");

    const protectedIds = new Set((manual ?? []).map((row) => row.question_id));

    const client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });

    let answered = 0;
    let needsInput = 0;
    let written = 0;
    const failures: string[] = [];

    for (const [index, dimension] of SMEAT_DIMENSIONS.entries()) {
      const sets = DISCOVERY_QUESTIONS.filter((set) => set.dimension_key === dimension.key);
      if (sets.length === 0) continue;

      await progress({
        stage: dimension.label,
        completed_dimensions: index,
        total_dimensions: SMEAT_DIMENSIONS.length,
        answered,
        needs_input: needsInput
      });

      try {
        const response = await client.messages.create({
          model: DISCOVERY_MODEL,
          max_tokens: MAX_TOKENS_PER_DIMENSION,
          messages: [
            {
              role: "user",
              content: buildPrompt(dimension.label, sets, company, documents ?? [])
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

        const rows = validated.answers
          .filter((answer) => QUESTION_INDEX.has(answer.question_id))
          .filter((answer) => !protectedIds.has(answer.question_id))
          .map((answer) => {
            const location = QUESTION_INDEX.get(answer.question_id)!;
            return {
              assessment_id: assessmentId,
              dimension_key: location.dimension_key,
              subdimension_key: location.subdimension_key,
              question_id: answer.question_id,
              answer: answer.status === "answered" ? (answer.answer ?? null) : null,
              status: answer.status,
              source: "ai",
              confidence: answer.confidence ?? null,
              evidence: answer.evidence ?? null,
              suggested_level: answer.suggested_level ?? null
            };
          });

        if (rows.length > 0) {
          const { error: upsertError } = await supabase
            .from("assessment_answers")
            .upsert(rows, { onConflict: "assessment_id,question_id" });

          if (upsertError) {
            throw new Error(upsertError.message);
          }

          written += rows.length;
          answered += rows.filter((row) => row.status === "answered").length;
          needsInput += rows.filter((row) => row.status === "needs_input").length;
        }
      } catch (error) {
        // One dimension failing must not discard the six that worked.
        const message = error instanceof Error ? error.message : "unknown error";
        failures.push(`${dimension.label}: ${message}`);
      }
    }

    if (written === 0) {
      throw new Error(
        failures.length > 0
          ? `Every dimension failed. ${failures.join("; ")}`
          : "The model returned no recognisable answers"
      );
    }

    if (runId) {
      await supabase
        .from("agent_runs")
        .update({
          // Partial completion is recorded as failed so the page says so, but
          // the answers that did land are already saved.
          status: failures.length === 0 ? "succeeded" : "failed",
          error:
            failures.length === 0
              ? null
              : `${failures.length} of ${SMEAT_DIMENSIONS.length} dimensions failed — ${failures.join("; ")}`,
          output_payload: {
            answered,
            needs_input: needsInput,
            written,
            total: ALL_QUESTIONS.length,
            skipped_manual: protectedIds.size,
            failed_dimensions: failures
          },
          completed_at: new Date().toISOString()
        })
        .eq("id", runId);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown discovery error";

    if (runId) {
      await supabase
        .from("agent_runs")
        .update({ status: "failed", error: message, completed_at: new Date().toISOString() })
        .eq("id", runId);
    }
  }
}
