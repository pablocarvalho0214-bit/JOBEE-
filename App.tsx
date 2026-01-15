import React, { useState, useEffect, Suspense } from 'react';
import { Page } from './types';
import BottomNav from './components/BottomNav';
import { JobeeSymbol, JobeeSplashScreen } from './components/JobeeIdentity';
import InstallPWAPrompt from './components/InstallPWAPrompt';
import { Match } from './types';
import { MOCK_MATCHES } from './constants';
import { supabase } from './services/supabaseClient';
import { useSafePadding } from './hooks/useSafePadding';
import { requestNativePermissions } from './services/nativePermissions';
import { ToastProvider, useToast } from './context/ToastContext';
import { useKeyboardStatus } from './hooks/useKeyboardStatus';

// Lazy Load Pages to optimize initial bundle size
const LoginPage = React.lazy(() => import('./pages/LoginPage'));
const ResetPasswordPage = React.lazy(() => import('./pages/ResetPasswordPage'));
const JobsPage = React.lazy(() => import('./pages/JobsPage'));
const SwipePage = React.lazy(() => import('./pages/SwipePage'));
const MatchesPage = React.lazy(() => import('./pages/MatchesPage'));
const ChatPage = React.lazy(() => import('./pages/ChatPage'));
const ProfilePage = React.lazy(() => import('./pages/ProfilePage'));
const CandidatesPage = React.lazy(() => import('./pages/CandidatesPage'));
const RecruiterDashboard = React.lazy(() => import('./pages/RecruiterDashboard'));
const RecruiterMatchPage = React.lazy(() => import('./pages/RecruiterMatchPage'));
const CandidateDashboard = React.lazy(() => import('./pages/CandidateDashboard'));
const RecruiterOnboarding = React.lazy(() => import('./pages/RecruiterOnboarding'));
const CandidateOnboarding = React.lazy(() => import('./pages/CandidateOnboarding'));
const CreateJobPage = React.lazy(() => import('./pages/CreateJobPage'));
const BrandPage = React.lazy(() => import('./pages/BrandPage'));

const App: React.FC = () => {
  const mainPadding = useSafePadding({ basePadding: 6 });
  const { isKeyboardOpen } = useKeyboardStatus();
  const [currentPage, setCurrentPage] = useState<Page>('login');
  const [matches, setMatches] = useState<Match[]>(MOCK_MATCHES);
  const [selectedMatchId, setSelectedMatchId] = useState<string>(MOCK_MATCHES[0].id);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [userRole, setUserRole] = useState<'candidate' | 'recruiter'>('candidate');
  const [isOnboardingCompleted, setIsOnboardingCompleted] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [showSplash, setShowSplash] = useState(true);
  const { showToast } = useToast();

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
        .select('*')
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

        // Construct optimized profile object
        const profileInfo = {
          id,
          db_avatar_url: data.avatar_url,
          db_full_name: data.full_name,
          db_metadata: data.metadata,
          db_company_name: data.company_name,
          db_company_logo: data.company_logo_url,
          db_company_color: data.metadata?.company_color || '#3B82F6',
          db_subscription_status: data.subscription_status || 'free',
          db_subscription_tier: data.subscription_tier || 'nectar',
          db_search_radius: data.search_radius || 50,
          db_skills: data.skills || []
        };
        setProfile(profileInfo);

        // Navigation logic based on database truth
        if (!data.onboarding_completed) {
          setCurrentPage('onboarding');
        } else {
          // If we are already on a main page, don't force redirect
          if (currentPage === 'login' || currentPage === 'onboarding') {
            // Try to restore last session
            const lastPage = localStorage.getItem('jobee_last_page') as Page;
            const lastMatchId = localStorage.getItem('jobee_last_match_id');

            if (lastPage && lastPage !== 'login' && lastPage !== 'reset-password') {
              // Restore context if needed
              if (lastPage === 'chat' && lastMatchId) setSelectedMatchId(lastMatchId);
              setCurrentPage(lastPage);
            } else {
              // Default Fallback
              setCurrentPage(data.role === 'recruiter' ? 'jobs' : 'dashboard');
            }
          }
        }
      } else {
        // Fallback to metadata if DB fails but user exists
        setIsOnboardingCompleted(!!onboardingCompleted);
        if (!onboardingCompleted) setCurrentPage('onboarding');
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      showToast('Erro ao carregar perfil. Verifique sua conexão.', 'error');
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

    // Request Native Permissions (Geolocation & Push Notifications)
    requestNativePermissions();

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

      setLoadingAuth(false);
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

  // PERSISTENCE: Save Navigation State
  useEffect(() => {
    // Only save "real" pages (not login/transition states)
    if (currentPage !== 'login' && currentPage !== 'reset-password') {
      localStorage.setItem('jobee_last_page', currentPage);
      if (selectedMatchId) localStorage.setItem('jobee_last_match_id', selectedMatchId);
    }
  }, [currentPage, selectedMatchId]);

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
              const isEdit = localStorage.getItem('onboarding_start_step_active');
              localStorage.removeItem('onboarding_start_step_active');
              if (isEdit) localStorage.setItem('return_to_edit_menu', 'true');
              setIsOnboardingCompleted(true);
              setCurrentPage(isEdit ? 'profile' : 'jobs');
            }}
          />
        ) : (
          <CandidateOnboarding
            onComplete={() => {
              const isEdit = localStorage.getItem('onboarding_start_step_active');
              localStorage.removeItem('onboarding_start_step_active');
              if (isEdit) localStorage.setItem('return_to_edit_menu', 'true');
              setIsOnboardingCompleted(true);
              setCurrentPage(isEdit ? 'profile' : 'dashboard');
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
                const isEdit = localStorage.getItem('onboarding_start_step_active');
                localStorage.removeItem('onboarding_start_step_active');
                if (isEdit) localStorage.setItem('return_to_edit_menu', 'true');
                setIsOnboardingCompleted(true);
                setCurrentPage(isEdit ? 'profile' : 'jobs');
              }}
            />
          ) : (
            <CandidateOnboarding
              onComplete={() => {
                const isEdit = localStorage.getItem('onboarding_start_step_active');
                localStorage.removeItem('onboarding_start_step_active');
                if (isEdit) localStorage.setItem('return_to_edit_menu', 'true');
                setIsOnboardingCompleted(true);
                setCurrentPage(isEdit ? 'profile' : 'dashboard');
              }}
            />
          )
        );
      case 'dashboard':
        return userRole === 'recruiter' ? null : (
          <CandidateDashboard
            onNavigate={setCurrentPage}
            onOpenChat={(m) => { setSelectedMatchId(m.id); setCurrentPage('chat'); }}
          />
        );
      case 'jobs':
        return userRole === 'recruiter' ? null : <JobsPage />;
      case 'candidates':
        return userRole === 'recruiter' ? <RecruiterMatchPage onNavigate={setCurrentPage} /> : <CandidatesPage />;
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
        return <ProfilePage initialProfile={profile} role={userRole} onNavigate={setCurrentPage} />;
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
        <main className="w-full h-full">
          <Suspense fallback={<JobeeSplashScreen />}>
            {renderPage()}
          </Suspense>
        </main>
      </>
    );
  }

  return (
    // "Mobile Frame" Simulator for Desktop View
    <div className="bg-[#050505] min-h-screen w-full flex justify-center lg:items-center font-sans overflow-hidden">
      <div className="w-full h-full min-h-[100dvh] lg:min-h-0 lg:h-[850px] lg:max-w-[430px] lg:rounded-[3rem] lg:border-[8px] lg:border-[#1a1a1a] shadow-2xl relative overflow-hidden bg-[#0B0F1A] flex flex-col">

        {/* Safe Area Top (Status Bar Simulation) - Only visible inside the frame */}
        <div className="absolute top-0 left-0 right-0 h-[env(safe-area-inset-top)] z-[9999] pointer-events-none" />

        {/* GLOBAL BACKGROUND TEXTURE */}
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>
          {/* Ambient Glow */}
          <div className={`absolute top-[-10%] left-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full transition-colors duration-1000 ${userRole === 'recruiter' ? 'bg-blue-500/10' : 'bg-primary/5'}`}></div>
          <div className={`absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] blur-[120px] rounded-full transition-colors duration-1000 ${userRole === 'recruiter' ? 'bg-blue-500/5' : 'bg-primary/10'}`}></div>
        </div>

        <main
          className={`flex-1 overflow-hidden relative z-10 h-full flex flex-col`}
          style={{ paddingBottom: currentPage === 'chat' ? '0px' : mainPadding }}
        >
          <Suspense fallback={<JobeeSplashScreen />}>
            {/* Recruiter Background Dashboard Persistence */}
            {userRole === 'recruiter' && (
              <div className={`absolute inset-0 ${(currentPage === 'dashboard' || currentPage === 'jobs' || currentPage === 'candidates' || (currentPage === 'swipe' && !isKeyboardOpen)) ? 'block' : 'hidden'} ${['dashboard', 'jobs'].includes(currentPage) ? 'z-20' : 'z-0'}`}>
                <RecruiterDashboard
                  onNavigate={setCurrentPage}
                  initialView={currentPage === 'jobs' || currentPage === 'candidates' || currentPage === 'swipe' ? 'jobs_list' : 'overview'}
                />
              </div>
            )}

            {/* Overlays or Other Pages */}
            <div className={`relative h-full flex flex-col ${['dashboard', 'jobs'].includes(currentPage) && userRole === 'recruiter' ? 'pointer-events-none opacity-0' : 'z-30'}`}>
              {renderPage()}
            </div>
          </Suspense>
        </main>

        {(!shouldForceOnboarding && currentPage !== 'chat') && (
          <BottomNav activePage={currentPage} onNavigate={setCurrentPage} role={userRole} />
        )}

        <InstallPWAPrompt />
        {showSplash && <JobeeSplashScreen isExiting={!loadingAuth} />}
      </div>
    </div>
  );
};

export default () => (
  <ToastProvider>
    <App />
  </ToastProvider>
);
