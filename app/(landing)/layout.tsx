import "./globals.css";
import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { auth } from "@/auth";
import { redirect } from "next/navigation";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "FocusFlow - Student Productivity Dashboard",
  description: "Organize tasks, plan your schedule, and capture notes. Built for students.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body className="bg-[#0a0a0b] text-white antialiased">
        {children}
      </body>
    </html>
  );
}