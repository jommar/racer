import React from 'react';

function CarIcon({ color = '#3b82f6' }) {
  return (
    <svg
      width="40"
      height="20"
      viewBox="0 0 40 20"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="carBodyGradient" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={color} />
          <stop offset="100%" stopColor="#020617" />
        </linearGradient>
      </defs>
      {/* Body */}
      <rect x="4" y="8" width="30" height="7" rx="3" fill="url(#carBodyGradient)" />
      {/* Cabin */}
      <path
        d="M10 8 L18 4 H26 L30 8 Z"
        fill="#e5e7eb"
        fillOpacity="0.8"
      />
      {/* Front spoiler */}
      <rect x="2" y="10" width="4" height="4" rx="1" fill={color} />
      {/* Rear spoiler */}
      <rect x="32" y="7" width="4" height="6" rx="1" fill={color} />
      {/* Wheels */}
      <circle cx="12" cy="16" r="3" fill="#020617" stroke="#64748b" strokeWidth="1" />
      <circle cx="26" cy="16" r="3" fill="#020617" stroke="#64748b" strokeWidth="1" />
      {/* Wheel centers */}
      <circle cx="12" cy="16" r="1" fill="#e5e7eb" />
      <circle cx="26" cy="16" r="1" fill="#e5e7eb" />
    </svg>
  );
}

export default CarIcon;
