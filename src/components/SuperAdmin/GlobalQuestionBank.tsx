
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  getQuestions, addQuestion, addQuestionsBulk, deleteQuestion, updateQuestion,
  getSyllabuses, getClasses, getSubjects, getChapters, getTopics,
  ensureCurriculumPath, uploadFile
} from '../../services/dataService';
import { 
  Search, Plus, Upload, X, Trash2, Sparkles, Languages, 
  FileSpreadsheet, Download, RefreshCw, CheckCircle, 
  HelpCircle, ChevronRight, Image as ImageIcon, ListFilter,
  BookOpen, GraduationCap, Library, Layers, FileText, CloudDownload,
  FileCode, Table, AlertCircle, FileUp, Info, CheckSquare, ChevronDown,
  Tag, List, ToggleLeft, FormInput, Database, FileCheck, Loader2, Eye, Filter, Edit2, Check, PenTool, FileDown
} from 'lucide-react';
import { Difficulty, Question, QuestionSource, QuestionType, MatchingPair, Syllabus, ClassLevel, Subject } from '../../types';
import { generateQuestionsAI, translateToUrdu } from '../../services/geminiService';
import MathRenderer from '../MathRenderer';
import * as XLSX from 'xlsx';
import { parseMhtmlToQuestions } from '../../utils/mhtmlParser';

const normalizeQuestionType = (type: string): string => {
  const t = (type || '').toLowerCase().trim();
  if (t.includes('mcq') || t.includes('multiple choice') || t.includes('multi choice') || t.includes('objective')) return QuestionType.MCQ;
  if (t.includes('short') || t === 'sq' || t === 'short answer') return QuestionType.SHORT;
  if (t.includes('long') || t === 'lq' || t === 'long answer') return QuestionType.LONG;
  if (t.includes('match') || t.includes('column')) return QuestionType.MATCH;
  if (t.includes('diagram')) return QuestionType.DIAGRAM;
  if (t.includes('blank') || t.includes('fill')) return QuestionType.FILL_BLANKS;
  if (t.includes('true') || t.includes('false')) return QuestionType.TRUE_FALSE;
  return type || QuestionType.SHORT; // Default
};

const GlobalQuestionBank: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isBilingualMode, setIsBilingualMode] = useState(true);
  const [viewLimit, setViewLimit] = useState<number | 'ALL'>(40);

  // Filters State
  const [filterSyllabus, setFilterSyllabus] = useState('All');
  const [filterClass, setFilterClass] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');
  const [filterType, setFilterType] = useState('All');
  const [filterDifficulty, setFilterDifficulty] = useState('All');

  // Curriculum Data
  const [syllabuses, setSyllabuses] = useState<Syllabus[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);

  /* Load data asynchronously on mount */
  const loadAllData = async () => {
    const [qs, syls, clss, subs, chs, tops] = await Promise.all([
      getQuestions({ pageSize: 1000, maxPages: 10 }),
      getSyllabuses(),
      getClasses(),
      getSubjects(),
      getChapters(),
      getTopics()
    ]);
    setQuestions(qs);
    setSyllabuses(syls);
    setClasses(clss);
    setSubjects(subs);
    setChapters(chs);
    setTopics(tops);
  };

  useEffect(() => { 
    loadAllData();
  }, []);

  // Modals & States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isSyncScreenOpen, setIsSyncScreenOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [isSequenceImportModalOpen, setIsSequenceImportModalOpen] = useState(false);
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [batchBoardOverride, setBatchBoardOverride] = useState<string>('');
  const [batchClassOverride, setBatchClassOverride] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sequenceFileInputRef = useRef<HTMLInputElement>(null);
  const diagramFileInputRef = useRef<HTMLInputElement>(null);

  // Form State
  const [formStep, setFormStep] = useState<'TYPE' | 'CONTENT'>('TYPE');
  const [isCustomType, setIsCustomType] = useState(false);
  // Custom Type specific state
  const [customFormat, setCustomFormat] = useState<'TEXT' | 'CHOICE'>('TEXT');

  const [newQuestion, setNewQuestion] = useState<Partial<Question>>({
     text: '', textUrdu: '', type: 'MCQ', difficulty: Difficulty.MEDIUM, marks: 1,
     subject: '', classLevel: '', topic: '', options: ['', '', '', ''],
     optionsUrdu: ['', '', '', ''], matchingPairs: [{left: '', right: '', leftUrdu: '', rightUrdu: ''}],
     sources: [QuestionSource.MODEL_PAPER], isCompulsory: true, imageUrl: '', correctAnswer: '', correctAnswerUrdu: ''
  });

  // Dependent dropdown selection IDs
  const [selSyllabusId, setSelSyllabusId] = useState('');
  const [selClassId, setSelClassId] = useState('');
  const [selSubjectId, setSelSubjectId] = useState('');
  const [selChapterId, setSelChapterId] = useState('');

  // Filtering Logic for Add Modal
  const filteredClasses = useMemo(() => classes.filter(c => c.syllabusId === selSyllabusId), [classes, selSyllabusId]);
  const filteredSubjects = useMemo(() => subjects.filter(s => s.classId === selClassId), [subjects, selClassId]);
  const filteredChapters = useMemo(() => chapters.filter(ch => ch.subjectId === selSubjectId), [chapters, selSubjectId]);
  const filteredTopics = useMemo(() => topics.filter(t => t.chapterId === selChapterId), [topics, selChapterId]);

  // Main Filtering Logic for List
  const filteredQuestions = useMemo(() => {
    return questions.filter(q => {
      const matchesSearch = q.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            (q.textUrdu && q.textUrdu.includes(searchTerm));
      
      let matchesSyllabus = true;
      if (filterSyllabus !== 'All') {
         // Find classes that belong to this syllabus
         const allowedClasses = classes.filter(c => c.syllabusId === filterSyllabus).map(c => c.name);
         // Check if the question's class matches any of those names
         matchesSyllabus = allowedClasses.includes(q.classLevel);
      }

      const matchesClass = filterClass === 'All' || q.classLevel === filterClass;
      const matchesSubject = filterSubject === 'All' || q.subject === filterSubject;
      const matchesType = filterType === 'All' || normalizeQuestionType(q.type) === normalizeQuestionType(filterType);
      const matchesDifficulty = filterDifficulty === 'All' || q.difficulty === filterDifficulty;

      return matchesSearch && matchesSyllabus && matchesClass && matchesSubject && matchesType && matchesDifficulty;
    });
  }, [questions, searchTerm, filterSyllabus, filterClass, filterSubject, filterType, filterDifficulty, classes]);

  const displayedQuestions = viewLimit === 'ALL' ? filteredQuestions : filteredQuestions.slice(0, viewLimit);

  // Dynamic Options for Filters
  const classOptions = useMemo(() => {
      if (filterSyllabus === 'All') return Array.from(new Set(classes.map(c => c.name)));
      return classes.filter(c => c.syllabusId === filterSyllabus).map(c => c.name);
  }, [classes, filterSyllabus]);

  const uniqueSubjects = Array.from(new Set(subjects.map(s => s.name)));

  const [isSmartImporting, setIsSmartImporting] = useState(false);

  const handleResetForm = () => {
    setNewQuestion({
        text: '', textUrdu: '', type: 'MCQ', difficulty: Difficulty.MEDIUM, marks: 1,
        subject: '', classLevel: '', topic: '', options: ['', '', '', ''],
        optionsUrdu: ['', '', '', ''], matchingPairs: [{left: '', right: '', leftUrdu: '', rightUrdu: ''}],
        sources: [QuestionSource.MODEL_PAPER], isCompulsory: true, imageUrl: '', correctAnswer: '', correctAnswerUrdu: ''
    });
    setSelSyllabusId('');
    setSelClassId('');
    setSelSubjectId('');
    setSelChapterId('');
    setEditingId(null);
    setFormStep('TYPE');
    setIsCustomType(false);
    setCustomFormat('TEXT');
  };

  const handleEditClick = (q: Question) => {
    setNewQuestion({ ...q });
    setEditingId(q.id);
    setFormStep('CONTENT');
    
    // Check if type is custom (not in default list)
    const defaults = ['MCQ', 'Short Answer', 'Long Answer', 'Match Columns', 'Diagram Based', 'True/False', 'Fill in the Blanks', 'Spelling Check'];
    if (!defaults.includes(q.type)) {
        setIsCustomType(true);
        // Determine format based on data
        if (q.options && q.options.length > 0) setCustomFormat('CHOICE');
        else setCustomFormat('TEXT');
    } else {
        setIsCustomType(false);
    }
    
    // Attempt to pre-fill dropdowns by finding IDs matching the names
    const cls = classes.find(c => c.name === q.classLevel);
    if (cls) {
        setSelClassId(cls.id);
        setSelSyllabusId(cls.syllabusId);
        
        const sub = subjects.find(s => s.name === q.subject && s.classId === cls.id);
        if (sub) {
            setSelSubjectId(sub.id);
            const ch = chapters.find(c => c.name === q.chapter && c.subjectId === sub.id);
            if (ch) setSelChapterId(ch.id);
        }
    }
    
    setIsAddModalOpen(true);
  };

  const clearFilters = () => {
    setFilterSyllabus('All');
    setFilterClass('All');
    setFilterSubject('All');
    setFilterType('All');
    setFilterDifficulty('All');
    setSearchTerm('');
  };

  const handleDiagramUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const url = await uploadFile(file);
        setNewQuestion(prev => ({ ...prev, imageUrl: url }));
      } catch(e) {
        alert("Upload failed.");
      }
    }
  };

  const handleTranslateAll = async () => {
    if (!newQuestion.text) return;
    const urdu = await translateToUrdu(newQuestion.text);
    setNewQuestion(prev => ({ ...prev, textUrdu: urdu }));
  };

  const handleSmartImport = async () => {
    if (!newQuestion.subject || !newQuestion.classLevel || !newQuestion.topic) {
        alert("Please select Subject, Class, and Topic first.");
        return;
    }
    setIsSmartImporting(true);
    try {
        const generated = await generateQuestionsAI(
            newQuestion.subject,
            newQuestion.topic,
            1,
            newQuestion.type || 'MCQ',
            newQuestion.difficulty || Difficulty.MEDIUM,
            newQuestion.classLevel,
            isBilingualMode
        );
        if (generated.length > 0) {
            const q = generated[0];
            setNewQuestion(prev => ({
                ...prev,
                text: q.text,
                textUrdu: q.textUrdu,
                options: q.options || prev.options,
                optionsUrdu: q.optionsUrdu || prev.optionsUrdu,
                correctAnswer: q.correctAnswer,
                marks: q.marks || prev.marks
            }));
        }
    } catch (e) {
        alert("AI Generation failed.");
    } finally {
        setIsSmartImporting(false);
    }
  };

  const handleSaveQuestion = async () => {
      if (!newQuestion.text || !newQuestion.subject || !newQuestion.classLevel || !newQuestion.type) {
          alert("Minimum requirements: Question Text, Type, Subject, and Class.");
          return;
      }
      
      const chapterName = chapters.find(c => c.id === selChapterId)?.name || newQuestion.chapter || 'General';
      const questionData: Question = {
          ...newQuestion,
          type: normalizeQuestionType(newQuestion.type),
          chapter: chapterName,
          source: newQuestion.sources?.[0] || QuestionSource.MODEL_PAPER,
          medium: (newQuestion.text && newQuestion.textUrdu && newQuestion.text !== newQuestion.textUrdu) ? 'Bilingual' : newQuestion.textUrdu ? 'Urdu' : 'English'
      } as Question;

      try {
          if (editingId) {
              questionData.id = editingId;
              await updateQuestion(questionData);
          } else {
              await addQuestion(questionData);
          }
          
          await loadAllData();
          setIsAddModalOpen(false);
          handleResetForm();
      } catch (e: any) {
          alert(e?.message || 'Failed to save question');
      }
  };

  // --- CSV/EXCEL PARSING & SYNC LOGIC ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.toLowerCase();

    // Check if it's an MHTML / MHT file
    if (ext.endsWith('.mht') || ext.endsWith('.mhtml')) {
      const reader = new FileReader();
      reader.readAsText(file, 'utf-8');

      reader.onload = (event) => {
        try {
          const rawText = event.target?.result as string;
          if (!rawText) return;

          // Determine current selected metadata (only if selected by user, else leave empty for auto-detection)
          const explicitBoard = selSyllabusId ? getSyllabusName(selSyllabusId) : '';
          const explicitGrade = selClassId ? getClassName(selClassId) : '';
          const explicitSubject = selSubjectId ? getSubjectName(selSubjectId) : '';

          const parsedQuestions = parseMhtmlToQuestions(rawText, {
            board: (explicitBoard && explicitBoard !== 'N/A') ? explicitBoard : undefined,
            grade: (explicitGrade && explicitGrade !== 'N/A') ? explicitGrade : undefined,
            subject: (explicitSubject && explicitSubject !== 'N/A') ? explicitSubject : undefined
          });

          if (parsedQuestions.length === 0) {
            alert("No question records were found in the uploaded MHTML file.");
            return;
          }

          setImportRows(parsedQuestions);
          setIsImportModalOpen(false);
          setIsSequenceImportModalOpen(false);
          setIsSyncScreenOpen(true);
        } catch (mhtmlErr) {
          console.error("MHTML Parsing error:", mhtmlErr);
          alert("Failed to parse MHTML file. Please ensure it is a valid web archive file.");
        }
      };

      if (e.target) e.target.value = '';
      return;
    }

    // Standard Excel / CSV file handling
    const reader = new FileReader();
    
    // Use ArrayBuffer to properly handle both CSV (via library) and Excel binary formats
    reader.readAsArrayBuffer(file);

    reader.onload = (event) => {
      const data = event.target?.result;
      if (!data) return;

      try {
        const workbook = XLSX.read(data, { type: 'array' });
        // Assume data is in the first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Use sheet_to_json to parse. defval: '' ensures empty cells come as empty strings
        const jsonData = XLSX.utils.sheet_to_json(sheet, { defval: '' });

        setImportRows(jsonData);
        setIsImportModalOpen(false);
        setIsSequenceImportModalOpen(false);
        setIsSyncScreenOpen(true);
      } catch (err) {
        console.error("Import Error:", err);
        alert("Failed to parse file. Please ensure it is a valid Excel (.xlsx), CSV (.csv), or MHTML (.mht) file.");
      }
    };
    
    // Reset file input for next use
    if (e.target) e.target.value = '';
  };

  const handleJsonImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const questionsToImport = Array.isArray(json) ? json : [json];
        
        // Ensure every question has necessary fields for the DB
        const prepared = questionsToImport.map(q => ({
          ...q,
          id: q.id || `q_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`,
          // Mirror missing language so single-language JSON imports still render in Urdu-only/English-only views
          text: (q.text || q.textUrdu || ''),
          textUrdu: (q.textUrdu || q.text || ''),
          source: q.source || QuestionSource.MODEL_PAPER,
          medium: q.medium || (q.text && q.textUrdu ? 'Bilingual' : q.textUrdu ? 'Urdu' : 'English'),
          difficulty: q.difficulty || Difficulty.MEDIUM,
          marks: q.marks || 1,
          // Mirror missing options for MCQs
          options: q.type === 'MCQ' ? ((Array.isArray(q.options) && q.options.length) ? q.options : (Array.isArray(q.optionsUrdu) ? q.optionsUrdu : [])) : q.options,
          optionsUrdu: q.type === 'MCQ' ? ((Array.isArray(q.optionsUrdu) && q.optionsUrdu.length) ? q.optionsUrdu : (Array.isArray(q.options) ? q.options : [])) : q.optionsUrdu
        }));

        const res = await addQuestionsBulk(prepared as any);
        const imported = res?.imported ?? prepared.length;
        const skipped = res?.skipped ?? 0;
        const failed = res?.failed ?? 0;
        const errCount = Array.isArray(res?.errors) ? res.errors.length : 0;
        const sampleErrors = Array.isArray(res?.errors) ? res.errors.slice(0, 3) : [];
        const sampleText = sampleErrors.length
          ? `\n\nExamples:\n${sampleErrors.map((e: any) => `Row ${e.index ?? '?'}: ${(e.errors || []).join('; ')}`).join('\n')}`
          : '';
        alert(`Import Complete: imported ${imported}, skipped ${skipped}, failed ${failed}${errCount ? ` (see console for ${errCount} errors)` : ''}.${sampleText}`);
        if (errCount) console.error('Question import errors:', res.errors);
        loadAllData();
      } catch (err) {
        console.error("JSON Import Error:", err);
        alert("Invalid JSON format. The file must be a JSON array or object matching the Question schema.");
      }
    };
    reader.readAsText(file);
  };


  const executeSynchronization = async () => {
    if (importRows.length === 0) return;
    setIsSyncing(true);
    setSyncProgress(0);
    
    const finalQuestions: Question[] = [];
    const pathCache: Record<string, any> = {};

    for (let i = 0; i < importRows.length; i++) {
      const row = importRows[i];
      const board = row.Board || (batchBoardOverride && batchBoardOverride !== '__AUTO__' ? batchBoardOverride : undefined) || getSyllabusName(selSyllabusId) || 'General';
      const grade = String(row.Grade || (batchClassOverride && batchClassOverride !== '__AUTO__' ? batchClassOverride : undefined) || getClassName(selClassId) || 'General');
      const subject = row.Subject || getSubjectName(selSubjectId) || 'General';
      const chapter = row.Chapter || getChapterName(selChapterId) || 'General';
      const topic = row.Topic || newQuestion.topic || 'General';

      const pathKey = `${board}|${grade}|${subject}|${chapter}|${topic}`.toLowerCase();
      let path;

      try {
        if (pathCache[pathKey]) {
            path = pathCache[pathKey];
        } else {
            const pathRes = await ensureCurriculumPath({ board, grade, subject, chapter, topic });
            path = pathRes.path || { 
                subject: { name: subject },
                class: { name: grade },
                chapter: { name: chapter }
            };
            pathCache[pathKey] = path;
        }

        const text = (row.QuestionText_EN || row.Question || '').trim();
        const textUrdu = (row.QuestionText_UR || row.QuestionUrdu || '').trim();
        const type = normalizeQuestionType(row.Type || 'MCQ');
        
        // Prevent duplicate questions in same batch
        if (finalQuestions.some(fq => fq.text === text && fq.textUrdu === textUrdu && fq.text !== '')) {
            continue;
        }

        const options = [row.OptionA_EN, row.OptionB_EN, row.OptionC_EN, row.OptionD_EN].map(o => String(o || '')).filter(Boolean);
        const optionsUrdu = [row.OptionA_UR, row.OptionB_UR, row.OptionC_UR, row.OptionD_UR].map(o => String(o || '')).filter(Boolean);

        // Validation: Must have at least one question text
        if (!text && !textUrdu) {
            console.warn(`Skipping row ${i}: Missing question text.`);
            continue;
        }

        // Validation: MCQs must have options
        if (type === 'MCQ' && options.length === 0 && optionsUrdu.length === 0) {
            console.warn(`Skipping row ${i}: MCQ missing options.`);
            continue;
        }

        const q: Question = {
            id: `bulk_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 5)}`,
            text: text || textUrdu,
            textUrdu: textUrdu || text,
            type: type,
            marks: parseInt(row.Marks) || 1,
            difficulty: (row.Difficulty || Difficulty.MEDIUM) as Difficulty,
            subject: path.subject.name,
            classLevel: path.grade || (path.class ? path.class.name : grade),
            topic: topic,
            chapter: path.chapter.name,
            imageUrl: row.ImageURL || '',
            correctAnswer: String(row.CorrectAnswer_Letter || row.CorrectAnswer || ''),
            sources: row.Sources ? String(row.Sources).split('|') : [QuestionSource.MODEL_PAPER],
            source: row.Sources ? String(row.Sources).split('|')[0] : QuestionSource.MODEL_PAPER,
            options: (type === 'MCQ' && options.length === 0 && optionsUrdu.length > 0) ? [...optionsUrdu] : options,
            optionsUrdu: (type === 'MCQ' && optionsUrdu.length === 0 && options.length > 0) ? [...options] : optionsUrdu,
            medium: (text && textUrdu && text !== textUrdu) ? 'Bilingual' : textUrdu ? 'Urdu' : 'English'
        } as Question;

        finalQuestions.push(q);
        setSyncProgress(Math.round(((i + 1) / importRows.length) * 100));
      } catch (err) {
        console.error(`Failed to sync row ${i}:`, err);
      }
    }

     if (finalQuestions.length > 0) {
         const res = await addQuestionsBulk(finalQuestions);
         const imported = res?.imported ?? finalQuestions.length;
         const skipped = res?.skipped ?? 0;
         const failed = res?.failed ?? 0;
         const errCount = Array.isArray(res?.errors) ? res.errors.length : 0;
         await loadAllData();
         const sampleErrors = Array.isArray(res?.errors) ? res.errors.slice(0, 3) : [];
         const sampleText = sampleErrors.length
           ? `\n\nExamples:\n${sampleErrors.map((e: any) => `Row ${e.index ?? '?'}: ${(e.errors || []).join('; ')}`).join('\n')}`
           : '';
         alert(`Synchronization Complete: imported ${imported}, skipped ${skipped}, failed ${failed}${errCount ? ` (see console for ${errCount} errors)` : ''}.${sampleText}`);
         if (errCount) console.error('Question import errors:', res.errors);
     } else {
         alert("No valid questions were processed during synchronization.");
     }

    setIsSyncing(false);
    setIsSyncScreenOpen(false);
    setIsAddModalOpen(false);
    handleResetForm();
  };

  const getSyllabusName = (id: string) => syllabuses.find(s => s.id === id)?.name || 'N/A';
  const getClassName = (id: string) => classes.find(c => c.id === id)?.name || 'N/A';
  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'N/A';
  const getChapterName = (id: string) => chapters.find(ch => ch.id === id)?.name || 'N/A';

  // --- EXPORT FUNCTIONALITY ---
  const handleExport = () => {
    const data = filteredQuestions.map(q => {
      const row: any = {
        Board: syllabuses.find(s => classes.find(c => c.name === q.classLevel)?.syllabusId === s.id)?.name || 'Unknown',
        Grade: q.classLevel,
        Subject: q.subject,
        Chapter: q.chapter,
        Topic: q.topic,
        QuestionText_EN: q.text,
        QuestionText_UR: q.textUrdu || '',
        Type: q.type,
        Marks: q.marks,
        Difficulty: q.difficulty,
        ImageURL: q.imageUrl || '',
        Sources: q.sources?.join('|') || '',
        CorrectAnswer: q.correctAnswer || ''
      };

      if (q.type === 'MCQ' && q.options) {
          row.OptionA_EN = q.options[0] || '';
          row.OptionB_EN = q.options[1] || '';
          row.OptionC_EN = q.options[2] || '';
          row.OptionD_EN = q.options[3] || '';
          if (q.optionsUrdu) {
              row.OptionA_UR = q.optionsUrdu[0] || '';
              row.OptionB_UR = q.optionsUrdu[1] || '';
              row.OptionC_UR = q.optionsUrdu[2] || '';
              row.OptionD_UR = q.optionsUrdu[3] || '';
          }
      }

      if (q.type === 'Match Columns' && q.matchingPairs) {
          q.matchingPairs.forEach((p, i) => {
              row[`Pair${i+1}_Left_EN`] = p.left;
              row[`Pair${i+1}_Right_EN`] = p.right;
              row[`Pair${i+1}_Left_UR`] = p.leftUrdu || '';
              row[`Pair${i+1}_Right_UR`] = p.rightUrdu || '';
          });
      }

      // Truncate fields to avoid Excel limit (32767 chars)
      Object.keys(row).forEach(key => {
          if (typeof row[key] === 'string' && row[key].length > 32000) {
              row[key] = row[key].substring(0, 32000) + '... [TRUNCATED]';
          }
      });

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Questions");
    XLSX.writeFile(wb, `PakParcha_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // --- COMPREHENSIVE SAMPLE QUESTION DATASETS FOR TEMPLATES ---
  const getSampleQuestionsData = (filterType?: string, contextualBoard?: string, contextualGrade?: string, contextualSubject?: string) => {
    const defaultBoard = contextualBoard || "Punjab Board (PCTB)";
    const defaultGrade = contextualGrade || "Class 9";

    const allQuestions = [
      // --- MATHEMATICS EXAMPLES ---
      {
        Board: defaultBoard,
        Grade: contextualGrade || "Class 10",
        Subject: contextualSubject || "Mathematics",
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
        Grade: contextualGrade || "Class 9",
        Subject: contextualSubject || "Mathematics",
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
        Grade: contextualGrade || "Class 10",
        Subject: contextualSubject || "Mathematics",
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
        Grade: contextualGrade || "Class 9",
        Subject: contextualSubject || "Mathematics",
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
        Grade: contextualGrade || "Class 9",
        Subject: contextualSubject || "Chemistry",
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
        Grade: contextualGrade || "Class 11",
        Subject: contextualSubject || "Chemistry",
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
        Grade: contextualGrade || "Class 9",
        Subject: contextualSubject || "Chemistry",
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
        Grade: contextualGrade || "Class 10",
        Subject: contextualSubject || "Chemistry",
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
        Grade: contextualGrade || "Class 9",
        Subject: contextualSubject || "Physics",
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
        Grade: contextualGrade || "Class 10",
        Subject: contextualSubject || "Physics",
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
        Grade: contextualGrade || "Class 9",
        Subject: contextualSubject || "Biology",
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
        Grade: contextualGrade || "Class 9",
        Subject: contextualSubject || "Chemistry",
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
        Grade: contextualGrade || "Class 9",
        Subject: contextualSubject || "Physics",
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
        Grade: contextualGrade || "Class 10",
        Subject: contextualSubject || "Mathematics",
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

    if (!filterType || filterType === 'ALL' || filterType === 'Master Complete') {
      return allQuestions;
    }

    const norm = normalizeQuestionType(filterType);
    return allQuestions.filter(q => normalizeQuestionType(q.Type) === norm);
  };

  const downloadTemplate = (format: 'CSV' | 'XLSX', type: string, contextual: boolean = false) => {
     const board = getSyllabusName(selSyllabusId);
     const grade = getClassName(selClassId);
     const subject = getSubjectName(selSubjectId);
     
     const isAll = (type === 'ALL' || type === 'Master Complete');
     const sampleRows = getSampleQuestionsData(
        isAll ? 'ALL' : type, 
        contextual && board !== 'N/A' ? board : undefined,
        contextual && grade !== 'N/A' ? grade : undefined,
        contextual && subject !== 'N/A' ? subject : undefined
     );

     const filename = isAll 
        ? `PakParcha_Master_Question_Template_All_Subjects`
        : contextual 
           ? `Template_${type.replace(/\s+/g, '_')}_${board}_${grade}`
           : `Master_Template_${type.replace(/\s+/g, '_')}`;

     if (format === 'CSV') {
         const ws = XLSX.utils.json_to_sheet(sampleRows);
         const csv = XLSX.utils.sheet_to_csv(ws);
         const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `${filename}.csv`;
         a.click();
     } else {
         const wb = XLSX.utils.book_new();

         if (isAll) {
             // 1. All Question Examples
             const wsAll = XLSX.utils.json_to_sheet(sampleRows);
             XLSX.utils.book_append_sheet(wb, wsAll, "All_Question_Examples");

             // 2. Mathematics Sheet
             const mathRows = sampleRows.filter(r => r.Subject === "Mathematics");
             if (mathRows.length) {
                 const wsMath = XLSX.utils.json_to_sheet(mathRows);
                 XLSX.utils.book_append_sheet(wb, wsMath, "Mathematics_Examples");
             }

             // 3. Chemistry Sheet
             const chemRows = sampleRows.filter(r => r.Subject === "Chemistry");
             if (chemRows.length) {
                 const wsChem = XLSX.utils.json_to_sheet(chemRows);
                 XLSX.utils.book_append_sheet(wb, wsChem, "Chemistry_Examples");
             }

             // 4. Physics Sheet
             const physRows = sampleRows.filter(r => r.Subject === "Physics");
             if (physRows.length) {
                 const wsPhys = XLSX.utils.json_to_sheet(physRows);
                 XLSX.utils.book_append_sheet(wb, wsPhys, "Physics_Examples");
             }

             // 5. Biology Sheet
             const bioRows = sampleRows.filter(r => r.Subject === "Biology");
             if (bioRows.length) {
                 const wsBio = XLSX.utils.json_to_sheet(bioRows);
                 XLSX.utils.book_append_sheet(wb, wsBio, "Biology_Examples");
             }

             // 6. Formatting Instructions Guide Sheet
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
             const wsGuide = XLSX.utils.json_to_sheet(guideRows);
             XLSX.utils.book_append_sheet(wb, wsGuide, "Instructions_Guide");
         } else {
             const ws = XLSX.utils.json_to_sheet(sampleRows);
             XLSX.utils.book_append_sheet(wb, ws, `${type.replace(/\s+/g, '_')}_Template`);
         }

         XLSX.writeFile(wb, `${filename}.xlsx`);
     }
  };

  const handleToggleSource = (source: string) => {
    const current = newQuestion.sources || [];
    if (current.includes(source)) {
        setNewQuestion({...newQuestion, sources: current.filter(s => s !== source)});
    } else {
        setNewQuestion({...newQuestion, sources: [...current, source]});
    }
  };

  const questionTypesList = [
     { id: 'MCQ', label: 'Multiple Choice', icon: ListFilter, color: 'text-indigo-600' },
     { id: 'Short Answer', label: 'Short Answer', icon: FileText, color: 'text-emerald-600' },
     { id: 'Long Answer', label: 'Long Answer', icon: FileCode, color: 'text-blue-600' },
     { id: 'Match Columns', label: 'Match Columns', icon: Layers, color: 'text-amber-600' },
     { id: 'Diagram Based', label: 'Diagram Based', icon: ImageIcon, color: 'text-purple-600' },
     { id: 'True/False', label: 'True / False', icon: ToggleLeft, color: 'text-rose-600' },
     { id: 'Fill in the Blanks', label: 'Fill in Blanks', icon: FormInput, color: 'text-cyan-600' },
     { id: 'Spelling Check', label: 'Spelling Check', icon: CheckCircle, color: 'text-teal-600' },
     { id: 'Custom', label: 'Other / Custom', icon: PenTool, color: 'text-slate-600' }, 
  ];

  // Options Builder (Reusable)
  const renderOptionsBuilder = () => (
    <div className="space-y-6 pt-6 border-t border-slate-100">
        <div className="flex justify-between items-center">
            <h5 className="font-bold text-slate-800 text-sm uppercase tracking-widest">Options Builder</h5>
            <div className="flex gap-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase">English (Click Letter to Select Correct)</span>
            {isBilingualMode && <span className="text-[10px] font-bold text-indigo-400 uppercase">Urdu</span>}
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
            {newQuestion.options?.map((opt, i) => (
                <div key={i} className="flex items-center gap-3">
                    <button 
                    onClick={() => setNewQuestion({
                        ...newQuestion, 
                        correctAnswer: opt,
                        correctAnswerUrdu: newQuestion.optionsUrdu?.[i] || ''
                    })}
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border transition-all ${
                        newQuestion.correctAnswer === opt && opt !== '' 
                        ? 'bg-green-500 text-white border-green-600 shadow-md ring-2 ring-green-200' 
                        : 'bg-slate-100 text-slate-400 border-slate-200 hover:bg-slate-200'
                    }`}
                    title="Mark as Correct Answer"
                    >
                    {newQuestion.correctAnswer === opt && opt !== '' ? <Check size={14} strokeWidth={4} /> : String.fromCharCode(65+i)}
                    </button>
                    <input 
                    value={opt} 
                    onChange={e => {
                        const val = e.target.value;
                        const opts = [...(newQuestion.options || [])];
                        const oldVal = opts[i];
                        opts[i] = val;
                        
                        // Sync correct answer if it was selected
                        let updates: any = { options: opts };
                        if (newQuestion.correctAnswer === oldVal) {
                            updates.correctAnswer = val;
                        }
                        setNewQuestion({...newQuestion, ...updates});
                    }} 
                    className={`flex-1 border p-3 rounded-xl text-sm outline-none transition-all ${
                        newQuestion.correctAnswer === opt && opt !== '' 
                        ? 'border-green-500 ring-1 ring-green-500 bg-green-50/20' 
                        : 'border-slate-200 focus:border-indigo-500'
                    }`} 
                    placeholder={`Option ${String.fromCharCode(65+i)}`} 
                    />
                </div>
            ))}
            </div>
            {isBilingualMode && (
            <div className="space-y-3">
                {newQuestion.optionsUrdu?.map((opt, i) => (
                    <div key={i} className="flex items-center gap-3">
                        <input 
                        dir="rtl" 
                        value={opt} 
                        onChange={e => {
                            const val = e.target.value;
                            const opts = [...(newQuestion.optionsUrdu || [])];
                            const oldVal = opts[i];
                            opts[i] = val;

                            // Sync Urdu correct answer if English counterpart is selected
                            let updates: any = { optionsUrdu: opts };
                            if (newQuestion.options && newQuestion.correctAnswer === newQuestion.options[i]) {
                                updates.correctAnswerUrdu = val;
                            }
                            setNewQuestion({...newQuestion, ...updates});
                        }} 
                        className={`flex-1 border p-3 rounded-xl font-urdu text-xl text-right outline-none transition-all ${
                            (newQuestion.options && newQuestion.correctAnswer === newQuestion.options[i])
                            ? 'border-green-500 bg-green-50/10'
                            : 'border-indigo-50 focus:border-indigo-300'
                        }`} 
                        placeholder="آپشن لکھیں" 
                        />
                        <span className={`w-8 h-8 rounded-xl flex items-center justify-center text-xs font-bold shrink-0 border ${
                            (newQuestion.options && newQuestion.correctAnswer === newQuestion.options[i])
                            ? 'bg-green-100 text-green-700 border-green-200'
                            : 'bg-indigo-50 text-indigo-400 border-indigo-100'
                        }`}>
                        {String.fromCharCode(65+i)}
                        </span>
                    </div>
                ))}
            </div>
            )}
        </div>
    </div>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Global Question Bank</h1>
          <p className="text-sm text-gray-500 mt-1">Enterprise-grade academic content repository</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setIsImportModalOpen(true)} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
            <Upload size={16} /> Global Import
          </button>
          <button 
             onClick={() => document.getElementById('json-import-input')?.click()}
             className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2"
          >
            <FileCode size={16} className="text-amber-500" /> JSON Import
          </button>
          <input 
             id="json-import-input" 
             type="file" 
             accept=".json" 
             className="hidden" 
             onChange={handleJsonImport} 
          />
          <button onClick={handleExport} className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 flex items-center gap-2">
            <FileDown size={16} /> Export List
          </button>
          <button onClick={() => { handleResetForm(); setIsAddModalOpen(true); }} className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 flex items-center gap-2 shadow-sm">
            <Plus size={16} /> Add Question
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
        {/* Filters Toolbar */}
        <div className="p-4 border-b border-gray-200 bg-gray-50/50 space-y-4">
           {/* Row 1: Search & View Limit */}
           <div className="flex flex-col md:flex-row items-center gap-4">
              <div className="relative flex-1 max-w-md w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="text" 
                  placeholder="Filter repository..." 
                  className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-white" 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)} 
                />
              </div>
              
              <div className="flex items-center gap-2 w-full md:w-auto">
                 <span className="text-xs font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">View:</span>
                 <select 
                   className="px-3 py-2 border border-gray-300 rounded-lg text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                   value={viewLimit}
                   onChange={(e) => setViewLimit(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                 >
                   <option value={40}>40 Items</option>
                   <option value={80}>80 Items</option>
                   <option value={120}>120 Items</option>
                   <option value="ALL">Show All</option>
                 </select>
              </div>
           </div>

           {/* Row 2: Categorical Filters */}
           <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-widest mr-2">
                 <Filter size={14} /> Filters
              </div>
              
              <select 
                 className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium outline-none bg-white focus:border-indigo-500"
                 value={filterSyllabus}
                 onChange={(e) => {
                    setFilterSyllabus(e.target.value);
                    setFilterClass('All'); // Reset class when board changes
                 }}
              >
                 <option value="All">All Boards</option>
                 {syllabuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>

              <select 
                 className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium outline-none bg-white focus:border-indigo-500"
                 value={filterClass}
                 onChange={(e) => setFilterClass(e.target.value)}
              >
                 <option value="All">All Grades</option>
                 {classOptions.map(c => <option key={c} value={c}>{c}</option>)}
              </select>

              <select 
                 className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium outline-none bg-white focus:border-indigo-500"
                 value={filterSubject}
                 onChange={(e) => setFilterSubject(e.target.value)}
              >
                 <option value="All">All Subjects</option>
                 {uniqueSubjects.map(s => <option key={s} value={s}>{s}</option>)}
              </select>

              <select 
                 className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium outline-none bg-white focus:border-indigo-500"
                 value={filterType}
                 onChange={(e) => setFilterType(e.target.value)}
              >
                 <option value="All">All Types</option>
                 {/* Dynamically populate this from available types if needed, for now using static list minus Custom */}
                 {questionTypesList.filter(t => t.id !== 'Custom').map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
              </select>

              <select 
                 className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-medium outline-none bg-white focus:border-indigo-500"
                 value={filterDifficulty}
                 onChange={(e) => setFilterDifficulty(e.target.value)}
              >
                 <option value="All">All Difficulty</option>
                 {Object.values(Difficulty).map(d => <option key={d} value={d}>{d}</option>)}
              </select>

              {(filterSyllabus !== 'All' || filterClass !== 'All' || filterSubject !== 'All' || filterType !== 'All' || filterDifficulty !== 'All' || searchTerm) && (
                 <button 
                    onClick={clearFilters}
                    className="px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1"
                 >
                    <X size={12} /> Clear
                 </button>
              )}
           </div>
        </div>
        
        <div className="divide-y divide-gray-100 flex-1">
           {displayedQuestions.map(q => (
             <div key={q.id} className="p-4 hover:bg-gray-50 flex gap-4 items-start group">
                <div className="flex-1">
                   <div className="flex flex-wrap gap-2 mb-2">
                      <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold uppercase">{q.subject}</span>
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-bold uppercase">{q.classLevel}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${q.difficulty === Difficulty.HARD ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{q.difficulty}</span>
                      <span className="px-2 py-0.5 bg-orange-50 text-orange-700 rounded text-[10px] font-bold uppercase">{q.type}</span>
                      {q.sources?.map(s => (
                        <span key={s} className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[10px] font-bold uppercase">{s}</span>
                      ))}
                   </div>
                   <MathRenderer text={q.text} className="text-sm font-medium text-gray-900" />
                   {q.textUrdu && <div className="text-base font-urdu text-gray-600 mt-1 leading-relaxed" dir="rtl"><MathRenderer text={q.textUrdu} /></div>}
                   
                   {/* Correct Answer Display for Non-MCQ */}
                   {q.type !== 'MCQ' && (q.correctAnswer || q.correctAnswerUrdu) && (
                      <div className="mt-2 text-xs text-green-700 bg-green-50/50 p-2 rounded border border-green-100">
                         <span className="font-bold uppercase tracking-wider text-[10px]">Model Answer:</span>
                         <div className="mt-1">
                            {q.correctAnswer && <MathRenderer text={q.correctAnswer} />}
                            {q.correctAnswerUrdu && <div dir="rtl" className="font-urdu text-right"><MathRenderer text={q.correctAnswerUrdu} /></div>}
                         </div>
                      </div>
                   )}
                   {/* Correct Answer Indication for MCQ */}
                   {q.type === 'MCQ' && q.correctAnswer && (
                      <div className="mt-2 text-xs text-green-700 font-bold flex items-center gap-1">
                         <CheckCircle size={12}/> Correct: {q.correctAnswer}
                      </div>
                   )}
                </div>
                <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleEditClick(q)} className="p-2 text-indigo-400 hover:bg-indigo-50 rounded transition-all"><Edit2 size={16} /></button>
                    <button onClick={async () => { await deleteQuestion(q.id); await loadAllData(); }} className="p-2 text-red-400 hover:bg-red-50 rounded transition-all"><Trash2 size={16} /></button>
                </div>
             </div>
           ))}
           {displayedQuestions.length === 0 && (
              <div className="p-12 text-center text-gray-400 flex flex-col items-center">
                 <Search size={48} className="opacity-20 mb-4" />
                 <p className="text-sm">No questions found matching your criteria.</p>
                 <button onClick={clearFilters} className="text-xs text-indigo-600 font-bold mt-2 hover:underline">Clear all filters</button>
              </div>
           )}
        </div>
        
        <div className="p-3 border-t border-gray-100 bg-gray-50 flex justify-between items-center text-xs text-gray-500 font-medium">
           <span>Showing {displayedQuestions.length} of {filteredQuestions.length} questions</span>
           {viewLimit !== 'ALL' && filteredQuestions.length > (typeof viewLimit === 'number' ? viewLimit : 0) && (
              <button onClick={() => setViewLimit('ALL')} className="text-indigo-600 hover:underline">View All</button>
           )}
        </div>
      </div>

      {/* Global Import Modal */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[92vh]">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                 <div>
                    <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2"><FileSpreadsheet size={20} className="text-indigo-600"/> Global Bulk Question Import</h3>
                    <p className="text-xs text-gray-500 mt-0.5">Download pre-filled templates with Math, Chemistry, Physics & Biology examples, or upload your file.</p>
                 </div>
                 <button onClick={() => setIsImportModalOpen(false)} className="p-1.5 hover:bg-gray-200 rounded-lg transition-colors"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-6 overflow-y-auto">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2"><Download size={16} className="text-indigo-600" /> 1. Download Master Templates</h4>
                       
                       {/* Featured All-in-One Master Template */}
                       <div className="p-3.5 bg-gradient-to-br from-indigo-50 via-purple-50 to-blue-50 border-2 border-indigo-200 rounded-xl shadow-sm">
                          <div className="flex items-start justify-between gap-2 mb-2">
                             <div>
                                <span className="text-xs font-black text-indigo-950 uppercase tracking-tight flex items-center gap-1.5">
                                   ⭐ Master Global Template (All Subjects)
                                </span>
                                <p className="text-[10px] text-indigo-700 mt-0.5 font-medium leading-relaxed">
                                   Includes real examples of <strong>Math</strong> (Matrices, Quadratic, Trig), <strong>Chemistry</strong> (Reactions, Moles, Bonds), <strong>Physics</strong> & <strong>Biology</strong>.
                                </p>
                             </div>
                          </div>
                          <div className="flex gap-2 mt-3">
                             <button 
                                onClick={() => downloadTemplate('XLSX', 'ALL')} 
                                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all"
                             >
                                <Download size={13} /> Excel (.xlsx) Multi-Tab
                             </button>
                             <button 
                                onClick={() => downloadTemplate('CSV', 'ALL')} 
                                className="flex items-center justify-center gap-1.5 py-2 px-3 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-bold transition-all"
                             >
                                <Download size={13} /> CSV
                             </button>
                          </div>
                       </div>

                       <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider pt-1">Or Download Single Question Type Template:</p>
                       <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                            {[
                               { type: 'MCQ', label: 'Multiple Choice (MCQ)', sub: 'With Math & Chemistry Options' },
                               { type: 'Short Answer', label: 'Short Answer Questions', sub: 'Math Proofs & Chemistry Gas Laws' },
                               { type: 'Long Answer', label: 'Long Answer Questions', sub: 'Cramer\'s Rule & Mass Action Derivation' },
                               { type: 'Match Columns', label: 'Match Columns', sub: 'Acid-Source & Biology Organelle Pairs' },
                               { type: 'True/False', label: 'True / False', sub: 'Physics & General Science Facts' },
                               { type: 'Fill in the Blanks', label: 'Fill in Blanks', sub: 'Math Sets & Chemical Formulas' },
                            ].map(item => (
                                <div key={item.type} className="flex items-center justify-between p-2.5 border border-gray-200 rounded-lg hover:border-indigo-200 hover:bg-gray-50/80 transition-all text-left">
                                    <div className="flex items-center gap-2.5">
                                       <CheckSquare className="text-indigo-600 shrink-0" size={16} />
                                       <div>
                                          <span className="text-xs font-bold text-gray-900 block">{item.label}</span>
                                          <span className="text-[10px] text-gray-400 block">{item.sub}</span>
                                       </div>
                                    </div>
                                    <div className="flex gap-1.5 shrink-0">
                                       <button onClick={() => downloadTemplate('XLSX', item.type)} className="px-2 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded border border-slate-200" title="Download Excel">
                                          XLSX
                                       </button>
                                       <button onClick={() => downloadTemplate('CSV', item.type)} className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[10px] font-bold rounded border border-slate-200" title="Download CSV">
                                          CSV
                                       </button>
                                    </div>
                                </div>
                            ))}
                       </div>
                    </div>
                    <div className="space-y-4">
                       <h4 className="font-bold text-sm text-gray-800 flex items-center gap-2"><Upload size={16} className="text-indigo-600" /> 2. Upload Data</h4>
                       <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-200 rounded-xl py-10 flex flex-col items-center justify-center text-center bg-gray-50/50 group cursor-pointer hover:border-indigo-300"
                        >
                          <CloudDownload size={32} className="text-gray-300 mb-2 group-hover:text-indigo-400" />
                          <p className="text-xs font-bold text-gray-700">Choose Excel/CSV/MHTML File</p>
                          <p className="text-[9px] text-gray-400 mt-1">.xlsx, .csv, .mht, .mhtml supported</p>
                          <button className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-indigo-700">Browse Files</button>
                          <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls, .mht, .mhtml" onChange={handleFileUpload} />
                       </div>
                    </div>
                 </div>
              </div>
              <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                 <button onClick={() => setIsImportModalOpen(false)} className="px-6 py-2 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-lg">Close</button>
              </div>
           </div>
        </div>
      )}

      {/* Synchronization Screen */}
      {isSyncScreenOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[88vh] flex flex-col overflow-hidden">
              <div className="px-8 py-4 border-b border-gray-200 flex justify-between items-center bg-indigo-600 text-white">
                 <div>
                    <h3 className="font-bold text-xl flex items-center gap-2 tracking-tight"><RefreshCw size={24} className={isSyncing ? "animate-spin" : ""}/> Question Import & Curriculum Mapping</h3>
                    <p className="text-xs text-indigo-100 font-medium mt-0.5">Review, edit Board/Class names, or map to existing curriculum</p>
                 </div>
                 <button onClick={() => setIsSyncScreenOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24}/></button>
              </div>

              {/* Quick Batch Mapping Toolbar */}
              <div className="bg-slate-50 border-b border-slate-200 px-8 py-3 flex flex-wrap items-center justify-between gap-4">
                 <div className="flex flex-wrap items-center gap-4">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide flex items-center gap-1.5">
                       <Filter size={14} className="text-indigo-600" /> Batch Assign:
                    </span>
                    
                    {/* Batch Board Selection */}
                    <div className="flex items-center gap-2">
                       <label className="text-xs font-medium text-slate-500">Board / Syllabus:</label>
                       <select
                          value={batchBoardOverride}
                          onChange={(e) => {
                             const val = e.target.value;
                             setBatchBoardOverride(val);
                             if (val && val !== '__AUTO__') {
                                setImportRows(prev => prev.map(r => ({ ...r, Board: val })));
                             }
                          }}
                          className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                       >
                          <option value="">Keep From File / Individual</option>
                          <optgroup label="Select from System Curriculum">
                             {syllabuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                          </optgroup>
                       </select>
                    </div>

                    {/* Batch Class Selection */}
                    <div className="flex items-center gap-2">
                       <label className="text-xs font-medium text-slate-500">Class / Grade:</label>
                       <select
                          value={batchClassOverride}
                          onChange={(e) => {
                             const val = e.target.value;
                             setBatchClassOverride(val);
                             if (val && val !== '__AUTO__') {
                                setImportRows(prev => prev.map(r => ({ ...r, Grade: val })));
                             }
                          }}
                          className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-800 outline-none focus:ring-2 focus:ring-indigo-500"
                       >
                          <option value="">Keep From File / Individual</option>
                          <optgroup label="Select from System Classes">
                             {Array.from(new Set(classes.map(c => c.name))).map(cName => <option key={cName} value={cName}>{cName}</option>)}
                          </optgroup>
                       </select>
                    </div>
                 </div>

                 <span className="text-xs text-slate-500 font-bold bg-white px-3 py-1 rounded-full border border-slate-200">
                    {importRows.length} Questions Ready
                 </span>
              </div>

              <div className="flex-1 overflow-auto p-0">
                 <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="bg-slate-100 border-b border-gray-200 sticky top-0 z-10">
                       <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="px-5 py-3 border-r border-gray-200 w-28">Status</th>
                          <th className="px-5 py-3 border-r border-gray-200">Question Content</th>
                          <th className="px-5 py-3 border-r border-gray-200 w-64">Board / Syllabus (Click to Edit)</th>
                          <th className="px-5 py-3 border-r border-gray-200 w-44">Class / Grade</th>
                          <th className="px-5 py-3 border-r border-gray-200">Subject</th>
                          <th className="px-5 py-3 border-r border-gray-200">Chapter/Topic</th>
                          <th className="px-5 py-3 w-28">Marks/Diff</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {importRows.map((row, i) => {
                          const sylExists = syllabuses.some(s => s.name.toLowerCase() === (row.Board || "").toLowerCase());
                          const clsExists = classes.some(c => c.name.toLowerCase() === String(row.Grade ?? "").toLowerCase());
                          const subExists = subjects.some(s => s.name.toLowerCase() === (row.Subject || "").toLowerCase());
                          
                          const allValid = sylExists && clsExists && subExists;

                          return (
                             <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="px-5 py-3 border-r border-gray-100 whitespace-nowrap">
                                   {allValid ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold border border-green-200 uppercase">
                                         <CheckCircle size={12} /> Matched
                                      </span>
                                   ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200 uppercase">
                                         <Database size={12} /> Auto-Create
                                      </span>
                                   )}
                                </td>
                                <td className="px-5 py-3 border-r border-gray-100 max-w-md">
                                   <p className="text-sm font-semibold text-gray-900 truncate">{row.QuestionText_EN || row.Question || row.QuestionText_UR || row.QuestionUrdu}</p>
                                   <p className="text-xs text-gray-500 mt-0.5 uppercase font-bold tracking-tighter">{row.Type || 'MCQ'}</p>
                                </td>
                                
                                {/* Editable Board Field */}
                                <td className="px-5 py-3 border-r border-gray-100">
                                   <div className="space-y-1">
                                      <input 
                                         type="text" 
                                         value={row.Board || ''} 
                                         onChange={(e) => {
                                            const val = e.target.value;
                                            setImportRows(prev => {
                                               const next = [...prev];
                                               next[i] = { ...next[i], Board: val };
                                               return next;
                                            });
                                         }}
                                         placeholder="e.g. PCTB / Punjab Board"
                                         className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 outline-none shadow-sm"
                                      />
                                      {syllabuses.length > 0 && !sylExists && (
                                         <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] text-slate-500"
                                            onChange={(e) => {
                                               if (e.target.value) {
                                                  const val = e.target.value;
                                                  setImportRows(prev => {
                                                     const next = [...prev];
                                                     next[i] = { ...next[i], Board: val };
                                                     return next;
                                                  });
                                               }
                                            }}
                                         >
                                            <option value="">Or map to Curriculum Board...</option>
                                            {syllabuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                         </select>
                                      )}
                                   </div>
                                </td>

                                {/* Editable Class / Grade Field */}
                                <td className="px-5 py-3 border-r border-gray-100">
                                   <div className="space-y-1">
                                      <input 
                                         type="text" 
                                         value={row.Grade || ''} 
                                         onChange={(e) => {
                                            const val = e.target.value;
                                            setImportRows(prev => {
                                               const next = [...prev];
                                               next[i] = { ...next[i], Grade: val };
                                               return next;
                                            });
                                         }}
                                         placeholder="e.g. 9 / Class 9"
                                         className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs font-bold text-slate-900 outline-none shadow-sm"
                                      />
                                      {classes.length > 0 && !clsExists && (
                                         <select
                                            className="w-full bg-slate-50 border border-slate-200 rounded px-1.5 py-0.5 text-[10px] text-slate-500"
                                            onChange={(e) => {
                                               if (e.target.value) {
                                                  const val = e.target.value;
                                                  setImportRows(prev => {
                                                     const next = [...prev];
                                                     next[i] = { ...next[i], Grade: val };
                                                     return next;
                                                  });
                                               }
                                            }}
                                         >
                                            <option value="">Map to Class...</option>
                                            {Array.from(new Set(classes.map(c => c.name))).map(cName => <option key={cName} value={cName}>{cName}</option>)}
                                         </select>
                                      )}
                                   </div>
                                </td>

                                <td className="px-5 py-3 border-r border-gray-100 whitespace-nowrap">
                                   <input 
                                      type="text" 
                                      value={row.Subject || ''} 
                                      onChange={(e) => {
                                         const val = e.target.value;
                                         setImportRows(prev => {
                                            const next = [...prev];
                                            next[i] = { ...next[i], Subject: val };
                                            return next;
                                         });
                                      }}
                                      placeholder="Subject"
                                      className="w-full bg-white border border-slate-200 hover:border-slate-300 focus:border-indigo-500 rounded-lg px-2.5 py-1 text-xs font-medium text-slate-800 outline-none"
                                   />
                                </td>
                                
                                <td className="px-5 py-3 border-r border-gray-100 whitespace-nowrap">
                                   <p className="text-xs font-medium text-gray-700">{row.Chapter || 'N/A'}</p>
                                   <p className="text-[10px] text-gray-400 mt-0.5">{row.Topic || 'N/A'}</p>
                                </td>
                                
                                <td className="px-5 py-3 whitespace-nowrap">
                                   <div className="flex gap-1.5">
                                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200">{row.Marks || 1}M</span>
                                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200 uppercase">{row.Difficulty || 'Medium'}</span>
                                   </div>
                                </td>
                             </tr>
                          );
                       })}
                    </tbody>
                 </table>
              </div>

              <div className="p-5 border-t border-gray-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="flex items-start gap-3 max-w-xl">
                    <Info size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 leading-relaxed">
                       <strong>Curriculum Sync:</strong> You can edit shortcut Board names (e.g. PTB → PCTB) or map them directly to existing curriculum boards and classes above. Any new boards or classes will be safely auto-created in your curriculum.
                    </p>
                 </div>
                 <div className="flex gap-3 shrink-0">
                    <button onClick={() => setIsSyncScreenOpen(false)} className="px-5 py-2.5 text-xs font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-colors">Discard Batch</button>
                    <button 
                       disabled={isSyncing}
                       onClick={executeSynchronization}
                       className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50"
                    >
                       {isSyncing ? (
                          <><Loader2 className="animate-spin" size={18}/> Synchronizing ({syncProgress}%)...</>
                       ) : (
                          <><FileCheck size={18}/> Sync & Save to Repository</>
                       )}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Selection-Aware Smart Import Modal */}
      {isSequenceImportModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
              <div className="px-6 py-5 border-b border-gray-200 flex justify-between items-center bg-indigo-600 text-white">
                 <div>
                    <h3 className="font-bold text-lg flex items-center gap-2"><FileUp size={20}/> Smart Contextual Bulk Import</h3>
                    <p className="text-[10px] text-indigo-100 font-medium uppercase tracking-widest mt-0.5">Automated curriculum mapping enabled</p>
                 </div>
                 <button onClick={() => setIsSequenceImportModalOpen(false)} className="hover:bg-white/10 p-1.5 rounded-full"><X size={20}/></button>
              </div>
              
              <div className="p-8 space-y-6">
                 <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Metadata already locked via UI:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
                       {[
                         { label: 'Board', val: getSyllabusName(selSyllabusId), icon: BookOpen, locked: !!selSyllabusId },
                         { label: 'Grade', val: getClassName(selClassId), icon: GraduationCap, locked: !!selClassId },
                         { label: 'Subject', val: getSubjectName(selSubjectId), icon: Library, locked: !!selSubjectId },
                         { label: 'Chapter', val: getChapterName(selChapterId), icon: Layers, locked: !!selChapterId },
                         { label: 'Topic', val: newQuestion.topic || 'In Sheet', icon: FileText, locked: !!newQuestion.topic }
                       ].map((item, i) => (
                          <div key={i} className={`flex items-center gap-3 ${item.locked ? 'opacity-100' : 'opacity-40'}`}>
                             <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.locked ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'}`}>
                                <item.icon size={16} />
                             </div>
                             <div>
                                <p className="text-[10px] font-bold text-slate-400 uppercase">{item.label}</p>
                                <p className={`text-sm font-bold ${item.locked ? 'text-indigo-900' : 'text-slate-500 italic'}`}>{item.val}</p>
                             </div>
                          </div>
                       ))}
                    </div>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <h5 className="text-xs font-bold text-gray-700 uppercase">1. Download Template</h5>
                       
                       {/* Featured Master Template */}
                       <div className="p-3 bg-indigo-50/70 border border-indigo-200 rounded-xl">
                          <p className="text-xs font-bold text-indigo-950">⭐ Master Global Template (All Types)</p>
                          <p className="text-[10px] text-indigo-700 mt-0.5">With Math, Chemistry, Physics & Biology examples</p>
                          <div className="flex gap-2 mt-2">
                             <button onClick={() => downloadTemplate('XLSX', 'ALL', true)} className="flex-1 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold shadow-xs">
                                XLSX Multi-Tab
                             </button>
                             <button onClick={() => downloadTemplate('CSV', 'ALL', true)} className="px-3 py-1.5 bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 rounded text-[11px] font-bold">
                                CSV
                             </button>
                          </div>
                       </div>

                       <div className="flex flex-col gap-1.5 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                          {['MCQ', 'Short Answer', 'Long Answer', 'Match Columns', 'True/False', 'Fill in the Blanks'].map(t => (
                             <div key={t} className="flex items-center justify-between p-2 border border-slate-200 rounded-lg hover:bg-slate-50 transition-all text-left group">
                                <div className="flex items-center gap-2">
                                   <Layers className="text-slate-600 shrink-0" size={15} />
                                   <p className="text-xs font-bold text-slate-900">{t}</p>
                                </div>
                                <div className="flex gap-1">
                                   <button onClick={() => downloadTemplate('XLSX', t, true)} className="px-2 py-0.5 bg-slate-100 hover:bg-indigo-50 text-indigo-600 text-[9px] font-bold rounded border border-slate-200">
                                      XLSX
                                   </button>
                                   <button onClick={() => downloadTemplate('CSV', t, true)} className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-[9px] font-bold rounded border border-slate-200">
                                      CSV
                                   </button>
                                </div>
                             </div>
                          ))}
                       </div>
                    </div>

                    <div className="space-y-4">
                       <h5 className="text-xs font-bold text-gray-700 uppercase">2. Upload File</h5>
                       <div 
                          onClick={() => sequenceFileInputRef.current?.click()}
                          className="border-2 border-dashed border-indigo-200 rounded-2xl h-[178px] flex flex-col items-center justify-center text-center bg-indigo-50/10 group cursor-pointer hover:bg-indigo-50/30 transition-colors"
                        >
                          <CloudDownload size={32} className="text-indigo-300 group-hover:scale-110 transition-transform mb-2" />
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Drop Excel/CSV/MHTML File</p>
                          <p className="text-[8px] text-gray-400 mt-1">.xlsx, .csv, .mht, .mhtml supported</p>
                          <button className="mt-4 px-8 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase shadow-sm">Browse</button>
                          <input type="file" ref={sequenceFileInputRef} className="hidden" accept=".csv, .xlsx, .xls, .mht, .mhtml" onChange={handleFileUpload} />
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Manual Add/Edit Question Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                 <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-indigo-600 text-white rounded-lg flex items-center justify-center font-bold text-sm">
                       {formStep === 'TYPE' ? '1' : '2'}
                    </div>
                    <h3 className="font-bold text-lg">{editingId ? 'Edit Question' : (formStep === 'TYPE' ? 'Choose Category' : `Define ${newQuestion.type}`)}</h3>
                 </div>
                 <div className="flex gap-2">
                    <button onClick={() => setIsBilingualMode(!isBilingualMode)} className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold transition-all ${isBilingualMode ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                       <Languages size={14} /> Bilingual: {isBilingualMode ? 'ON' : 'OFF'}
                    </button>
                    <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 p-1 hover:bg-gray-100 rounded-full transition-colors"><X size={20}/></button>
                 </div>
              </div>

              {formStep === 'TYPE' ? (
                <div className="p-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                   {questionTypesList.map(type => (
                      <div 
                         key={type.id} 
                         onClick={() => { 
                             setNewQuestion({...newQuestion, type: type.id === 'Custom' ? '' : type.id}); 
                             setIsCustomType(type.id === 'Custom');
                             // Default to Choice for MCQ-like types or Text for others
                             if (type.id === 'Spelling Check' || type.id === 'MCQ' || type.id === 'Fill in the Blanks') setCustomFormat('CHOICE');
                             else setCustomFormat('TEXT');
                             
                             setFormStep('CONTENT'); 
                         }}
                         className={`p-6 border-2 rounded-xl text-center cursor-pointer transition-all hover:shadow-lg ${newQuestion.type === type.id ? 'border-indigo-600 bg-indigo-50' : 'border-gray-100 hover:border-indigo-200'}`}
                      >
                         <div className={`w-12 h-12 bg-white border border-gray-200 rounded-lg flex items-center justify-center mx-auto mb-3 shadow-sm ${type.color}`}>
                            <type.icon size={24}/>
                         </div>
                         <span className="font-bold text-gray-900 uppercase text-[10px] tracking-widest">{type.label}</span>
                      </div>
                   ))}
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto">
                    <div className="p-6 space-y-8">
                        
                        {/* 1. ACADEMIC CLASSIFICATION */}
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
                           <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                              <h4 className="font-bold text-xs uppercase tracking-widest text-slate-400 flex items-center gap-2">
                                <Layers size={14}/> Academic Classification
                              </h4>
                              {isCustomType && (
                                  <div className="flex items-center gap-4 flex-1 mx-4">
                                      <div className="flex-1">
                                        <span className="text-[10px] font-bold text-indigo-600 uppercase mb-1 block">Category Name:</span>
                                        <input 
                                            type="text" 
                                            placeholder="e.g. Map Identification" 
                                            className="border-b-2 border-indigo-200 bg-transparent px-2 py-1 text-sm font-bold text-slate-800 outline-none focus:border-indigo-600 w-full"
                                            value={newQuestion.type}
                                            onChange={e => setNewQuestion({...newQuestion, type: e.target.value})}
                                        />
                                      </div>
                                      <div className="flex items-center bg-white rounded-lg border border-slate-200 p-1">
                                          <button 
                                            onClick={() => setCustomFormat('TEXT')}
                                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${customFormat === 'TEXT' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                                          >
                                            Open Ended
                                          </button>
                                          <button 
                                            onClick={() => setCustomFormat('CHOICE')}
                                            className={`px-3 py-1.5 text-[10px] font-bold uppercase rounded-md transition-all ${customFormat === 'CHOICE' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}
                                          >
                                            Multiple Choice
                                          </button>
                                      </div>
                                  </div>
                              )}
                              <div className="flex flex-wrap gap-2 relative z-10">
                                 <button 
                                    onClick={() => setIsSequenceImportModalOpen(true)}
                                    className="px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-xl text-[10px] font-bold uppercase tracking-wide hover:border-indigo-400 hover:text-indigo-600 transition-all flex items-center gap-2 shadow-sm"
                                 >
                                    <FileUp size={14}/> Bulk Upload Sync
                                 </button>
                                 <button 
                                    onClick={handleSmartImport}
                                    disabled={isSmartImporting || !newQuestion.topic}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-bold uppercase tracking-wide flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-md shadow-indigo-100"
                                 >
                                    {isSmartImporting ? <RefreshCw size={14} className="animate-spin"/> : <Sparkles size={14}/>}
                                    AI Draft Assistant
                                 </button>
                              </div>
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 relative z-10">
                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><BookOpen size={11}/> Board / Syllabus</label>
                                 <select className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none" value={selSyllabusId} onChange={(e) => { setSelSyllabusId(e.target.value); setSelClassId(''); setSelSubjectId(''); setSelChapterId(''); }}>
                                    <option value="">Select Board</option>
                                    {syllabuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                 </select>
                              </div>

                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><GraduationCap size={11}/> Grade Level</label>
                                 <select className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none disabled:bg-slate-100" value={selClassId} disabled={!selSyllabusId} onChange={(e) => { const id = e.target.value; setSelClassId(id); setSelSubjectId(''); setSelChapterId(''); const name = classes.find(c => c.id === id)?.name || ''; setNewQuestion(prev => ({ ...prev, classLevel: name })); }}>
                                    <option value="">Select Grade</option>
                                    {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                 </select>
                              </div>

                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Library size={11}/> Subject</label>
                                 <select className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none disabled:bg-slate-100" value={selSubjectId} disabled={!selClassId} onChange={(e) => { const id = e.target.value; setSelSubjectId(id); setSelChapterId(''); const name = subjects.find(s => s.id === id)?.name || ''; setNewQuestion(prev => ({ ...prev, subject: name })); }}>
                                    <option value="">Select Subject</option>
                                    {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                 </select>
                              </div>

                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><Layers size={11}/> Chapter</label>
                                 <select className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none disabled:bg-slate-100" value={selChapterId} disabled={!selSubjectId} onChange={(e) => setSelChapterId(e.target.value)}>
                                    <option value="">Select Chapter</option>
                                    {filteredChapters.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                                 </select>
                              </div>

                              <div className="space-y-1.5">
                                 <label className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1"><FileText size={11}/> Topic</label>
                                 <select className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none disabled:bg-slate-100" value={newQuestion.topic} disabled={!selChapterId} onChange={(e) => setNewQuestion({...newQuestion, topic: e.target.value})}>
                                    <option value="">Select Topic</option>
                                    {filteredTopics.map(t => <option key={t.id} value={t.name}>{t.name}</option>)}
                                 </select>
                              </div>

                              <div className="grid grid-cols-2 gap-3">
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Marks</label>
                                    <input type="number" value={newQuestion.marks} onChange={e => setNewQuestion({...newQuestion, marks: parseInt(e.target.value) || 1})} className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none" />
                                 </div>
                                 <div className="space-y-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase">Level</label>
                                    <select value={newQuestion.difficulty} onChange={e => setNewQuestion({...newQuestion, difficulty: e.target.value as any})} className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-sm outline-none">
                                       <option value={Difficulty.EASY}>Easy</option>
                                       <option value={Difficulty.MEDIUM}>Medium</option>
                                       <option value={Difficulty.HARD}>Hard</option>
                                    </select>
                                 </div>
                              </div>
                           </div>
                        </div>

                        {/* 2. SOURCE & IMAGE */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-2">
                               <label className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                <Tag size={14}/> Content Sources (Select Multiple)
                               </label>
                               <div className="relative">
                                  <button onClick={() => setIsSourceDropdownOpen(!isSourceDropdownOpen)} className="w-full flex items-center justify-between p-3 border border-slate-300 rounded-xl text-sm bg-white hover:bg-gray-50 transition-colors shadow-sm">
                                     <span className="truncate">{newQuestion.sources?.length ? `${newQuestion.sources.length} Sources Selected` : "Choose Sources..."}</span>
                                     <ChevronDown size={18} className="text-slate-400" />
                                  </button>
                                  {isSourceDropdownOpen && (
                                     <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl z-50 p-2 max-h-60 overflow-y-auto">
                                        {Object.values(QuestionSource).map(src => (
                                           <label key={src} className="flex items-center gap-3 p-2.5 hover:bg-indigo-50 rounded-lg cursor-pointer transition-colors">
                                              <input type="checkbox" checked={newQuestion.sources?.includes(src)} onChange={() => handleToggleSource(src)} className="rounded text-indigo-600" />
                                              <span className="text-sm font-medium text-slate-700">{src}</span>
                                           </label>
                                        ))}
                                     </div>
                                  )}
                               </div>
                               <div className="flex flex-wrap gap-1.5 mt-2">
                                  {newQuestion.sources?.map(s => (
                                     <span key={s} className="px-2 py-1 bg-indigo-50 text-indigo-700 rounded text-[10px] font-bold border border-indigo-100 flex items-center gap-1 uppercase tracking-tighter">
                                        {s} <X size={10} className="cursor-pointer" onClick={() => handleToggleSource(s)} />
                                     </span>
                                  ))}
                               </div>
                           </div>
                           
                           {/* MOVED IMAGE UPLOADER TO BE UNIVERSAL */}
                           <div className="space-y-2">
                               <label className="text-xs font-bold text-slate-700 uppercase tracking-widest flex items-center gap-2">
                                <ImageIcon size={14}/> Image / Diagram (Optional)
                               </label>
                               <div className="relative flex gap-2">
                                  <div 
                                     onClick={() => diagramFileInputRef.current?.click()}
                                     className="w-16 h-12 border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all shrink-0"
                                  >
                                     {newQuestion.imageUrl ? <img src={newQuestion.imageUrl} className="w-full h-full object-cover rounded-lg" /> : <Upload size={16} className="text-slate-400"/>}
                                  </div>
                                  <input type="text" value={newQuestion.imageUrl || ''} onChange={e => setNewQuestion({...newQuestion, imageUrl: e.target.value})} className="flex-1 pl-4 pr-4 py-3 border border-slate-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm" placeholder="Paste image link or upload..." />
                                  <input type="file" ref={diagramFileInputRef} className="hidden" accept="image/*" onChange={handleDiagramUpload} />
                               </div>
                           </div>
                        </div>

                        {/* 3. QUESTION TEXTS */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                           <div className="space-y-3">
                              <div className="flex justify-between items-center">
                                 <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Question (English)</label>
                                 <button onClick={handleTranslateAll} className="text-[10px] font-bold text-indigo-600 hover:underline flex items-center gap-1"><Sparkles size={10}/> Translate to Urdu</button>
                              </div>
                              <textarea value={newQuestion.text} onChange={e => setNewQuestion({...newQuestion, text: e.target.value})} className="w-full border border-slate-300 p-5 rounded-2xl min-h-[160px] outline-none focus:ring-2 focus:ring-indigo-500 text-sm shadow-sm transition-all" placeholder="Enter English text..." />
                           </div>
                           {isBilingualMode && (
                              <div className="space-y-3">
                                 <label className="text-xs font-bold text-indigo-600 uppercase block text-right tracking-widest">سوال (اردو)</label>
                                 <textarea dir="rtl" value={newQuestion.textUrdu} onChange={e => setNewQuestion({...newQuestion, textUrdu: e.target.value})} className="w-full border border-indigo-100 bg-indigo-50/10 p-5 rounded-2xl min-h-[160px] outline-none focus:ring-2 focus:ring-indigo-500 font-urdu text-2xl shadow-sm transition-all" placeholder="اردو سوال..." />
                              </div>
                           )}
                        </div>

                        {/* 4. DYNAMIC TYPE SPECIFIC SECTIONS */}
                        {(newQuestion.type === 'MCQ' || customFormat === 'CHOICE') && renderOptionsBuilder()}

                        {newQuestion.type === 'Match Columns' && (
                           <div className="space-y-6 pt-6 border-t border-slate-100">
                              <h5 className="font-bold text-slate-800 text-sm uppercase tracking-widest">Bilingual Match Columns Pairing</h5>
                              <div className="space-y-4">
                                 {newQuestion.matchingPairs?.map((pair, i) => (
                                    <div key={i} className="grid grid-cols-1 lg:grid-cols-2 gap-4 p-5 border border-slate-200 rounded-2xl bg-slate-50/50 relative group/pair shadow-sm">
                                       <button onClick={() => setNewQuestion({...newQuestion, matchingPairs: newQuestion.matchingPairs?.filter((_, idx) => idx !== i)})} className="absolute -top-3 -right-3 bg-red-500 text-white p-1 rounded-full shadow-lg opacity-0 group-hover/pair:opacity-100 transition-opacity"><X size={14}/></button>
                                       <div className="space-y-3">
                                          <div className="grid grid-cols-2 gap-2">
                                             <input value={pair.left} onChange={e => { const pairs = [...(newQuestion.matchingPairs || [])]; pairs[i].left = e.target.value; setNewQuestion({...newQuestion, matchingPairs: pairs}); }} className="border border-slate-300 p-2.5 rounded-xl text-sm bg-white" placeholder={`Item ${i+1} A (EN)`} />
                                             <input value={pair.right} onChange={e => { const pairs = [...(newQuestion.matchingPairs || [])]; pairs[i].right = e.target.value; setNewQuestion({...newQuestion, matchingPairs: pairs}); }} className="border border-slate-300 p-2.5 rounded-xl text-sm bg-white" placeholder={`Item ${i+1} B (EN)`} />
                                          </div>
                                       </div>
                                       {isBilingualMode && (
                                          <div className="space-y-3">
                                             <div className="grid grid-cols-2 gap-2">
                                                <input dir="rtl" value={pair.leftUrdu || ''} onChange={e => { const pairs = [...(newQuestion.matchingPairs || [])]; pairs[i].leftUrdu = e.target.value; setNewQuestion({...newQuestion, matchingPairs: pairs}); }} className="border border-indigo-200 p-2.5 rounded-xl font-urdu text-lg bg-white text-right" placeholder="اردو (بائیں)" />
                                                <input dir="rtl" value={pair.rightUrdu || ''} onChange={e => { const pairs = [...(newQuestion.matchingPairs || [])]; pairs[i].rightUrdu = e.target.value; setNewQuestion({...newQuestion, matchingPairs: pairs}); }} className="border border-indigo-200 p-2.5 rounded-xl font-urdu text-lg bg-white text-right" placeholder="اردو (دائیں)" />
                                             </div>
                                          </div>
                                       )}
                                    </div>
                                 ))}
                                 <button onClick={() => setNewQuestion({...newQuestion, matchingPairs: [...(newQuestion.matchingPairs || []), {left: '', right: '', leftUrdu: '', rightUrdu: ''}]})} className="w-full py-4 border-2 border-dashed border-indigo-200 rounded-2xl text-indigo-600 font-bold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"><Plus size={18}/> Add Bilingual Pair</button>
                              </div>
                           </div>
                        )}

                        {newQuestion.type === 'True/False' && (
                           <div className="space-y-6 pt-6 border-t border-slate-100">
                              <h5 className="font-bold text-slate-800 text-sm uppercase tracking-widest">Answer Specification</h5>
                              <div className="flex gap-4">
                                 <button onClick={() => setNewQuestion({...newQuestion, correctAnswer: 'True'})} className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all ${newQuestion.correctAnswer === 'True' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-100 hover:border-indigo-200'}`}>TRUE</button>
                                 <button onClick={() => setNewQuestion({...newQuestion, correctAnswer: 'False'})} className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all ${newQuestion.correctAnswer === 'False' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-100 hover:border-indigo-200'}`}>FALSE</button>
                              </div>
                           </div>
                        )}
                        
                        {/* Text Based Types (Short, Long, Custom Text) */}
                        {(newQuestion.type === 'Short Answer' || newQuestion.type === 'Long Answer' || (customFormat === 'TEXT' && newQuestion.type !== 'MCQ' && newQuestion.type !== 'Match Columns' && newQuestion.type !== 'True/False')) && (
                            <div className="space-y-3 pt-6 border-t border-slate-100">
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-widest">Model Answer / Marking Rubric</label>
                                <textarea 
                                    value={newQuestion.correctAnswer || ''} 
                                    onChange={e => setNewQuestion({...newQuestion, correctAnswer: e.target.value})}
                                    className="w-full border border-slate-300 p-4 rounded-xl text-sm"
                                    placeholder="Enter key points or expected answer..."
                                />
                                {isBilingualMode && (
                                     <textarea 
                                        dir="rtl"
                                        value={newQuestion.correctAnswerUrdu || ''} 
                                        onChange={e => setNewQuestion({...newQuestion, correctAnswerUrdu: e.target.value})}
                                        className="w-full border border-indigo-100 bg-indigo-50/10 p-4 rounded-xl font-urdu text-lg text-right"
                                        placeholder="جوابی نکات..."
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
              )}

              <div className="p-5 border-t border-gray-200 flex justify-between gap-3 bg-gray-50 rounded-b-xl">
                 <button onClick={() => formStep === 'CONTENT' ? setFormStep('TYPE') : setIsAddModalOpen(false)} className="px-8 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-colors">
                    {formStep === 'CONTENT' ? 'Back to Selection' : 'Cancel'}
                 </button>
                 {formStep === 'CONTENT' && (
                    <button onClick={handleSaveQuestion} className="px-12 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                       Save Global Repository Entry
                    </button>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default GlobalQuestionBank;
