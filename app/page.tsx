import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Task, PlannerBlock, Note } from "@/lib/supabase/database.types";
import ProductivityClient from "./client";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [{ data: tasks }, { data: blocks }, { data: notes }] = await Promise.all([
    supabase.from("tasks").select("*").eq("user_id", user.id).order("sort_order", { ascending: true }),
    supabase.from("planner_blocks").select("*").eq("user_id", user.id).order("starts_at", { ascending: true }),
    supabase.from("notes").select("*").eq("user_id", user.id).order("pinned", { ascending: false }).order("updated_at", { ascending: false }),
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
          <span className="badge">Supabase</span>
        </div>
      </header>

      <ProductivityClient
        tasks={(tasks ?? []) as Task[]}
        plannerBlocks={(blocks ?? []) as PlannerBlock[]}
        notes={(notes ?? []) as Note[]}
      />
    </main>
  );
}
