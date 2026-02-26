"use client";

import { cn } from "@/lib/utils";
import { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focus)] focus-visible:ring-offset-1 disabled:opacity-40 disabled:pointer-events-none",
          className
        )}
        style={{
          borderRadius: "var(--radius-sm)",
          ...(variant === "primary" ? { background: "var(--accent-blue)", color: "white" } : {}),
          ...(variant === "secondary" ? { background: "transparent", border: "1px solid var(--border-primary)", color: "var(--text-secondary)" } : {}),
          ...(variant === "ghost" ? { background: "transparent", color: "var(--text-secondary)" } : {}),
          ...(variant === "destructive" ? { background: "var(--accent-red)", color: "white" } : {}),
          ...(size === "sm" ? { fontSize: "12px", padding: "4px 8px", gap: "6px" } : {}),
          ...(size === "md" ? { fontSize: "13px", padding: "6px 12px", gap: "8px" } : {}),
          ...(size === "lg" ? { fontSize: "13px", padding: "8px 16px", gap: "8px" } : {}),
        }}
        onMouseEnter={(e) => {
          if (variant === "primary") e.currentTarget.style.background = "var(--accent-blue-hover)";
          if (variant === "secondary") e.currentTarget.style.background = "var(--bg-tertiary)";
          if (variant === "ghost") { e.currentTarget.style.background = "var(--bg-tertiary)"; e.currentTarget.style.color = "var(--text-primary)"; }
          props.onMouseEnter?.(e);
        }}
        onMouseLeave={(e) => {
          if (variant === "primary") e.currentTarget.style.background = "var(--accent-blue)";
          if (variant === "secondary") e.currentTarget.style.background = "transparent";
          if (variant === "ghost") { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "var(--text-secondary)"; }
          props.onMouseLeave?.(e);
        }}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button };
