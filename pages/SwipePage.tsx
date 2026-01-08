import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { JobeeSymbol } from '../components/JobeeIdentity';
import { Job } from '../types';
import { calculateJobMatch } from '../services/matchingService';
import AdPlaceholder from '../components/AdPlaceholder';

const SwipePage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showDetails, setShowDetails] = useState(false);
  const [userTier, setUserTier] = useState<string>('nectar');

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Fetch Candidate Profile for matching
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setUserTier(profile.subscription_tier || 'nectar');
      }

      // 2. Fetch Jobs
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (data && !error) {
        // Map DB fields to Job interface and Calculate Real Match Score
        const mappedJobs: Job[] = data.map((j: any) => {
          const matchResult = calculateJobMatch(j as any, profile);

          return {
            ...j,
            id: j.id,
            title: j.title,
            company: j.company_name,
            companyLogo: j.company_logo_url || 'https://api.dicebear.com/7.x/initials/svg?seed=' + j.company_name,
            location: j.location,
            salary: j.salary || 'A combinar',
            matchScore: matchResult.score,
            matchReasons: matchResult.matchReasons,
            distance: matchResult.distance,
            description: j.description,
            type: j.type || 'Híbrido',
            category: j.category || 'Geral',
            xpBonus: 50,
            bookmarked: false,
            // ... rest of fields inherited from ...j
          } as any;
        });

        // 3. Filter by Radius (Real Calculation)
        const radiusLimit = profile?.search_radius || 50;
        const filteredJobs = mappedJobs.filter(j => {
          if (j.distance !== undefined) {
            return j.distance <= radiusLimit;
          }
          return true; // Keep jobs without coords for now or until data is migrated
        });

        // 4. Sort by Match Score + Sponsorship
        filteredJobs.sort((a, b) => {
          // Sponsored jobs with higher priority come first
          if (a.is_sponsored && !b.is_sponsored) return -1;
          if (!a.is_sponsored && b.is_sponsored) return 1;

          // If both are sponsored or none are, sort by match score
          return b.matchScore - a.matchScore;
        });

        setJobs(filteredJobs);
      }
    } catch (err) {
      console.error('Error in fetchJobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const current = jobs[currentIndex];

  const handleNext = () => {
    if (currentIndex < jobs.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setShowDetails(false);
    } else {
      // Refresh or show empty state
      setJobs([]);
    }
  };

  const handleLike = async () => {
    if (!current) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // In a real flow, this would check if recruiter also liked.
      // For now, we "create" the match to show the interview flow.
      const { error } = await supabase.from('matches').insert({
        job_id: current.id,
        candidate_id: user.id,
        recruiter_id: (current as any).recruiter_id || null,
        status: 'pending',
        interview_model: current.interviewModel,
        scheduling_mode: current.schedulingMode,
        interview_detail: current.interviewDetail,
        availability_slots: current.availabilitySlots
      });

      if (error) throw error;

      alert('MATCH! 🐝 Você e a empresa demonstraram interesse mútuo!');
      handleNext();
    } catch (err) {
      console.error('Match error:', err);
      handleNext();
    }
  };

  const handleSkip = () => {
    handleNext();
  };

  const handleBookmark = async () => {
    if (!current) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('Faça login para salvar vagas!');
        return;
      }

      const { error } = await supabase
        .from('bookmarks')
        .upsert({
          user_id: user.id,
          job_id: current.id
        }, { onConflict: 'user_id,job_id' });

      if (error) throw error;

      alert('Vaga salva com sucesso! 🐝🔖');
      // Optional: Move to next job or stay
      // handleNext(); 
    } catch (err: any) {
      console.error('Bookmark error:', err);
      alert('Erro ao salvar vaga.');
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-secondary">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[10px] font-black uppercase text-primary tracking-widest animate-pulse">Sintonizando o radar...</p>
      </div>
    );
  }

  if (jobs.length === 0 || !current) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-secondary text-center px-10">
        <div className="mb-6 opacity-20">
          <JobeeSymbol size={100} mode="dark" />
        </div>
        <h2 className="text-xl font-black uppercase text-white/40">Fim do Enxame</h2>
        <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.2em] mt-2">
          Não há mais vagas no seu radar no momento. Volte mais tarde para novas colmeias!
        </p>
        <button onClick={fetchJobs} className="mt-8 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-white hover:bg-white/10 transition-all">
          Recarregar Radar
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-secondary text-white relative overflow-hidden font-sans">
      {/* Background Texture & Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between px-6 py-10 z-20">
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Radar de Colmeias</span>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Encontre seu <span className="text-primary text-3xl italic">Lugar</span></h1>
        </div>
        <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md transition-transform active:scale-90">
          <span className="material-symbols-outlined">tune</span>
        </button>
      </header>

      {/* External Ads (Google AdMob simulation) */}
      {!showDetails && <AdPlaceholder userTier={userTier} />}

      {/* Card Stack */}
      <div className="flex-1 relative px-6 flex flex-col justify-start pt-4">
        {/* Shadow Cards (Stacked look) */}
        {!showDetails && (
          <>
            <div className="absolute inset-x-10 bottom-32 top-10 bg-white/5 rounded-[3rem] border border-white/5 opacity-40 scale-95 transition-all"></div>
            <div className="absolute inset-x-8 bottom-28 top-6 bg-white/5 rounded-[3rem] border border-white/5 opacity-70 scale-[0.98] transition-all"></div>
          </>
        )}

        {/* Main Card */}
        <div
          key={current.id}
          onClick={() => !showDetails && setShowDetails(true)}
          className={`relative ${showDetails ? 'h-full mb-32' : 'flex-1 max-h-[520px] mb-20'} w-full bg-white/10 rounded-[3rem] border-2 ${current.is_sponsored ? 'border-primary/50 shadow-[0_0_30px_rgba(255,189,17,0.2)]' : 'border-white/20'} backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col z-10 transition-all duration-500 group/card`}
        >
          {/* Company Visual / Hero */}
          <div className={`relative ${showDetails ? 'h-[20%]' : 'h-[30%]'} w-full overflow-hidden transition-all duration-500`}>
            {/* SPONSORED TAG */}
            {current.is_sponsored && !showDetails && (
              <div className="absolute top-4 left-6 z-30 flex items-center gap-1.5 bg-primary px-3 py-1 rounded-full shadow-lg animate-pulse">
                <span className="material-symbols-outlined text-[10px] font-black text-secondary">verified</span>
                <span className="text-[8px] font-black uppercase text-secondary tracking-widest">Impulsionado</span>
              </div>
            )}

            <img src={current.companyLogo} className="w-full h-full object-cover scale-150 blur-xl opacity-30" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#1e293b] via-transparent to-transparent"></div>

            <div className={`absolute inset-0 flex items-center justify-center gap-3 px-6 ${showDetails ? 'justify-start' : 'flex-col pt-4'}`}>
              <div className={`${showDetails ? 'w-12 h-12' : 'w-16 h-16'} transition-all duration-500 rounded-2xl bg-white/10 p-0.5 backdrop-blur-md border border-white/20 shadow-2xl shrink-0`}>
                <img src={current.companyLogo} className="w-full h-full rounded-xl object-cover" alt={current.company} />
              </div>
              <div className={`${showDetails ? 'text-left' : 'text-center'}`}>
                <h2 className="text-lg font-black uppercase tracking-tighter text-white line-clamp-1">{current.company}</h2>
                <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">{current.location}</p>

                {/* Match Reasons - Small badges in hero for space optimization */}
                {!showDetails && (current as any).matchReasons && (current as any).matchReasons.length > 0 && (
                  <div className="flex flex-wrap justify-center gap-1.5 mt-2">
                    {(current as any).matchReasons.map((reason: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-1 bg-primary/20 px-2 py-0.5 rounded-lg border border-primary/30">
                        <span className="material-symbols-outlined text-[10px] text-primary">verified</span>
                        <span className="text-[7px] font-black uppercase text-primary tracking-tighter leading-none">{reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className={`absolute top-4 right-4 ${current.is_sponsored ? 'bg-primary text-secondary' : 'bg-primary/20 text-primary'} border border-primary/30 text-[10px] font-black px-3 py-1.5 rounded-full shadow-lg flex items-center gap-1 backdrop-blur-xl transition-colors`}>
              <span className="material-symbols-outlined text-[12px]">bolt</span>
              {current.matchScore}%
            </div>
          </div>

          <div className="p-6 pb-12 flex flex-col gap-4 flex-1 bg-gradient-to-b from-transparent to-black/20 overflow-y-auto custom-scrollbar">
            <div className={`space-y-1 ${showDetails ? 'text-left' : 'text-center'}`}>
              <h3 className={`${showDetails ? 'text-xl' : 'text-xl'} font-black uppercase tracking-tighter text-white leading-tight`}>{current.title}</h3>
              <p className="text-[12px] font-bold text-white/40 uppercase tracking-widest">{current.salary}</p>
            </div>

            {!showDetails ? (
              <>
                <div className="flex flex-wrap justify-center gap-2">
                  <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-white/60">
                    {current.type}
                  </span>
                  <span className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-full text-[9px] font-black uppercase tracking-widest text-white/60">
                    {current.category}
                  </span>
                </div>

                <p className="text-xs text-white/60 line-clamp-3 text-center leading-relaxed">
                  {current.description}
                </p>
                <div className="mt-auto text-center pt-4">
                  <p className="text-[9px] font-black uppercase text-primary tracking-widest animate-bounce">Toque para ver detalhes</p>
                </div>
              </>
            ) : (
              <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500 pb-20">
                <div className="space-y-2">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">description</span> Descrição
                  </h4>
                  <p className="text-xs text-white/70 leading-relaxed font-medium">
                    {current.description}
                  </p>
                </div>

                {/* Match Reasons integrated in details too */}
                {(current as any).matchReasons && (current as any).matchReasons.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm">auto_awesome</span> Por que o Match?
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {(current as any).matchReasons.map((reason: string, idx: number) => (
                        <div key={idx} className="flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-xl border border-primary/20">
                          <span className="material-symbols-outlined text-sm text-primary">verified</span>
                          <span className="text-[9px] font-black uppercase text-primary tracking-widest">{reason}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">psychology</span> Habilidades & Experiência
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {current.experienceYears && (
                      <span className="px-3 py-1 bg-primary/10 border border-primary/20 rounded-lg text-[10px] font-bold text-primary">
                        {current.experienceYears}
                      </span>
                    )}
                    {current.requiredSkills?.map(skill => (
                      <span key={skill} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-[10px] font-bold text-white/60">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-green-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">card_giftcard</span> Benefícios
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {current.benefits?.map(benefit => (
                      <div key={benefit} className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                        <span className="material-symbols-outlined text-green-400 text-xs text-[12px]">check_circle</span>
                        <span className="text-[9px] font-black uppercase text-white/60">{benefit}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm">schedule</span> Carga Horária & Dias
                  </h4>
                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-3">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[9px] font-bold text-white/40 uppercase">Horário</span>
                      <span className="font-black text-white/80">{current.workSchedule || 'Padrão'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[9px] font-bold text-white/40 uppercase">Dias</span>
                      <span className="font-black text-white/80">{current.workDays || 'Segunda a Sexta'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[9px] font-bold text-white/40 uppercase">Almoço</span>
                      <span className="font-black text-white/80">{current.lunchTime?.replace(':', 'h') || '1h'}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-[9px] font-bold text-white/40 uppercase">Semanal</span>
                      <span className="font-black text-white/80">{current.weeklyHours || '40h'}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={(e) => { e.stopPropagation(); setShowDetails(false); }}
                  className="w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase text-white hover:bg-white/10 transition-all mb-10"
                >
                  Voltar para Resumo
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={`fixed bottom-28 left-0 right-0 px-8 flex items-center justify-center gap-6 z-30`}>
        <button
          onClick={handleSkip}
          className="w-16 h-16 flex items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-white/20 transition-all active:scale-90 hover:text-white"
        >
          <span className="material-symbols-outlined text-4xl">close</span>
        </button>
        <button
          onClick={handleLike}
          className="w-20 h-20 flex items-center justify-center rounded-[2.5rem] bg-primary text-secondary shadow-2xl shadow-primary/40 transition-all active:scale-95 group"
        >
          <span className="material-symbols-outlined text-5xl font-black group-hover:scale-110 transition-transform">favorite</span>
        </button>
        <button
          onClick={handleBookmark}
          className="w-16 h-16 flex items-center justify-center rounded-3xl bg-white/5 border border-white/10 text-white/20 transition-all active:scale-90 hover:text-primary active:bg-primary/10"
        >
          <span className="material-symbols-outlined text-3xl">bookmark</span>
        </button>
      </div>
    </div>
  );
};

export default SwipePage;
