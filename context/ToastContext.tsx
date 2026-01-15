import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastMessage {
    id: string;
    message: string;
    type: ToastType;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within a ToastProvider');
    }
    return context;
};

export const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);

    const showToast = useCallback((message: string, type: ToastType = 'info') => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, message, type }]);

        // Auto remove after 3 seconds
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 3000);
    }, []);

    return (
        <ToastContext.Provider value={{ showToast }}>
            {children}
            <div className="fixed top-12 left-0 right-0 z-[10000] flex flex-col items-center gap-2 pointer-events-none px-6">
                {toasts.map(toast => (
                    <div
                        key={toast.id}
                        className={`
                            px-6 py-3 rounded-2xl shadow-2xl border backdrop-blur-md
                            flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto
                            ${toast.type === 'success' ? 'bg-green-500/20 border-green-500/30 text-green-400' : ''}
                            ${toast.type === 'error' ? 'bg-red-500/20 border-red-500/30 text-red-400' : ''}
                            ${toast.type === 'info' ? 'bg-blue-500/20 border-blue-500/30 text-blue-400' : ''}
                            ${toast.type === 'warning' ? 'bg-orange-500/20 border-orange-500/30 text-orange-400' : ''}
                        `}
                    >
                        <span className="material-symbols-outlined text-xl">
                            {toast.type === 'success' && 'check_circle'}
                            {toast.type === 'error' && 'error'}
                            {toast.type === 'info' && 'info'}
                            {toast.type === 'warning' && 'warning'}
                        </span>
                        <p className="text-xs font-black uppercase tracking-widest">{toast.message}</p>
                    </div>
                ))}
            </div>
        </ToastContext.Provider>
    );
};
