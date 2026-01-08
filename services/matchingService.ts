
import { Job } from '../types';

export interface MatchingResult {
    score: number;
    matchReasons: string[];
    distance?: number;
}

export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371; // km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

export const calculateJobMatch = (job: Job, candidateProfile: any): MatchingResult => {
    let score = 0;
    const reasons: string[] = [];
    let distance: number | undefined;

    if (!candidateProfile) return { score: 50, matchReasons: ['Complete seu perfil para melhorar o match!'] };

    // 0. Distance Calculation (if coordinates available)
    const jobLat = (job as any).latitude;
    const jobLon = (job as any).longitude;
    const userLat = candidateProfile.latitude;
    const userLon = candidateProfile.longitude;

    if (jobLat && jobLon && userLat && userLon) {
        distance = calculateDistance(userLat, userLon, jobLat, jobLon);
        if (distance <= (candidateProfile.search_radius || 50)) {
            score += 10;
            reasons.push('Dentro do seu raio de busca');
        }
    }

    // 1. Skill Match (40% weight)
    const jobSkills = (job as any).required_skills || (job as any).requiredSkills || [];
    const candidateSkills = candidateProfile.skills || [];
    const candidateTools = candidateProfile.metadata?.tools || [];
    const allCandidateAssets = [...candidateSkills, ...candidateTools];

    if (jobSkills.length > 0) {
        const matchingSkills = jobSkills.filter((s: string) =>
            allCandidateAssets.some((ca: string) => ca.toLowerCase() === s.toLowerCase())
        );
        const skillPercentage = (matchingSkills.length / jobSkills.length) * 40;
        score += skillPercentage;
        if (matchingSkills.length > 0) {
            reasons.push(`${matchingSkills.length} habilidades em comum`);
        }
    } else {
        score += 20; // Default if no requirements set
    }

    // 2. Role/Category Match (20% weight)
    const targetRole = (candidateProfile.target_role || '').toLowerCase();
    const jobTitle = (job.title || '').toLowerCase();
    const jobCategory = (job.category || '').toLowerCase();
    const targetIndustry = (candidateProfile.industry || '').toLowerCase();

    if (jobTitle.includes(targetRole) || targetRole.includes(jobTitle)) {
        score += 20;
        reasons.push('Cargo desejado compatível');
    } else if (jobCategory === targetIndustry) {
        score += 15;
        reasons.push('Área de interesse compatível');
    }

    // 3. Modality Match (15% weight)
    const preferredModality = candidateProfile.metadata?.preferredModality;
    if (preferredModality === job.type) {
        score += 15;
        reasons.push(`Vaga ${job.type} como você prefere`);
    } else if (preferredModality === 'Híbrido' || job.type === 'Híbrido') {
        score += 10;
    }

    // 4. Experience Level (15% weight)
    // Simple heuristic: if job mentions level in title or we could add a level field to Job
    const experienceLevel = candidateProfile.metadata?.experienceLevel;
    if (jobTitle.includes(experienceLevel?.toLowerCase())) {
        score += 15;
        reasons.push('Nível de experiência ideal');
    } else {
        score += 10; // Neutral
    }

    // 5. Random/AI Buffer (10% weight) to keep it feeling dynamic
    score += Math.floor(Math.random() * 10);

    // Caps
    const finalScore = Math.min(100, Math.max(0, Math.round(score)));

    return {
        score: finalScore,
        matchReasons: reasons.slice(0, 2),
        distance
    };
};
