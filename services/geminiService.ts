
// Refactored to follow @google/genai guidelines
import { GoogleGenAI, Type } from "@google/genai";
import { Question, Difficulty } from "../types";

export interface AISectionRequest {
  id: string;
  type: string;
  count: number;
  marks: number;
}

// Using object literal for schema as recommended in guidelines
const questionSchema = {
  type: Type.OBJECT,
  properties: {
    questions: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          text: { type: Type.STRING, description: "The English question text (e.g. 'Match the following columns')" },
          textUrdu: { type: Type.STRING, description: "The Urdu translation of the question" },
          type: { type: Type.STRING },
          options: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Options in English (if MCQ)" 
          },
          optionsUrdu: { 
            type: Type.ARRAY, 
            items: { type: Type.STRING },
            description: "Options in Urdu (if MCQ)" 
          },
          matchingPairs: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                left: { type: Type.STRING, description: "Item in Column A" },
                right: { type: Type.STRING, description: "Correct match in Column B" },
                leftUrdu: { type: Type.STRING, description: "Urdu for Column A item" },
                rightUrdu: { type: Type.STRING, description: "Urdu for Column B item" }
              }
            },
            description: "Essential for 'Match Columns' type. Provide 4-5 pairs."
          },
          correctAnswer: { type: Type.STRING, description: "Correct answer text" },
          marks: { type: Type.INTEGER },
          difficulty: { type: Type.STRING, enum: [Difficulty.EASY, Difficulty.MEDIUM, Difficulty.HARD] },
          topic: { type: Type.STRING }
        },
        required: ["text", "type", "marks", "difficulty"]
      }
    }
  }
};

export const generateQuestionsAI = async (
  subject: string,
  topic: string,
  count: number,
  type: string,
  difficulty: Difficulty,
  classLevel: string,
  bilingual: boolean = true
): Promise<Partial<Question>[]> => {
  try {
    /* Initialize GoogleGenAI right before making an API call as per guidelines */
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    let typeSpecificPrompt = "";
    if (type === 'Match Columns') {
      typeSpecificPrompt = "For 'Match Columns' questions, you MUST populate the 'matchingPairs' array with 4 to 5 distinct pairs (left/right). The 'text' should be the instruction (e.g., 'Match the terms in Column A with Column B'). Do NOT use 'options'.";
    } else if (type === 'MCQ') {
      typeSpecificPrompt = "For 'MCQ', provide exactly 4 'options' and indicate the 'correctAnswer'.";
    }

    const prompt = `Generate ${count} academic questions.
    Type: ${type}
    Subject: ${subject}
    Topic: ${topic}
    Level: ${classLevel} (${difficulty})
    
    ${bilingual ? "Provide high-quality Urdu (Nastaliq style) translations for all text fields (question, options, matching pairs)." : ""}
    ${typeSpecificPrompt}
    
    Return a valid JSON object matching the schema.`;

    // Using ai.models.generateContent directly as per @google/genai requirements
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        temperature: 0.7,
      },
    });

    // response.text is a property, not a method
    const data = JSON.parse(response.text || "{ \"questions\": [] }");
    return data.questions.map((q: any) => ({
      id: crypto.randomUUID(),
      subject,
      topic,
      classLevel,
      ...q
    }));
  } catch (error) {
    console.error("AI Generation failed:", error);
    throw new Error("AI Generation failed.");
  }
};

export const generatePaperFromDocument = async (
  base64Data: string,
  mimeType: string,
  sections: AISectionRequest[],
  subject: string,
  bilingual: boolean = true
): Promise<Partial<Question>[]> => {
  try {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const sectionsDesc = sections.map(s => 
      `- ${s.count} questions of type "${s.type}" (${s.marks} marks each)`
    ).join('\n');

    const prompt = `Analyze the provided document image/PDF. Generate academic questions based on its content.
    
    Required Structure:
    ${sectionsDesc}
    
    Subject context: ${subject}
    ${bilingual ? "- Provide Urdu translations for question text, options, and matching pairs." : ""}
    - For 'Match Columns' questions, you MUST populate the 'matchingPairs' array with correct pairs found in the text.
    - Return a JSON object with a "questions" array containing all generated questions.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-flash-lite-latest', // Using Flash Lite for fast document processing
      contents: {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: prompt }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: questionSchema,
        temperature: 0.5,
      },
    });

    const data = JSON.parse(response.text || "{ \"questions\": [] }");
    return data.questions.map((q: any) => ({
      id: crypto.randomUUID(),
      subject,
      ...q
    }));

  } catch (error) {
    console.error("Document AI Generation failed:", error);
    throw new Error("Failed to generate questions from document.");
  }
};

export const translateToUrdu = async (text: string): Promise<string> => {
  try {
    /* Initialize GoogleGenAI right before making an API call as per guidelines */
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Translate the following academic question to high-quality Urdu (Nastaliq style phrasing): "${text}". Return ONLY the translation.`,
    });
    return response.text?.trim() || "";
  } catch (error) {
    console.error("Translation failed:", error);
    return "";
  }
};

export const analyzeBookContent = async (
  base64Data: string,
  mimeType: string,
  mode: 'QUESTIONS' | 'CURRICULUM',
  config: any
): Promise<any> => {
  /* Initialize GoogleGenAI right before making an API call as per guidelines */
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const prompt = mode === 'QUESTIONS' 
    ? `Generate ${config.count || 10} exam questions for ${config.classLevel} ${config.subject}. Provide bilingual (English/Urdu) output.`
    : `Extract curriculum structure from this textbook.`;
    
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: {
      parts: [{ inlineData: { data: base64Data, mimeType } }, { text: prompt }]
    },
    config: { responseMimeType: "application/json" },
  });
  return JSON.parse(response.text || "{}");
};

export const getOnlineTopics = async (subject: string, classLevel: string): Promise<string[]> => {
  try {
    /* Initialize GoogleGenAI right before making an API call as per guidelines */
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `List 5 curriculum topics for ${classLevel} ${subject}.`,
      config: { 
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            topics: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["topics"]
        }
      },
    });
    const data = JSON.parse(response.text || "{\"topics\":[]}");
    return data.topics;
  } catch (error) {
    console.error("Failed to get online topics:", error);
    return [];
  }
};
