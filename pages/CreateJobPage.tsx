import React, { useState } from 'react';
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
    const [hiringRadius, setHiringRadius] = useState<number>(50);
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);

    const [requiredSkills, setRequiredSkills] = useState('');
    const [experienceYears, setExperienceYears] = useState('');
    const [selectedBenefits, setSelectedBenefits] = useState<string[]>([]);
    const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
    const [searchingAddress, setSearchingAddress] = useState(false);

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
        setSelectedBenefits(prev =>
            prev.includes(benefit) ? prev.filter(b => b !== benefit) : [...prev, benefit]
        );
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
                category: 'Geral'
            };

            const { data, error } = await supabase.from('jobs').insert(jobData).select().single();
            if (error) throw error;
            setPublishedJob(data);
            setPreviewMode(false);
        } catch (err) {
            console.error('Error publishing job:', err);
            alert('Erro ao publicar vaga.');
        } finally {
            setLoading(false);
        }
    };

    if (publishedJob) {
        return (
            <div className="flex flex-col h-full bg-secondary text-white p-6 pt-10 justify-center items-center text-center">
                <div className="w-24 h-24 bg-primary rounded-[2.5rem] flex items-center justify-center mb-8 shadow-2xl shadow-primary/20 animate-bounce">
                    <JobeeSymbol size={48} mode="dark" />
                </div>
                <h1 className="text-3xl font-black uppercase tracking-tighter mb-2">Vaga <span className="text-primary italic">Ativada!</span></h1>
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-12">As abelhas já estão em busca do polen.</p>
                <div className="w-full space-y-4 max-w-xs">
                    <button onClick={() => onNavigate?.('jobs')} className="w-full h-16 bg-primary text-secondary font-black rounded-2xl shadow-xl uppercase tracking-widest">Ir para Dashboard</button>
                    <button onClick={() => { setPublishedJob(null); setStep(1); setPreviewMode(false); }} className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest">Criar Outra Vaga</button>
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
        };

        return (
            <div className="flex flex-col h-full bg-secondary text-white relative overflow-hidden font-sans p-6 pt-10">
                <header className="mb-6 shrink-0 text-center">
                    <h2 className="text-2xl font-black uppercase tracking-tighter">Revisão da <span className="text-primary italic">Vaga</span></h2>
                </header>

                <div className="flex-1 min-h-0 bg-white/10 rounded-[2.5rem] border border-white/20 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    <div className="text-center">
                        <h3 className="text-2xl font-black uppercase tracking-tighter mb-1">{displayData.title}</h3>
                        <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{location} • {salary}</p>
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
                            <div className="grid grid-cols-2 gap-2">
                                {displayData.benefits.map(b => (
                                    <div key={b} className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-white/5">
                                        <span className="material-symbols-outlined text-green-400 text-[10px]">check_circle</span>
                                        <span className="text-[8px] font-black uppercase text-white/50">{b}</span>
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
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-[10px] font-black text-white/40 uppercase tracking-widest">Confidencialidade</label>
                                    <button
                                        type="button"
                                        onClick={() => setIsConfidential(!isConfidential)}
                                        className={`flex items-center gap-2 px-4 py-2 rounded-full border transition-all ${isConfidential ? 'bg-primary border-secondary text-secondary' : 'bg-white/5 border-white/10 text-white/40'}`}
                                    >
                                        <span className="material-symbols-outlined text-[16px]">{isConfidential ? 'visibility_off' : 'visibility'}</span>
                                        <span className="text-[9px] font-black uppercase">{isConfidential ? 'Confidencial' : 'Exibir Empresa'}</span>
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
                                    <label className="text-[10px] font-black text-white/70 uppercase ml-1">Faixa Salarial</label>
                                    <input
                                        type="text"
                                        value={salary}
                                        onChange={(e) => setSalary(e.target.value)}
                                        placeholder="R$ 5.000 - 8.000"
                                        className="w-full h-14 px-6 rounded-2xl border border-white/20 bg-white/5 text-white text-sm"
                                    />
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
                                    <label className="text-[10px] font-black text-white/70 uppercase ml-1">Skills (separadas por vírgula)</label>
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
                        <div className="space-y-6 flex-1 overflow-y-auto scrollbar-hide">
                            <div className="flex flex-wrap gap-2 pb-10">
                                {PREDEFINED_BENEFITS.map(benefit => (
                                    <button
                                        key={benefit}
                                        type="button"
                                        onClick={() => toggleBenefit(benefit)}
                                        className={`px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-wider transition-all ${selectedBenefits.includes(benefit) ? 'bg-green-500 border-green-400 text-white shadow-lg' : 'bg-white/5 border-white/10 text-white/40'}`}
                                    >
                                        {benefit}
                                    </button>
                                ))}
                            </div>
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

            <div className="relative z-10 flex flex-col h-full p-6 pt-10">
                <div className="flex-1 min-h-0">
                    {renderStep()}
                </div>

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

                <div className="mt-6 flex justify-center gap-1.5 shrink-0">
                    {[...Array(totalSteps)].map((_, i) => (
                        <div key={i} className={`h-1 rounded-full transition-all duration-500 ${step === i + 1 ? 'w-8 bg-primary shadow-[0_0_10px_rgba(250,204,21,0.5)]' : 'w-2 bg-white/10'}`} />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default CreateJobPage;
