
import React from 'react';

/**
 * JOBEE OFFICIAL BRAND ASSETS
 * Based on the established Brand Briefing
 */

// 1. Simbolo (O Icone)
const JobeeSymbol: React.FC<{ size?: number; mode?: 'light' | 'dark' | 'color' }> = ({
    size = 100,
    mode = 'color'
}) => {
    const primaryColor = "#FACC15"; // Amarelo Honey
    const darkNavy = "#1E293B"; // Azul Petróleo
    const white = "#FFFFFF";

    return (
        <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            {/* Flat-Base Hexagon */}
            <path d="M25 12 L75 12 L97 50 L75 88 L25 88 L3 50 Z" fill={mode === 'dark' ? "none" : primaryColor} stroke={mode === 'dark' ? primaryColor : "none"} strokeWidth={mode === 'dark' ? "5" : "0"} />

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

// 1.5 Simbolo Teste (4 Barras - Refinado)
export const JobeeSymbolFourBars: React.FC<{ size?: number; mode?: 'light' | 'dark' | 'color' }> = ({
    size = 100,
    mode = 'color'
}) => {
    const darkNavy = "#1E293B";
    const primaryColor = "#FACC15";

    return (
        <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <path d="M25 12 L75 12 L97 50 L75 88 L25 88 L3 50 Z" fill={mode === 'dark' ? "none" : primaryColor} stroke={mode === 'dark' ? primaryColor : "none"} strokeWidth={mode === 'dark' ? "5" : "0"} />

            {/* 4 Vertical Bars Centered */}
            <rect x="28" y="32" width="7" height="36" rx="3.5" fill={darkNavy} />
            <rect x="40.5" y="22" width="7" height="56" rx="3.5" fill={darkNavy} />
            <rect x="53" y="32" width="7" height="36" rx="3.5" fill={darkNavy} />
            <rect x="65.5" y="44" width="7" height="12" rx="3.5" fill={darkNavy} />
        </svg>
    );
};

// 1.8 CONCEITO: Neural Hive (Hexágonos Conectados - Update)
export const JobeeSymbolNeuralHive: React.FC<{ size?: number; mode?: 'light' | 'dark' | 'color' }> = ({
    size = 100,
    mode = 'color'
}) => {
    const primary = "#FACC15";
    const dark = "#1E293B";

    // Adjusted points for flat-base hexes in the cluster
    return (
        <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            {/* Central Hex (Flat Base) */}
            <path d="M40 45 L60 45 L69 55 L60 65 L40 65 L31 55 Z" fill={primary} />

            {/* Connected Hex 1 (Flat Base) */}
            <path d="M55 30 L75 30 L84 40 L75 50 L55 50 L46 40 Z" fill={dark} opacity="0.8" />

            {/* Connected Hex 2 (Flat Base) */}
            <path d="M25 30 L45 30 L54 40 L45 50 L25 50 L16 40 Z" fill={dark} opacity="0.8" />

            {/* Connected Hex 3 (Flat Base) */}
            <path d="M40 60 L60 60 L69 70 L60 80 L40 80 L31 70 Z" fill={dark} opacity="0.4" />
        </svg>
    );
};

// 1.9 CONCEITO: Diagonal Momentum (Barras Inclinadas)
export const JobeeSymbolDiagonalBars: React.FC<{ size?: number; mode?: 'light' | 'dark' | 'color' }> = ({
    size = 100,
    mode = 'color'
}) => {
    const primary = "#FACC15";
    const dark = "#1E293B";

    return (
        <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            {/* Flat-Base Hexagon */}
            <path d="M25 12 L75 12 L97 50 L75 88 L25 88 L3 50 Z" fill={mode === 'dark' ? "none" : primary} stroke={mode === 'dark' ? primary : "none"} strokeWidth={mode === 'dark' ? "5" : "0"} />

            {/* 3 Tilting Bars aligned with Hexagon (30 degrees) */}
            <g transform="rotate(-30, 50, 50)">
                <rect x="30" y="32" width="10" height="36" rx="5" fill={dark} />
                <rect x="45" y="22" width="10" height="56" rx="5" fill={dark} />
                <rect x="60" y="32" width="10" height="36" rx="5" fill={dark} />
            </g>
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
