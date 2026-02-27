interface AxiaLogoProps {
  size?: number;
  color?: string;
  className?: string;
}

export function AxiaLogo({ size = 24, color = "#0071E3", className }: AxiaLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Geometric Omega / Ohm symbol */}
      <path
        d="M8 38h6v-2a14 14 0 1 1 20 0v2h6v-4h-4.5a16 16 0 1 0-23 0H8v4z"
        fill={color}
      />
      <rect x="8" y="36" width="8" height="4" rx="1" fill={color} />
      <rect x="32" y="36" width="8" height="4" rx="1" fill={color} />
    </svg>
  );
}
