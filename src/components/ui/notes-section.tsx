"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/lib/auth";
import { api, mapNote } from "@/lib/api";
import { Note } from "@/lib/types";
import { useToast } from "@/components/ui/toast";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { StickyNote, Send, Trash2, Pencil, X, Check } from "lucide-react";

interface NotesSectionProps {
  recordType: string;
  recordId: string;
}

export function NotesSection({ recordType, recordId }: NotesSectionProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [newContent, setNewContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const fetchNotes = useCallback(async () => {
    try {
      const raw = await api.getNotes(recordType, recordId);
      setNotes(raw.map(mapNote));
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [recordType, recordId]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const handleCreate = async () => {
    if (!newContent.trim()) return;
    try {
      await api.createNote({
        record_type: recordType,
        record_id: recordId,
        content: newContent.trim(),
        author_id: user?.id || "",
        author_name: user?.name || "",
      });
      setNewContent("");
      await fetchNotes();
      toast("Note added");
    } catch {
      toast("Failed to add note");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editContent.trim()) return;
    try {
      await api.updateNote(id, { content: editContent.trim() });
      setEditingId(null);
      setEditContent("");
      await fetchNotes();
      toast("Note updated");
    } catch {
      toast("Failed to update note");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteNote(id);
      setNotes((prev) => prev.filter((n) => n.id !== id));
      toast("Note deleted");
    } catch {
      toast("Failed to delete note");
    }
  };

  const startEdit = (note: Note) => {
    setEditingId(note.id);
    setEditContent(note.content);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <StickyNote size={16} style={{ color: "var(--text-secondary)" }} />
          <h2 className="font-semibold" style={{ color: "var(--text-primary)" }}>Notes ({notes.length})</h2>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {/* Add note form */}
        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--border-primary)" }}>
          <textarea
            ref={textareaRef}
            value={newContent}
            onChange={(e) => setNewContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) handleCreate();
            }}
            placeholder="Add a note..."
            rows={2}
            className="w-full text-[13px] px-3 py-2 rounded resize-none"
            style={{
              background: "var(--bg-tertiary)",
              border: "1px solid var(--border-primary)",
              color: "var(--text-primary)",
              outline: "none",
            }}
          />
          <div className="flex justify-end mt-2">
            <Button
              onClick={handleCreate}
              disabled={!newContent.trim()}
              className="text-[12px]"
            >
              <Send size={14} className="mr-1" /> Add Note
            </Button>
          </div>
        </div>

        {/* Notes list */}
        <div className="max-h-[400px] overflow-y-auto">
          {loading ? (
            <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--text-secondary)" }}>Loading notes...</p>
          ) : notes.length === 0 ? (
            <p className="px-4 py-6 text-sm text-center" style={{ color: "var(--text-secondary)" }}>No notes yet</p>
          ) : (
            notes.map((note) => (
              <div
                key={note.id}
                className="px-4 py-3 group"
                style={{ borderBottom: "1px solid var(--border-secondary)" }}
              >
                <div className="flex items-start gap-3">
                  <Avatar name={note.authorName || "?"} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12px] font-semibold" style={{ color: "var(--text-primary)" }}>
                        {note.authorName || "Unknown"}
                      </span>
                      <span className="text-[11px]" style={{ color: "var(--text-tertiary)" }}>
                        {formatDate(note.createdAt)}
                      </span>
                    </div>

                    {editingId === note.id ? (
                      <div>
                        <textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={3}
                          className="w-full text-[13px] px-2 py-1.5 rounded resize-none"
                          style={{
                            background: "var(--bg-tertiary)",
                            border: "1px solid var(--border-focus)",
                            color: "var(--text-primary)",
                            outline: "none",
                          }}
                          autoFocus
                        />
                        <div className="flex gap-1 mt-1">
                          <button onClick={() => handleUpdate(note.id)} className="p-1" style={{ color: "var(--accent-green)" }}>
                            <Check size={14} />
                          </button>
                          <button onClick={() => setEditingId(null)} className="p-1" style={{ color: "var(--text-tertiary)" }}>
                            <X size={14} />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-[13px] whitespace-pre-wrap" style={{ color: "var(--text-primary)" }}>
                        {note.content}
                      </p>
                    )}
                  </div>

                  {editingId !== note.id && (
                    <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => startEdit(note)} className="p-1" style={{ color: "var(--text-tertiary)" }}>
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => handleDelete(note.id)} className="p-1" style={{ color: "var(--accent-red)" }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
