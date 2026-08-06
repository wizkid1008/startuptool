import { z } from "zod";
import { failurePage, formatIssues, seeOther } from "@/lib/http";
import { checkRunLimit, formatWait, RUN_WINDOW_HOURS } from "@/lib/smeat/rate-limit";
import { ACTIONS_MODEL, runActionProposals } from "@/lib/smeat/run-actions";
import { isStaleRun } from "@/lib/smeat/run-scoring";
import { createSessionClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  assessment_id: z.string().uuid("A valid assessment is required")
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = requestSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return failurePage({
      title: "That run could not be started.",
      detail: formatIssues(parsed.error),
      backHref: "/assessments",
      backLabel: "Back to assessments"
    });
  }

  const assessmentId = parsed.data.assessment_id;
  const back = `/assessments/${assessmentId}/plan`;
  const supabase = await createSessionClient();

  const { data: assessment, error } = await supabase
    .from("assessments")
    .select("id")
    .eq("id", assessmentId)
    .single();

  if (error || !assessment) {
    return failurePage({
      title: "That assessment was not found.",
      detail: error?.message,
      backHref: "/assessments",
      backLabel: "Back to assessments",
      status: 404
    });
  }

  const { data: latestRun } = await supabase
    .from("agent_runs")
    .select("status,created_at")
    .eq("assessment_id", assessmentId)
    .eq("run_type", "analysis")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestRun?.status === "running" && !isStaleRun(latestRun.created_at)) {
    return failurePage({
      title: "A proposal run is already in progress.",
      detail: "Wait for it to finish, or reload the page to see its status.",
      backHref: back,
      backLabel: "Back to plan",
      status: 409
    });
  }

  const limit = await checkRunLimit(supabase, assessmentId, "analysis");
  if (!limit.allowed) {
    return failurePage({
      title: "Actions already proposed today.",
      detail: `Proposals run once per assessment per ${RUN_WINDOW_HOURS} hours. The last run started ${limit.lastRunAt.toLocaleString()}; the next is available in ${formatWait(limit.nextAllowedAt)}. Adding and editing actions by hand is unaffected.`,
      backHref: back,
      backLabel: "Back to plan",
      status: 429
    });
  }

  const { data: run } = await supabase
    .from("agent_runs")
    .insert({
      assessment_id: assessmentId,
      run_type: "analysis",
      status: "running",
      model_provider: "anthropic",
      model_name: ACTIONS_MODEL
    })
    .select("id")
    .single();

  void runActionProposals(assessmentId, run?.id ?? null);

  return seeOther(back, request);
}
