import React, { useState, useEffect, useRef } from 'react';
import { Match } from '../types';

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
    const isRecruiter = role === 'recruiter';

    const APP_LOGO = '/assets/icon.svg';
    const displayName = isRecruiter ? (match.candidateName || 'Candidato') : match.companyName;
    const displayAvatar = isRecruiter ? (match.candidateAvatar || APP_LOGO) : (match.companyLogo || APP_LOGO);
    const displaySubtitle = isRecruiter ? (match.candidateRole || 'Bee') : 'Assistente Virtual';

    const accentColor = isRecruiter ? 'text-blue-400' : 'text-primary';
    const accentBg = isRecruiter ? 'bg-blue-500' : 'bg-primary';
    const accentGlow = isRecruiter ? 'shadow-blue-500/20' : 'shadow-primary/20';

    const isSupport = match.companyName.toLowerCase().includes('jobee') || match.companyName.toLowerCase().includes('beea');

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const [isScheduled, setIsScheduled] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Swipe interaction
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);

    const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
        setIsDragging(true);
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        startY.current = clientY - dragY;
    };

    const handleTouchMove = (e: React.TouchEvent | React.MouseEvent) => {
        if (!isDragging) return;
        const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
        const newY = Math.max(0, clientY - startY.current);
        setDragY(newY);
    };

    const handleTouchEnd = () => {
        setIsDragging(false);
        if (dragY > 150) onBack();
        else setDragY(0);
    };

    useEffect(() => {
        const savedData = localStorage.getItem(STORAGE_KEY);
        if (savedData) {
            const { messages: msgs, isScheduled: sched } = JSON.parse(savedData);
            setMessages(msgs);
            setIsScheduled(sched);
        } else {
            const initialText = isSupport
                ? "Bzzz! Olá, sou a Beea. Como posso zumbir para te ajudar?"
                : `Olá! Sou o assistente automático da ${match.companyName}. Em breve um humano assumirá, mas enquanto isso, pode me perguntar algo!`;
            setMessages([{ id: '1', text: initialText, sender: 'recruiter', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        }
    }, [match.id, STORAGE_KEY, isSupport]);

    useEffect(() => {
        if (messages.length > 0) localStorage.setItem(STORAGE_KEY, JSON.stringify({ messages, isScheduled: false }));
    }, [messages, STORAGE_KEY]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const processMessage = async (text: string) => {
        if (!text.trim()) return;
        const userMsg: Message = { id: Date.now().toString(), text, sender: 'user', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            const botMsg: Message = { id: (Date.now() + 1).toString(), text: "Recebi sua mensagem! Vou avisar a colmeia agora mesmo. 🐝", sender: 'recruiter', timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
            setMessages(prev => [...prev, botMsg]);
        }, 1500);
    };

    return (
        <div
            className={`fixed inset-0 flex flex-col bg-[#0B0F1A] text-white overflow-hidden font-sans z-[9999] ${!isDragging ? 'transition-transform duration-300' : ''}`}
            style={{ transform: `translateY(${dragY}px)`, cursor: isDragging ? 'grabbing' : 'default' }}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onMouseDown={handleTouchStart}
            onMouseMove={handleTouchMove}
            onMouseUp={handleTouchEnd}
            onMouseLeave={handleTouchEnd}
        >
            {/* AMBIENT BACKGROUND */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[10%] right-[-10%] w-[60%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full rotate-45" />
                <div className="absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='%23ffffff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
                    backgroundSize: '30px 52px'
                }} />
            </div>

            {/* Premium Sticky Header (WhatsApp Style) */}
            <header className="sticky top-0 z-[100] bg-[#0A0D14]/95 backdrop-blur-3xl border-b border-white/5 pt-[env(safe-area-inset-top)] shrink-0">
                {/* Drag Handle Area */}
                <div className="h-6 flex items-center justify-center pointer-events-none">
                    <div className="w-12 h-1 bg-white/10 rounded-full" />
                </div>

                <div className="px-5 pb-5 flex items-center gap-3">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-white/40 active:bg-white/5 transition-all"
                    >
                        <span className="material-symbols-outlined text-[28px]">chevron_left</span>
                    </button>

                    <div className="relative shrink-0">
                        <div className={`w-11 h-11 rounded-full bg-white/5 p-0.5 border border-white/10 overflow-hidden shadow-xl ${accentGlow}`}>
                            <img src={displayAvatar} className="w-full h-full rounded-full object-cover" alt={displayName} />
                        </div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 border-2 border-[#0A0D14] rounded-full bg-green-500 shadow-lg" />
                    </div>

                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-black uppercase tracking-tight text-white leading-tight truncate">
                            {displayName}
                        </h2>
                        <span className={`${accentColor} text-[8px] font-black uppercase tracking-[0.2em] opacity-60`}>
                            {isTyping ? 'Zumbindo...' : displaySubtitle}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {isScheduled && (
                            <div className={`w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center ${accentColor}`}>
                                <span className="material-symbols-outlined text-[18px]">event</span>
                            </div>
                        )}
                        <button className="w-10 h-10 rounded-full flex items-center justify-center text-white/20">
                            <span className="material-symbols-outlined text-[20px]">more_vert</span>
                        </button>
                    </div>
                </div>
            </header>

            {/* Scrollable Message List */}
            <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 scrollbar-hide relative z-10 overscroll-contain">
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-500`}>
                        <div className={`max-w-[85%] flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                            <div className={`relative px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-lg border ${msg.sender === 'user'
                                ? `${accentBg} border-white/10 text-secondary font-bold rounded-tr-none shadow-black/20`
                                : 'bg-white/[0.07] text-white/90 border-white/5 rounded-tl-none backdrop-blur-md'
                                }`}>
                                <p className="whitespace-pre-line">{msg.text}</p>
                            </div>
                            <span className="mt-1.5 px-1 text-[8px] font-black uppercase tracking-widest opacity-20">
                                {msg.timestamp}
                            </span>
                        </div>
                    </div>
                ))}

                {isTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1 shadow-md">
                            <span className={`w-1.5 h-1.5 ${accentBg} rounded-full animate-bounce`} />
                            <span className={`w-1.5 h-1.5 ${accentBg} rounded-full animate-bounce [animation-delay:0.2s]`} />
                            <span className={`w-1.5 h-1.5 ${accentBg} rounded-full animate-bounce [animation-delay:0.4s]`} />
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} className="h-4" />
            </main>

            {/* Fixed Bottom Input Area */}
            <div className="relative z-20 bg-[#0A0D14] border-t border-white/5 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] shrink-0">
                <div className="flex gap-3 items-center">
                    <button className="w-10 h-10 rounded-full flex items-center justify-center text-white/20 hover:text-white transition-colors">
                        <span className="material-symbols-outlined text-[24px]">add</span>
                    </button>

                    <div className="flex-1 flex gap-2 bg-white/5 px-4 py-2 rounded-[1.8rem] border border-white/10 focus-within:border-white/20 transition-all items-center">
                        <input
                            type="text"
                            placeholder="Zumbir mensagem..."
                            className="flex-1 bg-transparent text-white placeholder:text-white/20 text-[14px] outline-none font-medium h-6"
                            value={inputText}
                            disabled={isTyping}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && processMessage(inputText)}
                        />
                    </div>

                    <button
                        onClick={() => processMessage(inputText)}
                        disabled={!inputText.trim() || isTyping}
                        className={`w-11 h-11 rounded-full flex items-center justify-center shadow-xl transition-all active:scale-90 disabled:opacity-20 ${inputText.trim() ? `${accentBg} text-secondary` : 'bg-white/10 text-white/20'}`}
                    >
                        <span className="material-symbols-outlined font-black text-[22px]">send</span>
                    </button>
                </div>
            </div>

            <style>{`.scrollbar-hide::-webkit-scrollbar { display: none; }`}</style>
        </div>
    );
};

export default ChatPage;
