"use client";

import { cn } from "@/lib/utils";

interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, active, onChange, className }: TabsProps) {
  return (
    <div className={cn("flex", className)} style={{ borderBottom: "1px solid var(--border-primary)" }}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className="px-4 py-2.5 text-[13px] font-medium transition-colors relative"
          style={{
            color: active === tab.id ? "var(--accent-blue)" : "var(--text-tertiary)",
          }}
          onMouseEnter={(e) => { if (active !== tab.id) e.currentTarget.style.color = "var(--text-primary)"; }}
          onMouseLeave={(e) => { if (active !== tab.id) e.currentTarget.style.color = "var(--text-tertiary)"; }}
        >
          {tab.label}
          {active === tab.id && (
            <div className="absolute bottom-0 left-0 right-0 h-[2px]" style={{ background: "var(--accent-blue)" }} />
          )}
        </button>
      ))}
    </div>
  );
}
