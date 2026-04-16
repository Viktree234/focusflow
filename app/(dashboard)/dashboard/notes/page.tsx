import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notes } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import NotesClient from "./client";

export default async function NotesPage() {
  const session = await auth();
  const user = session?.user;

  if (!user || !user.id) redirect("/api/auth/signin");

  const userNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.userId, user.id))
    .orderBy(desc(notes.pinned), desc(notes.updatedAt));

  return <NotesClient notes={userNotes} />;
}