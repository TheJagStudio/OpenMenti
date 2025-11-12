import React from 'react';

export const LogoIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M12 12l-4-2.5" />
        <path d="M12 12l4-2.5" />
        <path d="M12 12v5" />
        <path d="M12 12l-4 2.5" />
        <path d="M12 12l4 2.5" />
    </svg>
);

export const LeaderboardIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 20V10" />
    <path d="M18 20V4" />
    <path d="M6 20V16" />
  </svg>
);
