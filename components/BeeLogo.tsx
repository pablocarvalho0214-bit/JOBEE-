
import React from 'react';

const BeeLogo: React.FC<{ size?: number }> = ({ size = 100 }) => {
    return (
        <div className="relative flex items-center justify-center p-2" style={{ width: size, height: size }}>
            <svg viewBox="0 0 512 512" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                <defs>
                    <linearGradient id="hexaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" style={{ stopColor: '#FFC700', stopOpacity: 1 }} />
                        <stop offset="100%" style={{ stopColor: '#FF9900', stopOpacity: 1 }} />
                    </linearGradient>
                </defs>

                {/* Outer Hexagon Target Ring */}
                <path d="M256 50 L450 150 L450 362 L256 462 L62 362 L62 150 Z"
                    stroke="url(#hexaGrad)" strokeWidth="40" fill="none" opacity="0.4" className="animate-pulse" />

                {/* Inner Hexagon Target Ring */}
                <path d="M256 120 L380 185 L380 327 L256 392 L132 327 L132 185 Z"
                    stroke="url(#hexaGrad)" strokeWidth="40" fill="none" opacity="0.8" />

                {/* Bullseye Center */}
                <path d="M256 190 L310 220 L310 292 L256 322 L202 292 L202 220 Z"
                    fill="url(#hexaGrad)" />

                {/* Arrow/Success Indicator */}
                <path d="M380 120 L280 220" stroke="white" strokeWidth="15" strokeLinecap="round" className="animate-[dash_2s_ease-in-out_infinite]" />
                <circle cx="280" cy="220" r="8" fill="white" />
            </svg>
            <style>{`
                @keyframes dash {
                  0% { stroke-dasharray: 0, 150; stroke-dashoffset: 150; opacity: 0; }
                  50% { stroke-dasharray: 100, 150; stroke-dashoffset: 0; opacity: 1; }
                  100% { stroke-dasharray: 200, 150; stroke-dashoffset: -100; opacity: 0; }
                }
            `}</style>
        </div>
    );
};

export default BeeLogo;
