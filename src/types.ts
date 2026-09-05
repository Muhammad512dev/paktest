
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
  /** Links questions that are alternatives separated by OR / یا. */
  internalChoiceGroupId?: string;
  /** Marks the second (alternative) item in an internal-choice pair. */
  isInternalChoiceAlternative?: boolean;
  /** Part label supplied by a pairing scheme, e.g. a, b, c. */
  schemePartLabel?: string;
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
export type SchemeVersion = 'OLD' | 'NEW';
export type SchemeSectionRole = 'OBJECTIVE' | 'SHORT_GROUP' | 'LONG_QUESTION';

export interface PaperSectionConfig {
  id: string;
  title: string;
  instruction?: string;
  instructionUrdu?: string;
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
  /** Number of sub-parts in each long question, e.g. 2 renders (a) and (b). */
  longPartCount?: number;
  /** Whether the long-question statement/instruction is printed for each question. */
  showQuestionStatement?: boolean;
  /** Explicit compulsory long-question number within this section. */
  compulsoryQuestionNumber?: number;
  /** Explicit hierarchy role. Legacy papers fall back to category/question type. */
  sectionRole?: SchemeSectionRole;
  /** Printed question number/label, independent of title parsing. */
  questionNumber?: number;
  hasParts?: boolean;
  parts?: SchemePart[];
  /** For a non-part long question, generate and print an OR alternative. */
  hasInternalChoice?: boolean;
  chapterDistribution?: SchemeChapterRule[];
  isCompulsory?: boolean;
}

export const getDefaultSectionInstruction = (type: string, selectCount: number, totalCount: number): string => {
  const isAll = selectCount >= totalCount;
  const normType = String(type || '').trim().toLowerCase();

  if (normType.includes('mcq') || normType.includes('multiple choice')) {
    return 'Choose the correct option.';
  } else if (normType.includes('short')) {
    return isAll
      ? 'Write short answers to all questions.'
      : `Write short answers to any ${selectCount} out of ${totalCount} questions.`;
  } else if (normType.includes('long') || normType.includes('essay') || normType.includes('subjective')) {
    return isAll
      ? 'Answer all of the following questions in detail.'
      : `Answer any ${selectCount} out of ${totalCount} questions in detail.`;
  } else if (normType.includes('blank')) {
    return 'Fill in the blanks with appropriate words.';
  } else if (normType.includes('true') || normType.includes('false')) {
    return 'Mark the following statements as True or False.';
  } else if (normType.includes('match') || normType.includes('column')) {
    return 'Match the items in Column A with Column B.';
  } else {
    return isAll
      ? `Answer all of the following ${type} questions.`
      : `Attempt any ${selectCount} out of ${totalCount} questions.`;
  }
};

export const getDefaultSectionInstructionUrdu = (type: string, selectCount: number, totalCount: number): string => {
  const isAll = selectCount >= totalCount;
  const normType = String(type || '').trim().toLowerCase();

  if (normType.includes('mcq') || normType.includes('multiple choice')) {
    return 'درست آپشن کا انتخاب کریں۔';
  } else if (normType.includes('short')) {
    return isAll
      ? 'تمام سوالات کے مختصر جوابات لکھیں۔'
      : `کوئی بھی ${selectCount} سوالات کے مختصر جوابات لکھیں (کل ${totalCount} میں سے)۔`;
  } else if (normType.includes('long') || normType.includes('essay') || normType.includes('subjective')) {
    return isAll
      ? 'درج ذیل تمام سوالات کے تفصیلی جوابات دیں۔'
      : `کوئی بھی ${selectCount} سوالات کے تفصیلی جوابات دیں (کل ${totalCount} میں سے)۔`;
  } else if (normType.includes('blank')) {
    return 'خالی جگہوں کو مناسب الفاظ سے پُر کریں۔';
  } else if (normType.includes('true') || normType.includes('false')) {
    return 'درج ذیل بیانات کو درست یا غلط لکھیں۔';
  } else if (normType.includes('match') || normType.includes('column')) {
    return 'کالم الف کو کالم ب سے ملائیں۔';
  } else {
    return isAll
      ? `درج ذیل تمام سوالات حل کریں۔`
      : `کوئی بھی ${selectCount} سوالات حل کریں (کل ${totalCount} میں سے)۔`;
  }
};

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
  /** Pairing-scheme metadata retained for editing and deterministic rendering. */
  selectedSchemeId?: string;
  schemeVersion?: SchemeVersion;
  attemptLongQuestions?: number;
  compulsoryQuestionNumber?: number;
  /** Whether marks are printed beside each question. Defaults to true for legacy papers. */
  showQuestionMarks?: boolean;
  /** Heading inserted immediately before the long/detailed-answer portion. */
  longQuestionHeading?: string;
  longQuestionHeadingUrdu?: string;
  /** Instruction inserted below the long-question heading. */
  longQuestionInstruction?: string;
  longQuestionInstructionUrdu?: string;
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

// ─── Pairing Scheme Types ──────────────────────────────────────────────────

/** Defines how questions are drawn from chapters for a non-parts section (MCQ/Short) */
export interface SchemeChapterRule {
  chapters: string[];           // Chapter names to pull from
  count: number;                // Number of questions from these chapters
  minCount?: number;            // Minimum from each chapter (for short answer distribution)
}

/** A single part (a), (b) etc. inside a Long Answer question */
export interface SchemePart {
  label: string;                // 'a', 'b', 'c'
  chapter?: string;             // Source chapter name (single)
  chapters?: string[];          // OR list (student gets choice)
  count: number;                // Questions per part (usually 1)
  marks: number;                // Marks for this part
  instruction?: string;         // Optional printed instruction
}

/** One section in a pairing scheme */
export interface SchemeSectionDef {
  id: string;
  type: string;                 // 'MCQ', 'Short Answer', 'Long Answer'
  title: string;                // e.g. 'Q-1 Objective', 'Q-5'
  instruction?: string;         // Optional printed instruction
  totalCount: number;           // Total questions provided
  selectCount: number;          // Questions student must attempt
  marksPerQuestion: number;
  /** Explicit hierarchy role; optional so stored legacy schemes remain valid. */
  sectionRole?: SchemeSectionRole;
  /** Printed question number, independent of a title such as Q-9. */
  questionNumber?: number;
  hasParts: boolean;            // If true, uses `parts` field
  parts?: SchemePart[];         // For Long Answer with (a)(b)(c) breakdown
  /** Valid for non-part long questions and produces an OR / یا alternative. */
  hasInternalChoice?: boolean;
  chapterDistribution?: SchemeChapterRule[];  // For MCQ / Short Answer
  isCompulsory?: boolean;       // If true, printed as compulsory and counted as required
  instructionUrdu?: string;     // Optional Urdu instruction for board templates
}

/** Full pairing scheme record */
export interface PairingScheme {
  id: string;
  name: string;
  syllabusId: string;
  classId: string;
  subjectId: string;
  /** Optional for compatibility: legacy records are treated as OLD. */
  schemeVersion?: SchemeVersion;
  totalMarks: number;
  durationMin: number;
  /** Overall long-question attempt rule shared by Part II. */
  attemptLongQuestions?: number;
  /** Explicit compulsory number used in bilingual Part II instructions. */
  compulsoryQuestionNumber?: number;
  structure: SchemeSectionDef[];
  isGlobal: boolean;            // true = Board / Super Admin scheme
  createdBy: string;
  schoolId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WizardState {
  step: 'SYLLABUS' | 'CLASS' | 'SUBJECT' | 'SCHEME' | 'CHAPTERS' | 'SETUP' | 'EDITOR' | 'AI_AGENT';

  selectedSyllabus?: string;
  selectedClass?: string;
  selectedSubject?: string;
  selectedSchemeVersion?: SchemeVersion;
  selectedSchemeId?: string;
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
