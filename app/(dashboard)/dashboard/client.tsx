"use client";

import { useState, useMemo, useTransition } from "react";
import type { TaskPriority, TaskStatus } from "@/app/actions";
import type { tasks, plannerBlocks, notes } from "@/lib/db/schema";
import type { DefaultSession } from "next-auth";

type Task = typeof tasks.$inferSelect;
type PlannerBlock = typeof plannerBlocks.$inferSelect;
type Note = typeof notes.$inferSelect;

type User = DefaultSession["user"];

import {
  createTask,
  updateTask,
  deleteTask,
  savePlannerBlock,
  deletePlannerBlock,
  saveNote,
  deleteNote,
  toggleNotePin,
} from "@/app/actions";

import {
  Plus,
  Loader2,
  CheckCircle2,
  Clock3,
  Trash2,
  Calendar as CalendarIcon,
  ListTodo,
  FileText,
  Target,
  TrendingUp,
  CalendarDays,
  Pin,
  GripVertical,
  Edit3,
} from "lucide-react";

interface Props {
  user: User | null;
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

const blockColors = [
  { name: "blue", bg: "bg-blue-500/20", border: "border-blue-500/30", text: "text-blue-300" },
  { name: "purple", bg: "bg-purple-500/20", border: "border-purple-500/30", text: "text-purple-300" },
  { name: "emerald", bg: "bg-emerald-500/20", border: "border-emerald-500/30", text: "text-emerald-300" },
  { name: "amber", bg: "bg-amber-500/20", border: "border-amber-500/30", text: "text-amber-300" },
  { name: "rose", bg: "bg-rose-500/20", border: "border-rose-500/30", text: "text-rose-300" },
];

export default function DashboardClient({ user, tasks, plannerBlocks, notes }: Props) {
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
    color: "blue",
  });

  const [noteDraft, setNoteDraft] = useState({
    title: "",
    content: "",
  });

  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTaskTitle, setEditTaskTitle] = useState("");

  const stats = useMemo(
    () => ({
      total: taskList.length,
      done: taskList.filter((t) => t.status === "done").length,
      doing: taskList.filter((t) => t.status === "doing").length,
      completionRate: taskList.length ? Math.round((taskList.filter((t) => t.status === "done").length / taskList.length) * 100) : 0,
    }),
    [taskList]
  );

  const upcomingBlocks = useMemo(() => {
    const now = new Date();
    return blockList
      .filter((b) => new Date(b.startsAt) >= now)
      .sort((a, b) => new Date(a.startsAt).getTime() - new Date(b.startsAt).getTime())
      .slice(0, 3);
  }, [blockList]);

  const recentNotes = useMemo(() => noteList.slice(0, 4), [noteList]);

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
        dueDate: optimistic.dueDate === undefined ? undefined : optimistic.dueDate,
      });

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

  const startEditing = (task: Task) => {
    setEditingTask(task.id);
    setEditTaskTitle(task.title);
  };

  const saveEdit = (id: string) => {
    if (!editTaskTitle.trim()) return;

    setTaskList((prev) => prev.map((t) => (t.id === id ? { ...t, title: editTaskTitle.trim() } : t)));
    setEditingTask(null);

    startTransition(async () => {
      const res = await updateTask(id, { title: editTaskTitle.trim() });
      if (!res.success) setError(res.error);
    });
  };

  const addBlock = () => {
    if (!blockDraft.title.trim() || !blockDraft.start || !blockDraft.end) return;

    const optimistic: PlannerBlock = {
      id: `tmp-block-${Date.now()}`,
      userId: "temp",
      title: blockDraft.title.trim(),
      startsAt: new Date(blockDraft.start),
      endsAt: new Date(blockDraft.end),
      color: blockDraft.color,
      linkedTaskId: null,
      createdAt: new Date(),
    };

    setBlockList((prev) => [...prev, optimistic]);
    setBlockDraft({ title: "", start: "", end: "", color: "blue" });

    startTransition(async () => {
      const res = await savePlannerBlock({
        title: optimistic.title,
        startsAt: optimistic.startsAt.toISOString(),
        endsAt: optimistic.endsAt.toISOString(),
        color: optimistic.color ?? undefined,
      });

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
    <div className="p-8 space-y-8">
      {error && (
        <div className="text-sm text-rose-300 bg-rose-500/10 border border-rose-500/30 px-4 py-3 rounded-lg flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-white/40 hover:text-white">
            ×
          </button>
        </div>
      )}

      <header className="flex items-center justify-between">
        <div>
          <p className="text-sm text-white/40">Welcome back,</p>
          <h1 className="text-3xl font-bold">{user?.name || "Student"}</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-xl bg-white/5 border border-white/5">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Today&apos;s Progress</p>
            <p className="text-2xl font-bold text-[var(--accent)]">{stats.completionRate}%</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-gradient-to-br from-[var(--accent)]/10 to-transparent border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent)]/20 flex items-center justify-center">
              <Target className="text-[var(--accent)]" size={20} />
            </div>
            <div>
              <p className="text-sm text-white/40">Total Tasks</p>
              <p className="text-2xl font-bold">{stats.total}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-white/60">{stats.doing} in progress</span>
            <span className="text-emerald-400">{stats.done} completed</span>
          </div>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-purple-500/10 to-transparent border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <CalendarDays className="text-purple-400" size={20} />
            </div>
            <div>
              <p className="text-sm text-white/40">Scheduled Blocks</p>
              <p className="text-2xl font-bold">{blockList.length}</p>
            </div>
          </div>
          <p className="text-sm text-white/60">{upcomingBlocks.length} coming up today</p>
        </div>

        <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-transparent border border-white/5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <FileText className="text-emerald-400" size={20} />
            </div>
            <div>
              <p className="text-sm text-white/40">Notes</p>
              <p className="text-2xl font-bold">{noteList.length}</p>
            </div>
          </div>
          <p className="text-sm text-white/60">{noteList.filter((n) => n.pinned).length} pinned</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <section className="card p-6 space-y-4">
          <header className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <ListTodo className="text-[var(--accent)]" size={20} />
              <div>
                <h2 className="font-semibold">Tasks</h2>
                <p className="text-xs text-white/40">Prioritize what matters</p>
              </div>
            </div>
          </header>

          <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr_auto]">
            <input
              className="input"
              placeholder="Add a task..."
              value={taskDraft.title}
              onChange={(e) => setTaskDraft((d) => ({ ...d, title: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && addTask()}
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
            </button>
          </div>

          <div className="divide-y divide-white/5">
            {taskList.slice(0, 5).map((task) => {
              const priority = task.priority ?? "medium";
              return (
                <div key={task.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <button onClick={() => setStatus(task.id, task.status === "done" ? "todo" : "done")}>
                      <CheckCircle2 size={18} className={task.status === "done" ? "text-emerald-400" : "text-white/30"} />
                    </button>
                    <div className="flex-1 min-w-0">
                      {editingTask === task.id ? (
                        <input
                          className="input w-full"
                          value={editTaskTitle}
                          onChange={(e) => setEditTaskTitle(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && saveEdit(task.id)}
                          onBlur={() => saveEdit(task.id)}
                          autoFocus
                        />
                      ) : (
                        <p className={`font-medium truncate ${task.status === "done" ? "line-through text-white/40" : ""}`}>
                          {task.title}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${priorityColor[priority]}`}>{priority}</span>
                        {task.dueDate && (
                          <span className="text-xs text-white/40 flex items-center gap-1">
                            <Clock3 size={10} />
                            {new Date(task.dueDate).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => startEditing(task)} className="p-2 text-white/40 hover:text-white transition-colors">
                      <Edit3 size={14} />
                    </button>
                    <button onClick={() => removeTask(task.id)} className="p-2 text-white/40 hover:text-rose-400 transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            {taskList.length === 0 && (
              <p className="py-8 text-center text-white/40">No tasks yet. Add one above!</p>
            )}
          </div>
        </section>

        <section className="card p-6 space-y-4">
          <header className="flex items-center gap-3">
            <CalendarIcon className="text-purple-400" size={20} />
            <div>
              <h2 className="font-semibold">Schedule Planner</h2>
              <p className="text-xs text-white/40">Block your study time</p>
            </div>
          </header>

          <div className="grid gap-2 sm:grid-cols-[2fr_1fr_1fr]">
            <input
              className="input"
              placeholder="Study session..."
              value={blockDraft.title}
              onChange={(e) => setBlockDraft((d) => ({ ...d, title: e.target.value }))}
            />
            <input
              type="datetime-local"
              className="input"
              value={blockDraft.start}
              onChange={(e) => setBlockDraft((d) => ({ ...d, start: e.target.value }))}
            />
            <input
              type="datetime-local"
              className="input"
              value={blockDraft.end}
              onChange={(e) => setBlockDraft((d) => ({ ...d, end: e.target.value }))}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-white/40">Color:</span>
            {blockColors.map((c) => (
              <button
                key={c.name}
                onClick={() => setBlockDraft((d) => ({ ...d, color: c.name }))}
                className={`w-5 h-5 rounded-full ${c.bg} ${blockDraft.color === c.name ? "ring-2 ring-white" : ""}`}
              />
            ))}
            <button onClick={addBlock} className="btn-primary ml-auto flex items-center gap-2" disabled={pending}>
              {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={14} />}
              Add
            </button>
          </div>

          <div className="space-y-2">
            {upcomingBlocks.map((block) => {
              const color = blockColors.find((c) => c.name === block.color) || blockColors[0];
              return (
                <div key={block.id} className={`p-4 rounded-xl ${color.bg} border ${color.border}`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`font-medium ${color.text}`}>{block.title}</p>
                      <p className="text-xs text-white/60 mt-1">
                        {new Date(block.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} -{" "}
                        {new Date(block.endsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <button onClick={() => removeBlock(block.id)} className={`p-2 ${color.text} opacity-60 hover:opacity-100`}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
            {upcomingBlocks.length === 0 && (
              <p className="py-8 text-center text-white/40">No upcoming sessions. Add one above!</p>
            )}
          </div>
        </section>
      </div>

      <section className="card p-6 space-y-4">
        <header className="flex items-center gap-3">
          <FileText className="text-emerald-400" size={20} />
          <div>
            <h2 className="font-semibold">Notes</h2>
            <p className="text-xs text-white/40">Capture ideas and lecture notes</p>
          </div>
        </header>

        <div className="flex gap-2">
          <input
            className="input flex-1"
            placeholder="Note title..."
            value={noteDraft.title}
            onChange={(e) => setNoteDraft((d) => ({ ...d, title: e.target.value }))}
          />
          <input
            className="input flex-[2]"
            placeholder="Quick note..."
            value={noteDraft.content}
            onChange={(e) => setNoteDraft((d) => ({ ...d, content: e.target.value }))}
          />
          <button onClick={addNote} className="btn-primary flex items-center gap-2" disabled={pending}>
            {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus size={14} />}
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recentNotes.map((note) => (
            <div key={note.id} className="p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors group">
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-medium truncate">{note.title}</h3>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => pinNote(note.id, !note.pinned)} className="p-1 text-white/40 hover:text-amber-400">
                    <Pin size={12} className={note.pinned ? "fill-amber-400 text-amber-400" : ""} />
                  </button>
                  <button onClick={() => removeNote(note.id)} className="p-1 text-white/40 hover:text-rose-400">
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
              <p className="text-sm text-white/40 line-clamp-2">{note.content || "No content"}</p>
            </div>
          ))}
          {recentNotes.length === 0 && (
            <div className="col-span-4 py-8 text-center text-white/40">No notes yet. Create one above!</div>
          )}
        </div>
      </section>
    </div>
  );
}