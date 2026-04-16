"use client";

import { useState, useMemo, useTransition } from "react";
import type { TaskPriority, TaskStatus } from "@/app/actions";
import type { tasks, plannerBlocks, notes } from "@/lib/db/schema";

type Task = typeof tasks.$inferSelect;
type PlannerBlock = typeof plannerBlocks.$inferSelect;
type Note = typeof notes.$inferSelect;

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

import {
  Plus,
  Loader2,
  CheckCircle2,
  Clock3,
  Trash2,
  NotebookPen,
  CalendarClock,
  ListTodo,
} from "lucide-react";

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

export default function ProductivityClient({
  tasks,
  plannerBlocks,
  notes,
}: Props) {
  const [taskList, setTaskList] = useState(tasks);
  const [blockList, setBlockList] = useState(plannerBlocks);
  const [noteList, setNoteList] = useState(notes);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [taskDraft, setTaskDraft] = useState({
    title: "",
    due: "",
    priority: "medium" as TaskPriority,
  });

  const [blockDraft, setBlockDraft] = useState({
    title: "",
    start: "",
    end: "",
  });

  const [noteDraft, setNoteDraft] = useState({
    title: "",
    content: "",
  });

  const stats = useMemo(
    () => ({
      total: taskList.length,
      done: taskList.filter((t) => t.status === "done").length,
      doing: taskList.filter((t) => t.status === "doing").length,
    }),
    [taskList]
  );

  const addTask = () => {
    if (!taskDraft.title.trim()) return;

    const optimistic: Task = {
      id: `tmp-${Date.now()}`,
      userId: "temp",
      title: taskDraft.title.trim(),
      description: null,
      dueDate: taskDraft.due || null,
      priority: taskDraft.priority,
      status: "todo",
      sortOrder: taskList.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTaskList((prev) => [...prev, optimistic]);
    setTaskDraft({ title: "", due: "", priority: "medium" });

    startTransition(async () => {
      const res = await createTask({
        title: optimistic.title,
        priority: optimistic.priority ?? undefined,
        dueDate:
          optimistic.dueDate === undefined
            ? undefined
            : optimistic.dueDate,
      });

      if (!res.success) {
        setError(res.error);
        setTaskList((prev) =>
          prev.filter((t) => t.id !== optimistic.id)
        );
        return;
      }

      setTaskList((prev) =>
        prev.map((t) =>
          t.id === optimistic.id ? { ...t, id: res.data!.id } : t
        )
      );
    });
  };

  const setStatus = (id: string, status: TaskStatus) => {
    setTaskList((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status } : t))
    );

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
    if (!blockDraft.title.trim() || !blockDraft.start || !blockDraft.end)
      return;

    const optimistic: PlannerBlock = {
      id: `tmp-block-${Date.now()}`,
      userId: "temp",
      title: blockDraft.title.trim(),
      startsAt: new Date(blockDraft.start),
      endsAt: new Date(blockDraft.end),
      color: "blue",
      linkedTaskId: null,
      createdAt: new Date(),
    };

    setBlockList((prev) => [...prev, optimistic]);
    setBlockDraft({ title: "", start: "", end: "" });

    startTransition(async () => {
      const res = await savePlannerBlock({
        title: optimistic.title,
        startsAt: optimistic.startsAt.toISOString(),
        endsAt: optimistic.endsAt.toISOString(),
      });

      if (!res.success) {
        setError(res.error);
        setBlockList((prev) =>
          prev.filter((b) => b.id !== optimistic.id)
        );
        return;
      }

      setBlockList((prev) =>
        prev.map((b) =>
          b.id === optimistic.id ? { ...b, id: res.data!.id } : b
        )
      );
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
      userId: "temp",
      title: noteDraft.title.trim(),
      content: noteDraft.content,
      pinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setNoteList((prev) => [optimistic, ...prev]);
    setNoteDraft({ title: "", content: "" });

    startTransition(async () => {
      const res = await saveNote({
        title: optimistic.title,
        content: optimistic.content ?? "",
      });

      if (!res.success) {
        setError(res.error);
        setNoteList((prev) =>
          prev.filter((n) => n.id !== optimistic.id)
        );
        return;
      }

      setNoteList((prev) =>
        prev.map((n) =>
          n.id === optimistic.id ? { ...n, id: res.data!.id } : n
        )
      );
    });
  };

  const pinNote = (id: string, pinned: boolean) => {
    setNoteList((prev) =>
      prev.map((n) => (n.id === id ? { ...n, pinned } : n))
    );

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
      {error && (
        <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      <section className="card p-5 space-y-4">
        <header className="flex items-center gap-3">
          <ListTodo className="text-[var(--accent)]" size={18} />
          <div>
            <p className="text-xs text-[var(--ink-muted)] uppercase tracking-[0.2em]">
              Tasks
            </p>
            <p className="text-sm text-[var(--ink-muted)]">
              Prioritize what matters today.
            </p>
          </div>
        </header>

        <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
          <input
            className="input"
            placeholder="Add a task"
            value={taskDraft.title}
            onChange={(e) =>
              setTaskDraft((d) => ({ ...d, title: e.target.value }))
            }
          />

          <input
            type="date"
            className="input"
            value={taskDraft.due}
            onChange={(e) =>
              setTaskDraft((d) => ({ ...d, due: e.target.value }))
            }
          />

          <select
            className="input"
            value={taskDraft.priority}
            onChange={(e) =>
              setTaskDraft((d) => ({
                ...d,
                priority: e.target.value as TaskPriority,
              }))
            }
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>

          <button
            onClick={addTask}
            className="btn-primary flex items-center justify-center gap-2"
            disabled={pending}
          >
            {pending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Add
          </button>
        </div>

        <div className="divide-y divide-[var(--border)]">
          {taskList.map((task) => {
            const priority = task.priority ?? "medium";

            return (
              <div
                key={task.id}
                className="py-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="flex items-start gap-3">
                  <button
                    onClick={() =>
                      setStatus(
                        task.id,
                        task.status === "done" ? "todo" : "done"
                      )
                    }
                  >
                    <CheckCircle2 size={18} />
                  </button>

                  <div>
                    <div className="flex flex-wrap gap-2 items-center">
                      <p
                        className={`font-medium ${
                          task.status === "done"
                            ? "line-through text-[var(--ink-muted)]"
                            : "text-ink"
                        }`}
                      >
                        {task.title}
                      </p>

                      <span
                        className={`px-2 py-1 rounded-full text-[11px] ${
                          priorityColor[priority]
                        }`}
                      >
                        {priority}
                      </span>

                      <span className="badge">
                        {statusLabel[task.status ?? "todo"]}
                      </span>
                    </div>

                    <p className="text-xs text-[var(--ink-muted)] flex items-center gap-1">
                      <Clock3 size={12} />
                      {task.dueDate
                        ? new Date(task.dueDate).toLocaleDateString()
                        : "No due date"}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <button
                    className="btn-secondary px-3 py-1"
                    onClick={() => setStatus(task.id, "doing")}
                  >
                    Start
                  </button>

                  <button
                    className="btn-secondary px-3 py-1"
                    onClick={() => removeTask(task.id)}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <div className="text-xs text-[var(--ink-muted)]">
          {stats.total} tasks · {stats.doing} in progress · {stats.done} done
        </div>
      </section>
    </div>
  );
}