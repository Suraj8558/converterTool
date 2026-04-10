import * as React from 'react';

interface LogoProps {
  className?: string;
  width?: number;
  height?: number;
}

export function Logo({ className, width = 32, height = 28 }: LogoProps) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 160 139"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="typingSnap logo"
    >
      <path
        d="M0 24.5V0L75.5 0.5L68 24H63V39.5L50 78.5H63V106.5L55.5 126H37L36.5 24.5H0Z"
        fill="url(#logo_g0)"
      />
      <path
        d="M127 0H82.5L59 72H83.5L57 138.5L129.5 48.5H98.5L127 0Z"
        fill="url(#logo_g1)"
      />
      <path
        d="M156 18H124L110.5 41.5H156V18Z"
        fill="url(#logo_g2)"
      />
      <path
        d="M75 126.5L93 103.5L126.5 103C126.5 103 134 102 134 95C134 88 126.5 86.5 126.5 86.5L111 81.5L127.5 61C127.5 61 160 66.5 160 95C160 123.5 132 125.5 132 125.5L75 126.5Z"
        fill="url(#logo_g3)"
      />
      <defs>
        <linearGradient id="logo_g0" x1="147.5" y1="69.25" x2="37" y2="69.25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FA8D21" />
          <stop offset="0.495192" stopColor="#CD3544" />
          <stop offset="0.947115" stopColor="#612078" />
        </linearGradient>
        <linearGradient id="logo_g1" x1="147.5" y1="69.25" x2="37" y2="69.25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FA8D21" />
          <stop offset="0.495192" stopColor="#CD3544" />
          <stop offset="0.947115" stopColor="#612078" />
        </linearGradient>
        <linearGradient id="logo_g2" x1="147.5" y1="69.25" x2="37" y2="69.25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FA8D21" />
          <stop offset="0.495192" stopColor="#CD3544" />
          <stop offset="0.947115" stopColor="#612078" />
        </linearGradient>
        <linearGradient id="logo_g3" x1="147.5" y1="69.25" x2="37" y2="69.25" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FA8D21" />
          <stop offset="0.495192" stopColor="#CD3544" />
          <stop offset="0.947115" stopColor="#612078" />
        </linearGradient>
      </defs>
    </svg>
  );
}
