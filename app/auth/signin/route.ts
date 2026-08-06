import { z } from "zod";
import { seeOther } from "@/lib/http";
import { createSessionClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  next: z.string().optional()
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return seeOther("/login?error=invalid", request);
  }

  const supabase = await createSessionClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password
  });

  if (error) {
    return seeOther("/login?error=invalid", request);
  }

  // Only accept relative paths, so a crafted ?next= cannot bounce someone to
  // another host after they authenticate.
  const next =
    parsed.data.next && parsed.data.next.startsWith("/") && !parsed.data.next.startsWith("//")
      ? parsed.data.next
      : "/";

  return seeOther(next, request);
}
