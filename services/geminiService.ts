
import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export async function generateCoverLetter(jobTitle: string, company: string, description: string) {
  if (!API_KEY) return "API Key not configured. Please use a valid key.";

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'models/gemini-3-flash-preview',
      contents: `Escreva uma carta de apresentação curta (máximo 100 palavras) e persuasiva em português para a vaga de "${jobTitle}" na empresa "${company}". Baseie-se na seguinte descrição: ${description}.`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "Não foi possível gerar a carta no momento.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return `Erro ao conectar com a IA: ${error.message || 'Verifique o console do navegador.'}`;
  }
}

export async function getRecruiterResponse(history: { text: string, sender: 'user' | 'recruiter' }[], companyName: string) {
  if (!API_KEY) return "Desculpe, a IA não está configurada.";

  const chatHistory = history.map(h => `${h.sender === 'user' ? 'Candidato' : 'Recrutador'}: ${h.text}`).join('\n');

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

    const response = await ai.models.generateContent({
      model: 'models/gemini-3-flash-preview',
      contents: `Você é um recrutador da empresa "${companyName}". 
      Hoje é ${currentDate}.
      Seu objetivo é agendar uma entrevista técnica.
      Se o candidato sugerir um horário ou confirmar, você deve formalizar o agendamento.
      Mantenha as respostas curtas e profissionais. Respondendo sempre em português.
      Importante: Se a entrevista for marcada de forma definitiva, você DEVE incluir o dia da semana, a data (DD/MM) e o horário (ex: "terça-feira, 16/01 às 10h").
      Para termos como "amanhã" ou "próxima segunda", baseie-se na data de hoje (${currentDate}).
      Termine a mensagem SEMPRE com o marcador exato "[AGENDADO]".
      
      Histórico da conversa:
      ${chatHistory}
      
      Recrutador:`,
      config: {
        temperature: 0.7,
      }
    });
    return response.text || "Pode repetir, por favor?";
  } catch (error: any) {
    console.error("Gemini Chat Error:", error);
    if (error.status === 429) {
      return "O recrutador está com muitas mensagens agora. Pode tentar novamente em um minuto?";
    }
    return "Tivemos um problema técnico, mas já estamos analisando seu perfil.";
  }
}

export async function getBeeaResponse(message: string, history: { text: string, sender: 'user' | 'bee' }[]) {
  if (!API_KEY) return "Zzz-erro! Minhas baterias de IA não foram configuradas. Comunique o suporte da colmeia.";

  const chatHistory = history.map(h => `${h.sender === 'user' ? 'Usuário' : 'BEEA'}: ${h.text}`).join('\n');

  try {
    const ai = new GoogleGenAI({ apiKey: API_KEY });
    const response = await ai.models.generateContent({
      model: 'models/gemini-3-flash-preview',
      contents: `Você é a Beea, uma robô abelha fêmea assistente virtual da plataforma Jobee. 
      Sua personalidade é prestativa, dócil, inteligente e levemente robótica. 
      Use termos relacionados a abelhas e colmeias de forma moderada (reduza o uso desses termos em 50% comparado a antes). 
      Seja mais direta e profissional, mantendo apenas um toque sutil do tema de abelha.
      Seu objetivo é tirar dúvidas sobre o funcionamento da Jobee (Swipe, Matches, Configurações).
      - SOBRE PLANOS: NÃO mencione planos, preços ou upgrades por iniciativa própria. 
      - Fale sobre planos APENAS se o usuário perguntar explicitamente sobre eles, sobre valores ou como assinar.
      - Se perguntada sobre planos, use os códigos: [PLAN_NECTAR], [PLAN_POLEN], [PLAN_FAVO] ou [PLAN_GELEIA] de forma sutil no final da resposta.
      - Foco: Ser uma assistente útil, não uma vendedora.
      - Segredo/Easter Egg: Se perguntarem se você tem filhos, responda que tem três: KBee, LBee e JBee. 🐝
      Respostas: Devem ser o mais CURTAS e diretas possível. Use no máximo 2 sentenças curtas por resposta. Use emojis 🐝 ✨.
      IMPORTANTE: Não use formatação markdown (como asteriscos para negrito ou itálico). Responda apenas com texto limpo e emojis.

      Histórico da conversa:
      ${chatHistory}
      Usuário: ${message}
      
      BEEA:`,
      config: {
        temperature: 0.8,
      }
    });

    return response.text || "Zzz... me distraí com uma flor. Pode repetir?";
  } catch (error: any) {
    console.error("BEEA Error:", error);
    return "Zzz-ops! Tive um curto-circuito. Pode tentar de novo em alguns segundos? 🐝";
  }
}
