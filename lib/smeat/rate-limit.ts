import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * One agent run of each type per assessment per day.
 *
 * Both agents make large model calls — discovery is seven, scoring is one big
 * one — and re-running is the easiest way to spend real money without meaning
 * to. The window is per assessment rather than per user, so working across
 * several companies in a day is unaffected.
 */
export const RUN_WINDOW_HOURS = 24;

export type RunLimit =
  | { allowed: true }
  | { allowed: false; nextAllowedAt: Date; lastRunAt: Date };

export async function checkRunLimit(
  supabase: SupabaseClient<Database>,
  assessmentId: string,
  runType: "scoring" | "research" | "analysis"
): Promise<RunLimit> {
  const since = new Date(Date.now() - RUN_WINDOW_HOURS * 60 * 60 * 1000).toISOString();

  // Failed runs do not count — being blocked for a day by something that never
  // produced a result would be its own bug.
  const { data } = await supabase
    .from("agent_runs")
    .select("created_at,status")
    .eq("assessment_id", assessmentId)
    .eq("run_type", runType)
    .in("status", ["running", "succeeded"])
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data?.created_at) {
    return { allowed: true };
  }

  const lastRunAt = new Date(data.created_at);
  return {
    allowed: false,
    lastRunAt,
    nextAllowedAt: new Date(lastRunAt.getTime() + RUN_WINDOW_HOURS * 60 * 60 * 1000)
  };
}

export function formatWait(nextAllowedAt: Date) {
  const minutes = Math.max(1, Math.round((nextAllowedAt.getTime() - Date.now()) / 60000));
  if (minutes < 60) return `${minutes} minute${minutes === 1 ? "" : "s"}`;
  const hours = Math.round(minutes / 60);
  return `${hours} hour${hours === 1 ? "" : "s"}`;
}
