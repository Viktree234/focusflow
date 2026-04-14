import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tasks, plannerBlocks, notes } from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import ProductivityClient from "./client";

export default async function Page() {
  const session = await auth();
  const user = session?.user;

  if (!user || !user.id) redirect("/api/auth/signin");

  const [userTasks, userBlocks, userNotes] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.userId, user.id)).orderBy(asc(tasks.sortOrder)),
    db.select().from(plannerBlocks).where(eq(plannerBlocks.userId, user.id)).orderBy(asc(plannerBlocks.startsAt)),
    db.select().from(notes).where(eq(notes.userId, user.id)).orderBy(desc(notes.pinned), desc(notes.updatedAt)),
  ]);

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <header className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-[var(--ink-muted)]">Student productivity</p>
          <h1 className="text-3xl font-display font-semibold">Productivity Dashboard</h1>
          <p className="text-sm text-[var(--ink-muted)]">Tasks, planner, and notes synced to your account.</p>
        </div>
        <div className="flex gap-2">
          <span className="badge">Dark mode</span>
          <span className="badge">Responsive</span>
          <span className="badge">NextAuth & Drizzle</span>
        </div>
      </header>

      <ProductivityClient
        tasks={userTasks}
        plannerBlocks={userBlocks}
        notes={userNotes}
      />
    </main>
  );
}
