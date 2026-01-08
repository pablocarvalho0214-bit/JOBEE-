
import React, { useState, useEffect, useRef } from 'react';
import { Match } from '../types';
import { getRecruiterResponse } from '../services/geminiService';

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'recruiter' | 'system';
    timestamp: string;
}

interface ChatPageProps {
    match: Match;
    onBack: () => void;
    onScheduled: (dateInfo: string) => void;
    role?: 'candidate' | 'recruiter';
}

const ChatPage: React.FC<ChatPageProps> = ({ match, onBack, onScheduled, role = 'candidate' }) => {
    const STORAGE_KEY = `jobmatch_chat_${match.id}`;
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isScheduled, setIsScheduled] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const isRecruiter = role === 'recruiter';
    const roleColor = isRecruiter ? 'text-blue-400' : 'text-primary';
    const roleBg = isRecruiter ? 'bg-blue-500' : 'bg-primary';

    useEffect(() => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const { messages: savedMessages, isScheduled: savedScheduled } = JSON.parse(savedData);
            setMessages(savedMessages);
            setIsScheduled(savedScheduled);
        } else {
            setMessages([
                {
                    id: '1',
                    text: `Olá! Vimos o seu interesse na ${match.companyName}. Adoraríamos marcar uma conversa breve. Qual o melhor horário para você?`,
                    sender: 'recruiter',
                    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }
            ]);
        }
    }, [match.id, STORAGE_KEY]);

    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, isScheduled }));
        }
    }, [messages, isScheduled, STORAGE_KEY]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleSendMessage = async () => {
        if (!inputText.trim() || isTyping) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: inputText,
            sender: 'user',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const newHistory = [...messages, userMsg];
        setMessages(newHistory);
        setInputText('');
        setIsTyping(true);

        try {
            const recruiterText = await getRecruiterResponse(
                newHistory.filter(m => m.sender !== 'system') as any,
                match.companyName
            );

            const hasScheduledTag = recruiterText.includes('[AGENDADO]');
            const cleanText = recruiterText.replace('[AGENDADO]', '').trim();

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: cleanText,
                sender: 'recruiter',
                timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setIsTyping(false);
            setMessages(prev => [...prev, botMsg]);

            if (hasScheduledTag) {
                setIsScheduled(true);
                onScheduled(cleanText);
                setTimeout(() => {
                    setMessages(prev => [...prev, {
                        id: 'sys-' + Date.now(),
                        text: "✅ Entrevista agendada! Você ainda pode usar o chat para tirar dúvidas ou remarcar.",
                        sender: 'system',
                        timestamp: ''
                    }]);
                }, 800);
            }
        } catch (error) {
            setIsTyping(false);
        }
    };

    return (
        <div className="flex flex-col h-[100dvh] bg-secondary text-white relative overflow-hidden font-sans">
            {/* Background Texture & Glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className={`absolute top-[-10%] right-[-10%] w-[50%] h-[50%] ${isRecruiter ? 'bg-blue-500/10' : 'bg-primary/10'} blur-[120px] rounded-full`}></div>
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            </div>

            {/* Header - Fixed/Sticky and with safe area padding */}
            <header className="sticky top-0 z-[50] flex items-center gap-2 p-4 pt-14 bg-secondary/80 backdrop-blur-3xl border-b border-white/10 shadow-2xl">
                <button
                    onClick={onBack}
                    className="flex items-center gap-2 px-3 py-2 bg-white/10 rounded-2xl border border-white/20 hover:bg-white/20 transition-all active:scale-95 group shrink-0"
                >
                    <span className={`material-symbols-outlined ${roleColor} text-[18px] group-hover:-translate-x-1 transition-transform`}>arrow_back</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-white/70">Voltar</span>
                </button>
                <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-white/5 p-0.5 border border-white/10 overflow-hidden">
                        <img src={match.companyLogo} className="w-full h-full rounded-[10px] object-cover" alt={match.companyName} />
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 border-2 border-secondary rounded-full ${isTyping ? (isRecruiter ? 'bg-blue-500 animate-pulse' : 'bg-primary animate-pulse') : 'bg-green-500'}`}></div>
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-xs font-black uppercase tracking-tight text-white leading-tight truncate">{match.companyName}</h2>
                    <p className={`text-[7px] font-black uppercase tracking-widest ${isTyping ? roleColor : 'text-white/30'}`}>
                        {isTyping ? 'Sincronizando...' : 'Conexão Ativa'}
                    </p>
                </div>
                {isScheduled && (
                    <div className={`px-2.5 py-1 rounded-full text-[7px] font-black uppercase tracking-widest flex items-center gap-1 shadow-xl border ${isRecruiter ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-primary/20 text-primary border-primary/30'}`}>
                        <span className="material-symbols-outlined text-[12px] filled">calendar_today</span>
                        Agenda
                    </div>
                )}
            </header>

            {/* Messages */}
            <main className="relative z-10 flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} ${msg.sender === 'system' ? 'justify-center' : ''} animate-in slide-in-from-bottom-2 duration-300`}
                    >
                        {msg.sender === 'system' ? (
                            <div className="bg-white/5 backdrop-blur-md text-[9px] font-black uppercase tracking-widest text-primary px-6 py-2.5 rounded-full border border-white/5 shadow-xl">
                                {msg.text}
                            </div>
                        ) : (
                            <div className={`max-w-[85%] p-5 rounded-[2rem] shadow-2xl text-xs font-medium leading-relaxed border ${msg.sender === 'user'
                                ? `${isRecruiter ? 'bg-blue-500 border-blue-400' : 'bg-primary border-primary'} text-secondary rounded-tr-none`
                                : 'bg-white/5 text-white/80 border-white/5 rounded-tl-none backdrop-blur-xl'
                                }`}>
                                <p>{msg.text}</p>
                                <div className={`flex items-center justify-end gap-1 mt-2 opacity-50 text-[8px] font-black uppercase tracking-widest ${msg.sender === 'user' ? 'text-secondary' : 'text-white/40'}`}>
                                    {msg.timestamp}
                                    {msg.sender === 'user' && <span className="material-symbols-outlined text-[12px]">done_all</span>}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
                {isTyping && (
                    <div className="flex justify-start animate-in fade-in duration-300">
                        <div className="bg-white/5 backdrop-blur-xl p-4 rounded-3xl rounded-tl-none border border-white/5 flex gap-1.5 shadow-xl">
                            <div className={`w-1.5 h-1.5 ${roleBg} rounded-full animate-bounce`}></div>
                            <div className={`w-1.5 h-1.5 ${roleBg} rounded-full animate-bounce [animation-delay:0.2s]`}></div>
                            <div className={`w-1.5 h-1.5 ${roleBg} rounded-full animate-bounce [animation-delay:0.4s]`}></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </main>

            {/* Input Overlay for Glass feel */}
            <div className="relative z-20 pb-10 px-6">
                <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-2 flex items-center gap-2 focus-within:ring-2 focus-within:ring-white/10 transition-all shadow-2xl">
                    <button className="w-12 h-12 flex items-center justify-center text-white/20 hover:text-white transition-colors">
                        <span className="material-symbols-outlined font-black">add_circle</span>
                    </button>
                    <input
                        type="text"
                        placeholder={isScheduled ? "Dúvidas ou remarcação..." : "Escreva sua mensagem..."}
                        className="flex-1 bg-transparent border-none focus:ring-0 text-[10px] font-black uppercase tracking-widest text-white placeholder-white/20 px-2"
                        value={inputText}
                        disabled={isTyping}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                    />
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputText.trim() || isTyping}
                        className={`w-12 h-12 flex items-center justify-center rounded-[1.5rem] transition-all transform active:scale-90 ${inputText.trim() && !isTyping
                            ? `${isRecruiter ? 'bg-blue-500 text-secondary' : 'bg-primary text-secondary'} shadow-xl`
                            : 'bg-white/5 text-white/10'
                            }`}
                    >
                        <span className="material-symbols-outlined font-black text-[20px]">send</span>
                    </button>
                </div>
            </div>

            <style>{`
                .scrollbar-hide::-webkit-scrollbar { display: none; }
                .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
            `}</style>
        </div>
    );
};

export default ChatPage;
