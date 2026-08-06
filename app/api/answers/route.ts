import { z } from "zod";
import { failurePage, formatIssues, seeOther } from "@/lib/http";
import { createSessionClient } from "@/lib/supabase/server";

const schema = z.object({
  assessment_id: z.string().uuid(),
  dimension_key: z.string().trim().min(1).max(64),
  subdimension_key: z.string().trim().min(1).max(64),
  question_id: z.string().trim().min(1).max(200),
  answer: z.string().trim().max(4000).optional(),
  // No radio chosen arrives as absent; an explicit "" clears it.
  selected_level: z
    .union([z.literal(""), z.coerce.number().int().min(1).max(4)])
    .optional()
    .transform((value) => (value === "" || value === undefined ? null : value)),
  status: z.enum(["answered", "needs_input", "not_applicable"])
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return failurePage({
      title: "That answer could not be saved.",
      detail: formatIssues(parsed.error),
      backHref: "/assessments",
      backLabel: "Back to assessments"
    });
  }

  const supabase = await createSessionClient();

  // Marked manual so a later discovery run leaves it alone — see runDiscovery,
  // which skips question ids already answered by a person.
  const { error } = await supabase.from("assessment_answers").upsert(
    {
      assessment_id: parsed.data.assessment_id,
      dimension_key: parsed.data.dimension_key,
      subdimension_key: parsed.data.subdimension_key,
      question_id: parsed.data.question_id,
      answer: parsed.data.answer || null,
      selected_level: parsed.data.selected_level,
      // Either a chosen level or written detail counts as answered — a level
      // on its own is a complete answer to most of these.
      status:
        parsed.data.answer || parsed.data.selected_level !== null
          ? "answered"
          : parsed.data.status,
      source: "manual",
      confidence: null,
      evidence: null
    },
    { onConflict: "assessment_id,question_id" }
  );

  if (error) {
    return failurePage({
      title: "That answer could not be saved.",
      detail: error.message,
      backHref: `/assessments/${parsed.data.assessment_id}/discovery`,
      backLabel: "Back to discovery",
      status: 500
    });
  }

  return seeOther(`/assessments/${parsed.data.assessment_id}/discovery`, request);
}
