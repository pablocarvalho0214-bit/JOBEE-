
import React from 'react';

/**
 * JOBEE OFFICIAL BRAND ASSETS
 * Based on the established Brand Briefing
 */

// 1. Símbolo Oficial (The Hexagon + 3 Vertical Bars)
export const JobeeSymbol: React.FC<{ size?: number; mode?: 'light' | 'dark' | 'color' }> = ({
    size = 100,
    mode = 'color'
}) => {
    const primaryColor = "#FACC15"; // Amarelo Honey
    const darkNavy = "#1E293B"; // Azul Petróleo
    const white = "#FFFFFF";

    return (
        <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            {/* Hexagon Frame */}
            <path
                d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z"
                fill={mode === 'dark' ? "none" : primaryColor}
                stroke={mode === 'dark' ? primaryColor : "none"}
                strokeWidth={mode === 'dark' ? "5" : "0"}
            />

            {/* Side Bar Left - Company */}
            <rect
                x="30" y="32" width="10" height="36" rx="5"
                fill={mode === 'color' ? darkNavy : (mode === 'light' ? darkNavy : primaryColor)}
            />

            {/* Center Bar - Talent/Match (The Protagonsit) */}
            <rect
                x="45" y="22" width="10" height="56" rx="5"
                fill={mode === 'color' ? darkNavy : (mode === 'light' ? primaryColor : white)}
            />

            {/* Side Bar Right - Opportunities */}
            <rect
                x="60" y="32" width="10" height="36" rx="5"
                fill={mode === 'color' ? darkNavy : (mode === 'light' ? darkNavy : primaryColor)}
            />
        </svg>
    );
};

// 2. Logo Completa (Symbol + Wordmark)
export const JobeeFullLogo: React.FC<{ size?: number; theme?: 'light' | 'dark' }> = ({
    size = 40,
    theme = 'light'
}) => {
    return (
        <div className="flex items-center gap-3">
            <JobeeSymbol size={size} mode={theme === 'light' ? 'color' : 'dark'} />
            <div className={`flex font-black tracking-tighter ${theme === 'light' ? 'text-white' : 'text-slate-900'} uppercase`} style={{ fontSize: size * 0.8 }}>
                <span>JO</span>
                <span className="text-yellow-400">BEE</span>
            </div>
        </div>
    );
};

// 3. Aplicação em Card Premium (Brand Showcase)
export const JobeeBrandCard: React.FC = () => (
    <div className="w-full bg-slate-900 rounded-3xl p-8 border border-white/10 shadow-2xl space-y-8">
        <div className="flex justify-between items-center border-b border-white/5 pb-6">
            <JobeeFullLogo size={32} theme="light" />
            <div className="text-[10px] font-bold text-white/30 tracking-[0.3em] uppercase">Official Identity</div>
        </div>

        <div className="grid grid-cols-2 gap-4">
            <div className="bg-yellow-400/5 rounded-2xl p-4 flex flex-col items-center gap-2 border border-yellow-400/10">
                <JobeeSymbol size={48} mode="color" />
                <span className="text-[8px] font-bold text-yellow-400/60 uppercase">Primary Symbol</span>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 flex flex-col items-center gap-2 border border-white/10">
                <JobeeSymbol size={48} mode="dark" />
                <span className="text-[8px] font-bold text-white/30 uppercase">Dark/Outline</span>
            </div>
        </div>
    </div>
);
