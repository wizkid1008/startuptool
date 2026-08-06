import { z } from "zod";
import { failurePage, formatIssues, seeOther } from "@/lib/http";
import { DISCOVERY_MODEL, runDiscovery } from "@/lib/smeat/run-discovery";
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
      title: "That discovery run could not be started.",
      detail: formatIssues(parsed.error),
      backHref: "/assessments",
      backLabel: "Back to assessments"
    });
  }

  const assessmentId = parsed.data.assessment_id;
  const back = `/assessments/${assessmentId}/discovery`;
  const supabase = await createSessionClient();

  // Authorize before dispatching. RLS scopes this to the caller's
  // organization, so a missing row means no access as much as no record.
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
    .eq("run_type", "research")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestRun?.status === "running" && !isStaleRun(latestRun.created_at)) {
    return failurePage({
      title: "A discovery run is already in progress.",
      detail: "Wait for it to finish, or reload the page to see its status.",
      backHref: back,
      backLabel: "Back to discovery",
      status: 409
    });
  }

  const { data: run } = await supabase
    .from("agent_runs")
    .insert({
      assessment_id: assessmentId,
      run_type: "research",
      status: "running",
      model_provider: "anthropic",
      model_name: DISCOVERY_MODEL
    })
    .select("id")
    .single();

  void runDiscovery(assessmentId, run?.id ?? null);

  return seeOther(back, request);
}
