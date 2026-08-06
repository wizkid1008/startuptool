import { z } from "zod";
import { failurePage, formatIssues, seeOther } from "@/lib/http";
import { createSessionClient } from "@/lib/supabase/server";

const assessmentSchema = z.object({
  company_id: z.string().uuid("A valid company is required")
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = assessmentSchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return failurePage({
      title: "That assessment could not be started.",
      detail: formatIssues(parsed.error),
      backHref: "/companies",
      backLabel: "Back to companies"
    });
  }

  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("assessments")
    .insert({ company_id: parsed.data.company_id, status: "draft" })
    .select("id")
    .single();

  if (error || !data) {
    return failurePage({
      title: "The assessment could not be created.",
      detail: error?.message,
      backHref: `/companies/${parsed.data.company_id}`,
      backLabel: "Back to company",
      status: 500
    });
  }

  // Discovery is the first real stage. Landing on the assessment instead
  // offered "Run agent score" as the primary action with no evidence gathered,
  // which is exactly the order the stepper says not to work in.
  return seeOther(`/assessments/${data.id}/discovery`, request);
}
