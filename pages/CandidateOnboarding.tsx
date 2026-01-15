
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { JobeeSymbol } from '../components/JobeeIdentity';
import { useKeyboardStatus } from '../hooks/useKeyboardStatus';
import { useToast } from '../context/ToastContext';

interface CandidateOnboardingProps {
    onComplete: () => void;
    startStep?: number;
}

const SKILL_OPTIONS = [
    'React', 'Node.js', 'Typescript', 'Javascript', 'Python', 'Java', 'UI/UX Design',
    'Marketing Digital', 'Vendas', 'Gestão de Projetos', 'SQL', 'NoSQL', 'Cloud (AWS/Azure)',
    'DevOps', 'Mobile (React Native/Flutter)', 'Product Management', 'Data Science', 'English (Fluent)'
];

const INDUSTRY_OPTIONS = [
    'Tecnologia', 'Financeiro', 'Educação', 'Saúde', 'Varejo', 'Indústria', 'Serviços', 'Marketing', 'RH', 'Jurídico'
];

const TOOL_OPTIONS = [
    'Figma', 'Slack', 'Jira', 'Postman', 'Docker', 'Kubernetes', 'Git/GitHub', 'Zapier', 'Notion', 'Excel Avançado', 'Power BI', 'Google Analytics', 'CRM (Salesforce/Hubspot)'
];

const CandidateOnboarding: React.FC<CandidateOnboardingProps> = ({ onComplete, startStep = 1 }) => {
    // Stage 0: Initial Cache Load
    const cache = (() => {
        try {
            const saved = localStorage.getItem('jobee_cache_onboarding');
            return saved ? JSON.parse(saved) : null;
        } catch { return null; }
    })();

    const [step, setStep] = useState(() => {
        const saved = localStorage.getItem('onboarding_start_step');
        if (saved) {
            localStorage.removeItem('onboarding_start_step');
            return parseInt(saved);
        }
        return startStep;
    });
    const { isKeyboardOpen } = useKeyboardStatus();
    const [loading, setLoading] = useState(false);
    const [isEditMode, setIsEditMode] = useState(!!cache?.db_subscription_status || !!cache?.onboarding_completed);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const { showToast } = useToast();
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        fullName: cache?.db_full_name || cache?.full_name || '',
        headline: cache?.db_metadata?.headline || cache?.metadata?.headline || '',
        bio: cache?.db_metadata?.bio || cache?.metadata?.bio || '',
        skills: cache?.db_skills || cache?.skills || [] as string[],
        tools: cache?.db_metadata?.tools || cache?.metadata?.tools || [] as string[],
        targetRole: cache?.target_role || cache?.db_metadata?.targetRole || cache?.metadata?.targetRole || '',
        targetIndustry: cache?.industry || cache?.db_metadata?.targetIndustry || cache?.metadata?.targetIndustry || 'Tecnologia',
        experienceLevel: cache?.db_metadata?.experienceLevel || cache?.metadata?.experienceLevel || 'Junior',
        salaryExpectation: cache?.db_metadata?.salaryExpectation || cache?.metadata?.salaryExpectation || '',
        preferredModality: cache?.db_metadata?.preferredModality || cache?.metadata?.preferredModality || 'Híbrido',
        location: cache?.location || cache?.db_metadata?.location || cache?.metadata?.location || '',
        whatsapp: cache?.db_metadata?.whatsapp || cache?.metadata?.whatsapp || '',
        avatarUrl: cache?.db_avatar_url || cache?.avatar_url || '',
        searchRadius: cache?.db_search_radius || cache?.search_radius || 50,
        latitude: cache?.db_metadata?.location_lat || cache?.metadata?.location_lat || null as number | null,
        longitude: cache?.db_metadata?.location_lng || cache?.metadata?.location_lng || null as number | null
    });

    useEffect(() => {
        loadExistingData();
    }, []);

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            showToast('Geolocalização não suportada.', 'warning');
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setFormData(prev => ({ ...prev, latitude, longitude }));

                // Reverse geocoding (simple version)
                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    if (data.address) {
                        const city = data.address.city || data.address.town || data.address.suburb || '';
                        const state = data.address.state || '';
                        setFormData(prev => ({ ...prev, location: `${city}${city && state ? ' / ' : ''}${state}` }));
                    }
                } catch (error) {
                    console.error('Error in reverse geocoding:', error);
                } finally {
                    setLoading(false);
                }
            },
            (error) => {
                setLoading(false);
                showToast('Erro ao obter localização. Verifique as permissões.', 'error');
            }
        );
    };

    const loadExistingData = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', user.id)
                .maybeSingle();

            if (profile) {
                setIsEditMode(!!profile.onboarding_completed);
                const meta = profile.metadata || {};
                setFormData({
                    fullName: profile.full_name || '',
                    headline: meta.headline || '',
                    bio: meta.bio || '',
                    skills: profile.skills || [],
                    tools: meta.tools || [],
                    targetRole: profile.target_role || meta.targetRole || '',
                    targetIndustry: profile.industry || meta.targetIndustry || 'Tecnologia',
                    experienceLevel: meta.experienceLevel || 'Junior',
                    salaryExpectation: meta.salaryExpectation || '',
                    preferredModality: meta.preferredModality || 'Híbrido',
                    location: profile.location || meta.location || '',
                    whatsapp: meta.whatsapp || '',
                    avatarUrl: profile.avatar_url || '',
                    searchRadius: profile.search_radius || 50
                });
            } else {
                setFormData(prev => ({
                    ...prev,
                    fullName: prev.fullName || user.user_metadata?.full_name || user.user_metadata?.name || '',
                    avatarUrl: prev.avatarUrl || user.user_metadata?.avatar_url || user.user_metadata?.picture || ''
                }));
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploadingAvatar(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-candidate-${Math.random()}.${fileExt}`;
            const filePath = `candidates/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setFormData(prev => ({ ...prev, avatarUrl: publicUrl }));
        } catch (error: any) {
            console.error('Erro no upload:', error.message);
            showToast('Falha no upload da foto.', 'error');
        } finally {
            setUploadingAvatar(false);
        }
    };

    const toggleMultiSelect = (field: 'skills' | 'tools', value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: prev[field].includes(value)
                ? prev[field].filter(s => s !== value)
                : [...prev[field], value]
        }));
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            await supabase.auth.updateUser({
                data: {
                    onboarding_completed: true,
                    full_name: formData.fullName,
                    avatar_url: formData.avatarUrl,
                    role: 'candidate'
                }
            });

            const { error: dbError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    role: 'candidate',
                    full_name: formData.fullName,
                    avatar_url: formData.avatarUrl,
                    skills: formData.skills,
                    location: formData.location,
                    latitude: formData.latitude,
                    longitude: formData.longitude,
                    target_role: formData.targetRole,
                    industry: formData.targetIndustry,
                    search_radius: formData.searchRadius,
                    onboarding_completed: true,
                    metadata: formData,
                    updated_at: new Date().toISOString()
                });

            if (dbError) throw dbError;

            showToast('Perfil ativado com sucesso!', 'success');
            onComplete();
        } catch (error: any) {
            console.error('Erro ao salvar perfil:', error);
            showToast('Erro ao salvar perfil. Tente novamente.', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-[#0B0F1A] text-white relative overflow-hidden font-sans">
            {/* AMBIENT BACKGROUND */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-[10%] right-[-10%] w-[60%] h-[40%] bg-blue-500/10 blur-[120px] rounded-full rotate-45" />
                <div className="absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
                <div className="absolute inset-0 opacity-[0.03]" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' stroke='%23ffffff' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
                    backgroundSize: '30px 52px'
                }} />
            </div>

            <div className="relative z-10 p-6 pt-10 flex flex-col max-w-sm mx-auto w-full h-full shrink-0">
                {/* Stepper */}
                <div className="flex items-center gap-3 mb-10 w-full justify-center shrink-0">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500 border ${step >= s ? 'bg-primary border-primary text-secondary shadow-[0_0_15px_rgba(250,204,21,0.5)]' : 'bg-white/5 border-white/10 text-white/30'}`}>
                                {s}
                            </div>
                            {s < 4 && <div className={`w-4 h-[2px] mx-1 transition-all duration-500 ${step > s ? 'bg-primary' : 'bg-white/5'}`}></div>}
                        </div>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide pb-10">

                    {/* Step 1: Basic Bio */}
                    {step === 1 && (
                        <div className="w-full space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                            <header className="text-center">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Passo 01/04</span>
                                <h2 className="text-2xl font-black uppercase tracking-tighter mt-1">Identidade Bee</h2>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-2">Como você quer ser visto pelas colmeias?</p>
                            </header>

                            <div className="flex flex-col items-center">
                                <div className="relative">
                                    <input type="file" ref={avatarInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
                                    <div className="w-32 h-32 rounded-[2.5rem] bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-all cursor-pointer p-1" onClick={() => avatarInputRef.current?.click()}>
                                        {formData.avatarUrl ? (
                                            <img src={formData.avatarUrl} className="w-full h-full rounded-[2.2rem] object-cover" alt="Avatar" />
                                        ) : uploadingAvatar ? (
                                            <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                        ) : (
                                            <span className="material-symbols-outlined text-4xl text-white/20">person</span>
                                        )}
                                    </div>
                                    <button onClick={() => avatarInputRef.current?.click()} className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary rounded-2xl flex items-center justify-center border-4 border-secondary text-secondary shadow-xl active:scale-90 transition-all">
                                        <span className="material-symbols-outlined text-sm font-black">add_a_photo</span>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Nome Completo</label>
                                    <input type="text" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="Ex: Maria das Abelhas" className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Resumo (Bio)</label>
                                    <textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} placeholder="Conte um pouco sobre sua trajetória..." className="w-full h-32 p-5 rounded-3xl bg-white/5 border border-white/10 outline-none resize-none text-sm" />
                                </div>
                            </div>

                            {!isKeyboardOpen && (
                                <button
                                    onClick={() => isEditMode ? handleFinish() : setStep(2)}
                                    className="w-full h-16 bg-primary text-secondary font-black rounded-2xl uppercase tracking-widest transition-all shadow-2xl shadow-primary/20 hide-when-short flex items-center justify-center gap-2"
                                >
                                    {isEditMode ? (loading ? <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" /> : <>Salvar Alterações <span className="material-symbols-outlined font-black">check</span></>) : 'Continuar'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Step 2: Ambition & Role */}
                    {step === 2 && (
                        <div className="w-full space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                            <header className="text-center">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Passo 02/04</span>
                                <h2 className="text-2xl font-black uppercase tracking-tighter mt-1">Sua Próxima Flor</h2>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-2">Onde você quer chegar?</p>
                            </header>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Cargo Desejado</label>
                                    <input type="text" value={formData.targetRole} onChange={e => setFormData({ ...formData, targetRole: e.target.value })} placeholder="Ex: Desenvolvedor React Senior" className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Área de Interesse</label>
                                    <select value={formData.targetIndustry} onChange={e => setFormData({ ...formData, targetIndustry: e.target.value })} className="w-full h-14 px-5 rounded-2xl bg-white/5 border border-white/10 outline-none appearance-none font-bold">
                                        {INDUSTRY_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                    </select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Sênioridade</label>
                                        <select value={formData.experienceLevel} onChange={e => setFormData({ ...formData, experienceLevel: e.target.value })} className="w-full h-14 px-5 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-primary/50 outline-none appearance-none">
                                            <option value="Estagiário">Estagiário</option>
                                            <option value="Junior">Junior</option>
                                            <option value="Pleno">Pleno</option>
                                            <option value="Senior">Senior</option>
                                            <option value="Especialista">Especialista</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Pretensão (R$)</label>
                                        <input type="text" value={formData.salaryExpectation} onChange={e => setFormData({ ...formData, salaryExpectation: e.target.value })} placeholder="Ex: 5000" className="w-full h-14 px-5 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-primary/50 outline-none transition-all" />
                                    </div>
                                </div>
                            </div>

                            {!isKeyboardOpen && (
                                <div className="flex gap-4 hide-when-short">
                                    <button onClick={() => setStep(1)} className="w-20 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40">
                                        <span className="material-symbols-outlined">arrow_back</span>
                                    </button>
                                    <button
                                        onClick={() => isEditMode ? handleFinish() : setStep(3)}
                                        className="flex-1 h-16 bg-primary text-secondary font-black rounded-2xl uppercase tracking-widest transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-2"
                                    >
                                        {isEditMode ? (loading ? <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" /> : <>Salvar Alterações <span className="material-symbols-outlined font-black">check</span></>) : 'Próximo'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Skills & Tools (The CV meat) */}
                    {step === 3 && (
                        <div className="w-full space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                            <header className="text-center">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Passo 03/04</span>
                                <h2 className="text-2xl font-black uppercase tracking-tighter mt-1">Conhecimento & Mel</h2>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-2">Quais flores você domina?</p>
                            </header>

                            <div className="space-y-6">
                                <div className="space-y-3">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Habilidades Técnicas</label>
                                    <div className="flex flex-wrap gap-2">
                                        {SKILL_OPTIONS.map(skill => (
                                            <button key={skill} onClick={() => toggleMultiSelect('skills', skill)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${formData.skills.includes(skill) ? 'bg-primary border-primary text-secondary shadow-lg' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                                {skill}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Ferramentas & Sistemas</label>
                                    <div className="flex flex-wrap gap-2">
                                        {TOOL_OPTIONS.map(tool => (
                                            <button key={tool} onClick={() => toggleMultiSelect('tools', tool)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all border ${formData.tools.includes(tool) ? 'bg-orange-400 border-orange-400 text-secondary shadow-lg' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                                {tool}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {!isKeyboardOpen && (
                                <div className="flex gap-4 hide-when-short">
                                    <button onClick={() => setStep(2)} className="w-20 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40">
                                        <span className="material-symbols-outlined">arrow_back</span>
                                    </button>
                                    <button
                                        onClick={() => isEditMode ? handleFinish() : setStep(4)}
                                        className="flex-1 h-16 bg-primary text-secondary font-black rounded-2xl uppercase tracking-widest transition-all shadow-2xl shadow-primary/20 flex items-center justify-center gap-2"
                                    >
                                        {isEditMode ? (loading ? <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin" /> : <>Salvar Alterações <span className="material-symbols-outlined font-black">check</span></>) : 'Próximo'}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 4: Logistics */}
                    {step === 4 && (
                        <div className="w-full space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                            <header className="text-center">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Passo 04/04</span>
                                <h2 className="text-2xl font-black uppercase tracking-tighter mt-1">Radar & Contato</h2>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-2">Onde as colmeias te encontram?</p>
                            </header>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Localização (Cidade/UF)</label>
                                    <div className="flex gap-2">
                                        <input type="text" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Ex: São Paulo / SP" className="flex-1 h-14 px-6 rounded-2xl bg-white/5 border border-white/10 outline-none transition-all placeholder:text-white/10" />
                                        <button onClick={getCurrentLocation} className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary hover:bg-primary hover:text-secondary transition-all">
                                            <span className="material-symbols-outlined">location_searching</span>
                                        </button>
                                    </div>
                                    {formData.latitude && (
                                        <p className="text-[8px] font-black text-primary uppercase tracking-widest mt-1 ml-4 flex items-center gap-1">
                                            <span className="material-symbols-outlined text-[10px]">check_circle</span> GPS Ativado
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-1">
                                    <div className="flex justify-between items-center px-4">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-white/40">Raio de Busca</label>
                                        <span className="text-[10px] font-black text-primary uppercase">{formData.searchRadius} km</span>
                                    </div>
                                    <input type="range" min="10" max="200" step="10" value={formData.searchRadius} onChange={e => setFormData({ ...formData, searchRadius: parseInt(e.target.value) })} className="w-full h-1 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">WhatsApp</label>
                                    <input type="text" value={formData.whatsapp} onChange={e => setFormData({ ...formData, whatsapp: e.target.value })} placeholder="(00) 00000-0000" className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 outline-none transition-all" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Modalidade Preferida</label>
                                    <div className="flex gap-2">
                                        {['Presencial', 'Híbrido', 'Remoto'].map(mod => (
                                            <button key={mod} onClick={() => setFormData({ ...formData, preferredModality: mod })} className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all border ${formData.preferredModality === mod ? 'bg-primary border-primary text-secondary' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                                {mod}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {!isKeyboardOpen && (
                                <div className="flex gap-4 hide-when-short">
                                    <button onClick={() => setStep(3)} className="w-20 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40">
                                        <span className="material-symbols-outlined">arrow_back</span>
                                    </button>
                                    <button onClick={handleFinish} disabled={loading} className="flex-1 h-16 bg-primary text-secondary font-black rounded-2xl uppercase tracking-widest transition-all shadow-2xl flex items-center justify-center gap-2">
                                        {loading ? <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div> : <>Finalizar <span className="material-symbols-outlined font-black">bolt</span></>}
                                    </button>
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-10 flex justify-center">
                    <JobeeSymbol size={40} mode="dark" />
                </div>
            </div>
        </div>
    );
};

export default CandidateOnboarding;
