import type { Metadata } from "next";
import { BuildStamp } from "@/components/BuildStamp";
import { Masthead } from "@/components/Masthead";
import { SideNav } from "@/components/SideNav";
import { getMembership } from "@/lib/supabase/membership";
import { getSessionUser } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMEAT — Assessment Agent",
  description: "A formal SMEAT company criticality scoring workflow."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let email: string | null = null;
  let member = false;

  // Missing configuration must not break rendering — the page below shows its
  // own notice, which is more useful than a stack trace.
  try {
    const user = await getSessionUser();
    email = user?.email ?? null;

    if (email) {
      member = (await getMembership()) !== null;
    }
  } catch {
    email = null;
  }

  // Signed in and a member of nothing: someone registered without an
  // invitation. Every policy already returns an empty set for them, so the
  // application would render as a working tool with no data in it. Say what
  // is actually true instead. See migration 0010.
  if (email && !member) {
    return (
      <html lang="en">
        <body>
          <Masthead email={email} />
          <main className="content">
            <div className="wide" style={{ maxWidth: 640 }}>
              <div className="notice" style={{ marginTop: 40 }}>
                <strong>This account is not part of an organization.</strong>
                <span className="small">
                  SMEAT is invite-only. Ask whoever runs your workspace to invite{" "}
                  <strong>{email}</strong>, then sign in again. Nothing is shared with an
                  account until it has been invited.
                </span>
              </div>
              <form method="post" action="/auth/signout" style={{ marginTop: 16 }}>
                <button className="secondary" type="submit">
                  Sign out
                </button>
              </form>
              <BuildStamp />
            </div>
          </main>
        </body>
      </html>
    );
  }

  return (
    <html lang="en">
      <body>
        <Masthead email={email} />
        {email ? (
          <div className="layout">
            <SideNav />
            <main className="content">
              <div className="wide">
                {children}
                <BuildStamp />
              </div>
            </main>
          </div>
        ) : (
          <main className="content">
            <div className="wide" style={{ maxWidth: 900 }}>
              {children}
              {/* Also shown signed out. "Which build is live?" is a question
                  worth answering without having to log in first — including
                  from outside the app entirely. */}
              <BuildStamp />
            </div>
          </main>
        )}
      </body>
    </html>
  );
}
