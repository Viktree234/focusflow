"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TaskPriority, TaskStatus } from "@/lib/supabase/database.types";

type Result<T = void> = { success: true; data?: T } | { success: false; error: string };
const PATH = "/";

async function getUserClient() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" } as const;
  return { supabase, user } as const;
}

export async function createTask(input: {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string | null;
}): Promise<Result<{ id: string }>> {
  const ctx = await getUserClient();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { supabase, user } = ctx;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      user_id: user.id,
      title: input.title.trim(),
      description: input.description?.trim() || null,
      priority: input.priority ?? "medium",
      due_date: input.dueDate ?? null,
      status: "todo" as TaskStatus,
      sort_order: Date.now(),
      updated_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath(PATH);
  return { success: true, data: { id: data.id } };
}

export async function updateTask(id: string, updates: Partial<{ title: string; description: string | null; priority: TaskPriority; status: TaskStatus; dueDate: string | null }>): Promise<Result> {
  const ctx = await getUserClient();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { supabase, user } = ctx;
  const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (updates.title !== undefined) payload.title = updates.title;
  if (updates.description !== undefined) payload.description = updates.description;
  if (updates.priority !== undefined) payload.priority = updates.priority;
  if (updates.status !== undefined) payload.status = updates.status;
  if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;

  const { error } = await supabase
    .from("tasks")
    .update(payload)
    .eq("id", id)
    .eq("user_id", user.id);

  if (error) return { success: false, error: error.message };
  revalidatePath(PATH);
  return { success: true };
}

export async function deleteTask(id: string): Promise<Result> {
  const ctx = await getUserClient();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { supabase, user } = ctx;
  const { error } = await supabase.from("tasks").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { success: false, error: error.message };
  revalidatePath(PATH);
  return { success: true };
}

export async function savePlannerBlock(input: { id?: string; title: string; startsAt: string; endsAt: string; color?: string; linkedTaskId?: string | null; }): Promise<Result<{ id: string }>> {
  const ctx = await getUserClient();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { supabase, user } = ctx;
  const payload = {
    id: input.id,
    user_id: user.id,
    title: input.title.trim(),
    starts_at: input.startsAt,
    ends_at: input.endsAt,
    color: input.color ?? "blue",
    linked_task_id: input.linkedTaskId ?? null,
  } as const;

  const { data, error } = await supabase
    .from("planner_blocks")
    .upsert(payload, { onConflict: "id" })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath(PATH);
  return { success: true, data: { id: data.id } };
}

export async function deletePlannerBlock(id: string): Promise<Result> {
  const ctx = await getUserClient();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { supabase, user } = ctx;
  const { error } = await supabase.from("planner_blocks").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { success: false, error: error.message };
  revalidatePath(PATH);
  return { success: true };
}

export async function saveNote(input: { id?: string; title: string; content?: string; pinned?: boolean; }): Promise<Result<{ id: string }>> {
  const ctx = await getUserClient();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { supabase, user } = ctx;
  const payload = {
    id: input.id,
    user_id: user.id,
    title: input.title.trim(),
    content: input.content ?? "",
    pinned: input.pinned ?? false,
    updated_at: new Date().toISOString(),
  } as const;

  const { data, error } = await supabase
    .from("notes")
    .upsert(payload, { onConflict: "id" })
    .select("id")
    .single();

  if (error) return { success: false, error: error.message };
  revalidatePath(PATH);
  return { success: true, data: { id: data.id } };
}

export async function deleteNote(id: string): Promise<Result> {
  const ctx = await getUserClient();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { supabase, user } = ctx;
  const { error } = await supabase.from("notes").delete().eq("id", id).eq("user_id", user.id);
  if (error) return { success: false, error: error.message };
  revalidatePath(PATH);
  return { success: true };
}

export async function toggleNotePin(id: string, pinned: boolean): Promise<Result> {
  return updateNoteMeta(id, { pinned });
}

async function updateNoteMeta(id: string, meta: { pinned?: boolean }) {
  const ctx = await getUserClient();
  if ("error" in ctx) return { success: false, error: ctx.error };
  const { supabase, user } = ctx;
  const { error } = await supabase
    .from("notes")
    .update({ ...meta, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", user.id);
  if (error) return { success: false, error: error.message };
  revalidatePath(PATH);
  return { success: true };
}
