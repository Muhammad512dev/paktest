import * as XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const defaultBoard = "Punjab Board (PCTB)";

const sampleQuestions = [
  // --- MATHEMATICS EXAMPLES ---
  {
    Board: defaultBoard,
    Grade: "Class 10",
    Subject: "Mathematics",
    Chapter: "Quadratic Equations",
    Topic: "Discriminant & Nature of Roots",
    QuestionText_EN: "The discriminant of the quadratic equation ax² + bx + c = 0 is:",
    QuestionText_UR: "دو درجی مساوات ax² + bx + c = 0 کا فرق کنندہ (discriminant) ہوتا ہے:",
    Type: "MCQ",
    Marks: 1,
    Difficulty: "Easy",
    OptionA_EN: "b² - 4ac",
    OptionA_UR: "b² - 4ac",
    OptionB_EN: "b² + 4ac",
    OptionB_UR: "b² + 4ac",
    OptionC_EN: "-b ± √(b² - 4ac)",
    OptionC_UR: "-b ± √(b² - 4ac)",
    OptionD_EN: "4ac - b²",
    OptionD_UR: "4ac - b²",
    CorrectAnswer_Letter: "A",
    ModelAnswer_EN: "",
    ModelAnswer_UR: "",
    ImageURL: "",
    Sources: "Textbook Exercise|Past Board 2024"
  },
  {
    Board: defaultBoard,
    Grade: "Class 9",
    Subject: "Mathematics",
    Chapter: "Matrices and Determinants",
    Topic: "Singular and Non-Singular Matrices",
    QuestionText_EN: "If the determinant of a square matrix |A| = 0, then matrix A is called:",
    QuestionText_UR: "اگر کسی مربی قالب کا مقطع |A| = 0 ہو، تو قالب A کہلاتا ہے:",
    Type: "MCQ",
    Marks: 1,
    Difficulty: "Easy",
    OptionA_EN: "Singular Matrix",
    OptionA_UR: "نادر قالب (Singular)",
    OptionB_EN: "Non-Singular Matrix",
    OptionB_UR: "غیر نادر قالب (Non-Singular)",
    OptionC_EN: "Identity Matrix",
    OptionC_UR: "وحدانی قالب (Identity)",
    OptionD_EN: "Null Matrix",
    OptionD_UR: "صفری قالب (Null)",
    CorrectAnswer_Letter: "A",
    ModelAnswer_EN: "",
    ModelAnswer_UR: "",
    ImageURL: "",
    Sources: "Textbook Exercise|Model Paper"
  },
  {
    Board: defaultBoard,
    Grade: "Class 10",
    Subject: "Mathematics",
    Chapter: "Introduction to Trigonometry",
    Topic: "Trigonometric Identities",
    QuestionText_EN: "Prove the fundamental trigonometric identity: sin²θ + cos²θ = 1.",
    QuestionText_UR: "بنیادی مثلثیاتی مماثلت ثابت کریں: sin²θ + cos²θ = 1",
    Type: "Short Answer",
    Marks: 2,
    Difficulty: "Medium",
    OptionA_EN: "", OptionA_UR: "", OptionB_EN: "", OptionB_UR: "", OptionC_EN: "", OptionC_UR: "", OptionD_EN: "", OptionD_UR: "", CorrectAnswer_Letter: "",
    ModelAnswer_EN: "In a right triangle with perpendicular a, base b and hypotenuse c: sinθ = a/c and cosθ = b/c. Then sin²θ + cos²θ = (a²/c²) + (b²/c²) = (a² + b²)/c². By Pythagoras Theorem, a² + b² = c², so c²/c² = 1. Hence proved.",
    ModelAnswer_UR: "قائمۃ الزاویہ مثلث میں عمود a، قاعدہ b اور وتر c ہو۔ sinθ = a/c اور cosθ = b/c ہے۔ لہٰذا sin²θ + cos²θ = (a² + b²)/c²۔ مسئلہ فیثاغورث کی رو سے a² + b² = c² ہوتا ہے، پس c²/c² = 1۔ ثابت ہوا۔",
    ImageURL: "",
    Sources: "Past Board 2023|Important Concept"
  },
  {
    Board: defaultBoard,
    Grade: "Class 9",
    Subject: "Mathematics",
    Chapter: "Matrices and Determinants",
    Topic: "Cramer's Rule",
    QuestionText_EN: "Solve the following system of linear equations using Cramer's Rule:\n2x - 2y = 4\n3x + 2y = 6",
    QuestionText_UR: "کرائمر کے قانون (Cramer's Rule) کی مدد سے مساواتوں کا نظام حل کریں:\n2x - 2y = 4\n3x + 2y = 6",
    Type: "Long Answer",
    Marks: 4,
    Difficulty: "Hard",
    OptionA_EN: "", OptionA_UR: "", OptionB_EN: "", OptionB_UR: "", OptionC_EN: "", OptionC_UR: "", OptionD_EN: "", OptionD_UR: "", CorrectAnswer_Letter: "",
    ModelAnswer_EN: "Matrix A = [[2, -2], [3, 2]], |A| = (2)(2) - (-2)(3) = 4 + 6 = 10 ≠ 0.\nMatrix Ax = [[4, -2], [6, 2]], |Ax| = (4)(2) - (-2)(6) = 8 + 12 = 20. So x = |Ax| / |A| = 20/10 = 2.\nMatrix Ay = [[2, 4], [3, 6]], |Ay| = (2)(6) - (4)(3) = 12 - 12 = 0. So y = |Ay| / |A| = 0/10 = 0.\nSolution Set = {(2, 0)}.",
    ModelAnswer_UR: "قالب A = [[2, -2], [3, 2]]، مقطع |A| = 4 + 6 = 10 ≠ 0۔\nقالب Ax کا مقطع |Ax| = 8 + 12 = 20، پس x = 20/10 = 2۔\nقالب Ay کا مقطع |Ay| = 12 - 12 = 0، پس y = 0/10 = 0۔\nحل سیٹ = {(2, 0)}۔",
    ImageURL: "",
    Sources: "Textbook Review Exercise|Past Board 2022"
  },

  // --- CHEMISTRY EXAMPLES ---
  {
    Board: defaultBoard,
    Grade: "Class 9",
    Subject: "Chemistry",
    Chapter: "Structure of Molecules",
    Topic: "Types of Covalent Bonds",
    QuestionText_EN: "Which of the following diatomic gas molecules contains a triple covalent bond?",
    QuestionText_UR: "درج ذیل میں سے کس مالیکیول میں ٹرپل کوویلنٹ بانڈ موجود ہوتا ہے؟",
    Type: "MCQ",
    Marks: 1,
    Difficulty: "Medium",
    OptionA_EN: "N₂ (Nitrogen)",
    OptionA_UR: "N₂ (نائٹروجن)",
    OptionB_EN: "O₂ (Oxygen)",
    OptionB_UR: "O₂ (آکسیجن)",
    OptionC_EN: "Cl₂ (Chlorine)",
    OptionC_UR: "Cl₂ (کلورین)",
    OptionD_EN: "H₂ (Hydrogen)",
    OptionD_UR: "H₂ (ہائیڈروجن)",
    CorrectAnswer_Letter: "A",
    ModelAnswer_EN: "",
    ModelAnswer_UR: "",
    ImageURL: "",
    Sources: "Textbook Exercise|Past Board 2024"
  },
  {
    Board: defaultBoard,
    Grade: "Class 11",
    Subject: "Chemistry",
    Chapter: "Basic Concepts",
    Topic: "Avogadro's Constant & Moles",
    QuestionText_EN: "The number of atoms present in exactly 1 mole of carbon-12 (12g) is:",
    QuestionText_UR: "کاربن-12 کے 1 مول میں موجود ایٹمز کی تعداد کتنی ہوتی ہے؟",
    Type: "MCQ",
    Marks: 1,
    Difficulty: "Easy",
    OptionA_EN: "6.022 × 10²³ atoms",
    OptionA_UR: "6.022 × 10²³ ایٹمز",
    OptionB_EN: "3.011 × 10²³ atoms",
    OptionB_UR: "3.011 × 10²³ ایٹمز",
    OptionC_EN: "1.66 × 10⁻²⁴ atoms",
    OptionC_UR: "1.66 × 10⁻²⁴ ایٹمز",
    OptionD_EN: "12 × 10²³ atoms",
    OptionD_UR: "12 × 10²³ ایٹمز",
    CorrectAnswer_Letter: "A",
    ModelAnswer_EN: "",
    ModelAnswer_UR: "",
    ImageURL: "",
    Sources: "Model Paper|FBISE Board"
  },
  {
    Board: defaultBoard,
    Grade: "Class 9",
    Subject: "Chemistry",
    Chapter: "Physical States of Matter",
    Topic: "Boyle's Law",
    QuestionText_EN: "State Boyle's Law and write its mathematical equation.",
    QuestionText_UR: "بوائل کا قانون بیان کریں اور اس کا حسابی فارمولا لکھیں۔",
    Type: "Short Answer",
    Marks: 2,
    Difficulty: "Medium",
    OptionA_EN: "", OptionA_UR: "", OptionB_EN: "", OptionB_UR: "", OptionC_EN: "", OptionC_UR: "", OptionD_EN: "", OptionD_UR: "", CorrectAnswer_Letter: "",
    ModelAnswer_EN: "Boyle's Law states that the volume of a given mass of a gas is inversely proportional to its pressure at constant temperature. Mathematical form: V ∝ 1/P or P₁V₁ = P₂V₂ = k (constant).",
    ModelAnswer_UR: "اگر درجہ حرارت مستقل رہے تو گیس کے دیے گئے ماس کا والیم اس پر لگائے گئے پریشر کے انورسلی پروپورشنل ہوتا ہے۔ حسابی فارمولا: V ∝ 1/P یا P₁V₁ = P₂V₂ = k (مستقل)۔",
    ImageURL: "",
    Sources: "Textbook Chapter 5|Board Important"
  },
  {
    Board: defaultBoard,
    Grade: "Class 10",
    Subject: "Chemistry",
    Chapter: "Chemical Equilibrium",
    Topic: "Law of Mass Action & Kc Derivation",
    QuestionText_EN: "State the Law of Mass Action. Derive the expression for equilibrium constant (Kc) for the general reversible reaction: aA + bB ⇌ cC + dD.",
    QuestionText_UR: "لا آف ماس ایکشن بیان کریں۔ اور عمومی ریورسیبل ری ایکشن aA + bB ⇌ cC + dD کے لیے ایکویلیبریم کانسٹنٹ (Kc) کا فارمولا اخذ کریں۔",
    Type: "Long Answer",
    Marks: 5,
    Difficulty: "Hard",
    OptionA_EN: "", OptionA_UR: "", OptionB_EN: "", OptionB_UR: "", OptionC_EN: "", OptionC_UR: "", OptionD_EN: "", OptionD_UR: "", CorrectAnswer_Letter: "",
    ModelAnswer_EN: "The rate at which a substance reacts is directly proportional to its active mass. For reaction aA + bB ⇌ cC + dD: Forward rate Rf = kf[A]^a[B]^b, Reverse rate Rr = kr[C]^c[D]^d. At dynamic equilibrium Rf = Rr, therefore kf/kr = ([C]^c[D]^d) / ([A]^a[B]^b) = Kc.",
    ModelAnswer_UR: "کسی شے کے ری ایکٹ کرنے کی رفتار اس کے ایکٹو ماس کے ڈائریکٹلی پروپورشنل ہوتی ہے۔ فارورڈ ری ایکشن کی رفتار Rf = kf[A]^a[B]^b، ریورس ری ایکشن کی رفتار Rr = kr[C]^c[D]^d۔ متوازن حالت پر Rf = Rr، لہٰذا Kc = ([C]^c[D]^d) / ([A]^a[B]^b)۔",
    ImageURL: "",
    Sources: "Textbook Chapter 9|Past Board 2023"
  },

  // --- PHYSICS EXAMPLES ---
  {
    Board: defaultBoard,
    Grade: "Class 9",
    Subject: "Physics",
    Chapter: "Dynamics",
    Topic: "Newton's Second Law of Motion",
    QuestionText_EN: "The SI unit of force is Newton (N), which in base units is equivalent to:",
    QuestionText_UR: "فورس کا ایس آئی یونٹ نیوٹن (N) ہے، جو بنیادی یونٹس میں برابر ہوتا ہے:",
    Type: "MCQ",
    Marks: 1,
    Difficulty: "Easy",
    OptionA_EN: "kg·m/s²",
    OptionA_UR: "kg·m/s²",
    OptionB_EN: "kg·m²/s²",
    OptionB_UR: "kg·m²/s²",
    OptionC_EN: "kg·m/s",
    OptionC_UR: "kg·m/s",
    OptionD_EN: "N·m",
    OptionD_UR: "N·m",
    CorrectAnswer_Letter: "A",
    ModelAnswer_EN: "",
    ModelAnswer_UR: "",
    ImageURL: "",
    Sources: "Textbook Exercise|Past Paper"
  },
  {
    Board: defaultBoard,
    Grade: "Class 10",
    Subject: "Physics",
    Chapter: "Current Electricity",
    Topic: "Ohm's Law & Resistance",
    QuestionText_EN: "State Ohm's Law and state the relationship between Voltage, Current, and Resistance.",
    QuestionText_UR: "اوہم کا قانون (Ohm's Law) بیان کریں اور وولٹیج، کرنٹ اور ریزسٹنس کے مابین تعلق واضح کریں۔",
    Type: "Short Answer",
    Marks: 2,
    Difficulty: "Medium",
    OptionA_EN: "", OptionA_UR: "", OptionB_EN: "", OptionB_UR: "", OptionC_EN: "", OptionC_UR: "", OptionD_EN: "", OptionD_UR: "", CorrectAnswer_Letter: "",
    ModelAnswer_EN: "The current (I) flowing through a conductor is directly proportional to the potential difference (V) across its ends, provided temperature and physical state remain constant. Formula: V = IR (where V is in Volts, I in Amperes, R in Ohms Ω).",
    ModelAnswer_UR: "اگر موصل کی طبعی حالت اور درجہ حرارت تبدیل نہ ہو تو اس میں سے گزرنے والا کرنٹ (I) اس کے سروں پر پوٹینشل ڈفرنس (V) کے ڈائریکٹلی پروپورشنل ہوتا ہے۔ فارمولا: V = IR۔",
    ImageURL: "",
    Sources: "Textbook Chapter 14|Past Board 2024"
  },

  // --- BIOLOGY EXAMPLES ---
  {
    Board: defaultBoard,
    Grade: "Class 9",
    Subject: "Biology",
    Chapter: "Bioenergetics",
    Topic: "Photosynthesis Equation",
    QuestionText_EN: "Which of the following is the overall balanced chemical equation for Photosynthesis?",
    QuestionText_UR: "فوٹوسنتھیسز (Photosynthesis) کے عمل کی متوازن کیمیائی مساوات کون سی ہے؟",
    Type: "MCQ",
    Marks: 1,
    Difficulty: "Medium",
    OptionA_EN: "6CO₂ + 12H₂O + Light → C₆H₁₂O₆ + 6O₂ + 6H₂O",
    OptionA_UR: "6CO₂ + 12H₂O + روشنی → C₆H₁₂O₆ + 6O₂ + 6H₂O",
    OptionB_EN: "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + Energy",
    OptionB_UR: "C₆H₁₂O₆ + 6O₂ → 6CO₂ + 6H₂O + انرجی",
    OptionC_EN: "6CO₂ + 6O₂ → C₆H₁₂O₆ + 6H₂O",
    OptionC_UR: "6CO₂ + 6O₂ → C₆H₁₂O₆ + 6H₂O",
    OptionD_EN: "CO₂ + H₂O → C₆H₁₂O₆",
    OptionD_UR: "CO₂ + H₂O → C₆H₁₂O₆",
    CorrectAnswer_Letter: "A",
    ModelAnswer_EN: "",
    ModelAnswer_UR: "",
    ImageURL: "",
    Sources: "Textbook Exercise|Model Paper"
  },

  // --- MATCH COLUMNS EXAMPLE ---
  {
    Board: defaultBoard,
    Grade: "Class 9",
    Subject: "Chemistry",
    Chapter: "Acids, Bases and Salts",
    Topic: "Natural Sources of Acids",
    QuestionText_EN: "Match the naturally occurring acids in Column A with their respective sources in Column B.",
    QuestionText_UR: "کالم الف میں دیے گئے قدرتی ایسڈز کو کالم ب میں ان کے ذرائع سے ملائیں۔",
    Type: "Match Columns",
    Marks: 4,
    Difficulty: "Medium",
    Pair1_Left_EN: "Citric Acid",
    Pair1_Left_UR: "سائٹرک ایسڈ",
    Pair1_Right_EN: "Citrus Fruits (Lemon/Orange)",
    Pair1_Right_UR: "لیموں اور مالٹا",
    Pair2_Left_EN: "Acetic Acid (Vinegar)",
    Pair2_Left_UR: "ایسٹک ایسڈ (سرکہ)",
    Pair2_Right_EN: "Vinegar Solution",
    Pair2_Right_UR: "سرکہ کا محلول",
    Pair3_Left_EN: "Lactic Acid",
    Pair3_Left_UR: "لیکٹک ایسڈ",
    Pair3_Right_EN: "Sour Milk & Yogurt",
    Pair3_Right_UR: "کھٹا دودھ اور دہی",
    Pair4_Left_EN: "Tartaric Acid",
    Pair4_Left_UR: "ٹارٹرک ایسڈ",
    Pair4_Right_EN: "Tamarind & Grapes",
    Pair4_Right_UR: "املی اور انگور",
    OptionA_EN: "", OptionA_UR: "", OptionB_EN: "", OptionB_UR: "", OptionC_EN: "", OptionC_UR: "", OptionD_EN: "", OptionD_UR: "", CorrectAnswer_Letter: "",
    ModelAnswer_EN: "",
    ModelAnswer_UR: "",
    ImageURL: "",
    Sources: "Textbook Table|Practical Chemistry"
  },

  // --- TRUE / FALSE EXAMPLE ---
  {
    Board: defaultBoard,
    Grade: "Class 9",
    Subject: "Physics",
    Chapter: "Kinematics",
    Topic: "Scalar and Vector Quantities",
    QuestionText_EN: "Speed is a scalar quantity while velocity is a vector quantity having both magnitude and direction.",
    QuestionText_UR: "سپیڈ ایک سکیلر مقدار ہے جبکہ ویلاسٹی ایک ویکٹر مقدار ہے جس کی مقدار اور سمت دونوں ہوتی ہیں۔",
    Type: "True/False",
    Marks: 1,
    Difficulty: "Easy",
    OptionA_EN: "", OptionA_UR: "", OptionB_EN: "", OptionB_UR: "", OptionC_EN: "", OptionC_UR: "", OptionD_EN: "", OptionD_UR: "",
    CorrectAnswer_Letter: "True",
    ModelAnswer_EN: "True",
    ModelAnswer_UR: "درست",
    ImageURL: "",
    Sources: "Textbook Concept|Past Paper"
  },

  // --- FILL IN THE BLANKS EXAMPLE ---
  {
    Board: defaultBoard,
    Grade: "Class 10",
    Subject: "Mathematics",
    Chapter: "Sets and Functions",
    Topic: "De Morgan's Laws",
    QuestionText_EN: "According to De Morgan's Law, the complement of union (A ∪ B)' is equal to ________.",
    QuestionText_UR: "ڈی مورگن کے قانون کے مطابق، یونین کا کمپلیمنٹ (A ∪ B)' برابر ہوتا ہے ________ کے۔",
    Type: "Fill in the Blanks",
    Marks: 1,
    Difficulty: "Medium",
    OptionA_EN: "", OptionA_UR: "", OptionB_EN: "", OptionB_UR: "", OptionC_EN: "", OptionC_UR: "", OptionD_EN: "", OptionD_UR: "",
    CorrectAnswer_Letter: "A' ∩ B'",
    ModelAnswer_EN: "A' ∩ B'",
    ModelAnswer_UR: "A' ∩ B'",
    ImageURL: "",
    Sources: "Textbook Summary"
  }
];

const guideRows = [
  { "Field Name": "Board", "Required": "Yes", "Description": "Exam Board / Syllabus (e.g. Punjab Board (PCTB), Federal Board (FBISE), Sindh Board, KPK Board, Cambridge)" },
  { "Field Name": "Grade", "Required": "Yes", "Description": "Class level (e.g. Class 9, Class 10, Class 11, Class 12, Grade 8)" },
  { "Field Name": "Subject", "Required": "Yes", "Description": "Subject name (e.g. Mathematics, Chemistry, Physics, Biology, Computer Science, English, Urdu, Islamiat, Pak Studies)" },
  { "Field Name": "Chapter", "Required": "Yes", "Description": "Chapter / Unit title (e.g. Quadratic Equations, Structure of Molecules, Dynamics)" },
  { "Field Name": "Topic", "Required": "Optional", "Description": "Specific sub-topic or section within the chapter" },
  { "Field Name": "QuestionText_EN", "Required": "Yes (or UR)", "Description": "Question statement in English. Supports LaTeX like $x^2+y^2=r^2$ and unicode mathematical symbols" },
  { "Field Name": "QuestionText_UR", "Required": "Yes (or EN)", "Description": "Question statement in Urdu (نستعلیق / اردو)" },
  { "Field Name": "Type", "Required": "Yes", "Description": "Question Type: MCQ, Short Answer, Long Answer, Match Columns, True/False, Fill in the Blanks" },
  { "Field Name": "Marks", "Required": "Yes", "Description": "Default marks awarded (e.g. 1 for MCQ, 2 for Short, 4 or 5 for Long Answer)" },
  { "Field Name": "Difficulty", "Required": "Yes", "Description": "Easy, Medium, or Hard" },
  { "Field Name": "OptionA_EN / UR .. OptionD", "Required": "For MCQ", "Description": "Options A, B, C, D in English and Urdu" },
  { "Field Name": "CorrectAnswer_Letter", "Required": "For MCQ/TF", "Description": "Correct Option letter: A, B, C, or D (or True/False)" },
  { "Field Name": "ModelAnswer_EN / UR", "Required": "Optional", "Description": "Step-by-step solution, mathematical proof, derivation or marking scheme" },
  { "Field Name": "Pair1_Left_EN .. Pair5_Right_UR", "Required": "For Match", "Description": "Matching pairs for Column A and Column B" },
  { "Field Name": "Sources", "Required": "Optional", "Description": "Pipe-separated past paper tags (e.g. Past Board 2024|Model Paper|Exercise)" }
];

// 1. Build Multi-Sheet Excel Workbook
const wb = XLSX.utils.book_new();

// Sheet 1: All Questions
const wsAll = XLSX.utils.json_to_sheet(sampleQuestions);
XLSX.utils.book_append_sheet(wb, wsAll, "All_Question_Examples");

// Sheet 2: Math
const mathRows = sampleQuestions.filter(r => r.Subject === "Mathematics");
const wsMath = XLSX.utils.json_to_sheet(mathRows);
XLSX.utils.book_append_sheet(wb, wsMath, "Mathematics_Examples");

// Sheet 3: Chemistry
const chemRows = sampleQuestions.filter(r => r.Subject === "Chemistry");
const wsChem = XLSX.utils.json_to_sheet(chemRows);
XLSX.utils.book_append_sheet(wb, wsChem, "Chemistry_Examples");

// Sheet 4: Physics
const physRows = sampleQuestions.filter(r => r.Subject === "Physics");
const wsPhys = XLSX.utils.json_to_sheet(physRows);
XLSX.utils.book_append_sheet(wb, wsPhys, "Physics_Examples");

// Sheet 5: Biology
const bioRows = sampleQuestions.filter(r => r.Subject === "Biology");
const wsBio = XLSX.utils.json_to_sheet(bioRows);
XLSX.utils.book_append_sheet(wb, wsBio, "Biology_Examples");

// Sheet 6: Formatting Guide
const wsGuide = XLSX.utils.json_to_sheet(guideRows);
XLSX.utils.book_append_sheet(wb, wsGuide, "Instructions_Guide");

const excelOutPath = path.join(ROOT_DIR, 'Global_Questions_Master_Template.xlsx');
XLSX.writeFile(wb, excelOutPath);
console.log(`✅ Created Master Excel Template at: ${excelOutPath}`);

// 2. Build Master CSV File
const csvContent = XLSX.utils.sheet_to_csv(wsAll);
const csvOutPath = path.join(ROOT_DIR, 'Global_Questions_Master_Template.csv');
fs.writeFileSync(csvOutPath, csvContent, 'utf-8');
console.log(`✅ Created Master CSV Template at: ${csvOutPath}`);
