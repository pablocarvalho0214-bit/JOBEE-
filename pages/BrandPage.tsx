
import React from 'react';
import { JobeeSymbol, JobeeFullLogo, JobeeSymbolFiveBars } from '../components/JobeeIdentity';

const BrandPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
    return (
        <div className="flex flex-col min-h-screen bg-[#0F172A] text-white p-6 overflow-y-auto pb-12 font-sans">

            {/* Header Navigation */}
            <div className="flex items-center gap-4 mb-10">
                <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div>
                    <h1 className="text-2xl font-black uppercase tracking-tighter">Brandbook</h1>
                    <p className="text-yellow-400 text-[10px] font-bold uppercase tracking-[0.3em]">Identidade Oficial JOBEE</p>
                </div>
            </div>

            {/* Hero Section */}
            <section className="mb-12 text-center py-10 bg-white/5 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10">
                    <JobeeSymbol size={200} mode="dark" />
                </div>
                <div className="relative z-10 flex flex-col items-center">
                    <JobeeFullLogo size={60} theme="light" />
                    <p className="mt-6 text-slate-400 text-sm max-w-xs mx-auto">
                        Uma marca construída para conectar talentos e empresas com agilidade e inteligência.
                    </p>
                </div>
            </section>

            {/* Logo Concepts */}
            <section className="space-y-6 mb-12">
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white/50 px-2">Aplicações da Logo</h2>

                <div className="grid grid-cols-1 gap-4">
                    {/* Main Variation */}
                    <div className="bg-slate-800/50 p-8 rounded-3xl border border-white/5 flex flex-col items-center gap-4 shadow-xl">
                        <JobeeFullLogo size={40} theme="light" />
                        <span className="text-[9px] font-bold text-slate-500 uppercase">Logo Principal (Fundo Escuro)</span>
                    </div>

                    {/* Light Variation */}
                    <div className="bg-white p-8 rounded-3xl border border-slate-200 flex flex-col items-center gap-4 shadow-xl">
                        <div className="flex items-center gap-3">
                            <JobeeSymbol size={40} mode="color" />
                            <div className="flex font-black tracking-tighter text-[#1E293B] uppercase text-[32px]">
                                <span>JO</span>
                                <span className="text-[#EAB308]">BEE</span>
                            </div>
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">Logo Principal (Fundo Claro)</span>
                    </div>

                    {/* Symbol Only */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 flex flex-col items-center gap-3">
                            <JobeeSymbol size={48} mode="color" />
                            <span className="text-[8px] font-bold text-white/30 uppercase">Versão 3 Barras (Atual)</span>
                        </div>
                        <div className="bg-slate-800/50 p-6 rounded-3xl border border-white/5 flex flex-col items-center gap-3">
                            <JobeeSymbolFiveBars size={48} mode="color" />
                            <span className="text-[8px] font-bold text-white/30 uppercase">Versão 5 Barras (Teste)</span>
                        </div>
                    </div>
                </div>
            </section>

            {/* Color Palette */}
            <section className="space-y-6 mb-12">
                <h2 className="text-xs font-black uppercase tracking-[0.4em] text-white/50 px-2">Paleta de Cores</h2>

                <div className="grid grid-cols-2 gap-4">
                    <ColorCard hex="#FACC15" name="Honey Yellow" type="Principal" text="text-slate-900" />
                    <ColorCard hex="#EAB308" name="Dark Honey" type="Profundidade" text="text-slate-900" />
                    <ColorCard hex="#1E293B" name="Petroleum Blue" type="Base Corporativa" text="text-white" />
                    <ColorCard hex="#0F172A" name="Night Blue" type="Premium/Dark" text="text-white" />
                </div>
            </section>

            {/* Concept Breakdown */}
            <section className="bg-yellow-400 p-8 rounded-[2.5rem] text-slate-900 space-y-4 shadow-2xl">
                <h2 className="text-xl font-black uppercase tracking-tighter italic">O Significado</h2>
                <div className="space-y-4 text-sm font-medium leading-relaxed">
                    <p>
                        <span className="font-black text-xs uppercase block mb-1">Célula Hexagonal:</span>
                        A base do sistema representa a colmeia, o habitat do trabalho coletivo e da organização.
                    </p>
                    <p>
                        <span className="font-black text-xs uppercase block mb-1">As 3 Barras:</span>
                        Representam crescimento e progresso. A barra central amarela é o **TALENTO**, ladeada pelas **EMPRESAS** que dão suporte ao seu brilho.
                    </p>
                </div>
            </section>

            {/* Footer */}
            <div className="mt-12 text-center text-[10px] font-bold text-white/20 uppercase tracking-[0.5em]">
                Propriedade do JOBEE Core App 2026
            </div>
        </div>
    );
};

const ColorCard: React.FC<{ hex: string, name: string, type: string, text: string }> = ({ hex, name, type, text }) => (
    <div className="bg-white/5 p-2 rounded-2xl border border-white/5 overflow-hidden">
        <div className={`w-full h-20 rounded-xl mb-3 flex items-end p-3 ${text}`} style={{ backgroundColor: hex }}>
            <span className="text-[10px] font-black uppercase">{hex}</span>
        </div>
        <div className="px-1">
            <h3 className="text-[10px] font-black uppercase text-white leading-none mb-1">{name}</h3>
            <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">{type}</p>
        </div>
    </div>
);

export default BrandPage;
