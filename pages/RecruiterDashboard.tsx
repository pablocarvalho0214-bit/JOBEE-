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
    const [view, setView] = useState<'overview' | 'my_jobs' | 'review_candidates'>('overview');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ totalJobs: 0, totalMatches: 0, pendingMatches: 0 });
    const [myJobs, setMyJobs] = useState<any[]>([]);
    const [pendingCandidates, setPendingCandidates] = useState<any[]>([]);
    const [radarCandidates, setRadarCandidates] = useState<any[]>([]);
    const [counts, setCounts] = useState({ activeBees: 0 });
    const [selectedJob, setSelectedJob] = useState<any | null>(null);
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

            const { data: jobs } = await supabase.from('jobs').select('*').eq('recruiter_id', user.id).order('created_at', { ascending: false });
            const { data: matches } = await supabase.from('matches').select('*, candidate:profiles!candidate_id (*), job:jobs (*)').eq('recruiter_id', user.id);

            const pending = (matches || []).filter(m => m.status === 'pending');
            const totalMatches = (matches || []).filter(m => m.status === 'accepted').length;

            setStats({ totalJobs: jobs?.length || 0, totalMatches, pendingMatches: pending.length });
            setPendingCandidates(pending);

            const { count: candidateCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'candidate');
            setCounts({ activeBees: candidateCount || 0 });

            const { data: candidates } = await supabase.from('profiles').select('*').eq('role', 'candidate').limit(10);
            setRadarCandidates(candidates || []);

            setMyJobs((jobs || []).map(j => ({
                ...j,
                matchCount: (matches || []).filter(m => m.job_id === j.id && m.status === 'accepted').length
            })));
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
        <div className="flex flex-col h-full bg-secondary text-white relative overflow-hidden font-sans p-6 pt-10">
            <header className="flex justify-between items-center mb-6 shrink-0 h-14">
                <div className="flex flex-col">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">Hiring Hub</span>
                    <h1 className="text-2xl font-black uppercase tracking-tighter leading-none">Jobee <span className="text-primary italic">Control</span></h1>
                </div>
                <div className="flex items-center gap-3">
                    {/* Notification Bell */}
                    <button
                        onClick={() => onNavigate?.('profile')}
                        className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center relative active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined text-white/50 text-xl">notifications</span>
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
                {(['overview', 'my_jobs', 'review_candidates'] as const).map((t) => (
                    <button
                        key={t}
                        onClick={() => setView(t)}
                        className={`flex-1 py-3 rounded-xl transition-all relative ${view === t ? 'bg-primary text-secondary' : 'text-white/40'}`}
                    >
                        <span className="text-[9px] font-black uppercase tracking-tighter">
                            {t === 'overview' ? 'Geral' : t === 'my_jobs' ? 'Vagas' : 'Matches'}
                        </span>
                    </button>
                ))}
            </div>

            <div className="flex-1 min-h-0 overflow-y-auto scrollbar-hide">
                {view === 'overview' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
                        {/* Horizontal Stats Scroll */}
                        <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-2">
                            <StatCard label="Candidatos" value={counts.activeBees} icon="radar" primary />
                            <StatCard label="Vagas" value={stats.totalJobs} icon="grid_view" />
                            <StatCard label="Matches" value={stats.totalMatches} icon="electric_bolt" />
                        </div>

                        <section>
                            <h2 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-4 ml-1">Matches Pendentes</h2>
                            {pendingCandidates.length === 0 ? (
                                <div className="p-10 rounded-[2.5rem] bg-white/5 border border-dashed border-white/10 flex flex-col items-center opacity-30">
                                    <JobeeSymbol size={32} mode="dark" />
                                    <p className="text-[8px] font-black uppercase tracking-widest mt-3">Nada pendente</p>
                                </div>
                            ) : (
                                <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-4">
                                    {pendingCandidates.map(match => (
                                        <div key={match.id} className="flex-shrink-0 w-40 bg-white/5 p-4 rounded-[2rem] border border-white/10 flex flex-col items-center gap-2 group">
                                            <div className="w-14 h-14 rounded-full border-2 border-primary/20 p-0.5 overflow-hidden">
                                                <img src={match.candidate?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.candidate?.id}`} className="w-full h-full rounded-full object-cover" alt="" />
                                            </div>
                                            <div className="text-center mb-1">
                                                <h4 className="text-[9px] font-black text-white uppercase truncate w-32">{match.candidate?.full_name}</h4>
                                                <p className="text-[7px] font-bold text-white/30 uppercase truncate w-32">{match.job?.title}</p>
                                            </div>
                                            <div className="flex gap-1.5 w-full">
                                                <button onClick={() => handleMatchAction(match.id, 'rejected')} className="flex-1 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center"><span className="material-symbols-outlined text-xs">close</span></button>
                                                <button onClick={() => handleMatchAction(match.id, 'accepted')} className="flex-1 h-8 rounded-xl bg-primary text-secondary flex items-center justify-center"><span className="material-symbols-outlined text-xs">favorite</span></button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section>
                            <h2 className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-4 ml-1">Radar de Abelhas</h2>
                            <div className="flex gap-4 overflow-x-auto scrollbar-hide -mx-6 px-6 pb-6">
                                {radarCandidates.map(bee => (
                                    <div key={bee.id} className="flex-shrink-0 w-24 flex flex-col items-center gap-2 group">
                                        <div className="w-16 h-16 rounded-full border-2 border-white/10 p-0.5 relative">
                                            <img src={bee.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${bee.id}`} className="w-full h-full rounded-full object-cover" alt="" />
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full border-2 border-secondary flex items-center justify-center text-[10px] text-secondary">🔥</div>
                                        </div>
                                        <h4 className="text-[8px] font-black text-white uppercase truncate w-20 text-center">{bee.full_name}</h4>
                                    </div>
                                ))}
                            </div>
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
                                    <div className="w-12 h-12 rounded-2xl overflow-hidden bg-white/5">
                                        <img src={match.candidate?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${match.candidate?.id}`} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="flex-1">
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
            </div>

            {selectedJob && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-secondary/90 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setSelectedJob(null)}>
                    <div className="bg-secondary border border-white/10 rounded-[3rem] w-full max-h-[80vh] overflow-y-auto p-8 space-y-6 scrollbar-hide" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-between items-start">
                            <h3 className="text-xl font-black uppercase text-white">{selectedJob.title}</h3>
                            <button onClick={() => setSelectedJob(null)} className="text-white/40"><span className="material-symbols-outlined">close</span></button>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div><p className="text-[8px] font-black text-white/20 uppercase">Local</p><p className="text-xs text-white">{selectedJob.location}</p></div>
                            <div><p className="text-[8px] font-black text-white/20 uppercase">Salário</p><p className="text-xs text-primary">{selectedJob.salary}</p></div>
                        </div>
                        <div><p className="text-[8px] font-black text-white/20 uppercase mb-2">Descrição</p><p className="text-xs text-white/60 leading-relaxed italic">{selectedJob.description}</p></div>
                        <button onClick={() => setSelectedJob(null)} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-white/40">Voltar</button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default RecruiterDashboard;
