'use client'
import React from "react";

const LoadingFruit: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="fruit w-[60px] h-[60px] text-red-500 dark:text-red-400"
      >
        {/* Apple Body */}
        <path
          d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"
          pathLength="1"
          className="fruit-path"
        />
        {/* Stem */}
        <path 
          d="M10 2c1 .5 2 2 2 5" 
          pathLength="1" 
          className="fruit-path" 
          style={{ animationDelay: '0.5s' }}
        />
      </svg>
      <p className="text-sm font-medium text-gray-500 dark:text-gray-400 animate-pulse">Loading fresh data...</p>

      <style jsx>{`
        .fruit-path {
          --pathlength: 1;
          stroke-dashoffset: var(--pathlength);
          stroke-dasharray: 0 var(--pathlength);
          animation: loader 2s cubic-bezier(0.5, 0.1, 0.5, 1) infinite alternate;
        }

        @keyframes loader {
          0% {
             stroke-dashoffset: var(--pathlength);
             stroke-dasharray: 0 var(--pathlength);
             fill: transparent;
          }
          40% {
            stroke-dashoffset: 0;
            stroke-dasharray: var(--pathlength) 0;
            fill: transparent;
          }
          100% {
            stroke-dashoffset: 0;
            stroke-dasharray: var(--pathlength) 0;
            fill: currentColor;
          }
        }
      `}</style>
    </div>
  );
};

export default LoadingFruit;
