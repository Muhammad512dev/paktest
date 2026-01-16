
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

// --- PUBLIC STATS ---
export const getPublicStats = async () => {
  try {
    return await apiRequest<{ papers: number, schools: number, questions: number }>('/public/stats');
  } catch (error) {
    console.warn("Failed to load public stats (Backend offline?), using defaults.");
    return { papers: 50000, schools: 1200, questions: 2000000 };
  }
};

// --- AUTHENTICATION ---
export const authenticateUser = async (email: string, password: string = 'password') => {
  try {
    const data = await apiRequest<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    localStorage.setItem('ef_token', data.token);
    return data.user;
  } catch (error) {
    // Fallback for demo/offline mode if backend is not running
    console.warn("Auth failed, checking for demo credentials locally");
    if (email === 'admin@examforge.com' && password === 'password') {
       return {
         id: 'admin_01',
         name: 'Alexandra Pierce',
         email: 'admin@examforge.com',
         role: 'SUPER_ADMIN',
         avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150'
       };
    }
    if (email === 'principal@beaconhigh.edu' && password === 'password') {
       return {
         id: 'school_01',
         name: 'Dr. Robert Smith',
         email: 'principal@beaconhigh.edu',
         role: 'SCHOOL_ADMIN',
         schoolId: 's1',
         avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150'
       };
    }
    throw error;
  }
};

// Retrieve current authenticated user profile
export const getCurrentUser = () => apiRequest<User>('/auth/me');

// --- SCHOOLS ---
export const getSchools = () => apiRequest<School[]>('/schools');
export const getSchoolById = async (id: string) => {
    try {
        return await apiRequest<School>(`/schools/${id}`);
    } catch (e) {
        // Fallback for demo
        const { MOCK_SCHOOLS } = await import('../constants');
        return MOCK_SCHOOLS.find(s => s.id === id) || MOCK_SCHOOLS[0];
    }
};
export const addSchool = (school: Partial<School>) => apiRequest<School>('/schools', { method: 'POST', body: JSON.stringify(school) });
export const updateSchool = (school: School) => apiRequest<School>(`/schools/${school.id}`, { method: 'PUT', body: JSON.stringify(school) });
export const deleteSchool = (id: string) => apiRequest<void>(`/schools/${id}`, { method: 'DELETE' });

// --- QUESTIONS ---
export const getQuestions = async () => {
    try {
        return await apiRequest<Question[]>('/questions');
    } catch (e) {
        const { MOCK_QUESTIONS } = await import('../constants');
        return MOCK_QUESTIONS;
    }
};
export const addQuestion = (q: Question) => apiRequest<Question>('/questions', { method: 'POST', body: JSON.stringify(q) });
export const updateQuestion = (q: Question) => apiRequest<Question>(`/questions/${q.id}`, { method: 'PUT', body: JSON.stringify(q) });
export const addQuestionsBulk = async (questions: Question[]) => {
    for (const q of questions) await addQuestion(q);
};
export const deleteQuestion = (id: string) => apiRequest<void>(`/questions/${id}`, { method: 'DELETE' });

export const getQuestionTypes = async () => {
    try {
        return await apiRequest<any[]>('/curriculum/question-types');
    } catch (e) {
        const { DEFAULT_QUESTION_TYPES } = await import('../constants');
        return [...DEFAULT_QUESTION_TYPES];
    }
};

// --- PAPERS ---
export const getSavedPapers = async () => {
    try {
        return await apiRequest<SavedPaper[]>('/papers');
    } catch (e) {
        const { MOCK_SAVED_PAPERS } = await import('../constants');
        return MOCK_SAVED_PAPERS;
    }
};
export const getPapersBySchool = (schoolId: string) => getSavedPapers(); // Filtered by server context
export const savePaper = (paper: any) => apiRequest<ExamPaper>('/papers', { method: 'POST', body: JSON.stringify(paper) });
export const deletePaper = (id: string) => apiRequest<void>(`/papers/${id}`, { method: 'DELETE' });

// --- CURRICULUM NODES ---
export const getSyllabuses = async () => {
    try {
        return await apiRequest<Syllabus[]>('/curriculum/syllabuses');
    } catch (e) {
        const { SYLLABUSES } = await import('../constants');
        return SYLLABUSES;
    }
};
export const addSyllabus = (s: Partial<Syllabus>) => apiRequest<Syllabus>('/curriculum/syllabuses', { method: 'POST', body: JSON.stringify(s) });
export const deleteSyllabus = (id: string) => apiRequest<void>(`/curriculum/syllabuses/${id}`, { method: 'DELETE' });

export const getClasses = async () => {
    try {
        return await apiRequest<ClassLevel[]>('/curriculum/classes');
    } catch (e) {
        const { CLASSES } = await import('../constants');
        return CLASSES;
    }
};
export const addClass = (c: any) => apiRequest<ClassLevel>('/curriculum/classes', { method: 'POST', body: JSON.stringify(c) });
export const deleteClass = (id: string) => apiRequest<void>(`/curriculum/classes/${id}`, { method: 'DELETE' });

export const getSubjects = async () => {
    try {
        return await apiRequest<Subject[]>('/curriculum/subjects');
    } catch (e) {
        const { SUBJECTS } = await import('../constants');
        return SUBJECTS;
    }
};
export const addSubject = (s: any) => apiRequest<Subject>('/curriculum/subjects', { method: 'POST', body: JSON.stringify(s) });
export const deleteSubject = (id: string) => apiRequest<void>(`/curriculum/subjects/${id}`, { method: 'DELETE' });

export const getChapters = async () => {
    try {
        return await apiRequest<any[]>('/curriculum/chapters');
    } catch (e) {
        // Fallback mock chapters logic
        const { CHAPTER_MAPPINGS } = await import('../constants');
        return CHAPTER_MAPPINGS.map((c, i) => ({ id: `ch_${i}`, ...c }));
    }
};
export const addChapter = (c: any) => apiRequest<any>('/curriculum/chapters', { method: 'POST', body: JSON.stringify(c) });
export const deleteChapter = (id: string) => apiRequest<void>(`/curriculum/chapters/${id}`, { method: 'DELETE' });

export const getTopics = async () => {
    try {
        return await apiRequest<any[]>('/curriculum/topics');
    } catch (e) {
        const { CHAPTER_SUBTOPICS, CHAPTER_MAPPINGS } = await import('../constants');
        const topics: any[] = [];
        let idCounter = 0;
        Object.entries(CHAPTER_SUBTOPICS).forEach(([chName, subtopics]) => {
            const ch = CHAPTER_MAPPINGS.find(c => c.name === chName);
            const chId = CHAPTER_MAPPINGS.findIndex(c => c.name === chName);
            if (ch) {
                subtopics.forEach(t => {
                    topics.push({ id: `top_${idCounter++}`, name: t, chapterId: `ch_${chId}` });
                });
            }
        });
        return topics;
    }
};
export const addTopic = (t: any) => apiRequest<any>('/curriculum/topics', { method: 'POST', body: JSON.stringify(t) });
export const deleteTopic = (id: string) => apiRequest<void>(`/curriculum/topics/${id}`, { method: 'DELETE' });

export const ensureCurriculumPath = (data: any) => apiRequest<any>('/curriculum/sync', { method: 'POST', body: JSON.stringify(data) });

// --- NOTIFICATIONS ---
export const getPlatformNotifications = async () => {
    try {
        return await apiRequest<PlatformNotification[]>('/notifications');
    } catch (e) { return []; }
};
export const getNotificationsForSchool = (schoolId: string) => getPlatformNotifications();
export const addPlatformNotification = (n: any) => apiRequest<PlatformNotification>('/notifications', { method: 'POST', body: JSON.stringify(n) });
export const deletePlatformNotification = (id: string) => apiRequest<void>(`/notifications/${id}`, { method: 'DELETE' });

// --- CONTENT MANAGEMENT (BLOGS, NOTES, PAST PAPERS) ---
export const getBlogs = async () => { try { return await apiRequest<any[]>('/blogs'); } catch (e) { return []; } };
export const addBlog = (d: any) => apiRequest<any>('/blogs', { method: 'POST', body: JSON.stringify(d) });
export const deleteBlog = (id: string) => apiRequest<void>(`/blogs/${id}`, { method: 'DELETE' });

export const getNotes = async () => { try { return await apiRequest<any[]>('/notes'); } catch (e) { return []; } };
export const addNote = (d: any) => apiRequest<any>('/notes', { method: 'POST', body: JSON.stringify(d) });
export const deleteNote = (id: string) => apiRequest<void>(`/notes/${id}`, { method: 'DELETE' });

export const getPastPapers = async () => { try { return await apiRequest<any[]>('/past-papers'); } catch (e) { return []; } };
export const addPastPaper = (d: any) => apiRequest<any>('/past-papers', { method: 'POST', body: JSON.stringify(d) });
export const deletePastPaper = (id: string) => apiRequest<void>(`/past-papers/${id}`, { method: 'DELETE' });

// --- CONTACT FORM ---
export const sendContactQuery = (data: any) => apiRequest<any>('/contact', { method: 'POST', body: JSON.stringify(data) });
export const getContactQueries = async () => {
    try {
        return await apiRequest<any[]>('/contact');
    } catch (e) {
        return [];
    }
};

// --- USERS & STAFF ---
export const getUsers = async () => {
    try {
        return await apiRequest<User[]>('/users');
    } catch (e) {
        const { MOCK_USERS } = await import('../constants');
        return MOCK_USERS;
    }
};
export const addUser = (u: any) => apiRequest<User>('/users', { method: 'POST', body: JSON.stringify(u) });
export const updateUser = (u: any) => apiRequest<User>(`/users/${u.id}`, { method: 'PUT', body: JSON.stringify(u) });
export const deleteUser = (id: string) => apiRequest<void>(`/users/${id}`, { method: 'DELETE' });

export const getStaff = async () => {
    try {
        return await apiRequest<Staff[]>('/staff');
    } catch (e) {
        const { MOCK_STAFF } = await import('../constants');
        return MOCK_STAFF;
    }
};
export const addStaff = (s: any) => apiRequest<Staff>('/staff', { method: 'POST', body: JSON.stringify(s) });
export const updateStaff = (s: any) => apiRequest<Staff>(`/staff/${s.id}`, { method: 'PUT', body: JSON.stringify(s) });
export const deleteStaff = (id: string) => apiRequest<void>(`/staff/${id}`, { method: 'DELETE' });

// --- PLANS ---
export const getPlans = async () => {
    try {
        return await apiRequest<SubscriptionPlan[]>('/plans');
    } catch (e) {
        const { PRICING_PLANS } = await import('../constants');
        return PRICING_PLANS;
    }
};
export const addPlan = (p: SubscriptionPlan) => apiRequest<SubscriptionPlan>('/plans', { method: 'POST', body: JSON.stringify(p) });
export const updatePlan = (p: SubscriptionPlan) => apiRequest<SubscriptionPlan>(`/plans/${p.id}`, { method: 'PUT', body: JSON.stringify(p) });
export const deletePlan = (id: string) => apiRequest<void>(`/plans/${id}`, { method: 'DELETE' });

// --- REVENUE ---
export const getTransactions = async () => {
    try {
        return await apiRequest<Transaction[]>('/revenue/transactions');
    } catch (e) { return []; }
};
export const addTransaction = (t: Partial<Transaction>) => apiRequest<Transaction>('/revenue/transactions', { method: 'POST', body: JSON.stringify(t) });

// --- AUDIT LOGS ---
export const getActivityLogs = async () => {
    try {
        return await apiRequest<ActivityLog[]>('/logs');
    } catch (e) { return []; }
};
export const getActivityLogsBySchool = (schoolId: string) => getActivityLogs();

// --- SOURCES ---
export const getSources = async () => {
    try {
        return await apiRequest<any[]>('/sources');
    } catch (e) {
        return [{ id: 'src_1', name: 'Past Paper' }, { id: 'src_2', name: 'Textbook' }];
    }
};
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
