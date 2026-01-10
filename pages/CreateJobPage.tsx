import React, { useState, useEffect } from 'react';
import { useKeyboardStatus } from '../hooks/useKeyboardStatus';
import { JobeeSymbol } from '../components/JobeeIdentity';
import { supabase } from '../services/supabaseClient';

interface CreateJobPageProps {
    onNavigate?: (page: any) => void;
}

const CreateJobPage: React.FC<CreateJobPageProps> = ({ onNavigate }) => {
    const [step, setStep] = useState(1);
    const [title, setTitle] = useState('');
    const [location, setLocation] = useState('');
    const [salary, setSalary] = useState('');
    const [description, setDescription] = useState('');
    const { isKeyboardOpen } = useKeyboardStatus();
    const [jobType, setJobType] = useState<'Remoto' | 'Presencial' | 'Híbrido'>('Remoto');
    const [interviewModel, setInterviewModel] = useState<'online' | 'in_person'>('online');
    const [schedulingMode, setSchedulingMode] = useState<'automated' | 'manual'>('manual');
    const [interviewDetail, setInterviewDetail] = useState('');
    const [interviewDuration, setInterviewDuration] = useState<number>(30);
    const [customDuration, setCustomDuration] = useState('');
    const [slots, setSlots] = useState<string[]>([]);
    const [batchDate, setBatchDate] = useState('');
    const [batchStart, setBatchStart] = useState('');
    const [batchEnd, setBatchEnd] = useState('');
    const [isConfidential, setIsConfidential] = useState(false);
    const [publishedJob, setPublishedJob] = useState<any>(null);
    const [previewMode, setPreviewMode] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hiringRadius, setHiringRadius] = useState<number>(30);
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);

    const [requiredSkills, setRequiredSkills] = useState('');
    const [experienceYears, setExperienceYears] = useState('');
    const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
    const [benefitsValues, setBenefitsValues] = useState<Record<string, number>>({});
    const [showRemuneration, setShowRemuneration] = useState(true);
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [searchingAddress, setSearchingAddress] = useState(false);
    const [companyLogo, setCompanyLogo] = useState('');
    const [initialLoadComplete, setInitialLoadComplete] = useState(false);

    // Load state from localStorage on mount
    useEffect(() => {
        const savedState = localStorage.getItem('jobee_create_job_state');
        if (savedState) {
            try {
                const parsed = JSON.parse(savedState);
                setStep(parsed.step || 1);
                setTitle(parsed.title || '');
                setLocation(parsed.location || '');
                setSalary(parsed.salary || '');
                setDescription(parsed.description || '');
                setJobType(parsed.jobType || 'Remoto');
                setRequiredSkills(parsed.requiredSkills || '');
                setExperienceYears(parsed.experienceYears || '');
                setSelectedBenefits(parsed.selectedBenefits || []);
                setBenefitsValues(parsed.benefitsValues || {});
                setShowRemuneration(parsed.showRemuneration ?? true);
                setIsConfidential(parsed.isConfidential || false);
                setHiringRadius(parsed.hiringRadius || 50);
                // ... restore other fields as needed
            } catch (e) {
                console.error('Failed to load saved job state', e);
            }
        }
        setInitialLoadComplete(true);
    }, []);

    // Save state to localStorage on modification
    useEffect(() => {
        if (!initialLoadComplete) return;

        const stateToSave = {
            step, title, location, salary, description, jobType,
            requiredSkills, experienceYears, selectedBenefits, benefitsValues,
            showRemuneration, isConfidential, hiringRadius
        };
        localStorage.setItem('jobee_create_job_state', JSON.stringify(stateToSave));
    }, [step, title, location, salary, description, jobType, requiredSkills, experienceYears, selectedBenefits, benefitsValues, showRemuneration, isConfidential, hiringRadius, initialLoadComplete]);

    // Work Schedule Automation
    const [workStart, setWorkStart] = useState('09:00');
    const [workEnd, setWorkEnd] = useState('18:00');
    const [lunchTime, setLunchTime] = useState('01:00');
    const [workDaysType, setWorkDaysType] = useState<'2a6a' | '2aSab' | 'Outro'>('2a6a');
    const [customWorkDays, setCustomWorkDays] = useState('');
    const [weeklyHoursType, setWeeklyHoursType] = useState<'20h' | '30h' | '40h' | '44h' | 'Outro'>('40h');
    const [customWeeklyHours, setCustomWeeklyHours] = useState('');

    const PREDEFINED_BENEFITS = [
        'Vale Alimentação/Refeição',
        'Vale Transporte',
        'Plano de Saúde',
        'Plano Odontológico',
        'Seguro de Vida',
        'Auxílio Home Office',
        'Gympass/Auxílio Academia'
    ];

    const totalSteps = 7;

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data } = await supabase.from('profiles').select('company_logo_url').eq('id', user.id).single();
                if (data) setCompanyLogo(data.company_logo_url || '');
            }
        };
        fetchProfile();
    }, []);

    const nextStep = () => {
        if (step < totalSteps) setStep(step + 1);
        else setPreviewMode(true);
    };

    const prevStep = () => {
        if (step > 1) setStep(step - 1);
    };

    const getCurrentLocation = () => {
        if (!navigator.geolocation) {
            alert('Geolocalização não é suportada.');
            return;
        }

        setLoading(true);
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setLatitude(latitude);
                setLongitude(longitude);

                try {
                    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`);
                    const data = await response.json();
                    if (data.address) {
                        const city = data.address.city || data.address.town || data.address.suburb || '';
                        const state = data.address.state || '';
                        setLocation(`${city}${city && state ? ' / ' : ''}${state}`);
                    }
                } catch (error) {
                    console.error('Error in reverse geocoding:', error);
                } finally {
                    setLoading(false);
                }
            },
            () => {
                setLoading(false);
                alert('Erro ao obter localização.');
            }
        );
    };

    const handleAddressSearch = async (query: string) => {
        setInterviewDetail(query);
        if (query.length < 5 || interviewModel === 'online') {
            setAddressSuggestions([]);
            return;
        }

        setSearchingAddress(true);
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=br&limit=5`);
            const data = await response.json();
            setAddressSuggestions(data);
        } catch (error) {
            console.error('Error searching address:', error);
        } finally {
            setSearchingAddress(false);
        }
    };

    const toggleBenefit = (benefit: string) => {
        setSelectedBenefits(prev => {
            const newBenefits = prev.includes(benefit) ? prev.filter(b => b !== benefit) : [...prev, benefit];
            if (!newBenefits.includes(benefit)) {
                const newValues = { ...benefitsValues };
                delete newValues[benefit];
                setBenefitsValues(newValues);
            }
            return newBenefits;
        });
    };

    const handleBenefitValueChange = (benefit: string, value: string) => {
        const numValue = parseFloat(value.replace(/[^0-9.]/g, '')) || 0;
        setBenefitsValues(prev => ({ ...prev, [benefit]: numValue }));
    };

    const calculateTotalRemuneration = () => {
        // Remove everything that is not a digit or a comma
        const cleanString = salary.replace(/[^\d,]/g, '').replace(',', '.');
        const baseSalary = parseFloat(cleanString) || 0;
        const benefitsSum: number = (Object.values(benefitsValues) as number[]).reduce((a: number, b: number) => a + b, 0);
        return baseSalary + benefitsSum;
    };

    const formatCurrencyInput = (value: string) => {
        const onlyDigits = value.replace(/\D/g, "");
        if (!onlyDigits) return "";
        const amount = parseFloat(onlyDigits) / 100;
        return amount.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    };

    const generateBatchSlots = () => {
        if (!batchDate || !batchStart || !batchEnd) return;
        const duration = customDuration ? parseInt(customDuration) : interviewDuration;
        if (!duration || duration <= 0) return;

        const [startH, startM] = batchStart.split(':').map(Number);
        const [endH, endM] = batchEnd.split(':').map(Number);
        let currentMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;

        const newSlots: string[] = [];
        while (currentMinutes + duration <= endMinutes) {
            const h = Math.floor(currentMinutes / 60);
            const m = currentMinutes % 60;
            const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
            const slotStr = `${batchDate} às ${timeStr}`;
            if (!slots.includes(slotStr)) newSlots.push(slotStr);
            currentMinutes += duration;
        }

        if (newSlots.length > 0) {
            setSlots(prev => [...prev, ...newSlots]);
            setBatchStart('');
            setBatchEnd('');
        }
    };

    const removeSlot = (index: number) => {
        setSlots(slots.filter((_, i) => i !== index));
    };

    const handleConfirmPublish = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                alert('Sessão expirada.');
                return;
            }

            const { data: profile } = await supabase
                .from('profiles')
                .select('company_name, company_logo_url')
                .eq('id', user.id)
                .single();

            const jobData = {
                recruiter_id: user.id,
                title,
                location,
                salary,
                description,
                type: jobType,
                company_name: isConfidential ? 'Empresa Confidencial' : (profile?.company_name || 'Sua Empresa'),
                company_logo_url: isConfidential ? 'https://api.dicebear.com/7.x/initials/svg?seed=?' : (profile?.company_logo_url || ''),
                interview_model: interviewModel,
                scheduling_mode: schedulingMode,
                interview_detail: interviewDetail,
                interview_duration: customDuration ? parseInt(customDuration) : interviewDuration,
                availability_slots: slots,
                is_confidential: isConfidential,
                required_skills: requiredSkills.split(',').map(s => s.trim()).filter(s => s !== ''),
                experience_years: experienceYears,
                benefits: selectedBenefits,
                work_schedule: `${workStart} às ${workEnd}`,
                lunch_time: lunchTime,
                work_days: workDaysType === '2a6a' ? 'Segunda a Sexta' : workDaysType === '2aSab' ? 'Segunda a Sábado' : customWorkDays,
                weekly_hours: weeklyHoursType === 'Outro' ? `${customWeeklyHours}h` : weeklyHoursType,
                hiring_radius: hiringRadius,
                latitude,
                longitude,
                category: 'Geral',
                benefits_values: benefitsValues,
                total_remuneration: calculateTotalRemuneration().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
                show_remuneration: showRemuneration
            };

            const { data, error } = await supabase.from('jobs').insert(jobData).select().single();
            if (error) throw error;

            // Clear saved state on success
            localStorage.removeItem('jobee_create_job_state');

            setPublishedJob(data);
            setPreviewMode(false);
        } catch (err) {
            console.error('Error publishing job:', err);
            alert(`Erro ao publicar vaga: ${(err as any).message}`);
        } finally {
            setLoading(false);
        }
    };

    if (publishedJob) {
        return (
            <div className="flex flex-col h-full bg-secondary text-white p-6 pt-10 justify-center items-center text-center">
                <div className="w-24 h-24 bg-green-500 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-green-500/20 animate-bounce">
                    <JobeeSymbol size={48} mode="dark" />
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Vaga <span className="text-green-500 italic">Ativada!</span></h1>
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-12">As abelhas já estão em busca do polen.</p>
                <div className="w-full space-y-4 max-w-xs">
                    <button onClick={() => onNavigate?.('jobs')} className="w-full h-16 bg-green-500 text-secondary font-black rounded-2xl shadow-xl uppercase tracking-widest">Ir para Dashboard</button>
                    <button onClick={() => {
                        setPublishedJob(null);
                        setStep(1);
                        setPreviewMode(false);
                        localStorage.removeItem('jobee_create_job_state'); // Ensure clean start
                        // Reset all states manually if needed, or rely on the empty localStorage + mount logic if we forced a reload, but manual reset is better here for SPA
                        setTitle(''); setLocation(''); setSalary(''); setDescription('');
                        setRequiredSkills(''); setExperienceYears(''); setSelectedBenefits([]); setBenefitsValues({});
                    }} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest">Criar Outra Vaga</button>
                </div>
            </div>
        );
    }

    if (previewMode) {
        const displayData = {
            title,
            location,
            salary,
            description,
            type: jobType,
            required_skills: requiredSkills.split(',').map(s => s.trim()).filter(s => s !== ''),
            experience_years: experienceYears,
            benefits: selectedBenefits,
            work_schedule: `${workStart} às ${workEnd}`,
            lunch_time: lunchTime,
            work_days: workDaysType === '2a6a' ? 'Segunda a Sexta' : workDaysType === '2aSab' ? 'Segunda a Sábado' : customWorkDays,
            weekly_hours: weeklyHoursType === 'Outro' ? `${customWeeklyHours}h` : weeklyHoursType,
            interview_model: interviewModel,
            scheduling_mode: schedulingMode,
            interview_detail: interviewDetail,
            benefits_values: benefitsValues,
            total_remuneration: calculateTotalRemuneration().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
            show_remuneration: showRemuneration
        };

        return (
            <div className="flex flex-col h-full bg-secondary text-white relative overflow-hidden font-sans p-6" style={{ paddingTop: 'calc(2.5rem + env(safe-area-inset-top))' }}>
                <header className="mb-6 shrink-0 text-center">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Revisão da <span className="text-primary italic">Vaga</span></h2>
                </header>

                <div className="flex-1 min-h-0 bg-white/10 rounded-[2.5rem] border border-white/20 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    <div className="text-center">
                        <h3 className="text-2xl font-black uppercase tracking-tighter mb-1">{displayData.title}</h3>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{location}</p>
                        <div className="mt-2 flex flex-col items-center">
                            {displayData.show_remuneration ? (
                                <>
                                    <p className="text-xl font-black text-green-400">{displayData.total_remuneration}</p>
                                    <p className="text-[8px] font-bold text-white/30 uppercase tracking-widest">Remuneração Total Estimada</p>
                                    <p className="text-[9px] text-white/20 mt-1">(Salário: {salary} + Benefícios)</p>
                                </>
                            ) : (
                                <p className="text-lg font-black text-white">{salary}</p>
                            )}
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-1">
                            <h4 className="text-[9px] font-black text-primary uppercase tracking-widest flex items-center gap-2">
                                <span className="material-symbols-outlined text-xs">description</span> Descrição
                            </h4>
                            <p className="text-[11px] text-white/60 leading-relaxed font-medium">{displayData.description}</p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-[9px] font-black text-primary uppercase tracking-widest">Requisitos</h4>
                            <div className="flex flex-wrap gap-1">
                                {displayData.required_skills.map(s => (
                                    <span key={s} className="px-3 py-1 bg-white/5 rounded-lg text-[9px] font-bold">{s}</span>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <h4 className="text-[9px] font-black text-green-400 uppercase tracking-widest">Benefícios</h4>
                            <div className="flex flex-col gap-2">
                                {displayData.benefits.map(b => (
                                    <div key={b} className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
                                        <div className="flex items-center gap-2">
                                            <span className="material-symbols-outlined text-green-400 text-[14px]">check_circle</span>
                                            <span className="text-[10px] font-black uppercase text-white/70">{b}</span>
                                        </div>
                                        {displayData.benefits_values[b] > 0 && (
                                            <span className="text-[10px] font-bold text-green-400">
                                                +{displayData.benefits_values[b].toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 space-y-3 shrink-0">
                    <button
                        onClick={handleConfirmPublish}
                        disabled={loading}
                        className="w-full h-16 bg-primary text-secondary font-black rounded-2xl shadow-xl uppercase tracking-widest flex items-center justify-center gap-2"
                    >
                        {loading ? <div className="w-5 h-5 border-2 border-secondary/30 border-t-secondary rounded-full animate-spin" /> : 'Publicar Vaga'}
                    </button>
                    <button
                        onClick={() => setPreviewMode(false)}
                        className="w-full h-12 bg-white/5 text-white/40 font-black rounded-2xl uppercase tracking-widest text-[9px]"
                    >
                        Voltar para Ajustes
                    </button>
                </div>
            </div>
        );
    }

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
                        <header className="mb-8 text-center sm:text-left">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Passo 01/07</span>
                            <h1 className="text-2xl font-black uppercase tracking-tighter">Identidade da <span className="text-primary italic">Vaga</span></h1>
                        </header>
                        <div className="space-y-6 flex-1">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                                <div className="flex items-center justify-between mb-4 bg-white/5 p-4 rounded-2xl border border-white/10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-16 h-16 rounded-2xl bg-[#0B0F1A] border border-white/10 flex items-center justify-center overflow-hidden relative group">
                                            <div className={`absolute inset-0 bg-primary/20 blur-xl transition-opacity duration-500 ${isConfidential ? 'opacity-100' : 'opacity-0'}`} />
                                            {isConfidential ? (
                                                <div className="relative z-10 animate-in zoom-in duration-300">
                                                    <JobeeSymbol size={32} mode="dark" />
                                                </div>
                                            ) : (
                                                <img
                                                    src={companyLogo || `https://api.dicebear.com/7.x/initials/svg?seed=${title}`}
                                                    className="w-full h-full object-cover animate-in zoom-in duration-300"
                                                    alt="Company Logo"
                                                />
                                            )}
                                        </div>
                                        <div>
                                            <p className="text-[9px] font-black text-white/40 uppercase tracking-widest mb-1">
                                                {isConfidential ? 'Modo Privado Ativado' : 'Visualização Pública'}
                                            </p>
                                            <p className="text-xs font-bold text-white">
                                                {isConfidential ? 'Marca Oculta (Jobee)' : 'Sua Marca em Destaque'}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setIsConfidential(!isConfidential)}
                                        className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${isConfidential ? 'bg-primary' : 'bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 flex items-center justify-center ${isConfidential ? 'translate-x-6' : 'translate-x-0'}`}>
                                            <span className={`material-symbols-outlined text-[14px] font-black ${isConfidential ? 'text-primary' : 'text-gray-400'}`}>
                                                {isConfidential ? 'visibility_off' : 'visibility'}
                                            </span>
                                        </div>
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/70 uppercase ml-1">Título da Oportunidade</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="Ex: Desenvolvedor React..."
                                        className="w-full h-14 px-6 rounded-2xl border border-white/20 bg-white/5 text-white placeholder-white/20 focus:ring-2 focus:ring-primary/50 outline-none transition-all font-medium text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
                        <header className="mb-8 text-center sm:text-left">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Passo 02/07</span>
                            <h1 className="text-2xl font-black uppercase tracking-tighter">Onde está o <span className="text-primary italic">Enxame?</span></h1>
                        </header>
                        <div className="space-y-6 flex-1">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/70 uppercase ml-1">Modalidade</label>
                                    <div className="flex p-1 bg-white/5 rounded-2xl border border-white/10">
                                        {(['Remoto', 'Presencial', 'Híbrido'] as const).map((t) => (
                                            <button
                                                key={t}
                                                type="button"
                                                onClick={() => setJobType(t)}
                                                className={`flex-1 h-10 rounded-xl text-[10px] font-black uppercase transition-all ${jobType === t ? 'bg-primary text-secondary' : 'text-white/30'}`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/70 uppercase ml-1">Cidade / UF</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={location}
                                            onChange={(e) => setLocation(e.target.value)}
                                            placeholder="Ex: São Paulo / SP"
                                            className="flex-1 h-14 px-6 rounded-2xl border border-white/20 bg-white/5 text-white text-sm"
                                        />
                                        <button type="button" onClick={getCurrentLocation} className="w-14 h-14 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center text-primary">
                                            <span className="material-symbols-outlined text-2xl">location_searching</span>
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center px-1">
                                        <label className="text-[10px] font-black text-white/40 uppercase">Raio de Radar</label>
                                        <span className="text-xs font-black text-primary">{hiringRadius} km</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="1"
                                        max="500"
                                        value={hiringRadius}
                                        onChange={(e) => setHiringRadius(parseInt(e.target.value))}
                                        className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-primary"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
                        <header className="mb-8 text-center sm:text-left">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Passo 03/07</span>
                            <h1 className="text-2xl font-black uppercase tracking-tighter">Mel & <span className="text-primary italic">Ecossistema</span></h1>
                        </header>
                        <div className="space-y-6 flex-1 min-h-0">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4 h-full flex flex-col">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/70 uppercase ml-1">Salário Mensal (Valor Fixo)</label>
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={salary}
                                            onChange={(e) => setSalary(formatCurrencyInput(e.target.value))}
                                            placeholder="0,00"
                                            className="w-full h-14 pl-12 pr-6 rounded-2xl border border-white/20 bg-white/5 text-white text-sm font-bold tracking-wider"
                                        />
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold text-sm">R$</div>
                                    </div>
                                    <p className="text-[9px] text-white/30 px-2 mt-1">Informe o valor bruto mensal exato.</p>
                                </div>
                                <div className="flex-1 flex flex-col space-y-2">
                                    <label className="text-[10px] font-black text-white/70 uppercase ml-1">Descrição</label>
                                    <textarea
                                        value={description}
                                        onChange={(e) => setDescription(e.target.value)}
                                        placeholder="O que o candidato encontrará?"
                                        className="flex-1 w-full p-6 rounded-3xl border border-white/20 bg-white/5 text-white text-sm resize-none custom-scrollbar"
                                    ></textarea>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
                        <header className="mb-8 text-center sm:text-left">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Passo 04/07</span>
                            <h1 className="text-2xl font-black uppercase tracking-tighter">Habilidades da <span className="text-primary italic">Abelha</span></h1>
                        </header>
                        <div className="space-y-6 flex-1">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/70 uppercase ml-1">Habilidades (separadas por vírgula)</label>
                                    <input
                                        type="text"
                                        value={requiredSkills}
                                        onChange={(e) => setRequiredSkills(e.target.value)}
                                        placeholder="React, Figma, Node..."
                                        className="w-full h-14 px-6 rounded-2xl border border-white/20 bg-white/5 text-white text-sm"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/70 uppercase ml-1">Experiência Desejada</label>
                                    <input
                                        type="text"
                                        value={experienceYears}
                                        onChange={(e) => setExperienceYears(e.target.value)}
                                        placeholder="Ex: 2+ anos, Sênior..."
                                        className="w-full h-14 px-6 rounded-2xl border border-white/20 bg-white/5 text-white text-sm"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 5:
                return (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
                        <header className="mb-8 text-center sm:text-left">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Passo 05/07</span>
                            <h1 className="text-2xl font-black uppercase tracking-tighter">Benefícios & <span className="text-primary italic">Mimos</span></h1>
                        </header>
                        <div className="space-y-6 flex-1 overflow-y-auto scrollbar-hide pb-20">
                            <div className="flex flex-wrap gap-2">
                                {PREDEFINED_BENEFITS.map(benefit => (
                                    <button
                                        key={benefit}
                                        type="button"
                                        onClick={() => toggleBenefit(benefit)}
                                        className={`px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-wider transition-all ${selectedBenefits.includes(benefit) ? 'bg-primary border-primary text-secondary shadow-lg' : 'bg-white/5 border-white/10 text-white/40'}`}
                                    >
                                        {benefit}
                                    </button>
                                ))}
                            </div>

                            {selectedBenefits.length > 0 && (
                                <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                                    <h3 className="text-[10px] font-black text-white/40 uppercase tracking-widest border-b border-white/10 pb-2">Valores dos Benefícios (Opcional)</h3>
                                    {selectedBenefits.map(benefit => (
                                        <div key={benefit} className="flex items-center gap-3 bg-white/5 p-3 rounded-2xl border border-white/10">
                                            <span className="text-[10px] font-bold text-white flex-1">{benefit}</span>
                                            <div className="flex items-center gap-2 bg-[#0B0F1A] rounded-xl px-3 py-2 border border-white/10 w-32">
                                                <span className="text-white/30 text-xs">R$</span>
                                                <input
                                                    type="number"
                                                    placeholder="0,00"
                                                    value={benefitsValues[benefit] || ''}
                                                    onChange={(e) => handleBenefitValueChange(benefit, e.target.value)}
                                                    className="w-full bg-transparent text-white text-end outline-none font-bold text-xs"
                                                />
                                            </div>
                                        </div>
                                    ))}

                                    <div className="bg-green-500/10 p-5 rounded-3xl border border-green-500/20 mt-4 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <div>
                                                <p className="text-[9px] font-black text-green-400 uppercase tracking-widest">Remuneração Total Estimada</p>
                                                <p className="text-[8px] font-bold text-green-300/50 uppercase">Salário + Benefícios</p>
                                            </div>
                                            <p className="text-xl font-black text-green-400">
                                                {calculateTotalRemuneration().toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </p>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-green-500/20">
                                            <label className="text-[9px] font-bold text-white/60 uppercase">Divulgar este valor em destaque?</label>
                                            <button
                                                type="button"
                                                onClick={() => setShowRemuneration(!showRemuneration)}
                                                className={`w-10 h-6 rounded-full p-1 transition-colors ${showRemuneration ? 'bg-green-500' : 'bg-white/10'}`}
                                            >
                                                <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform ${showRemuneration ? 'translate-x-4' : ''}`} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            case 6:
                return (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
                        <header className="mb-8 text-center sm:text-left">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Passo 06/07</span>
                            <h1 className="text-2xl font-black uppercase tracking-tighter">Carga <span className="text-primary italic">Horária</span></h1>
                        </header>
                        <div className="space-y-6 flex-1 overflow-y-auto scrollbar-hide">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <span className="text-[8px] font-black text-white/20 uppercase ml-1">Início</span>
                                        <input type="time" value={workStart} onChange={(e) => setWorkStart(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-white/20 bg-white/5 text-white font-bold" />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-[8px] font-black text-white/20 uppercase ml-1">Fim</span>
                                        <input type="time" value={workEnd} onChange={(e) => setWorkEnd(e.target.value)} className="w-full h-12 px-4 rounded-xl border border-white/20 bg-white/5 text-white font-bold" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-white/70 uppercase ml-1">Dias da Semana</label>
                                    <div className="flex flex-col gap-2">
                                        {['2a6a', '2aSab', 'Outro'].map((type) => (
                                            <button
                                                key={type}
                                                type="button"
                                                onClick={() => setWorkDaysType(type as any)}
                                                className={`w-full h-12 rounded-2xl text-[9px] font-black uppercase border transition-all ${workDaysType === type ? 'bg-orange-500 border-orange-400 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}
                                            >
                                                {type === '2a6a' ? 'Segunda a Sexta' : type === '2aSab' ? 'Segunda a Sábado' : 'Outro / Escala'}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 7:
                return (
                    <div className="flex flex-col h-full animate-in fade-in slide-in-from-right-8 duration-500">
                        <header className="mb-6 text-center sm:text-left">
                            <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Passo 07/07</span>
                            <h1 className="text-2xl font-black uppercase tracking-tighter">Agenda de <span className="text-primary italic">Matches</span></h1>
                        </header>
                        <div className="space-y-4 flex-1 overflow-y-auto scrollbar-hide pb-10">
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <button type="button" onClick={() => setInterviewModel('online')} className={`h-12 rounded-2xl text-[10px] font-black uppercase border transition-all ${interviewModel === 'online' ? 'bg-blue-500 border-blue-400 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}>Online</button>
                                    <button type="button" onClick={() => setInterviewModel('in_person')} className={`h-12 rounded-2xl text-[10px] font-black uppercase border transition-all ${interviewModel === 'in_person' ? 'bg-blue-500 border-blue-400 text-white' : 'bg-white/5 border-white/10 text-white/40'}`}>Presencial</button>
                                </div>
                                <input
                                    type="text"
                                    value={interviewDetail}
                                    onChange={(e) => handleAddressSearch(e.target.value)}
                                    placeholder={interviewModel === 'online' ? 'Link do Meet/Zoom' : 'Endereço da Entrevista'}
                                    className="w-full h-14 px-6 rounded-2xl border border-white/20 bg-white/5 text-white text-sm"
                                />
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/10 space-y-3">
                                    <p className="text-[8px] font-black text-white/40 uppercase">Agendamento Automático (Slots)</p>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="date" value={batchDate} onChange={(e) => setBatchDate(e.target.value)} className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white" />
                                        <button type="button" onClick={generateBatchSlots} disabled={!batchDate || !batchStart || !batchEnd} className="bg-primary text-secondary rounded-xl text-[9px] font-black uppercase">Gerar Slots</button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <input type="time" value={batchStart} onChange={(e) => setBatchStart(e.target.value)} className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white" />
                                        <input type="time" value={batchEnd} onChange={(e) => setBatchEnd(e.target.value)} className="h-10 px-3 rounded-xl bg-white/5 border border-white/10 text-xs text-white" />
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {slots.map((s, i) => (
                                        <span key={i} className="px-2 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-[8px] font-black uppercase text-blue-400 flex items-center gap-1">
                                            {s} <button onClick={() => removeSlot(i)} className="text-[10px] leading-none">×</button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <div className="flex flex-col h-full bg-secondary text-white relative overflow-hidden font-sans">
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full"></div>
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            </div>

            <div className="relative z-10 flex flex-col h-full p-6" style={{ paddingTop: 'calc(2.5rem + env(safe-area-inset-top))' }}>
                <div className="flex-1 min-h-0">
                    {renderStep()}
                </div>

                {!isKeyboardOpen && (
                    <div className="pt-6 shrink-0 flex gap-4">
                        {step > 1 && (
                            <button onClick={prevStep} className="w-20 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40">
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                        )}
                        <button
                            onClick={nextStep}
                            className="flex-1 h-16 bg-primary text-secondary font-black rounded-2xl shadow-xl shadow-primary/20 uppercase tracking-widest flex items-center justify-center gap-2 group"
                        >
                            {step === totalSteps ? (
                                <>
                                    <span className="material-symbols-outlined font-black">visibility</span>
                                    Revisar Vaga
                                </>
                            ) : (
                                <>
                                    Continuar
                                    <span className="material-symbols-outlined font-black group-hover:translate-x-1 transition-transform">arrow_forward</span>
                                </>
                            )}
                        </button>
                    </div>
                )}

                {!isKeyboardOpen && (
                    <div className="mt-6 flex justify-center gap-1.5 shrink-0 hide-when-short">
                        {[...Array(totalSteps)].map((_, i) => (
                            <div key={i} className={`h-1 rounded-full transition-all duration-500 ${step === i + 1 ? 'w-8 bg-primary shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'w-2 bg-white/10'}`} />
                        ))}
                    </div>
                )}
            </div>
        </div >
    );
};

export default CreateJobPage;
