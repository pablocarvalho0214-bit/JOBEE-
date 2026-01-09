
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { JobeeSymbol } from '../components/JobeeIdentity';
import { BeeaChat } from '../components/BeeaChat';

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
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [showPreferences, setShowPreferences] = useState(false);
    const [showBeea, setShowBeea] = useState(false);

    const [notifConfig, setNotifConfig] = useState({
        newApplications: true,
        messages: true,
        aiMatches: true,
        weeklyReport: false,
        tips: true
    });
    const [searchRadius, setSearchRadius] = useState<number>(50);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const companyLogoInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const isRecruiter = role === 'recruiter';
    const accentColor = isRecruiter ? 'text-blue-400' : 'text-primary';
    const accentBg = isRecruiter ? 'bg-blue-500' : 'bg-primary';

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
                const companyColor = profile.metadata?.company_color || '#3B82F6';

                setUser({
                    ...user,
                    db_avatar_url: profile.avatar_url,
                    db_full_name: profile.full_name,
                    db_metadata: profile.metadata,
                    db_company_name: profile.company_name,
                    db_company_logo: profile.company_logo_url,
                    db_company_color: companyColor,
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

    const handleCompanyLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true);
            const file = event.target.files?.[0];
            if (!file) return;
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-company-${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage.from('avatars').upload(`avatars/${fileName}`, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(`avatars/${fileName}`);
            await supabase.from('profiles').update({ company_logo_url: publicUrl }).eq('id', user.id);
            await fetchUser();
        } catch (error: any) { console.error('Error:', error.message); } finally { setUploading(false); }
    };

    const handleSubscribe = (paymentUrl: string) => {
        if (!user || !paymentUrl || paymentUrl === '#') return;
        const finalUrl = `${paymentUrl}?prefilled_email=${encodeURIComponent(user.email || '')}&client_reference_id=${user.id}`;
        window.open(finalUrl, '_blank');
    };

    const getTierDisplayName = (tier: string) => {
        const names: any = { 'nectar': 'Néctar', 'polen': 'Pólen', 'favo': 'Favo', 'geleia': 'Geleia' };
        return names[tier] || 'Néctar';
    };

    const getTierColors = (tier: string) => {
        const colors: any = {
            'nectar': { bg: 'from-slate-600/20 to-slate-950/40', border: 'border-slate-500/30' },
            'polen': { bg: 'from-blue-600/20 to-blue-950/40', border: 'border-blue-500/30' },
            'favo': { bg: 'from-yellow-600/20 to-yellow-950/40', border: 'border-yellow-500/30' },
            'geleia': { bg: 'from-purple-600/20 to-purple-950/40', border: 'border-purple-500/30' }
        };
        return colors[tier] || colors['nectar'];
    };

    const planData = [
        { id: 'nectar', name: 'Néctar', price: 'Grátis', icon: 'spa', color: 'from-slate-400 via-slate-500 to-slate-400', bg: 'bg-slate-900/80', glow: 'shadow-[0_0_20px_rgba(148,163,184,0.3)]', features: isRecruiter ? ['3 Vagas', '10 Recrutas'] : ['3 Super Likes', 'Filtro Básico'] },
        { id: 'polen', name: 'Pólen', price: 'R$ 29,90', icon: 'filter_vintage', color: 'from-blue-400 via-cyan-400 to-blue-400', bg: 'bg-blue-900/40', glow: 'shadow-[0_0_25px_rgba(59,130,246,0.5)]', features: isRecruiter ? ['10 Vagas', 'Chats Ilimitados'] : ['Likes Ilimitados', 'Ver Visitas'] },
        { id: 'favo', name: 'Favo', price: 'R$ 59,90', icon: 'hexagon', color: 'from-yellow-400 via-orange-400 to-yellow-400', bg: 'bg-yellow-900/40', glow: 'shadow-[0_0_30px_rgba(234,179,8,0.5)]', features: isRecruiter ? ['Vagas ILMD', 'IA Match'] : ['Quem deu Match', 'Boost Diário'] },
        { id: 'geleia', name: 'Geleia', price: 'R$ 99,90', icon: 'crown', color: 'from-purple-400 via-pink-400 to-purple-400', bg: 'bg-purple-900/40', glow: 'shadow-[0_0_35px_rgba(168,85,247,0.5)]', features: isRecruiter ? ['Gestor VIP', 'API'] : ['Perfil Destaque', 'Mentoria IA'] },
    ];

    const tierColors = getTierColors(user?.db_subscription_tier || 'nectar');
    const companyColor = user?.db_company_color || '#3B82F6';

    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0B0F1A] text-white relative overflow-hidden font-sans px-4 pt-6 pb-24">

            {/* PHYSICAL DUAL-ID ACCESS BADGE */}
            <div className="relative z-20 mb-8">
                {isRecruiter ? (
                    <div className="relative w-full h-32 bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] overflow-hidden flex items-center justify-between px-2">

                        {/* LEFT: COMPANY IDENTITY (Square) */}
                        <div
                            onClick={() => companyLogoInputRef.current?.click()}
                            className="flex-1 flex flex-col items-center justify-center gap-1.5 cursor-pointer group active:scale-95 transition-transform py-2"
                        >
                            <div className="w-16 h-16 shrink-0 rounded-lg bg-black/40 border border-white/10 p-1 relative overflow-hidden group-hover:border-primary/50 transition-colors shadow-lg">
                                <img src={user?.db_company_logo || `https://api.dicebear.com/7.x/identicon/svg?seed=${user?.db_company_name}`} className="w-full h-full object-cover rounded-md" alt="Company" />
                                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="material-symbols-outlined text-xs">photo_camera</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[6px] font-black uppercase tracking-[0.3em] text-white/30">Empresa</span>
                                <h2 className="text-[11px] font-black uppercase text-white leading-tight truncate max-w-[110px]">{user?.db_company_name || 'EMPRESA'}</h2>
                            </div>
                        </div>

                        {/* MINIMAL DIVIDER */}
                        <div className="h-16 w-px bg-white/5 mx-1" />

                        {/* RIGHT: RECRUITER IDENTITY (Round) */}
                        <div
                            onClick={() => fileInputRef.current?.click()}
                            className="flex-1 flex flex-col items-center justify-center gap-1.5 cursor-pointer group active:scale-95 transition-transform py-2"
                        >
                            <div className="w-16 h-16 shrink-0 rounded-full bg-slate-800 border-2 border-slate-700/50 p-0.5 relative overflow-hidden group-hover:border-primary/50 transition-colors shadow-lg">
                                <img src={user?.db_avatar_url || user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} className="w-full h-full object-cover rounded-full" alt="Profile" />
                                <div className="absolute inset-0 bg-primary/20 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="material-symbols-outlined text-[10px]">edit</span>
                                </div>
                            </div>
                            <div className="flex flex-col items-center">
                                <span className="text-[6px] font-black uppercase tracking-[0.3em] text-white/30">Recrutador</span>
                                <h2 className="text-[11px] font-black uppercase text-white leading-tight truncate max-w-[110px]">{user?.db_full_name?.split(' ')[0] || 'RECRUTADOR'}</h2>
                            </div>
                        </div>

                        {/* Subtle Background Glow */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-20 pointer-events-none" />
                    </div>
                ) : (
                    /* CANDIDATE VIEW */
                    <div className="flex items-center justify-between bg-slate-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-5 shadow-2xl">
                        <div className="flex flex-col">
                            <span className="text-[7px] font-black uppercase text-primary tracking-widest mb-1">Candidato</span>
                            <h2 className="text-xl font-black uppercase text-white leading-none">{user?.db_full_name?.split(' ')[0] || 'USER'}</h2>
                        </div>
                        <div className="flex items-center gap-4">
                            <JobeeSymbol size={24} mode="light" />
                            <div className="w-14 h-14 rounded-2xl bg-slate-800 border border-white/10 p-1 relative shadow-2xl group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                                <img src={user?.db_avatar_url || user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} className="w-full h-full object-cover rounded-xl" />
                            </div>
                        </div>
                    </div>
                )}

                {/* Mandatory Hidden Inputs */}
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                <input type="file" ref={companyLogoInputRef} onChange={handleCompanyLogoChange} className="hidden" accept="image/*" />
            </div>

            {/* HIGHLIGHTED PLANS SECTION */}
            <div className="relative z-20 flex-1 flex flex-col justify-start">
                <div className="flex items-center justify-between mb-4 px-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Níveis de Atração</p>
                    <div className="flex items-center gap-2">
                        <span className="text-[8px] font-black bg-white/5 px-2 py-0.5 rounded-full uppercase text-white/10 leading-none">Deslize</span>
                    </div>
                </div>

                <div className="relative group/slider">
                    <div
                        ref={scrollRef}
                        className="flex gap-5 overflow-x-auto pb-6 px-1 scrollbar-hide snap-x snap-mandatory h-[175px]"
                    >
                        {planData.map((plan) => {
                            const isCurrent = user?.db_subscription_tier === plan.id;
                            const weights: any = { 'nectar': 0, 'polen': 1, 'favo': 2, 'geleia': 3 };
                            const currentWeight = weights[user?.db_subscription_tier || 'nectar'];
                            const targetWeight = weights[plan.id];
                            const isLocked = targetWeight < currentWeight && plan.id === 'nectar';

                            return (
                                <div
                                    key={plan.id}
                                    onClick={() => setSelectedPlan(plan)}
                                    className={`
                                        min-w-[190px] h-[155px] snap-center rounded-[2.5rem] p-[1.5px]
                                        bg-gradient-to-br ${plan.color} relative transition-all active:scale-95 group cursor-pointer
                                        ${isCurrent ? `${plan.glow}` : 'opacity-80 hover:opacity-100'}
                                    `}
                                >
                                    <div className={`w-full h-full rounded-[2.4rem] ${plan.bg} backdrop-blur-xl p-5 flex flex-col justify-between relative overflow-hidden`}>
                                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />

                                        <div className="flex justify-between items-start relative z-10">
                                            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center text-white shadow-xl group-hover:rotate-6 transition-transform`}>
                                                <span className="material-symbols-outlined text-xl">{plan.icon}</span>
                                            </div>
                                            {isCurrent && <span className="text-[7.5px] font-black bg-white text-secondary px-2 py-1 rounded-full uppercase tracking-tighter shadow-lg">Inscrito</span>}
                                        </div>
                                        <div className="relative z-10">
                                            <h3 className="text-xl font-black uppercase tracking-tighter text-white leading-none mb-1">{plan.name}</h3>
                                            <div className="flex justify-between items-center bg-black/20 px-2.5 py-1.5 rounded-xl border border-white/5">
                                                <p className="text-[10px] font-black text-white/60">{plan.price}</p>
                                                <span className={`text-[7px] font-black uppercase tracking-widest ${isLocked ? 'text-red-400' : isCurrent ? 'text-white/30' : 'text-white'}`}>
                                                    {isCurrent ? 'Ativo' : isLocked ? 'Bloqueado' : 'Selecionar'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* FLOATING PULSING ARROW (Only visible if scrolled to left) */}
                    <button
                        onClick={scrollRight}
                        className="absolute right-[-10px] top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center shadow-lg z-30 animate-pulse active:scale-75 transition-all"
                    >
                        <span className="material-symbols-outlined text-primary text-sm">east</span>
                    </button>
                </div>

                {/* COMPACT ACTION GRID */}
                <div className="mt-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 mb-4 px-1 leading-none text-center">Configurações</p>
                    <div className="grid grid-cols-2 gap-3 pb-4">
                        {[
                            { icon: 'account_circle', label: 'EDITAR', action: () => onNavigate?.('onboarding'), color: isRecruiter ? 'text-blue-400' : 'text-primary' },
                            { icon: 'notifications', label: 'ALERTAS', action: () => setShowNotifications(true), color: 'text-orange-400' },
                            { icon: 'radar', label: 'RADAR', action: () => setShowPreferences(true), color: 'text-pink-400' },
                            { icon: 'smart_toy', label: 'Beea AI', action: () => setShowBeea(true), color: 'text-emerald-400' }
                        ].map((item, idx) => (
                            <button key={idx} onClick={item.action} className="relative group bg-white/5 hover:bg-white/10 border border-white/5 rounded-2xl py-5 flex flex-col items-center justify-center gap-2 transition-all duration-300 active:scale-95">
                                <span className={`material-symbols-outlined text-2xl ${item.color} group-hover:scale-110 transition-transform`}>{item.icon}</span>
                                <span className="text-[8px] font-black uppercase tracking-[0.3em] text-white/30 group-hover:text-white/70">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* LOGOUT */}
                <button
                    onClick={handleLogout}
                    className="w-full h-12 bg-red-500/5 hover:bg-red-500/10 border border-red-500/10 rounded-2xl flex items-center justify-center gap-3 active:scale-95 transition-all mt-2 opacity-50 hover:opacity-100"
                >
                    <span className="material-symbols-outlined text-red-500/60 text-base">logout</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.4em] text-red-500/60 leading-none">Encerrar Sessão</span>
                </button>
            </div>

            {/* MODALS (Benefits) */}
            {selectedPlan && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setSelectedPlan(null)} />
                    <div className="relative w-full bg-[#0F172A] border-t border-white/10 rounded-t-[3.5rem] p-8 animate-in slide-in-from-bottom duration-500 flex flex-col max-h-[92vh] shadow-2xl overflow-hidden">
                        <header className="text-center mb-8 shrink-0 flex flex-col items-center relative">
                            <button onClick={() => setSelectedPlan(null)} className="absolute top-0 right-0 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center active:scale-90 z-20"><span className="material-symbols-outlined text-lg opacity-40">close</span></button>
                            <div className={`w-20 h-20 rounded-[2.5rem] p-[1.5px] bg-gradient-to-br ${selectedPlan.color} mb-4 ${selectedPlan.glow}`}>
                                <div className={`w-full h-full rounded-[2.4rem] ${selectedPlan.bg} flex items-center justify-center shadow-2xl`}>
                                    <span className="material-symbols-outlined text-5xl text-white">{selectedPlan.icon}</span>
                                </div>
                            </div>
                            <h2 className="text-4xl font-black uppercase tracking-tighter text-white mb-1 leading-none">{selectedPlan.name}</h2>
                            <p className="text-2xl font-black text-primary">{selectedPlan.price}</p>
                        </header>

                        <div className="flex-1 overflow-y-auto scrollbar-hide space-y-4 mb-8 px-2 text-left">
                            {selectedPlan.features.map((f: string) => (
                                <div key={f} className={`flex items-center gap-4 bg-white/5 p-5 rounded-3xl border border-white/5`}>
                                    <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${selectedPlan.color} flex items-center justify-center shadow-lg`}>
                                        <span className="material-symbols-outlined text-sm text-white font-black">bolt</span>
                                    </div>
                                    <span className="text-[11px] font-black text-white/80 uppercase tracking-widest">{f}</span>
                                </div>
                            ))}
                        </div>

                        {(() => {
                            const isCurrent = user?.db_subscription_tier === selectedPlan.id;
                            const weights: any = { 'nectar': 0, 'polen': 1, 'favo': 2, 'geleia': 3 };
                            const currentWeight = weights[user?.db_subscription_tier || 'nectar'];
                            const isLocked = selectedPlan.id === 'nectar' && currentWeight > 0;

                            return (
                                <button
                                    onClick={() => { if (!isCurrent && !isLocked) handleSubscribe(selectedPlan.url); setSelectedPlan(null); }}
                                    disabled={isCurrent || isLocked}
                                    className={`w-full h-18 py-6 rounded-[2.2rem] font-black uppercase tracking-[0.2em] shadow-2xl transition-all active:scale-95 ${isCurrent ? 'bg-white/5 text-white/20' : isLocked ? 'bg-red-500/10 text-red-500/40 border border-red-500/10' : 'bg-primary text-secondary shadow-[0_20px_40px_-10px_rgba(250,204,21,0.3)]'}`}
                                >
                                    {isCurrent ? 'Plano Inscrito' : isLocked ? 'Downgrade Indisponível' : 'Ativar Upgrade'}
                                </button>
                            );
                        })()}

                        <button onClick={() => setSelectedPlan(null)} className="w-full h-14 mt-4 text-[9px] font-black uppercase text-white/20 tracking-widest underline underline-offset-8 decoration-white/10">Voltar ao Perfil</button>
                    </div>
                </div>
            )}

            {showNotifications && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowNotifications(false)} />
                    <div className="relative w-full bg-[#0B0F1A] border-t border-white/10 rounded-t-[3.5rem] p-10 animate-in slide-in-from-bottom duration-500">
                        <h2 className={`text-4xl font-black uppercase tracking-tighter ${isRecruiter ? 'text-blue-400' : 'text-primary'} mb-8 text-center`}>Alertas</h2>
                        <div className="space-y-4 mb-10">
                            {Object.entries(notifConfig).map(([key, val]: any) => (
                                <div key={key} className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl">
                                    <span className="text-[10px] font-black uppercase text-white/70 tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
                                    <button onClick={() => setNotifConfig(prev => ({ ...prev, [key]: !val }))} className={`w-14 h-7 rounded-full ${val ? (isRecruiter ? 'bg-blue-500' : 'bg-primary') : 'bg-white/10'} p-1 transition-colors relative`}><div className={`w-5 h-5 rounded-full bg-white transition-transform ${val ? 'translate-x-7' : 'translate-x-0'}`} /></button>
                                </div>
                            ))}
                        </div>
                        <button onClick={() => setShowNotifications(false)} className={`w-full h-18 ${isRecruiter ? 'bg-blue-500' : 'bg-primary'} text-secondary font-black rounded-[2rem] uppercase`}>Confirmar</button>
                    </div>
                </div>
            )}

            {/* Radar Modal */}
            {showPreferences && (
                <div className="fixed inset-0 z-[100] flex items-end justify-center">
                    <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowPreferences(false)} />
                    <div className="relative w-full bg-[#0B0F1A] border-t border-white/10 rounded-t-[3.5rem] p-10 animate-in slide-in-from-bottom duration-500">
                        <h2 className={`text-4xl font-black uppercase tracking-tighter ${isRecruiter ? 'text-blue-400' : 'text-primary'} mb-2 text-center`}>Radar</h2>
                        <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.4em] mb-12 text-center shrink-0">Defina o alcance da colmeia</p>
                        <div className="space-y-8 mb-12 px-2">
                            <div className="flex justify-between items-end"><span className="text-[10px] font-black uppercase text-white/40">Raio de Busca</span><span className={`text-2xl font-black ${isRecruiter ? 'text-blue-400' : 'text-primary'}`}>{searchRadius} km</span></div>
                            <input type="range" min="1" max="200" value={searchRadius} onChange={(e) => setSearchRadius(parseInt(e.target.value))} className={`w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary`} />
                        </div>
                        <button onClick={async () => { await supabase.from('profiles').update({ search_radius: searchRadius }).eq('id', user.id); setShowPreferences(false); }} className={`w-full h-18 ${isRecruiter ? 'bg-blue-500' : 'bg-primary'} text-secondary font-black rounded-[2rem] uppercase`}>Salvar Raio</button>
                    </div>
                </div>
            )}

            <div className="absolute bottom-6 left-0 right-0 flex flex-col items-center gap-1 opacity-20 pointer-events-none z-10">
                <div className="flex items-center gap-1 grayscale"><JobeeSymbol size={12} mode="light" /><span className="text-[6px] font-black text-white uppercase tracking-[0.6em]">BUILD 1.1.0</span></div>
            </div>

            <BeeaChat isOpen={showBeea} onClose={() => setShowBeea(false)} userId={user?.id} />
        </div>
    );
};

export default ProfilePage;
