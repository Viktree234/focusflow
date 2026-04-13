"use client";

import { useState, useMemo, useTransition } from "react";
import type { Task, PlannerBlock, Note, TaskPriority, TaskStatus } from "@/lib/supabase/database.types";
import {
  createTask,
  updateTask,
  deleteTask,
  savePlannerBlock,
  deletePlannerBlock,
  saveNote,
  deleteNote,
  toggleNotePin,
} from "./actions";
import { Plus, Loader2, CheckCircle2, Clock3, Trash2, NotebookPen, CalendarClock, ListTodo } from "lucide-react";

interface Props {
  tasks: Task[];
  plannerBlocks: PlannerBlock[];
  notes: Note[];
}

const priorityColor: Record<TaskPriority, string> = {
  low: "bg-emerald-500/15 text-emerald-300",
  medium: "bg-amber-500/15 text-amber-300",
  high: "bg-rose-500/15 text-rose-300",
};

const statusLabel: Record<TaskStatus, string> = {
  todo: "To-do",
  doing: "In progress",
  done: "Done",
};

export default function ProductivityClient({ tasks, plannerBlocks, notes }: Props) {
  const [taskList, setTaskList] = useState(tasks);
  const [blockList, setBlockList] = useState(plannerBlocks);
  const [noteList, setNoteList] = useState(notes);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [taskDraft, setTaskDraft] = useState({ title: "", due: "", priority: "medium" as TaskPriority });
  const [blockDraft, setBlockDraft] = useState({ title: "", start: "", end: "" });
  const [noteDraft, setNoteDraft] = useState({ title: "", content: "" });

  const stats = useMemo(
    () => ({
      total: taskList.length,
      done: taskList.filter((t) => t.status === "done").length,
      doing: taskList.filter((t) => t.status === "doing").length,
    }),
    [taskList],
  );

  const addTask = () => {
    if (!taskDraft.title.trim()) return;
    const optimistic: Task = {
      id: `tmp-${Date.now()}`,
      user_id: "temp",
      title: taskDraft.title.trim(),
      description: null,
      due_date: taskDraft.due || null,
      priority: taskDraft.priority,
      status: "todo",
      sort_order: taskList.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setTaskList((prev) => [...prev, optimistic]);
    setTaskDraft({ title: "", due: "", priority: "medium" });
    startTransition(async () => {
      const res = await createTask({ title: optimistic.title, priority: optimistic.priority, dueDate: optimistic.due_date });
      if (!res.success) {
        setError(res.error);
        setTaskList((prev) => prev.filter((t) => t.id !== optimistic.id));
        return;
      }
      setTaskList((prev) => prev.map((t) => (t.id === optimistic.id ? { ...t, id: res.data!.id } : t)));
    });
  };

  const setStatus = (id: string, status: TaskStatus) => {
    setTaskList((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
    startTransition(async () => {
      const res = await updateTask(id, { status });
      if (!res.success) setError(res.error);
    });
  };

  const removeTask = (id: string) => {
    const prev = taskList;
    setTaskList((p) => p.filter((t) => t.id !== id));
    startTransition(async () => {
      const res = await deleteTask(id);
      if (!res.success) {
        setError(res.error);
        setTaskList(prev);
      }
    });
  };

  const addBlock = () => {
    if (!blockDraft.title.trim() || !blockDraft.start || !blockDraft.end) return;
    const optimistic: PlannerBlock = {
      id: `tmp-block-${Date.now()}`,
      user_id: "temp",
      title: blockDraft.title.trim(),
      starts_at: blockDraft.start,
      ends_at: blockDraft.end,
      color: "blue",
      linked_task_id: null,
      created_at: new Date().toISOString(),
    };
    setBlockList((prev) => [...prev, optimistic]);
    setBlockDraft({ title: "", start: "", end: "" });
    startTransition(async () => {
      const res = await savePlannerBlock({ title: optimistic.title, startsAt: optimistic.starts_at, endsAt: optimistic.ends_at });
      if (!res.success) {
        setError(res.error);
        setBlockList((prev) => prev.filter((b) => b.id !== optimistic.id));
        return;
      }
      setBlockList((prev) => prev.map((b) => (b.id === optimistic.id ? { ...b, id: res.data!.id } : b)));
    });
  };

  const removeBlock = (id: string) => {
    const prev = blockList;
    setBlockList((p) => p.filter((b) => b.id !== id));
    startTransition(async () => {
      const res = await deletePlannerBlock(id);
      if (!res.success) {
        setError(res.error);
        setBlockList(prev);
      }
    });
  };

  const addNote = () => {
    if (!noteDraft.title.trim()) return;
    const optimistic: Note = {
      id: `tmp-note-${Date.now()}`,
      user_id: "temp",
      title: noteDraft.title.trim(),
      content: noteDraft.content,
      pinned: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    setNoteList((prev) => [optimistic, ...prev]);
    setNoteDraft({ title: "", content: "" });
    startTransition(async () => {
      const res = await saveNote({ title: optimistic.title, content: optimistic.content });
      if (!res.success) {
        setError(res.error);
        setNoteList((prev) => prev.filter((n) => n.id !== optimistic.id));
        return;
      }
      setNoteList((prev) => prev.map((n) => (n.id === optimistic.id ? { ...n, id: res.data!.id } : n)));
    });
  };

  const pinNote = (id: string, pinned: boolean) => {
    setNoteList((prev) => prev.map((n) => (n.id === id ? { ...n, pinned } : n)));
    startTransition(async () => {
      const res = await toggleNotePin(id, pinned);
      if (!res.success) setError(res.error);
    });
  };

  const removeNote = (id: string) => {
    const prev = noteList;
    setNoteList((p) => p.filter((n) => n.id !== id));
    startTransition(async () => {
      const res = await deleteNote(id);
      if (!res.success) {
        setError(res.error);
        setNoteList(prev);
      }
    });
  };

  return (
    <div className="space-y-6">
      {error && <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 px-3 py-2 rounded-lg">{error}</div>}

      <section className="card p-5 space-y-4">
        <header className="flex items-center gap-3">
          <ListTodo className="text-[var(--accent)]" size={18} />
          <div>
            <p className="text-xs text-[var(--ink-muted)] uppercase tracking-[0.2em]">Tasks</p>
            <p className="text-sm text-[var(--ink-muted)]">Prioritize what matters today.</p>
          </div>
        </header>
        <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
          <input
            className="input"
            placeholder="Add a task"
            value={taskDraft.title}
            onChange={(e) => setTaskDraft((d) => ({ ...d, title: e.target.value }))}
          />
          <input
            type="date"
            className="input"
            value={taskDraft.due}
            onChange={(e) => setTaskDraft((d) => ({ ...d, due: e.target.value }))}
          />
          <select
            className="input"
            value={taskDraft.priority}
            onChange={(e) => setTaskDraft((d) => ({ ...d, priority: e.target.value as TaskPriority }))}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
          <button onClick={addTask} className="btn-primary flex items-center justify-center gap-2" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={16} />}
            Add
          </button>
        </div>
        <div className="divide-y divide-[var(--border)]">
          {taskList.length === 0 && <p className="text-sm text-[var(--ink-muted)] py-4">No tasks yet.</p>}
          {taskList.map((task) => (
            <div key={task.id} className="py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <button onClick={() => setStatus(task.id, task.status === "done" ? "todo" : "done")} className="text-[var(--ink-muted)] hover:text-[var(--accent)]">
                  <CheckCircle2 size={18} className={task.status === "done" ? "text-[var(--accent)]" : ""} />
                </button>
                <div>
                  <div className="flex flex-wrap gap-2 items-center">
                    <p className={`font-medium ${task.status === "done" ? "line-through text-[var(--ink-muted)]" : "text-ink"}`}>
                      {task.title}
                    </p>
                    <span className={`px-2 py-1 rounded-full text-[11px] ${priorityColor[task.priority]}`}>{task.priority}</span>
                    <span className="badge">{statusLabel[task.status]}</span>
                  </div>
                  <p className="text-xs text-[var(--ink-muted)] flex items-center gap-1">
                    <Clock3 size={12} /> {task.due_date ? new Date(task.due_date).toLocaleDateString() : "No due date"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <button className="btn-secondary px-3 py-1" onClick={() => setStatus(task.id, "doing")}>Start</button>
                <button className="btn-secondary px-3 py-1" onClick={() => removeTask(task.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="text-xs text-[var(--ink-muted)]">{stats.total} tasks · {stats.doing} in progress · {stats.done} done</div>
      </section>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-dashboard">
        <section className="card p-5 space-y-3">
          <header className="flex items-center gap-3">
            <CalendarClock className="text-[var(--accent)]" size={18} />
            <div>
              <p className="text-xs text-[var(--ink-muted)] uppercase tracking-[0.2em]">Planner</p>
              <p className="text-sm text-[var(--ink-muted)]">Time-block the day.</p>
            </div>
          </header>
          <div className="grid gap-2 sm:grid-cols-2">
            <input className="input" placeholder="Block title" value={blockDraft.title} onChange={(e) => setBlockDraft((d) => ({ ...d, title: e.target.value }))} />
            <input type="datetime-local" className="input" value={blockDraft.start} onChange={(e) => setBlockDraft((d) => ({ ...d, start: e.target.value }))} />
            <input type="datetime-local" className="input" value={blockDraft.end} onChange={(e) => setBlockDraft((d) => ({ ...d, end: e.target.value }))} />
            <button className="btn-primary" onClick={addBlock} disabled={pending}>Add block</button>
          </div>
          <div className="space-y-2">
            {blockList.length === 0 && <p className="text-sm text-[var(--ink-muted)]">No blocks yet.</p>}
            {blockList.map((b) => (
              <div key={b.id} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] flex items-start justify-between">
                <div>
                  <p className="font-medium text-ink">{b.title}</p>
                  <p className="text-xs text-[var(--ink-muted)]">
                    {new Date(b.starts_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    {" · "}
                    {new Date(b.ends_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
                <button className="btn-secondary px-2 text-rose-300" onClick={() => removeBlock(b.id)}>
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="card p-5 space-y-3">
          <header className="flex items-center gap-3">
            <NotebookPen className="text-[var(--accent)]" size={18} />
            <div>
              <p className="text-xs text-[var(--ink-muted)] uppercase tracking-[0.2em]">Notes</p>
              <p className="text-sm text-[var(--ink-muted)]">Quick capture for ideas.</p>
            </div>
          </header>
          <input className="input" placeholder="Note title" value={noteDraft.title} onChange={(e) => setNoteDraft((d) => ({ ...d, title: e.target.value }))} />
          <textarea className="input min-h-[120px]" placeholder="Write something" value={noteDraft.content} onChange={(e) => setNoteDraft((d) => ({ ...d, content: e.target.value }))} />
          <button className="btn-primary" onClick={addNote} disabled={pending}>Save note</button>
          <div className="grid gap-3 sm:grid-cols-2">
            {noteList.length === 0 && <p className="text-sm text-[var(--ink-muted)]">No notes yet.</p>}
            {noteList.map((n) => (
              <article key={n.id} className="p-3 rounded-lg border border-[var(--border)] bg-[var(--surface)] space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-semibold text-ink">{n.title}</p>
                  <div className="flex gap-1 text-xs">
                    <button className="btn-secondary px-2" onClick={() => pinNote(n.id, !n.pinned)}>{n.pinned ? "Unpin" : "Pin"}</button>
                    <button className="btn-secondary px-2 text-rose-300" onClick={() => removeNote(n.id)}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-[var(--ink-muted)] whitespace-pre-line">{n.content || "No content"}</p>
              </article>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
