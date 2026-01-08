
export type Page = 'login' | 'dashboard' | 'jobs' | 'swipe' | 'matches' | 'profile' | 'chat' | 'reset-password' | 'onboarding' | 'brand';

export interface Job {
  id: string;
  title: string;
  company: string;
  companyLogo: string;
  location: string;
  salary: string;
  matchScore: number;
  matchReasons?: string[];
  distance?: number;
  latitude?: number;
  longitude?: number;
  description: string;
  type: 'Remoto' | 'Presencial' | 'Híbrido';
  category: string;
  xpBonus?: number;
  postedAt?: string;
  bookmarked: boolean;
  interviewModel?: 'online' | 'in_person';
  schedulingMode?: 'automated' | 'manual';
  interviewDetail?: string; // Link for online or address for in-person
  interviewDuration?: number; // in minutes
  isConfidential?: boolean;
  requiredSkills?: string[];
  experienceYears?: string;
  benefits?: string[];
  workSchedule?: string;
  lunchTime?: string;
  workDays?: string;
  weeklyHours?: string;
  availabilitySlots?: string[];
  is_sponsored?: boolean;
  priority_level?: number;
}

export interface Candidate {
  id: string;
  name: string;
  age: number;
  role: string;
  image: string;
  matchScore: number;
  skills: string[];
  summary: string;
}

export interface Match {
  id: string;
  companyName: string;
  jobTitle: string;
  companyLogo: string;
  industry: string;
  timestamp: string;
  isVerified?: boolean;
  scheduledAt?: string;
  schedulingMode?: 'automated' | 'manual';
  interviewModel?: 'online' | 'in_person';
  interviewDetail?: string;
  interviewDuration?: number; // in minutes
  availabilitySlots?: string[];
}
