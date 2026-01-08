
import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../services/supabaseClient';
import BeeLogo from '../components/BeeLogo';

interface LoginPageProps {
  onLogin: () => void;
}

const HiveIcon: React.FC<{ size?: number; className?: string; color?: string }> = ({ size = 40, className = "", color = "#facc15" }) => (
  <svg viewBox="0 0 100 100" width={size} height={size} className={className}>
    <path
      d="M50 5 L85 25 L85 65 L50 85 L15 65 L15 25 Z"
      fill={color}
      stroke="#1e293b"
      strokeWidth="4"
    />
    <path d="M50 20 L75 35 L75 60 L50 75 L25 60 L25 35 Z" fill="#eab308" opacity="0.5" />
    <circle cx="50" cy="50" r="10" fill="#1e293b" />
  </svg>
);

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'candidate' | 'recruiter'>('candidate');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const errorMsg = localStorage.getItem('jobee_login_error');
    if (errorMsg) {
      setMessage(errorMsg);
      localStorage.removeItem('jobee_login_error');
    }
  }, []);

  const isCandidate = role === 'candidate';
  const roleText = isCandidate ? 'text-primary' : 'text-blue-400';
  const roleRing = isCandidate ? 'focus:ring-primary' : 'focus:ring-blue-400';

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { data: authData, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      const errorMsg = error.message === 'Invalid login credentials' ? 'E-mail ou senha incorretos' : error.message;
      setMessage(`Erro: ${errorMsg}`);
      setLoading(false);
      return;
    }

    // Verificar se a role do usuário corresponde à aba selecionada
    if (authData.user) {
      try {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', authData.user.id)
          .single();

        const userRole = profile?.role || authData.user.user_metadata?.role || 'candidate';
        const expectedRole = role; // role selecionada na aba (candidate ou recruiter)

        if (userRole !== expectedRole) {
          // Role não corresponde - fazer logout e mostrar erro
          await supabase.auth.signOut();

          if (userRole === 'recruiter') {
            setMessage('Seu e-mail está associado a uma conta de Empresa. Tente logar na aba de Empresa.');
          } else {
            setMessage('Seu e-mail está associado a uma conta de Candidato. Tente logar na aba de Candidato.');
          }

          setLoading(false);
          return;
        }
      } catch (err) {
        // Se falhar a verificação, deixar prosseguir (fallback)
        console.warn('Não foi possível verificar a role do usuário:', err);
      }
    }

    onLogin();
    setLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!email) { setMessage('Erro: Digite seu e-mail'); return; }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${window.location.origin}/reset-password` });
    if (error) setMessage(`Erro: ${error.message}`); else setMessage('E-mail enviado!');
    setLoading(false);
  };

  const handleSignUp = async () => {
    if (password.length < 6) { setMessage('Mínimo 6 caracteres!'); return; }
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signUp({ email, password, options: { data: { role } } });
    if (error) setMessage(`Erro: ${error.message}`); else setMessage('Verifique seu e-mail!');
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);

    // Salva a role selecionada no localStorage para validar quando o Google redirecionar de volta
    localStorage.setItem('jobee_expected_role', role);

    const redirectTo = Capacitor.isNativePlatform()
      ? 'com.jobee.app://google-auth'
      : window.location.origin;

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        }
      }
    });
    if (error) {
      setMessage(`Erro: ${error.message}`);
      localStorage.removeItem('jobee_expected_role');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen w-full flex-col bg-secondary overflow-hidden max-w-md mx-auto shadow-2xl relative font-sans">

      {/* 🖼️ FINAL GRADIENT BACKGROUNDS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none transition-all duration-1000">
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isCandidate ? 'bg-gradient-to-br from-yellow-700 via-orange-950 to-black' : 'bg-gradient-to-br from-blue-900 via-indigo-950 to-black'}`}>
          {/* Subtle noise/texture for premium feel */}
          <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          {/* Animated glow orb */}
          <div className={`absolute top-1/4 left-1/4 w-96 h-96 blur-[120px] rounded-full transition-colors duration-1000 ${isCandidate ? 'bg-primary/20' : 'bg-blue-500/20'}`}></div>
        </div>

        {/* VIGNETTE & BLENDS */}
        <div className={`absolute inset-0 bg-gradient-to-b ${isCandidate ? 'from-transparent via-black/30 to-black' : 'from-transparent via-blue-900/40 to-secondary'} transition-colors duration-1000`}></div>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 z-10 pt-10">

        <div className="flex flex-col items-center text-center mb-10 relative">
          <h1 className="text-6xl font-black uppercase tracking-tighter text-white mb-8 drop-shadow-[0_10px_20px_rgba(0,0,0,0.5)]">
            Jo<span className="text-primary">bee</span>
          </h1>

          {/* 🎬 ANIMATION STAGE: RANDOMIZED JOURNEYS */}
          <div className="w-full h-24 mb-6 relative flex items-center justify-center overflow-visible">
            <div className="flex items-center justify-center w-full max-w-[320px] relative">
              <div className="flex gap-16 items-center">
                <HiveIcon size={35} className="opacity-20 grayscale" />
                <div className="relative">
                  <HiveIcon size={55} className="drop-shadow-[0_0_20px_rgba(250,204,21,0.8)] animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
                    {[...Array(isCandidate ? 1 : 11)].map((_, i) => {
                      const startX = isCandidate ? -100 : ((i * 137.5) % 300) - 150;
                      const startY = isCandidate ? 0 : ((i * 199.2) % 200) - 100;
                      const delay = i * 0.7;
                      const pathType = isCandidate ? 0 : (i % 4);
                      return (
                        <div
                          key={i}
                          className="absolute opacity-0"
                          style={{
                            animation: `bee-path-${pathType} 7s infinite`,
                            animationDelay: `${delay}s`,
                            '--startX': `${startX}px`,
                            '--startY': `${startY}px`
                          } as any}
                        >
                          <BeeLogo size={40} />
                        </div>
                      );
                    })}
                  </div>
                </div>
                <HiveIcon size={35} className="opacity-20 grayscale" />
              </div>
            </div>
          </div>

          <h1 className="text-white text-3xl font-black leading-tight tracking-tight drop-shadow-md mb-2">
            {isCandidate ? <>Encontre sua <span className="text-primary">colmeia</span></> : <>Encontre suas <span className="text-primary">abelhas</span></>}
          </h1>
          <p className="text-gray-200 text-sm font-medium drop-shadow">
            {isCandidate ? 'A casa perfeita para o seu talento brilhar.' : 'O pólen ideal para polinizar seus resultados.'}
          </p>
        </div>

        <div className="animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="flex w-full p-1.5 bg-white/30 backdrop-blur-md rounded-[2rem] mb-6 border border-white/5 transition-all">
            <button onClick={() => setRole('candidate')} className={`flex-1 py-4 text-[10px] font-black rounded-[1.5rem] transition-all duration-500 tracking-widest ${isCandidate ? 'bg-primary text-secondary shadow-lg' : 'text-gray-400 hover:text-white'} uppercase`}>Candidato</button>
            <button onClick={() => setRole('recruiter')} className={`flex-1 py-4 text-[10px] font-black rounded-[1.5rem] transition-all duration-500 tracking-widest ${role === 'recruiter' ? 'bg-blue-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'} uppercase`}>Empresa</button>
          </div>

          <div className="w-full space-y-5 p-8 rounded-[2.5rem] shadow-2xl bg-white/30 backdrop-blur-3xl border border-white/10 text-white">
            <div className="flex flex-col gap-4 text-center">
              <button
                type="button"
                disabled={loading}
                onClick={handleGoogleLogin}
                className="w-full flex h-14 items-center justify-center gap-3 rounded-2xl bg-white text-secondary text-[10px] font-black shadow-xl active:scale-95 transition-transform uppercase tracking-widest disabled:opacity-50"
              >
                <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="G" />
                Entrar com Google
              </button>
            </div>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/20"></div>
              <span className="flex-shrink-0 mx-4 text-[10px] font-black text-white/40 uppercase tracking-widest">OU</span>
              <div className="flex-grow border-t border-white/20"></div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-5">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-white/70 uppercase tracking-widest ml-1">E-mail de acesso</label>
                <input type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} className={`h-12 w-full rounded-2xl border border-white/20 bg-white/30 px-5 text-white placeholder-white/40 focus:outline-none focus:ring-2 ${roleRing} focus:bg-white/40 transition-all font-medium text-sm`} required />
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-black text-white/70 uppercase tracking-widest">Senha</label>
                </div>
                <input type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className={`h-12 w-full rounded-2xl border border-white/20 bg-white/30 px-5 text-white placeholder-white/40 focus:outline-none focus:ring-2 ${roleRing} focus:bg-white/40 transition-all text-sm`} required />
                <div className="flex justify-end mt-1 mr-1">
                  <button type="button" onClick={handleForgotPassword} className={`text-[10px] font-black ${roleText} hover:opacity-80 uppercase tracking-tighter`}>Esqueceu?</button>
                </div>
              </div>

              {message && <div className="p-4 rounded-xl text-center bg-white/5 text-white border border-white/10 text-[10px] font-black uppercase tracking-wider">{message}</div>}

              <div className="pt-2 flex flex-col gap-3">
                <button type="submit" disabled={loading} className={`h-16 w-full rounded-2xl font-black shadow-2xl transition-all duration-300 transform active:scale-95 disabled:opacity-50 ${isCandidate ? 'bg-primary text-secondary' : 'bg-blue-500 text-white'} uppercase`}>
                  {loading ? 'POLINIZANDO...' : `ENTRAR COMO ${isCandidate ? 'Candidato' : 'Empresa'}`}
                </button>
                <button type="button" onClick={handleSignUp} className="h-14 w-full rounded-2xl border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/5 transition-all">
                  Criar Perfil {isCandidate ? 'Bee' : 'Colmeia'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes bee-path-0 {
          0% { transform: translate(var(--startX), var(--startY)) scaleX(-1); opacity: 0; }
          5% { opacity: 1; }
          25% { transform: translate(-120px, -20px) scaleX(-1); }
          26% { transform: translate(-120px, -20px) scaleX(1); }
          55% { transform: translate(120px, -20px) scaleX(1); }
          56% { transform: translate(120px, -20px) scaleX(-1); }
          85% { transform: translate(0, -10px) scaleX(-1) scale(1.2); opacity: 1; }
          100% { transform: translate(0, 20px) scaleX(-1) scale(0); opacity: 0; }
        }
        @keyframes bee-path-1 {
          0% { transform: translate(var(--startX), var(--startY)) scaleX(1); opacity: 0; }
          5% { opacity: 1; }
          25% { transform: translate(120px, -20px) scaleX(1); }
          26% { transform: translate(120px, -20px) scaleX(-1); }
          55% { transform: translate(-120px, -20px) scaleX(-1); }
          56% { transform: translate(-120px, -20px) scaleX(1); }
          85% { transform: translate(0, -10px) scaleX(1) scale(1.2); opacity: 1; }
          100% { transform: translate(0, 20px) scaleX(1) scale(0); opacity: 0; }
        }
        @keyframes bee-path-2 {
          0% { transform: translate(var(--startX), var(--startY)) scaleX(-1); opacity: 0; }
          10% { opacity: 1; }
          45% { transform: translate(-120px, -10px) scaleX(-1); }
          46% { transform: translate(-120px, -10px) scaleX(1); }
          85% { transform: translate(0, -10px) scaleX(1) scale(1.2); opacity: 1; }
          100% { transform: translate(0, 20px) scaleX(1) scale(0); opacity: 0; }
        }
        @keyframes bee-path-3 {
          0% { transform: translate(var(--startX), var(--startY)) scaleX(1); opacity: 0; }
          10% { opacity: 1; }
          45% { transform: translate(120px, -10px) scaleX(1); }
          46% { transform: translate(120px, -10px) scaleX(-1); }
          85% { transform: translate(0, -10px) scaleX(-1) scale(1.2); opacity: 1; }
          100% { transform: translate(0, 20px) scaleX(-1) scale(0); opacity: 0; }
        }
      `}</style>
    </div>
  );
};

export default LoginPage;
