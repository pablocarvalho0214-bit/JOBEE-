import React from 'react';

interface AdPlaceholderProps {
    userTier: string;
}

const AdPlaceholder: React.FC<AdPlaceholderProps> = ({ userTier }) => {
    // 🛡️ Logic: Hide ads for anyone who isn't 'nectar' (Free)
    if (userTier !== 'nectar') return null;

    return (
        <div className="w-full px-6 my-4 animate-in fade-in duration-700">
            <div className="relative group overflow-hidden rounded-2xl bg-white/5 border border-white/10 p-4 transition-all hover:bg-white/10 hover:border-white/20">
                {/* Glow behind */}
                <div className="absolute -top-10 -right-10 w-24 h-24 bg-blue-500/10 blur-2xl group-hover:bg-blue-500/20 transition-all"></div>

                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 flex items-center justify-center border border-white/10">
                        <span className="material-symbols-outlined text-white/20">ads_click</span>
                    </div>

                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-[8px] font-black text-white/30 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">Anúncio Externo</span>
                            <span className="text-[7px] font-bold text-blue-400 group-hover:underline cursor-pointer flex items-center gap-1">
                                Remover Anúncios <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                            </span>
                        </div>
                        <h4 className="text-[11px] font-black text-white/80 uppercase tracking-tighter">Aprenda React do Zero</h4>
                        <p className="text-[9px] text-white/40 leading-tight">Curso intensivo com certificação. Clique e confira!</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdPlaceholder;
