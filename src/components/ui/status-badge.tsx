"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export type StatusOption = {
  value: string;
  label: string;
  color: string;
  bg: string;
};

interface StatusBadgeProps {
  value: string;
  options: StatusOption[];
  onChange: (newValue: string) => void;
  disabled?: boolean;
}

export function StatusBadge({ value, options, onChange, disabled }: StatusBadgeProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = options.find((o) => o.value === value) || options[0];

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (!disabled) setOpen(!open);
        }}
        className="inline-flex items-center gap-1 px-2 py-[2px] text-[11px] font-medium leading-tight transition-all cursor-pointer"
        style={{
          background: current.bg,
          color: current.color,
          borderRadius: "var(--radius-sm)",
          fontFamily: "var(--font-mono)",
          border: "1px solid transparent",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = current.color; }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = "transparent"; }}
      >
        <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: current.color }} />
        {current.label}
        <ChevronDown size={10} />
      </button>

      {open && (
        <div
          className="absolute left-0 mt-1 py-1 z-50 min-w-[140px]"
          style={{
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-primary)",
            borderRadius: "var(--radius-md)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={(e) => {
                e.stopPropagation();
                onChange(opt.value);
                setOpen(false);
              }}
              className="flex items-center gap-2 w-full px-3 py-1.5 text-[12px] text-left transition-colors"
              style={{
                color: opt.value === value ? opt.color : "var(--text-primary)",
                background: opt.value === value ? opt.bg : "transparent",
              }}
              onMouseEnter={(e) => { if (opt.value !== value) e.currentTarget.style.background = "var(--bg-tertiary)"; }}
              onMouseLeave={(e) => { if (opt.value !== value) e.currentTarget.style.background = "transparent"; }}
            >
              <span className="w-[6px] h-[6px] rounded-full flex-shrink-0" style={{ background: opt.color }} />
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Pre-built status configs ──

export const LEAD_STATUSES: StatusOption[] = [
  { value: "New", label: "New", color: "var(--accent-blue)", bg: "var(--accent-blue-muted)" },
  { value: "Contacted", label: "Contacted", color: "var(--accent-yellow)", bg: "var(--accent-yellow-muted)" },
  { value: "Qualified", label: "Qualified", color: "var(--accent-green)", bg: "var(--accent-green-muted)" },
  { value: "Unqualified", label: "Unqualified", color: "var(--accent-red)", bg: "var(--accent-red-muted)" },
  { value: "Converted", label: "Converted", color: "var(--accent-purple)", bg: "rgba(101,84,192,0.15)" },
];

export const VENDOR_STATUSES: StatusOption[] = [
  { value: "Active", label: "Active", color: "var(--accent-green)", bg: "var(--accent-green-muted)" },
  { value: "Pending", label: "Pending", color: "var(--accent-yellow)", bg: "var(--accent-yellow-muted)" },
  { value: "Inactive", label: "Inactive", color: "var(--accent-red)", bg: "var(--accent-red-muted)" },
];

export const CLIENT_STATUSES: StatusOption[] = [
  { value: "Active", label: "Active", color: "var(--accent-green)", bg: "var(--accent-green-muted)" },
  { value: "At Risk", label: "At Risk", color: "var(--accent-yellow)", bg: "var(--accent-yellow-muted)" },
  { value: "Churned", label: "Churned", color: "var(--accent-red)", bg: "var(--accent-red-muted)" },
];
