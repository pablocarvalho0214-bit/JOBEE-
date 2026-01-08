import React, { useState, useEffect } from 'react';
import { JobeeSymbol } from './JobeeIdentity';

interface BeforeInstallPromptEvent extends Event {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const InstallPWAPrompt: React.FC = () => {
    const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Check if already installed (standalone mode)
        const checkStandalone = window.matchMedia('(display-mode: standalone)').matches
            || (window.navigator as any).standalone
            || document.referrer.includes('android-app://');

        setIsStandalone(checkStandalone);

        // Check if iOS
        const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIOS(isIOSDevice);

        // Check if user has dismissed the prompt before
        const dismissed = localStorage.getItem('pwa-prompt-dismissed');
        const dismissedTime = dismissed ? parseInt(dismissed) : 0;
        const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

        // Show again after 7 days
        if (dismissed && daysSinceDismissed < 7) {
            return;
        }

        // For iOS, show custom prompt after a short delay
        if (isIOSDevice && !checkStandalone) {
            const timer = setTimeout(() => setShowPrompt(true), 3000);
            return () => clearTimeout(timer);
        }

        // For Android/Chrome, listen for beforeinstallprompt
        const handler = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e as BeforeInstallPromptEvent);
            // Show prompt after a short delay
            setTimeout(() => setShowPrompt(true), 2000);
        };

        window.addEventListener('beforeinstallprompt', handler);

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstall = async () => {
        if (deferredPrompt) {
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            if (outcome === 'accepted') {
                setShowPrompt(false);
            }
            setDeferredPrompt(null);
        }
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('pwa-prompt-dismissed', Date.now().toString());
    };

    // Don't show if already installed or not on mobile
    if (isStandalone || !showPrompt) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-[9999] flex items-end justify-center p-4 pointer-events-none">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
                onClick={handleDismiss}
            />

            {/* Prompt Card */}
            <div className="relative w-full max-w-md bg-gradient-to-br from-[#1a1f2e] to-[#0d1117] rounded-3xl p-6 shadow-2xl border border-white/10 pointer-events-auto animate-slide-up mb-4">
                {/* Close button */}
                <button
                    onClick={handleDismiss}
                    className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                >
                    <span className="material-symbols-outlined text-white/70 text-lg">close</span>
                </button>

                {/* Content */}
                <div className="flex flex-col items-center text-center">
                    {/* Logo */}
                    <div className="w-20 h-20 bg-white rounded-2xl shadow-lg flex items-center justify-center mb-4">
                        <JobeeSymbol size={56} mode="color" />
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-2">
                        Adicione o <span className="text-primary">Jobee</span> à sua tela inicial
                    </h3>

                    {/* Description */}
                    <p className="text-gray-400 text-sm mb-6 leading-relaxed">
                        Tenha acesso rápido ao Jobee diretamente do seu celular, como um app nativo!
                    </p>

                    {isIOS ? (
                        // iOS Instructions
                        <div className="w-full bg-white/5 rounded-2xl p-4 mb-4">
                            <p className="text-white text-sm font-medium mb-3">Como instalar:</p>
                            <div className="flex items-center gap-3 text-left">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary font-bold text-sm">1</span>
                                </div>
                                <p className="text-gray-300 text-sm">
                                    Toque no ícone <span className="inline-flex items-center mx-1 px-2 py-0.5 bg-white/10 rounded text-white">
                                        <span className="material-symbols-outlined text-base">ios_share</span>
                                    </span> abaixo
                                </p>
                            </div>
                            <div className="flex items-center gap-3 text-left mt-3">
                                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                                    <span className="text-primary font-bold text-sm">2</span>
                                </div>
                                <p className="text-gray-300 text-sm">
                                    Selecione <span className="font-semibold text-white">"Adicionar à Tela de Início"</span>
                                </p>
                            </div>
                        </div>
                    ) : (
                        // Android/Chrome Install Button
                        <button
                            onClick={handleInstall}
                            className="w-full py-4 bg-gradient-to-r from-primary to-amber-500 text-secondary font-bold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">download</span>
                            Instalar Aplicativo
                        </button>
                    )}

                    {/* Dismiss link */}
                    <button
                        onClick={handleDismiss}
                        className="mt-4 text-gray-500 text-sm hover:text-gray-400 transition-colors"
                    >
                        Agora não
                    </button>
                </div>

                {/* Decorative glow */}
                <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
            </div>

            <style>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slide-up {
          animation: slide-up 0.4s ease-out forwards;
        }
      `}</style>
        </div>
    );
};

export default InstallPWAPrompt;
