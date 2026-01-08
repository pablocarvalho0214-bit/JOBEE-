
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { JobeeSymbol } from '../components/JobeeIdentity';

interface ProfilePageProps {
    role?: 'candidate' | 'recruiter';
    onNavigate?: (page: any) => void;
    initialTab?: 'notifications' | 'profile';
}

const ProfilePage: React.FC<ProfilePageProps> = ({ role = 'candidate', onNavigate, initialTab }) => {
    const [user, setUser] = useState<any>(null);
    const [uploading, setUploading] = useState(false);
    const [showNotifications, setShowNotifications] = useState(initialTab === 'notifications');
    const [showPlans, setShowPlans] = useState(false);
    const [showPreferences, setShowPreferences] = useState(false);
    const [notifConfig, setNotifConfig] = useState({
        newApplications: true,
        messages: true,
        aiMatches: true,
        weeklyReport: false,
        tips: true
    });
    const [searchRadius, setSearchRadius] = useState<number>(50);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const isRecruiter = role === 'recruiter';
    const accentColor = isRecruiter ? 'text-blue-400' : 'text-primary';
    const accentBg = isRecruiter ? 'bg-blue-500' : 'bg-primary';
    const accentBorder = isRecruiter ? 'border-blue-400' : 'border-primary';

    useEffect(() => {
        fetchUser();
        const subscriptionChannel = supabase
            .channel('profile-changes')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles', filter: user ? `id=eq.${user.id}` : undefined },
                (payload) => {
                    if (payload.new) {
                        setUser((prev: any) => ({
                            ...prev,
                            db_subscription_status: payload.new.subscription_status,
                            db_subscription_tier: payload.new.subscription_tier || 'nectar'
                        }));
                    }
                }
            )
            .subscribe();

        return () => { supabase.removeChannel(subscriptionChannel); };
    }, [user?.id]);

    const fetchUser = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { data: profile } = await supabase
                .from('profiles')
                .select('avatar_url, full_name, metadata, company_name, company_logo_url, subscription_status, subscription_tier, search_radius, skills')
                .eq('id', user.id)
                .maybeSingle();

            if (profile) {
                setUser({
                    ...user,
                    db_avatar_url: profile.avatar_url,
                    db_full_name: profile.full_name,
                    db_metadata: profile.metadata,
                    db_company_name: profile.company_name,
                    db_company_logo: profile.company_logo_url,
                    db_subscription_status: profile.subscription_status || 'free',
                    db_subscription_tier: profile.subscription_tier || 'nectar',
                    db_search_radius: profile.search_radius || 50,
                    db_skills: profile.skills || []
                });
                if (profile.search_radius) setSearchRadius(profile.search_radius);
                if (profile.metadata?.notifications) setNotifConfig(profile.metadata.notifications);
            } else { setUser(user); }
        }
    };

    const handleLogout = async () => { await supabase.auth.signOut(); };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = event.target.files?.[0];
            if (!file) return;
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-avatar-${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(`avatars/${fileName}`, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(`avatars/${fileName}`);
            await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', user.id);
            await supabase.auth.updateUser({ data: { avatar_url: publicUrl } });
            await fetchUser();
        } catch (error: any) { console.error('Error:', error.message); } finally { setUploading(false); }
    };

    const handleSubscribe = (paymentUrl: string) => {
        if (!user || !paymentUrl || paymentUrl === '#') return;
        const finalUrl = `${paymentUrl}?prefilled_email=${encodeURIComponent(user.email || '')}&client_reference_id=${user.id}`;
        window.open(finalUrl, '_blank');
    };

    const getTierDisplayName = (tier: string) => {
        const names: any = { 'nectar': 'Néctar (Grátis)', 'polen': 'Pólen', 'favo': 'Favo de Ouro', 'geleia': 'Geleia Real' };
        return names[tier] || 'Néctar (Grátis)';
    };

    const getTierColors = (tier: string) => {
        const colors: any = {
            'nectar': { bg: 'from-slate-600/30 to-slate-800/50', border: 'border-slate-500/40', accent: 'bg-slate-500' },
            'polen': { bg: 'from-blue-600/30 to-blue-900/50', border: 'border-blue-500/40', accent: 'bg-blue-500' },
            'favo': { bg: 'from-yellow-600/30 to-yellow-900/50', border: 'border-yellow-500/40', accent: 'bg-yellow-500' },
            'geleia': { bg: 'from-purple-600/30 to-purple-950/60', border: 'border-purple-500/50', accent: 'bg-purple-500' }
        };
        return colors[tier] || colors['nectar'];
    };

    const planData = isRecruiter ? [
        { id: 'nectar', name: 'Néctar', price: 'Grátis', icon: 'spa', color: 'from-slate-600 to-slate-800', url: '#', features: ['3 Vagas', '10 Chats/mês'] },
        { id: 'polen', name: 'Pólen', price: 'R$ 29,90', icon: 'filter_vintage', color: 'from-blue-600 to-blue-800', url: 'https://buy.stripe.com/test_14A8wOcaI0Lw2YP3CS87K00', features: ['10 Vagas', 'Chats Ilimitados'] },
        { id: 'favo', name: 'Favo de Ouro', price: 'R$ 59,90', icon: 'hexagon', color: 'from-yellow-600 to-yellow-800', url: 'https://buy.stripe.com/test_dRm5kC8Yw65Q0QH4GW87K01', features: ['Vagas Ilimitadas', 'IA MatchAnalysis™'] },
        { id: 'geleia', name: 'Geleia Real', price: 'R$ 99,90', icon: 'crown', color: 'from-purple-600 to-purple-800', url: 'https://buy.stripe.com/test_eVqdR8eiQeCmarhflA87K02', features: ['Tudo do Favo', 'Gestor VIP', 'API'] }
    ] : [
        { id: 'nectar', name: 'Néctar', price: 'Grátis', icon: 'spa', color: 'from-slate-600 to-slate-800', url: '#', features: ['3 Super Likes', 'Filtros Básicos'] },
        { id: 'polen', name: 'Pólen', price: 'R$ 14,90', icon: 'filter_vintage', color: 'from-blue-600 to-blue-800', url: 'https://buy.stripe.com/test_14A8wOcaI0Lw2YP3CS87K00', features: ['Likes Ilimitados', 'Ver visitas'] },
        { id: 'favo', name: 'Favo de Ouro', price: 'R$ 29,90', icon: 'hexagon', color: 'from-yellow-600 to-yellow-800', url: 'https://buy.stripe.com/test_dRm5kC8Yw65Q0QH4GW87K01', features: ['Ver quem deu Match', 'Boost Diário'] },
        { id: 'geleia', name: 'Geleia Real', price: 'R$ 49,90', icon: 'crown', color: 'from-purple-600 to-purple-800', url: 'https://buy.stripe.com/test_eVqdR8eiQeCmarhflA87K02', features: ['Destaque Master', 'Mentoria IA'] }
    ];

    const tierColors = getTierColors(user?.db_subscription_tier || 'nectar');

    return (
        <div className="flex flex-col h-full bg-secondary text-white relative overflow-hidden font-sans p-6 pt-12">
            <div className="absolute inset-0 pointer-events-none">
                <div className={`absolute top-[-10%] left-[-10%] w-[60%] h-[60%] ${isRecruiter ? 'bg-blue-500/10' : 'bg-primary/10'} blur-[120px] rounded-full`}></div>
            </div>

            {/* Profile Header */}
            <div className="relative z-10 flex items-center gap-5 mb-8">
                <div className="relative">
                    <div className={`w-20 h-20 rounded-3xl bg-white/5 border-2 ${accentBorder} overflow-hidden shadow-2xl`}>
                        <img src={user?.db_avatar_url || user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} className="w-full h-full object-cover" alt="Profile" />
                        {uploading && <div className="absolute inset-0 bg-black/60 flex items-center justify-center"><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div></div>}
                    </div>
                    <button onClick={() => fileInputRef.current?.click()} className={`absolute -bottom-1 -right-1 w-7 h-7 ${accentBg} rounded-xl flex items-center justify-center shadow-lg active:scale-90`}><span className="material-symbols-outlined text-xs text-secondary font-black">edit</span></button>
                    <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
                <div className="flex-1 min-w-0">
                    <h1 className="text-2xl font-black uppercase tracking-tighter truncate leading-none mb-1">{user?.db_full_name || 'Usuário Jobee'}</h1>
                    <p className="text-[9px] font-black uppercase tracking-widest text-white/40 truncate">{isRecruiter ? (user?.db_company_name || 'Recrutador') : (user?.db_metadata?.headline || 'Pronto para Polinizar')}</p>
                    <span className={`inline-block text-[8px] font-black uppercase tracking-widest px-3 py-1 rounded-full bg-white/5 border border-white/10 mt-2 ${accentColor}`}>{isRecruiter ? 'Empresa' : 'Talento'}</span>
                </div>
            </div>

            {/* Plan Widget */}
            <div onClick={() => setShowPlans(true)} className={`relative z-10 bg-gradient-to-br ${tierColors.bg} border ${tierColors.border} rounded-[2rem] p-5 mb-6 flex items-center justify-between group active:scale-[0.98] transition-all cursor-pointer shadow-xl`}>
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl ${tierColors.accent} flex items-center justify-center text-white shadow-lg`}>
                        <span className="material-symbols-outlined">{user?.db_subscription_tier === 'geleia' ? 'crown' : user?.db_subscription_tier === 'favo' ? 'hexagon' : 'spa'}</span>
                    </div>
                    <div>
                        <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40">Plano Atual</p>
                        <h3 className="text-sm font-black uppercase text-white tracking-widest leading-tight">{getTierDisplayName(user?.db_subscription_tier || 'nectar')}</h3>
                    </div>
                </div>
                <div className="flex items-center gap-2"><span className="text-[8px] font-black uppercase text-white/30 group-hover:text-white/60">Mudar</span><span className="material-symbols-outlined text-white/20">chevron_right</span></div>
            </div>

            {/* Action Grid */}
            <div className="relative z-10 grid grid-cols-2 gap-3 mb-6 flex-1 max-h-[220px]">
                {[
                    { icon: 'person_outline', label: 'Editar Perfil', action: () => onNavigate?.('onboarding') },
                    { icon: 'notifications_none', label: 'Notificações', action: () => setShowNotifications(true) },
                    { icon: 'settings_suggest', label: isRecruiter ? 'Vagas' : 'Radar', action: isRecruiter ? () => onNavigate?.('jobs') : () => setShowPreferences(true) },
                    { icon: 'help_outline', label: 'Suporte', action: () => alert('Suporte 24h 🐝') }
                ].map((item, idx) => (
                    <button key={idx} onClick={item.action} className="bg-white/5 border border-white/10 rounded-[1.5rem] p-4 flex flex-col items-center justify-center gap-2 hover:bg-white/10 active:scale-95 transition-all">
                        <span className={`material-symbols-outlined ${accentColor}`}>{item.icon}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest text-white/60">{item.label}</span>
                    </button>
                ))}
            </div>

            <button onClick={handleLogout} className="relative z-10 w-full h-14 bg-red-500/10 text-red-400 border border-red-500/20 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all mt-auto mb-4">
                <span className="material-symbols-outlined text-lg">logout</span><span className="text-[10px] font-black uppercase tracking-widest">Sair da Colmeia</span>
            </button>
            <div
                onClick={() => {
                    const clock = (window as any)._brandClicks || 0;
                    if (clock >= 4) {
                        onNavigate?.('brand');
                        (window as any)._brandClicks = 0;
                    } else {
                        (window as any)._brandClicks = clock + 1;
                    }
                }}
                className="flex justify-center items-center gap-2 py-2 cursor-pointer active:opacity-50"
            >
                <JobeeSymbol size={16} mode="color" />
                <span className="text-[7px] font-black text-white/20 uppercase tracking-[0.4em]">v1.0.5 - Jobee</span>
            </div>

            {/* Modals */}
            {showNotifications && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowNotifications(false)} />
                    <div className="relative w-full bg-secondary border-t border-white/10 rounded-t-[3rem] p-10 animate-in slide-in-from-bottom duration-300">
                        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-8" />
                        <h2 className={`text-2xl font-black uppercase tracking-tighter ${accentColor} mb-8`}>Notificações</h2>
                        <div className="space-y-4">
                            {Object.entries(notifConfig).map(([key, val]: any) => (
                                <div key={key} className="flex items-center justify-between p-5 bg-white/5 rounded-2xl">
                                    <span className="text-[10px] font-black uppercase text-white/80">{key.replace(/([A-Z])/g, ' $1')}</span>
                                    <button onClick={() => setNotifConfig(prev => ({ ...prev, [key]: !val }))} className={`w-12 h-6 rounded-full ${val ? accentBg : 'bg-white/10'} p-1 relative flex items-center transition-colors`}><div className={`w-4 h-4 rounded-full bg-white shadow-lg transition-transform ${val ? 'translate-x-6' : 'translate-x-0'}`} /></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowNotifications(false)} className={`w-full h-14 ${accentBg} text-secondary font-black rounded-2xl uppercase mt-8`}>Salvar</button>
                    </div>
                </div>
            )}

            {showPreferences && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPreferences(false)} />
                    <div className="relative w-full bg-secondary border-t border-white/10 rounded-t-[3rem] p-10 animate-in slide-in-from-bottom duration-300">
                        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-8" />
                        <h2 className={`text-2xl font-black uppercase tracking-tighter ${accentColor} mb-2`}>Radar Match</h2>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-10">Qual a distância da sua próxima vaga?</p>
                        <div className="space-y-6">
                            <div className="flex justify-between items-center"><span className="text-xs font-black uppercase text-white/70">Raio de Busca</span><span className={`text-sm font-black ${accentColor}`}>{searchRadius} km</span></div>
                            <input type="range" min="1" max="200" value={searchRadius} onChange={(e) => setSearchRadius(parseInt(e.target.value))} className={`w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary`} />
                            <button onClick={async () => { await supabase.from('profiles').update({ search_radius: searchRadius }).eq('id', user.id); setShowPreferences(false); }} className={`w-full h-14 ${accentBg} text-secondary font-black rounded-2xl uppercase mt-4`}>Aplicar</button>
                        </div>
                    </div>
                </div>
            )}

            {showPlans && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowPlans(false)} />
                    <div className="relative w-full bg-secondary border-t border-white/10 rounded-t-[3rem] p-10 animate-in slide-in-from-bottom duration-300 max-h-[85vh] flex flex-col">
                        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6 shrink-0" />
                        <h2 className={`text-2xl font-black uppercase tracking-tighter ${accentColor} mb-2 text-center`}>Assinaturas</h2>
                        <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mb-8 text-center shrink-0">Voe mais alto com Jobee Premium</p>
                        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x snap-mandatory flex-1 px-2">
                            {planData.map((plan) => (
                                <div key={plan.id} className="min-w-[240px] snap-center bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex flex-col relative overflow-hidden">
                                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 text-white shadow-lg`}><span className="material-symbols-outlined text-2xl">{plan.icon}</span></div>
                                    <h3 className="text-xl font-black uppercase text-white mb-1">{plan.name}</h3>
                                    <p className="text-2xl font-black text-white/90 mb-6">{plan.price}</p>
                                    <ul className="space-y-3 mb-8 flex-1">
                                        {plan.features.map(f => <li key={f} className="flex items-center gap-2 text-[10px] text-white/50 lowercase"><span className="material-symbols-outlined text-[12px] text-primary">check</span> {f}</li>)}
                                    </ul>
                                    {(() => {
                                        const weights: any = { 'nectar': 0, 'polen': 1, 'favo': 2, 'geleia': 3 };
                                        const currentWeight = weights[user?.db_subscription_tier || 'nectar'];
                                        const targetWeight = weights[plan.id];
                                        const isCurrent = user?.db_subscription_tier === plan.id;
                                        const isDowngrade = targetWeight < currentWeight;

                                        return (
                                            <button
                                                disabled={isCurrent || isDowngrade}
                                                onClick={() => handleSubscribe(plan.url)}
                                                className={`w-full h-12 rounded-xl font-black uppercase text-[11px] transition-all active:scale-95 ${isCurrent
                                                    ? 'bg-white/5 text-white/20'
                                                    : isDowngrade
                                                        ? 'bg-white/5 text-white/10'
                                                        : accentBg + ' text-secondary shadow-lg'
                                                    }`}
                                            >
                                                {isCurrent ? 'Ativo' : isDowngrade ? 'Bloqueado' : 'Assinar'}
                                            </button>
                                        );
                                    })()}
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowPlans(false)} className="w-full h-14 mt-4 bg-white/5 border border-white/10 text-white/40 font-black rounded-2xl uppercase">Voltar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProfilePage;
