
import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

// Initialize GoogleGenAI correctly for the Unified SDK (@google/genai)
const getAI = () => {
  if (!API_KEY) {
    throw new Error("API Key not configured");
  }
  return new GoogleGenAI({ apiKey: API_KEY });
};

export async function generateCoverLetter(jobTitle: string, company: string, description: string) {
  if (!API_KEY) return "API Key not configured. Please use a valid key.";

  const prompt = `Escreva uma carta de apresentação curta (máximo 100 palavras) e persuasiva em português para a vaga de "${jobTitle}" na empresa "${company}". Baseie-se na seguinte descrição: ${description}.`;

  try {
    const ai = getAI();
    // In @google/genai (Unified SDK), result has a .text() method directly
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }]
    });

    return result.text() || "Não foi possível gerar a carta no momento.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return `Erro técnico na IA: ${error.message || 'Verifique sua chave ou conexão.'}`;
  }
}

export async function getRecruiterResponse(history: { text: string, sender: 'user' | 'recruiter' }[], companyName: string) {
  if (!API_KEY) return "Desculpe, a IA não está configurada.";

  const historyParts = history.map(h => ({
    role: h.sender === 'user' ? 'user' as const : 'model' as const,
    parts: [{ text: h.text }]
  }));

  try {
    const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const systemPrompt = `Você é um recrutador da empresa "${companyName}". 
      Hoje é ${currentDate}.
      Seu objetivo é agendar uma entrevista técnica.
      Se o candidato sugerir um horário ou confirmar, você deve formalizar o agendamento.
      Mantenha as respostas curtas e profissionais. Respondendo sempre em português.
      Importante: Se a entrevista for marcada de forma definitiva, você DEVE incluir o dia da semana, a data (DD/MM) e o horário (ex: "terça-feira, 16/01 às 10h").
      Para termos como "amanhã" ou "próxima segunda", baseie-se na data de hoje (${currentDate}).
      Termine a mensagem SEMPRE com o marcador exato "[AGENDADO]".`;

    const ai = getAI();
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        { role: 'user', parts: [{ text: `CONTEXTO DO SISTEMA: ${systemPrompt}` }] },
        ...historyParts.slice(-10) // Send last 10 messages for context
      ]
    });

    return result.text() || "Pode repetir, por favor?";
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    if (error.status === 429) {
      return "O recrutador está com muitas mensagens agora. Pode tentar novamente em cinco minutos?";
    }
    return `Tivemos um problema técnico (${error.message || 'Error'}), mas já estamos analisando seu perfil.`;
  }
}

export async function getBeeaResponse(message: string, history: { text: string, sender: 'user' | 'bee' }[]) {
  if (!API_KEY) return "Zzz-erro! Minhas baterias de IA não foram configuradas. Comunique o suporte da colmeia.";

  const historyParts = history.map(h => ({
    role: h.sender === 'user' ? 'user' as const : 'model' as const,
    parts: [{ text: h.text }]
  }));

  try {
    const systemPrompt = `Você é a Beea, uma robô abelha fêmea assistente virtual da plataforma Jobee. 
      Sua personalidade é prestativa, dócil, inteligente e levemente robótica. 
      Use termos relacionados a abelhas e colmeias de forma moderada. 
      Seja direta e profissional, mantendo apenas um toque sutil do tema de abelha.
      Seu objetivo é tirar dúvidas sobre o funcionamento da Jobee (Swipe, Matches, Configurações).
      - SOBRE PLANOS: NÃO mencione planos, preços ou upgrades por iniciativa própria. 
      - Fale sobre planos APENAS se o usuário perguntar explicitamente sobre eles.
      - Se perguntada sobre planos, use os códigos: [PLAN_NECTAR], [PLAN_POLEN], [PLAN_FAVO] ou [PLAN_GELEIA] no final.
      - Segredo: Se perguntarem se você tem filhos, responda que tem três: KBee, LBee e JBee. 🐝 Sua criadora se chama Lola. ✨
      Respostas: Curtas e diretas (máximo 2 sentenças). Sem markdown.`;

    const ai = getAI();
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        { role: 'user', parts: [{ text: `CONTEXTO DO SISTEMA: ${systemPrompt}` }] },
        ...historyParts.slice(-6),
        { role: 'user', parts: [{ text: message }] }
      ]
    });

    return result.text() || "Zzz... me distraí com uma flor. Pode repetir?";
  } catch (error: any) {
    console.error("BEEA Error:", error);
    if (error.status === 429) return "Zzz-ops! Minha colmeia está muito ocupada agora (Limite de quota). Pode me chamar em 5 minutos? 🐝";
    return `Zzz-ops! Tive um curto-circuito (${error.message || 'Erro técnico'}). Pode tentar de novo? 🐝`;
  }
}
