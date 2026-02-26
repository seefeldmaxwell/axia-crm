"use client";

import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, id, ...props }, ref) => (
    <div className="relative">
      {label && (
        <label
          htmlFor={id}
          className="block text-[12px] font-medium mb-1"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={id}
        className={cn("w-full px-3 py-2 text-[13px] focus:outline-none", className)}
        style={{
          border: "1px solid var(--border-primary)",
          borderRadius: "var(--radius-sm)",
          background: "var(--bg-quaternary)",
          color: "var(--text-primary)",
        }}
        {...props}
      />
    </div>
  )
);
Input.displayName = "Input";

export { Input };

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, id, ...props }, ref) => (
    <div className="relative">
      {label && (
        <label
          htmlFor={id}
          className="block text-[12px] font-medium mb-1"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        className={cn("w-full px-3 py-2 text-[13px] resize-y focus:outline-none", className)}
        style={{
          border: "1px solid var(--border-primary)",
          borderRadius: "var(--radius-sm)",
          background: "var(--bg-quaternary)",
          color: "var(--text-primary)",
        }}
        {...props}
      />
    </div>
  )
);
Textarea.displayName = "Textarea";

export { Textarea };

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: { value: string; label: string }[];
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, id, options, ...props }, ref) => (
    <div className="relative">
      {label && (
        <label
          htmlFor={id}
          className="block text-[12px] font-medium mb-1"
          style={{ color: "var(--text-secondary)" }}
        >
          {label}
        </label>
      )}
      <select
        ref={ref}
        id={id}
        className={cn("w-full px-3 py-2 text-[13px] focus:outline-none", className)}
        style={{
          border: "1px solid var(--border-primary)",
          borderRadius: "var(--radius-sm)",
          background: "var(--bg-quaternary)",
          color: "var(--text-primary)",
        }}
        {...props}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  )
);
Select.displayName = "Select";

export { Select };
