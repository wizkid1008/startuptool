import { z } from "zod";
import { failurePage, formatIssues, seeOther } from "@/lib/http";
import { PLANNED_ONLY } from "@/lib/smeat/actions";
import { proposeSchedule, today } from "@/lib/smeat/schedule";
import { createSessionClient } from "@/lib/supabase/server";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

const proposeRequest = z.object({
  intent: z.literal("propose"),
  assessment_id: z.string().uuid(),
  from: z.string().regex(DAY).optional()
});

/** One row's dates, edited by hand after the proposal. */
const setRequest = z.object({
  intent: z.literal("set"),
  action_id: z.string().uuid(),
  start_date: z.union([z.literal(""), z.string().regex(DAY, "Use YYYY-MM-DD")]).optional(),
  end_date: z.union([z.literal(""), z.string().regex(DAY, "Use YYYY-MM-DD")]).optional()
});

const schema = z.discriminatedUnion("intent", [proposeRequest, setRequest]);

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));
  const wantsJson = request.headers.get("accept")?.includes("application/json");

  if (!parsed.success) {
    const detail = formatIssues(parsed.error);
    if (wantsJson) return Response.json({ ok: false, error: detail }, { status: 400 });

    return failurePage({
      title: "That schedule could not be saved.",
      detail,
      backHref: "/assessments",
      backLabel: "Back to assessments"
    });
  }

  const supabase = await createSessionClient();

  if (parsed.data.intent === "set") {
    const { data, error } = await supabase
      .from("assessment_actions")
      .update({
        start_date: parsed.data.start_date || null,
        end_date: parsed.data.end_date || null
      })
      .eq("id", parsed.data.action_id)
      .select("assessment_id")
      .single();

    if (error || !data) {
      const detail = error?.message ?? "That action was not found.";
      if (wantsJson) return Response.json({ ok: false, error: detail }, { status: 500 });

      return failurePage({
        title: "That date could not be saved.",
        detail,
        backHref: "/assessments",
        backLabel: "Back to assessments",
        status: 500
      });
    }

    if (wantsJson) return Response.json({ ok: true });
    return seeOther(`/assessments/${data.assessment_id}/plan`, request);
  }

  const assessmentId = parsed.data.assessment_id;
  const back = `/assessments/${assessmentId}/plan`;

  // Only real plan items get scheduled. An unaccepted proposal has not been
  // agreed to, so putting it on a timeline would overstate the commitment.
  const { data: actions, error: actionsError } = await supabase
    .from("assessment_actions")
    .select("id,owner,status,dimension_key,subdimension_key,source,accepted_at")
    .eq("assessment_id", assessmentId)
    .or(PLANNED_ONLY)
    .in("status", ["open", "in_progress"]);

  if (actionsError) {
    return failurePage({
      title: "That schedule could not be built.",
      detail: actionsError.message,
      backHref: back,
      backLabel: "Back to plan",
      status: 500
    });
  }

  if (!actions || actions.length === 0) {
    return failurePage({
      title: "There is nothing to schedule.",
      detail:
        "Accept a proposal or add an action first. Completed and dropped actions are left out.",
      backHref: back,
      backLabel: "Back to plan",
      status: 400
    });
  }

  const { data: scores } = await supabase
    .from("assessment_scores")
    .select("dimension_key,subdimension_key,effort_score,priority_score")
    .eq("assessment_id", assessmentId);

  const byKey = new Map(
    (scores ?? []).map((score) => [
      `${score.dimension_key}:${score.subdimension_key}`,
      score
    ])
  );

  const dates = proposeSchedule(
    actions.map((action) => {
      const score = byKey.get(`${action.dimension_key}:${action.subdimension_key}`);
      return {
        id: action.id,
        owner: action.owner,
        priority: score?.priority_score === null ? null : Number(score?.priority_score ?? 0),
        effort: score?.effort_score ?? null
      };
    }),
    parsed.data.from ?? today()
  );

  // Supabase has no multi-row update with differing values, and upsert would
  // need every not-null column restated. A handful of updates is fine for the
  // row counts involved here.
  const results = await Promise.all(
    dates.map((row) =>
      supabase
        .from("assessment_actions")
        .update({ start_date: row.start_date, end_date: row.end_date })
        .eq("id", row.id)
    )
  );

  const failure = results.find((result) => result.error);
  if (failure?.error) {
    return failurePage({
      title: "The schedule was only partly written.",
      detail: failure.error.message,
      backHref: back,
      backLabel: "Back to plan",
      status: 500
    });
  }

  return seeOther(back, request);
}
