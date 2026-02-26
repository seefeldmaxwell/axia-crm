import { cn } from "@/lib/utils";

interface BadgeProps {
  children: React.ReactNode;
  variant?: "default" | "success" | "warning" | "error" | "info" | "neutral";
  className?: string;
}

const variantStyles: Record<string, { bg: string; color: string }> = {
  default: { bg: "var(--bg-tertiary)", color: "var(--text-secondary)" },
  success: { bg: "var(--accent-green-muted)", color: "var(--accent-green)" },
  warning: { bg: "var(--accent-yellow-muted)", color: "var(--accent-yellow)" },
  error: { bg: "var(--accent-red-muted)", color: "var(--accent-red)" },
  info: { bg: "var(--accent-blue-muted)", color: "var(--accent-blue)" },
  neutral: { bg: "var(--bg-tertiary)", color: "var(--text-secondary)" },
};

export function Badge({ children, variant = "default", className }: BadgeProps) {
  const s = variantStyles[variant] || variantStyles.default;
  return (
    <span
      className={cn("inline-flex items-center px-2 py-[2px] text-[11px] font-medium leading-tight", className)}
      style={{
        background: s.bg,
        color: s.color,
        borderRadius: "var(--radius-sm)",
        fontFamily: "var(--font-mono)",
      }}
    >
      {children}
    </span>
  );
}
