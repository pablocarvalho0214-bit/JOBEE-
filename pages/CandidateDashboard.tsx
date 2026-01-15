import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { JobeeSymbol } from '../components/JobeeIdentity';

interface CandidateDashboardProps {
    onNavigate: (page: any) => void;
    onOpenChat: (match: any) => void;
}

const CandidateDashboard: React.FC<CandidateDashboardProps> = ({ onNavigate, onOpenChat }) => {
    const [profile, setProfile] = useState<any>(null);
    const [stats, setStats] = useState({
        totalMatches: 0,
        scheduledInterviews: 0,
        pendingLikes: 0,
        profileViews: 124
    });
    const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(profileData);

            const { data: matches } = await supabase.from('matches').select('*').eq('candidate_id', user.id);
            const scheduledCount = matches?.filter(m => m.scheduled_at).length || 0;

            setStats({
                totalMatches: matches?.length || 0,
                scheduledInterviews: scheduledCount,
                pendingLikes: matches?.filter(m => m.status === 'pending').length || 0,
                profileViews: Math.floor(Math.random() * 200) + 50
            });

            const { data: interviewData } = await supabase
                .from('matches')
                .select(`id, scheduled_at, interview_model, interview_detail, jobs (title, company_name, company_logo_url)`)
                .eq('candidate_id', user.id)
                .not('scheduled_at', 'is', null)
                .order('scheduled_at', { ascending: true });

            setUpcomingInterviews(interviewData || []);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-secondary">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#0B0F1A] text-white relative overflow-hidden font-sans p-6" style={{ paddingTop: 'calc(2.5rem + env(safe-area-inset-top))' }}>

            {/* AMBIENT BACKGROUND */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[10%] right-[-10%] w-[60%] h-[40%] bg-primary/10 blur-[120px] rounded-full rotate-45" />
                <div className="absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full" />
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='%23ffffff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
                    backgroundSize: '30px 52px'
                }} />
            </div>
            <header className="flex justify-between items-center mb-10 shrink-0 h-14 relative z-10">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Sua Colmeia</span>
                    <h1 className="text-3xl font-black uppercase tracking-tighter leading-none mt-1">
                        Voe, <span className="text-primary italic">{profile?.full_name?.split(' ')[0] || 'Bee'}</span>
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    {/* Notification Bell */}
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`w-12 h-14 relative flex items-center justify-center active:scale-95 transition-all group`}
                        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                    >
                        <div className={`absolute inset-0 bg-white/5 border border-white/10 group-hover:bg-white/10 ${showNotifications ? 'bg-primary/20 border-primary/30' : ''}`} />
                        <span className={`material-symbols-outlined ${showNotifications ? 'text-primary' : 'text-white/50'} text-2xl relative z-10`}>notifications</span>
                        {stats.pendingLikes > 0 && (
                            <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-primary rounded-full border-2 border-[#0B0F1A] animate-pulse z-20"></span>
                        )}
                    </button>

                    {/* Profile Avatar Hex */}
                    <button
                        onClick={() => onNavigate('profile')}
                        className="w-12 h-14 relative p-0.5 active:scale-95 transition-all group"
                        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                    >
                        <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/40 transition-colors" />
                        <div className="absolute inset-[1px] bg-[#0B0F1A]" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                        <img
                            src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id}`}
                            className="w-full h-full object-cover relative z-10"
                            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                            alt="Profile"
                        />
                    </button>
                </div>
            </header>

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-8 pb-10">
                {/* Stats Carousel - HEXAGONAL THEME */}
                <div className="relative z-10">
                    <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-6 pt-2">
                        {[
                            { label: 'Matches', value: stats.totalMatches, icon: 'bolt', color: 'text-primary' },
                            { label: 'Agenda', value: stats.scheduledInterviews, icon: 'calendar_today', color: 'text-green-400' },
                            { label: 'Vistos', value: stats.profileViews, icon: 'visibility', color: 'text-blue-400' },
                            { label: 'Nível', value: '12', icon: 'military_tech', color: 'text-orange-400' }
                        ].map((stat, idx) => (
                            <div key={idx} className="flex-shrink-0 flex flex-col items-center">
                                <div
                                    className="w-24 h-28 relative flex flex-col items-center justify-center p-4 transition-transform hover:scale-105"
                                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                                >
                                    <div className="absolute inset-0 bg-white/5 border border-white/10 backdrop-blur-md" />
                                    <div className="relative z-10 flex flex-col items-center">
                                        <span className={`material-symbols-outlined ${stat.color} mb-1 text-xl`}>{stat.icon}</span>
                                        <div className="text-xl font-black text-white leading-none">{stat.value}</div>
                                        <div className="text-[7px] font-black text-white/30 uppercase mt-1 tracking-widest">{stat.label}</div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Interviews Slider */}
                <section>
                    <div className="flex justify-between items-end mb-4 px-1">
                        <h2 className="text-[10px] font-black text-white/50 uppercase tracking-widest">Sua Próxima Parada</h2>
                        <button onClick={() => onNavigate('matches')} className="text-[8px] font-black text-primary uppercase underline underline-offset-4 decoration-2">Ver Agenda</button>
                    </div>

                    {upcomingInterviews.length > 0 ? (
                        <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-4">
                            {upcomingInterviews.map((interview) => (
                                <div key={interview.id} className="flex-shrink-0 w-72 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-[2.5rem] p-6 backdrop-blur-md relative overflow-hidden active:scale-95 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-16 h-18 relative p-0.5 bg-white/10 shrink-0"
                                            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                                        >
                                            <div className="absolute inset-0 bg-[#0B0F1A]" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                                            <img
                                                src={(interview.jobs as any)?.company_logo_url}
                                                className="w-full h-full object-cover relative z-10"
                                                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                                                alt=""
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-[11px] font-black uppercase text-white truncate w-40 tracking-tight">{(interview.jobs as any)?.title}</h3>
                                            <p className="text-[9px] font-bold text-primary uppercase tracking-widest truncate w-40">{(interview.jobs as any)?.company_name}</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 mt-4">
                                        <div className="flex-1 h-10 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center gap-1.5">
                                            <span className="material-symbols-outlined text-[14px] text-primary">schedule</span>
                                            <span className="text-[9px] font-black text-primary uppercase">{interview.scheduled_at}</span>
                                        </div>
                                        <button
                                            onClick={() => onOpenChat({ ...interview, companyName: (interview.jobs as any)?.company_name })}
                                            className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-white/40"
                                        >
                                            <span className="material-symbols-outlined text-sm">chat_bubble</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] p-10 text-center opacity-30 flex flex-col items-center">
                            <JobeeSymbol size={32} mode="dark" />
                            <p className="text-[8px] font-black uppercase tracking-widest mt-3">Nenhuma entrevista agendada</p>
                        </div>
                    )}
                </section>

                {/* Radar Segment */}
                <section className="space-y-6">
                    <h2 className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1">Radar de Oportunidades</h2>
                    <div className="flex items-center justify-center gap-4 relative z-10 h-72">
                        {/* Quick Swipe - Yellow Hex */}
                        <button
                            onClick={() => onNavigate('swipe')}
                            className="w-44 h-52 relative group transition-all duration-500 active:scale-90"
                            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                        >
                            <div className="absolute inset-0 bg-primary group-hover:scale-110 transition-transform duration-500" />
                            <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center">
                                <span className="material-symbols-outlined text-secondary text-4xl mb-4 font-black group-hover:scale-125 transition-transform duration-500">bolt</span>
                                <span className="text-sm font-black text-secondary uppercase tracking-tighter leading-tight">QUICK<br />SWIPE</span>
                            </div>
                        </button>

                        {/* Feed - Dark Hex */}
                        <button
                            onClick={() => onNavigate('jobs')}
                            className="w-40 h-44 relative group transition-all duration-500 active:scale-90"
                            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                        >
                            <div className="absolute inset-0 bg-white/5 border border-white/10 backdrop-blur-md group-hover:bg-white/10 transition-colors" />
                            <div className="relative z-10 flex flex-col items-center justify-center h-full p-4 text-center">
                                <span className="material-symbols-outlined text-white/30 text-3xl mb-3 font-black group-hover:scale-110 transition-transform">segment</span>
                                <span className="text-[10px] font-black text-white/50 uppercase tracking-widest">VAGAS</span>
                            </div>
                        </button>
                    </div>
                </section>
            </div>

            {showNotifications && (
                <>
                    <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowNotifications(false)}></div>
                    <div className="fixed top-24 right-6 w-80 max-h-[70vh] bg-[#121827] border border-white/10 rounded-[2rem] shadow-2xl z-[120] overflow-hidden flex flex-col animate-in slide-in-from-top-4 duration-300">
                        <header className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Notificações</h3>
                            <button onClick={() => setShowNotifications(false)} className="material-symbols-outlined text-white/20 text-lg hover:text-white transition-colors">close</button>
                        </header>
                        <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
                            {upcomingInterviews.length > 0 ? (
                                <div className="px-2 space-y-2">
                                    <div
                                        onClick={() => { onNavigate('matches'); setShowNotifications(false); }}
                                        className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3 cursor-pointer hover:bg-primary/10 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-primary">event</span>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-white uppercase leading-tight">Entrevista Próxima</p>
                                            <p className="text-[9px] font-bold text-white/40 mt-1 uppercase">Você tem {upcomingInterviews.length} entrevista(s) agendada(s). Não se atrase!</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-10 text-center opacity-30 flex flex-col items-center">
                                    <span className="material-symbols-outlined text-4xl mb-3">notifications_off</span>
                                    <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">Sua colmeia está<br />tranquila por enquanto.</p>
                                </div>
                            )}

                            <div className="px-2 mt-2 pt-2 border-t border-white/5 space-y-2 opacity-60">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-white/30">auto_awesome</span>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-white/50 uppercase leading-tight">Dica de Perfil</p>
                                        <p className="text-[9px] font-bold text-white/20 mt-1 uppercase">Perfis com foto completa e bio detalhada ganham 3x mais matches.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <footer className="p-4 bg-white/[0.02] border-t border-white/5">
                            <button className="w-full py-2 text-[8px] font-black uppercase tracking-widest text-white/20 hover:text-primary transition-colors">Limpar Tudo</button>
                        </footer>
                    </div>
                </>
            )}
        </div>
    );
};

export default CandidateDashboard;
