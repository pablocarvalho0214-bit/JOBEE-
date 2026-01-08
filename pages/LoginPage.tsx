
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

      <div className="flex flex-1 flex-col justify-between px-6 z-10 py-8">

        {/* Header Section - Compact */}
        <div className="flex flex-col items-center text-center relative mt-2">
          <div className="flex items-center gap-2 mb-2">
            <HiveIcon size={30} color={isCandidate ? "#facc15" : "#60a5fa"} className="drop-shadow-lg" />
            <span className="text-3xl font-black uppercase tracking-tighter text-white drop-shadow-md">
              Jo<span className={roleText.replace('text-', 'text-')}>bee</span>
            </span>
          </div>

          <h1 className="text-2xl font-bold text-white mb-1 tracking-tight drop-shadow-xl animate-fade-in">
            {isCandidate ? 'Encontre sua colmeia' : 'Encontre suas abelhas'}
          </h1>
          <p className="text-blue-100 text-sm opacity-80 max-w-[250px]">
            {isCandidate ? 'A casa perfeita para o seu talento brilhar.' : 'O pólen ideal para polinizar seus resultados.'}
          </p>
        </div>

        {/* Animation Section - Scaled Down */}
        <div className="w-full h-16 my-4 relative flex items-center justify-center overflow-visible">
          <div className="flex items-center justify-center w-full max-w-[200px] relative scale-75">
            <div className="flex gap-8 items-center">
              <div className="relative">
                <HiveIcon size={40} className="drop-shadow-[0_0_15px_rgba(250,204,21,0.5)]" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-visible">
                  {[...Array(isCandidate ? 2 : 5)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute opacity-0"
                      style={{
                        animation: `bee-path-${i % 4} 6s infinite`,
                        animationDelay: `${i * 1.2}s`,
                        '--startX': `${(i * 50) - 100}px`,
                        '--startY': `${(i * 30) - 60}px`
                      } as any}
                    >
                      <BeeLogo size={25} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Interaction Container */}
        <div className="animate-in fade-in slide-in-from-bottom-6 duration-700 flex-1 flex flex-col max-h-[650px] justify-center">
          {/* Role Toggle */}
          <div className="flex w-full p-1 bg-white/10 backdrop-blur-xl rounded-2xl mb-4 border border-white/10 shadow-inner">
            <button
              type="button"
              onClick={() => setRole('candidate')}
              className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all duration-300 tracking-widest ${isCandidate ? 'bg-primary text-secondary shadow-lg' : 'text-white/60 hover:text-white'} uppercase`}
            >
              Candidato
            </button>
            <button
              type="button"
              onClick={() => setRole('recruiter')}
              className={`flex-1 py-3 text-[10px] font-black rounded-xl transition-all duration-300 tracking-widest ${role === 'recruiter' ? 'bg-blue-500 text-white shadow-lg' : 'text-white/60 hover:text-white'} uppercase`}
            >
              Empresa
            </button>
          </div>

          <div className="w-full space-y-4 p-6 rounded-3xl shadow-2xl bg-white/10 backdrop-blur-2xl border border-white/20 text-white overflow-y-auto no-scrollbar">
            {/* Google Login */}
            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="w-full flex h-12 items-center justify-center gap-3 rounded-xl bg-white text-secondary text-[11px] font-black shadow-lg active:scale-[0.98] transition-all uppercase tracking-widest disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-5 h-5" alt="G" />
              Entrar com Google
            </button>

            <div className="relative flex items-center py-1">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-3 text-[9px] font-bold text-white/30 uppercase tracking-widest">OU E-MAIL</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest ml-1">E-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder-white/30 focus:outline-none focus:ring-1 ${roleRing} focus:bg-white/10 transition-all text-sm`}
                  required
                />
              </div>

              <div className="space-y-1.5 focus-within:translate-x-1 transition-transform">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[10px] font-bold text-white/70 uppercase tracking-widest">Senha</label>
                  <button type="button" onClick={handleForgotPassword} className={`text-[10px] font-bold ${roleText} hover:opacity-80 transition-opacity uppercase`}>Esqueceu?</button>
                </div>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={`h-11 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder-white/30 focus:outline-none focus:ring-1 ${roleRing} focus:bg-white/10 transition-all text-sm`}
                  required
                />
              </div>

              {message && (
                <div className="p-3 rounded-xl text-center bg-red-500/10 text-red-100 border border-red-500/20 text-[10px] font-bold uppercase tracking-wider animate-shake">
                  {message}
                </div>
              )}

              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={`h-12 w-full rounded-xl font-black shadow-xl transition-all duration-300 transform active:scale-[0.98] disabled:opacity-50 ${isCandidate ? 'bg-primary text-secondary' : 'bg-blue-600 text-white'} uppercase text-xs tracking-wider`}
                >
                  {loading ? 'CARREGANDO...' : 'ENTRAR NO JOBEE'}
                </button>

                <button
                  type="button"
                  onClick={handleSignUp}
                  className="w-full text-[10px] font-bold text-white/50 uppercase tracking-widest hover:text-white transition-colors py-2"
                >
                  Não tem conta? <span className={roleText}>Criar {isCandidate ? 'Bee' : 'Colmeia'}</span>
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
