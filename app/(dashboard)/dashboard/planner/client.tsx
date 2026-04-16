"use client";

import { useState, useMemo } from "react";
import type { plannerBlocks } from "@/lib/db/schema";
import { savePlannerBlock, deletePlannerBlock } from "@/app/actions";
import { useTransition } from "react";

type PlannerBlock = typeof plannerBlocks.$inferSelect;

const blockColors = [
  { name: "blue", bg: "bg-blue-500/20", border: "border-blue-500/40", text: "text-blue-300", dot: "bg-blue-400" },
  { name: "purple", bg: "bg-purple-500/20", border: "border-purple-500/40", text: "text-purple-300", dot: "bg-purple-400" },
  { name: "emerald", bg: "bg-emerald-500/20", border: "border-emerald-500/40", text: "text-emerald-300", dot: "bg-emerald-400" },
  { name: "amber", bg: "bg-amber-500/20", border: "border-amber-500/40", text: "text-amber-300", dot: "bg-amber-400" },
  { name: "rose", bg: "bg-rose-500/20", border: "border-rose-500/40", text: "text-rose-300", dot: "bg-rose-400" },
];

const hours = Array.from({ length: 15 }, (_, i) => i + 7);

export default function PlannerClient({ blocks }: { blocks: PlannerBlock[] }) {
  const [blockList, setBlockList] = useState(blocks);
  const [pending, startTransition] = useTransition();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", start: "", end: "", color: "blue" });

  const weekDays = useMemo(() => {
    const start = new Date(currentDate);
    start.setDate(start.getDate() - start.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      return d;
    });
  }, [currentDate]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getBlocksForDay = (date: Date) => {
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    return blockList.filter((b) => {
      const start = new Date(b.startsAt);
      const end = new Date(b.endsAt);
      return start <= dayEnd && end >= dayStart;
    });
  };

  const getBlockPosition = (block: PlannerBlock) => {
    const start = new Date(block.startsAt);
    const end = new Date(block.endsAt);
    const startHour = start.getHours() + start.getMinutes() / 60;
    const endHour = end.getHours() + end.getMinutes() / 60;
    const top = (startHour - 7) * 60;
    const height = (endHour - startHour) * 60;
    return { top, height: Math.max(height, 20) };
  };

  const addBlock = () => {
    if (!formData.title.trim() || !formData.start || !formData.end) return;

    const newBlock: PlannerBlock = {
      id: `tmp-${Date.now()}`,
      userId: "temp",
      title: formData.title.trim(),
      startsAt: new Date(formData.start),
      endsAt: new Date(formData.end),
      color: formData.color,
      linkedTaskId: null,
      createdAt: new Date(),
    };

    setBlockList((prev) => [...prev, newBlock]);
    setFormData({ title: "", start: "", end: "", color: "blue" });
    setShowForm(false);

    startTransition(async () => {
      const res = await savePlannerBlock({
        title: newBlock.title,
        startsAt: newBlock.startsAt.toISOString(),
        endsAt: newBlock.endsAt.toISOString(),
        color: newBlock.color ?? undefined,
      });

      if (!res.success) {
        setBlockList((prev) => prev.filter((b) => b.id !== newBlock.id));
      }
    });
  };

  const removeBlock = (id: string) => {
    const prev = blockList;
    setBlockList((p) => p.filter((b) => b.id !== id));

    startTransition(async () => {
      const res = await deletePlannerBlock(id);
      if (!res.success) setBlockList(prev);
    });
  };

  const prevWeek = () => {
    setCurrentDate((d) => {
      const newDate = new Date(d);
      newDate.setDate(newDate.getDate() - 7);
      return newDate;
    });
  };

  const nextWeek = () => {
    setCurrentDate((d) => {
      const newDate = new Date(d);
      newDate.setDate(newDate.getDate() + 7);
      return newDate;
    });
  };

  const goToToday = () => setCurrentDate(new Date());

  const formatWeekRange = () => {
    const start = weekDays[0];
    const end = weekDays[6];
    const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };
    return `${start.toLocaleDateString("en-US", opts)} - ${end.toLocaleDateString("en-US", opts)}`;
  };

  return (
    <div className="p-8">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Schedule Planner</h1>
          <p className="text-white/40">Organize your study sessions and appointments</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          + Add Block
        </button>
      </header>

      <div className="card overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <button onClick={prevWeek} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              ←
            </button>
            <button onClick={nextWeek} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
              →
            </button>
            <h2 className="font-semibold ml-2">{formatWeekRange()}</h2>
          </div>
          <button onClick={goToToday} className="px-3 py-1 text-sm border border-white/10 rounded-lg hover:bg-white/5">
            Today
          </button>
        </div>

        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <div className="grid grid-cols-8 border-b border-white/5">
              <div className="p-3 text-xs text-white/40 font-medium border-r border-white/5"></div>
              {weekDays.map((day, i) => {
                const isToday = day.getTime() === today.getTime();
                return (
                  <div
                    key={i}
                    className={`p-3 text-center border-r border-white/5 ${isToday ? "bg-[var(--accent)]/10" : ""}`}
                  >
                    <p className="text-xs text-white/40 uppercase">{day.toLocaleDateString("en-US", { weekday: "short" })}</p>
                    <p className={`text-lg font-semibold ${isToday ? "text-[var(--accent)]" : ""}`}>{day.getDate()}</p>
                  </div>
                );
              })}
            </div>

            <div className="relative">
              {hours.map((hour) => (
                <div key={hour} className="grid grid-cols-8 border-b border-white/5 h-[60px]">
                  <div className="p-2 text-xs text-white/40 border-r border-white/5">
                    {hour % 12 || 12} {hour < 12 ? "AM" : "PM"}
                  </div>
                  {Array.from({ length: 7 }).map((_, i) => (
                    <div key={i} className="border-r border-white/5"></div>
                  ))}
                </div>
              ))}

              {weekDays.map((day, dayIndex) => {
                const dayBlocks = getBlocksForDay(day);
                return dayBlocks.map((block) => {
                  const color = blockColors.find((c) => c.name === block.color) || blockColors[0];
                  const pos = getBlockPosition(block);
                  const dayStart = new Date(day);
                  dayStart.setHours(0, 0, 0, 0);
                  const isToday = dayStart.getTime() === today.getTime();

                  return (
                    <div
                      key={block.id}
                      className={`absolute ${color.bg} border-l-4 ${color.border} rounded-r-lg p-2 overflow-hidden cursor-pointer group`}
                      style={{
                        left: `${(dayIndex + 1) * 12.5}%`,
                        top: `${pos.top}px`,
                        height: `${pos.height}px`,
                        width: "12.5%",
                      }}
                    >
                      <p className={`text-xs font-medium ${color.text} truncate`}>{block.title}</p>
                      <p className={`text-[10px] ${color.text} opacity-60`}>
                        {new Date(block.startsAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeBlock(block.id);
                        }}
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 text-white/40 hover:text-rose-400 transition-opacity"
                      >
                        ×
                      </button>
                    </div>
                  );
                });
              })}
            </div>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Add Time Block</h3>
            <input
              className="input"
              placeholder="Study session, class, etc."
              value={formData.title}
              onChange={(e) => setFormData((d) => ({ ...d, title: e.target.value }))}
            />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-white/40 block mb-1">Start</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={formData.start}
                  onChange={(e) => setFormData((d) => ({ ...d, start: e.target.value }))}
                />
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1">End</label>
                <input
                  type="datetime-local"
                  className="input"
                  value={formData.end}
                  onChange={(e) => setFormData((d) => ({ ...d, end: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-white/40">Color:</span>
              {blockColors.map((c) => (
                <button
                  key={c.name}
                  onClick={() => setFormData((d) => ({ ...d, color: c.name }))}
                  className={`w-6 h-6 rounded-full ${c.dot} ${formData.color === c.name ? "ring-2 ring-white" : ""}`}
                />
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={addBlock} disabled={pending} className="btn-primary">
                {pending ? "Adding..." : "Add Block"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}