import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tasks, plannerBlocks, notes } from "@/lib/db/schema";
import { eq, asc, desc } from "drizzle-orm";
import DashboardClient from "./client";

export default async function DashboardPage() {
  const session = await auth();
  const user = session?.user;

  if (!user || !user.id) redirect("/api/auth/signin");

  const [userTasks, userBlocks, userNotes] = await Promise.all([
    db.select().from(tasks).where(eq(tasks.userId, user.id)).orderBy(asc(tasks.sortOrder)),
    db.select().from(plannerBlocks).where(eq(plannerBlocks.userId, user.id)).orderBy(asc(plannerBlocks.startsAt)),
    db.select().from(notes).where(eq(notes.userId, user.id)).orderBy(desc(notes.pinned), desc(notes.updatedAt)),
  ]);

  return <DashboardClient user={user} tasks={userTasks} plannerBlocks={userBlocks} notes={userNotes} />;
}