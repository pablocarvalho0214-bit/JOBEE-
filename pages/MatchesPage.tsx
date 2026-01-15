import React, { useState, useEffect } from 'react';
import { Match } from '../types';
import { supabase } from '../services/supabaseClient';
import { JobeeSymbol } from '../components/JobeeIdentity';

interface MatchesPageProps {
  onOpenChat: (match: Match) => void;
  role?: 'candidate' | 'recruiter';
}

type SortOption = 'recent' | 'scheduled' | 'company' | 'job';

const MatchesPage: React.FC<MatchesPageProps> = ({ onOpenChat, role = 'candidate' }) => {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState<SortOption>('recent');
  const [showMenu, setShowMenu] = useState(false);
  const [selectedMatchForSlot, setSelectedMatchForSlot] = useState<Match | null>(null);

  const isRecruiter = role === 'recruiter';
  const roleColor = isRecruiter ? 'text-blue-400' : 'text-primary';
  const roleBg = isRecruiter ? 'bg-blue-500/10' : 'bg-primary/10';
  const roleBorder = isRecruiter ? 'border-blue-400' : 'border-primary';

  useEffect(() => {
    fetchMatches();
  }, [role]);

  const fetchMatches = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const column = isRecruiter ? 'recruiter_id' : 'candidate_id';

      const { data, error } = await supabase
        .from('matches')
        .select(`
          *,
          jobs (*),
          candidate:profiles!candidate_id (*),
          recruiter:profiles!recruiter_id (*)
        `)
        .eq(column, user.id)
        .order('created_at', { ascending: false });

      if (data && !error) {
        const mapped: Match[] = data.map((m: any) => ({
          id: m.id,
          candidateName: m.candidate?.full_name || 'Candidato',
          candidateRole: m.candidate?.role || 'Bee',
          candidateAvatar: m.candidate?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + m.id,
          jobTitle: m.jobs?.title || 'Vaga',
          companyName: m.jobs?.company_name || 'Empresa',
          companyLogo: m.jobs?.company_logo_url || 'https://api.dicebear.com/7.x/initials/svg?seed=' + (m.jobs?.company_name || 'C'),
          matchDate: new Date(m.created_at).toLocaleDateString(),
          status: m.scheduled_at ? 'scheduled' : 'pending',
          scheduledAt: m.scheduled_at,
          interviewModel: m.interview_model,
          schedulingMode: m.scheduling_mode,
          interviewDetail: m.interview_detail,
          availabilitySlots: m.availability_slots || [],
          timestamp: 'Agora',
          industry: m.jobs?.category || 'TI',
          isVerified: true,
          jobStatus: m.jobs?.status || 'active'
        }));
        setMatches(mapped);
      }
    } catch (err) {
      console.error('Error fetching matches:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleSlot = async (matchId: string, slot: string) => {
    try {
      const displaySlot = `${slot} (${selectedMatchForSlot?.interviewModel === 'online' ? 'Online' : 'Presencial'})`;

      const { error } = await supabase
        .from('matches')
        .update({ scheduled_at: displaySlot })
        .eq('id', matchId);

      if (error) throw error;

      setMatches(prev => prev.map(m =>
        m.id === matchId ? { ...m, scheduledAt: displaySlot, status: 'scheduled' } : m
      ));
      setSelectedMatchForSlot(null);
      alert(`Entrevista agendada para ${slot}! 🐝`);
    } catch (err) {
      console.error('Error scheduling:', err);
      alert('Erro ao agendar horário.');
    }
  };

  const sortedMatches = [...matches].sort((a, b) => {
    if (sortOption === 'scheduled') {
      if (a.scheduledAt && !b.scheduledAt) return -1;
      if (!a.scheduledAt && b.scheduledAt) return 1;
      return 0;
    }
    if (sortOption === 'company') {
      return a.companyName.localeCompare(b.companyName);
    }
    if (sortOption === 'job') {
      return a.jobTitle.localeCompare(b.jobTitle);
    }
    return 0;
  });

  const sortLabels: Record<SortOption, string> = {
    recent: 'Mais recentes',
    scheduled: 'Agendados primeiro',
    company: 'Empresa (A-Z)',
    job: 'Vaga (A-Z)'
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-full bg-secondary">
        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-[9px] font-black uppercase text-primary/40 tracking-widest">Carregando conexões...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-full bg-[#0B0F1A] text-white relative overflow-hidden font-sans">
      {/* AMBIENT BACKGROUND */}
      <div className="absolute inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[10%] right-[-10%] w-[60%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full rotate-45" />
        <div className="absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='%23ffffff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
          backgroundSize: '30px 52px'
        }} />
      </div>

      <header className="relative z-10 px-6 pb-10 flex items-center justify-between" style={{ paddingTop: 'calc(2.5rem + env(safe-area-inset-top))' }}>
        <div className="flex flex-col">
          <span className={`text-[10px] font-black ${roleColor} uppercase tracking-[0.3em]`}>{isRecruiter ? 'Conexões Empresa' : 'Conexões Bee'}</span>
          <h1 className="text-2xl font-black uppercase tracking-tighter">Meus <span className={`${roleColor} text-3xl italic`}>Matches</span></h1>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all bg-white/5 border border-white/10 backdrop-blur-md ${showMenu ? (isRecruiter ? 'text-blue-400' : 'text-primary') : 'text-white'}`}
          >
            <span className="material-symbols-outlined">filter_list</span>
          </button>

          {showMenu && (
            <>
              <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)}></div>
              <div className="absolute right-0 mt-3 w-56 bg-secondary border border-white/10 rounded-[2rem] shadow-2xl z-40 py-3 animate-in fade-in zoom-in-95 duration-200">
                <p className="px-5 py-2 text-[8px] font-black text-white/30 uppercase tracking-widest">Ordenar por</p>
                {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSortOption(option);
                      setShowMenu(false);
                    }}
                    className={`w-full px-5 py-3 text-[10px] font-black uppercase tracking-widest text-left flex items-center justify-between hover:bg-white/5 transition-colors ${sortOption === option ? roleColor : 'text-white/60'}`}
                  >
                    {sortLabels[option]}
                    {sortOption === option && <span className="material-symbols-outlined text-[16px]">check</span>}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </header>

      <main className="relative z-10 px-6 pb-10 overflow-y-auto scrollbar-hide flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 content-start">
        {sortedMatches.map((match) => (
          <div key={match.id} className="group relative">
            {/* MATCH CARD */}
            <div className="bg-white/5 rounded-[2.5rem] p-6 backdrop-blur-xl border border-white/10 flex flex-col gap-5 animate-in fade-in duration-300 group-hover:bg-white/10 transition-all relative overflow-hidden">
              {/* Status Indicator */}
              {!match.scheduledAt && match.schedulingMode === 'automated' && !isRecruiter && (
                <div className="absolute top-0 right-0 px-6 py-1 bg-primary text-secondary text-[8px] font-black uppercase tracking-[0.2em] rounded-bl-2xl">
                  Ação Necessária
                </div>
              )}

              {match.scheduledAt && (
                <div className={`${isRecruiter ? 'bg-blue-500/10 border-blue-500/20' : 'bg-primary/10 border-primary/20'} border p-4 rounded-3xl flex items-start gap-3 animate-in zoom-in-95 duration-300`}>
                  <span className={`material-symbols-outlined ${roleColor}`}>event_available</span>
                  <div className="flex-1">
                    <p className={`text-[10px] font-black uppercase tracking-wider ${roleColor}`}>Entrevista Agendada</p>
                    <p className="text-xs text-white/80 font-medium leading-relaxed mt-0.5">{match.scheduledAt}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center gap-5">
                <div className="relative shrink-0">
                  <div className="w-16 h-16 rounded-2xl bg-white/5 p-1 border border-white/10 backdrop-blur-md shadow-xl overflow-hidden">
                    <img src={match.companyLogo} className="w-full h-full rounded-xl object-cover grayscale group-hover:grayscale-0 transition-all" alt={match.companyName} />
                  </div>
                  {match.isVerified && (
                    <div className={`absolute -bottom-1 -right-1 ${isRecruiter ? 'bg-blue-500' : 'bg-primary'} rounded-full p-1 border-2 border-secondary`}>
                      <span className="material-symbols-outlined text-secondary text-[10px] font-black block">check</span>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black uppercase tracking-tight text-white leading-tight line-clamp-1">{match.jobTitle}</h3>
                  <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-0.5">{match.companyName}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-white/5 border border-white/5 rounded-full ${roleColor}`}>{match.industry}</span>
                    {match.jobStatus !== 'active' && (
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-red-400">
                        {match.jobStatus === 'closed' ? 'Encerrada' : 'Inativa'}
                      </span>
                    )}
                    <span className="text-[9px] font-bold text-white/20 uppercase tracking-tighter">{match.matchDate}</span>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                {/* Primary Action */}
                {!match.scheduledAt && match.schedulingMode === 'automated' && !isRecruiter ? (
                  <button
                    onClick={() => setSelectedMatchForSlot(match)}
                    className="flex-[2] h-12 bg-primary text-secondary text-[10px] font-black uppercase tracking-widest rounded-2xl hover:scale-[1.02] transition-all border border-primary/20 active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                  >
                    <span className="material-symbols-outlined text-sm">calendar_month</span>
                    Agendar Entrevista
                  </button>
                ) : (
                  <button className="flex-1 h-12 bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-white/10 transition-colors border border-white/5 active:scale-95 transition-all">
                    Ver Vaga
                  </button>
                )}

                {!match.scheduledAt && match.schedulingMode === 'automated' && isRecruiter && (
                  <div className="flex-1 h-12 flex items-center justify-center px-4 bg-white/5 rounded-2xl border border-white/5">
                    <span className="text-[8px] font-black text-white/30 uppercase tracking-widest text-center">Aguardando Candidato Agendar</span>
                  </div>
                )}

                <button
                  onClick={() => onOpenChat(match)}
                  className={`w-14 h-12 rounded-2xl ${isRecruiter ? 'bg-blue-500' : 'bg-primary'} text-secondary flex items-center justify-center shadow-xl transition-all active:scale-90 hover:scale-105`}
                >
                  <span className="material-symbols-outlined font-black">chat_bubble</span>
                </button>
              </div>
            </div>
          </div>
        ))}

        {sortedMatches.length === 0 && (
          <div className="p-12 text-center bg-white/5 rounded-[2.5rem] border border-dashed border-white/10 animate-in fade-in duration-500 flex flex-col items-center">
            <div className="opacity-10 mb-6">
              <JobeeSymbol size={64} mode="dark" />
            </div>
            <p className="text-white/20 text-[10px] font-black uppercase tracking-widest">Nenhuma conexão ativa nesta colmeia.</p>
          </div>
        )}
      </main>

      {/* 🗓️ SLOT PICKER MODAL */}
      <div className={`fixed inset-0 z-[100] transition-all duration-500 ${selectedMatchForSlot ? 'pointer-events-auto' : 'pointer-events-none'}`}>
        <div
          className={`absolute inset-0 bg-black/80 backdrop-blur-md transition-opacity duration-500 ${selectedMatchForSlot ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setSelectedMatchForSlot(null)}
        />

        <div className={`absolute bottom-6 inset-x-6 flex justify-center transition-transform duration-500 ease-out ${selectedMatchForSlot ? 'translate-y-0' : 'translate-y-[calc(100%+24px)]'}`}>
          <div className="bg-secondary border border-white/10 rounded-[3rem] p-8 shadow-2xl w-full max-w-xl flex flex-col max-h-[85vh]">
            <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-8 shrink-0 cursor-pointer" onClick={() => setSelectedMatchForSlot(null)}></div>

            <header className="mb-8 text-center">
              <h2 className="text-2xl font-black uppercase tracking-tighter text-primary">Escolha seu Horário</h2>
              <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">A colmeia {selectedMatchForSlot?.companyName} aguarda você.</p>
            </header>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
              {selectedMatchForSlot?.availabilitySlots?.map((slot, idx) => (
                <button
                  key={idx}
                  onClick={() => handleScheduleSlot(selectedMatchForSlot.id, slot)}
                  className="w-full p-6 bg-white/5 rounded-[2rem] border border-white/10 flex items-center justify-between group hover:bg-primary hover:border-primary transition-all active:scale-[0.98]"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:bg-white/10">
                      <span className="material-symbols-outlined text-primary group-hover:text-secondary">schedule</span>
                    </div>
                    <span className="text-xs font-black uppercase tracking-widest group-hover:text-secondary">{slot}</span>
                  </div>
                  <span className="material-symbols-outlined text-white/20 group-hover:text-secondary">chevron_right</span>
                </button>
              ))}
            </div>

            <div className="mt-8 p-6 bg-white/5 rounded-3xl border border-white/5">
              <div className="flex items-center gap-3 mb-2">
                <span className="material-symbols-outlined text-white/40 text-sm">info</span>
                <p className="text-[9px] font-black uppercase tracking-widest text-white/40">Detalhes da Entrevista</p>
              </div>
              <p className="text-[10px] font-bold text-white/60">
                {selectedMatchForSlot?.interviewModel === 'online' ? '🌐 Link Online: ' : '📍 Presencial: '}
                <span className="text-white break-all">{selectedMatchForSlot?.interviewDetail}</span>
              </p>
            </div>

            <button
              onClick={() => setSelectedMatchForSlot(null)}
              className="w-full py-5 rounded-2xl bg-white/5 text-white/40 font-black uppercase tracking-widest text-[10px] mt-6 shrink-0 border border-white/5 active:scale-95"
            >
              Voltar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MatchesPage;
