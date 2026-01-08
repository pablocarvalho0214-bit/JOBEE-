import React, { useState, useEffect } from 'react';
import { Job } from '../types';
import { generateCoverLetter } from '../services/geminiService';
import { supabase } from '../services/supabaseClient';
import { JobeeSymbol } from '../components/JobeeIdentity';
import { calculateJobMatch } from '../services/matchingService';

const JobsPage: React.FC = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [generatingFor, setGeneratingFor] = useState<string | null>(null);
  const [aiCoverLetter, setAiCoverLetter] = useState<string | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch Profile for matching
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      setUserProfile(profile);

      // Fetch Jobs
      const { data: jobsData, error } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // 3. Fetch Bookmarks
      const { data: bookmarksData } = await supabase
        .from('bookmarks')
        .select('job_id')
        .eq('user_id', user.id);

      const bookmarkIds = new Set((bookmarksData || []).map(b => b.job_id));

      // Use Smart Matching Service
      const mappedJobs: Job[] = (jobsData || []).map(j => {
        const matchResult = calculateJobMatch(j as any, profile);

        return {
          id: j.id,
          title: j.title || 'Vaga Sem Título',
          company: j.company_name || 'Empresa',
          companyLogo: j.company_logo_url || 'https://api.dicebear.com/7.x/initials/svg?seed=' + j.company_name,
          location: j.location || 'Brasil',
          salary: j.salary || 'A combinar',
          description: j.description || '',
          type: j.type || 'Presencial',
          category: j.category || 'Geral',
          matchScore: matchResult.score,
          matchReasons: matchResult.matchReasons,
          distance: matchResult.distance,
          xpBonus: Math.floor(Math.random() * 300) + 100, // Gamification
          bookmarked: bookmarkIds.has(j.id),
          required_skills: j.required_skills,
          latitude: j.latitude,
          longitude: j.longitude
        } as any;
      });

      // Sort by Match Score Descending
      mappedJobs.sort((a, b) => b.matchScore - a.matchScore);

      setJobs(mappedJobs);
    } catch (err) {
      console.error('Error fetching jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      job.company.toLowerCase().includes(searchTerm.toLowerCase());

    // Filtering logic
    let matchesCategory = false;
    if (selectedCategory === 'Todas') {
      matchesCategory = true;
    } else if (selectedCategory === 'Salvas') {
      matchesCategory = job.bookmarked;
    } else {
      matchesCategory = job.type === selectedCategory || job.category === selectedCategory;
    }

    // Distance Check (Real coordinates vs searchRadius)
    const radiusLimit = userProfile?.search_radius || 50;
    const distance = (job as any).distance;

    // If we have real coordinates, use them. Otherwise, default to true or a small simulation for mock data
    const radiusMatch = selectedCategory === 'Salvas' ||
      (distance !== undefined ? distance <= radiusLimit : true);

    return matchesSearch && matchesCategory && radiusMatch;
  });

  const categories = ['Todas', 'Salvas', 'Remoto', 'Presencial', 'Engenharia', 'Design'];

  const handleToggleBookmark = async (job: Job) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const isBookmarked = job.bookmarked;

      if (isBookmarked) {
        await supabase
          .from('bookmarks')
          .delete()
          .eq('user_id', user.id)
          .eq('job_id', job.id);
      } else {
        await supabase
          .from('bookmarks')
          .insert({ user_id: user.id, job_id: job.id });
      }

      // Update local state
      setJobs(prev => prev.map(j =>
        j.id === job.id ? { ...j, bookmarked: !isBookmarked } : j
      ));
    } catch (err) {
      console.error('Error toggling bookmark:', err);
    }
  };

  const handleApply = async (job: Job) => {
    setGeneratingFor(job.id);
    const letter = await generateCoverLetter(job.title, job.company, job.description);
    setAiCoverLetter(letter);
    setGeneratingFor(null);
  };

  return (
    <div className="flex flex-col min-h-full bg-secondary text-white relative overflow-hidden font-sans">
      {/* Background Texture & Glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full"></div>
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>

      <div className="relative z-10 p-6 pt-10 flex-1 overflow-y-auto scrollbar-hide pb-20">
        {/* Header */}
        <header className="flex justify-between items-center mb-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Nível Bee</span>
            <h1 className="text-2xl font-black uppercase tracking-tighter">Oportunidades <span className="text-primary text-3xl">Jo<span className="text-white">bee</span></span></h1>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center relative">
            <span className="material-symbols-outlined text-white">notifications</span>
            <span className="absolute top-3 right-3 w-2 h-2 bg-primary rounded-full border-2 border-secondary animate-pulse"></span>
          </div>
        </header>

        {/* Search & Filters */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md p-3 px-5 gap-3 focus-within:ring-2 focus-within:ring-primary/20 transition-all">
            <span className="material-symbols-outlined text-white/30 text-[20px]">search</span>
            <input
              type="text"
              placeholder="Encontrar sua colmeia..."
              className="flex-1 bg-transparent border-none focus:ring-0 text-sm text-white placeholder-white/20 font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex overflow-x-auto gap-2 scrollbar-hide -mx-6 px-6">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${selectedCategory === cat
                  ? 'bg-primary text-secondary shadow-lg shadow-primary/20'
                  : 'bg-white/5 text-white/40 border border-white/5 hover:bg-white/10'
                  }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Jobs List */}
        <div className="space-y-5">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4 opacity-30">
              <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Buscando Vagas...</span>
            </div>
          ) : filteredJobs.length === 0 ? (
            <div className="text-center py-20 opacity-20 flex flex-col items-center">
              <JobeeSymbol size={64} mode="dark" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-6">Nenhuma vaga no seu raio de alcance</p>
            </div>
          ) : (
            filteredJobs.map((job) => (
              <div key={job.id} className="bg-white/5 rounded-[2.5rem] p-8 backdrop-blur-3xl border border-white/10 flex flex-col gap-6 hover:bg-white/10 transition-all group relative overflow-hidden">
                {/* Glow effect on hover */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-3xl pointer-events-none group-hover:bg-primary/10 transition-colors"></div>

                <div className="flex justify-between items-start">
                  <div className="flex gap-5">
                    <div className="relative">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-white/5 p-0.5 border border-white/10 shadow-2xl relative">
                        <img src={job.companyLogo} className="w-full h-full rounded-[1.4rem] object-cover grayscale group-hover:grayscale-0 transition-all" alt={job.company} />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-primary rounded-full flex items-center justify-center border-[3px] border-secondary shadow-lg">
                        <span className="material-symbols-outlined text-[14px] text-secondary font-black">bolt</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-black text-white text-xl leading-tight uppercase tracking-tighter group-hover:text-primary transition-colors">{job.title}</h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{job.company}</p>
                        <span className="w-1 h-1 bg-white/20 rounded-full"></span>
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] font-black text-primary uppercase tracking-tighter">{job.matchScore}% Matching</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggleBookmark(job)}
                    className={`w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 transition-all hover:scale-110 active:scale-95 ${job.bookmarked ? 'text-primary' : 'text-white/20'}`}
                  >
                    <span className={`material-symbols-outlined text-[20px] ${job.bookmarked ? 'filled' : ''}`}>bookmark</span>
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-tight text-white/50">
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
                    <span className="material-symbols-outlined text-[16px] text-primary">location_on</span>
                    {job.location}
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
                    <span className="material-symbols-outlined text-[16px] text-green-400">payments</span>
                    {job.salary}
                  </div>
                </div>

                {(job as any).matchReasons && (job as any).matchReasons.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(job as any).matchReasons.map((reason: string, idx: number) => (
                      <div key={idx} className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 text-primary rounded-xl border border-primary/20 w-fit">
                        <span className="material-symbols-outlined text-[12px] filled">auto_awesome</span>
                        <span className="text-[9px] font-black tracking-widest uppercase">{reason}</span>
                      </div>
                    ))}
                  </div>
                )}

                {job.xpBonus && (
                  <div className="flex items-center gap-2 px-5 py-2.5 bg-secondary text-white/40 rounded-2xl border border-white/5 w-fit">
                    <span className="material-symbols-outlined text-[16px]">stars</span>
                    <span className="text-[11px] font-black tracking-widest">+{job.xpBonus} XP</span>
                  </div>
                )}

                <p className="text-sm text-white/40 font-medium leading-relaxed italic line-clamp-2 mt-2">
                  "{job.description}"
                </p>

                <button
                  onClick={() => handleApply(job)}
                  disabled={generatingFor === job.id}
                  className="w-full h-16 bg-white text-secondary hover:bg-primary hover:text-secondary text-[11px] font-black rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-[0.98] shadow-2xl uppercase tracking-[0.2em] group/btn"
                >
                  {generatingFor === job.id ? (
                    <div className="flex items-center gap-3">
                      <span className="animate-spin h-5 w-5 border-2 border-secondary border-t-transparent rounded-full" />
                      <span>Polinizando...</span>
                    </div>
                  ) : (
                    <>
                      <span className="material-symbols-outlined font-black group-hover/btn:translate-x-1 transition-transform">send</span>
                      Polinizar com IA
                    </>
                  )}
                </button>
              </div>
            ))
          )}
        </div>
      </div>

      {/* AI Cover Letter Modal */}
      {aiCoverLetter && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-secondary border border-white/10 rounded-[3rem] p-8 w-full max-w-sm shadow-[0_0_50px_rgba(0,0,0,0.5)] animate-in zoom-in-95 duration-200 flex flex-col gap-6 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-orange-500 to-primary"></div>

            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary mb-4 shadow-lg shadow-primary/10">
                <span className="material-symbols-outlined text-4xl filled">auto_awesome</span>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tighter text-white">Cover Letter <span className="text-primary">IA</span></h3>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Sua apresentação foi otimizada para esta colmeia.</p>
            </div>

            <div className="bg-white/5 rounded-3xl p-5 border border-white/10 max-h-60 overflow-y-auto scrollbar-hide">
              <p className="text-sm text-white/70 leading-relaxed font-medium">
                {aiCoverLetter}
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => setAiCoverLetter(null)}
                className="w-full h-14 bg-primary text-secondary rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-primary/10 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Candidatar-se agora
              </button>
              <button
                onClick={() => setAiCoverLetter(null)}
                className="w-full py-2 text-white/30 text-[10px] font-black uppercase tracking-widest hover:text-white transition-colors"
              >
                Recartar rascunho
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden Scrollbar helper */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default JobsPage;
