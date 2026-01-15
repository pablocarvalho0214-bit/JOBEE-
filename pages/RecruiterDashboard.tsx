import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { JobeeSymbol } from '../components/JobeeIdentity';
import { RadiusMap } from '../components/RadiusMap';

const RecruiterDashboard: React.FC<{
    onNavigate?: (page: any) => void;
    initialView?: 'overview' | 'jobs_list';
}> = ({ onNavigate, initialView = 'overview' }) => {
    // Initial State from Cache (if available)
    const [stats, setStats] = useState(() => {
        const saved = localStorage.getItem('jobee_recruiter_stats_cache');
        return saved ? JSON.parse(saved) : {
            totalJobs: 0,
            totalApplicants: 0,
            recruiterMatches: 0,
            pendingMatches: 0,
            profileViews: 157
        };
    });
    const [myJobs, setMyJobs] = useState<any[]>(() => {
        const saved = localStorage.getItem('jobee_recruiter_jobs_cache');
        return saved ? JSON.parse(saved) : [];
    });
    const [loading, setLoading] = useState(myJobs.length === 0);
    const [view, setView] = useState<'overview' | 'jobs_list'>(initialView);
    const [profile, setProfile] = useState<any>(null);
    const [upcomingInterviews, setUpcomingInterviews] = useState<any[]>([]);
    const [showNotifications, setShowNotifications] = useState(false);
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'closed'>('active');

    const handleUpdateJobStatus = async (jobId: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from('jobs')
                .update({ status: newStatus })
                .eq('id', jobId);

            if (error) throw error;

            // Update local state
            setMyJobs(prev => prev.map(j => j.id === jobId ? { ...j, status: newStatus } : j));
            if (selectedJob?.id === jobId) {
                setSelectedJob({ ...selectedJob, status: newStatus });
            }
        } catch (err) {
            console.error('Error updating job status:', err);
            alert('Erro ao atualizar status da vaga');
        }
    };

    // Sync view if prop changes
    useEffect(() => {
        if (initialView) setView(initialView);
    }, [initialView]);

    useEffect(() => {
        fetchData(false); // Silent fetch if we have cache
        const subscription = supabase
            .channel('dashboard-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => fetchData(false))
            .subscribe();
        return () => { supabase.removeChannel(subscription); };
    }, []);

    const fetchData = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Fetch Profile
            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(profileData);

            // 2. Fetch Jobs and Stats in Parallel
            const [jobsRes, matchesRes] = await Promise.all([
                supabase.from('jobs').select('*').eq('recruiter_id', user.id).order('created_at', { ascending: false }),
                supabase.from('matches').select('id, status, job_id, scheduled_at, candidate_id, candidate_liked, recruiter_liked, recruiter_rejected, profiles!candidate_id (*), jobs!job_id (*)').eq('recruiter_id', user.id)
            ]);

            const allJobs = jobsRes.data || [];
            const allMatches = matchesRes.data || [];

            // 3. Process Per-Job Stats
            const jobsWithStats = allJobs.map(job => {
                const jobMatches = allMatches.filter(m => m.job_id === job.id);
                return {
                    ...job,
                    stats: {
                        analyzed: jobMatches.filter(m => m.recruiter_liked || m.recruiter_rejected).length,
                        matches: jobMatches.filter(m => m.status === 'accepted').length,
                        pending: jobMatches.filter(m => m.candidate_liked && !m.recruiter_liked && !m.recruiter_rejected).length
                    }
                };
            });

            setMyJobs(jobsWithStats);

            const pending = allMatches.filter(m => m.candidate_liked && !m.recruiter_liked && !m.recruiter_rejected);
            const accepted = allMatches.filter(m => m.status === 'accepted');

            setStats({
                totalJobs: allJobs.length,
                totalApplicants: allMatches.filter(m => m.candidate_liked).length,
                recruiterMatches: accepted.length,
                pendingMatches: pending.length,
                profileViews: Math.floor(Math.random() * 50) + 120
            });

            // 4. Filter Upcoming Interviews
            const scheduled = allMatches
                .filter(m => m.scheduled_at)
                .map(m => ({
                    ...m,
                    candidate: m.profiles,
                    job: m.jobs
                }))
                .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime());

            setUpcomingInterviews(scheduled);

            // SAVE TO CACHE
            localStorage.setItem('jobee_recruiter_stats_cache', JSON.stringify({
                totalJobs: allJobs.length,
                totalApplicants: allMatches.filter(m => m.candidate_liked).length,
                recruiterMatches: accepted.length,
                pendingMatches: pending.length,
                profileViews: stats.profileViews
            }));
            localStorage.setItem('jobee_recruiter_jobs_cache', JSON.stringify(jobsWithStats));

        } catch (err) {
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading && view === 'overview') {
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
                <div className="absolute top-[10%] right-[-10%] w-[60%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full rotate-45" />
                <div className="absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='%23ffffff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
                    backgroundSize: '30px 52px'
                }} />
            </div>

            <header className="flex justify-between items-center mb-10 shrink-0 h-14 relative z-10">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.4em]">Sua Colmeia</span>
                    <h1 className="text-3xl font-black uppercase tracking-tighter leading-none mt-1">
                        {view === 'overview' ? (
                            <>Voe, <span className="text-primary italic">{profile?.full_name?.split(' ')[0] || profile?.company_name?.split(' ')[0] || 'Bee'}</span></>
                        ) : (
                            <>Minhas <span className="text-primary italic">Vagas</span></>
                        )}
                    </h1>
                </div>
                <div className="flex items-center gap-4">
                    {view === 'jobs_list' ? (
                        <button
                            onClick={() => setView('overview')}
                            className="w-12 h-14 relative flex items-center justify-center active:scale-95 transition-all group"
                            style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                        >
                            <div className="absolute inset-0 bg-white/5 border border-white/10 group-hover:bg-white/10" />
                            <span className="material-symbols-outlined text-white/50 text-2xl relative z-10">home</span>
                        </button>
                    ) : (
                        <>
                            <button
                                onClick={() => setShowNotifications(!showNotifications)}
                                className={`w-12 h-14 relative flex items-center justify-center active:scale-95 transition-all group`}
                                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                            >
                                <div className={`absolute inset-0 bg-white/5 border border-white/10 group-hover:bg-white/10 ${showNotifications ? 'bg-primary/20 border-primary/30' : ''}`} />
                                <span className={`material-symbols-outlined ${showNotifications ? 'text-primary' : 'text-white/50'} text-2xl relative z-10`}>notifications</span>
                                {stats.pendingMatches > 0 && (
                                    <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-primary rounded-full border-2 border-[#0B0F1A] animate-pulse z-20"></span>
                                )}
                            </button>

                            <button
                                onClick={() => onNavigate?.('profile')}
                                className="w-12 h-14 relative p-0.5 active:scale-95 transition-all group"
                                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                            >
                                <div className="absolute inset-0 bg-primary/20 group-hover:bg-primary/40 transition-colors" />
                                <div className="absolute inset-[1px] bg-[#0B0F1A]" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                                <img
                                    src={profile?.avatar_url || profile?.company_logo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.id}`}
                                    className="w-full h-full object-cover relative z-10"
                                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                                    alt="Profile"
                                />
                            </button>
                        </>
                    )}
                </div>
            </header>

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                {view === 'overview' ? (
                    <div className="space-y-10 pb-10 animate-in fade-in duration-500">
                        {/* Stats Carousel */}
                        <div className="relative z-10 text-center">
                            <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-2 pt-2">
                                {[
                                    { label: 'Matches', value: stats.recruiterMatches, icon: 'bolt', color: 'text-primary' },
                                    { label: 'Agenda', value: upcomingInterviews.length, icon: 'calendar_today', color: 'text-green-400' },
                                    { label: 'Vistos', value: stats.profileViews, icon: 'visibility', color: 'text-blue-400' },
                                    { label: 'Vagas', value: stats.totalJobs, icon: 'domain', color: 'text-orange-400' }
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

                        {/* Recent Activity / Next Stop */}
                        <section>
                            <div className="flex justify-between items-end mb-4 px-1">
                                <h2 className="text-[10px] font-black text-white/50 uppercase tracking-widest leading-none">Sua Próxima Parada</h2>
                                <button onClick={() => onNavigate?.('matches')} className="text-[8px] font-black text-primary uppercase underline underline-offset-4 decoration-2 tracking-tighter decoration-primary">Ver Agenda</button>
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
                                                        src={interview.candidate?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${interview.candidate?.id}`}
                                                        className="w-full h-full object-cover relative z-10"
                                                        style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                                                        alt=""
                                                    />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="text-sm font-black text-white uppercase truncate">{interview.candidate?.full_name}</h4>
                                                    <p className="text-[10px] font-bold text-white/40 uppercase truncate">{interview.job?.title}</p>
                                                </div>
                                            </div>
                                            <div className="mt-4 flex items-center justify-between border-t border-white/5 pt-4">
                                                <div className="flex items-center gap-2">
                                                    <span className="material-symbols-outlined text-primary text-xs">calendar_today</span>
                                                    <span className="text-[10px] font-black uppercase text-white/60 tracking-tighter">{interview.scheduled_at}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="w-full h-44 bg-white/[0.03] border border-white/5 rounded-[2.5rem] flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
                                    <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-4 border border-white/5">
                                        <JobeeSymbol size={28} mode="dark" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase text-white/20 tracking-widest leading-relaxed px-4">Nenhuma entrevista agendada</p>
                                </div>
                            )}
                        </section>

                        {/* Radar Segment */}
                        <section className="space-y-6">
                            <h2 className="text-[10px] font-black text-white/30 uppercase tracking-widest px-1">Radar de Oportunidades</h2>
                            <div className="flex items-center justify-center gap-4 relative z-10 h-72">
                                {/* Quick Review (Match Page) */}
                                <button
                                    onClick={() => onNavigate?.('candidates')}
                                    className="w-44 h-52 relative group transition-all duration-500 active:scale-90"
                                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                                >
                                    <div className="absolute inset-0 bg-primary group-hover:scale-110 transition-transform duration-500" />
                                    <div className="relative z-10 flex flex-col items-center justify-center h-full p-6 text-center">
                                        <span className="material-symbols-outlined text-secondary text-4xl mb-4 font-black group-hover:scale-125 transition-transform duration-500">bolt</span>
                                        <span className="text-sm font-black text-secondary uppercase tracking-tighter leading-tight">QUICK<br />SWIPE</span>
                                    </div>
                                </button>

                                {/* Feed (Jobs List) */}
                                <button
                                    onClick={() => setView('jobs_list')}
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
                ) : (
                    <div className="space-y-4 pb-20 animate-in slide-in-from-right-8 duration-500">
                        {/* Filter Bar */}
                        <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-6 px-6 mb-4">
                            {[
                                { id: 'active', label: 'Ativas', icon: 'check_circle' },
                                { id: 'inactive', label: 'Inativas', icon: 'pause_circle' },
                                { id: 'closed', label: 'Fechadas', icon: 'cancel' },
                                { id: 'all', label: 'Todas', icon: 'apps' }
                            ].map(filter => (
                                <button
                                    key={filter.id}
                                    onClick={() => setStatusFilter(filter.id as any)}
                                    className={`px-4 h-10 rounded-2xl flex items-center gap-2 border transition-all whitespace-nowrap active:scale-95 ${statusFilter === filter.id
                                        ? 'bg-primary border-primary text-secondary'
                                        : 'bg-white/5 border-white/10 text-white/50'
                                        }`}
                                >
                                    <span className="material-symbols-outlined text-sm">{filter.icon}</span>
                                    <span className="text-[10px] font-black uppercase tracking-widest">{filter.label}</span>
                                </button>
                            ))}
                        </div>

                        {myJobs.filter(j => statusFilter === 'all' || j.status === statusFilter).length === 0 ? (
                            <div className="py-20 text-center opacity-20 flex flex-col items-center">
                                <JobeeSymbol size={64} mode="dark" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-6">Nenhuma vaga nesta categoria</p>
                                {statusFilter === 'active' && (
                                    <button onClick={() => onNavigate?.('swipe')} className="mt-8 px-6 py-3 bg-primary text-secondary rounded-xl font-black text-[10px] uppercase">Adicionar Vaga</button>
                                )}
                            </div>
                        ) : (
                            myJobs
                                .filter(j => statusFilter === 'all' || j.status === statusFilter)
                                .map(job => (
                                    <div
                                        key={job.id}
                                        onClick={() => setSelectedJob(job)}
                                        className={`p-6 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-between active:scale-95 transition-all group`}
                                    >
                                        <div className="flex-1 min-w-0 pr-4">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="text-base font-black uppercase text-white truncate group-hover:text-primary transition-colors">{job.title}</h4>
                                                <span className={`w-2 h-2 rounded-full ${job.status === 'closed' ? 'bg-red-400' :
                                                        job.status === 'inactive' ? 'bg-orange-400' :
                                                            'bg-green-400'
                                                    } animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.3)]`} />
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <p className="text-[9px] font-bold text-white/30 uppercase truncate">{job.location}</p>
                                                <span className="w-1 h-1 bg-white/10 rounded-full" />
                                                <div className="flex items-center gap-3">
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[8px] font-black text-primary uppercase">Matches</span>
                                                        <span className="text-[10px] font-black text-white">{job.stats?.matches || 0}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1">
                                                        <span className="text-[8px] font-black text-white/40 uppercase">Vistos</span>
                                                        <span className="text-[10px] font-black text-white/60">{job.stats?.analyzed || 0}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                                            <span className="material-symbols-outlined text-white/20 group-hover:text-primary text-xl">chevron_right</span>
                                        </div>
                                    </div>
                                ))
                        )}
                    </div>
                )}
            </div>

            {/* Job Details Modal - Refined */}
            {selectedJob && (
                <div className="fixed inset-0 z-[100] bg-[#0B0F1A]/95 backdrop-blur-xl flex flex-col animate-in fade-in duration-300">
                    <header className="p-6 flex justify-between items-center bg-white/5 border-b border-white/10 pt-10">
                        <div>
                            <span className="text-[8px] font-black text-primary uppercase tracking-[0.4em]">Detalhes da Vaga</span>
                            <h3 className="text-xl font-black uppercase text-white leading-tight truncate w-64">{selectedJob.title}</h3>
                        </div>
                        <button onClick={() => setSelectedJob(null)} className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-white/40">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </header>
                    <div className="flex-1 overflow-y-auto p-6 space-y-8 scrollbar-hide pb-24">
                        {/* Status Tags and Controls */}
                        <div className="flex flex-wrap items-center justify-between gap-4 bg-white/5 p-4 rounded-3xl border border-white/10">
                            <div className="flex flex-wrap gap-2">
                                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase ${selectedJob.status === 'closed' ? 'bg-red-400/10 border-red-400/20 text-red-400' :
                                    selectedJob.status === 'inactive' ? 'bg-orange-400/10 border-orange-400/20 text-orange-400' :
                                        'bg-green-400/10 border-green-400/20 text-green-400'
                                    } border`}>
                                    {selectedJob.status === 'closed' ? 'Fechada' : selectedJob.status === 'inactive' ? 'Inativa' : 'Ativa'}
                                </span>
                                <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[9px] font-black uppercase text-primary">{selectedJob.type}</span>
                                {selectedJob.is_confidential && <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[9px] font-black uppercase text-white/40">Confidencial</span>}
                            </div>

                            <div className="flex gap-2">
                                {selectedJob.status !== 'active' && (
                                    <button
                                        onClick={() => handleUpdateJobStatus(selectedJob.id, 'active')}
                                        className="w-10 h-10 rounded-xl bg-green-400/20 border border-green-400/30 flex items-center justify-center text-green-400 hover:bg-green-400 hover:text-secondary transition-all"
                                        title="Ativar Vaga"
                                    >
                                        <span className="material-symbols-outlined text-sm font-black">play_arrow</span>
                                    </button>
                                )}
                                {selectedJob.status === 'active' && (
                                    <button
                                        onClick={() => handleUpdateJobStatus(selectedJob.id, 'inactive')}
                                        className="w-10 h-10 rounded-xl bg-orange-400/20 border border-orange-400/30 flex items-center justify-center text-orange-400 hover:bg-orange-400 hover:text-secondary transition-all"
                                        title="Pausar Vaga"
                                    >
                                        <span className="material-symbols-outlined text-sm font-black">pause</span>
                                    </button>
                                )}
                                {selectedJob.status !== 'closed' && (
                                    <button
                                        onClick={() => handleUpdateJobStatus(selectedJob.id, 'closed')}
                                        className="w-10 h-10 rounded-xl bg-red-400/20 border border-red-400/30 flex items-center justify-center text-red-400 hover:bg-red-400 hover:text-secondary transition-all"
                                        title="Fechar Vaga"
                                    >
                                        <span className="material-symbols-outlined text-sm font-black">cancel</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-5 rounded-[2rem] bg-white/5 border border-white/10">
                                <p className="text-[8px] font-black text-white/30 uppercase mb-1">Localização</p>
                                <p className="text-[11px] font-bold text-white truncate">{selectedJob.location}</p>
                            </div>
                            <div className="p-5 rounded-[2rem] bg-white/5 border border-white/10">
                                <p className="text-[8px] font-black text-white/30 uppercase mb-1">Salário</p>
                                <p className="text-[11px] font-bold text-green-400">{selectedJob.salary}</p>
                            </div>
                        </div>

                        {/* Operational Details */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-5 rounded-[2rem] bg-white/5 border border-white/10">
                                <p className="text-[8px] font-black text-white/30 uppercase mb-1">Carga Horária</p>
                                <p className="text-[10px] font-bold text-white uppercase">{selectedJob.work_schedule || 'Não inf.'}</p>
                                <p className="text-[8px] font-medium text-white/40 uppercase mt-1">{selectedJob.work_days}</p>
                            </div>
                            <div className="p-5 rounded-[2rem] bg-white/5 border border-white/10">
                                <p className="text-[8px] font-black text-white/30 uppercase mb-1">Entrevista</p>
                                <p className="text-[10px] font-bold text-blue-400 uppercase">{selectedJob.interview_model === 'online' ? 'Online' : 'Presencial'}</p>
                                <p className="text-[8px] font-medium text-white/40 uppercase mt-1 truncate">{selectedJob.interview_detail || 'No link/address'}</p>
                            </div>
                        </div>

                        <div>
                            <h4 className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <span className="material-symbols-outlined text-xs">description</span> Descrição
                            </h4>
                            <p className="text-xs text-white/70 leading-relaxed font-medium bg-white/5 p-5 rounded-3xl border border-white/10">
                                {selectedJob.description}
                            </p>
                        </div>

                        {selectedJob.required_skills && selectedJob.required_skills.length > 0 && (
                            <div>
                                <h4 className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-3">Habilidades</h4>
                                <div className="flex flex-wrap gap-2">
                                    {selectedJob.required_skills?.map((s: string) => (
                                        <span key={s} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black uppercase text-white/60">{s}</span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {selectedJob.benefits && selectedJob.benefits.length > 0 && (
                            <div>
                                <h4 className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-3">Benefícios</h4>
                                <div className="space-y-2">
                                    {selectedJob.benefits.map((b: string) => (
                                        <div key={b} className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5">
                                            <div className="flex items-center gap-2">
                                                <span className="material-symbols-outlined text-green-400 text-sm">check_circle</span>
                                                <span className="text-[10px] font-black uppercase text-white/70">{b}</span>
                                            </div>
                                            {selectedJob.benefits_values?.[b] > 0 && (
                                                <span className="text-[10px] font-bold text-green-400">
                                                    +R$ {selectedJob.benefits_values[b]}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Map Section */}
                        {selectedJob.latitude && selectedJob.longitude && (
                            <div className="space-y-4">
                                <div className="flex justify-between items-center px-1">
                                    <h4 className="text-[10px] font-black text-white/50 uppercase tracking-widest">Raio de Contratação</h4>
                                    <span className="text-[10px] font-black text-primary uppercase">{selectedJob.hiring_radius} km</span>
                                </div>
                                <div className="w-full aspect-video rounded-3xl overflow-hidden border border-white/20 shadow-2xl relative">
                                    <RadiusMap
                                        latitude={selectedJob.latitude}
                                        longitude={selectedJob.longitude}
                                        radius={selectedJob.hiring_radius || 30}
                                        className="w-full h-full"
                                    />
                                    {/* Overlay for non-interactive feel if preferred, but here we let them see */}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}


            {showNotifications && (
                <div className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={() => setShowNotifications(false)}>
                    <div className="w-full max-w-sm bg-[#121827] border border-white/10 rounded-[3rem] p-8 overflow-hidden relative shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-[10px] font-black uppercase text-primary tracking-[0.3em]">Notificações</h3>
                            <button onClick={() => setShowNotifications(false)} className="material-symbols-outlined text-white/20 hover:text-white transition-colors">close</button>
                        </div>
                        <div className="space-y-4">
                            {stats.pendingMatches > 0 ? (
                                <div className="p-5 rounded-[2rem] bg-primary/5 border border-primary/10">
                                    <div className="flex gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-primary">person_add</span>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-white uppercase leading-tight">Novos Talentos</p>
                                            <p className="text-[9px] font-bold text-white/40 mt-1 uppercase tracking-tight font-sans">Há novos candidatos para analisar.</p>
                                        </div>
                                    </div>
                                    <button onClick={() => { onNavigate?.('candidates'); setShowNotifications(false); }} className="w-full mt-4 h-10 bg-primary text-secondary rounded-xl text-[9px] font-black uppercase">Analisar Agora</button>
                                </div>
                            ) : (
                                <div className="py-12 flex flex-col items-center opacity-20">
                                    <span className="material-symbols-outlined text-4xl mb-3">notifications_off</span>
                                    <p className="text-[9px] font-black tracking-widest uppercase leading-none">Nada de novo</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecruiterDashboard;
