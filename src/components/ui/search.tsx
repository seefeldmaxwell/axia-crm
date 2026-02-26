"use client";

import { useState, useRef, useEffect } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  className?: string;
}

export function Search({ placeholder = "Search...", value: externalValue, onChange, className }: SearchProps) {
  const [value, setValue] = useState(externalValue || "");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (externalValue !== undefined) setValue(externalValue);
  }, [externalValue]);

  const handleChange = (v: string) => {
    setValue(v);
    onChange?.(v);
  };

  return (
    <div className={cn("relative", className)}>
      <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-tertiary)" }} />
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-9 py-2 text-[13px] focus:outline-none"
        style={{
          border: "1px solid var(--border-primary)",
          borderRadius: "var(--radius-sm)",
          background: "var(--bg-quaternary)",
          color: "var(--text-primary)",
        }}
      />
      {value && (
        <button
          onClick={() => handleChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2"
          style={{ color: "var(--text-tertiary)" }}
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
