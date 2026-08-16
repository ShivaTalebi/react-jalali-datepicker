import * as React from "react";

export const ArrowDownCombo: React.FC<React.SVGProps<SVGSVGElement>> = (p) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    aria-hidden
    focusable="false"
    {...p}
  >
    <polyline
      points="6 9 12 15 18 9"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const TickCircle: React.FC<React.SVGProps<SVGSVGElement>> = (p) => (
  <svg
    viewBox="0 0 24 24"
    width="16"
    height="16"
    aria-hidden
    focusable="false"
    {...p}
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    />
    <polyline
      points="8 12 11 15 16 9"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);
