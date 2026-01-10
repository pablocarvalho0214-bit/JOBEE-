import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { JobeeSymbol } from '../components/JobeeIdentity';

const StatCard: React.FC<{ label: string, value: string | number, icon: string, primary?: boolean }> = ({ label, value, icon, primary }) => (
    <div className={`p-4 rounded-3xl backdrop-blur-xl border border-white/10 ${primary ? 'bg-primary/20 border-primary/30' : 'bg-white/5'} flex flex-col gap-1 shadow-2xl transition-all hover:scale-[1.02] flex-shrink-0 w-40`}>
        <div className="flex justify-between items-start">
            <span className={`material-symbols-outlined ${primary ? 'text-primary' : 'text-blue-400'} text-xl`}>{icon}</span>
            <span className="text-[8px] font-black uppercase tracking-widest text-white/20">Live</span>
        </div>
        <div className="mt-2">
            <h3 className="text-2xl font-black text-white leading-none tracking-tighter">{value}</h3>
            <p className="text-[8px] font-bold text-white/50 uppercase tracking-widest mt-1">{label}</p>
        </div>
    </div>
);

const RecruiterDashboard: React.FC<{ onNavigate?: (page: any) => void }> = ({ onNavigate }) => {
    const [view, setView] = useState<'overview' | 'my_jobs' | 'review_candidates' | 'agenda'>('overview');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalJobs: 0,
        totalApplicants: 0,
        recruiterMatches: 0,
        adherence: 0,
        pendingMatches: 0
    });
    const [myJobs, setMyJobs] = useState<any[]>([]);
    const [pendingCandidates, setPendingCandidates] = useState<any[]>([]);
    const [acceptedCandidates, setAcceptedCandidates] = useState<any[]>([]);
    const [scheduledInterviews, setScheduledInterviews] = useState<any[]>([]);
    const [radarCandidates, setRadarCandidates] = useState<any[]>([]);
    const [selectedJob, setSelectedJob] = useState<any | null>(null);
    const [selectedCandidate, setSelectedCandidate] = useState<any | null>(null);
    const [showNotifications, setShowNotifications] = useState(false);
    const [profile, setProfile] = useState<any>(null);

    useEffect(() => {
        fetchData();
        const subscription = supabase
            .channel('dashboard-updates')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'matches' }, () => fetchData())
            .subscribe();
        return () => { supabase.removeChannel(subscription); };
    }, []);

    const fetchData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profileData } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(profileData);

            const { data: jobs } = await supabase.from('jobs').select('*').eq('recruiter_id', user.id);
            // Consider all matches as "applicants" regardless of status (pending, accepted, rejected) - or maybe just pending+accepted?
            // "quantos candidatos totais se candidataram" usually means everyone who expressed interest.
            const { data: matches } = await supabase.from('matches').select('*, candidate:profiles!candidate_id (*), job:jobs (*)').eq('recruiter_id', user.id);

            const allJobs = jobs || [];
            const allMatches = matches || [];

            const pending = allMatches.filter(m => m.status === 'pending');
            const accepted = allMatches.filter(m => m.status === 'accepted');

            // "quantos desses o recrutador deu match" -> accepted matches
            // "aderência total" -> matches / vagas

            const totalJobsCount = allJobs.length;
            const recruiterMatchesCount = accepted.length;
            const totalApplicantsCount = allMatches.length; // Everyone who applied
            const adherenceRate = totalJobsCount > 0 ? Math.round((recruiterMatchesCount / totalJobsCount) * 100) / 100 : 0; // Ratio (e.g., 2.5 per job) or Percentage? User said "division of matches by total jobs". Assuming ratio.

            setStats({
                totalJobs: totalJobsCount,
                totalApplicants: totalApplicantsCount,
                recruiterMatches: recruiterMatchesCount,
                adherence: adherenceRate,
                pendingMatches: pending.length
            });

            setPendingCandidates(pending);
            setAcceptedCandidates(accepted);
            setScheduledInterviews(allMatches.filter(m => m.scheduled_at).sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime()));

            const { data: candidates } = await supabase.from('profiles').select('*').eq('role', 'candidate').limit(10);
            setRadarCandidates(candidates || []);

            setMyJobs(allJobs.map(j => ({
                ...j,
                matchCount: allMatches.filter(m => m.job_id === j.id && m.status === 'accepted').length
            })).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()));
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const handleSponsorJob = async (jobId: string) => {
        try {
            await supabase.from('jobs').update({ is_sponsored: true, priority_level: 2 }).eq('id', jobId);
            fetchData();
        } catch (err) { console.error(err); }
    };

    const handleMatchAction = async (matchId: string, action: 'accepted' | 'rejected') => {
        try {
            await supabase.from('matches').update({ status: action }).eq('id', matchId);
            setPendingCandidates(prev => prev.filter(m => m.id !== matchId));
            fetchData();
        } catch (err) { console.error(err); }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full bg-secondary">
                <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-secondary text-white relative overflow-hidden font-sans p-6" style={{ paddingTop: 'calc(2.5rem + env(safe-area-inset-top))' }}>
            <header className="flex justify-between items-center mb-6 shrink-0 h-14">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Hiring Hub</span>
                    <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Jobee <span className="text-primary italic">Control</span></h1>
                </div>
                <div className="flex items-center gap-3">
                    {/* Notification Bell */}
                    <button
                        onClick={() => setShowNotifications(!showNotifications)}
                        className={`w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative active:scale-95 transition-all ${showNotifications ? 'border-primary/50 text-primary' : ''}`}
                    >
                        <span className={`material-symbols-outlined ${showNotifications ? 'text-primary' : 'text-white/50'} text-xl`}>notifications</span>
                        {stats.pendingMatches > 0 && (
                            <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-blue-500 rounded-full border-2 border-secondary animate-pulse"></span>
                        )}
                    </button>

                    {/* Profile Avatar */}
                    <button
                        onClick={() => onNavigate?.('profile')}
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

            <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10 mb-6 shrink-0">
                {(['overview', 'my_jobs', 'review_candidates', 'agenda'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setView(t)}
                        className={`flex-1 py-3 rounded-xl transition-all relative ${view === t ? 'bg-primary text-secondary' : 'text-white/40'}`}
                    >
                        <span className="text-[9px] font-black uppercase tracking-tighter">
                            {t === 'overview' ? 'Geral' : t === 'my_jobs' ? 'Vagas' : t === 'review_candidates' ? 'Matches' : 'Agenda'}
                        </span>
                    </button>
                ))}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                {view === 'overview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                        {/* Highlights / Stats Grid */}
                        <div className="grid grid-cols-2 gap-3 px-1">
                            {/* Vagas em Aberto */}
                            <div className="p-5 rounded-[2rem] bg-indigo-500/10 border border-indigo-500/20 flex flex-col items-center justify-center gap-1 shadow-lg shadow-indigo-500/5">
                                <span className="material-symbols-outlined text-indigo-400 text-3xl mb-1">domain</span>
                                <h3 className="text-3xl font-black text-white leading-none">{stats.totalJobs}</h3>
                                <p className="text-[8px] font-bold text-indigo-200/50 uppercase tracking-widest text-center">Vagas Abertas</p>
                            </div>

                            {/* Total de Candidaturas */}
                            <div className="p-5 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-white/40 text-3xl mb-1">group</span>
                                <h3 className="text-3xl font-black text-white leading-none">{stats.totalApplicants}</h3>
                                <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest text-center">Candidaturas</p>
                            </div>

                            {/* Matches Dados pelo Recrutador */}
                            <div className="p-5 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-1">
                                <span className="material-symbols-outlined text-green-400/80 text-3xl mb-1">how_to_reg</span>
                                <h3 className="text-3xl font-black text-white leading-none">{stats.recruiterMatches}</h3>
                                <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest text-center">Matches Realizados</p>
                            </div>

                            {/* Aderência (Matches / Vagas) */}
                            <div className="p-5 rounded-[2rem] bg-primary/10 border border-primary/20 flex flex-col items-center justify-center gap-1 shadow-lg shadow-primary/5 relative overflow-hidden">
                                <div className="absolute inset-0 bg-primary/5 blur-xl"></div>
                                <span className="material-symbols-outlined text-primary text-3xl mb-1">fact_check</span>
                                <div className="flex items-baseline gap-1 relative z-10">
                                    <h3 className="text-3xl font-black text-white leading-none">{stats.adherence}</h3>
                                    <span className="text-[10px] text-white/50 font-bold">/ vaga</span>
                                </div>
                                <p className="text-[8px] font-bold text-primary/50 uppercase tracking-widest text-center relative z-10">Aderência Média</p>
                            </div>
                        </div>

                        <section>
                            <div className="flex items-center justify-between mb-4 px-1">
                                <h2 className="text-[10px] font-black uppercase tracking-widest text-white/50">Análises Pendentes</h2>
                                {stats.pendingMatches > 0 && (
                                    <span className="bg-blue-500 text-white text-[9px] font-black px-2 py-0.5 rounded-full shadow-lg shadow-blue-500/20">{stats.pendingMatches} novos</span>
                                )}
                            </div>

                            {pendingCandidates.length === 0 ? (
                                <div className="p-8 rounded-[2.5rem] bg-white/5 border border-dashed border-white/10 flex flex-col items-center opacity-40">
                                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-3">
                                        <span className="material-symbols-outlined text-white/30">task_alt</span>
                                    </div>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-white/50">Tudo em dia!</p>
                                </div>
                            ) : (
                                <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-4">
                                    {pendingCandidates.map(match => (
                                        <div key={match.id} className="flex-shrink-0 w-44 bg-[#0F1422] p-4 rounded-[2rem] border border-white/5 flex flex-col items-center gap-3 shadow-xl">
                                            <div className="relative">
                                                <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-lg">
                                                    <img src={match.candidate?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.candidate?.id}`} className="w-full h-full object-cover" alt="" />
                                                </div>
                                                <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-md">
                                                    <span className="material-symbols-outlined text-[#0B0F1A] text-[14px]">work</span>
                                                </div>
                                            </div>

                                            <div className="text-center w-full">
                                                <h4 className="text-[11px] font-black text-white uppercase truncate px-1">{match.candidate?.full_name}</h4>
                                                <p className="text-[8px] font-bold text-blue-400 uppercase truncate w-full px-2 mt-0.5">{match.job?.title}</p>
                                            </div>

                                            <div className="w-full h-px bg-white/5 my-1"></div>

                                            <div className="flex gap-2 w-full">
                                                <button onClick={() => handleMatchAction(match.id, 'rejected')} className="flex-1 h-9 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 flex items-center justify-center transition-colors group">
                                                    <span className="material-symbols-outlined text-base text-red-500 group-hover:scale-110 transition-transform">close</span>
                                                </button>
                                                <button onClick={() => handleMatchAction(match.id, 'accepted')} className="flex-1 h-9 rounded-xl bg-blue-500 hover:bg-blue-400 text-white shadow-lg shadow-blue-500/20 flex items-center justify-center transition-all group">
                                                    <span className="material-symbols-outlined text-base group-hover:scale-110 transition-transform">check</span>
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>
                    </div>
                )}

                {view === 'my_jobs' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
                        {myJobs.map(job => (
                            <div key={job.id} onClick={() => setSelectedJob(job)} className={`p-5 rounded-[2.5rem] bg-white/5 border ${job.is_sponsored ? 'border-primary' : 'border-white/10'} flex flex-col gap-4 relative overflow-hidden active:scale-95 transition-all`}>
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h4 className="text-base font-black uppercase tracking-tight text-white leading-tight">{job.title}</h4>
                                        <p className="text-[9px] font-bold text-white/40 uppercase mt-1">{job.location} • <span className="text-primary">{job.salary}</span></p>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/20 rounded-full">
                                        <span className="text-[9px] font-black text-primary">{job.matchCount || 0}</span>
                                        <span className="material-symbols-outlined text-primary text-xs">electric_bolt</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {view === 'review_candidates' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
                        {pendingCandidates.map(match => (
                            <div key={match.id} className="p-6 rounded-[2.5rem] bg-white/5 border border-white/10 flex flex-col gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/5 cursor-pointer" onClick={() => setSelectedCandidate(match.candidate)}>
                                        <img src={match.candidate?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.candidate?.id}`} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="flex-1 cursor-pointer" onClick={() => setSelectedCandidate(match.candidate)}>
                                        <h4 className="text-[11px] font-black uppercase text-white">{match.candidate?.full_name}</h4>
                                        <p className="text-[9px] font-bold text-primary uppercase">{match.job?.title}</p>
                                    </div>
                                </div>
                                <p className="text-[10px] text-white/50 italic px-2">"{match.candidate?.bio || 'Buscando uma oportunidade...'}"</p>
                                <div className="flex gap-2">
                                    <button onClick={() => handleMatchAction(match.id, 'rejected')} className="flex-1 h-12 bg-white/5 rounded-2xl text-[9px] font-black uppercase border border-white/10">Pular</button>
                                    <button onClick={() => handleMatchAction(match.id, 'accepted')} className="flex-[1.5] h-12 bg-primary text-secondary rounded-2xl text-[9px] font-black uppercase shadow-lg shadow-primary/20">Match Bee</button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {view === 'agenda' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500 pb-10">
                        <div className="flex items-center justify-between px-2 mb-2">
                            <h2 className="text-[10px] font-black uppercase tracking-widest text-white/40">Entrevistas Agendadas</h2>
                            <span className="text-[10px] font-bold text-primary">{scheduledInterviews.length} total</span>
                        </div>
                        {scheduledInterviews.length === 0 ? (
                            <div className="p-12 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10">
                                <span className="material-symbols-outlined text-white/10 text-4xl mb-3">calendar_today</span>
                                <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Nenhuma entrevista marcada ainda.</p>
                            </div>
                        ) : (
                            scheduledInterviews.map(match => (
                                <div key={match.id} className="p-5 rounded-[2.5rem] bg-white/5 border border-white/10 flex flex-col gap-4 relative overflow-hidden transition-all hover:bg-white/[0.07]">
                                    <div className="flex justify-between items-start">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/5 border border-white/10 shrink-0 cursor-pointer" onClick={() => setSelectedCandidate(match.candidate)}>
                                                <img src={match.candidate?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.candidate?.id}`} className="w-full h-full object-cover" alt="" />
                                            </div>
                                            <div className="cursor-pointer" onClick={() => setSelectedCandidate(match.candidate)}>
                                                <h4 className="text-sm font-black uppercase tracking-tight text-white leading-tight">{match.candidate?.full_name}</h4>
                                                <p className="text-[9px] font-bold text-primary uppercase mt-0.5">{match.job?.title}</p>
                                            </div>
                                        </div>
                                        <div className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-xl flex flex-col items-center">
                                            <span className="material-symbols-outlined text-primary text-sm mb-0.5">event</span>
                                            <span className="text-[9px] font-black text-white whitespace-nowrap">{match.scheduled_at}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => setSelectedCandidate(match.candidate)}
                                            className="flex-1 h-10 bg-white/5 rounded-xl text-[9px] font-black uppercase border border-white/5 flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">visibility</span>
                                            Ver Perfil
                                        </button>
                                        <a
                                            href={match.interview_model === 'online' ? (match.interview_detail?.startsWith('http') ? match.interview_detail : `https://${match.interview_detail}`) : '#'}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex-1 h-10 bg-primary text-secondary rounded-xl text-[9px] font-black uppercase flex items-center justify-center gap-2"
                                        >
                                            <span className="material-symbols-outlined text-sm">{match.interview_model === 'online' ? 'video_call' : 'location_on'}</span>
                                            {match.interview_model === 'online' ? 'Entrar na Sala' : 'Ver Local'}
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>

            {selectedJob && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 bg-[#0B0F1A]/95 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedJob(null)}>
                    <div className="bg-[#121827] border border-white/10 rounded-t-[3rem] sm:rounded-[3rem] w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 space-y-8 shadow-2xl relative scrollbar-hide" onClick={e => e.stopPropagation()}>

                        {/* Drag Handle for mobile vibe */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-white/10 rounded-full sm:hidden"></div>

                        <div className="flex justify-between items-start mt-2">
                            <div className="flex-1 pr-4">
                                <div className="flex gap-2 mb-3">
                                    <span className="inline-block px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-[9px] font-black text-primary uppercase tracking-widest">
                                        {selectedJob.type || 'Híbrido'}
                                    </span>
                                    {selectedJob.is_sponsored && (
                                        <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                                            Patrocinada
                                        </span>
                                    )}
                                </div>
                                <h3 className="text-2xl font-black uppercase text-white leading-tight break-words">{selectedJob.title}</h3>
                                <p className="text-[10px] font-bold text-white/40 uppercase mt-2 flex items-center gap-1">
                                    <span className="material-symbols-outlined text-sm">location_on</span>
                                    {selectedJob.location}
                                </p>
                            </div>
                            <button onClick={() => setSelectedJob(null)} className="shrink-0 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Salary & Match Stats */}
                        <div className="flex gap-3">
                            <div className="flex-1 p-5 rounded-3xl bg-white/5 border border-white/10">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1">
                                    {selectedJob.show_remuneration ? 'Remuneração Total' : 'Salário Base'}
                                </p>
                                <p className="text-lg font-black text-primary">
                                    {selectedJob.show_remuneration ? (selectedJob.total_remuneration || selectedJob.salary) : selectedJob.salary}
                                </p>
                                {selectedJob.show_remuneration && (
                                    <div className="mt-2 space-y-0.5">
                                        <div className="flex justify-between items-center text-[9px] font-bold text-white/40">
                                            <span>Salário:</span>
                                            <span>{selectedJob.salary}</span>
                                        </div>
                                        <div className="flex justify-between items-center text-[9px] font-bold text-white/40">
                                            <span>Benefícios:</span>
                                            <span>+{(Object.values(selectedJob.benefits_values || {}) as number[]).reduce((a, b) => a + b, 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20">
                                <p className="text-[9px] font-black text-blue-300/50 uppercase tracking-widest mb-1">Interessados</p>
                                <div className="flex items-center gap-1">
                                    <span className="text-lg font-black text-blue-400">{selectedJob.matchCount || 0}</span>
                                    <span className="material-symbols-outlined text-blue-400 text-sm">group</span>
                                </div>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50 mb-3">
                                <span className="material-symbols-outlined text-sm">description</span>
                                Sobre a Vaga
                            </h4>
                            <p className="text-sm text-white/80 leading-relaxed font-medium text-justify">{selectedJob.description}</p>
                        </div>

                        {/* Skills */}
                        {(selectedJob.requiredSkills || selectedJob.requirements) && (
                            <div>
                                <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50 mb-3">
                                    <span className="material-symbols-outlined text-sm">verified</span>
                                    Requisitos & Skills
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {(selectedJob.requiredSkills || selectedJob.requirements || []).map((skill: string, idx: number) => (
                                        <span key={idx} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 text-[10px] font-bold text-white uppercase tracking-wider">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Details Grid (Experience, Schedule, etc) */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                                <span className="material-symbols-outlined text-white/20 mb-1">work_history</span>
                                <p className="text-[8px] font-black text-white/30 uppercase">Experiência</p>
                                <p className="text-xs font-bold text-white">{selectedJob.experienceYears || 'Não especificado'}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                                <span className="material-symbols-outlined text-white/20 mb-1">schedule</span>
                                <p className="text-[8px] font-black text-white/30 uppercase">Horário</p>
                                <p className="text-xs font-bold text-white">{selectedJob.workSchedule || 'Comercial'}</p>
                            </div>
                        </div>

                        {/* Benefits */}
                        {(selectedJob.benefits && selectedJob.benefits.length > 0) && (
                            <div>
                                <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50 mb-3">
                                    <span className="material-symbols-outlined text-sm">redeem</span>
                                    Benefícios & Vantagens
                                </h4>
                                <div className="grid grid-cols-1 gap-2">
                                    {selectedJob.benefits.map((benefit: string, idx: number) => (
                                        <div key={idx} className="flex items-center justify-between p-3 rounded-2xl bg-white/5 border border-white/5">
                                            <div className="flex items-center gap-3">
                                                <span className="material-symbols-outlined text-primary text-sm">check_circle</span>
                                                <span className="text-xs font-bold text-white/80">{benefit}</span>
                                            </div>
                                            {selectedJob.benefits_values && selectedJob.benefits_values[benefit] > 0 && (
                                                <span className="text-[10px] font-black text-primary bg-primary/10 px-2 py-1 rounded-lg border border-primary/20">
                                                    +{selectedJob.benefits_values[benefit].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                                </span>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Operational Details (Interview & Logistics) */}
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <h4 className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50">
                                <span className="material-symbols-outlined text-sm">settings</span>
                                Detalhes Operacionais
                            </h4>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                                    <span className="material-symbols-outlined text-white/20 mb-1">video_camera_front</span>
                                    <p className="text-[8px] font-black text-white/30 uppercase">Modelo de Entrevista</p>
                                    <p className="text-xs font-bold text-white uppercase">
                                        {selectedJob.interview_model === 'online' ? '100% Online' : 'Presencial'}
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                                    <span className="material-symbols-outlined text-white/20 mb-1">calendar_clock</span>
                                    <p className="text-[8px] font-black text-white/30 uppercase">Agendamento</p>
                                    <p className="text-xs font-bold text-white uppercase">
                                        {selectedJob.scheduling_mode === 'automated' ? 'Automático (Slots)' : 'Manual'}
                                    </p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                                    <span className="material-symbols-outlined text-white/20 mb-1">radar</span>
                                    <p className="text-[8px] font-black text-white/30 uppercase">Raio de Contratação</p>
                                    <p className="text-xs font-bold text-white">{selectedJob.hiring_radius} km</p>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-1">
                                    <span className="material-symbols-outlined text-white/20 mb-1">timer</span>
                                    <p className="text-[8px] font-black text-white/30 uppercase">Duração (Entrevista)</p>
                                    <p className="text-xs font-bold text-white">{selectedJob.interview_duration} min</p>
                                </div>
                            </div>

                            {/* Specific Schedule Details */}
                            <div className="p-4 rounded-2xl bg-[#0B0F1A] border border-white/5 space-y-3">
                                <div className="flex justify-between items-center">
                                    <p className="text-[9px] font-black text-white/30 uppercase">Dias de Trabalho</p>
                                    <p className="text-[10px] font-bold text-white">{selectedJob.work_days || 'Não especificado'}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-[9px] font-black text-white/30 uppercase">Carga Horária</p>
                                    <p className="text-[10px] font-bold text-white">{selectedJob.weekly_hours || 'Não especificado'}</p>
                                </div>
                                <div className="flex justify-between items-center">
                                    <p className="text-[9px] font-black text-white/30 uppercase">Intervalo</p>
                                    <p className="text-[10px] font-bold text-white">{selectedJob.lunch_time || 'Não especificado'}</p>
                                </div>
                            </div>

                            {selectedJob.interview_detail && (
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-1">
                                    <p className="text-[9px] font-black text-white/30 uppercase">Observações da Entrevista</p>
                                    <p className="text-[11px] text-white/70 italic leading-relaxed">"{selectedJob.interview_detail}"</p>
                                </div>
                            )}
                        </div>

                        {/* Admin Details */}
                        <div className="flex gap-4 p-4 rounded-2xl bg-[#0B0F1A] border border-dashed border-white/10">
                            <div>
                                <p className="text-[8px] font-black text-white/20 uppercase mb-1">Confidencialidade</p>
                                <p className="text-[10px] font-bold text-white uppercase">{selectedJob.isConfidential ? 'Confidencial 🔒' : 'Pública 🌍'}</p>
                            </div>
                            <div>
                                <p className="text-[8px] font-black text-white/20 uppercase mb-1">ID da Vaga</p>
                                <p className="text-[10px] font-mono text-white/40 tracking-tighter truncate w-32">#{selectedJob.id.slice(0, 8)}</p>
                            </div>
                        </div>

                        {/* Sticky Footer Action */}
                        <div className="pt-4 border-t border-white/10 sticky bottom-0 bg-[#121827] z-20 -mx-8 px-8 pb-4 sm:pb-0 sm:static sm:bg-transparent sm:mx-0 sm:px-0 sm:border-0">
                            <button onClick={() => setSelectedJob(null)} className="w-full h-14 bg-white text-[#0B0F1A] rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-lg shadow-white/10 flex items-center justify-center gap-2">
                                <span className="material-symbols-outlined">expand_more</span>
                                Fechar Detalhes
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {selectedCandidate && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center sm:p-6 bg-[#0B0F1A]/95 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedCandidate(null)}>
                    <div className="bg-[#121827] border border-white/10 rounded-t-[3rem] sm:rounded-[3rem] w-full max-w-lg max-h-[90vh] overflow-y-auto p-8 space-y-8 shadow-2xl relative scrollbar-hide" onClick={e => e.stopPropagation()}>

                        {/* Drag Handle */}
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-white/10 rounded-full sm:hidden"></div>

                        <div className="flex justify-between items-start mt-2">
                            <div className="flex items-center gap-4">
                                <div className="w-20 h-20 rounded-[2rem] overflow-hidden border-2 border-primary/30 p-1">
                                    <img src={selectedCandidate.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedCandidate.id}`} className="w-full h-full object-cover rounded-[1.8rem]" alt="" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black uppercase text-white leading-tight">{selectedCandidate.full_name}</h3>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">{selectedCandidate.target_role || 'Candidato'}</p>
                                    <p className="text-[9px] font-bold text-white/40 uppercase mt-1 flex items-center gap-1">
                                        <span className="material-symbols-outlined text-[12px]">location_on</span>
                                        {selectedCandidate.location}
                                    </p>
                                </div>
                            </div>
                            <button onClick={() => setSelectedCandidate(null)} className="shrink-0 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>

                        {/* Bio Section */}
                        <div className="p-6 rounded-[2.5rem] bg-white/5 border border-white/10">
                            <h4 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/30 mb-3">
                                <span className="material-symbols-outlined text-sm">person</span>
                                Sobre o Candidato
                            </h4>
                            <p className="text-sm text-white/80 leading-relaxed italic">"{selectedCandidate.metadata?.bio || 'Buscando novos desafios e oportunidades na área...'}"</p>
                        </div>

                        {/* Skills & Tools */}
                        <div className="space-y-6">
                            {(selectedCandidate.skills && selectedCandidate.skills.length > 0) && (
                                <div>
                                    <h4 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/30 mb-3">
                                        <span className="material-symbols-outlined text-sm">verified</span>
                                        Skills Técnicas
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedCandidate.skills.map((skill: string, idx: number) => (
                                            <span key={idx} className="px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-[10px] font-bold text-primary uppercase">
                                                {skill}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {(selectedCandidate.metadata?.tools && selectedCandidate.metadata.tools.length > 0) && (
                                <div>
                                    <h4 className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-white/30 mb-3">
                                        <span className="material-symbols-outlined text-sm">construction</span>
                                        Ferramentas
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {selectedCandidate.metadata.tools.map((tool: string, idx: number) => (
                                            <span key={idx} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white/60 uppercase">
                                                {tool}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Professional Profile Details */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 rounded-2xl bg-[#0B0F1A] border border-white/5">
                                <p className="text-[8px] font-black text-white/20 uppercase mb-1">Sênioridade</p>
                                <p className="text-xs font-bold text-white uppercase">{selectedCandidate.metadata?.experienceLevel || 'Pleno'}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-[#0B0F1A] border border-white/5">
                                <p className="text-[8px] font-black text-white/20 uppercase mb-1">Pretensão</p>
                                <p className="text-xs font-bold text-primary uppercase">R$ {selectedCandidate.metadata?.salaryExpectation || '---'}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-[#0B0F1A] border border-white/5">
                                <p className="text-[8px] font-black text-white/20 uppercase mb-1">Modalidade</p>
                                <p className="text-xs font-bold text-white uppercase">{selectedCandidate.metadata?.preferredModality || 'Híbrido'}</p>
                            </div>
                            <div className="p-4 rounded-2xl bg-[#0B0F1A] border border-white/5">
                                <p className="text-[8px] font-black text-white/20 uppercase mb-1">Setor</p>
                                <p className="text-xs font-bold text-white uppercase">{selectedCandidate.industry || 'Tecnologia'}</p>
                            </div>
                        </div>

                        {/* Action Bar */}
                        <div className="pt-4 border-t border-white/10">
                            <button
                                onClick={() => setSelectedCandidate(null)}
                                className="w-full h-14 bg-white text-[#0B0F1A] rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-gray-200 transition-colors shadow-lg shadow-white/10"
                            >
                                Voltar ao Dashboard
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showNotifications && (
                <>
                    <div className="fixed inset-0 z-[110] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setShowNotifications(false)}></div>
                    <div className="fixed top-24 right-6 w-80 max-h-[70vh] bg-[#121827] border border-white/10 rounded-[2rem] shadow-2xl z-[120] overflow-hidden flex flex-col animate-in slide-in-from-top-4 duration-300">
                        <header className="p-5 border-b border-white/5 flex justify-between items-center bg-white/5">
                            <h3 className="text-[10px] font-black uppercase tracking-widest text-primary">Notificações</h3>
                            <button onClick={() => setShowNotifications(false)} className="material-symbols-outlined text-white/20 text-lg hover:text-white transition-colors">close</button>
                        </header>
                        <div className="flex-1 overflow-y-auto scrollbar-hide py-2">
                            {stats.pendingMatches > 0 ? (
                                <div className="px-2 space-y-2">
                                    <div
                                        onClick={() => { setView('review_candidates'); setShowNotifications(false); }}
                                        className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-start gap-3 cursor-pointer hover:bg-primary/10 transition-colors"
                                    >
                                        <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center shrink-0">
                                            <span className="material-symbols-outlined text-primary">person_add</span>
                                        </div>
                                        <div>
                                            <p className="text-[11px] font-black text-white uppercase leading-tight">Novas Candidaturas</p>
                                            <p className="text-[9px] font-bold text-white/40 mt-1 uppercase">Você tem {stats.pendingMatches} candidatos aguardando revisão nas suas vagas.</p>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-10 text-center opacity-30 flex flex-col items-center">
                                    <span className="material-symbols-outlined text-4xl mb-3">notifications_off</span>
                                    <p className="text-[9px] font-black uppercase tracking-widest leading-relaxed">Nenhuma notificação<br />nova por aqui.</p>
                                </div>
                            )}

                            {/* Example Static Notifications for Richness */}
                            <div className="px-2 mt-2 pt-2 border-t border-white/5 space-y-2 opacity-60">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-start gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center shrink-0">
                                        <span className="material-symbols-outlined text-white/30">verified</span>
                                    </div>
                                    <div>
                                        <p className="text-[11px] font-black text-white/50 uppercase leading-tight">Perfil Verificado</p>
                                        <p className="text-[9px] font-bold text-white/20 mt-1 uppercase">Seu perfil de empresa foi verificado com sucesso.</p>
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

export default RecruiterDashboard;
