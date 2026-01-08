import React, { useState, useEffect } from 'react';
import { Page } from './types';
import LoginPage from './pages/LoginPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import JobsPage from './pages/JobsPage';
import SwipePage from './pages/SwipePage';
import MatchesPage from './pages/MatchesPage';
import ChatPage from './pages/ChatPage';
import ProfilePage from './pages/ProfilePage';
import CandidatesPage from './pages/CandidatesPage';
import RecruiterDashboard from './pages/RecruiterDashboard';
import CandidateDashboard from './pages/CandidateDashboard';
import RecruiterOnboarding from './pages/RecruiterOnboarding';
import CandidateOnboarding from './pages/CandidateOnboarding';
import CreateJobPage from './pages/CreateJobPage';
import BrandPage from './pages/BrandPage';
import BottomNav from './components/BottomNav';
import { JobeeSymbol, JobeeSplashScreen } from './components/JobeeIdentity';
import InstallPWAPrompt from './components/InstallPWAPrompt';
import { Match } from './types';
import { MOCK_MATCHES } from './constants';
import { supabase } from './services/supabaseClient';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
  const [selectedMatchId, setSelectedMatchId] = useState<string>(MOCK_MATCHES[0].id);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userRole, setUserRole] = useState<'candidate' | 'recruiter'>('candidate');
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [showSplash, setShowSplash] = useState(true);

  // Flag to force onboarding for users who haven't completed it yet
  const shouldForceOnboarding = !isOnboardingCompleted;

  const fetchProfile = async (id: string, metadataRole?: string, onboardingCompleted?: boolean) => {
    // Stage 1: Fast metadata check
    const roleToSet = (metadataRole as any) || 'candidate';
    setUserRole(roleToSet);

    // Recupera a role esperada salva no localStorage (fluxo Google Login ou Direto)
    const expectedRole = localStorage.getItem('jobee_expected_role');

    // Stage 2: Database verify
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role, onboarding_completed')
        .eq('id', id)
        .single();

      if (data && !error) {
        // Validation check: se o usuário logou através de uma aba específica, confirmar se a role confere
        if (expectedRole && data.role !== expectedRole) {
          localStorage.removeItem('jobee_expected_role');
          await supabase.auth.signOut();
          const errorMsg = data.role === 'recruiter'
            ? 'Seu e-mail é corporativo. Tente logar como Empresa.'
            : 'Seu e-mail é pessoal. Tente logar como Candidato.';
          localStorage.setItem('jobee_login_error', errorMsg);
          setCurrentPage('login');
          return;
        }

        // Limpa o localStorage após validação bem-sucedida ou se não houver conflito
        localStorage.removeItem('jobee_expected_role');

        setUserRole(data.role);
        setIsOnboardingCompleted(!!data.onboarding_completed);

        // Navigation logic based on database truth
        if (!data.onboarding_completed) {
          setCurrentPage('onboarding');
        } else {
          // If we are already on a main page, don't force redirect
          if (currentPage === 'login' || currentPage === 'onboarding') {
            setCurrentPage(data.role === 'recruiter' ? 'jobs' : 'dashboard');
          }
        }
      } else {
        // Fallback to metadata if DB fails but user exists
        setIsOnboardingCompleted(!!onboardingCompleted);
        if (!onboardingCompleted) setCurrentPage('onboarding');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  useEffect(() => {
    // Listen for deep links (Google Auth redirect)
    import('@capacitor/app').then(({ App: CapApp }) => {
      CapApp.addListener('appUrlOpen', (event) => {
        if (event.url.includes('#access_token') || event.url.includes('&access_token') || event.url.includes('refresh_token')) {
          // Manually extract the hash part because Supabase might expect a standard browser window
          const urlObj = new URL(event.url);
          const hashParams = new URLSearchParams(urlObj.hash.substring(1)); // remove #
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');

          if (access_token && refresh_token) {
            supabase.auth.setSession({ access_token, refresh_token });
          }
        }
      });
    });

    // Check for recovery flow first thing
    const isRecovery = window.location.hash.includes('type=recovery');
    if (isRecovery) {
      setCurrentPage('reset-password');
    }

    // Check for active session on load
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session && !isRecovery) {
        await fetchProfile(session.user.id, session.user.user_metadata?.role, session.user.user_metadata?.onboarding_completed);
      }

      // Artificial delay to show the beautiful Splash Screen
      setTimeout(() => {
        setLoadingAuth(false);
      }, 1500);
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setCurrentPage('reset-password');
      } else if (event === 'SIGNED_IN' && session) {
        if (!window.location.hash.includes('type=recovery')) {
          fetchProfile(session.user.id, session.user.user_metadata?.role, session.user.user_metadata?.onboarding_completed);
        }
      } else if (event === 'SIGNED_OUT') {
        setCurrentPage('login');
        setUserRole('candidate'); // Reset role to prevent forced onboarding check
        setIsOnboardingCompleted(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Handle splash cleanup
  useEffect(() => {
    if (!loadingAuth) {
      const timer = setTimeout(() => {
        setShowSplash(false);
      }, 1100); // 1s de animação + 100ms margem
      return () => clearTimeout(timer);
    }
  }, [loadingAuth]);

  const selectedMatch = matches.find(m => m.id === selectedMatchId) || matches[0];

  const handleSchedule = (matchId: string, dateInfo: string) => {
    setMatches(prev => prev.map(m =>
      m.id === matchId ? { ...m, scheduledAt: dateInfo } : m
    ));
  };

  const renderPage = () => {
    // Force onboarding for users who haven't completed it
    if (shouldForceOnboarding && currentPage !== 'login' && currentPage !== 'reset-password') {
      return (
        userRole === 'recruiter' ? (
          <RecruiterOnboarding
            onComplete={() => {
              setIsOnboardingCompleted(true);
              setCurrentPage('jobs');
            }}
          />
        ) : (
          <CandidateOnboarding
            onComplete={() => {
              setIsOnboardingCompleted(true);
              setCurrentPage('dashboard');
            }}
          />
        )
      );
    }

    switch (currentPage) {
      case 'login':
        return <LoginPage onLogin={() => {
          // The fetchProfile called by onAuthStateChange will handle navigation
        }} />;
      case 'reset-password':
        return <ResetPasswordPage onComplete={() => setCurrentPage('login')} />;
      case 'onboarding':
        return (
          userRole === 'recruiter' ? (
            <RecruiterOnboarding
              onComplete={() => {
                setIsOnboardingCompleted(true);
                setCurrentPage('jobs');
              }}
            />
          ) : (
            <CandidateOnboarding
              onComplete={() => {
                setIsOnboardingCompleted(true);
                setCurrentPage('dashboard');
              }}
            />
          )
        );
      case 'dashboard':
        return <CandidateDashboard
          onNavigate={setCurrentPage}
          onOpenChat={(m) => { setSelectedMatchId(m.id); setCurrentPage('chat'); }}
        />;
      case 'jobs':
        return userRole === 'recruiter' ? <RecruiterDashboard onNavigate={setCurrentPage} /> : <JobsPage />;
      case 'candidates':
        return <CandidatesPage />;
      case 'swipe':
        return userRole === 'recruiter' ? <CreateJobPage onNavigate={setCurrentPage} /> : <SwipePage />;
      case 'matches':
        return (
          <MatchesPage
            role={userRole}
            onOpenChat={(match) => {
              setSelectedMatchId(match.id);
              setCurrentPage('chat');
            }}
          />
        );
      case 'chat':
        return (
          <ChatPage
            match={selectedMatch}
            role={userRole}
            onBack={() => setCurrentPage('matches')}
            onScheduled={(date) => handleSchedule(selectedMatch.id, date)}
          />
        );
      case 'profile':
        return <ProfilePage role={userRole} onNavigate={setCurrentPage} />;
      case 'brand':
        return <BrandPage onBack={() => setCurrentPage('login')} />;
      default:
        return (
          <div className="p-8 text-center bg-secondary text-white h-full flex flex-col items-center justify-center">
            <span className="material-symbols-outlined text-4xl text-primary mb-4 animate-bounce">construction</span>
            <p className="font-black uppercase tracking-widest text-[10px]">Página em construção</p>
          </div>
        );
    }
  };

  if (loadingAuth && showSplash) {
    return <JobeeSplashScreen />;
  }

  if (currentPage === 'login' || currentPage === 'reset-password' || currentPage === 'onboarding' || shouldForceOnboarding) {
    return (
      <>
        <InstallPWAPrompt />
        {renderPage()}
      </>
    );
  }

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto overflow-hidden shadow-2xl relative bg-secondary transition-colors duration-500">

      {/* GLOBAL BACKGROUND TEXTURE */}
      <div className="absolute inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
        {/* Ambient Glow */}
        <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full transition-colors duration-1000 ${userRole === 'recruiter' ? 'bg-blue-500/10' : 'bg-primary/5'}`}></div>
        <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full transition-colors duration-1000 ${userRole === 'recruiter' ? 'bg-blue-500/5' : 'bg-primary/10'}`}></div>
      </div>

      <main className={`flex-1 overflow-hidden relative z-10 ${currentPage === 'chat' ? '' : 'pb-24'} h-full flex flex-col`}>
        {renderPage()}
      </main>
      {(!shouldForceOnboarding && currentPage !== 'chat') && (
        <BottomNav activePage={currentPage} onNavigate={setCurrentPage} role={userRole} />
      )}
      <InstallPWAPrompt />
      {showSplash && <JobeeSplashScreen isExiting={!loadingAuth} />}
    </div>
  );
};

export default App;
