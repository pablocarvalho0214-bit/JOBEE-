import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { JobeeSymbol } from '../components/JobeeIdentity';
import { useToast } from '../context/ToastContext';

const RecruiterMatchPage: React.FC<{ onNavigate?: (page: any) => void }> = ({ onNavigate }) => {
    const [jobs, setJobs] = useState<any[]>([]);
    const [selectedJob, setSelectedJob] = useState<any>(null);
    const [candidates, setCandidates] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<'interested' | 'pool'>('interested');
    const [counts, setCounts] = useState({ interested: 0, pool: 0 });
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startY = React.useRef(0);
    const scrollRef = React.useRef<HTMLDivElement>(null);
    const DRAG_THRESHOLD = 10;
    const [showRejectionModal, setShowRejectionModal] = useState(false);
    const [rejectionTarget, setRejectionTarget] = useState<any | null>(null);
    const [showMatchCelebration, setShowMatchCelebration] = useState(false);
    const [matchedCandidate, setMatchedCandidate] = useState<any | null>(null);
    const [showLegend, setShowLegend] = useState(false);
    const [quickMessage, setQuickMessage] = useState('');
    const { showToast } = useToast();

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        // Only allow dragging from the top area (header/drag handle)
        setIsDragging(true);
        const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
        startY.current = clientY - dragY;
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isDragging) return;

        const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0].clientY : (e as React.MouseEvent).clientY;
        const deltaY = clientY - startY.current;

        // If trying to scroll up or if we have already scrolled the content, don't drag
        if (deltaY < 0 || (scrollRef.current && scrollRef.current.scrollTop > 0)) {
            setIsDragging(false);
            setDragY(0);
            return;
        }

        // Only move if we pass the threshold
        if (deltaY > DRAG_THRESHOLD) {
            setDragY(deltaY - DRAG_THRESHOLD);
        }
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        if (dragY > 150) {
            // Ir para a página de "Vagas" (Dashboard/jobs list)
            onNavigate?.('jobs');
            setDragY(0);
        } else {
            setDragY(0);
        }
    };

    useEffect(() => {
        fetchRecruiterJobs();
    }, []);

    const fetchRecruiterJobs = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Count for discovery/talent pool
        const { count: totalCandidates } = await supabase
            .from('profiles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'candidate');

        const { data: jobsData } = await supabase
            .from('jobs')
            .select('*, matches(*)')
            .eq('recruiter_id', user.id)
            .eq('status', 'active')
            .order('created_at', { ascending: false });

        if (jobsData) {
            const jobsWithStats = jobsData.map(job => {
                const jobMatches = (job.matches || []) as any[];

                // 1. Aguardando Análise (Who applied but recruiter hasn't responded?)
                const pending = jobMatches.filter(m => m.candidate_liked && !m.recruiter_liked && !m.recruiter_rejected).length;

                // 2. Aprovados (Matches confirmados)
                const approved = jobMatches.filter(m => m.candidate_liked && m.recruiter_liked).length;

                // 3. Reprovados (Descartados pelo recrutador)
                const rejected = jobMatches.filter(m => m.recruiter_rejected).length;

                // 4. No Radar (Total candidates - those swiped by recruiter)
                const swipedByRecruiter = jobMatches.filter(m => m.recruiter_liked || m.recruiter_rejected).length;
                const toDiscover = Math.max(0, (totalCandidates || 0) - swipedByRecruiter);

                // 5. % Aderência (Approved / Total Interested)
                const totalInterested = pending + approved + rejected;
                const adherence = totalInterested > 0 ? (approved / totalInterested) * 100 : 0;

                return {
                    ...job,
                    pending,
                    approved,
                    rejected,
                    toDiscover,
                    adherence
                };
            });
            setJobs(jobsWithStats);
        }
    };

    const fetchCandidatesForJob = async (job: any) => {
        setLoading(true);
        try {
            // 1. Fetch statuses for this job to identify applicants and excluded candidates
            const { data: jobMatches } = await supabase
                .from('matches')
                .select('candidate_id, recruiter_liked, recruiter_rejected, candidate_liked')
                .eq('job_id', job.id);

            const matches = jobMatches || [];

            // 2. EXCLUSION logic: Candidates already swiped by the RECRUITER
            const swipedByRecruiterIds = matches
                .filter(m => m.recruiter_liked || m.recruiter_rejected)
                .map(m => m.candidate_id);

            // 3. IDENTIFICATION logic: Candidates who liked the job (Inbound/Interested)
            const interestedIds = matches
                .filter(m => !m.recruiter_liked && !m.recruiter_rejected && m.candidate_liked)
                .map(m => m.candidate_id);

            // 4. Counts for UI
            const interestedCount = interestedIds.length;

            // Total eligible pool (all candidates minus those swiped by recruiter)
            const { count: totalCandidatesCount } = await supabase
                .from('profiles')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'candidate');

            const poolCount = Math.max(0, (totalCandidatesCount || 0) - swipedByRecruiterIds.length - interestedCount);

            setCounts({ interested: interestedCount, pool: poolCount });

            // 5. Fetch Based on Active Tab
            let query = supabase
                .from('profiles')
                .select('*')
                .eq('role', 'candidate');

            if (activeTab === 'interested') {
                if (interestedIds.length > 0) {
                    query = query.in('id', interestedIds);
                } else {
                    setCandidates([]);
                    setLoading(false);
                    return;
                }
            } else {
                // Pool Tab: Exclude ALL who are in matches (both interested and swiped)
                const allInvolvedIds = matches.map(m => m.candidate_id);
                if (allInvolvedIds.length > 0) {
                    query = query.not('id', 'in', `(${allInvolvedIds.join(',')})`);
                }
            }

            const { data: candidatesData } = await query.limit(30);

            if (candidatesData) {
                const mapped = candidatesData.map(c => ({
                    ...c,
                    matchScore: activeTab === 'interested' ? 95 : (Math.floor(Math.random() * 20) + 75),
                    hasApplied: activeTab === 'interested'
                }));

                setCandidates(mapped);
                setCurrentIndex(0);
            }
        } catch (err) {
            console.error('Error fetching candidates:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectJob = (job: any) => {
        setSelectedJob(job);
        fetchCandidatesForJob(job);
    };

    const handleAction = async (action: 'like' | 'pass') => {
        const candidate = candidates[currentIndex];
        if (!candidate || !selectedJob) return;

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        try {
            if (action === 'like') {
                // Check if candidate already liked (Inbound)
                const { data: existingMatch, error: fetchError } = await supabase
                    .from('matches')
                    .select('*')
                    .eq('candidate_id', candidate.id)
                    .eq('job_id', selectedJob.id)
                    .maybeSingle();

                if (fetchError) throw fetchError;

                const isMatch = existingMatch?.candidate_liked === true;

                const { data: matchData, error: upsertError } = await supabase.from('matches').upsert({
                    id: existingMatch?.id,
                    candidate_id: candidate.id,
                    job_id: selectedJob.id,
                    recruiter_id: user.id,
                    candidate_liked: existingMatch?.candidate_liked || false,
                    recruiter_liked: true,
                    status: isMatch ? 'accepted' : 'pending',
                    matched_at: isMatch ? new Date().toISOString() : null
                }).select('id').single();

                if (upsertError) throw upsertError;

                // Synchronize Counts Locally
                setCounts(prev => ({
                    ...prev,
                    [activeTab]: Math.max(0, prev[activeTab] - 1)
                }));

                if (isMatch) {
                    setMatchedCandidate({ ...candidate, matchId: matchData.id });
                    setShowMatchCelebration(true);
                } else {
                    goToNext();
                }
            } else {
                setRejectionTarget(candidate);
                setShowRejectionModal(true);
            }
        } catch (err) {
            console.error('Error in handleAction:', err);
            showToast('Erro ao processar ação. Tente novamente.', 'error');
        }
    };

    const confirmRejection = async (feedback: string) => {
        if (!rejectionTarget || !selectedJob) return;
        const { data: { user } } = await supabase.auth.getUser();

        try {
            // Check for existing match to get ID and preserve candidate_liked
            const { data: existingMatch, error: fetchError } = await supabase
                .from('matches')
                .select('id, candidate_liked')
                .eq('candidate_id', rejectionTarget.id)
                .eq('job_id', selectedJob.id)
                .maybeSingle();

            if (fetchError) throw fetchError;

            const { error: upsertError } = await supabase.from('matches').upsert({
                id: existingMatch?.id,
                candidate_id: rejectionTarget.id,
                job_id: selectedJob.id,
                recruiter_id: user?.id,
                candidate_liked: existingMatch?.candidate_liked || false,
                recruiter_rejected: true,
                status: 'rejected'
            });

            if (upsertError) throw upsertError;

            // Synchronize Counts Locally
            setCounts(prev => ({
                ...prev,
                [activeTab]: Math.max(0, prev[activeTab] - 1)
            }));

            setShowRejectionModal(false);
            setRejectionTarget(null);
            goToNext();
        } catch (err) {
            console.error('Error in confirmRejection:', err);
            showToast('Erro ao descartar candidato.', 'error');
        }
    };

    const handleSendQuickMessage = async () => {
        if (!matchedCandidate || !quickMessage.trim()) return;

        try {
            // 1. Mark the match as having an icebreaker in DB
            if (matchedCandidate.matchId) {
                const { error: updateError } = await supabase
                    .from('matches')
                    .update({ is_icebreaker: true })
                    .eq('id', matchedCandidate.matchId);

                if (updateError) throw updateError;
            }

            const STORAGE_KEY = `jobmatch_chat_${matchedCandidate.matchId}`;
            const msg = {
                id: Date.now().toString(),
                text: quickMessage,
                sender: 'recruiter', // Recruiter is sending it
                is_icebreaker: true,
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            const existing = localStorage.getItem(STORAGE_KEY);
            const msgs = existing ? JSON.parse(existing).messages : [];
            localStorage.setItem(STORAGE_KEY, JSON.stringify({
                messages: [...msgs, msg],
                isScheduled: false
            }));

            showToast('Mensagem enviada!', 'success');
            closeCelebration();
        } catch (err) {
            console.error('Error in handleSendQuickMessage:', err);
            showToast('Erro ao enviar mensagem.', 'error');
        }
    };

    const closeCelebration = () => {
        setShowMatchCelebration(false);
        setMatchedCandidate(null);
        setQuickMessage('');
        goToNext();
    };

    const goToNext = () => {
        if (currentIndex < candidates.length - 1) {
            setCurrentIndex(prev => prev + 1);
            // RESET SCROLL to top for new candidate
            if (scrollRef.current) {
                scrollRef.current.scrollTop = 0;
            }
        } else {
            setCandidates([]);
        }
    };

    const currentCandidate = candidates[currentIndex];

    return (
        <div className="h-full w-full relative">
            {!selectedJob ? (
                <div
                    className="flex flex-col h-full bg-[#0B0F1A] text-white overflow-hidden relative font-sans"
                >
                    {/* AMBIENT BACKGROUND */}
                    <div className="absolute inset-0 pointer-events-none opacity-20">
                        <div className="absolute top-[10%] right-[-10%] w-[60%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full rotate-45" />
                        <div className="absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
                        <div className="absolute inset-0 opacity-[0.03]" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='%23ffffff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
                            backgroundSize: '30px 52px'
                        }} />
                    </div>

                    <div className="flex flex-col h-full p-6 pt-12 relative z-10">
                        <header className="mb-8 flex items-start justify-between">
                            <div>
                                <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em]">Talent Search</span>
                                <h1 className="text-3xl font-black uppercase tracking-tighter leading-none mt-1">Selecione <span className="text-blue-400 italic">uma Vaga</span></h1>
                                <p className="text-xs text-white/40 mt-2 font-medium">Escolha para qual oportunidade você deseja buscar talentos.</p>
                            </div>
                            <button
                                onClick={() => setShowLegend(true)}
                                className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 active:scale-90 transition-all"
                            >
                                <span className="material-symbols-outlined text-xl">info</span>
                            </button>
                        </header>
                        <div className="flex-1 overflow-y-auto space-y-4 pb-20 scrollbar-hide">
                            {jobs.map(job => (
                                <div
                                    key={job.id}
                                    onClick={() => handleSelectJob(job)}
                                    className={`
                                    p-6 bg-white/5 rounded-[2.5rem] border border-white/10 
                                    flex flex-col gap-4 relative overflow-hidden transition-all duration-300
                                    active:scale-[0.98] group cursor-pointer
                                    ${selectedJob?.id === job.id ? 'ring-2 ring-blue-500/50 bg-blue-500/5' : ''}
                                `}
                                >
                                    <div className="flex items-center justify-between relative z-10">
                                        <h3 className="text-xl font-black text-white uppercase tracking-tight group-hover:text-blue-400 transition-colors">
                                            {job.title}
                                        </h3>
                                    </div>

                                    <div className="flex items-center gap-2 relative z-10">
                                        <div className="px-3 py-1 bg-blue-500/10 rounded-full border border-blue-500/20">
                                            <p className="text-[10px] font-black text-blue-400 uppercase tracking-wider">
                                                {job.location} | {job.type}
                                            </p>
                                        </div>

                                        <div className="flex-1" />

                                        <div className="grid grid-cols-4 gap-2 relative z-10 pt-4 border-t border-white/5 mt-auto">
                                            <div className="flex flex-col items-center p-2 bg-white/[0.02] rounded-2xl border border-white/[0.03]">
                                                <span className="material-symbols-outlined text-blue-400 text-lg mb-1">radar</span>
                                                <p className="text-xs font-black text-white">{job.toDiscover || 0}</p>
                                            </div>
                                            <div className="flex flex-col items-center p-2 bg-white/[0.02] rounded-2xl border border-white/[0.03]">
                                                <span className="material-symbols-outlined text-primary text-lg mb-1">pending_actions</span>
                                                <p className="text-xs font-black text-primary">{job.pending || 0}</p>
                                            </div>
                                            <div className="flex flex-col items-center p-2 bg-white/[0.02] rounded-2xl border border-white/[0.03]">
                                                <span className="material-symbols-outlined text-green-400 text-lg mb-1">verified</span>
                                                <p className="text-xs font-black text-green-400">{job.approved || 0}</p>
                                            </div>
                                            <div className="flex flex-col items-center p-2 bg-white/[0.02] rounded-2xl border border-white/[0.03]">
                                                <span className="material-symbols-outlined text-red-500/50 text-lg mb-1">block</span>
                                                <p className="text-xs font-black text-white/30">{job.rejected || 0}</p>
                                            </div>
                                            <div className="flex flex-col col-span-4 mt-1 px-1">
                                                <div className="flex items-center justify-between mb-1.5">
                                                    <span className="text-[8px] font-black text-white/20 uppercase tracking-[0.2em]">Taxa de Aderência</span>
                                                    <span className="text-[10px] font-black text-blue-400">{Math.round(job.adherence || 0)}%</span>
                                                </div>
                                                <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                                    <div
                                                        className="h-full bg-blue-500 transition-all duration-1000 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                                        style={{ width: `${job.adherence || 0}%` }}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                <div
                    className={`fixed inset-0 z-[100] flex flex-col bg-[#0B0F1A] text-white overflow-hidden font-sans ${!isDragging ? 'transition-transform duration-300' : ''}`}
                    style={{ transform: `translateY(${dragY}px)` }}
                >
                    {/* AMBIENT BACKGROUND */}
                    <div className="absolute inset-0 pointer-events-none opacity-20">
                        <div className="absolute top-[10%] right-[-10%] w-[60%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full rotate-45" />
                        <div className="absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
                        <div className="absolute inset-0 opacity-[0.03]" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='%23ffffff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
                            backgroundSize: '30px 52px'
                        }} />
                    </div>

                    {/* HEADER AREA - Dedicated to gestures */}
                    <header
                        className="relative z-[100] px-6 pt-12 pb-4 flex flex-col items-center shrink-0 touch-none"
                        onTouchStart={handleTouchStart}
                        onMouseDown={handleTouchStart}
                        onTouchMove={handleTouchMove}
                        onMouseMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                        onMouseUp={handleTouchEnd}
                        onMouseLeave={handleTouchEnd}
                    >
                        <div className="w-12 h-1.5 bg-white/20 rounded-full mb-6 pointer-events-none" />

                        <div className="flex items-center justify-between w-full">
                            <button
                                onClick={(e) => { e.stopPropagation(); setSelectedJob(null); }}
                                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 active:bg-white/10 transition-all"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <div className="text-center">
                                <span className="text-[8px] font-black text-blue-400 uppercase tracking-widest">Buscando para</span>
                                <h2 className="text-sm font-black uppercase text-white truncate max-w-[150px]">{selectedJob.title}</h2>
                            </div>

                            <div className="w-10 h-10" />
                        </div>

                        {/* SEGMENTED FILTERS - PHASE 9 */}
                        <div className="flex gap-2 w-full mt-6 bg-white/5 p-1.5 rounded-[2rem] border border-white/10">
                            <button
                                onClick={(e) => { e.stopPropagation(); setActiveTab('interested'); fetchCandidatesForJob(selectedJob); }}
                                className={`flex-1 overflow-hidden flex items-center justify-center gap-2 py-3 rounded-[1.5rem] transition-all relative ${activeTab === 'interested' ? 'bg-primary text-secondary' : 'bg-transparent text-white/40'}`}
                            >
                                <span className="text-[9px] font-black uppercase tracking-widest">Interessados</span>
                                {counts.interested > 0 && (
                                    <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[9px] font-bold ${activeTab === 'interested' ? 'bg-secondary text-primary' : 'bg-primary text-secondary'}`}>
                                        {counts.interested}
                                    </span>
                                )}
                            </button>
                            <button
                                onClick={(e) => { e.stopPropagation(); setActiveTab('pool'); fetchCandidatesForJob(selectedJob); }}
                                className={`flex-1 overflow-hidden flex items-center justify-center gap-2 py-3 rounded-[1.5rem] transition-all ${activeTab === 'pool' ? 'bg-blue-500 text-secondary' : 'bg-transparent text-white/40'}`}
                            >
                                <span className="text-[9px] font-black uppercase tracking-widest">Explorar</span>
                                {counts.pool > 0 && (
                                    <span className={`flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[9px] font-bold ${activeTab === 'pool' ? 'bg-secondary text-blue-500' : 'bg-blue-500 text-secondary'}`}>
                                        {counts.pool}
                                    </span>
                                )}
                            </button>
                        </div>
                    </header>

                    {/* CONTENT AREA - Dedicated to scrolling */}
                    <div className="flex-1 flex flex-col min-h-0 relative z-10 px-6 pb-20">
                        {loading ? (
                            <div className="flex-1 flex flex-col items-center justify-center">
                                <div className="w-12 h-12 border-4 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                <p className="mt-4 text-[10px] font-black uppercase text-blue-400/50 tracking-widest">Escaneando a Colmeia...</p>
                            </div>
                        ) : currentCandidate ? (
                            <>
                                <div className="flex-1 flex flex-col min-h-0 bg-gradient-to-br from-[#121827] to-[#0B0F1A] rounded-[3rem] border border-white/10 shadow-2xl overflow-hidden">
                                    <div
                                        ref={scrollRef}
                                        className="flex-1 overflow-y-auto touch-pan-y custom-scroll"
                                        style={{ WebkitOverflowScrolling: 'touch', overscrollBehavior: 'contain' }}
                                    >
                                        <div className="p-8 space-y-8">
                                            {/* Anonymous Avatar Section */}
                                            <div className="flex flex-col items-center">
                                                <div
                                                    className="w-32 h-32 rounded-full bg-gradient-to-br from-blue-400 via-cyan-400 to-blue-400 flex items-center justify-center shadow-2xl relative overflow-hidden mb-4"
                                                    style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                                                >
                                                    <div className="absolute inset-0 bg-black/5 backdrop-blur-sm" />
                                                    <span className="font-black text-blue-900 relative z-10 tracking-tighter text-4xl">
                                                        {currentCandidate.full_name?.split(' ').filter((p: string) => p.length > 0).map((p: string) => p[0]).slice(0, 2).join('').toUpperCase() || 'JB'}
                                                    </span>
                                                </div>

                                                {/* Match Score Badge */}
                                                <div className="px-4 py-2 rounded-full bg-blue-500 text-secondary text-sm font-black shadow-lg shadow-blue-500/30 mb-2">
                                                    {currentCandidate.matchScore}% Match
                                                </div>

                                                {/* Privacy Notice */}
                                                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-full border border-white/10">
                                                    <span className="material-symbols-outlined text-white/40 text-[10px]">lock</span>
                                                    <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Foto revelada após match</span>
                                                </div>
                                            </div>

                                            {/* Candidate Information Area */}
                                            <div className="space-y-6">
                                                {/* Name and Role */}
                                                <div className="text-center pb-4 border-b border-white/10">
                                                    <h3 className="text-3xl font-black uppercase tracking-tighter text-white mb-2">{currentCandidate.full_name}</h3>
                                                    <p className="text-sm font-black text-blue-400 uppercase tracking-widest">{currentCandidate.target_role || 'Profissional'}</p>
                                                </div>

                                                {/* Location */}
                                                <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
                                                            <span className="material-symbols-outlined text-blue-400 text-xl">location_on</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Localização</p>
                                                            <p className="text-sm font-bold text-white">{currentCandidate.location || 'Não informado'}</p>
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Experience */}
                                                {currentCandidate.metadata?.experience_years && (
                                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
                                                                <span className="material-symbols-outlined text-orange-400 text-xl">work_history</span>
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Experiência</p>
                                                                <p className="text-sm font-bold text-white">{currentCandidate.metadata.experience_years}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Skills */}
                                                {currentCandidate.skills && currentCandidate.skills.length > 0 && (
                                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center shrink-0">
                                                                <span className="material-symbols-outlined text-green-400 text-xl">psychology</span>
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-3">Habilidades</p>
                                                                <div className="flex flex-wrap gap-2">
                                                                    {currentCandidate.skills.slice(0, 6).map((skill: string, idx: number) => (
                                                                        <span key={idx} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[10px] font-bold text-white/70 uppercase">
                                                                            {skill}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Bio */}
                                                {currentCandidate.metadata?.bio && (
                                                    <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
                                                        <div className="flex items-start gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center shrink-0">
                                                                <span className="material-symbols-outlined text-purple-400 text-xl">description</span>
                                                            </div>
                                                            <div className="flex-1">
                                                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-2">Sobre</p>
                                                                <p className="text-xs text-white/60 italic font-medium leading-relaxed">
                                                                    "{currentCandidate.metadata.bio}"
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Tier Badge */}
                                                <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl p-4 border border-blue-500/20">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-3">
                                                            <span className="material-symbols-outlined text-blue-400 text-2xl">verified</span>
                                                            <div>
                                                                <p className="text-[9px] font-black text-white/30 uppercase tracking-widest">Plano Ativo</p>
                                                                <p className="text-sm font-black text-blue-400 uppercase">{currentCandidate.subscription_tier || 'Néctar'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* ACTION BUTTONS - FIXED AT THE BOTTOM OF WRAPPER */}
                                <div className="flex justify-center gap-12 pt-6 shrink-0">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleAction('pass'); }}
                                        className="w-20 h-20 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 active:scale-90 transition-all shadow-xl"
                                    >
                                        <span className="material-symbols-outlined text-4xl">close</span>
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleAction('like'); }}
                                        className="w-20 h-20 rounded-full bg-blue-500 border-4 border-blue-400/30 flex items-center justify-center text-secondary active:scale-90 transition-all shadow-2xl"
                                    >
                                        <span className="material-symbols-outlined text-4xl font-black">favorite</span>
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-30 p-12">
                                <JobeeSymbol size={64} mode="dark" />
                                <h3 className="text-xl font-black uppercase tracking-tighter mt-6">Radar Limpo</h3>
                                <p className="text-[10px] font-black uppercase tracking-widest mt-2">Você analisou todos os talentos compatíveis.</p>
                                <button onClick={() => setSelectedJob(null)} className="mt-8 px-8 py-3 bg-white/5 rounded-2xl text-[9px] font-black uppercase border border-white/10">Trocar Vaga</button>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {showRejectionModal && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-[#0B0F1A]/95 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#121827] border border-white/10 rounded-[3rem] w-full max-w-sm p-8 space-y-6 shadow-2xl">
                        <div className="text-center">
                            <span className="material-symbols-outlined text-red-500 text-4xl mb-4">feedback</span>
                            <h3 className="text-xl font-black uppercase text-white">Feedback Negativo</h3>
                            <p className="text-xs text-white/40 mt-2">Dê um feedback construtivo para {rejectionTarget?.full_name}.</p>
                        </div>
                        <div className="space-y-3">
                            {["Perfil não condiz", "Falta experiência", "Sênioridade baixa", "Localização fora", "Pretensão alta"].map((msg, i) => (
                                <button key={i} onClick={() => confirmRejection(msg)} className="w-full p-4 rounded-2xl bg-white/5 border border-white/5 text-left text-[11px] font-bold text-white/70 hover:bg-white/10 uppercase">
                                    {msg}
                                </button>
                            ))}
                        </div>
                        <button onClick={() => setShowRejectionModal(false)} className="w-full py-2 text-[9px] font-black uppercase text-white/20">Cancelar</button>
                    </div>
                </div>
            )}

            {showMatchCelebration && matchedCandidate && (
                <div className="fixed inset-0 z-[300] bg-[#0B0F1A]/98 backdrop-blur-2xl flex flex-col items-center justify-center p-8 animate-in zoom-in duration-300">
                    <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute inset-0" style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='%23FACC15' stroke-width='2' fill='none'/%3E%3C/svg%3E")`,
                            backgroundSize: '80px 138px'
                        }} />
                    </div>

                    <div className="relative z-10 w-full max-w-sm flex flex-col items-center text-center">
                        <div className="w-24 h-24 mb-6 relative">
                            <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20" />
                            <div
                                className="w-full h-full bg-gradient-to-br from-primary to-yellow-600 flex items-center justify-center shadow-2xl relative z-10"
                                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
                            >
                                <span className="material-symbols-outlined text-secondary text-5xl font-black">bolt</span>
                            </div>
                        </div>

                        <h2 className="text-4xl font-black uppercase tracking-tighter text-white mb-2 italic">Deu <span className="text-primary">Match!</span></h2>
                        <p className="text-sm font-bold text-white/60 uppercase tracking-widest mb-10">Você e {matchedCandidate.full_name} se conectaram.</p>

                        <div className="w-full space-y-4 mb-8">
                            <div className="relative">
                                <textarea
                                    value={quickMessage}
                                    onChange={(e) => setQuickMessage(e.target.value)}
                                    placeholder={`Mande um alô para ${matchedCandidate.full_name}...`}
                                    className="w-full bg-white/5 border border-white/10 rounded-3xl p-6 text-white text-sm focus:outline-none focus:border-primary/50 transition-colors placeholder:text-white/20 resize-none h-32"
                                />
                                <div className="absolute bottom-4 right-4 text-[10px] font-black text-white/20 uppercase">Envio Instantâneo</div>
                            </div>

                            <button
                                onClick={handleSendQuickMessage}
                                disabled={!quickMessage.trim()}
                                className="w-full h-16 bg-primary text-secondary rounded-[2rem] font-black uppercase tracking-widest flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100 shadow-xl shadow-primary/20"
                            >
                                <span className="material-symbols-outlined font-black">send</span>
                                Quebrar o Gelo
                            </button>
                        </div>

                        <button
                            onClick={closeCelebration}
                            className="text-xs font-black uppercase text-white/40 hover:text-white transition-colors tracking-widest"
                        >
                            Continuar Analisando
                        </button>
                    </div>
                </div>
            )}

            {showLegend && (
                <div
                    className="fixed inset-0 z-[600] bg-[#0B0F1A]/95 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in zoom-in duration-300"
                    onClick={() => setShowLegend(false)}
                >
                    <div
                        className="bg-[#121827] border border-white/10 rounded-[3rem] w-full max-sm p-8 space-y-6"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="text-center mb-4">
                            <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
                                <span className="material-symbols-outlined text-blue-400 text-3xl">info</span>
                            </div>
                            <h3 className="text-xl font-black uppercase text-white">Legenda do Radar</h3>
                            <p className="text-[10px] font-bold text-white/30 uppercase tracking-[0.2em] mt-1">Entenda suas métricas</p>
                        </div>

                        <div className="space-y-4">
                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="material-symbols-outlined text-blue-400">radar</span>
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-wider">No Radar</p>
                                    <p className="text-[9px] text-white/40 leading-tight">Talentos na plataforma que ainda não viram ou não foram vistos para esta vaga.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="material-symbols-outlined text-primary">pending_actions</span>
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-wider">Aguardando</p>
                                    <p className="text-[9px] text-white/40 leading-tight">Candidatos que já deram LIKE na sua vaga e esperam sua análise no Radar.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="material-symbols-outlined text-green-400">verified</span>
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-wider">Aprovados</p>
                                    <p className="text-[9px] text-white/40 leading-tight">Matches confirmados! Ambos deram LIKE e estão prontos para conversar.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                                <span className="material-symbols-outlined text-red-500/50">block</span>
                                <div>
                                    <p className="text-[10px] font-black text-white uppercase tracking-wider">Reprovados</p>
                                    <p className="text-[9px] text-white/40 leading-tight">Perfis que você analisou e decidiu não dar continuidade no momento.</p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => setShowLegend(false)}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-white transition-all border border-white/10"
                        >
                            Entendi, Valeu!
                        </button>
                    </div>
                </div>
            )}

            <style>{`
                .custom-scroll::-webkit-scrollbar { width: 4px; }
                .custom-scroll::-webkit-scrollbar-track { background: transparent; }
                .custom-scroll::-webkit-scrollbar-thumb { background: rgba(255, 255, 255, 0.1); border-radius: 10px; }
                .touch-pan-y { touch-action: pan-y !important; }
            `}</style>
        </div>
    );
};

export default RecruiterMatchPage;
