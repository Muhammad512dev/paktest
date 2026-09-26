/**
 * Generate Excel import templates for all 17 question types
 * Run: node scripts/generate_all_type_templates.js
 */
const XLSX = require('xlsx');
const path = require('path');

const COMMON_COLS = ['Board', 'Grade', 'Subject', 'Chapter', 'Topic', 'Difficulty', 'Marks', 'Source', 'Medium'];

const QUESTION_TYPE_TEMPLATES = [
  {
    sheet: 'MCQ',
    cols: [...COMMON_COLS, 'Type', 'QuestionText_EN', 'QuestionText_UR',
      'OptionA_EN', 'OptionB_EN', 'OptionC_EN', 'OptionD_EN',
      'OptionA_UR', 'OptionB_UR', 'OptionC_UR', 'OptionD_UR',
      'CorrectAnswer', 'ImageURL'],
    sample: {
      Board: 'Punjab Board', Grade: 'Class 9', Subject: 'Biology', Chapter: 'Chapter 1', Topic: 'Introduction',
      Difficulty: 'Easy', Marks: 1, Source: 'Textbook Exercise', Medium: 'Bilingual', Type: 'MCQ',
      QuestionText_EN: 'Which is the basic unit of life?',
      QuestionText_UR: 'زندگی کی بنیادی اکائی کیا ہے؟',
      OptionA_EN: 'Atom', OptionB_EN: 'Cell', OptionC_EN: 'Tissue', OptionD_EN: 'Organ',
      OptionA_UR: 'ایٹم', OptionB_UR: 'خلیہ', OptionC_UR: 'بافت', OptionD_UR: 'عضو',
      CorrectAnswer: 'B', ImageURL: ''
    }
  },
  {
    sheet: 'Short Answer',
    cols: [...COMMON_COLS, 'Type', 'QuestionText_EN', 'QuestionText_UR', 'ModelAnswer_EN', 'ModelAnswer_UR', 'ImageURL'],
    sample: {
      Board: 'Punjab Board', Grade: 'Class 9', Subject: 'Biology', Chapter: 'Chapter 1', Topic: 'Introduction',
      Difficulty: 'Easy', Marks: 2, Source: 'Textbook Exercise', Medium: 'Bilingual', Type: 'Short Answer',
      QuestionText_EN: 'Define cell membrane.',
      QuestionText_UR: 'خلوی جھلی کی تعریف کریں۔',
      ModelAnswer_EN: 'Cell membrane is a thin, flexible barrier surrounding the cell.',
      ModelAnswer_UR: 'خلوی جھلی ایک پتلی لچکدار پرت ہے جو خلیے کو گھیرے ہوئے ہوتی ہے۔', ImageURL: ''
    }
  },
  {
    sheet: 'Long Answer',
    cols: [...COMMON_COLS, 'Type', 'QuestionText_EN', 'QuestionText_UR', 'ModelAnswer_EN', 'ModelAnswer_UR', 'ImageURL'],
    sample: {
      Board: 'Punjab Board', Grade: 'Class 9', Subject: 'Biology', Chapter: 'Chapter 1', Topic: 'Introduction',
      Difficulty: 'Hard', Marks: 5, Source: 'Past Paper', Medium: 'Bilingual', Type: 'Long Answer',
      QuestionText_EN: 'Describe the structure and function of the cell.',
      QuestionText_UR: 'خلیے کی ساخت اور کام کو بیان کریں۔',
      ModelAnswer_EN: 'The cell is the basic structural unit of life. It contains a nucleus, cytoplasm...',
      ModelAnswer_UR: 'خلیہ زندگی کی بنیادی اکائی ہے۔ اس میں نواۃ، سیٹوپلازم...', ImageURL: ''
    }
  },
  {
    sheet: 'Match Columns',
    cols: [...COMMON_COLS, 'Type',
      'Pair1_Left_EN', 'Pair1_Right_EN', 'Pair1_Left_UR', 'Pair1_Right_UR', 'Pair1_ImageURL',
      'Pair2_Left_EN', 'Pair2_Right_EN', 'Pair2_Left_UR', 'Pair2_Right_UR', 'Pair2_ImageURL',
      'Pair3_Left_EN', 'Pair3_Right_EN', 'Pair3_Left_UR', 'Pair3_Right_UR', 'Pair3_ImageURL',
      'Pair4_Left_EN', 'Pair4_Right_EN', 'Pair4_Left_UR', 'Pair4_Right_UR', 'Pair4_ImageURL',
      'Pair5_Left_EN', 'Pair5_Right_EN', 'Pair5_Left_UR', 'Pair5_Right_UR', 'Pair5_ImageURL'],
    sample: {
      Board: 'Punjab Board', Grade: 'Class 9', Subject: 'Biology', Chapter: 'Chapter 2', Topic: 'Cell',
      Difficulty: 'Easy', Marks: 5, Source: 'Textbook Exercise', Medium: 'Bilingual', Type: 'Match Columns',
      Pair1_Left_EN: 'Nucleus', Pair1_Right_EN: 'Controls cell activity', Pair1_Left_UR: 'نواۃ', Pair1_Right_UR: 'خلیے کی سرگرمی کنٹرول کرتا ہے', Pair1_ImageURL: '',
      Pair2_Left_EN: 'Mitochondria', Pair2_Right_EN: 'Energy production', Pair2_Left_UR: 'مائٹوکانڈریا', Pair2_Right_UR: 'توانائی پیدا کرتا ہے', Pair2_ImageURL: '',
      Pair3_Left_EN: 'Ribosome', Pair3_Right_EN: 'Protein synthesis', Pair3_Left_UR: 'رائیبوسوم', Pair3_Right_UR: 'پروٹین بناتا ہے', Pair3_ImageURL: '',
      Pair4_Left_EN: 'Chloroplast', Pair4_Right_EN: 'Photosynthesis', Pair4_Left_UR: 'کلوروپلاسٹ', Pair4_Right_UR: 'روشنی ترکیب', Pair4_ImageURL: '',
      Pair5_Left_EN: 'Cell wall', Pair5_Right_EN: 'Protection & support', Pair5_Left_UR: 'خلوی دیوار', Pair5_Right_UR: 'حفاظت اور سہارا', Pair5_ImageURL: '',
    }
  },
  {
    sheet: 'True-False',
    cols: [...COMMON_COLS, 'Type', 'QuestionText_EN', 'QuestionText_UR', 'CorrectAnswer'],
    sample: {
      Board: 'Punjab Board', Grade: 'Class 9', Subject: 'Biology', Chapter: 'Chapter 1', Topic: 'Introduction',
      Difficulty: 'Easy', Marks: 1, Source: 'Textbook Exercise', Medium: 'Bilingual', Type: 'True/False',
      QuestionText_EN: 'The cell is the basic unit of life.', QuestionText_UR: 'خلیہ زندگی کی بنیادی اکائی ہے۔', CorrectAnswer: 'True'
    }
  },
  {
    sheet: 'Fill in the Blanks',
    cols: [...COMMON_COLS, 'Type', 'QuestionText_EN', 'QuestionText_UR', 'CorrectAnswer'],
    sample: {
      Board: 'Punjab Board', Grade: 'Class 9', Subject: 'Biology', Chapter: 'Chapter 1', Topic: 'Introduction',
      Difficulty: 'Easy', Marks: 1, Source: 'Textbook Exercise', Medium: 'Bilingual', Type: 'Fill in the Blanks',
      QuestionText_EN: 'The ___ is the basic unit of life.', QuestionText_UR: '___ زندگی کی بنیادی اکائی ہے۔', CorrectAnswer: 'cell'
    }
  },
  {
    sheet: 'Definitions',
    cols: [...COMMON_COLS, 'Type', 'QuestionText_EN', 'QuestionText_UR', 'ModelAnswer_EN', 'ModelAnswer_UR'],
    sample: {
      Board: 'Punjab Board', Grade: 'Class 9', Subject: 'English', Chapter: 'Chapter 1', Topic: 'Vocabulary',
      Difficulty: 'Easy', Marks: 2, Source: 'Textbook Exercise', Medium: 'Bilingual', Type: 'Definitions',
      QuestionText_EN: 'Define "photosynthesis".', QuestionText_UR: '"فوٹوسنتھیسز" کی تعریف کریں۔',
      ModelAnswer_EN: 'Photosynthesis is the process by which plants make food using sunlight.',
      ModelAnswer_UR: 'فوٹوسنتھیسز وہ عمل ہے جس کے ذریعے پودے سورج کی روشنی سے غذا بناتے ہیں۔'
    }
  },
  {
    sheet: 'Spelling Check',
    cols: [...COMMON_COLS, 'Type', 'QuestionText_EN', 'QuestionText_UR', 'CorrectAnswer'],
    sample: {
      Board: 'Punjab Board', Grade: 'Class 5', Subject: 'English', Chapter: 'Unit 1', Topic: 'Spelling',
      Difficulty: 'Easy', Marks: 1, Source: 'Textbook Exercise', Medium: 'English', Type: 'Spelling Check',
      QuestionText_EN: 'Write the correct spelling: "recieve" or "receive"?', QuestionText_UR: '', CorrectAnswer: 'receive'
    }
  },
  {
    sheet: 'Missing Word',
    cols: [...COMMON_COLS, 'Type', 'QuestionText_EN', 'QuestionText_UR', 'CorrectAnswer'],
    sample: {
      Board: 'Punjab Board', Grade: 'Class 5', Subject: 'English', Chapter: 'Unit 1', Topic: 'Grammar',
      Difficulty: 'Easy', Marks: 1, Source: 'Textbook Exercise', Medium: 'Bilingual', Type: 'Missing Word',
      QuestionText_EN: 'She ___ (go) to school every day.', QuestionText_UR: '', CorrectAnswer: 'goes'
    }
  },
  {
    sheet: 'Comprehension',
    cols: [...COMMON_COLS, 'Type', 'QuestionText_EN', 'QuestionText_UR', 'ModelAnswer_EN', 'ModelAnswer_UR'],
    sample: {
      Board: 'Punjab Board', Grade: 'Class 8', Subject: 'English', Chapter: 'Unit 2', Topic: 'Reading',
      Difficulty: 'Medium', Marks: 5, Source: 'Textbook Exercise', Medium: 'English', Type: 'Comprehension',
      QuestionText_EN: 'Read the passage: "The sun is a star..." | Q: What is the sun?',
      QuestionText_UR: '', ModelAnswer_EN: 'The sun is a star.', ModelAnswer_UR: ''
    }
  },
  {
    sheet: 'Composition-Essay',
    cols: [...COMMON_COLS, 'Type', 'QuestionText_EN', 'QuestionText_UR', 'ModelAnswer_EN', 'ModelAnswer_UR'],
    sample: {
      Board: 'Punjab Board', Grade: 'Class 9', Subject: 'English', Chapter: 'Composition', Topic: 'Essay',
      Difficulty: 'Hard', Marks: 10, Source: 'Past Paper', Medium: 'English', Type: 'Composition / Essay',
      QuestionText_EN: 'Write an essay on "Importance of Education".',
      QuestionText_UR: '"تعلیم کی اہمیت" پر مضمون لکھیں۔', ModelAnswer_EN: 'Education is the backbone of society...', ModelAnswer_UR: 'تعلیم معاشرے کی ریڑھ کی ہڈی ہے...'
    }
  },
  {
    sheet: 'Translation',
    cols: [...COMMON_COLS, 'Type', 'QuestionText_EN', 'QuestionText_UR', 'ModelAnswer_EN', 'ModelAnswer_UR'],
    sample: {
      Board: 'Punjab Board', Grade: 'Class 9', Subject: 'English', Chapter: 'Translation', Topic: 'General',
      Difficulty: 'Medium', Marks: 5, Source: 'Past Paper', Medium: 'Bilingual', Type: 'Translation',
      QuestionText_EN: 'Translate into Urdu: "The sun rises in the east."',
      QuestionText_UR: 'انگریزی میں ترجمہ کریں: "سورج مشرق میں طلوع ہوتا ہے۔"',
      ModelAnswer_EN: '', ModelAnswer_UR: 'سورج مشرق میں طلوع ہوتا ہے۔'
    }
  },
  {
    sheet: 'Letter Writing',
    cols: [...COMMON_COLS, 'Type', 'QuestionText_EN', 'QuestionText_UR', 'ModelAnswer_EN', 'ModelAnswer_UR'],
    sample: {
      Board: 'Punjab Board', Grade: 'Class 9', Subject: 'English', Chapter: 'Letter Writing', Topic: 'Application',
      Difficulty: 'Medium', Marks: 10, Source: 'Past Paper', Medium: 'English', Type: 'Letter Writing',
      QuestionText_EN: 'Write an application to the principal for three days leave.',
      QuestionText_UR: 'پرنسپل کو تین دن کی چھٹی کے لیے درخواست لکھیں۔',
      ModelAnswer_EN: 'The Principal, ... Respected Sir, I beg to state...', ModelAnswer_UR: ''
    }
  },
  {
    sheet: 'Story-Paragraph',
    cols: [...COMMON_COLS, 'Type', 'QuestionText_EN', 'QuestionText_UR', 'ModelAnswer_EN', 'ModelAnswer_UR'],
    sample: {
      Board: 'Punjab Board', Grade: 'Class 7', Subject: 'English', Chapter: 'Creative Writing', Topic: 'Story',
      Difficulty: 'Medium', Marks: 8, Source: 'Textbook Exercise', Medium: 'English', Type: 'Story / Paragraph Writing',
      QuestionText_EN: 'Write a story with moral: "Honesty is the best policy".',
      QuestionText_UR: '"ایمانداری بہترین پالیسی ہے" اخلاق کے ساتھ ایک کہانی لکھیں۔',
      ModelAnswer_EN: 'Once upon a time, there lived an honest boy...', ModelAnswer_UR: ''
    }
  },
  {
    sheet: 'Direct-Indirect',
    cols: [...COMMON_COLS, 'Type', 'QuestionText_EN', 'QuestionText_UR', 'CorrectAnswer'],
    sample: {
      Board: 'Punjab Board', Grade: 'Class 9', Subject: 'English', Chapter: 'Grammar', Topic: 'Narration',
      Difficulty: 'Medium', Marks: 2, Source: 'Textbook Exercise', Medium: 'English', Type: 'Direct / Indirect Speech',
      QuestionText_EN: 'Change to Indirect: He said, "I am happy."', QuestionText_UR: '',
      CorrectAnswer: 'He said that he was happy.'
    }
  },
  {
    sheet: 'Active-Passive',
    cols: [...COMMON_COLS, 'Type', 'QuestionText_EN', 'QuestionText_UR', 'CorrectAnswer'],
    sample: {
      Board: 'Punjab Board', Grade: 'Class 9', Subject: 'English', Chapter: 'Grammar', Topic: 'Voice',
      Difficulty: 'Medium', Marks: 2, Source: 'Textbook Exercise', Medium: 'English', Type: 'Active / Passive Voice',
      QuestionText_EN: 'Change to Passive: "The boy kicked the ball."', QuestionText_UR: '',
      CorrectAnswer: 'The ball was kicked by the boy.'
    }
  },
  {
    sheet: 'Diagram Based',
    cols: [...COMMON_COLS, 'Type', 'QuestionText_EN', 'QuestionText_UR', 'ModelAnswer_EN', 'ModelAnswer_UR', 'ImageURL'],
    sample: {
      Board: 'Punjab Board', Grade: 'Class 9', Subject: 'Biology', Chapter: 'Chapter 2', Topic: 'Cell',
      Difficulty: 'Medium', Marks: 4, Source: 'Past Paper', Medium: 'Bilingual', Type: 'Diagram Based',
      QuestionText_EN: 'Draw and label the structure of a plant cell.',
      QuestionText_UR: 'پودے کے خلیے کی ساخت کا خاکہ بنائیں اور لیبل لگائیں۔',
      ModelAnswer_EN: 'Draw nucleus, cell wall, chloroplast, vacuole, mitochondria...', ModelAnswer_UR: '', ImageURL: ''
    }
  }
];

const wb = XLSX.utils.book_new();

// Sheet 1: Instructions
const instructions = [
  ['📘 PakTest Question Bank - Universal Import Template'],
  [''],
  ['HOW TO USE:'],
  ['1. Each sheet is a separate question type template'],
  ['2. Fill in your questions following the sample row (row 3)'],
  ['3. Delete the sample row before importing'],
  ['4. Required fields: Board, Grade, Subject, Type, QuestionText_EN (or QuestionText_UR)'],
  ['5. For Match Columns with images: put SVG URL or data:image/svg+xml... in Pair1_ImageURL column'],
  ['6. Medium: English / Urdu / Bilingual'],
  ['7. Difficulty: Easy / Medium / Hard'],
  [''],
  ['QUESTION TYPES AVAILABLE:'],
  ['Objective: MCQ, True/False, Fill in the Blanks, Match Columns'],
  ['Subjective: Short Answer, Long Answer, Diagram Based, Definitions'],
  ['Language Skills: Spelling Check, Missing Word, Comprehension, Composition/Essay, Translation, Letter Writing, Story/Paragraph Writing, Direct/Indirect Speech, Active/Passive Voice'],
  ['Custom: Any other type name you add in Curriculum > Question Types'],
];
const wsInstr = XLSX.utils.aoa_to_sheet(instructions);
XLSX.utils.book_append_sheet(wb, wsInstr, 'READ ME FIRST');

// Generate each type sheet
for (const template of QUESTION_TYPE_TEMPLATES) {
  const data = [template.cols, Object.values(template.sample)];
  const ws = XLSX.utils.aoa_to_sheet(data);
  // Set column widths
  ws['!cols'] = template.cols.map(c => ({ wch: Math.max(c.length + 4, 20) }));
  XLSX.utils.book_append_sheet(wb, ws, template.sheet);
}

const outPath = path.join(__dirname, '..', 'PakTest_AllTypes_Import_Template.xlsx');
XLSX.writeFile(wb, outPath);
console.log(`✅ Template created: ${outPath}`);
console.log(`   ${QUESTION_TYPE_TEMPLATES.length + 1} sheets (${QUESTION_TYPE_TEMPLATES.length} question types + instructions)`);
