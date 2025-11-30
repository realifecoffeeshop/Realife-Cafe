import React from 'react';

const Logo: React.FC = () => {
  return (
    <svg 
      width="160" 
      height="35" 
      viewBox="0 0 340 75" 
      xmlns="http://www.w3.org/2000/svg" 
      aria-label="Realife Cafe Logo"
    >
      <style>
        {`
          .rlc-logo-text-light { display: block; }
          .rlc-logo-text-dark { display: none; }
          .dark .rlc-logo-text-light { display: none; }
          .dark .rlc-logo-text-dark { display: block; }
        `}
      </style>
      <defs>
        <path id="triangle-1" d="M 0 0 L 34 34 L 0 34 Z" />
        <path id="triangle-2" d="M 0 0 L 34 0 L 34 34 Z" />
      </defs>
      
      <g id="icon" transform="translate(1,1)">
        <rect width="68" height="68" rx="14" fill="#c51a1a" />
        <g fill="#b91c1c" fillOpacity="0.8">
            <use href="#triangle-1" transform="translate(0, 0)" />
            <use href="#triangle-2" transform="translate(34, 0) scale(-1, 1)" />
            <use href="#triangle-1" transform="translate(0, 34) scale(1, -1)" />
            <use href="#triangle-2" transform="translate(34, 34) scale(-1, -1)" />
        </g>
        <g fill="#dc2626" fillOpacity="0.8">
            <use href="#triangle-2" transform="translate(0, 0)" />
            <use href="#triangle-1" transform="translate(34, 0) scale(-1, 1)" />
            <use href="#triangle-2" transform="translate(0, 34) scale(1, -1)" />
            <use href="#triangle-1" transform="translate(34, 34) scale(-1, -1)" />
        </g>
      </g>
      
      {/* Text for Light Mode */}
      <g className="rlc-logo-text-light">
        <text 
          x="80" 
          y="48" 
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
          fontSize="48" 
          fontWeight="bold" 
          fill="#18181b"
        >
          realife
        </text>
        <text 
          x="82" 
          y="70" 
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
          fontSize="20" 
          fontWeight="300" 
          fill="#52525b" 
          letterSpacing="6"
        >
          CAFE
        </text>
      </g>

      {/* Text for Dark Mode */}
      <g className="rlc-logo-text-dark">
        <text 
          x="80" 
          y="48" 
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
          fontSize="48" 
          fontWeight="bold" 
          fill="#f4f4f5"
        >
          realife
        </text>
        <text 
          x="82" 
          y="70" 
          fontFamily="-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif" 
          fontSize="20" 
          fontWeight="300" 
          fill="#a1a1aa" 
          letterSpacing="6"
        >
          CAFE
        </text>
      </g>
    </svg>
  );
};

export default Logo;
