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

/** Turns an agent proposal into part of the plan. */
const acceptSchema = z.object({
  intent: z.literal("accept"),
  action_id: z.string().uuid()
});

const schema = z.discriminatedUnion("intent", [
  createSchema,
  updateSchema,
  deleteSchema,
  acceptSchema
]);

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
    // The Plan page picks a subdimension by score id alone. Derive the keys
    // from it so they survive a re-score, which nulls assessment_score_id.
    let dimensionKey = parsed.data.dimension_key ?? null;
    let subdimensionKey = parsed.data.subdimension_key ?? null;

    if (parsed.data.assessment_score_id && (!dimensionKey || !subdimensionKey)) {
      const { data: score } = await supabase
        .from("assessment_scores")
        .select("dimension_key,subdimension_key")
        .eq("id", parsed.data.assessment_score_id)
        .single();

      dimensionKey = score?.dimension_key ?? null;
      subdimensionKey = score?.subdimension_key ?? null;
    }

    const { error } = await supabase.from("assessment_actions").insert({
      assessment_id: parsed.data.assessment_id,
      assessment_score_id: parsed.data.assessment_score_id ?? null,
      dimension_key: dimensionKey,
      subdimension_key: subdimensionKey,
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

    return seeOther(`/assessments/${parsed.data.assessment_id}/plan`, request);
  }

  const table = supabase.from("assessment_actions");

  const { data, error } =
    parsed.data.intent === "update"
      ? await table
          .update({ status: parsed.data.status })
          .eq("id", parsed.data.action_id)
          .select("assessment_id")
          .single()
      : parsed.data.intent === "accept"
        ? await table
            // Stamping accepted_at moves it into the working list and stops a
            // later proposal run from clearing it.
            .update({ accepted_at: new Date().toISOString() })
            .eq("id", parsed.data.action_id)
            .select("assessment_id")
            .single()
        : await table
            .delete()
            .eq("id", parsed.data.action_id)
            .select("assessment_id")
            .single();

  // The proposal list acts in the background via fetch; a plain form post still
  // redirects, so the page works with JavaScript disabled.
  const wantsJson = request.headers.get("accept")?.includes("application/json");

  if (error || !data) {
    const detail =
      error?.message ?? "The action was not found, or you do not have access to it.";
    const status = error ? 500 : 404;

    if (wantsJson) {
      return Response.json({ ok: false, error: detail }, { status });
    }

    return failurePage({
      title: "That action could not be updated.",
      detail,
      backHref: "/assessments",
      backLabel: "Back to assessments",
      status
    });
  }

  if (wantsJson) {
    return Response.json({ ok: true });
  }

  return seeOther(`/assessments/${data.assessment_id}/plan`, request);
}
