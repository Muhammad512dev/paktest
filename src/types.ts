
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  SCHOOL_ADMIN = 'SCHOOL_ADMIN',
  TEACHER = 'TEACHER',
  STUDENT = 'STUDENT',
}

export interface NotificationConfig {
  emailAlerts: boolean;
  systemUpdates: boolean;
  marketingMessages: boolean;
  securityAlerts: boolean;
}

export interface SecurityConfig {
  twoFactorEnabled: boolean;
  lastPasswordChange?: string;
  loginHistory?: { date: string, ip: string }[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  schoolId?: string;
  school?: { id: string; name: string; logo?: string; address?: string };
  avatar?: string;
  lastLogin?: string;
  assignedSyllabuses?: string[];
  assignedClasses?: string[];
  assignedSubjects?: string[];
  preferences?: any;
  notificationConfig?: NotificationConfig;
  securityConfig?: SecurityConfig;
}

export interface PlatformNotification {
  id: string;
  title: string;
  message: string;
  type: 'INFO' | 'WARNING' | 'UPDATE' | 'URGENT';
  timestamp: string;
  targetSchoolId: string | 'ALL';
  createdBy: string;
}

export interface Transaction {
  id: string;
  schoolId: string;
  schoolName: string;
  amount: number;
  currency: string;
  date: string;
  status: 'Completed' | 'Pending' | 'Failed';
  invoiceId: string;
  type: 'Subscription' | 'Add-on' | 'Service';
}

export enum QuestionType {
  MCQ = 'MCQ',
  SHORT = 'Short Answer',
  LONG = 'Long Answer',
  MATCH = 'Match Columns',
  DIAGRAM = 'Diagram Based',
  FILL_BLANKS = 'Fill in the Blanks',
  TRUE_FALSE = 'True/False'
}

export enum Difficulty {
  EASY = 'Easy',
  MEDIUM = 'Medium',
  HARD = 'Hard',
}

export enum QuestionSource {
  TEXTBOOK_EXERCISE = 'Textbook Exercise',
  PAST_PAPER = 'Past Paper',
  ECAT = 'ECAT/Entry Test',
  CONCEPTUAL = 'Conceptual',
  MODEL_PAPER = 'Model Paper',
  BOARD_EXAM = 'Board Exam',
  GUESS_PAPER = 'Guess Paper',
  PRE_BOARD_EXAM = 'Pre-Board Exam',
  UNIT_TEST = 'Unit Test'
}

export interface MatchingPair {
  left: string;
  right: string;
  leftUrdu?: string;
  rightUrdu?: string;
}

export interface Question {
  id: string;
  text: string;
  textUrdu?: string;
  type: string;
  subject: string;
  classLevel: string;
  topic: string;
  subtopic?: string;
  difficulty: Difficulty;
  marks: number;
  options?: string[];
  optionsUrdu?: string[];
  matchingPairs?: MatchingPair[];
  imageUrl?: string;
  correctAnswer?: string;
  correctAnswerUrdu?: string;
  chapter?: string;
  source: string;
  sources?: string[];
  year?: number;
  isCompulsory?: boolean;
  medium?: 'English' | 'Urdu' | 'Bilingual';
  isUrdu?: boolean;
  pageBreakAfter?: boolean;
  sectionId?: string;
  schoolId?: string;
}

export interface PaperHeaderConfig {
  schoolName: string;
  logoUrl: string;
  examTitle: string;
  showDate: boolean;
  showStudentName: boolean;
  showRollNo: boolean;
  showClass: boolean;
  showSection: boolean;
  instructions: string;
}

export type NumberingStyle = 'Numeric' | 'Alpha' | 'Roman' | 'AlphaUppercase' | 'RomanUppercase';
export type WatermarkType = 'None' | 'Monogram' | 'Confidential' | 'Draft';
export type PaperLayoutMode = 'Standard' | 'DoubleColumn';

export interface PaperSectionConfig {
  id: string;
  title: string;
  questionType: string;
  marksPerQuestion: number;
  totalCount: number; // Required questions
  selectCount: number; // Questions to actually select (for choice)
  blankLines: number;
  blankLineType: 'Line' | 'Box';
  questionsPerLine: boolean;
  languageMedium: 'English' | 'Urdu' | 'Bilingual';
  sourceFilter: string[];
  category: 'Objective' | 'Subjective';
  subQuestionNumbering: NumberingStyle;
}

export type PaperStructure = Record<string, PaperSectionConfig>;

export interface ExamPaper {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  totalMarks: number;
  durationMinutes: number;
  questions: Question[];
  headerConfig: PaperHeaderConfig;
  structure: PaperStructure;
  watermark: WatermarkType;
  layoutMode: PaperLayoutMode;
  createdAt: string;
  createdBy: string;
  status: 'Draft' | 'Finalized';
  schoolId?: string;
  examDate?: string;
  testType?: string;
  isOnline?: boolean;
}

export interface SavedPaper {
  id: string;
  title: string;
  subject: string;
  classLevel: string;
  dateCreated: string;
  status: 'Draft' | 'Finalized' | 'Printed';
  author: string;
  createdBy?: string;
  totalMarks: number;
  schoolId?: string;
  examDate?: string;
  testType?: string;
  durationMinutes?: number;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: string; // Relaxed type to allow string values
  subjects: string[];
  assignedSyllabuses?: string[];
  assignedClasses?: string[];
  assignedSubjects?: string[];
  status: 'Active' | 'Inactive';
  lastActive: string;
  avatar: string;
  schoolId?: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currencySymbol: string;
  features: string[];
  limits: {
    papers: number;
    staff: number;
    storageGB: number;
    aiRequestsPerDay: number; // New field for AI Limit
  }
}

export interface SchoolBranding {
  themeColor: string;
  secondaryColor: string;
  lightColor: string;
  appFont: string;
  paperEnglishFont: string;
  paperUrduFont: string;
}

export interface School {
  id: string;
  name: string;
  logo: string;
  address: string;
  principalName: string;
  contactEmail: string;
  contactPhone: string;
  subscriptionPlan: string;
  status: 'Active' | 'Suspended' | 'Trial';
  validTill: string;
  subscriptionStartDate: string;
  discount?: number;
  totalPaid?: number;
  assignedSyllabuses?: string[];
  stats: {
    papersCount: number;
    teachersCount: number;
    studentCount: number;
    dailyAiCount?: number; // Track daily usage
    lastAiDate?: string; // Track date of usage
  };
  branding?: SchoolBranding;
  securityConfig?: any;
  notificationSettings?: any;
}

export interface WizardState {
  step: 'SYLLABUS' | 'CLASS' | 'SUBJECT' | 'CHAPTERS' | 'SETUP' | 'EDITOR' | 'AI_AGENT';
  selectedSyllabus?: string;
  selectedClass?: string;
  selectedSubject?: string;
  selectedChapters: string[];
  selectedTopics: string[];
  selectedQuestions: Question[];
  configMode: 'MANUAL' | 'AUTO';
  paperStructure: PaperStructure;
  paperLayout: PaperLayoutMode;
  watermark: WatermarkType;
  isOnline: boolean;
}

export interface Syllabus {
  id: string;
  name: string;
  description: string;
  logo?: string;
}

export interface ClassLevel {
  id: string;
  name: string;
  syllabusId: string;
  logo?: string;
}

export interface Subject {
  id: string;
  name: string;
  classId: string;
  syllabusId: string;
  icon: any;
  logo?: string;
}

export interface Chapter {
  id: string;
  name: string;
  subjectId?: string;
  classId?: string;
  syllabusId?: string;
}

export interface Source {
  id: string;
  name: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  schoolId?: string;
  timestamp: string;
  type: 'PAPER' | 'USER' | 'SCHOOL' | 'BILLING' | 'CURRICULUM' | 'SYSTEM' | 'LOGIN';
  details?: string;
}

export interface SystemConfig {
  currencyCode: string;
  currencySymbol: string;
  platformName?: string;
  platformEmail?: string;
  platformAddress?: string;
  platformContact?: string;
  platformLogo?: string;
  branding?: SchoolBranding;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  rollNo?: string;
  classId: string;
  classLevel?: ClassLevel;
  schoolId: string;
  assignedSubjects?: string[];
  createdAt: string;
}

export interface ExamSubmission {
  id: string;
  studentId: string;
  student?: Student;
  paperId: string;
  paper?: ExamPaper | { title: string, subject: string, totalMarks: number };
  answers: Record<string, {
    studentAnswer: any;
    autoScore: number;
    teacherScore: number;
    feedback?: string;
    isObjective: boolean;
    isCorrect?: boolean;
    // Question context stored at submission time for review
    questionText?: string;
    questionTextUrdu?: string;
    questionType?: string;
    questionMarks?: number;
    questionMedium?: string;
    questionOptions?: string[];
    questionOptionsUrdu?: string[];
    questionCorrectAnswer?: string;
    questionMatchingPairs?: any[];
  }>;
  totalScore: number;
  isGraded: boolean;
  gradedAt?: string;
  gradedBy?: string;
  submittedAt: string;
}
