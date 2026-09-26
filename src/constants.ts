import { School, Question, QuestionType, Difficulty, User, UserRole, Syllabus, ClassLevel, Subject, QuestionSource, SavedPaper, Staff, SubscriptionPlan } from "./types";
import { Calculator, Book, FlaskConical, Globe, Languages, Code, History as HistoryIcon, Microscope, Palette, Music, Atom, Binary, Brain, Zap, TestTube } from 'lucide-react';

// --- QUESTION TYPES DEFINITION ---
export const DEFAULT_QUESTION_TYPES = [
  { id: 'MCQ', name: 'Multiple Choice (MCQ)', category: 'Objective' },
  { id: 'Match Columns', name: 'Match Columns', category: 'Objective' },
  { id: 'Fill in the Blanks', name: 'Fill in the Blanks', category: 'Objective' },
  { id: 'True/False', name: 'True/False', category: 'Objective' },
  { id: 'Short Answer', name: 'Short Answer', category: 'Subjective' },
  { id: 'Long Answer', name: 'Long Answer', category: 'Subjective' },
  { id: 'Diagram Based', name: 'Diagram Based', category: 'Subjective' },
  { id: 'Definitions', name: 'Definitions', category: 'Subjective' },
  { id: 'Numerical Problem', name: 'Numerical Problem', category: 'Subjective' },
  { id: 'Forms of Verbs', name: 'Forms of Verbs', category: 'Language' },
  { id: 'Words & Opposites', name: 'Words & Opposites', category: 'Language' },
  { id: 'Singular / Plural', name: 'Singular / Plural', category: 'Language' },
  { id: 'Words / Meanings', name: 'Words / Meanings', category: 'Language' },
  { id: 'Words / Sentences', name: 'Words / Sentences', category: 'Language' },
  { id: 'Masculine / Feminine', name: 'Masculine / Feminine', category: 'Language' },
  { id: 'Pair of Words', name: 'Pair of Words', category: 'Language' },
  { id: 'Spelling Check', name: 'Spelling Check', category: 'Language' },
  { id: 'Missing Word', name: 'Missing Word', category: 'Language' },
  { id: 'Translation', name: 'Translation', category: 'Language' },
  { id: 'Comprehension', name: 'Comprehension', category: 'Language' },
  { id: 'Composition / Essay', name: 'Composition / Essay', category: 'Language' },
  { id: 'Letter Writing', name: 'Letter Writing', category: 'Language' },
  { id: 'Story / Paragraph Writing', name: 'Story / Paragraph Writing', category: 'Language' },
  { id: 'Direct / Indirect Speech', name: 'Direct / Indirect Speech', category: 'Language' },
  { id: 'Active / Passive Voice', name: 'Active / Passive Voice', category: 'Language' },
] as const;

export const MOCK_USERS: User[] = [
  {
    id: 'admin_01',
    name: 'Alexandra Pierce',
    email: 'admin@PakParcha.com',
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
    limits: { papers: 50, staff: 2, storageGB: 1, aiRequestsPerDay: 50 }
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    currencySymbol: '$',
    features: ['Unlimited Papers', 'Fine-tuned AI Models', 'Unlimited Staff', '24/7 Dedicated Support'],
    limits: { papers: 99999, staff: 999, storageGB: 100, aiRequestsPerDay: 5000 }
  }
];

export const DEFAULT_BLOG_POSTS = [
  {
    id: 'blog_01',
    title: 'How AI is Revolutionizing Exam Paper Generation in Pakistani Schools',
    excerpt: 'Discover how automated pairing schemes, bilingual Urdu/English question banks, and AI algorithms are saving teachers 10+ hours every exam season.',
    category: 'EdTech Innovations',
    author: 'Editorial Team',
    role: 'Academic Technology Lead',
    date: '2025-01-10T10:00:00.000Z',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?q=80&w=1200&auto=format&fit=crop',
    featured: true,
    content: `
      <h2>The Traditional Challenge of Exam Paper Drafting</h2>
      <p>Every examination cycle in Pakistani schools presents teachers and academic coordinators with intense workload challenges. Designing high-stakes assessment papers requires strict adherence to official Board pairing schemes (such as BISE Lahore, Rawalpindi, Federal Board FBISE, and Cambridge O/A Levels), maintaining precise chapter marks distributions, generating balanced difficulty curves, and formatting dual-column Urdu and English translations.</p>
      
      <p>Traditionally, teachers spent between <strong>6 to 12 hours</strong> manually assembling a single comprehensive matriculation or intermediate test. This tedious workflow often resulted in accidental question repetition, syllabus imbalances, and formatting headaches in Word processors.</p>

      <div class="my-8 p-6 bg-indigo-50 border-l-4 border-indigo-600 rounded-r-2xl">
        <h4 class="font-bold text-indigo-950 text-lg mb-2">Key Advantages of Automated Exam Systems:</h4>
        <ul class="list-disc list-inside space-y-1 text-indigo-900 text-sm">
          <li>100% adherence to official Board Pairing Schemes (SLO-based & Traditional)</li>
          <li>Instant bilingual typesetting with native Noto Nastaliq Urdu rendering</li>
          <li>Balanced cognitive levels: Knowledge (50%), Understanding (35%), and Application (15%)</li>
          <li>Automated answer keys, bubble sheets, and rubrics generated in one click</li>
        </ul>
      </div>

      <h2>Smart Pairing Schemes & Chapter Distributions</h2>
      <p>One of the most powerful capabilities of modern platforms like <strong>PakParcha AI</strong> is its dynamic Pairing Scheme Engine. Whether a school follows the <em>New 2025 Model Papers</em> with sub-parts like (a) and (b) across designated chapters, or customized academy chapter combinations, the algorithm ensures every section satisfies exact mark limits and choice rules.</p>

      <p>Mathematical formulas and scientific notation are typeset via high-performance KaTeX ($E = mc^2$, $\\Delta x \\cdot \\Delta p \\ge \\frac{\\hbar}{2}$), ensuring textbook-grade print readiness.</p>

      <h2>Empowering Teachers to Focus on Pedagogy</h2>
      <p>By automating the repetitive technical burden of paper setting, teachers regain valuable time to focus on individualized student counseling, conceptual lesson delivery, and remedial guidance. Educational technology does not replace teachers—it empowers them with enterprise-grade tools to achieve academic excellence.</p>
    `
  },
  {
    id: 'blog_02',
    title: 'Mastering SLO-Based Examinations: A Practical Guide for Teachers & Academies',
    excerpt: 'A step-by-step breakdown of Student Learning Outcomes (SLOs), Bloom Taxonomy levels, and constructing balanced cognitive assessment papers.',
    category: 'Assessment Strategy',
    author: 'Prof. Tariq Mahmood',
    role: 'Senior Curriculum Specialist',
    date: '2025-01-18T14:30:00.000Z',
    readTime: '8 min read',
    image: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1200&auto=format&fit=crop',
    featured: false,
    content: `
      <h2>Understanding the Shift to SLO-Based Testing</h2>
      <p>Educational boards across Pakistan have transitioned towards Student Learning Outcome (SLO) based examinations. The objective is to replace rote memorization (cramming) with deep conceptual understanding, analytical thinking, and practical problem-solving skills.</p>

      <h2>The Three Cognitive Tiers of Modern Assessment</h2>
      <p>When drafting an SLO-compliant exam paper, questions must be classified across three core cognitive domains:</p>

      <ol class="list-decimal list-inside space-y-3 my-6 font-medium">
        <li><strong>Knowledge-Based (Recall):</strong> Testing foundational facts, definitions, and direct formulas (Target: ~50% of total marks).</li>
        <li><strong>Understanding-Based (Comprehension):</strong> Testing explanations, reasoning, comparisons, and conceptual derivations (Target: ~35% of total marks).</li>
        <li><strong>Application & Analysis (Higher-Order Thinking):</strong> Numerical problems, real-world scenario analysis, and experimental evaluations (Target: ~15% of total marks).</li>
      </ol>

      <div class="my-8 p-6 bg-slate-900 text-white rounded-3xl shadow-xl">
        <h4 class="font-bold text-emerald-400 text-base uppercase tracking-wider mb-2">Pro Tip for Paper Setters</h4>
        <p class="text-sm text-slate-300 leading-relaxed">
          Always include distinct marks breakdowns for sub-parts in subjective questions. For instance, in an 8-mark question split into Part (a) Theory [4 Marks] and Part (b) Numerical [4 Marks], ensure both concepts test different learning dimensions.
        </p>
      </div>

      <h2>Conclusion</h2>
      <p>Mastering SLO-based paper creation allows academies to boost their board positions by training students throughout the academic session on conceptual problem patterns.</p>
    `
  },
  {
    id: 'blog_03',
    title: 'Effective Past Paper Revision Strategies to Score 95%+ in Matric & Inter Boards',
    excerpt: 'Top study techniques, time management hacks, and systematic past paper analysis methods for high-achieving matric and intermediate students.',
    category: 'Student Success',
    author: 'Dr. Ayesha Siddiqa',
    role: 'Academic Director',
    date: '2025-02-01T09:15:00.000Z',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1200&auto=format&fit=crop',
    featured: false,
    content: `
      <h2>Why Past Paper Analysis is the Ultimate Revision Tool</h2>
      <p>Top-scoring students consistently identify past papers as the single most effective revision methodology in the final 60 days before annual board examinations. Solving authentic 5-year past papers provides familiarity with recurring question patterns, mark allocations, and strict exam hall time constraints.</p>

      <h2>The 3-Phase Revision Framework</h2>
      <ul>
        <li><strong>Phase 1: Topical Past Paper Practice:</strong> Immediately after finishing each chapter, solve all MCQs and short questions asked from that topic over the past 5 years.</li>
        <li><strong>Phase 2: Timed Mock Sessions:</strong> Sit in an isolated environment without books, set a timer for 2.5 or 3 hours, and solve a complete unseen model paper.</li>
        <li><strong>Phase 3: Self-Evaluation & Margin Improvement:</strong> Grade your paper against official marking schemes and focus revision on identified weak areas.</li>
      </ul>

      <p>Explore our free public Past Papers and Study Notes libraries on PakParcha AI to access chapter-wise categorized resources anytime.</p>
    `
  },
  {
    id: 'blog_04',
    title: 'School Management Best Practices: Standardizing Quality Assessments Across All Campuses',
    excerpt: 'How school networks and multi-branch academies can maintain consistent question standards, prevent paper leaks, and track teacher workload.',
    category: 'School Administration',
    author: 'Imran Bashir',
    role: 'Institutional Growth Consultant',
    date: '2025-02-12T11:00:00.000Z',
    readTime: '7 min read',
    image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?q=80&w=1200&auto=format&fit=crop',
    featured: false,
    content: `
      <h2>The Challenge of Multi-Branch Assessment Quality</h2>
      <p>For school chains operating multiple branches, ensuring identical teaching quality and standard examination difficulty across all campuses is a major administrative hurdle. When each branch head sets independent test papers, variance in grading standards leads to inconsistent student performance metrics.</p>

      <h2>Centralized Digital Question Banking</h2>
      <p>Centralized cloud assessment systems enable school principals to establish an approved institutional repository of vetted questions. Key advantages include:</p>
      <ul class="list-disc list-inside space-y-2 text-slate-700 my-4">
        <li>Uniform exam papers printed across all branches on scheduled test dates</li>
        <li>Role-based access security preventing unauthorized paper leaks</li>
        <li>Automated watermarking with school crest, monogram, and custom branch headers</li>
        <li>Real-time analytics on syllabus completion and student test grading</li>
      </ul>

      <p>Adopting unified digital workflows elevates school reputation, builds parental trust, and prepares students for competitive academic challenges.</p>
    `
  }
];

export const FAQS = [
  { question: "How do I add a new teacher?", answer: "Go to the Staff & Teachers module and click the 'Add Staff' button." },
  { question: "Can I customize the school logo?", answer: "Yes, navigate to Settings > Branding to upload your school logo." },
  { question: "Is bilingual generation supported?", answer: "Yes, our AI model generates high-quality Urdu (Nastaliq) and English content simultaneously." }
];

