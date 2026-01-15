
import React, { useState, useEffect, useRef } from 'react';
import { getBeeaResponse } from '../services/geminiService';

interface Message {
    text: string;
    sender: 'user' | 'bee';
    timestamp: Date;
}

interface BeeaChatProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BeeaChat: React.FC<BeeaChatProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Swipe-to-dismiss logic
    const [dragY, setDragY] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const startY = useRef(0);

    const helpCategories = [
        { id: 'SWIPE', icon: 'ads_click', label: 'Swipe & Match' },
        { id: 'PLANOS', icon: 'loyalty', label: 'Planos & Preços' },
        { id: 'VAGA', icon: 'campaign', label: 'Anunciar Vagas' },
        { id: 'PERFIL', icon: 'person_edit', label: 'Editar Perfil' },
        { id: 'SEGURANCA', icon: 'security', label: 'Segurança' },
        { id: 'FAMILIA', icon: 'family_history', label: 'Quem é a Beea?' }
    ];

    useEffect(() => {
        if (isOpen && messages.length === 0) {
            setMessages([
                {
                    text: "Zzz-Olá! Sou a Beea. Escolha um tópico abaixo ou me conte o que você procura! 🐝",
                    sender: 'bee',
                    timestamp: new Date()
                }
            ]);
        }
    }, [isOpen]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isTyping]);

    const handleAction = async (topicId: string, label: string) => {
        sendMessage(label);
    };

    const sendMessage = async (text: string) => {
        if (!text.trim() || isTyping) return;

        const userMsg: Message = { text, sender: 'user', timestamp: new Date() };
        setMessages(prev => [...prev, userMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            const responseText = await getBeeaResponse(text, []);
            setMessages(prev => [...prev, { text: responseText, sender: 'bee', timestamp: new Date() }]);
        } catch (error) {
            setMessages(prev => [...prev, { text: "Zzz-Ops! Tive um curto-circuito. Tente outro tópico! 🐝", sender: 'bee', timestamp: new Date() }]);
        } finally {
            setIsTyping(false);
        }
    };

    const resetToMenu = () => {
        setMessages([
            {
                text: "Zzz-Olá! Sou a Beea. Escolha um tópico abaixo ou me conte o que você procura! 🐝",
                sender: 'bee',
                timestamp: new Date()
            }
        ]);
        setInputValue('');
    };

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
        if (dragY > 150) {
            onClose();
            setTimeout(() => setDragY(0), 300);
        } else {
            setDragY(0);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[500] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={onClose} />

            <div
                className={`relative w-full max-w-lg h-full sm:h-[650px] bg-[#0B0F1A] flex flex-col overflow-hidden sm:rounded-[3rem] shadow-2xl border-t sm:border border-white/10 ${!isDragging ? 'transition-transform duration-300' : ''}`}
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
                {/* Drag Handle */}
                <div className="absolute top-0 left-0 right-0 h-8 flex items-center justify-center pointer-events-none z-50">
                    <div className="w-12 h-1 bg-white/10 rounded-full" />
                </div>

                {/* Header Premium */}
                <div className="p-8 pt-10 border-b border-white/5 bg-gradient-to-br from-amber-500/20 via-transparent to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 overflow-hidden shadow-lg shadow-amber-500/20">
                                <img
                                    src="/beea-avatar-new.jpg"
                                    className="w-full h-full object-cover"
                                    alt="Beea"
                                />
                            </div>
                            <div>
                                <h3 className="text-white font-black text-2xl tracking-tighter uppercase leading-tight">Beea</h3>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-amber-500/60 text-[10px] font-black uppercase tracking-[0.2em]">Online agora</span>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={resetToMenu}
                                className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-amber-500 hover:bg-amber-500/10 transition-all group"
                                title="Voltar ao Menu"
                            >
                                <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">grid_view</span>
                            </button>
                            <button
                                onClick={onClose}
                                className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
                            >
                                <span className="material-symbols-outlined">close</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Messages & Menu Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                    {messages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] p-5 rounded-[2rem] text-sm leading-relaxed shadow-xl ${msg.sender === 'user'
                                ? 'bg-amber-500 text-black font-bold rounded-tr-none'
                                : 'bg-white/5 text-white/90 border border-white/10 rounded-tl-none backdrop-blur-xl'
                                }`}>
                                {msg.text}
                            </div>
                        </div>
                    ))}

                    {/* Interactive Menu (Shown when no active typing) */}
                    {!isTyping && messages.length <= 2 && (
                        <div className="grid grid-cols-2 gap-3 mt-4 animate-in fade-in zoom-in duration-700 delay-300">
                            {helpCategories.map((cat) => (
                                <button
                                    key={cat.id}
                                    onClick={() => handleAction(cat.id, cat.label)}
                                    className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all group flex flex-col items-center text-center gap-2"
                                >
                                    <span className="material-symbols-outlined text-amber-500 group-hover:scale-110 transition-transform">
                                        {cat.icon}
                                    </span>
                                    <span className="text-[10px] font-black text-white/60 uppercase tracking-tighter group-hover:text-white">
                                        {cat.label}
                                    </span>
                                </button>
                            ))}
                        </div>
                    )}

                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl animate-pulse flex gap-1">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce" />
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-100" />
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-bounce delay-200" />
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-8 bg-[#0D111A] border-t border-white/5">
                    <div className="flex gap-3 bg-white/5 p-2 rounded-[2rem] border border-white/10 focus-within:border-amber-500/50 transition-all shadow-inner">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && sendMessage(inputValue)}
                            placeholder="Zumbir uma dúvida..."
                            className="flex-1 bg-transparent px-5 py-3 text-white placeholder:text-white/20 text-sm outline-none"
                        />
                        <button
                            onClick={() => sendMessage(inputValue)}
                            disabled={!inputValue.trim() || isTyping}
                            className="w-12 h-12 rounded-full bg-amber-500 text-black flex items-center justify-center shadow-lg shadow-amber-500/20 active:scale-90 disabled:opacity-20 transition-all"
                        >
                            <span className="material-symbols-outlined font-black">send</span>
                        </button>
                    </div>
                    <p className="text-[8px] text-center text-white/10 uppercase font-black tracking-[.3em] mt-6">
                        Beea v2.4 • Suporte Inteligente Jobee
                    </p>
                </div>
            </div>
        </div>
    );
};
