"use client";

import { useState, useTransition } from "react";
import type { notes } from "@/lib/db/schema";
import { saveNote, deleteNote, toggleNotePin } from "@/app/actions";
import { Plus, Trash2, Pin, Search, FileText, Bold, Italic, List, Heading, Link as LinkIcon, Image } from "lucide-react";

type Note = typeof notes.$inferSelect;

export default function NotesClient({ notes }: { notes: Note[] }) {
  const [noteList, setNoteList] = useState(notes);
  const [pending, startTransition] = useTransition();
  const [search, setSearch] = useState("");
  const [selectedNote, setSelectedNote] = useState<Note | null>(notes[0] || null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ title: "", content: "" });

  const filteredNotes = noteList.filter(
    (n) =>
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      (n.content ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const pinnedNotes = filteredNotes.filter((n) => n.pinned);
  const otherNotes = filteredNotes.filter((n) => !n.pinned);

  const createNote = () => {
    if (!formData.title.trim()) return;

    const optimistic: Note = {
      id: `tmp-${Date.now()}`,
      userId: "temp",
      title: formData.title.trim(),
      content: formData.content,
      pinned: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setNoteList((prev) => [optimistic, ...prev]);
    setSelectedNote(optimistic);
    setFormData({ title: "", content: "" });
    setShowForm(false);

    startTransition(async () => {
      const res = await saveNote({
        title: optimistic.title,
        content: optimistic.content ?? undefined,
      });

      if (!res.success) {
        setNoteList((prev) => prev.filter((n) => n.id !== optimistic.id));
      } else {
        setNoteList((prev) =>
          prev.map((n) => (n.id === optimistic.id ? { ...n, id: res.data!.id } : n))
        );
        setSelectedNote((prev) => (prev?.id === optimistic.id ? { ...prev, id: res.data!.id } : prev));
      }
    });
  };

  const updateNote = (content: string) => {
    if (!selectedNote) return;

    setNoteList((prev) =>
      prev.map((n) => (n.id === selectedNote.id ? { ...n, content, updatedAt: new Date() } : n))
    );

    startTransition(async () => {
      await saveNote({
        id: selectedNote.id,
        title: selectedNote.title,
        content,
      });
    });
  };

  const removeNote = (id: string) => {
    const prev = noteList;
    setNoteList((p) => p.filter((n) => n.id !== id));
    if (selectedNote?.id === id) setSelectedNote(null);

    startTransition(async () => {
      const res = await deleteNote(id);
      if (!res.success) setNoteList(prev);
    });
  };

  const pinNote = (id: string, pinned: boolean) => {
    setNoteList((prev) => prev.map((n) => (n.id === id ? { ...n, pinned } : n)));

    startTransition(async () => {
      const res = await toggleNotePin(id, pinned);
      if (!res.success) setNoteList(notes);
    });
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="p-8 h-[calc(100vh-2rem)]">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notes</h1>
          <p className="text-white/40">Capture ideas, lecture notes, and more</p>
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} />
          New Note
        </button>
      </div>

      <div className="flex gap-6 h-[calc(100%-5rem)]">
        <div className="w-72 flex flex-col gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" size={16} />
            <input
              className="input pl-9"
              placeholder="Search notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="flex-1 overflow-y-auto space-y-4">
            {pinnedNotes.length > 0 && (
              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2 px-2">Pinned</p>
                <div className="space-y-1">
                  {pinnedNotes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => setSelectedNote(note)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedNote?.id === note.id ? "bg-[var(--accent)]/10 border border-[var(--accent)]/30" : "hover:bg-white/5"
                      }`}
                    >
                      <p className="font-medium truncate">{note.title}</p>
                      <p className="text-xs text-white/40 truncate mt-1">{note.content || "No content"}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {otherNotes.length > 0 && (
              <div>
                {pinnedNotes.length > 0 && (
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-2 px-2">Notes</p>
                )}
                <div className="space-y-1">
                  {otherNotes.map((note) => (
                    <button
                      key={note.id}
                      onClick={() => setSelectedNote(note)}
                      className={`w-full text-left p-3 rounded-lg transition-colors ${
                        selectedNote?.id === note.id ? "bg-[var(--accent)]/10 border border-[var(--accent)]/30" : "hover:bg-white/5"
                      }`}
                    >
                      <p className="font-medium truncate">{note.title}</p>
                      <p className="text-xs text-white/40 truncate mt-1">{note.content || "No content"}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredNotes.length === 0 && (
              <div className="text-center py-8 text-white/40">
                <FileText size={32} className="mx-auto mb-2 opacity-30" />
                <p>No notes found</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 card flex flex-col">
          {selectedNote ? (
            <>
              <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div>
                  <h2 className="font-semibold">{selectedNote.title}</h2>
                  <p className="text-xs text-white/40">{formatDate(selectedNote.updatedAt ?? new Date())}</p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => pinNote(selectedNote.id, !selectedNote.pinned)}
                    className={`p-2 rounded-lg transition-colors ${
                      selectedNote.pinned ? "text-amber-400" : "text-white/40 hover:text-white"
                    }`}
                  >
                    <Pin size={16} className={selectedNote.pinned ? "fill-amber-400" : ""} />
                  </button>
                  <button
                    onClick={() => removeNote(selectedNote.id)}
                    className="p-2 text-white/40 hover:text-rose-400 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="p-2 border-b border-white/5 flex gap-1">
                <button className="p-2 text-white/40 hover:text-white rounded hover:bg-white/5">
                  <Bold size={16} />
                </button>
                <button className="p-2 text-white/40 hover:text-white rounded hover:bg-white/5">
                  <Italic size={16} />
                </button>
                <button className="p-2 text-white/40 hover:text-white rounded hover:bg-white/5">
                  <Heading size={16} />
                </button>
                <button className="p-2 text-white/40 hover:text-white rounded hover:bg-white/5">
                  <List size={16} />
                </button>
                <div className="w-px bg-white/10 mx-1" />
                <button className="p-2 text-white/40 hover:text-white rounded hover:bg-white/5">
                  <LinkIcon size={16} />
                </button>
              </div>

              <textarea
                className="flex-1 p-4 bg-transparent outline-none resize-none text-white/80 placeholder:text-white/30"
                placeholder="Start typing..."
                value={selectedNote.content ?? ""}
                onChange={(e) => updateNote(e.target.value)}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-white/40">
              <div className="text-center">
                <FileText size={48} className="mx-auto mb-2 opacity-30" />
                <p>Select a note to view or edit</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="card p-6 w-full max-w-md space-y-4">
            <h3 className="text-lg font-semibold">Create New Note</h3>
            <input
              className="input"
              placeholder="Note title"
              value={formData.title}
              onChange={(e) => setFormData((d) => ({ ...d, title: e.target.value }))}
              autoFocus
            />
            <textarea
              className="input min-h-[100px]"
              placeholder="Start writing..."
              value={formData.content}
              onChange={(e) => setFormData((d) => ({ ...d, content: e.target.value }))}
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
              <button onClick={createNote} disabled={pending} className="btn-primary">
                {pending ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}