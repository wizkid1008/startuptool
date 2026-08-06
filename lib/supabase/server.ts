import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { requireEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Session-aware client. Requests run as the signed-in user, so row-level
 * security applies. This is the client everything should use.
 */
export async function createSessionClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Called from a Server Component, where cookies are read-only.
            // The middleware refreshes the session, so this is safe to ignore.
          }
        }
      }
    }
  );
}

/** The signed-in user, or null. */
export async function getSessionUser() {
  const supabase = await createSessionClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();
  return user;
}

/**
 * Bypasses row-level security entirely. Reserved for operations that have no
 * user context — nothing currently needs it, and reaching for it in a request
 * path removes every access check the schema provides.
 */
export function createServiceClient() {
  return createClient<Database>(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );
}
