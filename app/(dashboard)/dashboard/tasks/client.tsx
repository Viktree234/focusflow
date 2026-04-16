"use client";

import { useState, useMemo, useTransition } from "react";
import type { tasks } from "@/lib/db/schema";
import type { TaskPriority, TaskStatus } from "@/app/actions";
import { createTask, updateTask, deleteTask } from "@/app/actions";
import { CheckCircle2, Clock3, Trash2, Plus, Filter, LayoutList, Calendar, MoreHorizontal } from "lucide-react";

type Task = typeof tasks.$inferSelect;

const priorityColor: Record<TaskPriority, string> = {
  low: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  medium: "bg-amber-500/15 text-amber-300 border-amber-500/30",
  high: "bg-rose-500/15 text-rose-300 border-rose-500/30",
};

const statusLabel: Record<TaskStatus, string> = {
  todo: "To Do",
  doing: "In Progress",
  done: "Done",
};

const statusIcon: Record<TaskStatus, string> = {
  todo: "○",
  doing: "◐",
  done: "●",
};

export default function TasksClient({ tasks }: { tasks: Task[] }) {
  const [taskList, setTaskList] = useState(tasks);
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<"all" | TaskStatus>("all");
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", description: "", due: "", priority: "medium" as TaskPriority });
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");

  const filteredTasks = useMemo(() => {
    if (filter === "all") return taskList;
    return taskList.filter((t) => t.status === filter);
  }, [taskList, filter]);

  const stats = useMemo(
    () => ({
      total: taskList.length,
      todo: taskList.filter((t) => t.status === "todo").length,
      doing: taskList.filter((t) => t.status === "doing").length,
      done: taskList.filter((t) => t.status === "done").length,
    }),
    [taskList]
  );

  const addTask = () => {
    if (!formData.title.trim()) return;

    const optimistic: Task = {
      id: `tmp-${Date.now()}`,
      userId: "temp",
      title: formData.title.trim(),
      description: formData.description || null,
      dueDate: formData.due || null,
      priority: formData.priority,
      status: "todo",
      sortOrder: taskList.length,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setTaskList((prev) => [...prev, optimistic]);
    setFormData({ title: "", description: "", due: "", priority: "medium" });
    setShowForm(false);

    startTransition(async () => {
      const res = await createTask({
        title: optimistic.title,
        description: optimistic.description ?? undefined,
        priority: optimistic.priority,
        dueDate: optimistic.dueDate ?? undefined,
      });

      if (!res.success) {
        setTaskList((prev) => prev.filter((t) => t.id !== optimistic.id));
      } else {
        setTaskList((prev) => prev.map((t) => (t.id === optimistic.id ? { ...t, id: res.data!.id } : t)));
      }
    });
  };

  const setStatus = (id: string, status: TaskStatus) => {
    setTaskList((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));

    startTransition(async () => {
      const res = await updateTask(id, { status });
      if (!res.success) {
        setTaskList(tasks);
      }
    });
  };

  const removeTask = (id: string) => {
    const prev = taskList;
    setTaskList((p) => p.filter((t) => t.id !== id));

    startTransition(async () => {
      const res = await deleteTask(id);
      if (!res.success) setTaskList(prev);
    });
  };

  const saveTitle = (id: string) => {
    if (!editTitle.trim()) return;

    setTaskList((prev) => prev.map((t) => (t.id === id ? { ...t, title: editTitle.trim() } : t)));
    setEditingTask(null);

    startTransition(async () => {
      const res = await updateTask(id, { title: editTitle.trim() });
      if (!res.success) setTaskList(tasks);
    });
  };

  return (
    <div className="p-8">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tasks</h1>
          <p className="text-white/40">Manage and prioritize your to-dos</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          Add Task
        </button>
      </header>

      <div className="grid grid-cols-4 gap-4 mb-8">
        {(["all", "todo", "doing", "done"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`card p-4 text-left transition-all ${
              filter === f ? "border-[var(--accent)] bg-[var(--accent)]/5" : "hover:border-white/10"
            }`}
          >
            <p className="text-xs text-white/40 uppercase tracking-wider mb-1">
              {f === "all" ? "All Tasks" : statusLabel[f]}
            </p>
            <p className="text-2xl font-bold">
              {f === "all" ? stats.total : f === "todo" ? stats.todo : f === "doing" ? stats.doing : stats.done}
            </p>
          </button>
        ))}
      </div>

      <div className="card">
        <div className="divide-y divide-white/5">
          {filteredTasks.map((task) => {
            const priority = task.priority ?? "medium";
            return (
              <div key={task.id} className="p-4 flex items-center gap-4 hover:bg-white/[0.02] transition-colors group">
                <button
                  onClick={() => setStatus(task.id, task.status === "done" ? "todo" : "done")}
                  className={`text-lg ${task.status === "done" ? "text-emerald-400" : "text-white/30 hover:text-white/60"}`}
                >
                  {statusIcon[task.status ?? "todo"]}
                </button>

                <div className="flex-1 min-w-0">
                  {editingTask === task.id ? (
                    <input
                      className="input"
                      value={editTitle}
                      onChange={(e) => setEditTitle(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveTitle(task.id)}
                      onBlur={() => saveTitle(task.id)}
                      autoFocus
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      <p className={`font-medium truncate ${task.status === "done" ? "line-through text-white/40" : ""}`}>
                        {task.title}
                      </p>
                      {task.description && (
                        <span className="text-xs text-white/40 truncate max-w-[200px]">{task.description}</span>
                      )}
                    </div>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] border ${priorityColor[priority]}`}>
                      {priority}
                    </span>
                    {task.dueDate && (
                      <span className="text-xs text-white/40 flex items-center gap-1">
                        <Clock3 size={10} />
                        {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <select
                    value={task.status ?? "todo"}
                    onChange={(e) => setStatus(task.id, e.target.value as TaskStatus)}
                    className="input w-auto py-1 px-2 text-xs"
                  >
                    <option value="todo">To Do</option>
                    <option value="doing">In Progress</option>
                    <option value="done">Done</option>
                  </select>
                  <button
                    onClick={() => {
                      setEditingTask(task.id);
                      setEditTitle(task.title);
                    }}
                    className="p-2 text-white/40 hover:text-white"
                  >
                    ✎
                  </button>
                  <button onClick={() => removeTask(task.id)} className="p-2 text-white/40 hover:text-rose-400">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="p-12 text-center text-white/40">
              {filter === "all" ? "No tasks yet. Create your first task!" : `No ${filter} tasks found.`}
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Add New Task</h3>
            <input
              className="input"
              placeholder="Task title"
              value={formData.title}
              onChange={(e) => setFormData((d) => ({ ...d, title: e.target.value }))}
              autoFocus
            />
            <input
              className="input"
              placeholder="Description (optional)"
              value={formData.description}
              onChange={(e) => setFormData((d) => ({ ...d, description: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 block mb-1">Due Date</label>
                <input
                  type="date"
                  className="input"
                  value={formData.due}
                  onChange={(e) => setFormData((d) => ({ ...d, due: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1">Priority</label>
                <select
                  className="input"
                  value={formData.priority}
                  onChange={(e) => setFormData((d) => ({ ...d, priority: e.target.value as TaskPriority }))}
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={addTask} disabled={pending} className="btn-primary">
                {pending ? "Adding..." : "Add Task"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}