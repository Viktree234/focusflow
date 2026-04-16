import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import TasksClient from "./client";

export default async function TasksPage() {
  const session = await auth();
  const user = session?.user;

  if (!user || !user.id) redirect("/api/auth/signin");

  const userTasks = await db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, user.id))
    .orderBy(asc(tasks.sortOrder));

  return <TasksClient tasks={userTasks} />;
}