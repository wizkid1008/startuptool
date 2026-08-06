import { redirect } from "next/navigation";
import { PageHead } from "@/components/PageHead";
import { formatDate } from "@/lib/smeat/presentation";
import { canInvite, getMembership } from "@/lib/supabase/membership";
import { createSessionClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const ROLES = ["viewer", "member", "admin", "owner"];

const ROLE_NOTE: Record<string, string> = {
  owner: "Full access, including inviting and removing people.",
  admin: "Full access, including inviting and removing people.",
  member: "Can read and edit every assessment in the organization.",
  viewer: "Can read every assessment in the organization."
};

export default async function TeamPage() {
  const membership = await getMembership();

  // The shell already handles a signed-in non-member, so this only fires if
  // membership was lost between the two reads.
  if (!membership) {
    redirect("/login");
  }

  const supabase = await createSessionClient();

  const [{ data: profiles }, { data: invites }] = await Promise.all([
    supabase
      .from("profiles")
      .select("id,full_name,role,created_at")
      .eq("organization_id", membership.organizationId)
      .order("created_at", { ascending: true }),
    supabase
      .from("organization_invites")
      .select("*")
      .eq("organization_id", membership.organizationId)
      .order("created_at", { ascending: false })
  ]);

  const admin = canInvite(membership.role);
  const pending = (invites ?? []).filter((invite) => !invite.accepted_at);
  const accepted = (invites ?? []).filter((invite) => invite.accepted_at);

  return (
    <>
      <PageHead
        eyebrow={`SMEAT / ${membership.organizationName ?? "Organization"}`}
        title="Team"
        lede="Who can see this workspace. Everyone here can read every company and assessment in it."
      />

      <div className="notice" style={{ marginBottom: 24 }}>
        <strong>Access is by invitation only.</strong>
        <span className="small">
          Registering does not grant access to anything. An account only joins this organization
          if its email address has been invited first, so an uninvited signup sees an empty
          application rather than your clients.
        </span>
      </div>

      <section className="section">
        <div className="card-head">
          <h2>Members</h2>
          <span className="microlabel">
            {(profiles ?? []).length} {(profiles ?? []).length === 1 ? "person" : "people"}
          </span>
        </div>

        <div className="tablewrap">
          <div className="tablescroll">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Since</th>
                </tr>
              </thead>
              <tbody>
                {(profiles ?? []).map((profile) => (
                  <tr key={profile.id}>
                    <td>
                      <strong>{profile.full_name ?? "—"}</strong>
                      {profile.id === membership.userId ? (
                        <span className="pill ghost" style={{ marginLeft: 8 }}>
                          You
                        </span>
                      ) : null}
                    </td>
                    <td>
                      <span className="pill">{profile.role}</span>
                      <div className="hint">{ROLE_NOTE[profile.role]}</div>
                    </td>
                    <td className="muted small nowrap">{formatDate(profile.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="card-head">
          <h2>Invitations</h2>
          <span className="microlabel">
            {pending.length === 0 ? "None outstanding" : `${pending.length} outstanding`}
          </span>
        </div>

        {admin ? (
          <form method="post" action="/api/invites" className="actionform card">
            <input type="hidden" name="intent" value="invite" />
            <input name="email" type="email" placeholder="Email address" required />
            <select name="role" defaultValue="member" aria-label="Role">
              {ROLES.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
            <button type="submit">Invite</button>
          </form>
        ) : (
          <p className="hint">Only an owner or admin can invite people.</p>
        )}

        <p className="hint" style={{ marginTop: 10 }}>
          An invitation lasts fourteen days and is claimed when that address registers. It does
          not send an email — pass on the link yourself, which also means an invitation cannot
          leak to whoever happens to control the inbox later.
        </p>

        {pending.length === 0 ? null : (
          <div className="tablewrap" style={{ marginTop: 16 }}>
            <div className="tablescroll">
              <table>
                <thead>
                  <tr>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Expires</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {pending.map((invite) => {
                    const expired = new Date(invite.expires_at).getTime() < Date.now();

                    return (
                      <tr key={invite.id}>
                        <td>
                          <strong>{invite.email}</strong>
                        </td>
                        <td>
                          <span className="pill">{invite.role}</span>
                        </td>
                        <td className="nowrap">
                          {expired ? (
                            <span className="pill bad">Expired</span>
                          ) : (
                            <span className="muted small">{formatDate(invite.expires_at)}</span>
                          )}
                        </td>
                        <td className="nowrap">
                          {admin ? (
                            <form method="post" action="/api/invites">
                              <input type="hidden" name="intent" value="revoke" />
                              <input type="hidden" name="invite_id" value={invite.id} />
                              <button className="quiet small" type="submit">
                                Revoke
                              </button>
                            </form>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {accepted.length > 0 ? (
          <p className="hint" style={{ marginTop: 14 }}>
            {accepted.length} invitation{accepted.length === 1 ? " has" : "s have"} been claimed.
            Revoking one of those does not remove the account — delete it in Supabase under
            Authentication, or set its profile role to viewer.
          </p>
        ) : null}
      </section>
    </>
  );
}
