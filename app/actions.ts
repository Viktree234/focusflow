"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { tasks, plannerBlocks, notes } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { auth } from "@/auth";

export type TaskPriority = "low" | "medium" | "high";
export type TaskStatus = "todo" | "doing" | "done";

type Result<T = void> = { success: true; data?: T } | { success: false; error: string };
const PATH = "/";

type AuthResult = { userId: string } | { error: string };

function toErrorMessage(error: unknown) {
  return error instanceof Error ? error.message : "Unknown error";
}

async function getUser(): Promise<AuthResult> {
  const session = await auth();
  const userId = typeof session?.user?.id === "string" ? session.user.id : undefined;
  if (!userId) return { error: "Not signed in" } as const;
  return { userId } as const;
}

export async function createTask(input: {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
}): Promise<Result<{ id: string }>> {
  const ctx = await getUser();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { userId } = ctx;

  try {
    const [newTask] = await db
      .insert(tasks)
      .values({
        userId,
        title: input.title.trim(),
        description: input.description?.trim() || null,
        priority: input.priority ?? "medium",
        dueDate: input.dueDate ?? null,
        status: "todo",
        sortOrder: Date.now(),
        updatedAt: new Date(),
      })
      .returning({ id: tasks.id });

    revalidatePath(PATH);
    return { success: true, data: { id: newTask.id } };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function updateTask(
  id: string,
  updates: Partial<{ title: string; description: string | null; priority: TaskPriority; status: TaskStatus; dueDate: string | null }>
): Promise<Result> {
  const ctx = await getUser();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { userId } = ctx;

  const payload: Partial<typeof tasks.$inferInsert> = { updatedAt: new Date() };
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.dueDate !== undefined) payload.dueDate = updates.dueDate;

  try {
    await db
      .update(tasks)
      .set(payload)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)));

    revalidatePath(PATH);
    return { success: true };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function deleteTask(id: string): Promise<Result> {
  const ctx = await getUser();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { userId } = ctx;

  try {
    await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
    revalidatePath(PATH);
    return { success: true };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function savePlannerBlock(input: {
  id?: string;
  title: string;
  startsAt: string;
  endsAt: string;
  color?: string;
  linkedTaskId?: string | null;
}): Promise<Result<{ id: string }>> {
  const ctx = await getUser();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { userId } = ctx;

  const payload = {
    ...(input.id ? { id: input.id } : {}),
    userId,
    title: input.title.trim(),
    startsAt: new Date(input.startsAt),
    endsAt: new Date(input.endsAt),
    color: input.color ?? "blue",
    linkedTaskId: input.linkedTaskId ?? null,
  } as const;

  try {
    const [block] = await db
      .insert(plannerBlocks)
      .values(payload)
      .onConflictDoUpdate({
        target: plannerBlocks.id,
        set: payload,
      })
      .returning({ id: plannerBlocks.id });

    revalidatePath(PATH);
    return { success: true, data: { id: block.id } };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function deletePlannerBlock(id: string): Promise<Result> {
  const ctx = await getUser();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { userId } = ctx;

  try {
    await db.delete(plannerBlocks).where(and(eq(plannerBlocks.id, id), eq(plannerBlocks.userId, userId)));
    revalidatePath(PATH);
    return { success: true };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function saveNote(input: {
  id?: string;
  title: string;
  content?: string;
  pinned?: boolean;
}): Promise<Result<{ id: string }>> {
  const ctx = await getUser();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { userId } = ctx;

  const payload = {
    ...(input.id ? { id: input.id } : {}),
    userId,
    title: input.title.trim(),
    content: input.content ?? "",
    pinned: input.pinned ?? false,
    updatedAt: new Date(),
  } as const;

  try {
    const [note] = await db
      .insert(notes)
      .values(payload)
      .onConflictDoUpdate({
        target: notes.id,
        set: payload,
      })
      .returning({ id: notes.id });

    revalidatePath(PATH);
    return { success: true, data: { id: note.id } };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function deleteNote(id: string): Promise<Result> {
  const ctx = await getUser();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { userId } = ctx;

  try {
    await db.delete(notes).where(and(eq(notes.id, id), eq(notes.userId, userId)));
    revalidatePath(PATH);
    return { success: true };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}

export async function toggleNotePin(id: string, pinned: boolean): Promise<Result> {
  return updateNoteMeta(id, { pinned });
}

async function updateNoteMeta(id: string, meta: { pinned?: boolean }): Promise<Result> {
  const ctx = await getUser();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { userId } = ctx;

  try {
    await db
      .update(notes)
      .set({ ...meta, updatedAt: new Date() })
      .where(and(eq(notes.id, id), eq(notes.userId, userId)));

    revalidatePath(PATH);
    return { success: true };
  } catch (error) {
    return { success: false, error: toErrorMessage(error) };
  }
}
