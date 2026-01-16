import { User, School, SubscriptionPlan, Question, ExamPaper, ActivityLog, PlatformNotification, Staff, Transaction, Syllabus, ClassLevel, Subject, Source } from '../types';
import { PRICING_PLANS } from '../constants'; // Import default plans

const API_URL = ''; // Relative path, handled by Vite proxy to /api

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }
  return res.json();
};

// --- AUTH ---
export const authenticateUser = async (email: string, password: string): Promise<User> => {
  const res = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await handleResponse(res);
  localStorage.setItem('token', data.token);
  return data.user;
};

export const getCurrentUser = async (): Promise<User | null> => {
  const token = localStorage.getItem('token');
  if (!token) return null;
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, { headers: getHeaders() });
    return await handleResponse(res);
  } catch (e) {
    localStorage.removeItem('token');
    return null;
  }
};

// --- SYSTEM ---
export const initializeDB = async () => {
  // Client-side init if needed, currently no-op as backend handles DB
};

export const getSystemConfig = async () => {
  try {
    const res = await fetch(`${API_URL}/api/public/settings`);
    return await handleResponse(res);
  } catch (e) {
    return { currencySymbol: '$', platformName: 'ExamForge' };
  }
};

export const updateSystemConfig = async (config: any) => {
  const res = await fetch(`${API_URL}/api/settings`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(config)
  });
  return handleResponse(res);
};

export const checkAndTrackAiUsage = async () => {
  // Mock check for now, ideally calls backend to verify limits
  return { success: true };
};

export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);
  const token = localStorage.getItem('token');
  
  const res = await fetch(`${API_URL}/api/upload`, {
    method: 'POST',
    headers: { 'Authorization': token ? `Bearer ${token}` : '' },
    body: formData
  });
  const data = await handleResponse(res);
  return data.url;
};

// --- PUBLIC ---
export const getPublicStats = async () => {
  const res = await fetch(`${API_URL}/api/public/stats`);
  return handleResponse(res);
};

export const getPublicCurriculum = async () => {
  const res = await fetch(`${API_URL}/api/public/curriculum`);
  return handleResponse(res);
};

export const getPublicPlans = async () => {
  try {
    const res = await fetch(`${API_URL}/api/public/plans`);
    const data = await handleResponse(res);
    // If API returns empty, use fallback constant
    if (Array.isArray(data) && data.length > 0) return data;
    return PRICING_PLANS;
  } catch (e) {
    console.warn("API Error fetching plans, using fallback.", e);
    return PRICING_PLANS;
  }
};

export const generatePublicQuiz = async (config: any) => {
  const res = await fetch(`${API_URL}/api/public/quiz/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config)
  });
  return handleResponse(res);
};

export const sendContactQuery = async (data: any) => {
  const res = await fetch(`${API_URL}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return handleResponse(res);
};

// --- SCHOOLS ---
export const getSchools = async () => {
  const res = await fetch(`${API_URL}/api/schools`, { headers: getHeaders() });
  return handleResponse(res);
};

export const getSchoolById = async (id: string) => {
  const res = await fetch(`${API_URL}/api/schools/${id}`, { headers: getHeaders() });
  return handleResponse(res);
};

export const addSchool = async (school: any) => {
  const res = await fetch(`${API_URL}/api/schools`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(school)
  });
  return handleResponse(res);
};

export const updateSchool = async (school: any) => {
  const res = await fetch(`${API_URL}/api/schools/${school.id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(school)
  });
  return handleResponse(res);
};

export const deleteSchool = async (id: string) => {
  const res = await fetch(`${API_URL}/api/schools/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(res);
};

// --- USERS ---
export const getUsers = async () => {
  const res = await fetch(`${API_URL}/api/users`, { headers: getHeaders() });
  return handleResponse(res);
};

export const addUser = async (user: any) => {
  const res = await fetch(`${API_URL}/api/users`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(user)
  });
  return handleResponse(res);
};

export const updateUser = async (user: User) => {
  const res = await fetch(`${API_URL}/api/users/${user.id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(user)
  });
  return handleResponse(res);
};

export const deleteUser = async (id: string) => {
  const res = await fetch(`${API_URL}/api/users/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(res);
};

// --- STAFF ---
export const getStaff = async () => {
  const res = await fetch(`${API_URL}/api/staff`, { headers: getHeaders() });
  return handleResponse(res);
};

export const addStaff = async (staff: any) => {
  const res = await fetch(`${API_URL}/api/staff`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(staff)
  });
  return handleResponse(res);
};

export const updateStaff = async (staff: any) => {
  const res = await fetch(`${API_URL}/api/staff/${staff.id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(staff)
  });
  return handleResponse(res);
};

export const deleteStaff = async (id: string) => {
  const res = await fetch(`${API_URL}/api/staff/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(res);
};

// --- CURRICULUM ---
const getCurriculum = async (type: string) => {
  const res = await fetch(`${API_URL}/api/curriculum/${type}`, { headers: getHeaders() });
  return handleResponse(res);
};

export const getSyllabuses = () => getCurriculum('syllabuses');
export const getClasses = () => getCurriculum('classes');
export const getSubjects = () => getCurriculum('subjects');
export const getChapters = () => getCurriculum('chapters');
export const getTopics = () => getCurriculum('topics');
export const getSources = () => getCurriculum('sources');

const addCurriculum = async (type: string, item: any) => {
  const res = await fetch(`${API_URL}/api/curriculum/${type}`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(item)
  });
  return handleResponse(res);
};

export const addSyllabus = (item: any) => addCurriculum('syllabuses', item);
export const addClass = (item: any) => addCurriculum('classes', item);
export const addSubject = (item: any) => addCurriculum('subjects', item);
export const addChapter = (item: any) => addCurriculum('chapters', item);
export const addTopic = (item: any) => addCurriculum('topics', item);
export const addSource = (item: any) => addCurriculum('sources', item);

const deleteCurriculum = async (type: string, id: string) => {
  const res = await fetch(`${API_URL}/api/curriculum/${type}/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(res);
};

export const deleteSyllabus = (id: string) => deleteCurriculum('syllabuses', id);
export const deleteClass = (id: string) => deleteCurriculum('classes', id);
export const deleteSubject = (id: string) => deleteCurriculum('subjects', id);
export const deleteChapter = (id: string) => deleteCurriculum('chapters', id);
export const deleteTopic = (id: string) => deleteCurriculum('topics', id);
export const deleteSource = (id: string) => deleteCurriculum('sources', id);

export const ensureCurriculumPath = async (path: any) => {
  const res = await fetch(`${API_URL}/api/curriculum/sync`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(path)
  });
  return handleResponse(res);
};

export const getQuestionTypes = async () => {
  const res = await fetch(`${API_URL}/api/curriculum/question-types`);
  return handleResponse(res);
};

// --- QUESTIONS ---
export const getQuestions = async () => {
  const res = await fetch(`${API_URL}/api/questions`, { headers: getHeaders() });
  return handleResponse(res);
};

export const addQuestion = async (q: Partial<Question>) => {
  const res = await fetch(`${API_URL}/api/questions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(q)
  });
  return handleResponse(res);
};

export const updateQuestion = async (q: Question) => {
  const res = await fetch(`${API_URL}/api/questions/${q.id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(q)
  });
  return handleResponse(res);
};

export const deleteQuestion = async (id: string) => {
  const res = await fetch(`${API_URL}/api/questions/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(res);
};

export const addQuestionsBulk = async (questions: Question[]) => {
  // Ideally backend supports bulk, for now loop or specific bulk endpoint
  for (const q of questions) {
    await addQuestion(q);
  }
};

// --- PAPERS ---
export const getPapersBySchool = async (schoolId: string) => {
  let url = `${API_URL}/api/papers`;
  if (schoolId) url += `?schoolId=${schoolId}`;
  const res = await fetch(url, { headers: getHeaders() });
  return handleResponse(res);
};

export const savePaper = async (paper: ExamPaper) => {
  const res = await fetch(`${API_URL}/api/papers`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(paper)
  });
  return handleResponse(res);
};

export const deletePaper = async (id: string) => {
  const res = await fetch(`${API_URL}/api/papers/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(res);
};

// --- CONTENT CMS ---
export const getBlogs = async () => {
  const res = await fetch(`${API_URL}/api/blogs`);
  return handleResponse(res);
};
export const addBlog = async (data: any) => {
  const res = await fetch(`${API_URL}/api/blogs`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(res);
};
export const deleteBlog = async (id: string) => {
  const res = await fetch(`${API_URL}/api/blogs/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(res);
};

export const getNotes = async () => {
  const res = await fetch(`${API_URL}/api/notes`);
  return handleResponse(res);
};
export const addNote = async (data: any) => {
  const res = await fetch(`${API_URL}/api/notes`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(res);
};
export const deleteNote = async (id: string) => {
  const res = await fetch(`${API_URL}/api/notes/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(res);
};

export const getPastPapers = async () => {
  const res = await fetch(`${API_URL}/api/past-papers`);
  return handleResponse(res);
};
export const addPastPaper = async (data: any) => {
  const res = await fetch(`${API_URL}/api/past-papers`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(res);
};
export const deletePastPaper = async (id: string) => {
  const res = await fetch(`${API_URL}/api/past-papers/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(res);
};

export const getContactQueries = async () => {
  const res = await fetch(`${API_URL}/api/contact`, { headers: getHeaders() });
  return handleResponse(res);
};

// --- NOTIFICATIONS ---
export const getPlatformNotifications = async () => {
  const res = await fetch(`${API_URL}/api/notifications`, { headers: getHeaders() });
  return handleResponse(res);
};

export const getNotificationsForSchool = async (schoolId: string) => {
  // Backend filters based on user context
  return getPlatformNotifications();
};

export const addPlatformNotification = async (note: PlatformNotification) => {
  const res = await fetch(`${API_URL}/api/notifications`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(note)
  });
  return handleResponse(res);
};

export const deletePlatformNotification = async (id: string) => {
  const res = await fetch(`${API_URL}/api/notifications/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(res);
};

// --- LOGS ---
export const getActivityLogs = async () => {
  const res = await fetch(`${API_URL}/api/logs`, { headers: getHeaders() });
  return handleResponse(res);
};

export const getActivityLogsBySchool = async (schoolId: string) => {
  // Backend filters by user context
  return getActivityLogs();
};

// --- PLANS & BILLING ---
export const getPlans = async () => {
  const res = await fetch(`${API_URL}/api/plans`, { headers: getHeaders() });
  return handleResponse(res);
};

export const addPlan = async (plan: SubscriptionPlan) => {
  const res = await fetch(`${API_URL}/api/plans`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(plan)
  });
  return handleResponse(res);
};

export const updatePlan = async (plan: SubscriptionPlan) => {
  const res = await fetch(`${API_URL}/api/plans/${plan.id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(plan)
  });
  return handleResponse(res);
};

export const deletePlan = async (id: string) => {
  const res = await fetch(`${API_URL}/api/plans/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(res);
};

export const getTransactions = async () => {
  const res = await fetch(`${API_URL}/api/revenue/transactions`, { headers: getHeaders() });
  return handleResponse(res);
};

export const addTransaction = async (tx: any) => {
  const res = await fetch(`${API_URL}/api/revenue/transactions`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(tx)
  });
  return handleResponse(res);
};
