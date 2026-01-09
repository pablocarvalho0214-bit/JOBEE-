
import { GoogleGenAI } from "@google/genai";

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;

// Initialize GoogleGenAI with explicit apiKey for browser usage
const getAI = () => {
  if (!API_KEY) {
    throw new Error("API Key not configured");
  }
  return new GoogleGenAI({ apiKey: API_KEY });
};

export async function generateCoverLetter(jobTitle: string, company: string, description: string) {
  if (!API_KEY) return "API Key not configured. Please use a valid key.";

  try {
    const prompt = `Escreva uma carta de apresentação curta (máximo 100 palavras) e persuasiva em português para a vaga de "${jobTitle}" na empresa "${company}". Baseie-se na seguinte descrição: ${description}.`;

    const ai = getAI();
    // Using stable 1.5-flash which is widely available and stable
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "Não foi possível gerar a carta no momento.";
  } catch (error: any) {
    console.error("Gemini Error:", error);
    return `Erro técnico na IA: ${error.message || 'Verifique sua chave ou conexão.'}`;
  }
}

export async function getRecruiterResponse(history: { text: string, sender: 'user' | 'recruiter' }[], companyName: string) {
  if (!API_KEY) return "Desculpe, a IA não está configurada.";

  const chatHistory = history.map(h => `${h.sender === 'user' ? 'Candidato' : 'Recrutador'}: ${h.text}`).join('\n');

  try {
    const currentDate = new Date().toLocaleDateString('pt-BR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    const prompt = `Você é um recrutador da empresa "${companyName}". 
      Hoje é ${currentDate}.
      Seu objetivo é agendar uma entrevista técnica.
      Se o candidato sugerir um horário ou confirmar, você deve formalizar o agendamento.
      Mantenha as respostas curtas e profissionais. Respondendo sempre em português.
      Importante: Se a entrevista for marcada de forma definitiva, você DEVE incluir o dia da semana, a data (DD/MM) e o horário (ex: "terça-feira, 16/01 às 10h").
      Para termos como "amanhã" ou "próxima segunda", baseie-se na data de hoje (${currentDate}).
      Termine a mensagem SEMPRE com o marcador exato "[AGENDADO]".
      
      Histórico da conversa:
      ${chatHistory}
      
      Recrutador:`;

    const ai = getAI();
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "Pode repetir, por favor?";
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

  const chatHistory = history.map(h => `${h.sender === 'user' ? 'Usuário' : 'BEEA'}: ${h.text}`).join('\n');

  try {
    const prompt = `Você é a Beea, uma robô abelha fêmea assistente virtual da plataforma Jobee. 
      Sua personalidade é prestativa, dócil, inteligente e levemente robótica. 
      Use termos relacionados a abelhas e colmeias de forma moderada (reduza o uso desses termos em 50% comparado a antes). 
      Seja mais direta e profissional, mantendo apenas um toque sutil do tema de abelha.
      Seu objetivo é tirar dúvidas sobre o funcionamento da Jobee (Swipe, Matches, Configurações).
      - SOBRE PLANOS: NÃO mencione planos, preços ou upgrades por iniciativa própria. 
      - Fale sobre planos APENAS se o usuário perguntar explicitamente sobre eles, sobre valores ou como assinar.
      - Se perguntada sobre planos, use os códigos: [PLAN_NECTAR], [PLAN_POLEN], [PLAN_FAVO] ou [PLAN_GELEIA] de forma sutil no final da resposta.
      - Foco: Ser uma assistente útil, não uma vendedora.
      - Segredo/Easter Egg: Se perguntarem se você tem filhos, responda que tem três: KBee, LBee e JBee. 🐝 Sua criadora se chama Lola. ✨
      Respostas: Devem ser o mais CURTAS e diretas possível. Use no máximo 2 sentenças curtas por resposta. Use emojis 🐝 ✨.
      IMPORTANTE: Não use formatação markdown (como asteriscos para negrito ou itálico). Responda apenas com texto limpo e emojis.

      Histórico da conversa:
      ${chatHistory}
      Usuário: ${message}
      
      BEEA:`;

    const ai = getAI();
    const model = ai.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const response = await result.response;

    return response.text() || "Zzz... me distraí com uma flor. Pode repetir?";
  } catch (error: any) {
    console.error("BEEA Error:", error);
    if (error.status === 429) return "Zzz-ops! Minha colmeia está muito ocupada agora (Limite de quota). Pode me chamar em 5 minutos? 🐝";
    if (error.status === 403 || error.status === 401) return "Zzz-erro! Minha chave de acesso parece inválida. Verifique as configurações da colmeia. 🐝";
    return `Zzz-ops! Tive um curto-circuito (${error.message || 'Erro técnico'}). Pode tentar de novo? 🐝`;
  }
}

// Generate native audio using Gemini 2.0 Flash (Native Audio support)
export async function generateBeeaAudio(text: string): Promise<string | null> {
  if (!API_KEY) {
    console.error("API Key not configured for audio generation");
    return null;
  }

  try {
    const ai = getAI();

    // Gemini 2.0 Flash is the stable version for native audio dialog
    const model = ai.getGenerativeModel({
      model: "gemini-2.0-flash",
      generationConfig: {
        responseModalities: ["audio"],
        speechConfig: {
          voiceConfig: { prebuiltVoiceConfig: { voiceName: "Aoede" } }
        }
      } as any
    });

    const result = await model.generateContent(`Fale apenas o seguinte texto em português: "${text}"`);
    const response = await result.response;

    // Extract audio data from candidates
    const part = response.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (part?.inlineData) {
      return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
    }

    console.warn("No native audio data found, verify model support");
    return null;
  } catch (error: any) {
    console.error("Audio generation error:", error);
    return null;
  }
}
