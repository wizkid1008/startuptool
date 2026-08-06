import type { Metadata } from "next";
import { BuildStamp } from "@/components/BuildStamp";
import { Masthead } from "@/components/Masthead";
import { SideNav } from "@/components/SideNav";
import { getSessionUser } from "@/lib/supabase/server";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMEAT — Assessment Agent",
  description: "A formal SMEAT company criticality scoring workflow."
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let email: string | null = null;

  // Missing configuration must not break rendering — the page below shows its
  // own notice, which is more useful than a stack trace.
  try {
    const user = await getSessionUser();
    email = user?.email ?? null;
  } catch {
    email = null;
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
