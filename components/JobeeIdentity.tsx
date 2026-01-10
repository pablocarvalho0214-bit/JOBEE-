
import React from 'react';

/**
 * JOBEE OFFICIAL BRAND ASSETS
 * Based on the established Brand Briefing
 */

// 1. Simbolo Oficial (O Icone)
export const JobeeSymbol: React.FC<{ size?: number; mode?: 'light' | 'dark' | 'color' }> = ({
    size = 100,
    mode = 'color'
}) => {
    const primaryColor = "#FACC15"; // Amarelo Honey
    const darkNavy = "#1E293B"; // Azul Petróleo
    const white = "#FFFFFF";

    return (
        <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            {/* Hexagon Frame rotated for Pointy-top orientation */}
            <path
                d="M26 8 L74 8 L98 50 L74 92 L26 92 L2 50 Z"
                fill={mode === 'dark' ? "none" : primaryColor}
                stroke={mode === 'dark' ? primaryColor : "none"}
                strokeWidth={mode === 'dark' ? "5" : "0"}
                transform="rotate(30, 50, 50)"
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

// 4. SplashScreen (Full brand experience)
export const JobeeSplashScreen: React.FC<{ isExiting?: boolean }> = ({ isExiting = false }) => (
    <div className={`fixed inset-0 z-[9999] bg-[#FACC15] flex flex-col items-center justify-center overflow-hidden transition-all duration-1000 ease-in-out ${isExiting ? 'opacity-0 scale-110 pointer-events-none' : 'opacity-100'}`}>
        {/* Background Subtle Texture */}
        <div className="absolute inset-0 opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

        {/* Ambient Glow */}
        <div className="absolute w-[150%] h-[150%] bg-white/10 blur-[120px] rounded-full animate-pulse"></div>

        {/* Large Central Bars (Symbol focus) */}
        <div className={`relative flex flex-col items-center transition-all duration-700 ${isExiting ? 'scale-150 blur-xl opacity-0' : 'scale-100'}`}>
            <svg viewBox="0 0 100 100" width="140" height="140" xmlns="http://www.w3.org/2000/svg" className="animate-[bounce_3s_infinite_ease-in-out]">
                <rect x="25" y="32" width="12" height="36" rx="6" fill="#1E293B" className="animate-pulse" />
                <rect x="44" y="22" width="12" height="56" rx="6" fill="#1E293B" />
                <rect x="63" y="32" width="12" height="36" rx="6" fill="#1E293B" className="animate-pulse" />
            </svg>
        </div>

        {/* Wordmark at the bottom - Bumble Style */}
        <div className={`absolute bottom-16 flex flex-col items-center transition-all duration-500 ${isExiting ? 'translate-y-10 opacity-0' : 'translate-y-0 opacity-100'}`}>
            <div className="flex font-black tracking-[-0.05em] text-[#1E293B] uppercase text-4xl">
                <span>JO</span>
                <span className="opacity-70">BEE</span>
            </div>
            <div className="mt-2 h-1 w-12 bg-[#1E293B] rounded-full opacity-10"></div>
        </div>
    </div>
);
