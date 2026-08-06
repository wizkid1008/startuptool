import { z } from "zod";
import { failurePage, formatIssues, seeOther } from "@/lib/http";
import {
  checkRunLimit,
  formatWait,
  RUN_WINDOW_HOURS
} from "@/lib/smeat/rate-limit";
import { isStaleRun, runScoring, SCORING_MODEL } from "@/lib/smeat/run-scoring";
import { createSessionClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  assessment_id: z.string().uuid("A valid assessment is required")
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = requestSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return failurePage({
      title: "That scoring run could not be started.",
      detail: formatIssues(parsed.error),
      backHref: "/assessments",
      backLabel: "Back to assessments"
    });
  }

  const assessmentId = parsed.data.assessment_id;
  const back = `/assessments/${assessmentId}`;
  const supabase = await createSessionClient();

  // Authorize before dispatching. RLS scopes this to the caller's
  // organization, so a missing row means no access as much as no record.
  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("id,status")
    .eq("id", assessmentId)
    .single();

  if (assessmentError || !assessment) {
    return failurePage({
      title: "That assessment was not found.",
      detail: assessmentError?.message,
      backHref: "/assessments",
      backLabel: "Back to assessments",
      status: 404
    });
  }

  // Block a concurrent run, but not one that died with the process — otherwise
  // a restart mid-run leaves the assessment permanently unrunnable.
  if (assessment.status === "researching") {
    const { data: latestRun } = await supabase
      .from("agent_runs")
      .select("status,created_at")
      .eq("assessment_id", assessmentId)
      .eq("run_type", "scoring")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    const abandoned = !latestRun || isStaleRun(latestRun.created_at);

    if (!abandoned) {
      return failurePage({
        title: "A scoring run is already in progress.",
        detail: "Wait for it to finish, or reload the assessment to see its status.",
        backHref: back,
        backLabel: "Back to assessment",
        status: 409
      });
    }
  }

  const limit = await checkRunLimit(supabase, assessmentId, "scoring");
  if (!limit.allowed) {
    return failurePage({
      title: "Already scored today.",
      detail: `Scoring runs once per assessment per ${RUN_WINDOW_HOURS} hours. The last run started ${limit.lastRunAt.toLocaleString()}; the next is available in ${formatWait(limit.nextAllowedAt)}. Editing scores by hand is unaffected.`,
      backHref: back,
      backLabel: "Back to assessment",
      status: 429
    });
  }

  const { data: run } = await supabase
    .from("agent_runs")
    .insert({
      assessment_id: assessmentId,
      run_type: "scoring",
      status: "running",
      model_provider: "anthropic",
      model_name: SCORING_MODEL
    })
    .select("id")
    .single();

  await supabase
    .from("assessments")
    .update({ status: "researching", model_provider: "anthropic", model_name: SCORING_MODEL })
    .eq("id", assessmentId);

  // Dispatched, not awaited. The call takes minutes; holding the POST open
  // that long leaves the browser on a blank request with no way to show
  // progress. Status lands in the database, and the assessment page polls it.
  void runScoring(assessmentId, run?.id ?? null);

  return seeOther(back, request);
}
