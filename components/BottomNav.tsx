
import React from 'react';
import { Page } from '../types';

interface BottomNavProps {
  activePage: Page;
  onNavigate: (page: Page) => void;
  role?: 'candidate' | 'recruiter';
}

const BottomNav: React.FC<BottomNavProps> = ({ activePage, onNavigate, role = 'candidate' }) => {
  const candidateTabs = [
    { id: 'dashboard', label: 'Início', icon: 'grid_view' },
    { id: 'jobs', label: 'Vagas', icon: 'work' },
    { id: 'swipe', label: 'Match', icon: 'style' },
    { id: 'matches', label: 'Conexões', icon: 'handshake' },
    { id: 'profile', label: 'Perfil', icon: 'person' },
  ];

  const recruiterTabs = [
    { id: 'jobs', label: 'Início', icon: 'grid_view' },
    { id: 'swipe', label: 'Vagas', icon: 'campaign' },
    { id: 'matches', label: 'Matches', icon: 'bolt' },
    { id: 'profile', label: 'Perfil', icon: 'person' },
  ];

  const tabs = role === 'recruiter' ? recruiterTabs : candidateTabs;
  const isRecruiter = role === 'recruiter';

  return (
    <nav className={`absolute bottom-[calc(env(safe-area-inset-bottom,0px)+1.5rem)] left-6 right-6 h-16 rounded-[2rem] border border-white/10 backdrop-blur-2xl flex justify-around items-center z-50 shadow-2xl transition-all duration-500 ${isRecruiter ? 'bg-blue-900/40' : 'bg-secondary/40'}`}>
      {tabs.map((tab) => {
        const isActive = activePage === tab.id;
        const activeColor = isRecruiter ? 'text-blue-400' : 'text-primary';

        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id as Page)}
            className={`flex flex-col items-center gap-1 min-w-[64px] transition-all duration-300 transform ${isActive ? 'scale-110' : 'scale-100 opacity-40'}`}
          >
            <span className={`material-symbols-outlined text-[20px] ${isActive ? (isRecruiter ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]' : 'text-primary drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]') : 'text-white'}`}>
              {tab.icon}
            </span>
            <span className={`text-[8px] font-black uppercase tracking-widest ${isActive ? 'text-white' : 'text-white/40'}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};

export default BottomNav;
