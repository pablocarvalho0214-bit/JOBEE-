
import React, { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';
import { JobeeSymbol } from '../components/JobeeIdentity';

const CandidatesPage: React.FC = () => {
    const [candidates, setCandidates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCandidates();
    }, []);

    const fetchCandidates = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('role', 'candidate')
                .order('updated_at', { ascending: false });

            if (data && !error) {
                setCandidates(data);
            }
        } catch (err) {
            console.error('Error fetching candidates:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-full bg-secondary text-white relative overflow-hidden font-sans pb-10">
            {/* Background Texture & Glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full"></div>
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            </div>

            <div className="relative z-10 p-6 pt-10 flex-1 overflow-y-auto scrollbar-hide pb-20">
                <header className="mb-10">
                    <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Talent Pool</span>
                    <h1 className="text-2xl font-black uppercase tracking-tighter">Explorar <span className="text-primary text-3xl italic">Abelhas</span></h1>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-1">Conheça os talentos ativos na Jobee</p>
                </header>

                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                        <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin"></div>
                        <p className="mt-4 text-[9px] font-black uppercase text-primary/40 tracking-widest">Mapeando talentos...</p>
                    </div>
                ) : (
                    <div className="grid gap-6">
                        {candidates.map(candidate => (
                            <div key={candidate.id} className="bg-white/5 rounded-[2.5rem] p-6 backdrop-blur-xl border border-white/10 flex flex-col gap-6 group hover:bg-white/10 transition-all">
                                <div className="flex items-center gap-5">
                                    <div className="relative shrink-0">
                                        <div className="w-20 h-20 rounded-3xl bg-white/5 p-1 border border-white/10 backdrop-blur-md shadow-xl overflow-hidden">
                                            <img
                                                src={candidate.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + candidate.id}
                                                className="w-full h-full rounded-2xl object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                                                alt=""
                                            />
                                        </div>
                                        <div className="absolute -bottom-1 -right-1 bg-primary rounded-full p-1.5 border-2 border-secondary">
                                            <span className="material-symbols-outlined text-secondary text-[12px] font-black block">bolt</span>
                                        </div>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-xl font-black uppercase tracking-tight text-white leading-tight">{candidate.full_name || 'Bee'}</h3>
                                        <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1">Status: Ativo</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] px-3 py-1 bg-white/5 border border-white/5 rounded-full text-white/40 italic">Candidate</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Sobre</p>
                                    <p className="text-xs text-white/60 font-medium italic leading-relaxed line-clamp-3">
                                        "{candidate.bio || 'Este talento prefere manter a discrição enquanto poliniza novas oportunidades.'}"
                                    </p>
                                </div>

                                <div className="pt-4 border-t border-white/5">
                                    <button className="w-full h-12 bg-white/5 text-white/60 text-[10px] font-black uppercase tracking-widest rounded-2xl border border-white/5 hover:bg-white/10 transition-all group-hover:border-primary/20">
                                        Ver Perfil Completo
                                    </button>
                                </div>
                            </div>
                        ))}

                        {candidates.length === 0 && (
                            <div className="p-12 text-center border-2 border-dashed border-white/10 rounded-[3rem] flex flex-col items-center">
                                <div className="opacity-10 mb-4">
                                    <JobeeSymbol size={48} mode="dark" />
                                </div>
                                <p className="text-[10px] font-black text-white/20 uppercase tracking-widest">Nenhuma abelha no radar.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default CandidatesPage;

