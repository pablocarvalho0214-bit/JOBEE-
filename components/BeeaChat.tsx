
import React, { useState, useEffect, useRef } from 'react';
import { getBeeaResponse, generateBeeaAudio } from '../services/geminiService';

interface Message {
    text: string;
    sender: 'user' | 'bee';
    timestamp: Date;
    image?: string;
}

interface BeeaChatProps {
    isOpen: boolean;
    onClose: () => void;
    userId?: string;
}

export const BeeaChat: React.FC<BeeaChatProps> = ({ isOpen, onClose, userId }) => {
    const STORAGE_KEY = userId ? `jobbee_beea_chat_history_${userId}` : 'jobbee_beea_chat_history_guest';
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initial load from localStorage - depends on userId
    useEffect(() => {
        if (!isOpen) return;

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
    }, [isOpen, STORAGE_KEY]);

    // Save to localStorage whenever messages change - depends on STORAGE_KEY
    useEffect(() => {
        if (messages.length > 0 && userId) {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
        }
    }, [messages, STORAGE_KEY]);

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
                'PLAN_NECTAR': '/plan_nectar.png',
                'PLAN_POLEN': '/plan_polen.png',
                'PLAN_FAVO': '/plan_favo.png',
                'PLAN_GELEIA': '/plan_geleia.png'
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

    const [isSpeaking, setIsSpeaking] = useState(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const speak = async (text: string) => {
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current = null;
        }

        setIsSpeaking(true);

        try {
            // Try Gemini native audio first (more human-like)
            const audioDataUrl = await generateBeeaAudio(text);

            if (audioDataUrl) {
                // Play the generated audio
                const audio = new Audio(audioDataUrl);
                audioRef.current = audio;

                audio.onended = () => {
                    setIsSpeaking(false);
                    audioRef.current = null;
                };

                audio.onerror = () => {
                    console.warn("Audio playback failed, falling back to Web Speech API");
                    fallbackSpeak(text);
                };

                await audio.play();
                return;
            }
        } catch (error) {
            console.warn("Gemini audio generation failed, falling back to Web Speech API:", error);
        }

        // Fallback to Web Speech API
        fallbackSpeak(text);
    };

    const fallbackSpeak = (text: string) => {
        const utterance = new SpeechSynthesisUtterance(text);

        const voices = window.speechSynthesis.getVoices();

        // Prioridade para vozes neurais ou naturais do Google
        const preferredVoice = voices.find(v => v.lang.includes('pt-BR') && (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural'))) ||
            voices.find(v => v.lang.includes('pt-BR') && (v.name.includes('Maria') || v.name.includes('Heloisa') || v.name.includes('Luciana')));

        if (preferredVoice) {
            utterance.voice = preferredVoice;
        }

        utterance.lang = 'pt-BR';
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
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
                            <div className="w-24 h-24 rounded-[2.5rem] bg-primary/20 flex items-center justify-center border-2 border-primary/40 overflow-hidden shadow-[0_0_30px_rgba(250,204,21,0.6)]">
                                <img
                                    src="/beea-avatar-new.jpg"
                                    className="w-full h-full object-cover"
                                    alt="Beea"
                                />
                            </div>
                            <div className="absolute top-1 right-1 w-6 h-6 bg-green-500 rounded-full border-4 border-[#0B0F1A] shadow-lg"></div>
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
                                <div className="flex items-center justify-between mt-2">
                                    <div className={`text-[8px] opacity-40 font-black uppercase ${msg.sender === 'user' ? 'text-secondary' : 'text-white'}`}>
                                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                    {msg.sender === 'bee' && (
                                        <button
                                            onClick={() => speak(msg.text)}
                                            disabled={isSpeaking}
                                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-colors ${isSpeaking
                                                    ? 'bg-primary/30 animate-pulse'
                                                    : 'bg-white/10 hover:bg-white/20'
                                                }`}
                                            title={isSpeaking ? "Reproduzindo..." : "Ouvir mensagem"}
                                        >
                                            <span className="material-symbols-outlined text-[14px]">
                                                {isSpeaking ? 'graphic_eq' : 'volume_up'}
                                            </span>
                                        </button>
                                    )}
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
                <footer className="p-6 pb-12 bg-white/[0.04] border-t border-white/5 backdrop-blur-xl">
                    <div className="flex gap-3 items-center bg-white/5 border border-white/10 rounded-2xl p-2 focus-within:border-primary/50 transition-colors shadow-inner">
                        <input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            placeholder="Zumbir uma dúvida..."
                            className="flex-1 bg-transparent border-none outline-none px-4 text-sm text-white placeholder:text-white/20 py-2"
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
