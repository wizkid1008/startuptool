import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";

const companySchema = z.object({
  name: z.string().min(1),
  website: z.string().optional(),
  linkedin_url: z.string().optional(),
  crunchbase_url: z.string().optional(),
  industry: z.string().optional(),
  stage: z.string().optional(),
  geography: z.string().optional(),
  employee_count_range: z.string().optional(),
  description: z.string().optional()
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const payload = Object.fromEntries(formData.entries());
  const parsed = companySchema.parse(payload);
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("companies")
    .insert({
      name: parsed.name,
      website: parsed.website || null,
      linkedin_url: parsed.linkedin_url || null,
      crunchbase_url: parsed.crunchbase_url || null,
      industry: parsed.industry || null,
      stage: parsed.stage || null,
      geography: parsed.geography || null,
      employee_count_range: parsed.employee_count_range || null,
      description: parsed.description || null
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  redirect(`/companies/${data.id}`);
}
