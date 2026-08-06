import { createSessionClient } from "@/lib/supabase/server";

export type Membership = {
  userId: string;
  email: string | null;
  organizationId: string;
  organizationName: string | null;
  role: string;
};

export const ADMIN_ROLES = ["owner", "admin"];

export function canInvite(role: string | null | undefined) {
  return role !== null && role !== undefined && ADMIN_ROLES.includes(role);
}

/**
 * Who the caller is, and which organization they belong to.
 *
 * A signed-in user with no profile row is the normal state for someone who
 * registered without an invitation — see migration 0010. They are
 * authenticated but a member of nothing, and every RLS policy already returns
 * an empty set for them. Returning null here lets the shell say so plainly
 * instead of rendering an application that looks broken.
 */
export async function getMembership(): Promise<Membership | null> {
  const supabase = await createSessionClient();

  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("organization_id,role")
    .eq("id", user.id)
    .maybeSingle();

  if (!profile?.organization_id) return null;

  const { data: organization } = await supabase
    .from("organizations")
    .select("name")
    .eq("id", profile.organization_id)
    .maybeSingle();

  return {
    userId: user.id,
    email: user.email ?? null,
    organizationId: profile.organization_id,
    organizationName: organization?.name ?? null,
    role: profile.role
  };
}
