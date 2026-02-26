"use client";

import { useState, useRef, useEffect } from "react";
import { Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface InlineEditProps {
  value: string;
  onSave: (value: string) => void;
  label?: string;
  className?: string;
  type?: "text" | "email" | "tel" | "url";
}

export function InlineEdit({ value, onSave, label, className, type = "text" }: InlineEditProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editing]);

  useEffect(() => {
    setDraft(value);
  }, [value]);

  const save = () => {
    onSave(draft);
    setEditing(false);
  };

  const cancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className={cn("flex items-center gap-1", className)}>
        {label && (
          <span className="text-xs text-zen-text-secondary uppercase tracking-wide min-w-[100px]">
            {label}
          </span>
        )}
        <input
          ref={inputRef}
          type={type}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") save(); if (e.key === "Escape") cancel(); }}
          className="flex-1 px-2 py-1 text-sm border border-zen-primary rounded-lg bg-zen-bg text-zen-text focus:outline-none focus:ring-2 focus:ring-zen-ring"
        />
        <button onClick={save} className="p-1 text-zen-success hover:bg-zen-success/10 rounded">
          <Check size={14} />
        </button>
        <button onClick={cancel} className="p-1 text-zen-error hover:bg-zen-error/10 rounded">
          <X size={14} />
        </button>
      </div>
    );
  }

  return (
    <div className={cn("group flex items-center gap-1", className)}>
      {label && (
        <span className="text-xs text-zen-text-secondary uppercase tracking-wide min-w-[100px]">
          {label}
        </span>
      )}
      <span className="flex-1 text-sm text-zen-text">{value || "—"}</span>
      <button
        onClick={() => setEditing(true)}
        className="p-1 text-zen-text-muted opacity-0 group-hover:opacity-100 hover:bg-zen-surface-hover rounded transition-opacity"
      >
        <Pencil size={12} />
      </button>
    </div>
  );
}
