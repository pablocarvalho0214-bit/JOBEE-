
import React, { useState, useEffect, useRef } from 'react';
import { getBeeaResponse } from '../services/geminiService';

interface Message {
    text: string;
    sender: 'user' | 'bee';
    timestamp: Date;
    image?: string;
}

interface BeeaChatProps {
    isOpen: boolean;
    onClose: () => void;
}

export const BeeaChat: React.FC<BeeaChatProps> = ({ isOpen, onClose }) => {
    const STORAGE_KEY = 'jobbee_beea_chat_history';
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial load from localStorage
    useEffect(() => {
        const savedMessages = localStorage.getItem(STORAGE_KEY);
        if (savedMessages) {
            try {
                const parsed = JSON.parse(savedMessages);
                // Convert string timestamps back to Date objects
                const withDates = parsed.map((m: any) => ({
                    ...m,
                    timestamp: new Date(m.timestamp)
                }));
                setMessages(withDates);
            } catch (e) {
                console.error("Error loading chat history:", e);
                resetChat();
            }
        } else {
            resetChat();
        }
    }, []);

    // Save to localStorage whenever messages change
    useEffect(() => {
        if (messages.length > 0) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages]);

    const resetChat = () => {
        setMessages([
            {
                text: "Zzz-olá! Eu sou a Beea, sua assistente robô-abelha. 🐝 Estou aqui para te ajudar com qualquer dúvida sobre a Jobee! Como posso te ajudar hoje? ✨",
                sender: 'bee',
                timestamp: new Date()
            }
        ]);
    };

    const clearChat = () => {
        if (window.confirm("Zzz-deseja mesmo limpar nosso histórico de pólen?")) {
            localStorage.removeItem(STORAGE_KEY);
            resetChat();
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        if (isOpen) {
            scrollToBottom();
        }
    }, [messages, isOpen]);

    const handleSendMessage = async () => {
        if (!inputValue.trim()) return;

        const userMsg = inputValue.trim();
        setInputValue('');

        const newMessages: Message[] = [
            ...messages,
            { text: userMsg, sender: 'user', timestamp: new Date() }
        ];
        setMessages(newMessages);
        setIsTyping(true);

        try {
            // Level 2 AI Integration
            const response = await getBeeaResponse(userMsg, newMessages.map(m => ({ text: m.text, sender: m.sender })));

            // Image mapping for plans
            const planImages: { [key: string]: string } = {
                'PLAN_NECTAR': 'https://cea23ecb-d536-4c0c-bbb9-4fb3d0b223b0.artifact.gemini.google.com/plan_nectar_badge_1767913740837.png',
                'PLAN_POLEN': 'https://cea23ecb-d536-4c0c-bbb9-4fb3d0b223b0.artifact.gemini.google.com/plan_polen_badge_1767913752650.png',
                'PLAN_FAVO': 'https://cea23ecb-d536-4c0c-bbb9-4fb3d0b223b0.artifact.gemini.google.com/plan_favo_badge_1767913765478.png',
                'PLAN_GELEIA': 'https://cea23ecb-d536-4c0c-bbb9-4fb3d0b223b0.artifact.gemini.google.com/plan_geleia_badge_1767913778839.png'
            };

            let cleanResponse = response;
            let attachedImage = undefined;

            // Regex for [PLAN_NAME]
            const planRegex = /\[(PLAN_[A-Z]+)\]/i;
            const match = cleanResponse.match(planRegex);

            if (match) {
                const tagKey = match[1].toUpperCase();
                if (planImages[tagKey]) {
                    attachedImage = planImages[tagKey];
                    cleanResponse = cleanResponse.replace(match[0], '').trim();
                }
            }

            setMessages(prev => [
                ...prev,
                {
                    text: cleanResponse,
                    sender: 'bee',
                    timestamp: new Date(),
                    image: attachedImage
                }
            ]);
        } catch (error) {
            setMessages(prev => [
                ...prev,
                { text: "Zzz... tive um pequeno curto-circuito nas minhas asas. Pode zumbir sua pergunta de novo? 🐝", sender: 'bee', timestamp: new Date() }
            ]);
        } finally {
            setIsTyping(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-6 animate-in fade-in duration-300">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={onClose}></div>

            <div className="relative w-full max-w-lg h-[80vh] sm:h-[600px] bg-[#0B0F1A] border-t sm:border border-white/10 rounded-t-[3rem] sm:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom duration-500">
                {/* Header */}
                <header className="px-8 py-6 bg-gradient-to-r from-primary/10 to-transparent border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-[0_0_15px_rgba(250,204,21,0.3)] animate-pulse">
                                <span className="material-symbols-outlined text-primary text-3xl">smart_toy</span>
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-[#0B0F1A]"></div>
                        </div>
                        <div>
                            <h3 className="text-lg font-black uppercase tracking-tighter text-white leading-none">Beea</h3>
                            <p className="text-[10px] font-bold text-primary uppercase tracking-widest mt-1 italic">Assistente Polinizadora</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={clearChat}
                            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-red-400 transition-colors"
                            title="Limpar Conversa"
                        >
                            <span className="material-symbols-outlined text-xl">delete_sweep</span>
                        </button>
                        <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                            <span className="material-symbols-outlined">close</span>
                        </button>
                    </div>
                </header>

                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-${msg.sender === 'user' ? 'right' : 'left'}-4 duration-300`}>
                            <div className={`max-w-[85%] p-4 rounded-3xl text-sm leading-relaxed ${msg.sender === 'user'
                                ? 'bg-primary text-secondary font-bold rounded-tr-none shadow-lg shadow-primary/10'
                                : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-none font-medium'
                                }`}>
                                {msg.image && (
                                    <div className="mb-4 rounded-2xl overflow-hidden border border-white/10 shadow-lg bg-white/5">
                                        <img
                                            src={msg.image}
                                            className="w-full h-auto object-cover"
                                            alt=""
                                            onError={(e) => {
                                                (e.target as HTMLImageElement).style.display = 'none';
                                                (e.target as HTMLImageElement).parentElement!.style.display = 'none';
                                            }}
                                        />
                                    </div>
                                )}
                                {msg.text}
                                <div className={`text-[8px] mt-2 opacity-40 font-black uppercase ${msg.sender === 'user' ? 'text-secondary' : 'text-white'}`}>
                                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </div>
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start animate-pulse">
                            <div className="bg-white/5 border border-white/10 px-4 py-3 rounded-2xl rounded-tl-none flex gap-1">
                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce"></div>
                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.2s]"></div>
                                <div className="w-1.5 h-1.5 bg-primary rounded-full animate-bounce [animation-delay:0.4s]"></div>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <footer className="p-6 bg-white/[0.02] border-t border-white/5">
                    <div className="flex gap-3 items-center bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-primary/50 transition-colors">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Zumbir uma dúvida..."
                            className="flex-1 bg-transparent border-none outline-none px-4 text-sm text-white placeholder:text-white/20"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim() || isTyping}
                            className="w-12 h-12 rounded-xl bg-primary text-secondary flex items-center justify-center shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                        >
                            <span className="material-symbols-outlined font-black">send</span>
                        </button>
                    </div>
                    <p className="text-[8px] text-center text-white/20 uppercase tracking-[0.2em] mt-4 font-black">Processado pelo Favio de IA da Jobee</p>
                </footer>
            </div>
        </div>
    );
};
