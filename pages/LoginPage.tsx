
import React, { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../services/supabaseClient';
import { JobeeFullLogo, JobeeBrandCard } from '../components/JobeeIdentity';

interface LoginPageProps {
  onLogin: () => void;
}


const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'candidate' | 'recruiter'>('candidate');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

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

    // Persistence is handled by Supabase client default (auto-refresh)
    // Future improvement: Implement session-only logic if needed

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

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { setMessage('Mínimo 6 caracteres!'); return; }
    if (password !== confirmPassword) { setMessage('As senhas não coincidem!'); return; }

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

      {/* 🖼️ BACKGROUNDS */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none transition-all duration-1000">
        <div className={`absolute inset-0 transition-opacity duration-1000 ${isCandidate ? 'bg-gradient-to-br from-yellow-700 via-orange-950 to-black' : 'bg-gradient-to-br from-blue-900 via-indigo-950 to-black'}`}>
          <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
          <div className={`absolute top-1/4 left-1/4 w-96 h-96 blur-[120px] rounded-full transition-colors duration-1000 ${isCandidate ? 'bg-primary/20' : 'bg-blue-500/20'}`}></div>
        </div>
        <div className={`absolute inset-0 bg-gradient-to-b ${isCandidate ? 'from-transparent via-black/30 to-black' : 'from-transparent via-blue-900/40 to-secondary'} transition-colors duration-1000`}></div>
      </div>

      <div className="flex flex-1 flex-col z-10 px-6 py-6 justify-center">

        {/* Official Brand Header */}
        <div className="flex flex-col items-center text-center mb-8 scale-110 animate-fade-in">
          <JobeeFullLogo size={42} theme="light" />
          <div className="mt-4 px-3 py-1 bg-white/5 backdrop-blur-sm rounded-full border border-white/10">
            <p className="text-white text-[9px] font-black uppercase tracking-[0.3em] opacity-80">
              Onde talentos e empresas dão match
            </p>
          </div>
        </div>

        {/* Action Container */}
        <div className="w-full space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">

          {/* Role Toggle - Slim */}
          <div className="flex w-full p-1 bg-white/10 backdrop-blur-md rounded-xl border border-white/10 shadow-2xl transition-all">
            <button
              type="button"
              onClick={() => setRole('candidate')}
              className={`flex-1 py-2.5 text-[9px] font-black rounded-lg transition-all ${isCandidate ? 'bg-primary text-secondary shadow-md' : 'text-white/60 hover:text-white'} uppercase tracking-widest`}
            >
              Candidato
            </button>
            <button
              type="button"
              onClick={() => setRole('recruiter')}
              className={`flex-1 py-2.5 text-[9px] font-black rounded-lg transition-all ${role === 'recruiter' ? 'bg-blue-500 text-white shadow-md' : 'text-white/60 hover:text-white'} uppercase tracking-widest`}
            >
              Empresa
            </button>
          </div>

          {/* Login Card */}
          <div className="w-full p-5 rounded-2xl shadow-2xl bg-white/10 backdrop-blur-xl border border-white/10 text-white">

            <button
              type="button"
              disabled={loading}
              onClick={handleGoogleLogin}
              className="w-full flex h-10 items-center justify-center gap-2 rounded-lg bg-white text-secondary text-[10px] font-black shadow-sm active:scale-[0.98] transition-all uppercase tracking-widest disabled:opacity-50"
            >
              <img src="https://www.gstatic.com/images/branding/product/1x/gsa_512dp.png" className="w-4 h-4" alt="G" />
              Google
            </button>

            <div className="relative flex items-center py-3">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-3 text-[8px] font-bold text-white/30 uppercase tracking-widest">OU E-MAIL</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <form onSubmit={isSignUp ? handleSignUp : handleEmailLogin} className="space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold text-white/60 uppercase tracking-widest ml-1">E-mail</label>
                <input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => { setMessage(''); setEmail(e.target.value); }}
                  className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-4 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm transition-all"
                  required
                />
              </div>

              <div className="space-y-1">
                <div className="flex items-center justify-between ml-1">
                  <label className="text-[9px] font-bold text-white/60 uppercase tracking-widest">Senha</label>
                  {!isSignUp && (
                    <button type="button" onClick={handleForgotPassword} className={`text-[9px] font-bold ${roleText} hover:opacity-80 transition-opacity uppercase`}>Esqueceu?</button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => { setMessage(''); setPassword(e.target.value); }}
                    className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-4 pr-10 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm transition-all"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined text-[18px]">
                      {showPassword ? 'visibility_off' : 'visibility'}
                    </span>
                  </button>
                </div>
              </div>

              {isSignUp && (
                <div className="space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                  <label className="text-[9px] font-bold text-white/60 uppercase tracking-widest ml-1">Confirmar Senha</label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => { setMessage(''); setConfirmPassword(e.target.value); }}
                      className="h-10 w-full rounded-lg border border-white/10 bg-white/5 px-4 pr-10 text-white placeholder-white/20 focus:outline-none focus:ring-1 focus:ring-primary/50 text-sm transition-all"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">
                        {showConfirmPassword ? 'visibility_off' : 'visibility'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {!isSignUp && (
                <div className="flex items-center gap-2 ml-1 py-1">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.5 h-3.5 rounded border-white/10 bg-white/5 text-primary focus:ring-0 focus:ring-offset-0 cursor-pointer"
                  />
                  <label htmlFor="rememberMe" className="text-[10px] text-white/60 font-medium cursor-pointer hover:text-white transition-colors">
                    Permanecer conectado
                  </label>
                </div>
              )}

              {message && (
                <div className="p-2 rounded-lg text-center bg-red-500/10 text-red-100 border border-red-500/20 text-[9px] font-bold uppercase tracking-wider">
                  {message}
                </div>
              )}

              <div className="pt-2 space-y-3">
                <button
                  type="submit"
                  disabled={loading}
                  className={`h-11 w-full rounded-lg font-black shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 ${isCandidate ? 'bg-primary text-secondary' : 'bg-blue-600 text-white'} uppercase text-[11px] tracking-wider`}
                >
                  {loading ? 'CARREGANDO...' : (isSignUp ? 'CRIAR CONTA' : 'ENTRAR')}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setMessage('');
                    setPassword('');
                    setConfirmPassword('');
                  }}
                  className="w-full text-[9px] font-bold text-white/40 uppercase tracking-widest hover:text-white transition-colors"
                >
                  {isSignUp ? (
                    <>Já tem uma conta? <span className={roleText}>Entrar</span></>
                  ) : (
                    <>Não tem conta? <span className={roleText}>Criar Agora</span></>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      <style>{`
        /* Essential standard animations could stay if needed, but bee-paths are gone */
      `}</style>
    </div>
  );
};

export default LoginPage;
