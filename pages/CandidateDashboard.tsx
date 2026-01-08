import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import BeeLogo from '../components/BeeLogo';

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
        <div className="flex flex-col h-full bg-secondary text-white relative overflow-hidden font-sans p-6 pt-10">
            <header className="flex justify-between items-center mb-6 shrink-0 h-14">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Sua Colmeia</span>
                    <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">
                        Voe, <span className="text-primary italic">{profile?.full_name?.split(' ')[0] || 'Bee'}</span>
                    </h1>
                </div>
                <div className="flex items-center gap-3">
                    {/* Notification Bell */}
                    <button
                        onClick={() => onNavigate('profile')}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-white/50 text-xl">notifications</span>
                        {stats.pendingLikes > 0 && (
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-primary rounded-full border-2 border-secondary animate-pulse"></span>
                        )}
                    </button>

                    {/* Profile Avatar */}
                    <button
                        onClick={() => onNavigate('profile')}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 overflow-hidden active:scale-95 transition-all p-0.5"
                    >
                        <img
                            src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id}`}
                            className="w-full h-full rounded-[10px] object-cover"
                            alt="Profile"
                        />
                    </button>
                </div>
            </header>

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide space-y-8 pb-10">
                {/* Stats Carousel */}
                <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-2">
                    {[
                        { label: 'Matches', value: stats.totalMatches, icon: 'bolt', color: 'text-primary' },
                        { label: 'Agenda', value: stats.scheduledInterviews, icon: 'calendar_today', color: 'text-green-400' },
                        { label: 'Vistos', value: stats.profileViews, icon: 'visibility', color: 'text-blue-400' },
                        { label: 'Nível', value: '12', icon: 'military_tech', color: 'text-orange-400' }
                    ].map((stat, idx) => (
                        <div key={idx} className="bg-white/5 border border-white/10 rounded-3xl p-4 flex-shrink-0 w-32 backdrop-blur-md">
                            <span className={`material-symbols-outlined ${stat.color} mb-2 block text-xl`}>{stat.icon}</span>
                            <div className="text-xl font-black text-white">{stat.value}</div>
                            <div className="text-[8px] font-black text-white/30 uppercase mt-1">{stat.label}</div>
                        </div>
                    ))}
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
                                        <div className="w-14 h-14 rounded-2xl bg-white/5 overflow-hidden border border-white/5">
                                            <img src={(interview.jobs as any)?.company_logo_url} className="w-full h-full object-cover" alt="" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xs font-black uppercase text-white truncate w-40">{(interview.jobs as any)?.title}</h3>
                                            <p className="text-[9px] font-bold text-white/30 uppercase truncate w-40">{(interview.jobs as any)?.company_name}</p>
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
                        <div className="bg-white/5 border border-dashed border-white/10 rounded-[2.5rem] p-10 text-center opacity-50">
                            <span className="material-symbols-outlined text-3xl mb-2">hive</span>
                            <p className="text-[8px] font-black uppercase tracking-widest">Nenhuma entrevista agendada</p>
                        </div>
                    )}
                </section>

                {/* Categorical Shortcuts */}
                <section>
                    <h2 className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-4 ml-1">Radar de Oportunidades</h2>
                    <div className="grid grid-cols-2 gap-3 pb-6">
                        <button onClick={() => onNavigate('swipe')} className="h-28 bg-primary text-secondary rounded-[2rem] flex flex-col items-center justify-center gap-2 shadow-lg shadow-primary/20 active:scale-95 transition-all">
                            <span className="material-symbols-outlined text-3xl font-black">bolt</span>
                            <span className="text-[10px] font-black uppercase">Quick Swipe</span>
                        </button>
                        <div className="grid grid-rows-2 gap-3">
                            <button onClick={() => onNavigate('jobs')} className="bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all text-white/40 uppercase text-[9px] font-black">
                                <span className="material-symbols-outlined text-sm">segment</span>
                                Feed
                            </button>
                            <button onClick={() => onNavigate('profile')} className="bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all text-white/40 uppercase text-[9px] font-black">
                                <span className="material-symbols-outlined text-sm">person</span>
                                Perfil
                            </button>
                        </div>
                    </div>
                </section>
            </div>
        </div>
    );
};

export default CandidateDashboard;
