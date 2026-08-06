import { z } from "zod";
import { failurePage, formatIssues, seeOther } from "@/lib/http";
import { canInvite, getMembership } from "@/lib/supabase/membership";
import { createSessionClient } from "@/lib/supabase/server";

const inviteSchema = z.object({
  intent: z.literal("invite"),
  email: z.string().trim().email("That is not a valid email address").max(320),
  role: z.enum(["owner", "admin", "member", "viewer"]).default("member")
});

const revokeSchema = z.object({
  intent: z.literal("revoke"),
  invite_id: z.string().uuid()
});

const schema = z.discriminatedUnion("intent", [inviteSchema, revokeSchema]);

export async function POST(request: Request) {
  const formData = await request.formData();
  const parsed = schema.safeParse(Object.fromEntries(formData.entries()));

  if (!parsed.success) {
    return failurePage({
      title: "That invitation could not be saved.",
      detail: formatIssues(parsed.error),
      backHref: "/team",
      backLabel: "Back to team"
    });
  }

  const membership = await getMembership();

  // The RLS policy on organization_invites enforces this too. Checking here as
  // well turns a silent empty result into an explanation.
  if (!membership || !canInvite(membership.role)) {
    return failurePage({
      title: "You cannot manage invitations.",
      detail: "Only an owner or admin of the organization can invite or remove people.",
      backHref: "/team",
      backLabel: "Back to team",
      status: 403
    });
  }

  const supabase = await createSessionClient();

  if (parsed.data.intent === "revoke") {
    const { error } = await supabase
      .from("organization_invites")
      .delete()
      .eq("id", parsed.data.invite_id);

    if (error) {
      return failurePage({
        title: "That invitation could not be revoked.",
        detail: error.message,
        backHref: "/team",
        backLabel: "Back to team",
        status: 500
      });
    }

    return seeOther("/team", request);
  }

  const email = parsed.data.email.toLowerCase();

  // Re-inviting an address replaces the previous invitation rather than
  // leaving two rows with different organizations and no rule for which one
  // handle_new_user picks up.
  const { error } = await supabase.from("organization_invites").upsert(
    {
      organization_id: membership.organizationId,
      email,
      role: parsed.data.role,
      invited_by: membership.userId,
      // A re-invite of a lapsed address has to clear the old outcome, or the
      // trigger will skip it as already accepted.
      accepted_at: null,
      accepted_by: null,
      expires_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    },
    { onConflict: "email" }
  );

  if (error) {
    return failurePage({
      title: "That invitation could not be created.",
      detail: error.message,
      backHref: "/team",
      backLabel: "Back to team",
      status: 500
    });
  }

  return seeOther("/team", request);
}
