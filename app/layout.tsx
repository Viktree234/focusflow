import "./globals.css";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: {
    default: "Student Productivity Dashboard",
    template: "%s | Student Productivity Dashboard",
  },
  description: "Tasks, daily planner, and notes in one clean dashboard.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="dark">
      <body className="bg-paper text-ink">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
