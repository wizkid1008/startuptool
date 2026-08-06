import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { requireEnv } from "@/lib/env";
import type { Database } from "@/lib/supabase/types";

/**
 * Session-aware client. Requests run as the signed-in user, so row-level
 * security applies. This is the client everything should use.
 *
 * The return value is asserted to SupabaseClient<Database> rather than passing
 * Database as a generic to createServerClient. @supabase/ssr resolves that
 * generic differently from supabase-js's own createClient, and with the
 * hand-written Database type it collapses every table to `never` — which broke
 * typecheck across eleven files. The assertion restores the same typed surface
 * callers had before. The real fix is to replace lib/supabase/types.ts with
 * `supabase gen types typescript` output once the CLI is available.
 */
export async function createSessionClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies();

  const client = createServerClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(
          cookiesToSet: Array<{ name: string; value: string; options: CookieOptions }>
        ) {
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

  return client as unknown as SupabaseClient<Database>;
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
export function createServiceClient(): SupabaseClient<Database> {
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
