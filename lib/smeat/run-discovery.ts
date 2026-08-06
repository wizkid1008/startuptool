import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { requireEnv } from "@/lib/env";
import { ALL_QUESTIONS, DISCOVERY_QUESTIONS } from "@/lib/smeat/questions";
import { createServiceClient } from "@/lib/supabase/server";

export const DISCOVERY_MODEL = "claude-sonnet-5";

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

const responseSchema = z.object({
  answers: z.array(answerSchema)
});

function extractJson(text: string) {
  const trimmed = text.trim();
  if (trimmed.startsWith("```")) {
    return trimmed.replace(/^```(?:json)?\s*/, "").replace(/\s*```$/, "");
  }
  return trimmed;
}

function buildDiscoveryPrompt(
  company: Record<string, unknown>,
  documents: Array<{ file_name: string; document_type?: string | null; parsed_text?: string | null }>
) {
  const questions = DISCOVERY_QUESTIONS.map((set) => ({
    dimension: set.dimension_key,
    subdimension: set.subdimension_key,
    questions: set.questions.map((question) => ({
      question_id: question.id,
      prompt: question.prompt,
      answer_at_each_level: question.listenFor
    }))
  }));

  return `You are running the discovery stage of a SMEAT enterprise assessment.

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

Questions:
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
  business — for example impact questions for a company with no stated impact
  purpose. Explain why in "evidence".

"answer_at_each_level" tells you what an answer at each maturity level sounds
like. Use it to judge whether the evidence is specific enough to distinguish
between levels. If it only distinguishes "some" from "none", that is
needs_input, not answered.

"confidence" is 0 to 1 and reflects how well the evidence supports the answer.

"suggested_level" is 1 to 4 and is your read of which level the evidence points
to, using "answer_at_each_level". Include it only when status is "answered" —
it is shown to a reviewer as your read, next to their own choice, and must not
appear where you have no basis for it.

Rules:
- Never invent facts, figures, or document contents.
- Do not infer from the industry or company stage what a company probably does.
  Absence of evidence is needs_input.
- Return every question_id exactly once.

Return only valid JSON:
{
  "answers": [
    {
      "question_id": "customer.products_markets_channels.segmentation",
      "status": "answered",
      "answer": "concise statement of what is true",
      "evidence": "what supports it, and from where",
      "confidence": 0.7,
      "suggested_level": 3
    }
  ]
}`;
}

/**
 * Runs the discovery pass and persists the answers.
 *
 * Dispatched rather than awaited, for the same reason as scoring — see
 * ./run-scoring. Uses the service-role client because the response has already
 * been sent; authorization happened before dispatch.
 */
export async function runDiscovery(assessmentId: string, runId: string | null) {
  const supabase = createServiceClient();

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

    const client = new Anthropic({ apiKey: requireEnv("ANTHROPIC_API_KEY") });
    const response = await client.messages.create({
      model: DISCOVERY_MODEL,
      max_tokens: 16000,
      messages: [
        { role: "user", content: buildDiscoveryPrompt(company, documents ?? []) }
      ]
    });

    if (response.stop_reason === "max_tokens") {
      throw new Error(
        "The model hit its output limit before answering every question. Raise max_tokens."
      );
    }

    const text = response.content.map((block) => ("text" in block ? block.text : "")).join("");
    const validated = responseSchema.parse(JSON.parse(extractJson(text)));

    // Keep only known question ids — a hallucinated one would otherwise be
    // stored and never rendered, since the UI walks the canonical list.
    const rows = validated.answers
      .filter((answer) => QUESTION_INDEX.has(answer.question_id))
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

    if (rows.length === 0) {
      throw new Error("The model returned no recognisable answers");
    }

    // Upsert rather than replace, so a human answer is not silently discarded
    // by a later discovery run. Existing manual answers are protected below.
    const { data: manual } = await supabase
      .from("assessment_answers")
      .select("question_id")
      .eq("assessment_id", assessmentId)
      .eq("source", "manual");

    const protectedIds = new Set((manual ?? []).map((row) => row.question_id));
    const writable = rows.filter((row) => !protectedIds.has(row.question_id));

    if (writable.length > 0) {
      const { error: upsertError } = await supabase
        .from("assessment_answers")
        .upsert(writable, { onConflict: "assessment_id,question_id" });

      if (upsertError) {
        throw new Error(upsertError.message);
      }
    }

    const needsInput = rows.filter((row) => row.status === "needs_input").length;

    if (runId) {
      await supabase
        .from("agent_runs")
        .update({
          status: "succeeded",
          output_payload: {
            answered: rows.length - needsInput,
            needs_input: needsInput,
            total: ALL_QUESTIONS.length,
            skipped_manual: protectedIds.size
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
