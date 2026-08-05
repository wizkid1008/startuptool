import { z } from "zod";
import { failurePage, formatIssues, seeOther } from "@/lib/http";
import { createServiceClient } from "@/lib/supabase/server";

const MAX_BYTES = 25 * 1024 * 1024;

const ALLOWED_EXTENSIONS = [
  ".pdf",
  ".png",
  ".jpg",
  ".jpeg",
  ".webp",
  ".gif",
  ".txt",
  ".md",
  ".csv"
];

const requestSchema = z.object({
  company_id: z.string().uuid("A valid company is required")
});

function isTextLike(file: File) {
  const name = file.name.toLowerCase();
  return file.type.startsWith("text/") || name.endsWith(".md") || name.endsWith(".csv");
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = requestSchema.safeParse({ company_id: formData.get("company_id") });

  if (!parsed.success) {
    return failurePage({
      title: "That upload could not be accepted.",
      detail: formatIssues(parsed.error),
      backHref: "/companies",
      backLabel: "Back to companies"
    });
  }

  const companyId = parsed.data.company_id;
  const back = `/companies/${companyId}`;
  const file = formData.get("document");

  if (!(file instanceof File) || file.size === 0) {
    return failurePage({
      title: "No file was received.",
      detail: "Choose a document before uploading.",
      backHref: back,
      backLabel: "Back to company"
    });
  }

  if (file.size > MAX_BYTES) {
    return failurePage({
      title: "That file is too large.",
      detail: `Limit is ${MAX_BYTES / (1024 * 1024)} MB; this file is ${(
        file.size /
        (1024 * 1024)
      ).toFixed(1)} MB.`,
      backHref: back,
      backLabel: "Back to company",
      status: 413
    });
  }

  const lowerName = file.name.toLowerCase();
  if (!ALLOWED_EXTENSIONS.some((extension) => lowerName.endsWith(extension))) {
    return failurePage({
      title: "That file type is not supported.",
      detail: `Accepted types: ${ALLOWED_EXTENSIONS.join(", ")}`,
      backHref: back,
      backLabel: "Back to company",
      status: 415
    });
  }

  const supabase = createServiceClient();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${companyId}/${Date.now()}-${safeName}`;
  const bytes = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from("company-documents")
    .upload(storagePath, bytes, {
      contentType: file.type || "application/octet-stream",
      upsert: false
    });

  if (uploadError) {
    return failurePage({
      title: "The file could not be stored.",
      detail: uploadError.message,
      backHref: back,
      backLabel: "Back to company",
      status: 500
    });
  }

  const parsedText = isTextLike(file) ? await file.text() : null;

  const { error: insertError } = await supabase.from("company_documents").insert({
    company_id: companyId,
    storage_path: storagePath,
    file_name: file.name,
    mime_type: file.type || "application/octet-stream",
    size_bytes: file.size,
    parsed_text: parsedText
  });

  if (insertError) {
    // The object is already in storage; drop it so the row and the bucket agree.
    await supabase.storage.from("company-documents").remove([storagePath]);

    return failurePage({
      title: "The document record could not be saved.",
      detail: insertError.message,
      backHref: back,
      backLabel: "Back to company",
      status: 500
    });
  }

  return seeOther(back, request);
}
