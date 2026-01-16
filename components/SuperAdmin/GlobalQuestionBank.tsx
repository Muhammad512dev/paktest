
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
      getQuestions(),
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
  const [isSequenceImportModalOpen, setIsSequenceImportModalOpen] = useState(false);
  const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
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
      const matchesType = filterType === 'All' || q.type === filterType;
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
          chapter: chapterName,
          source: newQuestion.sources?.[0] || QuestionSource.MODEL_PAPER,
          medium: (newQuestion.text && newQuestion.textUrdu) ? 'Bilingual' : newQuestion.textUrdu ? 'Urdu' : 'English'
      } as Question;

      if (editingId) {
          questionData.id = editingId;
          await updateQuestion(questionData);
      } else {
          questionData.id = `q_${Date.now()}`;
          await addQuestion(questionData);
      }
      
      await loadAllData();
      setIsAddModalOpen(false);
      handleResetForm();
  };

  // --- CSV/EXCEL PARSING & SYNC LOGIC ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
        alert("Failed to parse file. Please ensure it is a valid Excel (.xlsx) or CSV file.");
      }
    };
    
    // Reset file input for next use
    if (e.target) e.target.value = '';
  };

  const executeSynchronization = async () => {
    setIsSyncing(true);
    await new Promise(r => setTimeout(r, 1500));

    const finalQuestions: Question[] = [];

    /* Refactored synchronization to handle async path mapping and question generation */
    for (let i = 0; i < importRows.length; i++) {
      const row = importRows[i];
      // 1. Ensure curriculum exists or create it
      const pathRes = await ensureCurriculumPath({
        board: row.Board || getSyllabusName(selSyllabusId) || 'General',
        grade: row.Grade || getClassName(selClassId) || 'General',
        subject: row.Subject || getSubjectName(selSubjectId) || 'General',
        chapter: row.Chapter || getChapterName(selChapterId) || 'General',
        topic: row.Topic || newQuestion.topic || 'General'
      });
      
      const path = pathRes.path || { 
        subject: { name: row.Subject || getSubjectName(selSubjectId) || 'General' },
        class: { name: row.Grade || getClassName(selClassId) || 'General' },
        chapter: { name: row.Chapter || getChapterName(selChapterId) || 'General' }
      };

      // 2. Map CSV/Excel row to Question Object
      // Use logical OR for flexibility if headers are slighty different in source
      const q: Question = {
        id: `bulk_${Date.now()}_${i}`,
        text: row.QuestionText_EN || row.Question || 'Empty Question',
        textUrdu: row.QuestionText_UR || row.QuestionUrdu || '',
        type: row.Type || 'MCQ',
        marks: parseInt(row.Marks) || 1,
        difficulty: (row.Difficulty || Difficulty.MEDIUM) as Difficulty,
        subject: path.subject.name,
        classLevel: path.grade || path.class.name,
        topic: row.Topic || newQuestion.topic || 'General',
        chapter: path.chapter.name,
        imageUrl: row.ImageURL || '',
        correctAnswer: row.CorrectAnswer_Letter || row.CorrectAnswer || '',
        sources: row.Sources ? String(row.Sources).split('|') : [QuestionSource.MODEL_PAPER],
        source: row.Sources ? String(row.Sources).split('|')[0] : QuestionSource.MODEL_PAPER,
        options: [row.OptionA_EN, row.OptionB_EN, row.OptionC_EN, row.OptionD_EN].filter(Boolean),
        optionsUrdu: [row.OptionA_UR, row.OptionB_UR, row.OptionC_UR, row.OptionD_UR].filter(Boolean)
      } as Question;

      finalQuestions.push(q);
    }

    await addQuestionsBulk(finalQuestions);
    await loadAllData();

    setIsSyncing(false);
    setIsSyncScreenOpen(false);
    setIsAddModalOpen(false);
    handleResetForm();
    alert(`Synchronization Complete: ${finalQuestions.length} questions added and curriculum synchronized.`);
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
    XLSX.writeFile(wb, `ExamForge_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const downloadTemplate = (format: 'CSV' | 'XLSX', type: string, contextual: boolean = false) => {
     let columns: string[] = [];
     
     if (!contextual || !selSyllabusId) columns.push("Board");
     if (!contextual || !selClassId) columns.push("Grade");
     if (!contextual || !selSubjectId) columns.push("Subject");
     if (!contextual || !selChapterId) columns.push("Chapter");
     if (!contextual || !newQuestion.topic) columns.push("Topic");

     columns.push("QuestionText_EN", "QuestionText_UR", "Type", "Marks", "Difficulty", "ImageURL", "Sources");

     if (type === 'MCQ') {
        columns.push("OptionA_EN", "OptionA_UR", "OptionB_EN", "OptionB_UR", "OptionC_EN", "OptionC_UR", "OptionD_EN", "OptionD_UR", "CorrectAnswer_Letter");
     } else if (type === 'Match Columns') {
        for(let i=1; i<=5; i++) {
            columns.push(`Pair${i}_Left_EN`, `Pair${i}_Left_UR`, `Pair${i}_Right_EN`, `Pair${i}_Right_UR`);
        }
     } else if (type === 'True/False') {
        columns.push("CorrectAnswer");
     } else if (type === 'Fill in the Blanks') {
        columns.push("Answer_EN", "Answer_UR");
     } else {
        columns.push("ModelAnswer_EN", "ModelAnswer_UR");
     }

     const board = getSyllabusName(selSyllabusId);
     const grade = getClassName(selClassId);
     const filename = contextual ? `Template_${type.replace(' ', '_')}_${board}_${grade}` : `Master_${type.replace(' ', '_')}`;

     if (format === 'CSV') {
         const content = columns.join(",");
         const blob = new Blob([content], { type: 'text/csv' });
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a');
         a.href = url;
         a.download = `${filename}.csv`;
         a.click();
     } else {
         const wb = XLSX.utils.book_new();
         const ws = XLSX.utils.aoa_to_sheet([columns]);
         XLSX.utils.book_append_sheet(wb, ws, "Template");
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
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2"><FileSpreadsheet size={20} className="text-indigo-600"/> Global Bulk Import</h3>
                 <button onClick={() => setIsImportModalOpen(false)}><X size={20}/></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                       <h4 className="font-bold text-sm text-gray-700 flex items-center gap-2"><Download size={16} className="text-indigo-400" /> 1. Get Master Templates</h4>
                       <div className="flex flex-col gap-2">
                           {['MCQ', 'True/False', 'Fill in the Blanks', 'Match Columns', 'Short Answer'].map(t => (
                               <button key={t} onClick={() => downloadTemplate('XLSX', t)} className="w-full flex items-center justify-between p-3 border border-gray-200 rounded-xl hover:bg-gray-50 transition-all text-left">
                                   <div className="flex items-center gap-3">
                                      <CheckSquare className="text-indigo-600" size={18} />
                                      <span className="text-xs font-bold text-gray-900 uppercase">{t}</span>
                                   </div>
                                   <Download size={14} className="text-gray-300" />
                               </button>
                           ))}
                       </div>
                    </div>
                    <div className="space-y-4">
                       <h4 className="font-bold text-sm text-gray-700 flex items-center gap-2"><Upload size={16} className="text-indigo-400" /> 2. Upload Data</h4>
                       <div 
                          onClick={() => fileInputRef.current?.click()}
                          className="border-2 border-dashed border-gray-200 rounded-xl py-10 flex flex-col items-center justify-center text-center bg-gray-50/50 group cursor-pointer hover:border-indigo-300"
                        >
                          <CloudDownload size={32} className="text-gray-300 mb-2 group-hover:text-indigo-400" />
                          <p className="text-xs font-bold text-gray-700">Choose Excel/CSV File</p>
                          <p className="text-[9px] text-gray-400 mt-1">.xlsx, .xls, .csv supported</p>
                          <button className="mt-4 px-6 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-indigo-700">Browse Files</button>
                          <input type="file" ref={fileInputRef} className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} />
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
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[85vh] flex flex-col overflow-hidden">
              <div className="px-8 py-5 border-b border-gray-200 flex justify-between items-center bg-indigo-600 text-white">
                 <div>
                    <h3 className="font-bold text-xl flex items-center gap-2 tracking-tight"><RefreshCw size={24} className={isSyncing ? "animate-spin" : ""}/> Data Synchronization Engine</h3>
                    <p className="text-xs text-indigo-100 font-medium uppercase tracking-widest mt-1">Reviewing {importRows.length} items for curriculum alignment</p>
                 </div>
                 <button onClick={() => setIsSyncScreenOpen(false)} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={24}/></button>
              </div>

              <div className="flex-1 overflow-auto p-0">
                 <table className="w-full text-left border-collapse min-w-[1200px]">
                    <thead className="bg-slate-50 border-b border-gray-200 sticky top-0 z-10">
                       <tr className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="px-6 py-4 border-r border-gray-200">Status</th>
                          <th className="px-6 py-4 border-r border-gray-200">Question Content</th>
                          <th className="px-6 py-4 border-r border-gray-200">Board/Grade</th>
                          <th className="px-6 py-4 border-r border-gray-200">Subject</th>
                          <th className="px-6 py-4 border-r border-gray-200">Chapter/Topic</th>
                          <th className="px-6 py-4">Marks/Diff</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {importRows.map((row, i) => {
                          const sylExists = syllabuses.some(s => s.name.toLowerCase() === (row.Board || "").toLowerCase());
                          const clsExists = classes.some(c => c.name.toLowerCase() === (row.Grade || "").toLowerCase());
                          const subExists = subjects.some(s => s.name.toLowerCase() === (row.Subject || "").toLowerCase());
                          
                          const allValid = sylExists && clsExists && subExists;

                          return (
                             <tr key={i} className="hover:bg-slate-50 transition-colors">
                                <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                   {allValid ? (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-50 text-green-700 text-[10px] font-bold border border-green-200 uppercase">
                                         <CheckCircle size={12} /> Map Ready
                                      </span>
                                   ) : (
                                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold border border-amber-200 uppercase">
                                         <Database size={12} /> Auto-Create
                                      </span>
                                   )}
                                </td>
                                <td className="px-6 py-4 border-r border-gray-100 max-w-md">
                                   <p className="text-sm font-semibold text-gray-900 truncate">{row.QuestionText_EN || row.Question}</p>
                                   <p className="text-xs text-gray-500 mt-0.5 uppercase font-bold tracking-tighter">{row.Type}</p>
                                </td>
                                <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                   <p className={`text-sm font-bold ${sylExists ? 'text-gray-900' : 'text-indigo-600 underline decoration-dotted underline-offset-4'}`}>{row.Board || 'Default'}</p>
                                   <p className={`text-xs ${clsExists ? 'text-gray-500' : 'text-indigo-400 italic'}`}>{row.Grade || 'General'}</p>
                                </td>
                                <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                   <p className={`text-sm font-bold ${subExists ? 'text-gray-900' : 'text-indigo-600 underline decoration-dotted underline-offset-4'}`}>{row.Subject || 'General'}</p>
                                </td>
                                <td className="px-6 py-4 border-r border-gray-100 whitespace-nowrap">
                                   <p className="text-sm font-medium text-gray-700">{row.Chapter || 'N/A'}</p>
                                   <p className="text-xs text-gray-400 mt-0.5">{row.Topic || 'N/A'}</p>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                   <div className="flex gap-2">
                                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200">{row.Marks}M</span>
                                      <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold border border-slate-200 uppercase">{row.Difficulty}</span>
                                   </div>
                                </td>
                             </tr>
                          );
                       })}
                    </tbody>
                 </table>
              </div>

              <div className="p-6 border-t border-gray-200 bg-slate-50 flex flex-col md:flex-row justify-between items-center gap-4">
                 <div className="flex items-start gap-3 max-w-xl">
                    <Info size={20} className="text-indigo-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-600 leading-relaxed">
                       <strong>Curriculum Sync Engine:</strong> Items marked with <span className="text-indigo-600 font-bold">Auto-Create</span> will automatically generate new Board, Grade, Subject, or Chapter nodes in your database. This ensures every question is properly categorized and accessible via the Generator Wizard.
                    </p>
                 </div>
                 <div className="flex gap-3 shrink-0">
                    <button onClick={() => setIsSyncScreenOpen(false)} className="px-6 py-3 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-colors">Discard Batch</button>
                    <button 
                       disabled={isSyncing}
                       onClick={executeSynchronization}
                       className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50"
                    >
                       {isSyncing ? (
                          <><Loader2 className="animate-spin" size={20}/> Synchronizing...</>
                       ) : (
                          <><FileCheck size={20}/> Sync & Save to Repository</>
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
                       <div className="flex flex-col gap-2 max-h-[180px] overflow-y-auto pr-2 custom-scrollbar">
                          {['MCQ', 'True/False', 'Fill in the Blanks', 'Match Columns', 'Short Answer'].map(t => (
                             <button key={t} onClick={() => downloadTemplate('XLSX', t, true)} className="w-full flex items-center justify-between p-3 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all text-left group">
                                <div className="flex items-center gap-3">
                                   <Layers className="text-slate-600" size={18} />
                                   <p className="text-xs font-bold text-slate-900 uppercase">{t}</p>
                                </div>
                                <Download size={14} className="text-slate-300 group-hover:text-indigo-600" />
                             </button>
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
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Drop Excel/CSV File</p>
                          <p className="text-[8px] text-gray-400 mt-1">.xlsx, .xls, .csv supported</p>
                          <button className="mt-4 px-8 py-2 bg-indigo-600 text-white rounded-lg text-xs font-bold uppercase shadow-sm">Browse</button>
                          <input type="file" ref={sequenceFileInputRef} className="hidden" accept=".csv, .xlsx, .xls" onChange={handleFileUpload} />
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
