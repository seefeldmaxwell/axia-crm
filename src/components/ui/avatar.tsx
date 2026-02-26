import { cn, getInitials } from "@/lib/utils";

interface AvatarProps {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeStyles = {
  sm: "w-7 h-7 text-[11px]",
  md: "w-8 h-8 text-[12px]",
  lg: "w-11 h-11 text-[14px]",
};

const colors = [
  "#2D7FF9",
  "#6554C0",
  "#00B8D9",
  "#36B37E",
  "#FF5630",
  "#FFAB00",
];

function getColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export function Avatar({ name, size = "md", className }: AvatarProps) {
  return (
    <div
      className={cn(
        "rounded-full flex items-center justify-center text-white font-semibold shrink-0 select-none",
        sizeStyles[size],
        className
      )}
      style={{ background: getColor(name) }}
    >
      {getInitials(name)}
    </div>
  );
}
