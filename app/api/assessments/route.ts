import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";

const assessmentSchema = z.object({
  company_id: z.string().uuid()
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = assessmentSchema.parse(Object.fromEntries(formData.entries()));
  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("assessments")
    .insert({ company_id: parsed.company_id, status: "draft" })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  redirect(`/assessments/${data.id}`);
}
