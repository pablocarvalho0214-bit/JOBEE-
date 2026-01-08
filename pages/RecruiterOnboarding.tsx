
import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { JobeeSymbol } from '../components/JobeeIdentity';

interface RecruiterOnboardingProps {
    onComplete: () => void;
}

// Industry sectors list for analytics (alphabetically sorted)
const INDUSTRY_SECTORS = [
    'Agronegócio',
    'Alimentação e Bebidas',
    'Automotivo',
    'Construção Civil',
    'Consultoria',
    'Educação',
    'Energia e Utilities',
    'Entretenimento e Mídia',
    'Financeiro e Bancário',
    'Imobiliário',
    'Indústria e Manufatura',
    'Logística e Transporte',
    'Marketing e Publicidade',
    'Saúde e Bem-estar',
    'Serviços Profissionais',
    'Tecnologia da Informação',
    'Telecomunicações',
    'Turismo e Hospitalidade',
    'Varejo e Comércio',
    'Outros'
];

// Job roles list for analytics (sorted by hierarchy, not alphabetically)
const JOB_ROLES = [
    'CEO / Fundador(a)',
    'Diretor(a) Geral',
    'Diretor(a) de RH',
    'Gerente de RH',
    'Gerente de Operações',
    'Business Partner',
    'Coordenador(a) de RH',
    'Supervisor(a)',
    'Analista de RH',
    'Recrutador(a)',
    'Headhunter',
    'Gestor(a) de Pessoas',
    'Assistente de RH',
    'Consultor(a) de RH',
    'Outros'
];

// Brazilian states (alphabetically sorted)
const BRAZILIAN_STATES = [
    'AC - Acre',
    'AL - Alagoas',
    'AP - Amapá',
    'AM - Amazonas',
    'BA - Bahia',
    'CE - Ceará',
    'DF - Distrito Federal',
    'ES - Espírito Santo',
    'GO - Goiás',
    'MA - Maranhão',
    'MT - Mato Grosso',
    'MS - Mato Grosso do Sul',
    'MG - Minas Gerais',
    'PA - Pará',
    'PB - Paraíba',
    'PR - Paraná',
    'PE - Pernambuco',
    'PI - Piauí',
    'RJ - Rio de Janeiro',
    'RN - Rio Grande do Norte',
    'RS - Rio Grande do Sul',
    'RO - Rondônia',
    'RR - Roraima',
    'SC - Santa Catarina',
    'SP - São Paulo',
    'SE - Sergipe',
    'TO - Tocantins'
];

// Cities by state (major cities for each state)
const CITIES_BY_STATE: Record<string, string[]> = {
    'AC - Acre': ['Rio Branco', 'Cruzeiro do Sul', 'Sena Madureira', 'Tarauacá'],
    'AL - Alagoas': ['Maceió', 'Arapiraca', 'Palmeira dos Índios', 'Rio Largo', 'Penedo'],
    'AP - Amapá': ['Macapá', 'Santana', 'Laranjal do Jari', 'Oiapoque'],
    'AM - Amazonas': ['Manaus', 'Parintins', 'Itacoatiara', 'Manacapuru', 'Coari'],
    'BA - Bahia': ['Salvador', 'Feira de Santana', 'Vitória da Conquista', 'Camaçari', 'Itabuna', 'Juazeiro', 'Lauro de Freitas', 'Ilhéus', 'Jequié', 'Teixeira de Freitas'],
    'CE - Ceará': ['Fortaleza', 'Caucaia', 'Juazeiro do Norte', 'Maracanaú', 'Sobral', 'Crato', 'Itapipoca', 'Maranguape', 'Iguatu'],
    'DF - Distrito Federal': ['Brasília', 'Taguatinga', 'Ceilândia', 'Samambaia', 'Planaltina', 'Águas Claras', 'Gama', 'Santa Maria', 'Sobradinho'],
    'ES - Espírito Santo': ['Vitória', 'Vila Velha', 'Serra', 'Cariacica', 'Cachoeiro de Itapemirim', 'Linhares', 'São Mateus', 'Colatina'],
    'GO - Goiás': ['Goiânia', 'Aparecida de Goiânia', 'Anápolis', 'Rio Verde', 'Luziânia', 'Águas Lindas de Goiás', 'Valparaíso de Goiás', 'Trindade'],
    'MA - Maranhão': ['São Luís', 'Imperatriz', 'São José de Ribamar', 'Timon', 'Caxias', 'Codó', 'Paço do Lumiar', 'Açailândia'],
    'MT - Mato Grosso': ['Cuiabá', 'Várzea Grande', 'Rondonópolis', 'Sinop', 'Tangará da Serra', 'Cáceres', 'Sorriso', 'Lucas do Rio Verde'],
    'MS - Mato Grosso do Sul': ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã', 'Aquidauana', 'Nova Andradina'],
    'MG - Minas Gerais': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora', 'Betim', 'Montes Claros', 'Ribeirão das Neves', 'Uberaba', 'Governador Valadares', 'Ipatinga', 'Sete Lagoas', 'Divinópolis', 'Santa Luzia', 'Poços de Caldas'],
    'PA - Pará': ['Belém', 'Ananindeua', 'Santarém', 'Marabá', 'Castanhal', 'Parauapebas', 'Itaituba', 'Cametá'],
    'PB - Paraíba': ['João Pessoa', 'Campina Grande', 'Santa Rita', 'Patos', 'Bayeux', 'Sousa', 'Cajazeiras'],
    'PR - Paraná': ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa', 'Cascavel', 'São José dos Pinhais', 'Foz do Iguaçu', 'Colombo', 'Guarapuava', 'Paranaguá', 'Araucária', 'Toledo'],
    'PE - Pernambuco': ['Recife', 'Jaboatão dos Guararapes', 'Olinda', 'Caruaru', 'Petrolina', 'Paulista', 'Cabo de Santo Agostinho', 'Camaragibe', 'Garanhuns', 'Vitória de Santo Antão'],
    'PI - Piauí': ['Teresina', 'Parnaíba', 'Picos', 'Piripiri', 'Floriano', 'Campo Maior'],
    'RJ - Rio de Janeiro': ['Rio de Janeiro', 'São Gonçalo', 'Duque de Caxias', 'Nova Iguaçu', 'Niterói', 'Belford Roxo', 'Campos dos Goytacazes', 'São João de Meriti', 'Petrópolis', 'Volta Redonda', 'Magé', 'Macaé', 'Itaboraí', 'Cabo Frio', 'Nova Friburgo'],
    'RN - Rio Grande do Norte': ['Natal', 'Mossoró', 'Parnamirim', 'São Gonçalo do Amarante', 'Macaíba', 'Ceará-Mirim', 'Caicó'],
    'RS - Rio Grande do Sul': ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas', 'Santa Maria', 'Gravataí', 'Viamão', 'Novo Hamburgo', 'São Leopoldo', 'Rio Grande', 'Alvorada', 'Passo Fundo', 'Sapucaia do Sul', 'Uruguaiana'],
    'RO - Rondônia': ['Porto Velho', 'Ji-Paraná', 'Ariquemes', 'Vilhena', 'Cacoal', 'Jaru'],
    'RR - Roraima': ['Boa Vista', 'Rorainópolis', 'Caracaraí', 'Alto Alegre'],
    'SC - Santa Catarina': ['Florianópolis', 'Joinville', 'Blumenau', 'São José', 'Criciúma', 'Chapecó', 'Itajaí', 'Jaraguá do Sul', 'Lages', 'Palhoça', 'Balneário Camboriú', 'Brusque'],
    'SP - São Paulo': ['São Paulo', 'Guarulhos', 'Campinas', 'São Bernardo do Campo', 'Santo André', 'Osasco', 'São José dos Campos', 'Ribeirão Preto', 'Sorocaba', 'Mauá', 'São José do Rio Preto', 'Santos', 'Diadema', 'Jundiaí', 'Carapicuíba', 'Piracicaba', 'Bauru', 'São Vicente', 'Itaquaquecetuba', 'Franca', 'Guarujá', 'Taubaté', 'Limeira', 'Suzano', 'Taboão da Serra', 'Sumaré', 'Barueri', 'Embu das Artes', 'São Carlos', 'Marília', 'Indaiatuba', 'Cotia', 'Americana', 'Jacareí', 'Araraquara', 'Praia Grande', 'Hortolândia'],
    'SE - Sergipe': ['Aracaju', 'Nossa Senhora do Socorro', 'Lagarto', 'Itabaiana', 'Estância'],
    'TO - Tocantins': ['Palmas', 'Araguaína', 'Gurupi', 'Porto Nacional', 'Paraíso do Tocantins']
};

const RecruiterOnboarding: React.FC<RecruiterOnboardingProps> = ({ onComplete }) => {
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [uploadingAvatar, setUploadingAvatar] = useState(false);
    const [cnpjError, setCnpjError] = useState('');
    const [whatsappError, setWhatsappError] = useState('');

    const logoInputRef = useRef<HTMLInputElement>(null);
    const avatarInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        companyName: '',
        legalName: '',
        cnpj: '',
        industry: '',
        companySize: '',
        bio: '',
        website: '',
        responsibleName: '',
        responsibleRole: '',
        whatsapp: '',
        headquarters: '',
        city: '',
        customCity: '',
        preferredModality: 'Híbrido',
        companyLogo: '',
        avatarUrl: ''
    });

    // Get available cities based on selected state
    const availableCities = formData.headquarters ? CITIES_BY_STATE[formData.headquarters] || [] : [];

    // Format and validate CPF/CNPJ
    const formatCpfCnpj = (value: string) => {
        const numbers = value.replace(/\D/g, '');

        if (numbers.length <= 11) {
            // CPF format: 000.000.000-00
            return numbers
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        } else {
            // CNPJ format: 00.000.000/0000-00
            return numbers
                .replace(/(\d{2})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1.$2')
                .replace(/(\d{3})(\d)/, '$1/$2')
                .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
        }
    };

    const validateCpfCnpj = (value: string) => {
        const numbers = value.replace(/\D/g, '');

        if (numbers.length === 0) {
            setCnpjError('');
            return true;
        }

        if (numbers.length === 11) {
            setCnpjError('');
            return true; // Valid CPF length
        } else if (numbers.length === 14) {
            setCnpjError('');
            return true; // Valid CNPJ length
        } else {
            setCnpjError('CPF deve ter 11 dígitos ou CNPJ deve ter 14 dígitos');
            return false;
        }
    };

    const handleCpfCnpjChange = (value: string) => {
        const formatted = formatCpfCnpj(value);
        setFormData({ ...formData, cnpj: formatted });
        validateCpfCnpj(formatted);
    };

    // Format and validate WhatsApp
    const formatWhatsApp = (value: string) => {
        const numbers = value.replace(/\D/g, '');

        if (numbers.length <= 10) {
            // Landline: (00) 0000-0000
            return numbers
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{4})(\d)/, '$1-$2');
        } else {
            // Mobile: (00) 00000-0000
            return numbers
                .replace(/(\d{2})(\d)/, '($1) $2')
                .replace(/(\d{5})(\d)/, '$1-$2');
        }
    };

    const validateWhatsApp = (value: string) => {
        const numbers = value.replace(/\D/g, '');

        if (numbers.length === 0) {
            setWhatsappError('');
            return true;
        }

        if (numbers.length === 10 || numbers.length === 11) {
            setWhatsappError('');
            return true;
        } else {
            setWhatsappError('Telefone deve ter 10 ou 11 dígitos');
            return false;
        }
    };

    const handleWhatsAppChange = (value: string) => {
        const formatted = formatWhatsApp(value);
        setFormData({ ...formData, whatsapp: formatted });
        validateWhatsApp(formatted);
    };

    useEffect(() => {
        loadExistingData();
    }, []);

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
                // If metadata exists (as we saved the whole formData there), prioritize it
                const existingData = profile.metadata || {};
                setFormData({
                    companyName: profile.company_name || existingData.companyName || '',
                    legalName: existingData.legalName || '',
                    cnpj: existingData.cnpj || '',
                    industry: existingData.industry || '',
                    companySize: existingData.companySize || '',
                    bio: existingData.bio || '',
                    website: existingData.website || '',
                    responsibleName: profile.full_name || existingData.responsibleName || '',
                    responsibleRole: existingData.responsibleRole || '',
                    whatsapp: existingData.whatsapp || '',
                    headquarters: existingData.headquarters || '',
                    city: existingData.city || '',
                    customCity: existingData.customCity || '',
                    preferredModality: existingData.preferredModality || 'Híbrido',
                    companyLogo: profile.company_logo_url || existingData.companyLogo || '',
                    avatarUrl: profile.avatar_url || existingData.avatarUrl || ''
                });
            } else {
                setFormData(prev => ({
                    ...prev,
                    responsibleName: prev.responsibleName || user.user_metadata?.full_name || user.user_metadata?.name || '',
                    avatarUrl: prev.avatarUrl || user.user_metadata?.avatar_url || user.user_metadata?.picture || ''
                }));
            }

        } catch (error) {
            console.error('Erro ao carregar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'logo' | 'avatar') => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            if (type === 'logo') setUploadingLogo(true); else setUploadingAvatar(true);

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}-${type}-${Math.random()}.${fileExt}`;
            const filePath = `onboarding/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath);

            setFormData(prev => ({
                ...prev,
                [type === 'logo' ? 'companyLogo' : 'avatarUrl']: publicUrl
            }));

        } catch (error: any) {
            console.error('Erro no upload:', error.message);
            alert('Falha no upload. Verifique sua conexão.');
        } finally {
            if (type === 'logo') setUploadingLogo(false); else setUploadingAvatar(false);
        }
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // Save to metadata for quick access and profiles table for persistence
            const { error: authError } = await supabase.auth.updateUser({
                data: {
                    onboarding_completed: true,
                    company_name: formData.companyName,
                    avatar_url: formData.avatarUrl, // Personal photo
                    company_logo: formData.companyLogo,
                    role: 'recruiter'
                }
            });

            if (authError) throw authError;

            const { error: dbError } = await supabase
                .from('profiles')
                .upsert({
                    id: user.id,
                    role: 'recruiter',
                    company_name: formData.companyName,
                    full_name: formData.responsibleName,
                    avatar_url: formData.avatarUrl,
                    company_logo_url: formData.companyLogo,
                    onboarding_completed: true,
                    metadata: formData, // Save everything in a metadata json if columns don't exist
                    updated_at: new Date().toISOString()
                });

            if (dbError) console.error('Database save error:', dbError.message);

            onComplete();
        } catch (error: any) {
            alert('Erro ao salvar perfil: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col min-h-screen bg-secondary text-white relative overflow-hidden font-sans">
            {/* Background Texture & Glow */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[120px] rounded-full"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full"></div>
                <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
            </div>

            <div className="relative z-10 p-6 pt-10 flex flex-col max-w-sm mx-auto w-full h-full shrink-0">
                {/* Stepper Header */}
                <div className="flex items-center gap-4 mb-10 w-full justify-center shrink-0">
                    {[1, 2, 3, 4].map(s => (
                        <div key={s} className="flex items-center">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black transition-all duration-500 border ${step >= s ? 'bg-blue-500 border-blue-400 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]' : 'bg-white/5 border-white/10 text-white/30'}`}>
                                {s}
                            </div>
                            {s < 4 && <div className={`w-8 h-[2px] mx-1 transition-all duration-500 ${step > s ? 'bg-blue-500' : 'bg-white/5'}`}></div>}
                        </div>
                    ))}
                </div>

                <div className="flex-1 overflow-y-auto scrollbar-hide pb-10">

                    {/* Step 1: Photos */}
                    {step === 1 && (
                        <div className="w-full space-y-8 animate-in fade-in slide-in-from-right-8 duration-500">
                            <header className="text-center">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Passo 01/04</span>
                                <h2 className="text-2xl font-black uppercase tracking-tighter mt-1">Identidade Visual</h2>
                                <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest mt-2">Escolha as imagens que representarão sua colmeia.</p>
                            </header>

                            <div className="flex flex-col gap-10 items-center py-4">
                                {/* Company Logo Upload */}
                                <div className="flex flex-col items-center gap-4 group">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Logotipo da Empresa</p>
                                    <div className="relative">
                                        <input type="file" ref={logoInputRef} onChange={(e) => handleFileUpload(e, 'logo')} className="hidden" accept="image/*" />
                                        <div className="w-40 h-40 rounded-[2.5rem] bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden hover:border-blue-400/50 transition-all cursor-pointer p-2" onClick={() => logoInputRef.current?.click()}>
                                            {formData.companyLogo ? (
                                                <img src={formData.companyLogo} className="w-full h-full rounded-[2.2rem] object-cover" alt="Logo" />
                                            ) : uploadingLogo ? (
                                                <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <span className="material-symbols-outlined text-4xl text-white/20">business</span>
                                            )}
                                        </div>
                                        <button onClick={() => logoInputRef.current?.click()} className="absolute -bottom-2 -right-2 w-10 h-10 bg-blue-500 rounded-2xl flex items-center justify-center border-4 border-secondary text-secondary shadow-xl active:scale-90 transition-all">
                                            <span className="material-symbols-outlined text-sm font-black">add_a_photo</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Recruiter Avatar Upload */}
                                <div className="flex flex-col items-center gap-4 group">
                                    <div className="text-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Sua Foto Pessoal</p>
                                        <p className="text-[8px] font-bold text-primary/60 uppercase tracking-tighter mt-1">Exibida durante o chat com candidatos</p>
                                    </div>
                                    <div className="relative">
                                        <input type="file" ref={avatarInputRef} onChange={(e) => handleFileUpload(e, 'avatar')} className="hidden" accept="image/*" />
                                        <div className="w-32 h-32 rounded-full bg-white/5 border-2 border-dashed border-white/20 flex items-center justify-center overflow-hidden hover:border-primary/50 transition-all cursor-pointer p-1" onClick={() => avatarInputRef.current?.click()}>
                                            {formData.avatarUrl ? (
                                                <img src={formData.avatarUrl} className="w-full h-full rounded-full object-cover" alt="Avatar" />
                                            ) : uploadingAvatar ? (
                                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <span className="material-symbols-outlined text-3xl text-white/20">person</span>
                                            )}
                                        </div>
                                        <button onClick={() => avatarInputRef.current?.click()} className="absolute -bottom-1 -right-1 w-8 h-8 bg-primary rounded-xl flex items-center justify-center border-4 border-secondary text-secondary shadow-xl active:scale-90 transition-all">
                                            <span className="material-symbols-outlined text-xs font-black">add_a_photo</span>
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <button onClick={() => setStep(2)} className="w-full h-16 bg-blue-500 text-secondary font-black rounded-2xl uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-blue-500/20">
                                Continuar
                            </button>
                        </div>
                    )}

                    {/* Step 2: Company Info */}
                    {step === 2 && (
                        <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                            <header className="text-center">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Passo 02/04</span>
                                <h2 className="text-2xl font-black uppercase tracking-tighter mt-1">Dados da Colmeia</h2>
                            </header>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Nome Fantasia</label>
                                    <input type="text" value={formData.companyName} onChange={e => setFormData({ ...formData, companyName: e.target.value })} placeholder="Ex: Jobee Tech" className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-white/10" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Razão Social</label>
                                    <input type="text" value={formData.legalName} onChange={e => setFormData({ ...formData, legalName: e.target.value })} placeholder="Ex: Jobee Soluções Digitais LTDA" className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-white/10" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">CPF / CNPJ</label>
                                        <input
                                            type="text"
                                            value={formData.cnpj}
                                            onChange={e => handleCpfCnpjChange(e.target.value)}
                                            placeholder="000.000.000-00"
                                            maxLength={18}
                                            className={`w-full h-14 px-5 rounded-2xl bg-white/5 border ${cnpjError ? 'border-red-500/50' : 'border-white/10'} focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-white/10`}
                                        />
                                        {cnpjError && <p className="text-[8px] text-red-400 ml-4 mt-1">{cnpjError}</p>}
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Tamanho</label>
                                        <select value={formData.companySize} onChange={e => setFormData({ ...formData, companySize: e.target.value })} className="w-full h-14 px-5 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none cursor-pointer">
                                            <option value="" disabled className="bg-secondary">Selecionar</option>
                                            <option value="Somente eu" className="bg-secondary">Somente eu</option>
                                            <option value="1-10" className="bg-secondary">1-10 abelhas</option>
                                            <option value="11-50" className="bg-secondary">11-50 abelhas</option>
                                            <option value="51-200" className="bg-secondary">51-200 abelhas</option>
                                            <option value="200+" className="bg-secondary">200+ abelhas</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Setor de Atuação</label>
                                    <select
                                        value={formData.industry}
                                        onChange={e => setFormData({ ...formData, industry: e.target.value })}
                                        className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled className="bg-secondary">Selecionar setor</option>
                                        {INDUSTRY_SECTORS.map(sector => (
                                            <option key={sector} value={sector} className="bg-secondary">{sector}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setStep(1)} className="w-20 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:bg-white/10 transition-all">
                                    <span className="material-symbols-outlined">arrow_back</span>
                                </button>
                                <button onClick={() => setStep(3)} className="flex-1 h-16 bg-blue-500 text-secondary font-black rounded-2xl uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-blue-500/20">
                                    Próximo
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 3: Responsible info */}
                    {step === 3 && (
                        <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                            <header className="text-center">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Passo 03/04</span>
                                <h2 className="text-2xl font-black uppercase tracking-tighter mt-1">Líder do Enxame</h2>
                            </header>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Nome do Responsável</label>
                                    <input type="text" value={formData.responsibleName} onChange={e => setFormData({ ...formData, responsibleName: e.target.value })} placeholder="Seu nome completo" className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-white/10" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Cargo / Função</label>
                                    <select
                                        value={formData.responsibleRole}
                                        onChange={e => setFormData({ ...formData, responsibleRole: e.target.value })}
                                        className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled className="bg-secondary">Selecionar cargo</option>
                                        {JOB_ROLES.map(role => (
                                            <option key={role} value={role} className="bg-secondary">{role}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">WhatsApp Corporativo</label>
                                    <input
                                        type="text"
                                        value={formData.whatsapp}
                                        onChange={e => handleWhatsAppChange(e.target.value)}
                                        placeholder="(00) 00000-0000"
                                        maxLength={15}
                                        className={`w-full h-14 px-6 rounded-2xl bg-white/5 border ${whatsappError ? 'border-red-500/50' : 'border-white/10'} focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-white/10`}
                                    />
                                    {whatsappError && <p className="text-[8px] text-red-400 ml-4 mt-1">{whatsappError}</p>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Site Oficial</label>
                                    <input type="text" value={formData.website} onChange={e => setFormData({ ...formData, website: e.target.value })} placeholder="www.suaempresa.com.br" className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-white/10" />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setStep(2)} className="w-20 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:bg-white/10 transition-all">
                                    <span className="material-symbols-outlined">arrow_back</span>
                                </button>
                                <button onClick={() => setStep(4)} className="flex-1 h-16 bg-blue-500 text-secondary font-black rounded-2xl uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-blue-500/20">
                                    Próximo
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Step 4: Final Details & Bio */}
                    {step === 4 && (
                        <div className="w-full space-y-6 animate-in fade-in slide-in-from-right-8 duration-500">
                            <header className="text-center">
                                <span className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">Passo 04/04</span>
                                <h2 className="text-2xl font-black uppercase tracking-tighter mt-1">Sede e Cultura</h2>
                            </header>

                            <div className="space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Estado da Sede</label>
                                    <select
                                        value={formData.headquarters}
                                        onChange={e => {
                                            setFormData({ ...formData, headquarters: e.target.value, city: '' });
                                        }}
                                        className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="" disabled className="bg-secondary">Selecionar estado</option>
                                        {BRAZILIAN_STATES.map(state => (
                                            <option key={state} value={state} className="bg-secondary">{state}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Cidade</label>
                                    <select
                                        value={formData.city}
                                        onChange={e => setFormData({ ...formData, city: e.target.value, customCity: '' })}
                                        disabled={!formData.headquarters}
                                        className={`w-full h-14 px-6 rounded-2xl bg-white/5 border border-white/10 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all appearance-none cursor-pointer ${!formData.headquarters ? 'opacity-50 cursor-not-allowed' : ''}`}
                                    >
                                        <option value="" disabled className="bg-secondary">
                                            {formData.headquarters ? 'Selecionar cidade' : 'Selecione o estado primeiro'}
                                        </option>
                                        {availableCities.map(city => (
                                            <option key={city} value={city} className="bg-secondary">{city}</option>
                                        ))}
                                        <option value="Outra" className="bg-secondary font-bold">✏️ Outra (digitar manualmente)</option>
                                    </select>
                                </div>
                                {formData.city === 'Outra' && (
                                    <div className="space-y-1 animate-in fade-in slide-in-from-top-4 duration-300">
                                        <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Digite o nome da cidade</label>
                                        <input
                                            type="text"
                                            value={formData.customCity}
                                            onChange={e => setFormData({ ...formData, customCity: e.target.value })}
                                            placeholder="Ex: Minha Cidade"
                                            className="w-full h-14 px-6 rounded-2xl bg-white/5 border border-primary/30 focus:ring-2 focus:ring-primary/50 outline-none transition-all placeholder:text-white/10"
                                            autoFocus
                                        />
                                    </div>
                                )}
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Modalidade de Trabalho</label>
                                    <div className="flex gap-2">
                                        {['Presencial', 'Híbrido', 'Remoto'].map(mod => (
                                            <button key={mod} onClick={() => setFormData({ ...formData, preferredModality: mod })} className={`flex-1 h-12 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all border ${formData.preferredModality === mod ? 'bg-primary border-primary text-secondary' : 'bg-white/5 border-white/10 text-white/40'}`}>
                                                {mod}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[8px] font-black uppercase tracking-widest text-white/40 ml-4">Bio da Colmeia</label>
                                    <textarea value={formData.bio} onChange={e => setFormData({ ...formData, bio: e.target.value })} placeholder="Conte-nos o que torna sua empresa especial para as abelhas..." className="w-full h-40 p-6 rounded-[2.5rem] bg-white/5 border border-white/10 focus:ring-2 focus:ring-blue-500/50 outline-none transition-all placeholder:text-white/10 resize-none text-sm font-medium leading-relaxed" />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button onClick={() => setStep(3)} className="w-20 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:bg-white/10 transition-all">
                                    <span className="material-symbols-outlined">arrow_back</span>
                                </button>
                                <button onClick={handleFinish} disabled={loading} className="flex-1 h-16 bg-primary text-secondary font-black rounded-2xl uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl shadow-primary/20 flex items-center justify-center gap-2">
                                    {loading ? <div className="w-6 h-6 border-2 border-secondary border-t-transparent rounded-full animate-spin"></div> : <>Ativar Colmeia <span className="material-symbols-outlined font-black">bolt</span></>}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="mt-auto pt-10 pb-6 flex justify-center">
                    <JobeeSymbol size={40} mode="dark" />
                </div>
            </div>
        </div>
    );
};

export default RecruiterOnboarding;
