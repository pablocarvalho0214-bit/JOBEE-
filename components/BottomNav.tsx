
import React from 'react';
import { Page } from '../types';

interface BottomNavProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  role?: 'candidate' | 'recruiter';
}

const BottomNav: React.FC<BottomNavProps> = ({ activePage, onNavigate, role = 'candidate' }) => {
  const isRecruiter = role === 'recruiter';

  const candidateTabs: { id: string; label: string; icon: string; central?: boolean }[] = [
    { id: 'dashboard', label: 'Início', icon: 'home' },
    { id: 'jobs', label: 'Vagas', icon: 'work' },
    { id: 'swipe', label: 'Explorar', icon: 'style', central: true }, // 'style' looks like cards stack
    { id: 'matches', label: 'Chat', icon: 'chat_bubble' },
    { id: 'profile', label: 'Perfil', icon: 'person' },
  ];

  const recruiterTabs: { id: string; label: string; icon: string; central?: boolean }[] = [
    { id: 'jobs', label: 'Início', icon: 'home' },
    { id: 'swipe', label: 'Divulgar', icon: 'add_circle' },
    { id: 'matches', label: 'Chat', icon: 'chat_bubble' },
    { id: 'profile', label: 'Perfil', icon: 'person' },
  ];

  const tabs = isRecruiter ? recruiterTabs : candidateTabs;
  const activeColor = isRecruiter ? '#60A5FA' : '#FACC15';

  return (
    <div className="absolute bottom-0 left-0 w-full z-[60]">
      <div className="flex items-end justify-between w-full bg-[#0B0F1A] border-t border-white/10 px-6 pb-6 pt-3 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">

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
                  relative flex items-center justify-center -mt-8
                  w-16 h-16 rounded-full transition-all duration-500
                  ${isActive
                    ? `bg-gradient-to-br ${isRecruiter ? 'from-blue-500 to-blue-700' : 'from-yellow-400 to-yellow-600'} shadow-[0_10px_30px_${activeColor}66] scale-110`
                    : 'bg-slate-800 border border-white/10 shadow-lg text-white/60 hover:text-white'}
                `}
              >
                <span className={`material-symbols-outlined text-[32px] ${isActive ? 'text-[#0B0F1A] font-black' : ''}`}>
                  {tab.icon}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id as Page)}
              className={`
                flex flex-col items-center justify-center gap-1
                w-12 h-12 rounded-2xl transition-all duration-300
                ${isActive ? 'opacity-100' : 'opacity-40 hover:opacity-70'}
              `}
            >
              <span className={`
                  material-symbols-outlined text-[26px]
                  ${isActive ? (isRecruiter ? 'text-blue-400' : 'text-primary') : 'text-white'}
              `}>
                {tab.icon}
              </span>

              <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-white scale-100' : 'text-white/0 scale-0 hidden'}`}>
                {tab.label === 'Início' ? 'Home' : tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default BottomNav;
