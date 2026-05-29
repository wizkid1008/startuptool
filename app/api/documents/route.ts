import { redirect } from "next/navigation";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";

const requestSchema = z.object({
  company_id: z.string().uuid()
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = requestSchema.parse({ company_id: formData.get("company_id") });
  const file = formData.get("document");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "document file is required" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${parsed.company_id}/${Date.now()}-${safeName}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("company-documents")
    .upload(storagePath, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

  if (uploadError) {
    return NextResponse.json({ error: uploadError.message }, { status: 500 });
  }

  const parsedText =
    file.type.startsWith("text/") || file.name.endsWith(".md") || file.name.endsWith(".csv")
      ? await file.text()
      : null;

  const { error: insertError } = await supabase.from("company_documents").insert({
    company_id: parsed.company_id,
    storage_path: storagePath,
    file_name: file.name,
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
    parsed_text: parsedText
  });

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  redirect(`/companies/${parsed.company_id}`);
}
