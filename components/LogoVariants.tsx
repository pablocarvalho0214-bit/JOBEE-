import React from 'react';

// 1. Corporate Bold Structured (Thicker lines, small radius)
export const LogoCorpBold: React.FC<{ size?: number }> = ({ size = 100 }) => (
    <div className="flex flex-col items-center gap-2">
        <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" fill="#EAB308" />
            <rect x="30" y="35" width="10" height="30" rx="2" fill="#0F172A" />
            <rect x="45" y="22" width="10" height="56" rx="2" fill="#0F172A" />
            <rect x="60" y="35" width="10" height="30" rx="2" fill="#0F172A" />
        </svg>
        <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em]">Bold Structured</span>
    </div>
);

// 2. Corporate Soft Rounded (Thicker lines, fully rounded)
export const LogoCorpRounded: React.FC<{ size?: number }> = ({ size = 100 }) => (
    <div className="flex flex-col items-center gap-2">
        <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" fill="#EAB308" />
            <rect x="30" y="35" width="10" height="30" rx="5" fill="#0F172A" />
            <rect x="45" y="22" width="10" height="56" rx="5" fill="#0F172A" />
            <rect x="60" y="35" width="10" height="30" rx="5" fill="#0F172A" />
        </svg>
        <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em]">Soft Rounded</span>
    </div>
);

// 3. Corporate Modern Tech (Thicker lines, styled gaps)
export const LogoCorpTech: React.FC<{ size?: number }> = ({ size = 100 }) => (
    <div className="flex flex-col items-center gap-2">
        <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" fill="#EAB308" />
            <rect x="28" y="38" width="12" height="24" rx="3" fill="#0F172A" />
            <rect x="44" y="20" width="12" height="60" rx="3" fill="#0F172A" />
            <rect x="60" y="38" width="12" height="24" rx="3" fill="#0F172A" />
        </svg>
        <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em]">Modern Tech</span>
    </div>
);
