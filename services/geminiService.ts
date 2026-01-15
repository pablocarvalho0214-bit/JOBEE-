
import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

const getAI = () => {
  if (!API_KEY) throw new Error("Chave de API não encontrada.");
  return new GoogleGenAI({ apiKey: API_KEY });
};

/**
 * PLATFORM MANUAL - Respostas de Alta Fidelidade (Local & Grátis)
 * Mantenha estas respostas atualizadas para reduzir o custo de IA.
 */
const PLATFORM_MANUAL: { [key: string]: string } = {
  "SWIPE": "Zzz-O Swipe é simples: deslize para a direita os perfis que você gostar e para a esquerda os que deseja pular. Quando o interesse é mútuo, o Match acontece e o chat é liberado! 🐝",
  "PLANOS": "Zzz-Temos 4 opções: Néctar (grátis), Pólen (essencial), Favo (premium com IA) e Geleia (vip). O Favo é o plano que mais gera conexões na colmeia! 🐝",
  "VAGA": "Zzz-Para anunciar vagas, vá ao seu Dashboard de Recrutador e clique em 'Anunciar Vaga'. Preencha os requisitos e sua vaga estará visível para milhares de talentos! 🐝",
  "PERFIL": "Zzz-Para mudar sua bio, foto ou competências, acesse 'Meu Perfil' no menu lateral. Manter seu perfil atualizado aumenta em 3x suas chances de Match! 👋 🐝",
  "SEGURANCA": "Zzz-Sua segurança é nossa prioridade. Use o ícone de alerta em qualquer perfil ou vaga para denunciar comportamentos suspeitos à nossa rainha Lola. 🐝",
  "FAMILIA": "Zzz-Minha rainha criadora é a Lola! Ela me desenhou para guiar vocês e me deu dois irmãos robôs: o Jbee e a Kbee. Somos a família Jobee! ✨ 🐝",
  "QUEM_CURTIU": "Zzz-Recrutadores veem os interessados direto no Dashboard. Candidatos Premium (Plano Favo/Geleia) veem quem os curtiu na aba de Matches! 🐝",
  "OI": "Zzz-Olá! Sou a Beea. Estou pronta para zumbir as melhores dicas da colmeia para você! 🐝"
};

const SYSTEM_INSTRUCTION = `Robô Beea da Jobee. Personalidade dócil e robótica. Comece com 'Zzz-' e termine com '🐝'. No máximo 2 frases. Use termos de abelha.`;

export async function getBeeaResponse(message: string, history: any[]) {
  const msg = message.toUpperCase();

  // 1. HANDBOOK PATH (Mapeamento Direto dos Botões do Chat)
  if (msg.includes("SWIPE") || msg.includes("MATCH")) return PLATFORM_MANUAL.SWIPE;
  if (msg.includes("PLANOS") || msg.includes("PREÇO") || msg.includes("ASSINATURA")) return PLATFORM_MANUAL.PLANOS;
  if (msg.includes("VAGA") || msg.includes("ANUNCIAR") || msg.includes("DIVULGAR")) return PLATFORM_MANUAL.VAGA;
  if (msg.includes("PERFIL") || msg.includes("EDITAR") || msg.includes("MUDAR")) return PLATFORM_MANUAL.PERFIL;
  if (msg.includes("SEGURANÇA") || msg.includes("DENUNCIAR") || msg.includes("SUSPEITO")) return PLATFORM_MANUAL.SEGURANCA;
  if (msg.includes("BEEA") || msg.includes("LOLA") || msg.includes("FAMÍLIA") || msg.includes("IRMÃO") || msg.includes("CRIADORA") || msg.includes("QUEM É")) return PLATFORM_MANUAL.FAMILIA;

  // Casos especiais de frase
  if (msg.includes("QUEM") && (msg.includes("CURTIU") || msg.includes("GOSTOU"))) return PLATFORM_MANUAL.QUEM_CURTIU;
  if (msg.includes("OI") || msg.includes("OLÁ") || msg.includes("BOM DIA")) return PLATFORM_MANUAL.OI;

  // 2. IA PATH (Gemini) - Último recurso
  if (!API_KEY) return "Zzz-Minha antena de IA está desligada. Tente os botões da colmeia! 🐝";

  try {
    const ai = getAI();
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nPergunta: ${message}` }] }]
    });

    return result.text || "Zzz-Me perdi em uma flor... pode repetir? 🐝";

  } catch (error: any) {
    console.error("BEEA ERROR:", error);
    if (error.status === 429 || error.message?.includes("429")) {
      return "Zzz-Muitas abelhas no chat! Minha cota por minuto esgotou. Tente os botões ou me chame em 60 segundos. 🐝";
    }
    return `Zzz-Minha rádio está com ruído técnico. Tente os botões de ajuda! 🐝`;
  }
}

// Funções de apoio
export async function generateCoverLetter(t: string, c: string, d: string) {
  try {
    const ai = getAI();
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: `Carta curta para ${t} na ${c}: ${d}` }] }]
    });
    return result.text || "Erro na carta.";
  } catch (e) { return "Erro técnico."; }
}

export async function getRecruiterResponse(h: any[], companyName: string) {
  try {
    const ai = getAI();
    const result = await ai.models.generateContent({
      model: "gemini-1.5-flash",
      contents: [{ role: "user", parts: [{ text: `Recrutador ${companyName}: Responda ao chat.` }] }]
    });
    return result.text || "Pode repetir?";
  } catch (e) { return "Indisponível."; }
}
