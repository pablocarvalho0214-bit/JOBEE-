import React from 'react';

interface AnonymousAvatarProps {
    fullName: string;
    tier?: string;
    size?: 'sm' | 'md' | 'lg';
}

export const AnonymousAvatar: React.FC<AnonymousAvatarProps> = ({
    fullName,
    tier = 'nectar',
    size = 'md'
}) => {
    // Extract initials from full name
    const getInitials = (name: string) => {
        const parts = name.trim().split(' ').filter(p => p.length > 0);
        if (parts.length === 0) return '??';
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    // Get tier colors
    const getTierColors = (tier: string) => {
        const colors: any = {
            'nectar': { bg: 'from-slate-400 via-slate-500 to-slate-400', text: 'text-slate-900' },
            'polen': { bg: 'from-blue-400 via-cyan-400 to-blue-400', text: 'text-blue-900' },
            'favo': { bg: 'from-yellow-400 via-orange-400 to-yellow-400', text: 'text-orange-900' },
            'geleia': { bg: 'from-purple-400 via-pink-400 to-purple-400', text: 'text-purple-900' }
        };
        return colors[tier] || colors['nectar'];
    };

    const sizeClasses = {
        sm: 'w-16 h-16 text-lg',
        md: 'w-24 h-24 text-3xl',
        lg: 'w-32 h-32 text-4xl'
    };

    const initials = getInitials(fullName);
    const tierColors = getTierColors(tier);

    return (
        <div
            className={`${sizeClasses[size]} rounded-full bg-gradient-to-br ${tierColors.bg} flex items-center justify-center shadow-2xl relative overflow-hidden group`}
            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
        >
            {/* Hexagonal shape with initials */}
            <div className="absolute inset-0 bg-black/5 backdrop-blur-sm" />
            <span className={`font-black ${tierColors.text} relative z-10 tracking-tighter`}>
                {initials}
            </span>

            {/* Subtle pattern overlay */}
            <div
                className="absolute inset-0 opacity-10 mix-blend-overlay"
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M10 0l8.66 5v10L10 20 1.34 15V5z' fill-rule='evenodd' stroke='%23000000' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
                    backgroundSize: '10px 17px'
                }}
            />
        </div>
    );
};
