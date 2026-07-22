import { Question, Difficulty } from '../types';

export interface AISectionRequest { id: string; type: string; count: number; marks: number; }

const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const callAI = async <T>(path: string, body: unknown): Promise<T> => {
  const token = localStorage.getItem('token');
  const response = await fetch(`${API_URL}/api/ai/${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: token ? `Bearer ${token}` : '' },
    body: JSON.stringify(body)
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || 'AI request failed');
  return data as T;
};

export const generateQuestionsAI = async (subject: string, topic: string, count: number, type: string, difficulty: Difficulty, classLevel: string, bilingual = true): Promise<Partial<Question>[]> => {
  const data = await callAI<{ questions: Partial<Question>[] }>('questions', { subject, topic, count, type, difficulty, classLevel, bilingual });
  return data.questions;
};

export const generatePaperFromDocument = async (base64Data: string, mimeType: string, sections: AISectionRequest[], subject: string, bilingual = true): Promise<Partial<Question>[]> => {
  const data = await callAI<{ questions: Partial<Question>[] }>('document', { base64Data, mimeType, sections, subject, bilingual });
  return data.questions;
};

export const translateToUrdu = async (text: string): Promise<string> => {
  const data = await callAI<{ text: string }>('translate', { text });
  return data.text || '';
};

export const analyzeBookContent = async (base64Data: string, mimeType: string, mode: 'QUESTIONS' | 'CURRICULUM', config: any): Promise<any> =>
  callAI('analyze-book', { base64Data, mimeType, mode, config });

export const getOnlineTopics = async (subject: string, classLevel: string): Promise<string[]> => {
  const data = await callAI<{ topics: string[] }>('topics', { subject, classLevel });
  return data.topics || [];
};
