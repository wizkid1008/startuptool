import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SMEAT Opportunity Scoring Agent",
  description: "A formal SMEAT company opportunity scoring workflow."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
