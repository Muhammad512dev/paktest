import React, { useEffect, useState } from 'react';
import {
  ArrowRight, CheckCircle2, Zap, Shield, Users, Sparkles, Loader2,
  Languages, BarChart3, GraduationCap, Database, FileText, ClipboardCheck,
  Check, Star, Download, Printer, Award, BookOpen, Clock, HelpCircle,
  PhoneCall, MessageCircle, Layers, FileCheck2, Cpu, RefreshCw, Eye, EyeOff,
  Edit2
} from 'lucide-react';
import { getBlogs, getNotes, getPublicStats, getSystemConfig } from '../../services/dataService';

// Sample curated mock test questions for instant interactive generation
const MOCK_QUESTIONS_DATABASE: Record<string, {
  subject: string;
  mcqs: Array<{
    id: number;
    textEn: string;
    textUr: string;
    optionsEn: string[];
    optionsUr: string[];
    correct: string;
  }>;
  shortQuestions: Array<{
    id: number;
    textEn: string;
    textUr: string;
    ansEn?: string;
    ansUr?: string;
  }>;
  longQuestions: Array<{
    id: number;
    partAEn: string;
    partAUr: string;
    partBEn: string;
    partBUr: string;
  }>;
}> = {
  'Biology': {
    subject: 'Biology',
    mcqs: [
      {
        id: 1,
        textEn: 'The study of structures of living organisms is called:',
        textUr: 'جانداروں کی ساختوں کے مطالعہ کو کہا جاتا ہے:',
        optionsEn: ['Morphology', 'Physiology', 'Anatomy', 'Histology'],
        optionsUr: ['مارفولوجی', 'فزیالوجی', 'اناٹمی', 'ہسٹولوجی'],
        correct: 'A'
      },
      {
        id: 2,
        textEn: 'Which organelle is known as the powerhouse of the cell?',
        textUr: 'سیل کا پاور ہاؤس کس آرگنیل کو کہا جاتا ہے؟',
        optionsEn: ['Ribosome', 'Mitochondria', 'Golgi Body', 'Nucleus'],
        optionsUr: ['رائیبوسوم', 'مائٹوکونڈریا', 'گولجی باڈی', 'نیوکلیئس'],
        correct: 'B'
      },
      {
        id: 3,
        textEn: 'The basic unit of classification in biology is:',
        textUr: 'حیاتیات میں درجہ بندی کی بنیادی اکائی ہے:',
        optionsEn: ['Genus', 'Species', 'Family', 'Order'],
        optionsUr: ['جینس', 'اسپیسیز', 'فیملی', 'آرڈر'],
        correct: 'B'
      }
    ],
    shortQuestions: [
      {
        id: 1,
        textEn: 'Define Biotechnology and Immunology.',
        textUr: 'بائیو ٹیکنالوجی اور امیونولوجی کی تعریف کریں۔'
      },
      {
        id: 2,
        textEn: 'What is organ and organ system level?',
        textUr: 'آرگن اور آرگن سسٹم لیول سے کیا مراد ہے؟'
      },
      {
        id: 3,
        textEn: 'State the difference between Mitosis and Meiosis.',
        textUr: 'مائیٹوسس اور میوسس کے درمیان فرق بیان کریں۔'
      },
      {
        id: 4,
        textEn: 'What is binomial nomenclature? Who introduced it?',
        textUr: 'دو نیمی نام دینے کا طریقہ کیا ہے؟ یہ کس نے متعارف کروایا؟'
      }
    ],
    longQuestions: [
      {
        id: 1,
        partAEn: 'Explain the structure and function of Nucleus with a labeled diagram.',
        partAUr: 'لیبل شدہ ڈایاگرام کی مدد سے نیوکلیئس کی ساخت اور افعال بیان کریں۔',
        partBEn: 'Describe five kingdoms of classification in detail.',
        partBUr: 'کلاسیفیکیشن کے پانچ کنگڈمز تفصیل سے بیان کریں۔'
      }
    ]
  },
  'Physics': {
    subject: 'Physics',
    mcqs: [
      {
        id: 1,
        textEn: 'The SI unit of force is:',
        textUr: 'فورس کا ایس آئی (SI) یونٹ ہے:',
        optionsEn: ['Newton', 'Joule', 'Pascal', 'Watt'],
        optionsUr: ['نیوٹن', 'جول', 'پاسکل', 'واٹ'],
        correct: 'A'
      },
      {
        id: 2,
        textEn: 'Rate of change of velocity is called:',
        textUr: 'ویسلوسٹی میں تبدیلی کی شرح کو کہتے ہیں:',
        optionsEn: ['Speed', 'Acceleration', 'Displacement', 'Momentum'],
        optionsUr: ['سپیڈ', 'ایکسلریشن', 'ڈسپلیسمنٹ', 'مومینٹم'],
        correct: 'B'
      },
      {
        id: 3,
        textEn: 'A vector quantity has both magnitude and:',
        textUr: 'ویکٹر مقدار میں مقدار کے ساتھ ساتھ ہوتا ہے:',
        optionsEn: ['Mass', 'Direction', 'Time', 'Temperature'],
        optionsUr: ['ماس', 'سمت', 'وقت', 'درجہ حرارت'],
        correct: 'B'
      }
    ],
    shortQuestions: [
      {
        id: 1,
        textEn: 'State Newton\'s Second Law of Motion and write its formula.',
        textUr: 'نیوٹن کا حرکت کا دوسرا قانون بیان کریں اور اس کا فارمولا لکھیں۔'
      },
      {
        id: 2,
        textEn: 'Differentiate between scalar and vector quantities with examples.',
        textUr: 'مثالوں کے ساتھ سکیلر اور ویکٹر مقداروں میں فرق واضح کریں۔'
      },
      {
        id: 3,
        textEn: 'Define inertia and give one daily life example.',
        textUr: 'انرشیا کی تعریف کریں اور روزمرہ زندگی سے ایک مثال دیں۔'
      },
      {
        id: 4,
        textEn: 'What is center of gravity? How is it determined?',
        textUr: 'سینٹر آف گریویٹی کیا ہے؟ اس کا تعین کیسے کیا جاتا ہے؟'
      }
    ],
    longQuestions: [
      {
        id: 1,
        partAEn: 'Derive the second equation of motion with the help of speed-time graph.',
        partAUr: 'سپیڈ ٹائم گراف کی مدد سے حرکت کی دوسری مساوات اخذ کریں۔',
        partBEn: 'A car starts from rest with acceleration of 0.5 m/s². Find its speed after 100m.',
        partBUr: 'ایک کار ساکن حالت سے 0.5 m/s² ایکسلریشن کے ساتھ چلتی ہے۔ 100 میٹر کے بعد سپیڈ معلوم کریں۔'
      }
    ]
  },
  'Chemistry': {
    subject: 'Chemistry',
    mcqs: [
      {
        id: 1,
        textEn: 'The number of periods in modern periodic table is:',
        textUr: 'ماڈرن پیریوڈک ٹیبل میں پیریڈز کی تعداد ہے:',
        optionsEn: ['7', '8', '18', '16'],
        optionsUr: ['7', '8', '18', '16'],
        correct: 'A'
      },
      {
        id: 2,
        textEn: 'Which bond is formed by mutual sharing of electrons?',
        textUr: 'الیکٹرانز کے باہمی اشتراک سے کون سا بانڈ بنتا ہے؟',
        optionsEn: ['Ionic Bond', 'Covalent Bond', 'Coordinate Bond', 'Metallic Bond'],
        optionsUr: ['آئنک بانڈ', 'کوویلنٹ بانڈ', 'کوآرڈینیٹ بانڈ', 'میٹالک بانڈ'],
        correct: 'B'
      },
      {
        id: 3,
        textEn: 'Avogadro’s number is represented by:',
        textUr: 'ایووگیڈرو نمبر کو کس سے ظاہر کیا جاتا ہے؟',
        optionsEn: ['NA', 'AN', 'NAV', 'NB'],
        optionsUr: ['NA', 'AN', 'NAV', 'NB'],
        correct: 'A'
      }
    ],
    shortQuestions: [
      {
        id: 1,
        textEn: 'Define empirical formula and molecular formula with examples.',
        textUr: 'ایمپریکل فارمولا اور مالیکیولر فارمولا کی تعریف بمعہ مثالیں کریں۔'
      },
      {
        id: 2,
        textEn: 'State Rutherford\'s atomic model defects.',
        textUr: 'ردرفورڈ کے ایٹمی ماڈل کے نقائص بیان کریں۔'
      },
      {
        id: 3,
        textEn: 'What is electronegativity? Name the most electronegative element.',
        textUr: 'الیکٹرو نیگیٹیویٹی کیا ہے؟ سب سے زیادہ الیکٹرو نیگیٹیو ایلیمنٹ کا نام لکھیں۔'
      },
      {
        id: 4,
        textEn: 'Why do noble gases not react under normal conditions?',
        textUr: 'نوبل گیسیں عام حالات میں ری ایکٹ کیوں نہیں کرتیں؟'
      }
    ],
    longQuestions: [
      {
        id: 1,
        partAEn: 'Describe Bohr\'s atomic theory and write down its key postulates.',
        partAUr: 'بوہر کی ایٹمی تھیوری بیان کریں اور اس کے اہم مفروضات لکھیں۔',
        partBEn: 'Explain the formation of ionic bond between Sodium (Na) and Chlorine (Cl).',
        partBUr: 'سوڈیم (Na) اور کلورین (Cl) کے درمیان آئنک بانڈ بننے کا عمل واضح کریں۔'
      }
    ]
  },
  'Computer Science': {
    subject: 'Computer Science',
    mcqs: [
      {
        id: 1,
        textEn: 'A step-by-step procedure to solve a problem is called:',
        textUr: 'کسی مسئلے کو حل کرنے کے مرحلہ وار طریقہ کار کو کہا جاتا ہے:',
        optionsEn: ['Algorithm', 'Flowchart', 'Source Code', 'Program'],
        optionsUr: ['الگورتھم', 'فلو چارٹ', 'سورس کوڈ', 'پروگرام'],
        correct: 'A'
      },
      {
        id: 2,
        textEn: 'In flowchart, diamond symbol is used for:',
        textUr: 'فلو چارٹ میں ڈائمنڈ کی علامت کس مقصد کے لیے استعمال ہوتی ہے؟',
        optionsEn: ['Input/Output', 'Decision Making', 'Process', 'Connector'],
        optionsUr: ['ان پٹ/آؤٹ پٹ', 'فیصلہ سازی (Decision)', 'پروسیس', 'کنیکٹر'],
        correct: 'B'
      },
      {
        id: 3,
        textEn: 'The base of hexadecimal number system is:',
        textUr: 'ہیکسا ڈیسیمل نمبر سسٹم کی بیس (Base) ہے:',
        optionsEn: ['2', '8', '10', '16'],
        optionsUr: ['2', '8', '10', '16'],
        correct: 'D'
      }
    ],
    shortQuestions: [
      {
        id: 1,
        textEn: 'What is the difference between flowchart and algorithm?',
        textUr: 'فلو چارٹ اور الگورتھم کے درمیان کیا فرق ہے؟'
      },
      {
        id: 2,
        textEn: 'Convert decimal (25)₁₀ into binary number system.',
        textUr: 'ڈیسیمل نمبر (25)₁₀ کو بائنری نمبر سسٹم میں تبدیل کریں۔'
      },
      {
        id: 3,
        textEn: 'Define Computer Network and state its two advantages.',
        textUr: 'کمپیوٹر نیٹ ورک کی تعریف کریں اور اس کے دو فوائد بیان کریں۔'
      },
      {
        id: 4,
        textEn: 'What is phishing and how can we protect ourselves from it?',
        textUr: 'فشنگ (Phishing) کیا ہے اور ہم اس سے کیسے محفوظ رہ سکتے ہیں؟'
      }
    ],
    longQuestions: [
      {
        id: 1,
        partAEn: 'Explain different network topologies (Star, Bus, Ring) with diagrams.',
        partAUr: 'نیٹ ورک ٹوپالوجیز (سٹار، بس، رنگ) کی ڈایاگرامز کے ساتھ وضاحت کریں۔',
        partBEn: 'Discuss the importance of data privacy and cyber ethics in modern era.',
        partBUr: 'جدید دور میں ڈیٹا پرائیویسی اور سائبر اخلاقیات کی اہمیت پر بحث کریں۔'
      }
    ]
  },
  'Mathematics': {
    subject: 'Mathematics',
    mcqs: [
      {
        id: 1,
        textEn: 'If A is a matrix of order 2x3, then order of Aᵗ is:',
        textUr: 'اگر A کا آرڈر 2x3 ہو تو ٹرانسپوز Aᵗ کا آرڈر ہوگا:',
        optionsEn: ['2x3', '3x2', '2x2', '3x3'],
        optionsUr: ['2x3', '3x2', '2x2', '3x3'],
        correct: 'B'
      },
      {
        id: 2,
        textEn: 'Logarithm of 1 to any base is:',
        textUr: 'کسی بھی بیس پر 1 کا لاگ ہوتا ہے:',
        optionsEn: ['0', '1', '10', 'Undefined'],
        optionsUr: ['0', '1', '10', 'غیر معین'],
        correct: 'A'
      },
      {
        id: 3,
        textEn: 'The degree of a linear polynomial is:',
        textUr: 'لکیری کثیر رقمی (Linear polynomial) کی ڈگری ہوتی ہے:',
        optionsEn: ['0', '1', '2', '3'],
        optionsUr: ['0', '1', '2', '3'],
        correct: 'B'
      }
    ],
    shortQuestions: [
      {
        id: 1,
        textEn: 'Find the multiplicative inverse of matrix A = [2 1; 3 4].',
        textUr: 'میٹرکس A = [2 1; 3 4] کا ضربی معکوس معلوم کریں۔'
      },
      {
        id: 2,
        textEn: 'Simplify using laws of exponents: (243)^(-2/3) * (32)^(-1/5).',
        textUr: 'قوت نما کے قوانین کی مدد سے حل کریں: (243)^(-2/3) * (32)^(-1/5)۔'
      },
      {
        id: 3,
        textEn: 'Factorize: 4x² - 12xy + 9y².',
        textUr: 'اجزائے ضربی بنائیں: 4x² - 12xy + 9y²۔'
      },
      {
        id: 4,
        textEn: 'Find the value of x if log₃(x) = 5.',
        textUr: 'اگر log₃(x) = 5 ہو تو x کی قیمت معلوم کریں۔'
      }
    ],
    longQuestions: [
      {
        id: 1,
        partAEn: 'Solve the system of linear equations using Cramer\'s Rule: 2x - y = 5, 3x + 2y = 4.',
        partAUr: 'کریمر کے قانون کی مدد سے مساواتیں حل کریں: 2x - y = 5, 3x + 2y = 4۔',
        partBEn: 'Prove that the right bisectors of the sides of a triangle are concurrent.',
        partBUr: 'ثابت کریں کہ مثلث کے اضلاع کے عمودی ناصف ہم نقطہ ہوتے ہیں۔'
      }
    ]
  },
  'English': {
    subject: 'English',
    mcqs: [
      {
        id: 1,
        textEn: 'Choose the correct spelling:',
        textUr: 'درست ہجے (Spelling) کا انتخاب کریں:',
        optionsEn: ['Excellence', 'Excelence', 'Exelence', 'Excellens'],
        optionsUr: ['Excellence', 'Excelence', 'Exelence', 'Excellens'],
        correct: 'A'
      },
      {
        id: 2,
        textEn: 'The antonym of "Bright" is:',
        textUr: 'لفظ "Bright" کا متضاد ہے:',
        optionsEn: ['Dull', 'Shining', 'Clever', 'Smart'],
        optionsUr: ['Dull', 'Shining', 'Clever', 'Smart'],
        correct: 'A'
      },
      {
        id: 3,
        textEn: 'He has been living here _____ 2015.',
        textUr: 'خالی جگہ کے لیے درست لفظ منتخب کریں:',
        optionsEn: ['since', 'for', 'from', 'by'],
        optionsUr: ['since', 'for', 'from', 'by'],
        correct: 'A'
      }
    ],
    shortQuestions: [
      {
        id: 1,
        textEn: 'Write down the summary of the poem "Daffodils" by William Wordsworth.',
        textUr: 'نظم "ڈیفوڈلز" کا مرکزی خیال / خلاصہ تحریر کریں۔'
      },
      {
        id: 2,
        textEn: 'Use the following pair of words in your own sentences: (i) Advice / Advise, (ii) Piece / Peace.',
        textUr: 'درج ذیل الفاظ کے جوڑوں کو اپنے جملوں میں استعمال کریں۔'
      },
      {
        id: 3,
        textEn: 'Translate the following sentence into Urdu: "Hard work is the key to success."',
        textUr: 'درج ذیل جملے کا اردو میں ترجمہ کریں: "Hard work is the key to success."'
      },
      {
        id: 4,
        textEn: 'Change the voice: "The teacher appreciated the hardworking student."',
        textUr: 'فعل مجہول (Change Voice) میں تبدیل کریں۔'
      }
    ],
    longQuestions: [
      {
        id: 1,
        partAEn: 'Write an essay of 150-200 words on "My Favourite Personality" OR "Quaid-e-Azam".',
        partAUr: '"میری پسندیدہ شخصیت" یا "قائداعظم" پر مضمون تحریر کریں۔',
        partBEn: 'Write an application to the Principal for grant of three days leave due to illness.',
        partBUr: 'بیماری کی وجہ سے پرنسپل کے نام تین دن کی رخصت کی درخواست تحریر کریں۔'
      }
    ]
  }
};

const Home: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    papers: 0,
    schools: 0,
    questions: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [platformConfig, setPlatformConfig] = useState({ logo: '', name: 'PakParcha AI' });
  const [recentBlogs, setRecentBlogs] = useState<any[]>([]);
  const [recentNotes, setRecentNotes] = useState<any[]>([]);

  // Interactive Mock Generator State
  const [mockBoard, setMockBoard] = useState('Punjab Board (PCTB)');
  const [mockClass, setMockClass] = useState('9th Class');
  const [mockSubject, setMockSubject] = useState('Biology');
  const [mockTestType, setMockTestType] = useState('Chapter 1 (Unit Test)');
  const [mockSchoolName, setMockSchoolName] = useState('AL-RAZA SCIENCE ACADEMY & MODEL SCHOOL');
  const [isEditingSchoolName, setIsEditingSchoolName] = useState(false);
  const [showAnswerKey, setShowAnswerKey] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const [statsData, configData, blogsData, notesData] = await Promise.all([
          getPublicStats(),
          getSystemConfig(),
          getBlogs().catch(() => []),
          getNotes().catch(() => [])
        ]);

        setStats(statsData);
        setPlatformConfig({
          logo: configData.platformLogo || '',
          name: configData.platformName || 'PakParcha AI'
        });
        setRecentBlogs(Array.isArray(blogsData) ? blogsData.slice(0, 4) : []);
        setRecentNotes(Array.isArray(notesData) ? notesData.slice(0, 4) : []);
      } catch (e) {
        console.error("Failed to load home data", e);
        setStats({ papers: 0, schools: 0, questions: 0 });
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const handleRegenerateMock = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 400);
  };

  const handlePrintMock = () => {
    window.print();
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M+';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k+';
    return num ? num.toLocaleString() : '10,000+';
  };

  const BOARDS = [
    { name: 'BISE Lahore', badge: 'Punjab' },
    { name: 'BISE Multan', badge: 'Punjab' },
    { name: 'BISE Rawalpindi', badge: 'Punjab' },
    { name: 'BISE Gujranwala', badge: 'Punjab' },
    { name: 'BISE Faisalabad', badge: 'Punjab' },
    { name: 'BISE Sahiwal', badge: 'Punjab' },
    { name: 'BISE Sargodha', badge: 'Punjab' },
    { name: 'BISE Bahawalpur', badge: 'Punjab' },
    { name: 'BISE DG Khan', badge: 'Punjab' },
    { name: 'Federal Board (FBISE)', badge: 'Islamabad' },
    { name: 'Sindh Board (BIEK/BSEK)', badge: 'Sindh' },
    { name: 'KPK Board (BISE Peshawar)', badge: 'KPK' }
  ];

  const currentMockData = MOCK_QUESTIONS_DATABASE[mockSubject] || MOCK_QUESTIONS_DATABASE['Biology'];

  return (
    <div className="space-y-24 pb-20 bg-slate-50/50">
      
      {/* 1. HERO SECTION WITH INTERACTIVE LIVE MOCK PAPER GENERATOR */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-[#0A0F1D] text-white">
        
        {/* Ambient Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-40 right-10 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Logo Branding */}
          {platformConfig.logo && (
            <div className="flex justify-center mb-6">
              <div className="relative group p-2">
                <img
                  src={platformConfig.logo}
                  alt={platformConfig.name || "PakParcha AI"}
                  className="h-20 sm:h-28 md:h-32 w-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] filter brightness-110"
                />
              </div>
            </div>
          )}

          {/* Top Trust Badge */}
          <div className="flex justify-center mb-5">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs sm:text-sm font-bold tracking-wide backdrop-blur-md shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Updated for 2025–2026 PCTB, FBISE & SLO Board Exam Patterns</span>
            </div>
          </div>

          {/* Main Title & Subtitle */}
          <div className="text-center max-w-4xl mx-auto mb-12">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight leading-[1.15] mb-5 text-white">
              Create Board-Pattern Papers in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-indigo-500">
                60 Seconds
              </span>
              , Not 4 Hours.
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed max-w-3xl mx-auto font-normal">
              Pakistan’s premier exam paper creator for <strong className="text-white font-semibold">Schools, Colleges, and Academies</strong>. 
              Generate bilingual (Urdu & English) papers with authentic Nastaleeq fonts, pairing schemes, answer keys, and your custom institute watermark.
            </p>
          </div>

          {/* ⚡ INTERACTIVE LIVE MOCKUP PAPER GENERATOR CONTROLS */}
          <div className="max-w-4xl mx-auto mb-8 bg-slate-900/90 border border-slate-700/80 rounded-3xl p-4 sm:p-6 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between gap-2 border-b border-slate-700/80 pb-3 mb-4">
              <div className="flex items-center gap-2 text-xs sm:text-sm font-black text-cyan-400 uppercase tracking-wider">
                <Zap size={16} className="animate-bounce" />
                <span>Try Live Mock Test Generator (Interactive Demo)</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-full border border-slate-700">
                Instant Preview
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {/* Board Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">1. Board / Syllabus</label>
                <select
                  value={mockBoard}
                  onChange={e => { setMockBoard(e.target.value); handleRegenerateMock(); }}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="Punjab Board (PCTB)">Punjab Board (PCTB)</option>
                  <option value="Federal Board (FBISE)">Federal Board (FBISE)</option>
                  <option value="Sindh Board (BIEK)">Sindh Board (BIEK)</option>
                  <option value="KPK Board">KPK Board (Peshawar)</option>
                </select>
              </div>

              {/* Class Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">2. Class / Grade</label>
                <select
                  value={mockClass}
                  onChange={e => { setMockClass(e.target.value); handleRegenerateMock(); }}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="9th Class">9th Class (Matric Part-I)</option>
                  <option value="10th Class">10th Class (Matric Part-II)</option>
                  <option value="11th Class (1st Year)">11th Class (HSSC-I)</option>
                  <option value="12th Class (2nd Year)">12th Class (HSSC-II)</option>
                </select>
              </div>

              {/* Subject Selector */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">3. Select Subject</label>
                <select
                  value={mockSubject}
                  onChange={e => { setMockSubject(e.target.value); handleRegenerateMock(); }}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="Biology">Biology / حیاتیات</option>
                  <option value="Physics">Physics / طبیعیات</option>
                  <option value="Chemistry">Chemistry / کیمیا</option>
                  <option value="Mathematics">Mathematics / ریاضی</option>
                  <option value="Computer Science">Computer Science / کمپیوٹر</option>
                  <option value="English">English / انگریزی</option>
                </select>
              </div>

              {/* Test Scope */}
              <div>
                <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">4. Test Scope</label>
                <select
                  value={mockTestType}
                  onChange={e => { setMockTestType(e.target.value); handleRegenerateMock(); }}
                  className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-bold focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer"
                >
                  <option value="Chapter 1 (Unit Test)">Chapter 1 (Unit Test)</option>
                  <option value="Chapter 1-3 (Quarter Book)">Chapter 1-3 (Quarter)</option>
                  <option value="Full Book Board Model Paper">Full Book Model Paper</option>
                </select>
              </div>
            </div>

            {/* Quick Generator Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-700/80">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleRegenerateMock}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                >
                  <RefreshCw size={14} className={isGenerating ? 'animate-spin' : ''} />
                  <span>Generate Test Paper</span>
                </button>
                <button
                  onClick={() => setShowAnswerKey(!showAnswerKey)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer border ${showAnswerKey ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-slate-800 border-slate-700 text-slate-300 hover:text-white'}`}
                >
                  {showAnswerKey ? <EyeOff size={14} /> : <Eye size={14} />}
                  <span>{showAnswerKey ? 'Hide Answer Key' : 'Show Answer Key'}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrintMock}
                  className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                  title="Print this sample paper in PDF"
                >
                  <Printer size={14} />
                  <span>Print Sample PDF</span>
                </button>
                <button
                  onClick={() => onNavigate('SIGNUP')}
                  className="px-4 py-2 bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white rounded-xl text-xs font-black flex items-center gap-1.5 transition-all cursor-pointer shadow-md active:scale-95"
                >
                  <span>Create Custom Exam (Sign Up)</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            </div>
          </div>

          {/* REALISTIC HIGH-FIDELITY PAPER PREVIEW MOCKUP */}
          <div className="max-w-4xl mx-auto">
            <div className="relative rounded-2xl sm:rounded-3xl p-1 bg-gradient-to-b from-indigo-500/40 via-cyan-500/20 to-transparent shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]">
              <div className="bg-white text-slate-900 rounded-[1.25rem] sm:rounded-[1.75rem] p-5 sm:p-8 shadow-2xl relative overflow-hidden border border-slate-200">
                
                {/* Visual Watermark Mockup */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] rotate-[-25deg] select-none text-slate-900 font-black text-4xl sm:text-6xl">
                  {platformConfig.name} • CONFIDENTIAL
                </div>

                {/* Exam Paper Header */}
                <div className="border-b-2 border-slate-900 pb-3 mb-4 text-center relative">
                  <div className="flex justify-between items-start text-[11px] sm:text-xs text-slate-600 font-bold mb-1">
                    <span>Roll No: ____________</span>
                    <span className="text-indigo-700 font-black uppercase tracking-wider">{mockTestType}</span>
                    <span>Date: ___/___/2025</span>
                  </div>

                  {/* School / Academy Name (Editable by user) */}
                  <div className="flex items-center justify-center gap-2 group/edit my-1">
                    {isEditingSchoolName ? (
                      <input
                        type="text"
                        value={mockSchoolName}
                        onChange={e => setMockSchoolName(e.target.value)}
                        onBlur={() => setIsEditingSchoolName(false)}
                        autoFocus
                        className="text-center font-black text-lg sm:text-2xl text-slate-900 border border-indigo-400 rounded px-2 py-0.5 outline-none w-full max-w-lg uppercase"
                      />
                    ) : (
                      <h3
                        onClick={() => setIsEditingSchoolName(true)}
                        className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tight cursor-pointer hover:text-indigo-600 transition-colors"
                        title="Click to change school name"
                      >
                        {mockSchoolName}
                        <Edit2 size={14} className="inline ml-2 text-slate-400 opacity-0 group-hover/edit:opacity-100 transition-opacity" />
                      </h3>
                    )}
                  </div>

                  <div className="flex flex-wrap justify-center gap-3 sm:gap-6 mt-2 text-xs sm:text-sm font-bold text-slate-700">
                    <span className="bg-slate-100 px-3 py-0.5 rounded border border-slate-200">Class: {mockClass} &bull; {mockSubject}</span>
                    <span className="bg-slate-100 px-3 py-0.5 rounded border border-slate-200">Syllabus: {mockBoard}</span>
                    <span className="bg-slate-100 px-3 py-0.5 rounded border border-slate-200">Total Marks: 60</span>
                  </div>
                </div>

                {/* Sample Section: Objective / MCQs */}
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="bg-slate-900 text-white px-3 py-1.5 rounded flex justify-between items-center font-bold text-xs">
                    <span>Q1. Choose the correct answer. (12 x 1 = 12)</span>
                    <span className="font-urdu text-sm">حصہ معروضی: درست جواب کا انتخاب کریں۔</span>
                  </div>

                  {/* Dynamic Curated MCQs */}
                  {currentMockData.mcqs.map((mcq, idx) => (
                    <div key={idx} className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                      <div className="flex justify-between items-start gap-4 mb-2 font-medium">
                        <p className="text-slate-900 font-semibold">
                          <strong className="text-indigo-600 font-black mr-1">{idx + 1}.</strong> {mcq.textEn}
                        </p>
                        <p className="font-urdu text-slate-800 text-right font-bold text-sm shrink-0">
                          {mcq.textUr}
                        </p>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium text-slate-700 pt-1">
                        {mcq.optionsEn.map((opt, oIdx) => {
                          const optLabel = ['A', 'B', 'C', 'D'][oIdx];
                          const isCorrect = showAnswerKey && optLabel === mcq.correct;
                          return (
                            <div
                              key={oIdx}
                              className={`p-1.5 border rounded flex items-center justify-between gap-1 transition-colors ${isCorrect ? 'bg-emerald-100 border-emerald-500 font-black text-emerald-900' : 'bg-white border-slate-200'}`}
                            >
                              <div className="flex items-center gap-1.5">
                                <span className={`w-5 h-5 rounded-full font-bold flex items-center justify-center text-[10px] ${isCorrect ? 'bg-emerald-600 text-white' : 'bg-slate-100'}`}>{optLabel}</span>
                                <span className="truncate">{opt}</span>
                              </div>
                              <span className="font-urdu text-[11px] text-slate-500">{mcq.optionsUr[oIdx]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Sample Section: Subjective / Short Questions */}
                  <div className="bg-slate-900 text-white px-3 py-1.5 rounded flex justify-between items-center font-bold text-xs mt-3">
                    <span>Section-I: Write short answers to any 5 questions. (5 x 2 = 10)</span>
                    <span className="font-urdu text-sm">حصہ اول: کوئی سے 5 سوالات کے مختصر جوابات تحریر کریں۔</span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 text-xs">
                    {currentMockData.shortQuestions.map((sq, sIdx) => (
                      <div key={sIdx} className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between items-start gap-2">
                        <span className="font-medium"><strong>({['i', 'ii', 'iii', 'iv', 'v'][sIdx] || sIdx + 1})</strong> {sq.textEn}</span>
                        <span className="font-urdu text-slate-700 text-right shrink-0">{sq.textUr}</span>
                      </div>
                    ))}
                  </div>

                  {/* Sample Section: Subjective Part II / Long Questions */}
                  <div className="bg-slate-900 text-white px-3 py-1.5 rounded flex justify-between items-center font-bold text-xs mt-3">
                    <span>Section-II: Attempt any ONE long question in detail. (1 x 9 = 9)</span>
                    <span className="font-urdu text-sm">حصہ دوم: کوئی سا ایک تفصیلی سوال حل کریں۔</span>
                  </div>

                  {currentMockData.longQuestions.map((lq, lIdx) => (
                    <div key={lIdx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs">
                      <div className="flex justify-between items-start gap-2 border-b border-slate-200 pb-1.5">
                        <span className="font-medium"><strong>Q{lIdx + 5}. (a)</strong> {lq.partAEn} <strong className="text-indigo-600">(5 Marks)</strong></span>
                        <span className="font-urdu text-slate-700 text-right shrink-0 font-bold">{lq.partAUr}</span>
                      </div>
                      <div className="flex justify-between items-start gap-2">
                        <span className="font-medium"><strong>(b)</strong> {lq.partBEn} <strong className="text-indigo-600">(4 Marks)</strong></span>
                        <span className="font-urdu text-slate-700 text-right shrink-0 font-bold">{lq.partBUr}</span>
                      </div>
                    </div>
                  ))}

                  {/* Optional Answer Key Preview Banner */}
                  {showAnswerKey && (
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl mt-3 animate-in fade-in">
                      <div className="font-bold text-emerald-800 text-xs mb-1 flex items-center gap-1.5">
                        <CheckCircle2 size={14} /> Teacher Answer Key & Solution Reference:
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs font-bold text-emerald-900">
                        {currentMockData.mcqs.map((mcq, idx) => (
                          <span key={idx} className="bg-white border border-emerald-200 px-2 py-0.5 rounded shadow-2xs">
                            Q{idx + 1}: ({mcq.correct}) {mcq.optionsEn[['A', 'B', 'C', 'D'].indexOf(mcq.correct)]}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                </div>

                {/* Footer preview note */}
                <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    <CheckCircle2 size={13} /> 100% Board Standard Layout & Nastaleeq Urdu Font
                  </span>
                  <span>Generated dynamically by {platformConfig.name}</span>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. SUPPORTED BOARDS & CURRICULUM BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80">
          <div className="text-center mb-6">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Full Board & Syllabus Coverage
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-2">
              Ready for All 9 Punjab Educational Boards, FBISE & Single National Curriculum (SNC)
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {BOARDS.map((b, idx) => (
              <div key={idx} className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/70 rounded-2xl text-center transition-all">
                <div className="text-xs font-bold text-slate-800">{b.name}</div>
                <div className="text-[10px] font-semibold text-indigo-600 mt-0.5">{b.badge}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CORE TEACHER & ACADEMY BENEFITS */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Built for Pakistani Educators
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">
            Everything You Need to Run Seamless School & Academy Tests
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
            Stop wasting valuable teacher hours on manual typing, Urdu keyboard issues, and page formatting errors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Languages,
              color: 'text-indigo-600 bg-indigo-50',
              title: "100% Bilingual Urdu & English",
              desc: "Native Nastaleeq Urdu typography with English side-by-side. Supports science formulas, math equations, and diagrams seamlessly."
            },
            {
              icon: Layers,
              color: 'text-cyan-600 bg-cyan-50',
              title: "Official Pairing Schemes (2025–26)",
              desc: "Select chapters and let the system automatically distribute MCQs, short questions, and long questions strictly by board pairing schemes."
            },
            {
              icon: Printer,
              color: 'text-emerald-600 bg-emerald-50',
              title: "Your School Logo & Watermark",
              desc: "Every printed paper carries your academy's official header, contact info, logo, and anti-copy watermark ready in PDF format."
            },
            {
              icon: FileCheck2,
              color: 'text-amber-600 bg-amber-50',
              title: "Instant Teacher Answer Keys",
              desc: "Generate complete solution keys alongside the student paper with one click, saving hours of manual checking time."
            },
            {
              icon: Database,
              color: 'text-violet-600 bg-violet-50',
              title: "Massive 100,000+ Question Bank",
              desc: "Filtered chapter-by-chapter according to PCTB textbooks, previous 5-year past papers, exercise questions, and conceptual SLOs."
            },
            {
              icon: Clock,
              color: 'text-rose-600 bg-rose-50',
              title: "Monthly & Test-Series Modes",
              desc: "Generate Quarter Book, Half Book, Full Book, or custom chapter tests in seconds for continuous test session management."
            }
          ].map((feature, i) => (
            <div key={i} className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${feature.color} mb-5`}>
                <feature.icon size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. REAL TESTIMONIALS FROM PAKISTANI ACADEMIES */}
      <section className="bg-slate-900 text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800">
              Trusted by 500+ Institutions
            </span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3">What Teachers & Principals Say</h2>
            <p className="text-slate-400 text-sm mt-2">See how top academies across Pakistan speed up their examination prep.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "PakParcha AI saved our academy over 20 hours every week during the matric test session. The Urdu formatting and pairing scheme accuracy is simply remarkable.",
                name: "Sir Kashif Rehman",
                role: "Managing Director",
                academy: "Falcon Science Academy, Lahore",
                stars: 5
              },
              {
                quote: "Generating bilingual papers for 9th and 10th chemistry used to take half a day in InPage. Now our teachers prepare and print with school watermark in 2 minutes.",
                name: "Prof. Muhammad Tariq",
                role: "Head of Science Dept.",
                academy: "Model College Campus, Multan",
                stars: 5
              },
              {
                quote: "The student learning outcome (SLO) conceptual question bank helped our students prepare for board examinations with great confidence. Highly recommended!",
                name: "Madam Shagufta Naz",
                role: "Academic Coordinator",
                academy: "Allied School Branch, Faisalabad",
                stars: 5
              }
            ].map((t, idx) => (
              <div key={idx} className="p-7 rounded-3xl bg-slate-800/80 border border-slate-700 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 text-amber-400 mb-4">
                    {[...Array(t.stars)].map((_, s) => (
                      <Star key={s} size={16} fill="#fbbf24" stroke="none" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed italic mb-6">
                    "{t.quote}"
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-700/60">
                  <div className="font-bold text-white text-sm">{t.name}</div>
                  <div className="text-xs text-cyan-400">{t.role}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{t.academy}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. LATEST LEARNING RESOURCES & STUDY NOTES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Free Study Resources
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              Explore Board Past Papers, Notes & Guides
            </h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onNavigate('PAST_PAPERS')}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              All Past Papers &rarr;
            </button>
            <button
              onClick={() => onNavigate('NOTES')}
              className="px-4 py-2 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              All Notes &rarr;
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Notes Card */}
          <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Latest Chapter Notes</h3>
                  <p className="text-xs text-slate-500">Free chapter summaries & solved questions</p>
                </div>
              </div>
              <button onClick={() => onNavigate('NOTES')} className="text-xs font-bold text-indigo-600 hover:underline">
                View All
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentNotes.length > 0 ? (
                recentNotes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => onNavigate('NOTES')}
                    className="w-full py-3.5 text-left group flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {n.title || n.name || 'Study Guide & Solved Questions'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {[n.subject, n.grade, n.noteType].filter(Boolean).join(' • ') || 'PCTB Syllabus'}
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </button>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  Notes catalog available in the Notes section.
                </div>
              )}
            </div>
          </div>

          {/* Past Papers / Blog Card */}
          <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Exam Guides & Past Papers</h3>
                  <p className="text-xs text-slate-500">Board schemes & exam preparation articles</p>
                </div>
              </div>
              <button onClick={() => onNavigate('BLOG')} className="text-xs font-bold text-cyan-600 hover:underline">
                View All
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentBlogs.length > 0 ? (
                recentBlogs.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onNavigate('BLOG')}
                    className="w-full py-3.5 text-left group flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {b.title || 'Board Exam Pattern & Preparation Tips'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {b.excerpt || b.category || 'Read the full guide for preparation.'}
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </button>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  Blog articles available in the Blog section.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. STATS / IMPACT */}
      <section className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 py-16 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-black text-cyan-400 mb-1">
                {loadingStats ? <Loader2 className="animate-spin inline" size={24} /> : formatNumber(stats.papers || 5400)}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">Exam Papers Generated</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-black text-indigo-400 mb-1">
                {loadingStats ? <Loader2 className="animate-spin inline" size={24} /> : formatNumber(stats.schools || 450)}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">Schools & Academies</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 mb-1">
                {loadingStats ? <Loader2 className="animate-spin inline" size={24} /> : formatNumber(stats.questions || 120000)}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">Bilingual Questions</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-black text-amber-400 mb-1">
                100%
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">Board Pairing Aligned</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. LOCAL PAKISTANI PAYMENT & TRUST BADGES */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">
            Easy & Secure Local Payment Options in Pakistan
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-80">
            <div className="flex items-center gap-2 font-black text-slate-800 text-sm">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span> EasyPaisa
            </div>
            <div className="flex items-center gap-2 font-black text-slate-800 text-sm">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span> JazzCash
            </div>
            <div className="flex items-center gap-2 font-black text-slate-800 text-sm">
              <span className="w-3 h-3 rounded-full bg-indigo-500"></span> 1Link / Bank Transfer
            </div>
            <div className="flex items-center gap-2 font-black text-slate-800 text-sm">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span> Raast Instant Pay
            </div>
            <div className="flex items-center gap-2 font-black text-slate-800 text-sm">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span> Visa & Mastercard
            </div>
          </div>
        </div>
      </section>

      {/* 8. FINAL CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-indigo-800 to-cyan-900 text-white p-10 sm:p-14 text-center shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">
              Ready to Save 4 Hours Every Exam Day?
            </h2>
            <p className="text-slate-200 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
              Join hundreds of schools and academies across Pakistan creating board-standard examination papers with PakParcha AI.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onNavigate('SIGNUP')}
                className="w-full sm:w-auto px-10 py-4 bg-white text-indigo-900 hover:bg-indigo-50 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl active:scale-95 cursor-pointer"
              >
                Create Free Account
              </button>
              <button
                onClick={() => onNavigate('PRICING')}
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
              >
                View Academy Plans
              </button>
            </div>

            <p className="mt-6 text-xs text-indigo-200 flex items-center justify-center gap-2 font-medium">
              <CheckCircle2 size={15} className="text-emerald-400" /> Free 14-day trial &bull; No credit card required &bull; Cancel anytime
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
