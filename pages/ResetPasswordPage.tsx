
import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import BeeLogo from '../components/BeeLogo';

interface ResetPasswordPageProps {
    onComplete: () => void;
}

const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ onComplete }) => {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (password.length < 6) {
            setMessage('Erro: A senha deve ter no mínimo 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            setMessage('Erro: As senhas não coincidem');
            return;
        }

        setLoading(true);
        setMessage('');

        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            const errorMsg = error.message === 'New password should be different from the old password'
                ? 'A nova senha deve ser diferente da senha atual'
                : error.message;
            setMessage(`Erro: ${errorMsg}`);
        } else {
            setMessage('Senha atualizada com sucesso! Redirecionando...');
            setTimeout(() => {
                onComplete();
            }, 2000);
        }
        setLoading(false);
    };

    return (
        <div className="flex min-h-screen w-full flex-col bg-secondary overflow-hidden max-w-md mx-auto shadow-2xl relative font-sans">
            {/* Background - Using Recruiter bg for general maintenance look or just consistent theme */}
            <div className="absolute inset-0 transition-all duration-1000">
                <img
                    src="/assets/bg-recruiter.png"
                    className="w-full h-full object-cover opacity-80"
                    alt="background"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-secondary/40 to-secondary transition-colors duration-1000"></div>
            </div>

            <div className="flex flex-1 flex-col justify-center px-6 z-10">
                <div className="flex flex-col items-center text-center mb-8 animate-in fade-in slide-in-from-top-10 duration-1000">
                    <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-3xl bg-white shadow-2xl transition-transform hover:scale-110 duration-500">
                        <BeeLogo size={80} />
                    </div>
                    <h4 className="text-xs font-black uppercase tracking-[0.4em] mb-1 drop-shadow-lg text-primary">Jobee Recovery</h4>
                    <h1 className="text-white text-3xl font-black leading-tight tracking-tight drop-shadow-md mb-2">
                        Nova Senha
                    </h1>
                    <p className="text-gray-200 text-sm font-medium drop-shadow animate-in fade-in duration-1000 delay-300">
                        Crie uma senha forte para sua colmeia.
                    </p>
                </div>

                <form
                    onSubmit={handleResetPassword}
                    className="w-full space-y-5 transition-all duration-1000 p-8 rounded-[2.5rem] shadow-2xl bg-white/5 backdrop-blur-3xl border border-white/10"
                >
                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-white/70 uppercase tracking-widest ml-1">Nova Senha</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="h-12 w-full rounded-2xl border border-white/20 bg-white/10 px-5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white/20 transition-all text-sm"
                            required
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-[10px] font-black text-white/70 uppercase tracking-widest ml-1">Confirmar Senha</label>
                        <input
                            type="password"
                            placeholder="••••••••"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="h-12 w-full rounded-2xl border border-white/20 bg-white/10 px-5 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-white/20 transition-all text-sm"
                            required
                        />
                    </div>

                    {message && (
                        <div className={`p-4 rounded-xl text-center bg-white/5 text-white border border-white/10 animate-pulse text-[10px] font-black uppercase tracking-wider ${message.startsWith('Erro') ? 'text-red-400' : 'text-primary'}`}>
                            {message}
                        </div>
                    )}

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="h-16 w-full rounded-2xl font-black shadow-2xl transition-all duration-300 transform active:scale-95 disabled:opacity-50 bg-primary text-secondary"
                        >
                            {loading ? 'ATUALIZANDO...' : 'REDEFINIR SENHA'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ResetPasswordPage;
