
import { 
  School, User, Staff, Question, SavedPaper, 
  Syllabus, ClassLevel, Subject, QuestionSource, SubscriptionPlan, ActivityLog, PlatformNotification, ExamPaper, SystemConfig, Transaction
} from '../types';

const API_URL = 'http://localhost:5000/api';

const getHeaders = () => ({
  'Authorization': `Bearer ${localStorage.getItem('ef_token')}`,
  'Content-Type': 'application/json'
});

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options.headers }
  });
  
  if (!res.ok) {
      let errorMessage = 'API Request Failed';
      try {
          const errorData = await res.json();
          errorMessage = errorData.error || errorMessage;
      } catch (e) {
          errorMessage = res.statusText || String(res.status);
      }
      throw new Error(errorMessage);
  }
  
  return await res.json();
}

// --- AUTHENTICATION ---
export const authenticateUser = async (email: string, password: string = 'password') => {
  const data = await apiRequest<any>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
  localStorage.setItem('ef_token', data.token);
  return data.user;
};

// Retrieve current authenticated user profile
export const getCurrentUser = () => apiRequest<User>('/auth/me');

// --- SCHOOLS ---
export const getSchools = () => apiRequest<School[]>('/schools');
export const getSchoolById = (id: string) => apiRequest<School>(`/schools/${id}`);
export const addSchool = (school: Partial<School>) => apiRequest<School>('/schools', { method: 'POST', body: JSON.stringify(school) });
export const updateSchool = (school: School) => apiRequest<School>(`/schools/${school.id}`, { method: 'PUT', body: JSON.stringify(school) });
export const deleteSchool = (id: string) => apiRequest<void>(`/schools/${id}`, { method: 'DELETE' });

// --- QUESTIONS ---
export const getQuestions = () => apiRequest<Question[]>('/questions');
export const addQuestion = (q: Question) => apiRequest<Question>('/questions', { method: 'POST', body: JSON.stringify(q) });
export const updateQuestion = (q: Question) => apiRequest<Question>(`/questions/${q.id}`, { method: 'PUT', body: JSON.stringify(q) });
export const addQuestionsBulk = async (questions: Question[]) => {
    for (const q of questions) await addQuestion(q);
};
export const deleteQuestion = (id: string) => apiRequest<void>(`/questions/${id}`, { method: 'DELETE' });

export const getQuestionTypes = () => apiRequest<any[]>('/curriculum/question-types');

// --- PAPERS ---
export const getSavedPapers = () => apiRequest<SavedPaper[]>('/papers');
export const getPapersBySchool = (schoolId: string) => getSavedPapers(); // Filtered by server context
export const savePaper = (paper: any) => apiRequest<ExamPaper>('/papers', { method: 'POST', body: JSON.stringify(paper) });
export const deletePaper = (id: string) => apiRequest<void>(`/papers/${id}`, { method: 'DELETE' });

// --- CURRICULUM NODES ---
export const getSyllabuses = () => apiRequest<Syllabus[]>('/curriculum/syllabuses');
export const addSyllabus = (s: Partial<Syllabus>) => apiRequest<Syllabus>('/curriculum/syllabuses', { method: 'POST', body: JSON.stringify(s) });
export const deleteSyllabus = (id: string) => apiRequest<void>(`/curriculum/syllabuses/${id}`, { method: 'DELETE' });

export const getClasses = () => apiRequest<ClassLevel[]>('/curriculum/classes');
export const addClass = (c: any) => apiRequest<ClassLevel>('/curriculum/classes', { method: 'POST', body: JSON.stringify(c) });
export const deleteClass = (id: string) => apiRequest<void>(`/curriculum/classes/${id}`, { method: 'DELETE' });

export const getSubjects = () => apiRequest<Subject[]>('/curriculum/subjects');
export const addSubject = (s: any) => apiRequest<Subject>('/curriculum/subjects', { method: 'POST', body: JSON.stringify(s) });
export const deleteSubject = (id: string) => apiRequest<void>(`/curriculum/subjects/${id}`, { method: 'DELETE' });

export const getChapters = () => apiRequest<any[]>('/curriculum/chapters');
export const addChapter = (c: any) => apiRequest<any>('/curriculum/chapters', { method: 'POST', body: JSON.stringify(c) });
export const deleteChapter = (id: string) => apiRequest<void>(`/curriculum/chapters/${id}`, { method: 'DELETE' });

export const getTopics = () => apiRequest<any[]>('/curriculum/topics');
export const addTopic = (t: any) => apiRequest<any>('/curriculum/topics', { method: 'POST', body: JSON.stringify(t) });
export const deleteTopic = (id: string) => apiRequest<void>(`/curriculum/topics/${id}`, { method: 'DELETE' });

export const ensureCurriculumPath = (data: any) => apiRequest<any>('/curriculum/sync', { method: 'POST', body: JSON.stringify(data) });

// --- NOTIFICATIONS ---
export const getPlatformNotifications = () => apiRequest<PlatformNotification[]>('/notifications');
export const getNotificationsForSchool = (schoolId: string) => apiRequest<PlatformNotification[]>('/notifications');
export const addPlatformNotification = (n: any) => apiRequest<PlatformNotification>('/notifications', { method: 'POST', body: JSON.stringify(n) });
export const deletePlatformNotification = (id: string) => apiRequest<void>(`/notifications/${id}`, { method: 'DELETE' });

// --- USERS & STAFF ---
export const getUsers = () => apiRequest<User[]>('/users');
export const addUser = (u: any) => apiRequest<User>('/users', { method: 'POST', body: JSON.stringify(u) });
export const updateUser = (u: any) => apiRequest<User>(`/users/${u.id}`, { method: 'PUT', body: JSON.stringify(u) });
export const deleteUser = (id: string) => apiRequest<void>(`/users/${id}`, { method: 'DELETE' });

export const getStaff = () => apiRequest<Staff[]>('/staff');
export const addStaff = (s: any) => apiRequest<Staff>('/staff', { method: 'POST', body: JSON.stringify(s) });
export const updateStaff = (s: any) => apiRequest<Staff>(`/staff/${s.id}`, { method: 'PUT', body: JSON.stringify(s) });
export const deleteStaff = (id: string) => apiRequest<void>(`/staff/${id}`, { method: 'DELETE' });

// --- PLANS ---
export const getPlans = () => apiRequest<SubscriptionPlan[]>('/plans');
export const addPlan = (p: SubscriptionPlan) => apiRequest<SubscriptionPlan>('/plans', { method: 'POST', body: JSON.stringify(p) });
export const updatePlan = (p: SubscriptionPlan) => apiRequest<SubscriptionPlan>(`/plans/${p.id}`, { method: 'PUT', body: JSON.stringify(p) });
export const deletePlan = (id: string) => apiRequest<void>(`/plans/${id}`, { method: 'DELETE' });

// --- REVENUE ---
export const getTransactions = () => apiRequest<Transaction[]>('/revenue/transactions');
export const addTransaction = (t: Partial<Transaction>) => apiRequest<Transaction>('/revenue/transactions', { method: 'POST', body: JSON.stringify(t) });

// --- AUDIT LOGS ---
export const getActivityLogs = () => apiRequest<ActivityLog[]>('/logs');
export const getActivityLogsBySchool = (schoolId: string) => getActivityLogs();

// --- SOURCES ---
export const getSources = () => apiRequest<any[]>('/sources');
export const addSource = (s: any) => apiRequest<any>('/sources', { method: 'POST', body: JSON.stringify(s) });
export const deleteSource = (id: string) => apiRequest<void>(`/sources/${id}`, { method: 'DELETE' });

// --- SYSTEM SETTINGS ---
export const getSystemConfig = async () => {
  try {
    return await apiRequest<SystemConfig>('/settings');
  } catch (error) {
    console.warn("Failed to fetch system config (Backend might be down or initializing), using defaults.");
    return { 
      currencyCode: 'USD', 
      currencySymbol: '$', 
      platformName: 'ExamForge AI',
      branding: {
        themeColor: '#4f46e5',
        secondaryColor: '#4338ca',
        lightColor: '#eef2ff',
        appFont: "'Inter', sans-serif",
        paperEnglishFont: "'Inter', sans-serif",
        paperUrduFont: "'Noto Nastaliq Urdu', serif"
      }
    };
  }
};

export const updateSystemConfig = (config: SystemConfig) => apiRequest<SystemConfig>('/settings', { method: 'PUT', body: JSON.stringify(config) });

export const initializeDB = () => {};
