
import { Job, Candidate, Match } from './types';

export const MOCK_JOBS: Job[] = [
  {
    id: '1',
    title: 'Senior React Dev',
    company: 'TechSolutions Inc.',
    companyLogo: 'https://picsum.photos/seed/tech1/100/100',
    location: 'São Paulo, SP',
    salary: 'R$ 12k - 16k',
    matchScore: 98,
    description: 'Estamos buscando um desenvolvedor apaixonado por UI/UX para liderar nosso novo squad de produtos digitais. Se você respira React e Tailwind, essa vaga é sua.',
    type: 'Presencial',
    category: 'Engenharia',
    xpBonus: 500,
    bookmarked: false
  },
  {
    id: '2',
    title: 'Product Designer',
    company: 'Creative Minds',
    companyLogo: 'https://picsum.photos/seed/design1/100/100',
    location: 'Remoto',
    salary: 'R$ 8k - 11k',
    matchScore: 85,
    description: 'Venha desenhar o futuro das fintechs. Procuramos alguém com forte apelo visual e experiência em design systems complexos.',
    type: 'Remoto',
    category: 'Design',
    xpBonus: 350,
    bookmarked: true
  },
  {
    id: '3',
    title: 'Backend Node.js',
    company: 'Global Bank',
    companyLogo: 'https://picsum.photos/seed/bank1/100/100',
    location: 'Rio de Janeiro, RJ',
    salary: 'A combinar',
    matchScore: 75,
    description: 'Expansão da equipe de APIs. Necessário conhecimento sólido em arquitetura de microsserviços e bancos SQL/NoSQL.',
    type: 'Híbrido',
    category: 'Engenharia',
    postedAt: '2 dias',
    bookmarked: false
  }
];

export const MOCK_CANDIDATES: Candidate[] = [
  {
    id: 'c1',
    name: 'Ana Silva',
    age: 28,
    role: 'UX/UI Designer Sênior',
    image: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=600',
    matchScore: 95,
    skills: ['Figma', 'React', 'Design System', 'Acessibilidade'],
    summary: 'Designer criativa com 5 anos de experiência em interfaces acessíveis e sistemas de design escaláveis. Apaixonada por resolver problemas complexos através de UI intuitiva e centrada no usuário.'
  },
  {
    id: 'c2',
    name: 'Carlos Oliveira',
    age: 32,
    role: 'Fullstack Developer',
    image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=600',
    matchScore: 88,
    skills: ['Node.js', 'React', 'PostgreSQL', 'AWS'],
    summary: 'Desenvolvedor com foco em performance e escalabilidade. Experiência em liderança técnica de times ágeis.'
  }
];

export const MOCK_MATCHES: Match[] = [
  {
    id: 'm1',
    companyName: 'TechFlow Systems',
    jobTitle: 'Desenvolvedor Frontend',
    companyLogo: 'https://picsum.photos/seed/techflow/100/100',
    industry: 'Software & Tech',
    timestamp: '2 horas',
    isVerified: true,
    schedulingMode: 'automated',
    interviewModel: 'online',
    interviewDetail: 'https://meet.google.com/abc-defg-hij',
    availabilitySlots: ['10/01 às 14:00', '10/01 às 16:00', '11/01 às 10:00']
  },
  {
    id: 'm2',
    companyName: 'Innovate Corp',
    jobTitle: 'Product Designer',
    companyLogo: 'https://picsum.photos/seed/innovate/100/100',
    industry: 'Consultoria Financeira',
    timestamp: 'ontem',
    schedulingMode: 'manual',
    interviewModel: 'in_person',
    interviewDetail: 'Av. Paulista, 1000 - Bela Vista, SP'
  },
  {
    id: 'm3',
    companyName: 'BlueSky Logistics',
    jobTitle: 'Backend Developer',
    companyLogo: 'https://picsum.photos/seed/bluesky/100/100',
    industry: 'Logística e Transportes',
    timestamp: '3 dias',
    scheduledAt: '12/01 às 15:30 (Presencial)'
  }
];
