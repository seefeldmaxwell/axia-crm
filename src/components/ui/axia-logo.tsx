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
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Left laurel branch */}
      <g opacity="0.95">
        {/* Left branch stem */}
        <path
          d="M38 88C32 72 28 56 30 38C31 28 34 18 40 10"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Left leaves - bottom to top */}
        <path d="M36 82C28 78 24 70 26 62C30 66 36 72 36 82Z" fill={color} />
        <path d="M34 72C26 68 21 60 23 52C27 56 34 62 34 72Z" fill={color} />
        <path d="M32 62C24 58 19 50 21 42C25 46 32 52 32 62Z" fill={color} />
        <path d="M31 52C23 48 18 40 20 32C24 36 31 42 31 52Z" fill={color} />
        <path d="M31 42C24 37 20 29 23 21C26 26 31 33 31 42Z" fill={color} />
        <path d="M33 33C27 27 25 19 28 12C30 18 33 25 33 33Z" fill={color} />
        <path d="M36 25C32 19 31 11 35 5C36 12 36 19 36 25Z" fill={color} />
      </g>

      {/* Right laurel branch */}
      <g opacity="0.95">
        {/* Right branch stem */}
        <path
          d="M62 88C68 72 72 56 70 38C69 28 66 18 60 10"
          stroke={color}
          strokeWidth="2.2"
          strokeLinecap="round"
          fill="none"
        />
        {/* Right leaves - bottom to top */}
        <path d="M64 82C72 78 76 70 74 62C70 66 64 72 64 82Z" fill={color} />
        <path d="M66 72C74 68 79 60 77 52C73 56 66 62 66 72Z" fill={color} />
        <path d="M68 62C76 58 81 50 79 42C75 46 68 52 68 62Z" fill={color} />
        <path d="M69 52C77 48 82 40 80 32C76 36 69 42 69 52Z" fill={color} />
        <path d="M69 42C76 37 80 29 77 21C74 26 69 33 69 42Z" fill={color} />
        <path d="M67 33C73 27 75 19 72 12C70 18 67 25 67 33Z" fill={color} />
        <path d="M64 25C68 19 69 11 65 5C64 12 64 19 64 25Z" fill={color} />
      </g>

      {/* Center "A" letterform */}
      <text
        x="50"
        y="62"
        textAnchor="middle"
        fontFamily="'SF Pro Display', -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
        fontWeight="600"
        fontSize="32"
        letterSpacing="-0.5"
        fill={color}
      >
        A
      </text>
    </svg>
  );
}
