import { seeOther } from "@/lib/http";
import { createSessionClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSessionClient();
  await supabase.auth.signOut();
  return seeOther("/login", request);
}
