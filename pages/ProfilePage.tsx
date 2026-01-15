
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { supabase } from '../services/supabaseClient';
import { JobeeSymbol } from '../components/JobeeIdentity';
import { BeeaChat } from '../components/BeeaChat';
import { RadarMap } from '../components/RadarMap';

interface ProfilePageProps {
    role?: 'candidate' | 'recruiter';
    onNavigate?: (page: any) => void;
    initialTab?: 'notifications' | 'profile';
    initialProfile?: any;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ role = 'candidate', onNavigate, initialTab, initialProfile }) => {
    const [user, setUser] = useState<any>(initialProfile || null);
    const [uploading, setUploading] = useState(false);
    const [showNotifications, setShowNotifications] = useState(initialTab === 'notifications');
    const [showPlans, setShowPlans] = useState(false);
    const [showEditMenu, setShowEditMenu] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [showPreferences, setShowPreferences] = useState(false);
    const [showBeea, setShowBeea] = useState(false);
    const [activePlanIdx, setActivePlanIdx] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startYRef = useRef(0);

    const handleStart = (clientY: number) => {
        setIsDragging(true);
        startYRef.current = clientY - dragOffset;
    };

    const handleMove = (clientY: number) => {
        if (!isDragging) return;
        const newY = Math.max(0, clientY - startYRef.current);
        setDragOffset(newY);
    };

    const handleEnd = () => {
        setIsDragging(false);
        if (dragOffset > 150) {
            if (showPlans && selectedPlan) {
                setSelectedPlan(null);
            } else {
                setShowPlans(false);
                setShowNotifications(false);
                setShowPreferences(false);
                setShowEditMenu(false);
            }
        }
        setDragOffset(0);
    };
    // 3D Carousel State

    const [notifConfig, setNotifConfig] = useState({
        newApplications: true,
        messages: true,
        aiMatches: true,
        weeklyReport: false,
        tips: true
    });
    const [searchRadius, setSearchRadius] = useState<number>(50);
    const [radarLat, setRadarLat] = useState<number>(0);
    const [radarLng, setRadarLng] = useState<number>(0);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const companyLogoInputRef = useRef<HTMLInputElement>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    const isRecruiter = role === 'recruiter';
    const accentColor = isRecruiter ? 'text-blue-400' : 'text-primary';
    const accentBg = isRecruiter ? 'bg-blue-500' : 'bg-primary';

    useEffect(() => {
        fetchUser();
        window.addEventListener('focus', fetchUser);
        const subscriptionChannel = supabase
            .channel('profile-changes')
            .on(
                'postgres_changes',
                { event: 'UPDATE', schema: 'public', table: 'profiles', filter: user ? `id=eq.${user.id}` : undefined },
                (payload) => {
                    if (payload.new) {
                        setUser((prev: any) => {
                            const updated = {
                                ...prev,
                                db_subscription_status: payload.new.subscription_status,
                                db_subscription_tier: payload.new.subscription_tier || 'nectar'
                            };
                            return updated;
                        });
                    }
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(subscriptionChannel);
            window.removeEventListener('focus', fetchUser);
        };
    }, [user?.id]);

    useEffect(() => {
        const shouldReturn = localStorage.getItem('return_to_edit_menu');
        if (shouldReturn) {
            setShowEditMenu(true);
            localStorage.removeItem('return_to_edit_menu');
        }
    }, []);

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
                if (profile.metadata?.location_lat) setRadarLat(profile.metadata.location_lat);
                if (profile.metadata?.location_lng) setRadarLng(profile.metadata.location_lng);
                else {
                    // Try to approximate from text location or default to SP
                    // Defaulting to SP for now if empty
                    setRadarLat(-23.5505);
                    setRadarLng(-46.6333);
                }
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

    const handleSubscribe = async (paymentUrl: string) => {
        if (!user || !paymentUrl || paymentUrl === '#') return;
        const separator = paymentUrl.includes('?') ? '&' : '?';
        const finalUrl = `${paymentUrl}${separator}prefilled_email=${encodeURIComponent(user.email || '')}&client_reference_id=${user.id}`;

        if (Capacitor.isNativePlatform()) {
            await Browser.open({ url: finalUrl });
        } else {
            window.open(finalUrl, '_blank');
        }
    };

    const getTierDisplayName = (tier: string) => {
        const names: any = { 'nectar': 'Néctar', 'polen': 'Pólen', 'favo': 'Favo', 'geleia': 'Geleia' };
        return names[tier] || 'Néctar';
    };

    const getTierColors = (tier: string) => {
        const colors: any = {
            'nectar': { bg: 'from-slate-400 via-slate-500 to-slate-400', border: 'border-slate-400' },
            'polen': { bg: 'from-blue-400 via-cyan-400 to-blue-400', border: 'border-blue-400' },
            'favo': { bg: 'from-yellow-400 via-orange-400 to-yellow-400', border: 'border-yellow-400' },
            'geleia': { bg: 'from-purple-400 via-pink-400 to-purple-400', border: 'border-purple-400' }
        };
        return colors[tier] || colors['nectar'];
    };

    const planData = [
        { id: 'nectar', name: 'Néctar', price: 'Grátis', icon: 'spa', color: 'from-slate-400 via-slate-500 to-slate-400', bg: 'bg-slate-900/80', glow: 'shadow-[0_0_20px_rgba(148,163,184,0.3)]', features: isRecruiter ? ['3 Vagas', '10 Recrutas'] : ['3 Super Likes', 'Filtro Básico'], url: '#' },
        { id: 'polen', name: 'Pólen', price: 'R$ 29,90', icon: 'filter_vintage', color: 'from-blue-400 via-cyan-400 to-blue-400', bg: 'bg-blue-900/40', glow: 'shadow-[0_0_25px_rgba(59,130,246,0.5)]', features: isRecruiter ? ['10 Vagas', 'Chats Ilimitados'] : ['Likes Ilimitados', 'Ver Visitas'], url: 'https://buy.stripe.com/test_14A8wOcaI0Lw2YP3CS87K00' },
        { id: 'favo', name: 'Favo', price: 'R$ 59,90', icon: 'hexagon', color: 'from-yellow-400 via-orange-400 to-yellow-400', bg: 'bg-yellow-900/40', glow: 'shadow-[0_0_30px_rgba(234,179,8,0.5)]', features: isRecruiter ? ['Vagas ILMD', 'IA Match'] : ['Quem deu Match', 'Boost Diário'], url: 'https://buy.stripe.com/test_dRm5kC8Yw65Q0QH4GW87K01' },
        { id: 'geleia', name: 'Geleia', price: 'R$ 99,90', icon: 'crown', color: 'from-purple-400 via-pink-400 to-purple-400', bg: 'bg-purple-900/40', glow: 'shadow-[0_0_35px_rgba(168,85,247,0.5)]', features: isRecruiter ? ['Gestor VIP', 'API'] : ['Perfil Destaque', 'Mentoria IA'], url: 'https://buy.stripe.com/test_eVqdR8eiQeCmarhflA87K02' },
    ];

    const tierColors = getTierColors(user?.db_subscription_tier || 'nectar');
    const companyColor = user?.db_company_color || '#3B82F6';

    const scrollRight = () => {
        if (scrollRef.current) {
            scrollRef.current.scrollBy({ left: 200, behavior: 'smooth' });
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0B0F1A] text-white relative overflow-hidden font-sans px-4 pb-4" style={{ paddingTop: 'calc(0.5rem + env(safe-area-inset-top))' }}>

            {/* AMBIENT BACKGROUND */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[10%] right-[-10%] w-[60%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full rotate-45" />
                <div className="absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='%23ffffff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
                    backgroundSize: '30px 52px'
                }} />
            </div>

            {/* PHYSICAL ID BADGE AREA (LAYOUT 3 FIXED) */}
            <div className="relative z-20 mb-6 flex justify-center shrink-0">
                <div className="relative w-full max-w-[340px] aspect-[1.8/1] group animate-in fade-in slide-in-from-right-8 duration-700">
                    <div className={`relative h-full w-full rounded-[2rem] bg-[#111827] border border-white/10 shadow-2xl overflow-hidden`}>
                        {/* Colored left stripe */}
                        <div className={`absolute left-0 top-0 bottom-0 w-2 ${tierColors.bg}`} />

                        {/* Main content area - unified without internal borders */}
                        <div className="relative h-full w-full p-8 flex flex-col justify-between">
                            <div className="flex justify-between items-start pr-32">
                                <div>
                                    <h2 className="text-2xl font-black uppercase text-white tracking-tighter leading-none">{user?.db_full_name || 'IDENTIDADE'}</h2>
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.3em] mt-2 underline decoration-amber-500/50 underline-offset-4">{isRecruiter ? 'Hiring Lead' : 'Prime Member'}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Acesso Nível</span>
                                    <span className={`text-[11px] font-black uppercase italic ${tierColors.bg.replace('from-', 'text-')}`}>{getTierDisplayName(user?.db_subscription_tier || 'nectar')}</span>
                                </div>
                                <div className="w-px h-8 bg-white/10" />
                                <div className="flex flex-col">
                                    <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">ID Usuário</span>
                                    <span className="text-[10px] font-mono text-white/40">#{user?.id?.substring(0, 8)}</span>
                                </div>
                            </div>
                        </div>

                        {/* Photo - absolutely positioned on the right */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 w-[120px] h-[120px]">
                            <div className="w-full h-full rounded-2xl overflow-hidden group/photo relative shadow-2xl">
                                <img src={user?.db_avatar_url || user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} className="w-full h-full object-cover transition-all duration-700" alt="Portrait" />
                                <div
                                    onClick={() => fileInputRef.current?.click()}
                                    className="absolute inset-0 bg-black/60 opacity-0 group-hover/photo:opacity-100 flex items-center justify-center transition-opacity cursor-pointer"
                                >
                                    <span className="material-symbols-outlined text-white text-lg">photo_camera</span>
                                </div>
                            </div>
                        </div>

                        {/* Fingerprint watermark */}
                        <span className="absolute bottom-4 right-4 material-symbols-outlined text-[40px] text-white/[0.02] rotate-12 scale-150 pointer-events-none">fingerprint</span>
                    </div>
                </div>
            </div>

            {/* Mandatory Hidden Inputs */}
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
            <input type="file" ref={companyLogoInputRef} onChange={handleCompanyLogoChange} className="hidden" accept="image/*" />

            {/* PREMIUM LIST MENU */}
            <div className="relative z-20 flex-1 flex flex-col gap-3 mt-6">
                {[
                    { id: 'plans', icon: 'hexagon', label: 'Planos & Assinatura', sub: 'Gerencie sua colmeia', action: () => setShowPlans(true), color: 'text-amber-400' },
                    { id: 'profile', icon: 'person_edit', label: 'Meu Perfil', sub: 'Editar Informações', action: () => setShowEditMenu(true), color: 'text-blue-400' },
                    { id: 'radar', icon: 'radar', label: 'Raio de Alcance', sub: 'Preferências de Match', action: () => setShowPreferences(true), color: 'text-pink-400' },
                    { id: 'notifications', icon: 'notifications', label: 'Central de Alertas', sub: 'Push e In-app', action: () => setShowNotifications(true), color: 'text-orange-400' },
                    { id: 'beea', icon: 'smart_toy', label: 'Beea AI Assistant', sub: 'Insights Inteligentes', action: () => setShowBeea(true), color: 'text-emerald-400' },
                ].map((item) => (
                    <button
                        key={item.id}
                        onClick={item.action}
                        className="group relative w-full h-[72px] bg-white/[0.03] hover:bg-white/[0.08] border border-white/5 rounded-3xl flex items-center px-5 gap-4 transition-all active:scale-[0.98] active:bg-white/[0.1]"
                    >
                        {/* ICON HEXAGONAL BACKGROUND */}
                        <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                            <div className="absolute inset-0 bg-white/5 rotate-45 rounded-xl transition-transform duration-500" />
                            <span className={`material-symbols-outlined text-2xl ${item.color} drop-shadow-[0_0_8px_rgba(255,255,255,0.2)]`}>
                                {item.icon}
                            </span>
                        </div>

                        {/* TEXT AREA */}
                        <div className="flex-1 text-left">
                            <p className="text-[13px] font-black uppercase tracking-wider text-white group-hover:translate-x-1 transition-transform">{item.label}</p>
                            <p className="text-[9px] font-bold text-white/30 uppercase tracking-[0.2em] mt-0.5">{item.sub}</p>
                        </div>

                        {/* ARROW */}
                        <span className="material-symbols-outlined text-white/10 group-hover:text-white/40 group-hover:translate-x-1 transition-all">chevron_right</span>
                    </button>
                ))}
            </div>

            {/* SUBSCRIPTION PLANS MODAL/VIEW TRIGGER */}
            {
                showPlans && createPortal(
                    <div className="fixed inset-0 z-[500] flex items-end justify-center">
                        <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => { setShowPlans(false); setSelectedPlan(null); }} />
                        <div
                            className="relative w-full h-[90vh] bg-[#0F172A] border-t border-white/10 rounded-t-[3.5rem] p-6 flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden transition-transform"
                            style={{ transform: `translateY(${!selectedPlan ? dragOffset : 0}px)` }}
                            onTouchStart={(e) => !selectedPlan && handleStart(e.touches[0].clientY)}
                            onTouchMove={(e) => !selectedPlan && handleMove(e.touches[0].clientY)}
                            onTouchEnd={handleEnd}
                            onMouseDown={(e) => !selectedPlan && handleStart(e.clientY)}
                            onMouseMove={(e) => !selectedPlan && handleMove(e.clientY)}
                            onMouseUp={handleEnd}
                            onMouseLeave={handleEnd}
                        >
                            {/* DRAG HANDLE FOR DISMISSAL */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full z-30" />

                            <header className="flex items-center justify-between mb-8 px-2 mt-4">
                                <div className="flex flex-col">
                                    <h2 className="text-3xl font-black text-white italic uppercase leading-none">Upgrade</h2>
                                    <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mt-1">Escolha seu nível</p>
                                </div>
                                <button onClick={() => { setShowPlans(false); setSelectedPlan(null); }} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center active:scale-90 transition-all group">
                                    <span className="material-symbols-outlined text-white/40 group-hover:text-white">close</span>
                                </button>
                            </header>

                            <div className="flex-1 overflow-y-auto space-y-4 pb-10 scrollbar-hide">
                                {planData.map((plan, idx) => {
                                    const isOwned = user?.db_subscription_tier === plan.id;
                                    return (
                                        <div
                                            key={plan.id}
                                            onClick={() => setSelectedPlan(plan)}
                                            className={`relative p-6 rounded-[2.5rem] border ${isOwned ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-white/[0.02]'} flex items-center justify-between group active:scale-[0.98] transition-all`}
                                        >
                                            <div className="flex items-center gap-5">
                                                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${plan.color} flex items-center justify-center shadow-lg transition-transform group-hover:scale-110`}>
                                                    <span className="material-symbols-outlined text-3xl text-white">{plan.icon || 'hexagon'}</span>
                                                </div>
                                                <div>
                                                    <h3 className="text-xl font-black uppercase text-white italic">{plan.name}</h3>
                                                    <p className="text-xs font-bold text-white/40">{plan.price}</p>
                                                </div>
                                            </div>
                                            {isOwned ? (
                                                <span className="text-[9px] font-black text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">Ativo</span>
                                            ) : (
                                                <span className="material-symbols-outlined text-white/20 group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {/* MINIMAL LOGOUT */}
            <div className="mt-auto px-10 shrink-0 pb-4">
                <button
                    onClick={handleLogout}
                    className="w-full h-10 bg-red-500/5 border border-red-500/10 rounded-full flex items-center justify-center gap-2 active:scale-95 transition-all opacity-40 hover:opacity-100"
                >
                    <span className="material-symbols-outlined text-red-500/60 text-sm">logout</span>
                    <span className="text-[9px] font-black uppercase tracking-[0.3em] text-red-500/60 leading-none">Encerrar Sessão</span>
                </button>
            </div>

            <div className="flex flex-col items-center gap-1 opacity-20 pointer-events-none mb-4 shrink-0">
                <div className="flex items-center gap-1.5 grayscale"><JobeeSymbol size={14} mode="light" /><span className="text-[7px] font-black text-white uppercase tracking-[0.5em]">JOBEE ENGINE v1.2.0</span></div>
            </div>

            {/* EDIT PROFILE TOPIC SELECTOR */}
            {
                showEditMenu && createPortal(
                    <div className="fixed inset-0 z-[500] flex items-end justify-center">
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowEditMenu(false)} />
                        <div
                            className={`relative w-full bg-[#0F172A] border-t border-white/10 rounded-t-[3.5rem] p-8 animate-in slide-in-from-bottom duration-500 flex flex-col max-h-[90vh] shadow-2xl ${!isDragging ? 'transition-transform duration-300' : ''}`}
                            style={{ transform: `translateY(${dragOffset}px)` }}
                            onTouchStart={(e) => handleStart(e.touches[0].clientY)}
                            onTouchMove={(e) => handleMove(e.touches[0].clientY)}
                            onTouchEnd={handleEnd}
                            onMouseDown={(e) => handleStart(e.clientY)}
                            onMouseMove={(e) => handleMove(e.clientY)}
                            onMouseUp={handleEnd}
                            onMouseLeave={handleEnd}
                        >
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full z-30 pointer-events-none" />

                            <header className="mb-8 mt-4 text-center">
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-white italic">O que vamos mudar?</h2>
                                <p className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mt-1">Selecione uma categoria da sua identidade</p>
                            </header>

                            <div className="flex flex-col gap-3 pb-8 overflow-y-auto scrollbar-hide">
                                {(isRecruiter ? [
                                    { step: 1, icon: 'badge', label: 'Identidade Visual', sub: 'Logo e Foto de Perfil', color: 'bg-blue-500' },
                                    { step: 2, icon: 'business', label: 'Dados da Colmeia', sub: 'Empresa, CNPJ e Setor', color: 'bg-emerald-500' },
                                    { step: 3, icon: 'person_apron', label: 'Líder do Enxame', sub: 'Responsável e Contato', color: 'bg-orange-500' },
                                    { step: 4, icon: 'forum', label: 'Sede e Cultura', sub: 'Localização e Bio', color: 'bg-pink-500' },
                                ] : [
                                    { step: 1, icon: 'face', label: 'Identidade Bee', sub: 'Avatar, Nome e Bio', color: 'bg-primary' },
                                    { step: 2, icon: 'rocket_launch', label: 'Sua Próxima Flor', sub: 'Cargo e Sênioridade', color: 'bg-blue-500' },
                                    { step: 3, icon: 'psychology', label: 'Conhecimento & Mel', sub: 'Habilidades Técnicas', color: 'bg-orange-500' },
                                    { step: 4, icon: 'distance', label: 'Radar & Contato', sub: 'Localização e WhatsApp', color: 'bg-pink-500' },
                                ]).map((item) => (
                                    <button
                                        key={item.step}
                                        onClick={() => {
                                            setShowEditMenu(false);
                                            localStorage.setItem('onboarding_start_step', item.step.toString());
                                            localStorage.setItem('onboarding_start_step_active', 'true');
                                            localStorage.setItem('jobee_cache_onboarding', JSON.stringify(user));
                                            onNavigate?.('onboarding');
                                        }}
                                        className="flex items-center p-5 bg-white/[0.03] border border-white/5 rounded-[2rem] gap-5 active:scale-95 transition-all hover:bg-white/5"
                                    >
                                        <div className={`w-14 h-14 rounded-2xl ${item.color} flex items-center justify-center shadow-lg`}>
                                            <span className="material-symbols-outlined text-black font-black">{item.icon}</span>
                                        </div>
                                        <div className="text-left">
                                            <h4 className="text-sm font-black uppercase text-white tracking-widest">{item.label}</h4>
                                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mt-0.5">{item.sub}</p>
                                        </div>
                                        <span className="material-symbols-outlined ml-auto text-white/10">chevron_right</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }


            {/* MODALS */}
            {
                selectedPlan && createPortal(
                    <div className="fixed inset-0 z-[600] flex items-end justify-center">
                        <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => setSelectedPlan(null)} />
                        <div
                            className={`relative w-full bg-[#0F172A] border-t border-white/10 rounded-t-[3.5rem] p-8 animate-in slide-in-from-bottom duration-500 flex flex-col max-h-[92vh] shadow-2xl overflow-hidden ${!isDragging ? 'transition-transform duration-300' : ''}`}
                            style={{ transform: `translateY(${dragOffset}px)` }}
                            onTouchStart={(e) => handleStart(e.touches[0].clientY)}
                            onTouchMove={(e) => handleMove(e.touches[0].clientY)}
                            onTouchEnd={handleEnd}
                            onMouseDown={(e) => handleStart(e.clientY)}
                            onMouseMove={(e) => handleMove(e.clientY)}
                            onMouseUp={handleEnd}
                            onMouseLeave={handleEnd}
                        >
                            {/* DRAG HANDLE FOR DISMISSAL */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full z-30 pointer-events-none" />

                            <header className="text-center mb-8 shrink-0 flex flex-col items-center relative mt-4">
                                <button
                                    onClick={() => setSelectedPlan(null)}
                                    className="absolute -top-2 right-0 w-12 h-12 rounded-full bg-white/5 flex items-center justify-center active:scale-95 transition-all z-20 group hover:bg-white/10"
                                >
                                    <span className="material-symbols-outlined text-xl text-white/40 group-hover:text-white transition-colors">close</span>
                                </button>

                                <h2 className="text-6xl font-black uppercase tracking-tighter text-white mb-2 leading-none italic drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">{selectedPlan.name}</h2>
                                <p className="text-xs font-black text-white/30 uppercase tracking-[0.4em]">Benefícios Ativos</p>
                            </header>

                            <div className="flex-1 overflow-y-auto scrollbar-hide space-y-8 px-2 pb-6">
                                <div className="p-8 rounded-[2.5rem] bg-white/5 border border-white/10 flex flex-col items-center gap-2 relative overflow-hidden group">
                                    <div className={`absolute inset-0 bg-gradient-to-br ${selectedPlan.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
                                    <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] relative z-10">Plano Anual</span>
                                    <div className="flex items-baseline gap-2 relative z-10">
                                        <span className="text-5xl font-black text-white tracking-tighter">{selectedPlan.price}</span>
                                        <span className="text-sm font-bold text-white/40 uppercase tracking-widest">/mês</span>
                                    </div>
                                    <div className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20 mt-2 relative z-10">
                                        PROMOÇÃO DE LANÇAMENTO
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-4">Benefícios Exclusivos</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        {(selectedPlan.features).map((feature: string, idx: number) => (
                                            <div key={idx} className="flex items-center gap-4 bg-[#0F172A] border border-white/5 p-5 rounded-3xl transition-all hover:border-white/20 hover:bg-white/[0.03] group">
                                                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${selectedPlan.color} flex items-center justify-center text-secondary shadow-lg transition-transform group-hover:scale-110`}>
                                                    <span className="material-symbols-outlined text-xl">check</span>
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-xs font-black text-white uppercase tracking-wider">{feature}</p>
                                                    <p className="text-[9px] font-medium text-white/40 mt-0.5 uppercase">Vitalício enquanto assinar</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <footer className="pt-6 border-t border-white/10 shrink-0">
                                <button
                                    onClick={() => handleSubscribe(selectedPlan.url)}
                                    className={`w-full h-16 bg-gradient-to-r ${selectedPlan.color} text-white rounded-[2rem] text-sm font-black uppercase tracking-[0.3em] shadow-2xl transition-all active:scale-95 flex items-center justify-center gap-3 relative overflow-hidden group`}
                                >
                                    <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
                                    <span>Assinar Agora</span>
                                    <span className="material-symbols-outlined">arrow_forward</span>
                                </button>
                                <p className="text-center text-[9px] font-bold text-white/20 mt-4 uppercase tracking-widest">Cancele a qualquer momento • Pagamento Seguro</p>
                            </footer>
                        </div>
                    </div>,
                    document.body
                )
            }

            {
                showNotifications && createPortal(
                    <div className="fixed inset-0 z-[400] flex items-end justify-center">
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowNotifications(false)} />
                        <div
                            className={`relative w-full bg-[#0B0F1A] border-t border-white/10 rounded-t-[3.5rem] p-10 animate-in slide-in-from-bottom duration-500 ${!isDragging ? 'transition-transform duration-300' : ''}`}
                            style={{ transform: `translateY(${dragOffset}px)` }}
                            onTouchStart={(e) => handleStart(e.touches[0].clientY)}
                            onTouchMove={(e) => handleMove(e.touches[0].clientY)}
                            onTouchEnd={handleEnd}
                            onMouseDown={(e) => handleStart(e.clientY)}
                            onMouseMove={(e) => handleMove(e.clientY)}
                            onMouseUp={handleEnd}
                            onMouseLeave={handleEnd}
                        >
                            {/* DRAG HANDLE FOR DISMISSAL */}
                            <div className="absolute top-4 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-white/10 rounded-full z-30 pointer-events-none" />
                            <h2 className="text-4xl font-black uppercase tracking-tighter text-primary mb-8 text-center mt-2">Alertas</h2>
                            <div className="space-y-4 mb-10">
                                {Object.entries(notifConfig).map(([key, val]: any) => (
                                    <div key={key} className="flex items-center justify-between p-6 bg-white/5 border border-white/5 rounded-3xl">
                                        <span className="text-[10px] font-black uppercase text-white/70 tracking-widest">{key.replace(/([A-Z])/g, ' $1')}</span>
                                        <button onClick={() => setNotifConfig(prev => ({ ...prev, [key]: !val }))} className={`w-14 h-7 rounded-full ${val ? 'bg-primary' : 'bg-white/10'} p-1 transition-colors relative`}><div className={`w-5 h-5 rounded-full bg-white transition-transform ${val ? 'translate-x-7' : 'translate-x-0'}`} /></button>
                                    </div>
                                ))}
                            </div>
                            <button onClick={() => setShowNotifications(false)} className="w-full h-18 bg-primary text-secondary font-black rounded-[2rem] uppercase">Confirmar</button>
                        </div>
                    </div>,
                    document.body
                )
            }

            {
                showPreferences && createPortal(
                    <div className="fixed inset-0 z-[500] flex items-end justify-center">
                        <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setShowPreferences(false)} />
                        <div
                            className={`relative w-full bg-[#0B0F1A] border-t border-white/10 rounded-t-[3.5rem] animate-in slide-in-from-bottom duration-500 max-h-[90vh] flex flex-col shadow-2xl ${!isDragging ? 'transition-transform duration-300' : ''}`}
                            style={{ transform: `translateY(${dragOffset}px)` }}
                            onTouchStart={(e) => handleStart(e.touches[0].clientY)}
                            onTouchMove={(e) => handleMove(e.touches[0].clientY)}
                            onTouchEnd={handleEnd}
                            onMouseDown={(e) => handleStart(e.clientY)}
                            onMouseMove={(e) => handleMove(e.clientY)}
                            onMouseUp={handleEnd}
                            onMouseLeave={handleEnd}
                        >
                            <div className="w-full flex justify-center pt-4 pb-2 shrink-0 relative pointer-events-none">
                                <div className="w-12 h-1.5 bg-white/20 rounded-full" />
                            </div>
                            <div className="p-8 pt-2 overflow-y-auto scrollbar-hide flex-1">
                                <h2 className="text-3xl font-black uppercase tracking-tighter text-primary mb-6 text-center">Radar</h2>
                                <div className="px-1 mb-6">
                                    <RadarMap lat={radarLat} lng={radarLng} radiusKm={searchRadius} onCenterChange={(lat, lng) => { setRadarLat(lat); setRadarLng(lng); }} />
                                </div>
                                <div className="mb-8 px-2">
                                    <input type="range" min="1" max="200" value={searchRadius} onChange={(e) => setSearchRadius(parseInt(e.target.value))} className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary" />
                                    <p className="text-center mt-2 text-white/50 text-xs font-bold">{searchRadius} km</p>
                                </div>
                                <button onClick={() => setShowPreferences(false)} className="w-full h-18 bg-primary text-secondary font-black rounded-[2rem] uppercase shadow-xl mb-4">Salvar Raio</button>
                            </div>
                        </div>
                    </div>,
                    document.body
                )
            }

            {createPortal(<BeeaChat isOpen={showBeea} onClose={() => setShowBeea(false)} userId={user?.id} />, document.body)}
        </div >
    );
};

export default ProfilePage;
