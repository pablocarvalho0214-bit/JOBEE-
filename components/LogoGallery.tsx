
import React from 'react';

const LogoGallery: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#020617] text-white p-4 md:p-10 flex flex-col items-center gap-12 overflow-y-auto font-sans">
            <header className="text-center max-w-2xl">
                <h1 className="text-6xl font-black text-yellow-400 mb-4 tracking-tighter drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]">
                    JOBEE LOGO LAB v4
                </h1>
                <p className="text-slate-400 text-lg">
                    <span className="text-white font-bold">10 Opções High-Visibility & Premium</span>.
                    Designs robustos, grandes e com animações que capturam a alma do Jobee.
                </p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 w-full max-w-7xl pb-40">

                {/* 1. THE GOLDEN GLOW */}
                <LogoHero title="1. The Golden Glow" desc="Aura de luxo com órbita suave. Foco em prestígio.">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                        <defs>
                            <radialGradient id="grad1" cx="50%" cy="50%" r="50%"><stop offset="0%" stopColor="#facc15" stopOpacity="0.6" /><stop offset="100%" stopColor="#facc15" stopOpacity="0" /></radialGradient>
                        </defs>
                        <circle cx="100" cy="100" r="50" fill="url(#grad1)" className="animate-pulse" />
                        <circle cx="100" cy="100" r="15" fill="#facc15" />
                        <g className="animate-[orbit_6s_linear_infinite]"><g transform="translate(145 100)"><PremiumBee size={60} /></g></g>
                    </svg>
                </LogoHero>

                {/* 2. THE TECH STRIKE */}
                <LogoHero title="2. The Tech Strike" desc="Contraste máximo e clareza absoluta. Estética de App Store." isWhite>
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                        <circle cx="100" cy="100" r="22" fill="#1e293b" />
                        <g className="animate-[strike_3s_infinite]"><PremiumBee size={90} color1="#1e293b" color2="#facc15" isDark /></g>
                    </svg>
                </LogoHero>

                {/* 3. INFINITY LOOP */}
                <LogoHero title="3. Infinity Loop" desc="O polinizador incansável. Movimento em oito estilizado.">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                        <path d="M60 100 Q60 60 100 100 T140 100 Q140 140 100 100 T60 100" fill="none" stroke="#facc15" strokeWidth="1" strokeDasharray="6 6" opacity="0.2" />
                        <circle cx="100" cy="100" r="10" fill="#facc15" className="animate-pulse" />
                        <g className="animate-[infinity_5s_linear_infinite]"><PremiumBee size={60} /></g>
                    </svg>
                </LogoHero>

                {/* 4. RADAR SCAN */}
                <LogoHero title="4. Radar Scan" desc="A abelha escaneando o mercado com precisão cirúrgica.">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                        <circle cx="100" cy="100" r="60" fill="none" stroke="#334155" strokeWidth="1" strokeDasharray="10 10" />
                        <circle cx="100" cy="40" r="6" fill="#facc15" className="animate-ping" />
                        <g className="animate-[scan_4s_ease-in-out_infinite]"><PremiumBee size={70} /></g>
                    </svg>
                </LogoHero>

                {/* 5. HEARTBEAT MATCH */}
                <LogoHero title="5. Heartbeat Match" desc="Pulsação orgânica. Quando o talento e a vaga batem juntos.">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                        <circle cx="100" cy="100" r="40" fill="#facc15" opacity="0.15" className="animate-[ping_2s_infinite]" />
                        <g className="animate-[pulse_1.5s_infinite]"><PremiumBee size={100} /></g>
                    </svg>
                </LogoHero>

                {/* 6. MAGNETIC SNAP */}
                <LogoHero title="6. Magnetic Snap" desc="Força de atração mútua com clique visual.">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                        <circle cx="140" cy="100" r="12" fill="#facc15" className="animate-[snap-pollen_2.5s_infinite]" />
                        <g className="animate-[snap-bee_2.5s_infinite]"><g transform="translate(60 100)"><PremiumBee size={70} /></g></g>
                    </svg>
                </LogoHero>

                {/* 7. QUANTUM BLINK */}
                <LogoHero title="7. Quantum Blink" desc="Velocidade e tecnologia. A abelha que está em todo lugar.">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                        <circle cx="40" cy="100" r="5" fill="#facc15" opacity="0.3" />
                        <circle cx="160" cy="100" r="5" fill="#facc15" opacity="0.3" />
                        <g className="animate-[blink_2s_infinite]"><g transform="translate(40 100)"><PremiumBee size={80} /></g></g>
                    </svg>
                </LogoHero>

                {/* 8. HEXAGON NEST */}
                <LogoHero title="8. Hexagon Nest" desc="A construção da carreira. Geometria e estrutura.">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                        <path d="M70 60 L100 45 L130 60 L130 90 L100 105 L70 90 Z" fill="none" stroke="#facc15" strokeWidth="3" strokeDasharray="300" className="animate-[draw_4s_infinite]" />
                        <g className="animate-bounce"><g transform="translate(100 75)"><PremiumBee size={50} /></g></g>
                    </svg>
                </LogoHero>

                {/* 9. SOLAR FLARE */}
                <LogoHero title="9. Solar Flare" desc="Energia pura e irradiação de oportunidades.">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                        {[0, 60, 120, 180, 240, 300].map(a => (
                            <line key={a} x1="100" y1="100" x2="160" y2="100" stroke="#facc15" strokeWidth="2" strokeDasharray="5 5" transform={`rotate(${a} 100 100)`} opacity="0.3" className="animate-pulse" />
                        ))}
                        <g className="animate-pulse"><PremiumBee size={110} /></g>
                    </svg>
                </LogoHero>

                {/* 10. SUCCESS BURST */}
                <LogoHero title="10. Success Burst" desc="O momento euforia do match. Explosão de conexões.">
                    <svg viewBox="0 0 200 200" className="w-full h-full">
                        <g className="animate-[impact_3s_infinite]"><PremiumBee size={100} /></g>
                        <circle cx="100" cy="100" r="10" fill="none" stroke="#facc15" strokeWidth="2" className="animate-[rings_3s_infinite] opacity-0" />
                        <circle cx="100" cy="100" r="10" fill="none" stroke="#facc15" strokeWidth="2" className="animate-[rings_3s_infinite] [animation-delay:0.5s] opacity-0" />
                    </svg>
                </LogoHero>

            </div>

            <style>{`
        @keyframes orbit { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes infinity { 
          0% { transform: translate(100px, 100px) translate(-50px, 0) rotate(0deg); }
          25% { transform: translate(100px, 100px) translate(0, -30px) rotate(90deg); }
          50% { transform: translate(100px, 100px) translate(50px, 0) rotate(180deg); }
          75% { transform: translate(100px, 100px) translate(0, 30px) rotate(270deg); }
          100% { transform: translate(100px, 100px) translate(-50px, 0) rotate(360deg); }
        }
        @keyframes scan { 0%, 100% { transform: rotate(-20deg) scale(1); } 50% { transform: rotate(20deg) scale(1.1); } }
        @keyframes pulse { 0%, 100% { transform: scale(1); } 50% { transform: scale(1.15); } }
        @keyframes snap-bee { 0%, 20%, 80%, 100% { transform: translateX(0); } 40%, 60% { transform: translateX(30px); } }
        @keyframes snap-pollen { 0%, 20%, 80%, 100% { transform: translateX(0); } 40%, 60% { transform: translateX(-30px); } }
        @keyframes blink { 0%, 45%, 55%, 100% { opacity: 1; transform: translate(40px, 100px); } 50% { opacity: 0; transform: translate(120px, 100px); } }
        @keyframes draw { 0% { stroke-dashoffset: 300; } 50% { stroke-dashoffset: 0; } 100% { stroke-dashoffset: -300; } }
        @keyframes strike { 0%, 15%, 85%, 100% { transform: translate(40px, 100px); } 40%, 60% { transform: translate(120px, 100px) scale(1.2); } }
        @keyframes impact { 0% { transform: scale(0.1); opacity: 0; } 30% { transform: scale(1.2) rotate(-15deg); opacity: 1; } 50% { transform: scale(1); rotate(0deg); } 100% { transform: scale(1); } }
        @keyframes rings { 0%, 30% { opacity: 0; transform: scale(0.5); } 31% { opacity: 1; } 100% { opacity: 0; transform: scale(3); } }
        @keyframes wings-fast { 0%, 100% { transform: scaleY(1); opacity: 1; } 50% { transform: scaleY(0.1); opacity: 0.5; } }
      `}</style>
        </div>
    );
};

const LogoHero: React.FC<{ title: string; desc: string; children: React.ReactNode; isWhite?: boolean }> = ({ title, desc, children, isWhite }) => (
    <div className="flex flex-col items-center gap-6 group">
        <div className={`w-full aspect-square max-w-[400px] ${isWhite ? 'bg-white' : 'bg-slate-900 border border-white/5'} rounded-[4rem] p-12 flex items-center justify-center shadow-2xl transition-all group-hover:scale-[1.02] group-hover:border-yellow-400/30 overflow-hidden relative`}>
            {!isWhite && <div className="absolute inset-0 bg-[#facc15]/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>}
            {children}
        </div>
        <div className="text-center">
            <h3 className="text-3xl font-black text-white group-hover:text-yellow-400 transition-colors uppercase italic tracking-tighter">{title}</h3>
            <p className="text-slate-400 text-sm mt-1 font-medium">{desc}</p>
        </div>
    </div>
);

const PremiumBee: React.FC<{ size?: number; color1?: string; color2?: string; isDark?: boolean }> = ({ size = 60, color1 = "#1e293b", color2 = "#facc15", isDark = false }) => {
    return (
        <g transform={`translate(${-size / 2} ${-size / 2})`}>
            <ellipse cx={size * 0.4} cy={size * 0.3} rx={size * 0.35} ry={size * 0.15} fill={isDark ? "#475569" : "white"} fillOpacity="0.85" className="animate-[wings-fast_0.1s_linear_infinite]" />
            <path d={`M${size * 0.2},${size * 0.6} Q${size * 0.2},${size * 0.3} ${size * 0.5},${size * 0.3} T${size * 0.8},${size * 0.6} T${size * 0.5},${size * 0.9} T${size * 0.2},${size * 0.6} Z`} fill={color1} />
            <path d={`M${size * 0.4},${size * 0.32} L${size * 0.45},${size * 0.88} L${size * 0.55},${size * 0.88} L${size * 0.5},${size * 0.32} Z`} fill={color2} />
            <path d={`M${size * 0.6},${size * 0.35} L${size * 0.65},${size * 0.85} L${size * 0.75},${size * 0.85} L${size * 0.7},${size * 0.35} Z`} fill={color2} />
            <circle cx={size * 0.85} cy={size * 0.6} r={size * 0.15} fill={color1} />
            <circle cx={size * 0.92} cy={size * 0.55} r={size * 0.04} fill="white" />
            <path d={`M${size * 0.82},${size * 0.48} Q${size * 0.8},${size * 0.3} ${size * 0.9},${size * 0.25}`} fill="none" stroke={color1} strokeWidth="3" strokeLinecap="round" />
        </g>
    );
};

export default LogoGallery;
