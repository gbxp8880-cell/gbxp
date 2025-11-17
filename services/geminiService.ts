import { GoogleGenAI, Type, Modality } from "@google/genai";
import { QuizQuestion } from '../types';

const fetchBibleQuizQuestions = async (): Promise<QuizQuestion[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const schema = {
      type: Type.OBJECT,
      properties: {
        questions: {
          type: Type.ARRAY,
          description: "Uma lista de 10 perguntas do quiz bíblico.",
          items: {
            type: Type.OBJECT,
            properties: {
              question: {
                type: Type.STRING,
                description: "O texto da pergunta."
              },
              options: {
                type: Type.ARRAY,
                description: "Uma lista de 4 possíveis respostas em texto.",
                items: {
                  type: Type.STRING
                }
              },
              correctAnswer: {
                type: Type.STRING,
                description: "A resposta correta, que deve corresponder exatamente a uma das opções."
              }
            },
            required: ["question", "options", "correctAnswer"]
          }
        }
      },
      required: ["questions"]
    };

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: "Crie um quiz bíblico com 10 perguntas de múltipla escolha. Cada pergunta deve ter 4 opções de resposta. Forneça a resposta correta para cada pergunta. O quiz deve cobrir uma variedade de tópicos do Antigo e Novo Testamento. O formato da saída deve ser JSON.",
        config: {
            responseMimeType: "application/json",
            responseSchema: schema
        }
    });
    
    const jsonText = response.text.trim();
    const parsedData = JSON.parse(jsonText);
    
    if (parsedData.questions && parsedData.questions.length > 0) {
      return parsedData.questions;
    } else {
      throw new Error("Formato de resposta da API inválido ou sem perguntas.");
    }
  } catch (error) {
    console.error("Erro ao buscar perguntas do quiz:", error);
    throw new Error("Não foi possível carregar as perguntas. Tente novamente mais tarde.");
  }
};

const fetchNarrationAudio = async (text: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        // Uma voz que pode soar mais jovem/amigável
                        prebuiltVoiceConfig: { voiceName: 'Puck' },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (base64Audio) {
            return base64Audio;
        } else {
            console.warn("API did not return audio data for text:", text);
            return "";
        }
    } catch (error) {
        console.error("Error fetching narration audio:", error);
        // Retorna uma string vazia em caso de falha para não quebrar a aplicação
        return "";
    }
};

const fetchBibleCharacterImage = async (characterName: string): Promise<string> => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    {
                        text: `Um desenho animado, estilo infantil e fofo, do personagem ou conceito bíblico: '${characterName}'. O fundo deve ser simples e de cor clara, sem texto na imagem.`,
                    },
                ],
            },
            config: {
                responseModalities: [Modality.IMAGE],
            },
        });
        
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return part.inlineData.data;
            }
        }
        throw new Error("Nenhuma imagem foi gerada.");

    } catch (error) {
        console.error("Erro ao gerar imagem do personagem:", error);
        return "";
    }
};


export { fetchBibleQuizQuestions, fetchNarrationAudio, fetchBibleCharacterImage };