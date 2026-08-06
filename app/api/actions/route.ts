import { z } from "zod";
import { failurePage, formatIssues, seeOther } from "@/lib/http";
import { createSessionClient } from "@/lib/supabase/server";

const ACTION_STATUSES = ["open", "in_progress", "done", "dropped"] as const;

const createSchema = z.object({
  intent: z.literal("create"),
  assessment_id: z.string().uuid(),
  assessment_score_id: z.string().uuid().optional(),
  dimension_key: z.string().trim().max(64).optional(),
  subdimension_key: z.string().trim().max(64).optional(),
  title: z.string().trim().min(1, "An action needs a title").max(300),
  owner: z.string().trim().max(120).optional(),
  due_date: z.string().trim().optional()
});

const updateSchema = z.object({
  intent: z.literal("update"),
  action_id: z.string().uuid(),
  status: z.enum(ACTION_STATUSES)
});

const deleteSchema = z.object({
  intent: z.literal("delete"),
  action_id: z.string().uuid()
});

const schema = z.discriminatedUnion("intent", [createSchema, updateSchema, deleteSchema]);

export async function POST(request: Request) {
  const formData = await request.formData();
  const raw = Object.fromEntries(formData.entries());
  const parsed = schema.safeParse(raw);

  if (!parsed.success) {
    return failurePage({
      title: "That action could not be saved.",
      detail: formatIssues(parsed.error),
      backHref: "/assessments",
      backLabel: "Back to assessments"
    });
  }

  const supabase = await createSessionClient();

  // Row-level security scopes every one of these to the caller's organization,
  // so no separate ownership check is needed.
  if (parsed.data.intent === "create") {
    const { error } = await supabase.from("assessment_actions").insert({
      assessment_id: parsed.data.assessment_id,
      assessment_score_id: parsed.data.assessment_score_id ?? null,
      dimension_key: parsed.data.dimension_key ?? null,
      subdimension_key: parsed.data.subdimension_key ?? null,
      title: parsed.data.title,
      owner: parsed.data.owner || null,
      due_date: parsed.data.due_date || null
    });

    if (error) {
      return failurePage({
        title: "That action could not be created.",
        detail: error.message,
        backHref: `/assessments/${parsed.data.assessment_id}`,
        backLabel: "Back to assessment",
        status: 500
      });
    }

    return seeOther(`/assessments/${parsed.data.assessment_id}`, request);
  }

  const table = supabase.from("assessment_actions");
  const { data, error } =
    parsed.data.intent === "update"
      ? await table
          .update({ status: parsed.data.status })
          .eq("id", parsed.data.action_id)
          .select("assessment_id")
          .single()
      : await table
          .delete()
          .eq("id", parsed.data.action_id)
          .select("assessment_id")
          .single();

  if (error || !data) {
    return failurePage({
      title: "That action could not be updated.",
      detail: error?.message ?? "The action was not found, or you do not have access to it.",
      backHref: "/assessments",
      backLabel: "Back to assessments",
      status: error ? 500 : 404
    });
  }

  return seeOther(`/assessments/${data.assessment_id}`, request);
}
