import type { CSSProperties } from 'react';

interface AiIconProps {
  className?: string;
  size?: number;
  style?: CSSProperties;
}

/**
 * AI sparkle icon that uses currentColor for fill.
 * This allows the icon to inherit text color from parent elements,
 * making it work seamlessly with button hover states.
 */
export function AiIcon({ className, size = 16, style }: AiIconProps) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 95.451812 95.452564"
      width={size}
      height={size}
      className={className}
      fill="currentColor"
      style={style}
      aria-hidden="true"
    >
      <path
        d="M95.451812,47.711985c-13.160526,0-25.118621,5.331932-33.748585,13.961143-8.629964,8.660815-13.992747,20.588811-13.992747,33.779435,0-13.190624-5.331932-25.118621-13.961896-33.779435-8.660062-8.629212-20.557208-13.961143-33.748585-13.961143,13.191377,0,25.088522-5.333437,33.748585-13.962648,8.629964-8.629212,13.961896-20.587306,13.961896-33.749337,0,26.352655,21.389429,47.711985,47.741331,47.711985Z"
      />
    </svg>
  );
}
