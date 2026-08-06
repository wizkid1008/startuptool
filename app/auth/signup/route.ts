import { z } from "zod";
import { seeOther } from "@/lib/http";
import { createSessionClient } from "@/lib/supabase/server";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().trim().max(200).optional()
});

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    const weak = parsed.error.issues.some((issue) => issue.path[0] === "password");
    return seeOther(`/login?error=${weak ? "weak" : "invalid"}`, request);
  }

  const supabase = await createSessionClient();
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      // Read by the handle_new_user trigger from migration 0003.
      data: { full_name: parsed.data.full_name || null }
    }
  });

  if (error) {
    const code = error.message.toLowerCase();
    if (code.includes("already registered") || code.includes("already been registered")) {
      return seeOther("/login?error=exists", request);
    }
    if (code.includes("signups not allowed") || code.includes("disabled")) {
      return seeOther("/login?error=signup_disabled", request);
    }
    return seeOther("/login?error=unknown", request);
  }

  // With email confirmation enabled Supabase returns a user but no session,
  // so there is nothing to sign in with yet.
  if (!data.session) {
    return seeOther("/login?message=confirm", request);
  }

  return seeOther("/", request);
}
