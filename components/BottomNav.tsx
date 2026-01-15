import React from 'react';
import { Page } from '../types';
import { useSafePadding } from '../hooks/useSafePadding';
import { useKeyboardStatus } from '../hooks/useKeyboardStatus';

interface BottomNavProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  role?: 'candidate' | 'recruiter';
}

const BottomNav: React.FC<BottomNavProps> = ({ activePage, onNavigate, role = 'candidate' }) => {
  const isRecruiter = role === 'recruiter';
  const bottomPadding = useSafePadding({ basePadding: 1.5 });
  const { isKeyboardOpen } = useKeyboardStatus();

  const candidateTabs: { id: string; label: string; icon: string; central?: boolean }[] = [
    { id: 'dashboard', label: 'Início', icon: 'home' },
    { id: 'jobs', label: 'Vagas', icon: 'work' },
    { id: 'swipe', label: 'Explorar', icon: 'style', central: true }, // 'style' looks like cards stack
    { id: 'matches', label: 'Chat', icon: 'chat_bubble' },
    { id: 'profile', label: 'Perfil', icon: 'person' },
  ];

  const recruiterTabs: { id: string; label: string; icon: string; central?: boolean }[] = [
    { id: 'dashboard', label: 'Início', icon: 'home' },
    { id: 'swipe', label: 'Abrir Vaga', icon: 'add_circle' },
    { id: 'candidates', label: 'Match', icon: 'amp_stories', central: true },
    { id: 'matches', label: 'Chat', icon: 'chat_bubble' },
    { id: 'profile', label: 'Perfil', icon: 'person' },
  ];

  const tabs = isRecruiter ? recruiterTabs : candidateTabs;
  const activeColor = '#FACC15';

  return (
    <div
      className="fixed bottom-0 left-0 w-full z-[60] transition-transform duration-300 ease-in-out hide-when-short"
      style={{ transform: isKeyboardOpen ? 'translateY(100%)' : 'translateY(0)' }}
    >
      <div
        className="flex items-end justify-between w-full bg-[#0B0F1A] border-t border-white/10 px-6 pt-3 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        style={{ paddingBottom: bottomPadding }}
      >

        {/* Animated Glow Top Line */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-primary/50 to-transparent" />

        {tabs.map((tab) => {
          const isActive = activePage === tab.id;

          if (tab.central) {
            return (
              <button
                key={tab.id}
                onClick={() => onNavigate(tab.id as Page)}
                className={`
                  relative flex items-center justify-center -mt-10 mb-4
                  w-20 h-24 transition-all duration-500 active:scale-90 group
                `}
                style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }}
              >
                {/* Hexagon Background */}
                <div className={`
                    absolute inset-0 transition-all duration-500
                    ${isActive
                    ? `bg-gradient-to-br from-primary via-yellow-500 to-orange-500 shadow-[0_15px_30px_${activeColor}66]`
                    : 'bg-slate-800 border-2 border-white/5'}
                `} />

                {/* Inner Glow */}
                {isActive && (
                  <div className="absolute inset-0 animate-pulse bg-white/20 mix-blend-overlay" style={{ clipPath: 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)' }} />
                )}

                <span className={`material-symbols-outlined text-[36px] relative z-10 ${isActive ? 'text-[#0B0F1A] font-black scale-110 drop-shadow-lg' : 'text-white/40 group-hover:text-white'} transition-all duration-300`}>
                  {tab.icon}
                </span>

                {/* Pulse Ring Stimulation */}
                {isActive && (
                  <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping -z-10 blur-xl" />
                )}
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id as Page)}
              className={`
                flex flex-col items-center justify-center gap-1.5
                w-14 h-14 transition-all duration-300 relative
                ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-100'}
              `}
            >
              <span className={`
                  material-symbols-outlined text-[28px]
                  ${isActive ? (isRecruiter ? 'text-blue-400' : 'text-primary') : 'text-white'}
                  transition-transform duration-300 ${isActive ? 'scale-110 -translate-y-1' : 'scale-100'}
              `}>
                {tab.icon}
              </span>

              {isActive && (
                <div className={`w-1 h-1 rounded-full ${isRecruiter ? 'bg-blue-400' : 'bg-primary'} shadow-[0_0_8px_${activeColor}] animate-in zoom-in duration-300`} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
