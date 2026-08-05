import type { Metadata } from "next";
import { Masthead } from "@/components/Masthead";
import { SideNav } from "@/components/SideNav";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMEAT — Opportunity Scoring Agent",
  description: "A formal SMEAT company opportunity scoring workflow."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <Masthead />
        <div className="layout">
          <SideNav />
          <main className="content">
            <div className="wide">{children}</div>
          </main>
        </div>
      </body>
    </html>
  );
}
