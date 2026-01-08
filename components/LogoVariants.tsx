
import React from 'react';

export const LogoVerticalBars: React.FC<{ size?: number; color?: string; bgColor?: string }> = ({
    size = 100,
    color = "#1e293b",
    bgColor = "#facc15"
}) => {
    return (
        <div className="flex flex-col items-center gap-2">
            <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
                {/* Hexagon Background */}
                <path
                    d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z"
                    fill={bgColor}
                />
                {/* 3 Vertical Rounded Bars */}
                <rect x="32" y="35" width="8" height="30" rx="4" fill={color} />
                <rect x="46" y="25" width="8" height="50" rx="4" fill={color} />
                <rect x="60" y="35" width="8" height="30" rx="4" fill={color} />
            </svg>
            <span className="text-[10px] font-bold text-white uppercase tracking-widest opacity-60">Vertical Flow</span>
        </div>
    );
};

export const LogoHexGrid: React.FC<{ size?: number }> = ({ size = 100 }) => (
    <div className="flex flex-col items-center gap-2">
        <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" fill="none" stroke="#facc15" strokeWidth="6" />
            <path d="M50 25 L70 35 L70 60 L50 70 L30 60 L30 35 Z" fill="#facc15" />
            <circle cx="50" cy="47" r="5" fill="#1e293b" />
        </svg>
        <span className="text-[10px] font-bold text-white uppercase tracking-widest opacity-60">Target Hex</span>
    </div>
);

export const LogoMinimalBee: React.FC<{ size?: number }> = ({ size = 100 }) => (
    <div className="flex flex-col items-center gap-2">
        <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <circle cx="50" cy="50" r="40" fill="#facc15" />
            <path d="M35 45 Q50 25 65 45" stroke="#1e293b" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M35 55 Q50 35 65 55" stroke="#1e293b" strokeWidth="4" fill="none" strokeLinecap="round" />
            <path d="M50 40 L50 70" stroke="#1e293b" strokeWidth="4" strokeLinecap="round" />
        </svg>
        <span className="text-[10px] font-bold text-white uppercase tracking-widest opacity-60">Modern Bee</span>
    </div>
);
