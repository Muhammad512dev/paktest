import { User, School, SubscriptionPlan, Question, ExamPaper, SavedPaper, ActivityLog, PlatformNotification, Staff, Transaction, Syllabus, ClassLevel, Subject, Chapter, Source, Student, ExamSubmission } from '../types';
import { PRICING_PLANS } from '../constants'; // Import default plans

// Leave empty when the frontend and API share one domain. For separate hosting,
// set VITE_API_URL to the public backend URL during the frontend build.
const API_URL = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');

const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    'Authorization': token ? `Bearer ${token}` : ''
  };
};

const handleResponse = async <T = any>(res: Response): Promise<T> => {
  if (!res.ok) {
    const ct = res.headers.get('content-type') || '';
    let message = `Request failed (${res.status} ${res.statusText})`;

    if (ct.includes('application/json')) {
      const error = await res.json().catch(() => null);
      if (error?.error) message = error.error;
      else if (typeof error?.message === 'string') message = error.message;
      else if (Array.isArray(error?.details)) message = `Validation failed: ${error.details.join(', ')}`;
      else if (typeof error?.details === 'string') message = error.details;
    } else {
      const text = await res.text().catch(() => '');
      if (text) message = `${message}: ${text.slice(0, 200)}`;
    }

    throw new Error(message);
  }
  return res.json();
};

const unwrapList = <T = any>(payload: any): T[] => {
  if (Array.isArray(payload)) return payload as T[];
  if (payload && Array.isArray(payload.data)) return payload.data as T[];
  return [];
};

const unwrapPaginated = <T = any>(payload: any): { data: T[]; pagination: any } => {
  if (payload && Array.isArray(payload.data) && payload.pagination) return payload;
  return { data: unwrapList<T>(payload), pagination: { page: 1, pageSize: unwrapList<T>(payload).length, total: unwrapList<T>(payload).length, pages: 1 } };
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
  const payload = await handleResponse(res);
  return unwrapList<School>(payload);
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

export const registerSchool = async (data: {
  name: string;
  principalName?: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  adminPassword: string;
  subscriptionPlan: string;
}) => {
  const res = await fetch(`${API_URL}/api/auth/register-school`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  const result = await handleResponse(res);
  if (result.token) {
    localStorage.setItem('token', result.token);
  }
  return result;
};

export const approveSchool = async (schoolId: string) => {
  const res = await fetch(`${API_URL}/api/schools/${schoolId}/approve`, {
    method: 'POST',
    headers: getHeaders()
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
  const payload = await handleResponse(res);
  return unwrapList<User>(payload);
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
const getCurriculum = async <T = any>(type: string): Promise<T[]> => {
  const res = await fetch(`${API_URL}/api/curriculum/${type}`, { headers: getHeaders() });
  return handleResponse<T[]>(res);
};

export const getSyllabuses = () => getCurriculum<Syllabus>('syllabuses');
export const getClasses = () => getCurriculum<ClassLevel>('classes');
export const getSubjects = () => getCurriculum<Subject>('subjects');
export const getChapters = () => getCurriculum<Chapter>('chapters');
export const getTopics = () => getCurriculum<any>('topics');
export const getSources = () => getCurriculum<Source>('sources');

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

const updateCurriculum = async (type: string, id: string, item: any) => {
  const res = await fetch(`${API_URL}/api/curriculum/${type}/${id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(item)
  });
  return handleResponse(res);
};

export const updateSyllabus = (id: string, item: any) => updateCurriculum('syllabuses', id, item);
export const updateClass = (id: string, item: any) => updateCurriculum('classes', id, item);
export const updateSubject = (id: string, item: any) => updateCurriculum('subjects', id, item);
export const updateChapter = (id: string, item: any) => updateCurriculum('chapters', id, item);
export const updateTopic = (id: string, item: any) => updateCurriculum('topics', id, item);
export const updateSource = (id: string, item: any) => updateCurriculum('sources', id, item);

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
export const getQuestionsPage = async (params?: {
  page?: number;
  pageSize?: number;
  q?: string;
  medium?: string;
  subject?: string;
  classLevel?: string;
  type?: string;
  difficulty?: string;
}): Promise<{ data: Question[]; pagination: any }> => {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  if (params?.q) sp.set('q', params.q);
  if (params?.medium) sp.set('medium', params.medium);
  if (params?.subject) sp.set('subject', params.subject);
  if (params?.classLevel) sp.set('classLevel', params.classLevel);
  if (params?.type) sp.set('type', params.type);
  if (params?.difficulty) sp.set('difficulty', params.difficulty);
  const qs = sp.toString();

  const res = await fetch(`${API_URL}/api/questions${qs ? `?${qs}` : ''}`, { headers: getHeaders() });
  const payload = await handleResponse<any>(res);
  return unwrapPaginated<Question>(payload);
};

export const getQuestions = async (params?: Parameters<typeof getQuestionsPage>[0] & { maxPages?: number }): Promise<Question[]> => {
  const pageSize = params?.pageSize || 1000;
  const maxPages = params?.maxPages ?? 10; // safety cap (up to ~10k by default)
  let page = params?.page || 1;
  const all: Question[] = [];

  for (let i = 0; i < maxPages; i++) {
    const resp = await getQuestionsPage({ ...params, page, pageSize });
    all.push(...(resp.data || []));
    if (!resp.pagination || page >= (resp.pagination.pages || 1)) break;
    page += 1;
  }

  // De-dupe by id (some older endpoints/data may duplicate)
  return Array.from(new Map(all.map(q => [q.id, q])).values());
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
  const res = await fetch(`${API_URL}/api/questions/bulk`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ questions })
  });
  return handleResponse(res);
};

// --- PAPERS ---
export const getPapersBySchool = async (schoolId: string) => {
  const sp = new URLSearchParams({ pageSize: '1000' });
  if (schoolId) sp.set('schoolId', schoolId);
  const url = `${API_URL}/api/papers?${sp.toString()}`;
  const res = await fetch(url, { headers: getHeaders() });
  const payload = await handleResponse<any>(res);
  return unwrapList<SavedPaper>(payload);
};

export const getPaperById = async (id: string): Promise<ExamPaper> => {
  const res = await fetch(`${API_URL}/api/papers/${id}`, { headers: getHeaders() });
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

export const getNotes = async (params?: { search?: string; subject?: string; grade?: string; board?: string; noteType?: string }) => {
  const sp = new URLSearchParams();
  if (params?.search) sp.set('search', params.search);
  if (params?.subject) sp.set('subject', params.subject);
  if (params?.grade) sp.set('grade', params.grade);
  if (params?.board) sp.set('board', params.board);
  if (params?.noteType) sp.set('noteType', params.noteType);
  const qs = sp.toString();

  const res = await fetch(`${API_URL}/api/notes${qs ? `?${qs}` : ''}`);
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

export const getPastPapers = async (params?: { search?: string; board?: string; level?: string; subject?: string; year?: string; page?: number; pageSize?: number }) => {
  const sp = new URLSearchParams();
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== '') sp.set(key, String(value));
  });
  const qs = sp.toString();
  const res = await fetch(`${API_URL}/api/past-papers${qs ? `?${qs}` : ''}`);
  return unwrapPaginated<any>(await handleResponse(res));
};
export const getPastPaperFilters = async (): Promise<{ boards: string[]; levels: string[]; subjects: string[]; years: string[] }> => {
  const res = await fetch(`${API_URL}/api/past-papers?filters=true`);
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
  const payload = await handleResponse<any>(res);
  return unwrapList<ActivityLog>(payload);
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

// --- STUDENTS ---
export const getStudents = async (params?: { page?: number; pageSize?: number; classId?: string; q?: string }) => {
  const sp = new URLSearchParams();
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));
  if (params?.classId) sp.set('classId', params.classId);
  if (params?.q) sp.set('q', params.q);

  const qs = sp.toString();
  const res = await fetch(`${API_URL}/api/students${qs ? `?${qs}` : ''}`, { headers: getHeaders() });
  return handleResponse(res);
};

export const addStudent = async (student: any) => {
  const res = await fetch(`${API_URL}/api/students`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(student)
  });
  return handleResponse(res);
};

export const addStudentsBulk = async (students: any[]) => {
  const res = await fetch(`${API_URL}/api/students/bulk`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ students })
  });
  return handleResponse(res);
};


export const updateStudent = async (student: any) => {
  const res = await fetch(`${API_URL}/api/students/${student.id}`, {
    method: 'PUT',
    headers: getHeaders(),
    body: JSON.stringify(student)
  });
  return handleResponse(res);
};

export const deleteStudent = async (id: string) => {
  const res = await fetch(`${API_URL}/api/students/${id}`, {
    method: 'DELETE',
    headers: getHeaders()
  });
  return handleResponse(res);
};

// --- STUDENT PORTAL ---
export const authenticateStudent = async (email: string, password: string): Promise<Student> => {
  const res = await fetch(`${API_URL}/api/student/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  const data = await handleResponse(res);
  localStorage.setItem('token', data.token);
  return data.student;
};

export const getAssignedPapers = async () => {
  const res = await fetch(`${API_URL}/api/student/papers`, { headers: getHeaders() });
  return handleResponse(res);
};

export const getPaperForExam = async (id: string): Promise<ExamPaper> => {
  const res = await fetch(`${API_URL}/api/student/papers/${id}`, { headers: getHeaders() });
  return handleResponse(res);
};

export const submitExam = async (paperId: string, answers: any) => {
  const res = await fetch(`${API_URL}/api/student/submit`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ paperId, answers })
  });
  return handleResponse(res);
};

export const getStudentResults = async () => {
  const res = await fetch(`${API_URL}/api/student/results`, { headers: getHeaders() });
  return handleResponse(res);
};

export const saveExamDraft = async (data: any) => {
  const res = await fetch(`${API_URL}/api/student/draft`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(res);
};

export const getExamDraft = async (paperId: string) => {
  const res = await fetch(`${API_URL}/api/student/draft/${paperId}`, { headers: getHeaders() });
  return handleResponse(res);
};

// --- TEACHER GRADING ---
export const getTeacherSubmissions = async (params?: { paperId?: string; studentId?: string; q?: string; page?: number; pageSize?: number }): Promise<ExamSubmission[]> => {
  const sp = new URLSearchParams();
  if (params?.paperId) sp.set('paperId', params.paperId);
  if (params?.studentId) sp.set('studentId', params.studentId);
  if (params?.q) sp.set('q', params.q);
  if (params?.page) sp.set('page', String(params.page));
  if (params?.pageSize) sp.set('pageSize', String(params.pageSize));

  const qs = sp.toString();
  const res = await fetch(`${API_URL}/api/teacher/submissions${qs ? `?${qs}` : ''}`, { headers: getHeaders() });
  const payload = await handleResponse<any>(res);
  return unwrapList<ExamSubmission>(payload);
};

export const getTeacherStats = async () => {
  const res = await fetch(`${API_URL}/api/teacher/stats`, { headers: getHeaders() });
  return handleResponse(res);
};

export const submitGrade = async (data: any) => {
  const res = await fetch(`${API_URL}/api/teacher/grade`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(res);
};

export const submitAllGrades = async (data: any) => {
  const res = await fetch(`${API_URL}/api/teacher/grade-all`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(data)
  });
  return handleResponse(res);
};
