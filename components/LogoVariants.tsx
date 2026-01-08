import React from 'react';

// 1. Aspecto Corporativo (Clean, Structured, Professional)
export const LogoCorporate: React.FC<{ size?: number }> = ({ size = 100 }) => (
    <div className="flex flex-col items-center gap-2">
        <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <path d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" fill="#EAB308" />
            <rect x="34" y="38" width="6" height="24" rx="1" fill="#0F172A" />
            <rect x="47" y="28" width="6" height="44" rx="1" fill="#0F172A" />
            <rect x="60" y="38" width="6" height="24" rx="1" fill="#0F172A" />
        </svg>
        <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em]">Corporativo</span>
    </div>
);

// 2. Aspecto Social Media (Bold, Vibrant, Dynamic)
export const LogoSocial: React.FC<{ size?: number }> = ({ size = 100 }) => (
    <div className="flex flex-col items-center gap-2">
        <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <defs>
                <linearGradient id="socialGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" style={{ stopColor: '#FACC15', stopOpacity: 1 }} />
                    <stop offset="100%" style={{ stopColor: '#EAB308', stopOpacity: 1 }} />
                </linearGradient>
            </defs>
            <path d="M50 5 L90 27.5 L90 72.5 L50 95 L10 72.5 L10 27.5 Z" fill="url(#socialGrad)" />
            <rect x="30" y="35" width="10" height="30" rx="5" fill="white" fillOpacity="0.9" />
            <rect x="45" y="22" width="10" height="56" rx="5" fill="white" fillOpacity="0.9" />
            <rect x="60" y="35" width="10" height="30" rx="5" fill="white" fillOpacity="0.9" />
        </svg>
        <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em]">Social Feed</span>
    </div>
);

// 3. Aspecto Aplicativo de Relacionamento (Friendly, Soft, Human)
export const LogoDating: React.FC<{ size?: number }> = ({ size = 100 }) => (
    <div className="flex flex-col items-center gap-2">
        <svg viewBox="0 0 100 100" width={size} height={size} xmlns="http://www.w3.org/2000/svg">
            <path d="M50 10 Q90 10 90 27.5 L90 72.5 Q90 90 50 90 Q10 90 10 72.5 L10 27.5 Q10 10 50 10 Z" fill="#FDE047" />
            <rect x="32" y="38" width="8" height="24" rx="4" fill="#854D0E" />
            <rect x="46" y="25" width="8" height="50" rx="4" fill="#854D0E" />
            <rect x="60" y="38" width="8" height="24" rx="4" fill="#854D0E" />
            <circle cx="50" cy="50" r="3" fill="white" opacity="0.5" />
        </svg>
        <span className="text-[8px] font-black text-white/50 uppercase tracking-[0.2em]">Dating Style</span>
    </div>
);
