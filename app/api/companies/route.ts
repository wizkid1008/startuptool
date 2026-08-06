import { z } from "zod";
import { failurePage, formatIssues, seeOther } from "@/lib/http";
import { createSessionClient } from "@/lib/supabase/server";

const optionalUrl = z
  .string()
  .trim()
  .max(2048)
  .refine(
    (value) => {
      if (value === "") return true;
      try {
        return ["http:", "https:"].includes(new URL(value).protocol);
      } catch {
        return false;
      }
    },
    { message: "Must be an http(s) URL" }
  )
  .optional();

const companySchema = z.object({
  name: z.string().trim().min(1, "Company name is required").max(200),
  website: optionalUrl,
  linkedin_url: optionalUrl,
  crunchbase_url: optionalUrl,
  industry: z.string().trim().max(120).optional(),
  stage: z.string().trim().max(120).optional(),
  geography: z.string().trim().max(120).optional(),
  employee_count_range: z.string().trim().max(60).optional(),
  description: z.string().trim().max(8000).optional()
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = companySchema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return failurePage({
      title: "That company could not be created.",
      detail: formatIssues(parsed.error),
      backHref: "/companies/new",
      backLabel: "Back to form"
    });
  }

  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("companies")
    .insert({
      name: parsed.data.name,
      website: parsed.data.website || null,
      linkedin_url: parsed.data.linkedin_url || null,
      crunchbase_url: parsed.data.crunchbase_url || null,
      industry: parsed.data.industry || null,
      stage: parsed.data.stage || null,
      geography: parsed.data.geography || null,
      employee_count_range: parsed.data.employee_count_range || null,
      description: parsed.data.description || null
    })
    .select("id")
    .single();

  if (error || !data) {
    return failurePage({
      title: "The company could not be saved.",
      detail: error?.message,
      backHref: "/companies/new",
      backLabel: "Back to form",
      status: 500
    });
  }

  return seeOther(`/companies/${data.id}`, request);
}
