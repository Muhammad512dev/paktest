import { School, Question, QuestionType, Difficulty, User, UserRole, Syllabus, ClassLevel, Subject, QuestionSource, SavedPaper, Staff, SubscriptionPlan } from "./types";
import { Calculator, Book, FlaskConical, Globe, Languages, Code, History as HistoryIcon, Microscope, Palette, Music, Atom, Binary, Brain, Zap, TestTube } from 'lucide-react';

// --- QUESTION TYPES DEFINITION ---
export const DEFAULT_QUESTION_TYPES = [
  { id: 'MCQ', name: 'Multiple Choice', category: 'Objective' },
  { id: 'Match Columns', name: 'Match Columns', category: 'Objective' },
  { id: 'Fill in the Blanks', name: 'Fill in the Blanks', category: 'Objective' },
  { id: 'True/False', name: 'True/False', category: 'Objective' },
  { id: 'Short Answer', name: 'Short Answer', category: 'Subjective' },
  { id: 'Long Answer', name: 'Long Answer', category: 'Subjective' },
  { id: 'Diagram Based', name: 'Diagram Based', category: 'Subjective' },
] as const;

export const MOCK_USERS: User[] = [
  {
    id: 'admin_01',
    name: 'Alexandra Pierce',
    email: 'admin@examforge.com',
    role: UserRole.SUPER_ADMIN,
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastLogin: 'Just now'
  },
  {
    id: 'school_01',
    name: 'Dr. Robert Smith',
    email: 'principal@beaconhigh.edu',
    role: UserRole.SCHOOL_ADMIN,
    schoolId: 's1',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80',
    lastLogin: '2 hours ago'
  },
  {
    id: 'teacher_01',
    name: 'Alice Johnson',
    email: 'alice@beaconhigh.edu',
    role: UserRole.TEACHER,
    schoolId: 's1',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150',
    lastLogin: 'Just now'
  }
];

export const MOCK_SCHOOLS: School[] = [
  {
    id: 's1',
    name: 'Beacon High International',
    logo: 'https://img.logoipsum.com/243.svg',
    address: '123 Education Ave, New York, NY',
    principalName: 'Dr. Robert Smith',
    contactEmail: 'info@beaconhigh.edu',
    contactPhone: '+1 (555) 123-4567',
    subscriptionPlan: 'Enterprise',
    status: 'Active',
    subscriptionStartDate: '2024-01-01',
    validTill: '2025-12-31',
    stats: { papersCount: 1450, teachersCount: 45, studentCount: 1200 },
    branding: {
        themeColor: '#4f46e5',
        secondaryColor: '#4338ca',
        lightColor: '#eef2ff',
        appFont: "'Inter', sans-serif",
        paperEnglishFont: "'Inter', sans-serif",
        paperUrduFont: "'Noto Nastaliq Urdu', serif"
    }
  }
];

export const SYLLABUSES: Syllabus[] = [
  { id: 'cambridge', name: 'Cambridge International', description: 'IGCSE & O Levels global curriculum' },
  { id: 'federal', name: 'Federal Board (FBISE)', description: 'Official Federal Government Board of Pakistan' },
  { id: 'punjab', name: 'Punjab Board', description: 'Provincial Board of Education, Punjab' },
];

export const CLASSES: ClassLevel[] = [
  { id: 'grade_9', name: 'Grade 9', syllabusId: 'cambridge' },
  { id: 'grade_10', name: 'Grade 10', syllabusId: 'cambridge' },
  { id: 'grade_11_f', name: 'Grade 11 (HSSC-I)', syllabusId: 'federal' },
  { id: 'grade_12_f', name: 'Grade 12 (HSSC-II)', syllabusId: 'federal' },
];

export const SUBJECTS: Subject[] = [
  { id: 'phys_10', name: 'Physics', icon: Atom, classId: 'grade_10', syllabusId: 'cambridge' },
  { id: 'chem_10', name: 'Chemistry', icon: TestTube, classId: 'grade_10', syllabusId: 'cambridge' },
  { id: 'bio_10', name: 'Biology', icon: Microscope, classId: 'grade_10', syllabusId: 'cambridge' },
  { id: 'math_10', name: 'Mathematics', icon: Calculator, classId: 'grade_10', syllabusId: 'cambridge' },
  { id: 'phys_11_f', name: 'Physics', icon: Atom, classId: 'grade_11_f', syllabusId: 'federal' },
  { id: 'math_11_f', name: 'Mathematics', icon: Calculator, classId: 'grade_11_f', syllabusId: 'federal' },
];

export const CHAPTERS = [
  "Chapter 1: Physical Quantities & Measurement",
  "Chapter 2: Kinematics",
  "Chapter 3: Dynamics",
  "Chapter 4: Turning Effect of Forces",
  "Chapter 5: Gravitation",
  "Chapter 10: Simple Harmonic Motion",
  "Chapter 11: Sound",
  "Chapter 12: Geometrical Optics",
];

// Mapping helper for initializeDB to link chapters to subjects
export const CHAPTER_MAPPINGS = [
  { name: "Chapter 1: Physical Quantities & Measurement", subjectId: 'phys_10', classId: 'grade_10', syllabusId: 'cambridge' },
  { name: "Chapter 2: Kinematics", subjectId: 'phys_10', classId: 'grade_10', syllabusId: 'cambridge' },
  { name: "Chapter 3: Dynamics", subjectId: 'phys_10', classId: 'grade_10', syllabusId: 'cambridge' },
  { name: "Chapter 10: Simple Harmonic Motion", subjectId: 'phys_11_f', classId: 'grade_11_f', syllabusId: 'federal' },
  { name: "Chapter 11: Sound", subjectId: 'phys_11_f', classId: 'grade_11_f', syllabusId: 'federal' },
];

export const CHAPTER_SUBTOPICS: Record<string, string[]> = {
  "Chapter 1: Physical Quantities & Measurement": ["Introduction to Physics", "Base and Derived Quantities", "Measuring Instruments", "Significant Figures"],
  "Chapter 2: Kinematics": ["Rest and Motion", "Scalar and Vectors", "Terms associated with Motion", "Equations of Motion"],
  "Chapter 3: Dynamics": ["Force, Inertia and Momentum", "Newton's Laws of Motion", "Friction", "Uniform Circular Motion"],
  "Chapter 10: Simple Harmonic Motion": ["SHM of Mass Spring System", "Simple Pendulum", "Damped Oscillations", "Wave Motion"],
  "Chapter 11: Sound": ["Sound Waves", "Characteristics of Sound", "Reflection (Echo) of Sound", "Audible Frequency Range"],
};

export const MOCK_QUESTIONS: Question[] = [
  // --- PHYSICS GRADE 10 (CAMBRIDGE) ---
  {
    id: 'pq_01',
    text: "Which of the following is a base quantity?",
    textUrdu: "درج ذیل میں سے کون سی بنیادی مقدار ہے؟",
    type: 'MCQ',
    subject: 'Physics',
    classLevel: 'Grade 10',
    topic: 'Base and Derived Quantities',
    chapter: 'Chapter 1: Physical Quantities & Measurement',
    difficulty: Difficulty.EASY,
    marks: 1,
    options: ['Force', 'Length', 'Velocity', 'Acceleration'],
    optionsUrdu: ['فورس', 'لمبائی', 'ولاسٹی', 'ایکسلریشن'],
    correctAnswer: 'Length',
    source: QuestionSource.TEXTBOOK_EXERCISE
  },
  {
    id: 'pq_02',
    text: "Define Significant Figures and write the rules for determining them.",
    textUrdu: "نمایاں ہندسوں کی تعریف کریں اور ان کے تعین کے قوانین لکھیں۔",
    type: 'Short Answer',
    subject: 'Physics',
    classLevel: 'Grade 10',
    topic: 'Significant Figures',
    chapter: 'Chapter 1: Physical Quantities & Measurement',
    difficulty: Difficulty.MEDIUM,
    marks: 4,
    correctAnswer: "Significant figures are all accurately known digits and the first doubtful digit.",
    source: QuestionSource.MODEL_PAPER
  },
  {
    id: 'pq_03',
    text: "A car starts from rest. Its velocity becomes $20 ms^{-1}$ in 8 seconds. Find its acceleration.",
    textUrdu: "ایک کار ریسٹ سے چلنا شروع کرتی ہے۔ 8 سیکنڈ میں اس کی ولاسٹی $20 ms^{-1}$ ہو جاتی ہے۔ اس کا ایکسلریشن معلوم کریں۔",
    type: 'Short Answer',
    subject: 'Physics',
    classLevel: 'Grade 10',
    topic: 'Equations of Motion',
    chapter: 'Chapter 2: Kinematics',
    difficulty: Difficulty.MEDIUM,
    marks: 3,
    correctAnswer: "$a = 2.5 ms^{-2}$",
    source: QuestionSource.PAST_PAPER
  },
  {
    id: 'pq_04',
    text: "Derive the second equation of motion $S = vit + \\frac{1}{2}at^2$ using a speed-time graph.",
    textUrdu: "سپیڈ ٹائم گراف کی مدد سے حرکت کی دوسری مساوات $S = vit + \\frac{1}{2}at^2$ اخذ کریں۔",
    type: 'Long Answer',
    subject: 'Physics',
    classLevel: 'Grade 10',
    topic: 'Equations of Motion',
    chapter: 'Chapter 2: Kinematics',
    difficulty: Difficulty.HARD,
    marks: 5,
    source: QuestionSource.BOARD_EXAM
  },
  {
    id: 'pq_05',
    text: "Match the following physical quantities with their SI units.",
    textUrdu: "درج ذیل طبعی مقداروں کو ان کے ایس آئی یونٹس سے جوڑیں۔",
    type: 'Match Columns',
    subject: 'Physics',
    classLevel: 'Grade 10',
    topic: 'Introduction to Physics',
    chapter: 'Chapter 1: Physical Quantities & Measurement',
    difficulty: Difficulty.MEDIUM,
    marks: 4,
    matchingPairs: [
      { left: 'Mass', right: 'Kilogram', leftUrdu: 'میس', rightUrdu: 'کلوگرام' },
      { left: 'Time', right: 'Second', leftUrdu: 'وقت', rightUrdu: 'سیکنڈ' },
      { left: 'Temperature', right: 'Kelvin', leftUrdu: 'ٹمپریچر', rightUrdu: 'کیلون' },
      { left: 'Electric Current', right: 'Ampere', leftUrdu: 'الیکٹرک کرنٹ', rightUrdu: 'ایمپیر' },
    ],
    source: QuestionSource.UNIT_TEST
  },
  {
    id: 'pq_06',
    text: "Identify the parts of the Screw Gauge labeled in the diagram.",
    textUrdu: "ڈایاگرام میں لیبل کیے گئے سکرو گیج کے حصوں کی شناخت کریں۔",
    type: 'Diagram Based',
    subject: 'Physics',
    classLevel: 'Grade 10',
    topic: 'Measuring Instruments',
    chapter: 'Chapter 1: Physical Quantities & Measurement',
    difficulty: Difficulty.HARD,
    marks: 5,
    imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?q=80&w=800&auto=format&fit=crop',
    source: QuestionSource.MODEL_PAPER
  },

  // --- PHYSICS GRADE 11 (FEDERAL) ---
  {
    id: 'fpq_01',
    text: "The motion of a simple pendulum is an example of SHM. Prove it.",
    textUrdu: "سادہ پینڈولم کی حرکت ایس ایچ ایم کی ایک مثال ہے۔ اسے ثابت کریں۔",
    type: 'Long Answer',
    subject: 'Physics',
    classLevel: 'Grade 11 (HSSC-I)',
    topic: 'Simple Pendulum',
    chapter: 'Chapter 10: Simple Harmonic Motion',
    difficulty: Difficulty.HARD,
    marks: 7,
    source: QuestionSource.PRE_BOARD_EXAM
  },
  {
    id: 'fpq_02',
    text: "What is the audible frequency range for a normal human ear?",
    textUrdu: "انسانی کان کے لیے سنائی دینے والی فریکوئنسی کی رینج کیا ہے؟",
    type: 'MCQ',
    subject: 'Physics',
    classLevel: 'Grade 11 (HSSC-I)',
    topic: 'Audible Frequency Range',
    chapter: 'Chapter 11: Sound',
    difficulty: Difficulty.EASY,
    marks: 1,
    options: ['2Hz - 2000Hz', '20Hz - 20,000Hz', '200Hz - 200,000Hz', 'None of these'],
    optionsUrdu: ['2ہرٹز - 2000ہرٹز', '20ہرٹز - 20,000ہرٹز', '200ہرٹز - 200,000ہرٹز', 'ان میں سے کوئی نہیں'],
    correctAnswer: '20Hz - 20,000Hz',
    source: QuestionSource.TEXTBOOK_EXERCISE
  },

  // --- MATHEMATICS GRADE 10 (CAMBRIDGE) ---
  {
    id: 'mq_01',
    text: "Solve for $x$: $x^2 - 5x + 6 = 0$",
    type: 'Short Answer',
    subject: 'Mathematics',
    classLevel: 'Grade 10',
    topic: 'Quadratic Equations',
    chapter: 'Chapter 1: Quadratic Equations',
    difficulty: Difficulty.EASY,
    marks: 3,
    correctAnswer: "$x=2, x=3$",
    source: QuestionSource.PAST_PAPER
  }
];

export const MOCK_SAVED_PAPERS: SavedPaper[] = [
  { id: 'p1', title: 'Grade 10 Physics Mid-Term', subject: 'Physics', classLevel: 'Grade 10', dateCreated: '2024-10-25', status: 'Finalized', author: 'Alice Johnson', totalMarks: 50, examDate: '2024-12-15', testType: 'Mid-Term Exam', durationMinutes: 90 },
  { id: 'p2', title: 'Unit 1 Quiz - Measurements', subject: 'Physics', classLevel: 'Grade 10', dateCreated: '2024-10-28', status: 'Draft', author: 'Alice Johnson', totalMarks: 20, examDate: '2024-11-05', testType: 'Unit Test', durationMinutes: 30 },
];

export const MOCK_STAFF: Staff[] = [
  { id: 't1', name: 'Alice Johnson', email: 'alice@beaconhigh.edu', role: 'Teacher', subjects: ['Physics', 'Mathematics'], status: 'Active', lastActive: '5 mins ago', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150', schoolId: 's1' },
];

export const PRICING_PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    price: 0,
    currencySymbol: '$',
    features: ['50 Papers / Month', 'Basic AI Generation', '2 Staff Accounts', 'Standard Support'],
    limits: { papers: 50, staff: 2, storageGB: 1 }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    currencySymbol: '$',
    features: ['Unlimited Papers', 'Fine-tuned AI Models', 'Unlimited Staff', '24/7 Dedicated Support'],
    limits: { papers: 99999, staff: 999, storageGB: 100 }
  }
];

export const FAQS = [
  { question: "How do I add a new teacher?", answer: "Go to the Staff & Teachers module and click the 'Add Staff' button." },
  { question: "Can I customize the school logo?", answer: "Yes, navigate to Settings > Branding to upload your school logo." },
  { question: "Is bilingual generation supported?", answer: "Yes, our AI model generates high-quality Urdu (Nastaliq) and English content simultaneously." }
];
