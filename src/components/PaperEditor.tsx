
import React, { useState, useMemo, useEffect } from 'react';
import {
   Printer, Save, Trash2, Plus, X, Settings as SettingsIcon, Search, Sparkles,
   Library, RefreshCw, Box, ListFilter, Edit3, Trash, PlusCircle, Layers, FileText, Check, Tag, Filter,
   Calendar, Clock, ClipboardList, Info as InfoIcon, CheckSquare, Square, ChevronDown, Globe, Languages, GraduationCap, ChevronRight, ChevronUp, BookOpen, Settings2, HelpCircle, Eye, EyeOff, Key, FileCheck
} from 'lucide-react';
import { ExamPaper, Question, PaperSectionConfig, Difficulty, User, QuestionSource, SavedPaper, QuestionType, Syllabus, ClassLevel, Subject, getDefaultSectionInstruction } from '../types';
import { getQuestions, getChapters, getTopics, savePaper, getQuestionTypes } from '../services/dataService';
import PrintPreview from './PrintPreview';
import MathRenderer from './MathRenderer';

interface PaperEditorProps {
   paper: ExamPaper & { selectedChapters: string[], selectedTopics: string[] };
   onUpdate: (updatedPaper: ExamPaper) => void;
   onBack: () => void;
   user: User;
}

const TEST_TYPES = [
   'Monthly Test',
   'Weekend Test',
   'Test Series',
   'Mid-Term Exam',
   'Final Exam',
   'Mock Test',
   'Unit Test',
   'Quiz',
   'Other'
];

const PaperEditor: React.FC<PaperEditorProps> = ({ paper, onBack, user }) => {
   const [currentPaper, setCurrentPaper] = useState<ExamPaper>({
      ...paper,
      questions: paper.questions || [],
      showQuestionMarks: paper.showQuestionMarks ?? true,
      longQuestionHeading: paper.longQuestionHeading ?? 'Subjective Part II',
      longQuestionHeadingUrdu: paper.longQuestionHeadingUrdu ?? 'حصہ دوم – تفصیلی سوالات',
      longQuestionInstruction: paper.longQuestionInstruction ?? 'Write detailed answers to the following questions.',
      longQuestionInstructionUrdu: paper.longQuestionInstructionUrdu ?? 'درج ذیل سوالات کے تفصیلی جوابات لکھیں۔'
   });
   const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
   const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);
   const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
   const [activeTab, setActiveTab] = useState<'editor' | 'preview'>('editor');
   const [activeSectionId, setActiveSectionId] = useState<string>('');

   // New States for Printing Options
   const [showPartHeadings, setShowPartHeadings] = useState(true);
   // Replaced showAnswers boolean with answerKeyDisplay tri-state
   const [answerKeyDisplay, setAnswerKeyDisplay] = useState<'none' | 'inline' | 'bottom'>('none');

   const [sectionConfig, setSectionConfig] = useState<PaperSectionConfig | null>(null);
   const [availableQuestions, setAvailableQuestions] = useState<Question[]>([]);
   const [isSearching, setIsSearching] = useState(false);
   const [isManualEditMode, setIsManualEditMode] = useState(false);

   // Typography & Layout Controls (Defaults: Question EN 14px, Question UR 14px, Option EN 9px, Option UR 6px, MCQ Cols 4)
   const [questionFontEn, setQuestionFontEn] = useState<number>(14);
   const [questionFontUr, setQuestionFontUr] = useState<number>(14);
   const [optionFontEn, setOptionFontEn] = useState<number>(9);
   const [optionFontUr, setOptionFontUr] = useState<number>(12);
   const [mcqColumns, setMcqColumns] = useState<number>(4);

   // Repository Data States
   const [repoQuestions, setRepoQuestions] = useState<Question[]>([]);
   const [allChapters, setAllChapters] = useState<any[]>([]);
   const [allTopics, setAllTopics] = useState<any[]>([]);
   const [availableQuestionTypes, setAvailableQuestionTypes] = useState<any[]>([]);

   const normalizeType = (t: string) => {
      const val = (t || '').toLowerCase().trim();
      if (val.includes('mcq') || val.includes('multiple choice') || val.includes('multi choice')) return 'mcq';
      if (val.includes('short')) return 'short';
      if (val.includes('long')) return 'long';
      return val;
   };

   /* Load data asynchronously on mount */
   useEffect(() => {
      const loadRepoData = async () => {
         const [qs, chs, tops, types] = await Promise.all([
            getQuestions({ pageSize: 1000, maxPages: 25, subject: paper.subject, classLevel: paper.classLevel }),
            getChapters(),
            getTopics(),
            getQuestionTypes()
         ]);
         setRepoQuestions(qs);
         setAllChapters(chs);
         setAllTopics(tops);
         setAvailableQuestionTypes(types);
      };
      loadRepoData();
   }, []);

   // Global Visibility/Extraction Language
   const [extractionLanguage, setExtractionLanguage] = useState<'English' | 'Urdu' | 'Bilingual'>(() => {
      const mediums = Object.values(paper.structure || {}).map(s => s.languageMedium).filter(Boolean) as Array<'English' | 'Urdu' | 'Bilingual'>;
      if (mediums.length === 0) return 'English';
      const first = mediums[0];
      const allSame = mediums.every(m => m === first);
      return allSame ? first : 'Bilingual';
   });

   // Filters for Modal - initialized with paper selection but mutable
   const [activeChapters, setActiveChapters] = useState<string[]>(paper.selectedChapters);
   const [activeTopics, setActiveTopics] = useState<string[]>(paper.selectedTopics);
   const [expandedChapters, setExpandedChapters] = useState<string[]>(paper.selectedChapters);

   // Dynamic Source & Type Filters based on availability
   const [activeSources, setActiveSources] = useState<string[]>([]);
   const [activeTypes, setActiveTypes] = useState<string[]>([]);
   const [questionMenuQuery, setQuestionMenuQuery] = useState('');
   const [questionMenuSort, setQuestionMenuSort] = useState<'default' | 'type' | 'marks'>('default');
   const [selectionStatusFilter, setSelectionStatusFilter] = useState<'all' | 'selected' | 'unselected'>('all');
   const [questionGridColumns, setQuestionGridColumns] = useState<1 | 2 | 3>(2);

   // Toggle State for Scope & Filter Dropdowns
   const [isScopeExpanded, setIsScopeExpanded] = useState(true);
   const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false);
   const [isSourceDropdownOpen, setIsSourceDropdownOpen] = useState(false);

   // Calculated Marks
   const totalCalculatedMarks = useMemo(() => {
      if (!currentPaper.questions || !Array.isArray(currentPaper.questions)) return 0;
      return currentPaper.questions.reduce((acc, q) => acc + (q.marks || 0), 0);
   }, [currentPaper.questions]);

   // Initializing Save Modal State with defaults
   const [saveForm, setSaveForm] = useState({
      title: currentPaper.title || '',
      totalMarks: totalCalculatedMarks,
      // Keep existing saved-paper details when the editor is opened again.
      examDate: currentPaper.examDate ? String(currentPaper.examDate).slice(0, 10) : new Date().toISOString().split('T')[0],
      durationMinutes: currentPaper.durationMinutes || 60,
      testType: currentPaper.testType || 'Monthly Test',
      isOnline: currentPaper.isOnline || false,
      languageMedium: (() => {
         const mediums = Object.values(currentPaper.structure || {}).map((s: any) => s.languageMedium).filter(Boolean) as Array<'English' | 'Urdu' | 'Bilingual'>;
         if (mediums.length === 0) return 'Bilingual';
         const first = mediums[0];
         const allSame = mediums.every(m => m === first);
         return allSame ? first : 'Bilingual';
      })() as 'English' | 'Urdu' | 'Bilingual'
   });

   // Sync save form marks when questions change
   useEffect(() => {
      setSaveForm(prev => ({ ...prev, totalMarks: totalCalculatedMarks }));
   }, [totalCalculatedMarks]);

   // --- DYNAMIC FILTER LOGIC ---

   // 1. First, get questions that match the broad Subject/Class context
   //    AND match the currently selected 'Active Scope' (Chapters/Topics checkboxes)
   const scopeFilteredQuestions = useMemo(() => {
      console.log("Filtering scope questions:", {
         subject: paper.subject,
         classLevel: paper.classLevel,
         activeChapters,
         activeTopics,
         totalRepo: repoQuestions.length
      });

      return repoQuestions.filter(q => {
         const matchSub = q.subject?.toLowerCase() === paper.subject?.toLowerCase();
         const matchCls = !q.classLevel || q.classLevel?.toLowerCase() === paper.classLevel?.toLowerCase();
         const matchChap = activeChapters.length === 0 || activeChapters.some(c => c.toLowerCase() === q.chapter?.toLowerCase());
         const matchTopic = activeTopics.length === 0 || activeTopics.some(t => t.toLowerCase() === q.topic?.toLowerCase());

         return matchSub && matchCls && matchChap && matchTopic;
      });
   }, [repoQuestions, paper.subject, paper.classLevel, activeChapters, activeTopics]);

   // 2. Derive available Types and Sources from this SCOPE-FILTERED set
   //    Updated to handle multiple sources per question array
   const availableTypesInScope = useMemo(() => {
      const counts: Record<string, number> = {};
      scopeFilteredQuestions.forEach(q => { counts[q.type] = (counts[q.type] || 0) + 1; });
      return Object.entries(counts).map(([type, count]) => ({ type, count }));
   }, [scopeFilteredQuestions]);

   const availableSourcesInScope = useMemo(() => {
      const counts: Record<string, number> = {};
      scopeFilteredQuestions.forEach(q => {
         // Handle array of sources or single source string
         const sources = q.sources && q.sources.length > 0 ? q.sources : (q.source ? [q.source] : []);
         sources.forEach(s => {
            if (s) counts[s] = (counts[s] || 0) + 1;
         });
      });
      return Object.entries(counts).map(([source, count]) => ({ source, count }));
   }, [scopeFilteredQuestions]);

   const handleOpenSelection = (sectionId: string) => {
      setActiveSectionId(sectionId);
      setSectionConfig(currentPaper.structure[sectionId]);
      setAvailableQuestions([]);

      // Reset Active Scope to Paper Defaults when opening modal
      setActiveChapters(paper.selectedChapters);
      setActiveTopics(paper.selectedTopics);
      setExpandedChapters(paper.selectedChapters);

      // Reset filters
      setActiveSources([]);
      setActiveTypes([currentPaper.structure[sectionId].questionType]); // Default to section type

      setIsSelectionModalOpen(true);
   };

   const handleOpenConfig = (sectionId: string) => {
      setActiveSectionId(sectionId);
      setSectionConfig({ ...currentPaper.structure[sectionId] }); // Clone to avoid direct mutation
      setIsConfigModalOpen(true);
   };

   const executeSearch = () => {
      setIsSearching(true);

      // Use the scopeFilteredQuestions as base, then apply Facet Filters (Type, Source)
      const filtered = scopeFilteredQuestions.filter(q => {
         // 2. Metadata Filter (Dynamic) - Updated for Array checking
         const qSources = q.sources && q.sources.length > 0 ? q.sources : (q.source ? [q.source] : []);
         // If no active sources filter, allow all. If active, question must have AT LEAST ONE of the selected sources.
         const matchesSource = activeSources.length === 0 || activeSources.some(filterSource => qSources.includes(filterSource));

         const normalizedQType = normalizeType(q.type);
         const matchesType = activeTypes.length === 0 || activeTypes.some(t => normalizeType(t) === normalizedQType);

         // 3. Language Filter
         let matchesLanguage = true;
         if (extractionLanguage === 'English') matchesLanguage = !!q.text;
         if (extractionLanguage === 'Urdu') matchesLanguage = !!q.textUrdu;
         if (extractionLanguage === 'Bilingual') matchesLanguage = !!q.text && !!q.textUrdu;

         return matchesSource && matchesType && matchesLanguage;
      });

      setTimeout(() => {
         setAvailableQuestions(filtered);
         setIsSearching(false);
      }, 400);
   };

   const handleRandomSelect = () => {
      if (!sectionConfig || availableQuestions.length === 0) return;
      const count = sectionConfig.totalCount;

      // Group available questions by chapter to enable balanced/equal distribution
      const chapterMap: Record<string, Question[]> = {};
      availableQuestions.forEach(q => {
         const chap = q.chapter || 'Other';
         if (!chapterMap[chap]) chapterMap[chap] = [];
         chapterMap[chap].push(q);
      });

      // Shuffle each chapter's questions
      Object.keys(chapterMap).forEach(chap => {
         chapterMap[chap].sort(() => 0.5 - Math.random());
      });

      // Determine chapters list: prioritize activeChapters, then whatever chapters exist in availableQuestions
      const uniqueChaps = Object.keys(chapterMap).sort((a, b) => {
         const aActive = activeChapters.includes(a);
         const bActive = activeChapters.includes(b);
         if (aActive && !bActive) return -1;
         if (!aActive && bActive) return 1;
         return 0;
      });

      const selected: Question[] = [];
      const selectedIds = new Set<string>();

      // Round-robin equal distribution across chapters
      let addedInRound = true;
      while (selected.length < count && addedInRound) {
         addedInRound = false;
         for (const chap of uniqueChaps) {
            if (selected.length >= count) break;
            const pool = chapterMap[chap];
            if (pool && pool.length > 0) {
               const nextQ = pool.shift();
               if (nextQ && !selectedIds.has(nextQ.id)) {
                  selected.push(nextQ);
                  selectedIds.add(nextQ.id);
                  addedInRound = true;
               }
            }
         }
      }

      // If still need more questions (unlikely), fill from remaining available questions
      if (selected.length < count) {
         const remaining = availableQuestions.filter(q => !selectedIds.has(q.id)).sort(() => 0.5 - Math.random());
         for (const q of remaining) {
            if (selected.length >= count) break;
            selected.push(q);
            selectedIds.add(q.id);
         }
      }

      const otherQuestions = currentPaper.questions.filter(q => q.sectionId !== activeSectionId);
      const newQuestions = selected.map(q => ({ ...q, sectionId: activeSectionId, marks: sectionConfig.marksPerQuestion }));
      setCurrentPaper(prev => ({ ...prev, questions: [...otherQuestions, ...newQuestions] }));
   };

   const clearSectionSelection = () => {
      setCurrentPaper(prev => ({
         ...prev,
         questions: prev.questions.filter(q => q.sectionId !== activeSectionId)
      }));
   };

   const selectedInActiveSection = useMemo(() => {
      return currentPaper.questions.filter(q => q.sectionId === activeSectionId).length;
   }, [currentPaper.questions, activeSectionId]);

   const displayedMenuQuestions = useMemo(() => {
      const q = questionMenuQuery.trim().toLowerCase();
      let list = availableQuestions;

      if (selectionStatusFilter === 'selected') {
         list = list.filter(item => currentPaper.questions.some(sq => (sq.id === item.id || sq.id.startsWith(item.id + '_')) && sq.sectionId === activeSectionId));
      } else if (selectionStatusFilter === 'unselected') {
         list = list.filter(item => !currentPaper.questions.some(sq => (sq.id === item.id || sq.id.startsWith(item.id + '_')) && sq.sectionId === activeSectionId));
      }

      if (q) {
         list = list.filter(item => {
            const hay = [
               item.text,
               item.textUrdu,
               item.topic,
               item.chapter,
               item.subject,
               item.classLevel,
               item.type
            ]
               .filter(Boolean)
               .join(' ')
               .toLowerCase();
            return hay.includes(q);
         });
      }

      if (questionMenuSort === 'type') {
         list = [...list].sort((a, b) => String(a.type || '').localeCompare(String(b.type || '')));
      } else if (questionMenuSort === 'marks') {
         list = [...list].sort((a, b) => (Number(b.marks || 0) - Number(a.marks || 0)));
      }

      return list;
   }, [availableQuestions, questionMenuQuery, questionMenuSort, selectionStatusFilter, currentPaper.questions, activeSectionId]);

   const toggleQuestionSelection = (q: Question) => {
      if (!sectionConfig) return;
      const isSelected = currentPaper.questions.some(sq => (sq.id === q.id || sq.id.startsWith(q.id + '_')) && sq.sectionId === activeSectionId);
      if (isSelected) {
         setCurrentPaper(prev => ({
            ...prev,
            questions: prev.questions.filter(sq => !((sq.id === q.id || sq.id.startsWith(q.id + '_')) && sq.sectionId === activeSectionId))
         }));
      } else {
         setCurrentPaper(prev => ({
            ...prev,
            questions: [...prev.questions, { ...q, sectionId: activeSectionId, marks: sectionConfig.marksPerQuestion }]
         }));
      }
   };

   const updateQuestionManual = (qId: string, sectionId: string, updates: Partial<Question>) => {
      setCurrentPaper(prev => ({
         ...prev,
         questions: prev.questions.map(q => (q.id === qId && q.sectionId === sectionId) ? { ...q, ...updates } : q)
      }));
   };

   const updateSectionConfigValues = (sectionId: string, updates: Partial<PaperSectionConfig>) => {
      if (!sectionId) return;
      setCurrentPaper(prev => {
         const currentSec = prev.structure[sectionId];
         if (!currentSec) return prev;
         const updatedSec = { ...currentSec, ...updates };
         if (updatedSec.selectCount > updatedSec.totalCount) {
            updatedSec.selectCount = updatedSec.totalCount;
         }
         return {
            ...prev,
            structure: {
               ...prev.structure,
               [sectionId]: updatedSec
            },
            questions: prev.questions.map(q =>
               q.sectionId === sectionId && !updatedSec.hasParts
                  ? { ...q, marks: updatedSec.marksPerQuestion }
                  : q
            )
         };
      });
      setSectionConfig(prev => {
         if (!prev || prev.id !== sectionId) return prev;
         const next = { ...prev, ...updates };
         if (next.selectCount > next.totalCount) {
            next.selectCount = next.totalCount;
         }
         return next;
      });
   };

   const updateSectionConfig = () => {
      if (!sectionConfig) return;
      setCurrentPaper(prev => ({
         ...prev,
         structure: {
            ...prev.structure,
            [activeSectionId]: sectionConfig
         },
         // Part-based sections retain each part's configured marks.
         questions: prev.questions.map(q =>
            q.sectionId === activeSectionId && !sectionConfig.hasParts
               ? { ...q, marks: sectionConfig.marksPerQuestion }
               : q
         )
      }));
      setIsConfigModalOpen(false);
   };

   const deleteSectionManual = (sId: string) => {
      if (!window.confirm("Permanently delete this entire section?")) return;
      setCurrentPaper(prev => {
         const newStructure = { ...prev.structure };
         delete newStructure[sId];
         return {
            ...prev,
            structure: newStructure,
            questions: prev.questions.filter(q => q.sectionId !== sId)
         };
      });
   };

   const addNewSection = () => {
      const id = `sec_${Date.now()}`;
      const nextNum = Object.keys(currentPaper.structure).length + 1;
      const newSec: PaperSectionConfig = {
         id,
         title: `Q.${nextNum} New Section`,
         questionType: 'Short Answer',
         marksPerQuestion: 2,
         totalCount: 5,
         selectCount: 5,
         blankLines: 0,
         blankLineType: 'Line',
         questionsPerLine: false,
         languageMedium: 'Bilingual',
         sourceFilter: [],
         category: 'Subjective',
         subQuestionNumbering: 'Numeric'
      };
      setCurrentPaper(prev => ({
         ...prev,
         structure: { ...prev.structure, [id]: newSec }
      }));
   };

   const updateSectionTitle = (sId: string, newTitle: string) => {
      setCurrentPaper(prev => ({
         ...prev,
         structure: {
            ...prev.structure,
            [sId]: { ...prev.structure[sId], title: newTitle }
         }
      }));
   };

   const getSectionSelectedCount = (id: string) => {
      return currentPaper.questions.filter(q => q.sectionId === id).length;
   };

   const handleFinalSave = async () => {
      const structureWithLanguage = Object.fromEntries(
         Object.entries(currentPaper.structure || {}).map(([id, sec]: any) => [id, { ...sec, languageMedium: saveForm.languageMedium }])
      );

      const fullPaperPayload: any = {
         ...currentPaper,
         questions: currentPaper.questions || [],
         title: saveForm.title,
         subject: currentPaper.subject,
         classLevel: currentPaper.classLevel,
         dateCreated: new Date().toISOString().split('T')[0],
         status: 'Finalized',
         author: user.name,
         totalMarks: saveForm.totalMarks,
         schoolId: user.schoolId || 's1',
         examDate: saveForm.examDate,
         testType: saveForm.testType,
         durationMinutes: saveForm.durationMinutes,
         isOnline: saveForm.isOnline,
         structure: structureWithLanguage
      };

      try {
         await savePaper(fullPaperPayload);
         setIsSaveModalOpen(false);
         alert('Paper successfully saved to institution repository!');
         onBack();
      } catch (error) {
         console.error("Save failed:", error);
         alert('Failed to save paper. Please check your connection and try again.');
      }
   };

   const sectionsByCategory = useMemo(() => {
      const obj: PaperSectionConfig[] = [];
      const subj: PaperSectionConfig[] = [];
      (Object.values(currentPaper.structure || {}) as PaperSectionConfig[]).forEach(sec => {
         // Use explicit category from config, or fallback to type logic
         if (sec.category === 'Objective') {
            obj.push(sec);
         } else {
            subj.push(sec);
         }
      });
      return { objective: obj, subjective: subj };
   }, [currentPaper.structure]);

   return (
      <div className="fixed inset-0 z-[200] flex bg-white overflow-hidden print:static">
         {/* ... (Existing Selection Modal Content) ... */}
         {/* SELECTION MODAL */}
         {isSelectionModalOpen && sectionConfig && (
            <div className="fixed inset-0 z-[250] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-1 sm:p-2 md:p-3 animate-in fade-in duration-300">
               <div className="bg-white w-full max-w-[98vw] h-[96vh] rounded-2xl md:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
                  {/* MAIN MODAL HEADER */}
                  <div className="px-4 sm:px-6 py-2 sm:py-3 border-b border-slate-100 flex flex-col gap-2 bg-white shrink-0">
                     <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                           <div className="w-9 h-9 sm:w-10 sm:h-10 bg-indigo-50 border border-indigo-100 rounded-xl flex items-center justify-center shadow-inner shrink-0">
                              <Library size={20} className="text-indigo-600" />
                           </div>
                           <div>
                              <div className="flex items-center gap-2 sm:gap-3">
                                 <h3 className="font-black text-lg sm:text-xl text-slate-900 tracking-tight">{sectionConfig.title}</h3>
                                 <span className="text-slate-300 font-medium text-lg sm:text-xl">|</span>
                                 <span className="text-slate-400 font-bold text-sm sm:text-base">Question Selection</span>
                              </div>
                              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-100 mt-0.5 inline-block">
                                 SUBJECT: {currentPaper.subject.toUpperCase()}
                              </span>
                           </div>
                        </div>
                        <button onClick={() => setIsSelectionModalOpen(false)} className="text-slate-300 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-full transition-all">
                           <X size={26} />
                        </button>
                     </div>

                     {/* EDITABLE SECTION PARAMETERS & FILTERS TOOLBAR */}
                      <div className="flex flex-wrap items-center gap-3 sm:gap-4 p-3 bg-slate-50 rounded-2xl border border-slate-200 relative">
                         <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-600">Total Questions:</label>
                            <input
                               type="number"
                               min="1"
                               max="100"
                               value={sectionConfig.totalCount}
                               onChange={(e) => {
                                  const val = Math.max(1, parseInt(e.target.value) || 1);
                                  updateSectionConfigValues(activeSectionId, { totalCount: val });
                               }}
                               className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-center outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                            />
                         </div>

                         <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-600">Attempt Question:</label>
                            <input
                               type="number"
                               min="1"
                               max={sectionConfig.totalCount}
                               value={sectionConfig.selectCount}
                               onChange={(e) => {
                                  const val = Math.max(1, parseInt(e.target.value) || 1);
                                  updateSectionConfigValues(activeSectionId, { selectCount: val });
                               }}
                               className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-center outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                            />
                         </div>

                         <div className="flex items-center gap-2">
                            <label className="text-xs font-bold text-slate-600">Marks / Question:</label>
                            <input
                               type="number"
                               min="0.5"
                               step="0.5"
                               value={sectionConfig.marksPerQuestion}
                               onChange={(e) => {
                                  const val = Math.max(0.5, parseFloat(e.target.value) || 1);
                                  updateSectionConfigValues(activeSectionId, { marksPerQuestion: val });
                               }}
                               className="w-16 px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-900 text-center outline-none focus:ring-2 focus:ring-indigo-500 shadow-2xs"
                            />
                         </div>

                         {/* QUESTION TYPES DROPDOWN POPOVER - SINGLE SELECT ONLY */}
                         <div className="relative">
                            <button
                               type="button"
                               onClick={() => {
                                  setIsTypeDropdownOpen(!isTypeDropdownOpen);
                                  setIsSourceDropdownOpen(false);
                               }}
                               className="px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-500 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
                            >
                               <ListFilter size={14} className="text-indigo-600" />
                               <span>Type: <strong className="text-indigo-600">{activeTypes.length > 0 ? activeTypes[0] : 'All'}</strong></span>
                               <ChevronDown size={14} className={`text-slate-400 transition-transform ${isTypeDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isTypeDropdownOpen && (
                               <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in duration-150">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                                     <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Question Type (Single)</span>
                                     <button
                                        type="button"
                                        onClick={() => { setActiveTypes([]); setIsTypeDropdownOpen(false); }}
                                        className="text-[10px] font-bold text-slate-400 hover:text-indigo-600"
                                     >
                                        Any Type
                                     </button>
                                  </div>
                                  <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                     {availableTypesInScope.map(({ type, count }) => {
                                        const isSelected = activeTypes.includes(type);
                                        return (
                                           <label
                                              key={type}
                                              onClick={() => {
                                                 // Single-select: toggle to this type only or unselect if clicked again
                                                 setActiveTypes(isSelected ? [] : [type]);
                                                 setIsTypeDropdownOpen(false);
                                              }}
                                              className={`flex items-center justify-between cursor-pointer p-1.5 rounded-lg transition-colors ${
                                                 isSelected ? 'bg-indigo-50 text-indigo-900 font-bold' : 'hover:bg-slate-50 text-slate-700'
                                              }`}
                                           >
                                              <div className="flex items-center gap-2">
                                                 <input
                                                    type="radio"
                                                    name="single_question_type"
                                                    checked={isSelected}
                                                    onChange={() => {}}
                                                    className="w-4 h-4 border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                                 />
                                                 <span className="text-xs">{type}</span>
                                              </div>
                                              <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">{count}</span>
                                           </label>
                                        );
                                     })}
                                  </div>
                               </div>
                            )}
                         </div>

                         {/* QUESTION SOURCE DROPDOWN POPOVER */}
                         <div className="relative">
                            <button
                               type="button"
                               onClick={() => {
                                  setIsSourceDropdownOpen(!isSourceDropdownOpen);
                                  setIsTypeDropdownOpen(false);
                               }}
                               className="px-3 py-1.5 bg-white border border-slate-300 hover:border-indigo-500 rounded-xl text-xs font-bold text-slate-700 flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
                            >
                               <Filter size={14} className="text-indigo-600" />
                               <span>Sources ({activeSources.length > 0 ? activeSources.length : 'All'})</span>
                               <ChevronDown size={14} className={`text-slate-400 transition-transform ${isSourceDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isSourceDropdownOpen && (
                               <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in duration-150">
                                  <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-2">
                                     <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest">Question Source</span>
                                     <button
                                        type="button"
                                        onClick={() => setActiveSources([])}
                                        className="text-[10px] font-bold text-slate-400 hover:text-indigo-600"
                                     >
                                        Select All
                                     </button>
                                  </div>
                                  <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                     {availableSourcesInScope.map(({ source, count }) => (
                                        <label key={source} className="flex items-center justify-between cursor-pointer p-1.5 rounded-lg hover:bg-slate-50 transition-colors">
                                           <div className="flex items-center gap-2">
                                              <input
                                                 type="checkbox"
                                                 checked={activeSources.includes(source)}
                                                 onChange={() => setActiveSources(prev => prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source])}
                                                 className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                                              />
                                              <span className="text-xs font-bold text-slate-700">{source}</span>
                                           </div>
                                           <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">{count}</span>
                                        </label>
                                     ))}
                                  </div>
                               </div>
                            )}
                         </div>

                         {/* FETCH QUESTIONS BUTTON */}
                         <button
                            type="button"
                            onClick={executeSearch}
                            disabled={isSearching}
                            className="px-4 py-1.5 bg-[#1a202c] hover:bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                         >
                            {isSearching ? <RefreshCw className="animate-spin" size={14} /> : <Search size={14} />}
                            <span>Fetch Questions</span>
                         </button>

                         <div className="sm:ml-auto flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                            <span>Total Section Marks: {sectionConfig.selectCount * sectionConfig.marksPerQuestion}</span>
                         </div>
                      </div>

                      {/* HORIZONTAL ACTIVE SCOPE (Chapters & Topics - TOGGLEABLE / COLLAPSIBLE) */}
                      <div className="p-3 bg-indigo-50/40 rounded-2xl border border-indigo-100 flex flex-col gap-2">
                         <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                               <span className="text-[11px] font-black text-indigo-700 uppercase tracking-widest flex items-center gap-2">
                                  <BookOpen size={14} /> Active Scope (Chapters & Topics)
                               </span>
                               <span className="text-[10px] font-bold text-indigo-800 bg-indigo-100/70 px-2 py-0.5 rounded-md">
                                  {activeChapters.length} Chapters &bull; {activeTopics.length} Topics Active
                               </span>
                            </div>

                            <button
                               type="button"
                               onClick={() => setIsScopeExpanded(!isScopeExpanded)}
                               className="px-3 py-1 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
                               title={isScopeExpanded ? 'Reduce Active Scope' : 'Expand Active Scope'}
                            >
                               {isScopeExpanded ? (
                                  <>
                                     <ChevronUp size={14} /> Reduce Scope
                                  </>
                               ) : (
                                  <>
                                     <ChevronDown size={14} /> Expand Scope
                                  </>
                               )}
                            </button>
                         </div>

                         {isScopeExpanded ? (
                            <div className="flex flex-wrap items-start gap-3 overflow-x-auto custom-scrollbar pb-1 max-h-48 animate-in fade-in duration-200">
                               {paper.selectedChapters.length > 0 ? (
                                  paper.selectedChapters.map(chap => {
                                     const isChapActive = activeChapters.includes(chap);
                                     const isExpanded = expandedChapters.includes(chap);
                                     const chapterId = allChapters.find(c => c.name === chap)?.id;
                                     const topicsInChapter = allTopics.filter(t => t.chapterId === chapterId);

                                     return (
                                        <div key={chap} className="flex flex-col bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden min-w-[200px] max-w-xs flex-1">
                                           <div className="flex items-center justify-between gap-2 px-3 py-2 bg-slate-50 border-b border-slate-100">
                                              <label className="flex items-center gap-2 cursor-pointer group flex-1 min-w-0">
                                                 <div className="relative flex items-center justify-center shrink-0">
                                                    <input
                                                       type="checkbox"
                                                       checked={isChapActive}
                                                       onChange={() => {
                                                          if (isChapActive) {
                                                             setActiveChapters(prev => prev.filter(c => c !== chap));
                                                             const topicNames = topicsInChapter.map(t => t.name);
                                                             setActiveTopics(prev => prev.filter(t => !topicNames.includes(t)));
                                                          } else {
                                                             setActiveChapters(prev => [...prev, chap]);
                                                             setExpandedChapters(prev => Array.from(new Set([...prev, chap])));
                                                             const topicNames = topicsInChapter.map(t => t.name);
                                                             setActiveTopics(prev => Array.from(new Set([...prev, ...topicNames])));
                                                          }
                                                       }}
                                                       className="peer appearance-none w-4 h-4 rounded border-2 border-slate-300 checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer"
                                                    />
                                                    <Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={4} />
                                                 </div>
                                                 <span className={`text-xs font-bold leading-tight truncate ${isChapActive ? 'text-slate-900' : 'text-slate-400'}`}>{chap}</span>
                                              </label>

                                              <button
                                                 type="button"
                                                 onClick={() => {
                                                    if (isExpanded) setExpandedChapters(prev => prev.filter(c => c !== chap));
                                                    else setExpandedChapters(prev => Array.from(new Set([...prev, chap])));
                                                 }}
                                                 className="p-1 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-700 transition-colors shrink-0"
                                                 title="Toggle topics list"
                                              >
                                                 {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                              </button>
                                           </div>

                                           {/* HORIZONTAL EXPANDABLE TOPIC BOX */}
                                           {isExpanded && topicsInChapter.length > 0 && (
                                              <div className="p-2.5 bg-white space-y-2 max-h-32 overflow-y-auto custom-scrollbar">
                                                 <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase">Topics ({topicsInChapter.length})</span>
                                                    <div className="flex items-center gap-2">
                                                       <button
                                                          type="button"
                                                          onClick={() => {
                                                             const topicNames = topicsInChapter.map(t => t.name);
                                                             setActiveTopics(prev => Array.from(new Set([...prev, ...topicNames])));
                                                          }}
                                                          className="text-[9px] font-bold text-indigo-600 hover:underline"
                                                       >
                                                          All
                                                       </button>
                                                       <span className="text-slate-300">|</span>
                                                       <button
                                                          type="button"
                                                          onClick={() => {
                                                             const topicNames = topicsInChapter.map(t => t.name);
                                                             setActiveTopics(prev => prev.filter(t => !topicNames.includes(t)));
                                                          }}
                                                          className="text-[9px] font-bold text-slate-400 hover:text-red-500"
                                                       >
                                                          Clear
                                                       </button>
                                                    </div>
                                                 </div>

                                                 <div className="space-y-1">
                                                    {topicsInChapter.map(t => {
                                                       const isTopicActive = activeTopics.includes(t.name);
                                                       return (
                                                          <label key={t.id} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-slate-50 transition-colors">
                                                             <div className="relative flex items-center justify-center shrink-0">
                                                                <input
                                                                   type="checkbox"
                                                                   checked={isTopicActive}
                                                                   onChange={() => {
                                                                      if (isTopicActive) setActiveTopics(prev => prev.filter(top => top !== t.name));
                                                                      else setActiveTopics(prev => [...prev, t.name]);
                                                                   }}
                                                                   className="peer appearance-none w-3.5 h-3.5 rounded border border-slate-300 checked:bg-purple-600 checked:border-purple-600 transition-all cursor-pointer"
                                                                />
                                                                <Check className="absolute w-2.5 h-2.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={4} />
                                                             </div>
                                                             <span className={`text-[11px] font-medium leading-tight truncate ${isTopicActive ? 'text-purple-900 font-bold' : 'text-slate-600'}`}>
                                                                {t.name}
                                                             </span>
                                                          </label>
                                                       );
                                                    })}
                                                 </div>
                                              </div>
                                           )}
                                        </div>
                                     );
                                  })
                               ) : (
                                  <p className="text-xs text-slate-400 italic">No specific chapters selected.</p>
                               )}
                            </div>
                         ) : (
                            <div className="flex flex-wrap items-center gap-2 pt-1">
                               {activeChapters.length > 0 ? (
                                  activeChapters.map(chap => (
                                     <span key={chap} className="px-2.5 py-1 bg-white text-indigo-800 rounded-lg text-[11px] font-bold border border-indigo-200 shadow-2xs flex items-center gap-1">
                                        📖 {chap}
                                     </span>
                                  ))
                               ) : (
                                  <span className="text-xs text-slate-400 italic">No active scope selected.</span>
                               )}
                            </div>
                         )}
                      </div>
                   </div>

                  <div className="flex-1 flex flex-col overflow-hidden min-h-0">
                     {/* CONTENT AREA - FULL WIDTH WITH DEDICATED VERTICAL SCROLLBAR & SCROLL DOWN */}
                     <main className="flex-1 bg-white p-4 sm:p-6 md:p-8 overflow-y-auto custom-scrollbar relative min-h-0">
                        {isSearching ? (
                           <div className="h-full flex flex-col items-center justify-center space-y-6 py-12">
                              <div className="w-20 h-20 border-[6px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
                              <p className="text-slate-400 font-black uppercase tracking-widest text-sm animate-pulse">Scanning Repository...</p>
                           </div>
                        ) : availableQuestions.length === 0 ? (
                           <div className="h-full flex flex-col items-center justify-center text-slate-300 py-12">
                              <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                                 <Search size={56} className="opacity-50" />
                              </div>
                              <p className="font-black uppercase tracking-[0.2em] text-sm text-center">NO QUESTIONS FOUND.<br /><span className="text-xs text-slate-400 font-bold mt-2 block">Try adjusting your filters or active scope.</span></p>
                           </div>
                        ) : (
                           <div className="space-y-3 animate-in slide-in-from-bottom-4 duration-300 pb-8">
                              <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 md:-mx-8 px-4 sm:px-6 md:px-8 pt-2 pb-4 bg-white/95 backdrop-blur border-b border-slate-100 shadow-2xs">
                                 <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-3">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                       {/* TABS: ALL / SELECTED / UNSELECTED */}
                                       <div className="flex items-center bg-slate-100/90 p-1 rounded-2xl border border-slate-200/80 gap-1 overflow-x-auto custom-scrollbar">
                                          <button
                                             type="button"
                                             onClick={() => setSelectionStatusFilter('all')}
                                             className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                                selectionStatusFilter === 'all'
                                                   ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-200'
                                                   : 'text-slate-500 hover:text-slate-900'
                                             }`}
                                          >
                                             <span>All Questions</span>
                                             <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                                selectionStatusFilter === 'all' ? 'bg-indigo-50 text-indigo-700' : 'bg-slate-200/80 text-slate-600'
                                             }`}>
                                                {availableQuestions.length}
                                             </span>
                                          </button>

                                          <button
                                             type="button"
                                             onClick={() => setSelectionStatusFilter('selected')}
                                             className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                                selectionStatusFilter === 'selected'
                                                   ? 'bg-white text-emerald-700 shadow-xs ring-1 ring-slate-200'
                                                   : 'text-slate-500 hover:text-slate-900'
                                             }`}
                                          >
                                             <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                             <span>Selected</span>
                                             <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                                selectionStatusFilter === 'selected' ? 'bg-emerald-50 text-emerald-800' : 'bg-slate-200/80 text-slate-600'
                                             }`}>
                                                {availableQuestions.filter(q => currentPaper.questions.some(sq => (sq.id === q.id || sq.id.startsWith(q.id + '_')) && sq.sectionId === activeSectionId)).length}
                                             </span>
                                          </button>

                                          <button
                                             type="button"
                                             onClick={() => setSelectionStatusFilter('unselected')}
                                             className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
                                                selectionStatusFilter === 'unselected'
                                                   ? 'bg-white text-amber-700 shadow-xs ring-1 ring-slate-200'
                                                   : 'text-slate-500 hover:text-slate-900'
                                             }`}
                                          >
                                             <span className="w-2 h-2 rounded-full bg-amber-400"></span>
                                             <span>Unselected</span>
                                             <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                                                selectionStatusFilter === 'unselected' ? 'bg-amber-50 text-amber-800' : 'bg-slate-200/80 text-slate-600'
                                             }`}>
                                                {availableQuestions.filter(q => !currentPaper.questions.some(sq => (sq.id === q.id || sq.id.startsWith(q.id + '_')) && sq.sectionId === activeSectionId)).length}
                                             </span>
                                          </button>
                                       </div>

                                       <div className="flex items-center gap-3">
                                          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                             {displayedMenuQuestions.length} Shown • {selectedInActiveSection} Total Selected
                                          </span>
                                       </div>
                                    </div>

                                    <div className="flex flex-wrap gap-2.5 sm:items-center">
                                       <div className="relative flex-1 min-w-[200px]">
                                          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                          <input
                                             value={questionMenuQuery}
                                             onChange={(e) => setQuestionMenuQuery(e.target.value)}
                                             placeholder="Search in results…"
                                             className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-semibold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                                          />
                                       </div>

                                       {/* COLUMNS FORM TOGGLE */}
                                       <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                                          <span className="text-[10px] font-black text-slate-400 uppercase px-1.5 hidden md:inline">Cols:</span>
                                          {[1, 2, 3].map((cols) => (
                                             <button
                                                key={cols}
                                                type="button"
                                                onClick={() => setQuestionGridColumns(cols as any)}
                                                className={`px-2.5 py-1 rounded-lg text-xs font-black transition-all ${
                                                   questionGridColumns === cols
                                                      ? 'bg-white text-indigo-600 shadow-xs ring-1 ring-slate-200'
                                                      : 'text-slate-500 hover:text-slate-800'
                                                }`}
                                                title={`View in ${cols} column${cols > 1 ? 's' : ''}`}
                                             >
                                                {cols} Col{cols > 1 ? 's' : ''}
                                             </button>
                                          ))}
                                       </div>

                                       <select
                                          value={questionMenuSort}
                                          onChange={(e) => setQuestionMenuSort(e.target.value as any)}
                                          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500"
                                          title="Sort"
                                       >
                                          <option value="default">Sort: Default</option>
                                          <option value="type">Sort: Type</option>
                                          <option value="marks">Sort: Marks</option>
                                       </select>

                                       <button
                                          onClick={clearSectionSelection}
                                          className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs sm:text-sm font-black text-slate-600 hover:bg-slate-50 hover:text-red-600 transition-colors cursor-pointer"
                                          title="Clear selected questions for this section"
                                       >
                                          Clear Selected
                                       </button>
                                    </div>
                                 </div>
                               </div>

                               {/* QUESTION LIST IN COLUMNS / GRID VIEW */}
                               <div className={`grid gap-2.5 ${
                                  questionGridColumns === 1
                                     ? 'grid-cols-1'
                                     : questionGridColumns === 2
                                     ? 'grid-cols-1 lg:grid-cols-2'
                                     : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
                               }`}>
                               {displayedMenuQuestions.map((q, idx) => {
                                 const isSelectedInThisSection = currentPaper.questions.some(sq => (sq.id === q.id || sq.id.startsWith(q.id + '_')) && sq.sectionId === activeSectionId);
                                 const isSelectedInOtherSection = currentPaper.questions.some(sq => (sq.id === q.id || sq.id.startsWith(q.id + '_')) && sq.sectionId !== activeSectionId);
                                 const isSelected = isSelectedInThisSection || isSelectedInOtherSection;
                                 const showEnglish = (extractionLanguage === 'Bilingual' || extractionLanguage === 'English') && !!q.text;
                                 const showUrdu = (extractionLanguage === 'Bilingual' || extractionLanguage === 'Urdu') && !!q.textUrdu;
                                 const isTwoColumn = showEnglish && showUrdu;

                                 return (
                                    <div key={q.id} onClick={() => toggleQuestionSelection(q)} className={`p-2 sm:p-2.5 rounded-lg border transition-all cursor-pointer group relative overflow-hidden flex flex-col justify-between ${isSelectedInThisSection ? 'border-indigo-500 bg-indigo-50/25 shadow-xs ring-1 ring-indigo-400' : isSelectedInOtherSection ? 'border-amber-400 bg-amber-50/15 shadow-2xs' : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50/50'}`}>
                                       {isSelectedInThisSection && <div className="absolute top-0 right-0 w-6 h-6 bg-indigo-600 flex items-center justify-center rounded-bl-md text-white shadow-xs"><Check size={11} strokeWidth={3.5} /></div>}
                                       <div className="flex gap-2 items-start">
                                          <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all font-bold text-[10px] ${isSelectedInThisSection ? 'bg-indigo-600 border-indigo-600 text-white' : isSelectedInOtherSection ? 'bg-amber-500 border-amber-500 text-white' : 'border-slate-300 bg-slate-50 text-slate-500'}`}>{idx + 1}</div>
                                          <div className="flex-1 space-y-1 min-w-0 pr-3">
                                             {/* CHAPTER, TOPIC, TYPE BADGES & SOURCES (TOP BAR) */}
                                             <div className="flex flex-wrap items-center justify-between gap-1">
                                                <div className="flex flex-wrap items-center gap-1">
                                                   {q.chapter && (
                                                      <span className="px-1.5 py-0.2 bg-indigo-50 text-indigo-700 rounded text-[9px] font-bold tracking-tight border border-indigo-100 flex items-center gap-0.5">
                                                         📖 {q.chapter}
                                                      </span>
                                                   )}
                                                   {q.topic && (
                                                      <span className="px-1.5 py-0.2 bg-purple-50 text-purple-700 rounded text-[9px] font-bold tracking-tight border border-purple-100 flex items-center gap-0.5">
                                                         🏷️ {q.topic}
                                                      </span>
                                                   )}
                                                   <span className="px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded text-[9px] font-bold uppercase tracking-wider shrink-0 border border-slate-200">
                                                      {q.type}
                                                   </span>
                                                   {isSelectedInThisSection && (
                                                      <span className="px-1.5 py-0.2 bg-emerald-600 text-white rounded text-[9px] font-bold tracking-tight flex items-center gap-0.5 shadow-2xs">
                                                         <Check size={8} strokeWidth={3} /> In Section
                                                      </span>
                                                   )}
                                                   {isSelectedInOtherSection && (
                                                      <span className="px-1.5 py-0.2 bg-amber-500 text-white rounded text-[9px] font-bold tracking-tight flex items-center gap-0.5 shadow-2xs">
                                                         In Another Section
                                                      </span>
                                                   )}
                                                </div>

                                                <div className="flex flex-wrap items-center gap-1 ml-auto">
                                                   {q.sources && q.sources.length > 0 ? q.sources.map(s => (
                                                      <span key={s} className="px-1.5 py-0.2 bg-white text-slate-400 rounded text-[8.5px] font-bold uppercase tracking-wider border border-slate-200 whitespace-nowrap">
                                                         {s}
                                                      </span>
                                                   )) : (
                                                      <span className="px-1.5 py-0.2 bg-white text-slate-400 rounded text-[8.5px] font-bold uppercase tracking-wider border border-slate-200 whitespace-nowrap">
                                                         {q.source}
                                                      </span>
                                                   )}
                                                </div>
                                             </div>

                                             {/* 2-COLUMN SIDE-BY-SIDE STATEMENTS: ENGLISH ON LEFT, URDU ON RIGHT */}
                                             <div className={`grid ${isTwoColumn ? 'grid-cols-1 md:grid-cols-2 gap-2 md:gap-4' : 'grid-cols-1'} items-start pt-0.5`}>
                                                {showEnglish && q.text && (
                                                   <div className="text-left text-xs sm:text-[13px] font-bold text-slate-800 leading-tight">
                                                      <MathRenderer text={q.text} />
                                                   </div>
                                                )}
                                                {showUrdu && q.textUrdu && (
                                                   <div className="font-urdu text-[13px] sm:text-[14px] text-slate-700 leading-snug text-right" dir="rtl">
                                                      <MathRenderer text={q.textUrdu} />
                                                   </div>
                                                )}
                                             </div>

                                             {q.imageUrl && (
                                                <div className="mt-1 p-0.5 bg-slate-50 rounded border border-slate-100 w-fit">
                                                   <img src={q.imageUrl} alt="Question Diagram" className="h-10 sm:h-12 w-auto object-contain rounded" />
                                                </div>
                                             )}

                                             {/* MCQ OPTIONS WITH COMPACT SIDE-BY-SIDE ENGLISH & URDU */}
                                             {normalizeType(q.type) === 'mcq' && ((q.options && q.options.length > 0) || (q.optionsUrdu && q.optionsUrdu.length > 0)) && (
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1 mt-1 pt-1 border-t border-slate-100">
                                                   {((q.options && q.options.length > 0) ? q.options : (q.optionsUrdu || [])).map((opt: string, i: number) => (
                                                      <div key={i} className="flex items-center justify-between gap-1.5 px-2 py-0.5 rounded bg-slate-50 border border-slate-100 text-[11px] leading-tight text-slate-700">
                                                         <div className="flex items-center gap-1 min-w-0">
                                                            <span className="font-black text-indigo-600 text-[10px]">({String.fromCharCode(65 + i)})</span>
                                                            <span className="font-medium truncate"><MathRenderer text={opt} inline /></span>
                                                         </div>
                                                         {q.optionsUrdu && q.optionsUrdu[i] && (
                                                            <span className="text-right font-urdu text-[11px] leading-tight text-slate-600 shrink-0 ml-1" dir="rtl">
                                                               <MathRenderer text={q.optionsUrdu[i]} />
                                                            </span>
                                                         )}
                                                      </div>
                                                   ))}
                                                </div>
                                             )}

                                             {/* QUESTION CARD ACTION BAR (SELECT / UNSELECT TOGGLE) */}
                                             <div className="flex items-center justify-between pt-1.5 mt-1 border-t border-slate-100">
                                                <div className="text-[10px] font-bold text-slate-400">
                                                   {isSelectedInThisSection ? (
                                                      <span className="text-emerald-600 flex items-center gap-1 font-black">
                                                         <Check size={11} strokeWidth={3} /> Currently Selected in this Section
                                                      </span>
                                                   ) : isSelectedInOtherSection ? (
                                                      <span className="text-amber-600 font-bold">Selected in another section</span>
                                                   ) : (
                                                      <span>Click anywhere on card or button to select</span>
                                                   )}
                                                </div>

                                                <button
                                                   type="button"
                                                   onClick={(e) => {
                                                      e.stopPropagation();
                                                      toggleQuestionSelection(q);
                                                   }}
                                                   className={`px-3 py-1 rounded-lg text-[11px] font-black transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                                                      isSelectedInThisSection
                                                         ? 'bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200'
                                                         : 'bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 border border-indigo-200'
                                                   }`}
                                                   title={isSelectedInThisSection ? 'Unselect this question' : 'Select this question'}
                                                >
                                                   {isSelectedInThisSection ? (
                                                      <>
                                                         <X size={12} strokeWidth={3} /> Unselect
                                                      </>
                                                   ) : (
                                                      <>
                                                         <Plus size={12} strokeWidth={3} /> Select Question
                                                      </>
                                                   )}
                                                </button>
                                             </div>
                                          </div>
                                       </div>
                                    </div>
                                 );
                              })}
                               </div>
                            </div>
                         )}
                      </main>
                   </div>

                  {/* MODAL FOOTER */}
                  <div className="px-4 sm:px-6 py-2.5 sm:py-3 border-t border-slate-100 bg-white flex flex-col sm:flex-row justify-between items-center gap-3 sm:gap-4 shrink-0 shadow-[0_-6px_20px_rgba(0,0,0,0.02)]">
                     <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">PROGRESS:</p>
                        <div className="flex items-baseline gap-1.5">
                           <span className={`text-2xl sm:text-3xl font-black tracking-tight tabular-nums ${getSectionSelectedCount(activeSectionId) === (sectionConfig?.totalCount || 0) ? 'text-emerald-600' : 'text-indigo-600'}`}>
                              {getSectionSelectedCount(activeSectionId)}
                           </span>
                           <span className="text-slate-300 font-bold text-xl">/</span>
                           <span className="text-slate-400 font-black text-2xl sm:text-3xl tracking-tight tabular-nums">{sectionConfig?.totalCount}</span>
                        </div>
                        {(() => {
                            const cur = getSectionSelectedCount(activeSectionId);
                            const tot = sectionConfig?.totalCount || 0;
                            if (cur < tot) {
                               return (
                                  <span className="px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[11px] font-bold">
                                     Select {tot - cur} more question{tot - cur > 1 ? 's' : ''} to deploy
                                  </span>
                               );
                            } else if (cur > tot) {
                               return (
                                  <span className="px-2 py-0.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-md text-[11px] font-bold">
                                     {cur - tot} question{cur - tot > 1 ? 's' : ''} extra (unselect {cur - tot} to deploy)
                                  </span>
                               );
                            } else {
                               return (
                                  <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md text-[11px] font-bold flex items-center gap-1">
                                     <Check size={12} strokeWidth={3} /> Exact count matched! Ready to deploy
                                  </span>
                               );
                            }
                         })()}
                     </div>
                     <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                        <button onClick={handleRandomSelect} disabled={availableQuestions.length === 0} className="px-4 sm:px-6 py-2 bg-white border border-slate-300 text-slate-700 font-bold uppercase tracking-wider rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 transition-all text-xs flex items-center gap-2 active:scale-95 cursor-pointer shadow-2xs">
                           <Sparkles size={14} /> SMART RANDOM
                        </button>
                        {(() => {
                           const cur = getSectionSelectedCount(activeSectionId);
                           const tot = sectionConfig?.totalCount || 0;
                           const canDeploy = cur === tot;

                           return (
                              <button
                                 type="button"
                                 disabled={!canDeploy}
                                 onClick={() => {
                                    if (!canDeploy) return;
                                    setCurrentPaper({ ...currentPaper, structure: { ...currentPaper.structure, [activeSectionId]: sectionConfig } });
                                    setIsSelectionModalOpen(false);
                                 }}
                                 className={`px-6 sm:px-8 py-2 font-bold uppercase tracking-wider rounded-xl shadow-md transition-all text-xs active:scale-95 ${
                                    canDeploy
                                       ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-200 cursor-pointer'
                                       : 'bg-slate-200 text-slate-400 border border-slate-300 shadow-none cursor-not-allowed opacity-80'
                                 }`}
                                 title={
                                    canDeploy
                                       ? 'Deploy selected questions to canvas'
                                       : `Cannot deploy: exactly ${tot} question${tot === 1 ? '' : 's'} required (${cur} currently selected)`
                                 }
                              >
                                 DEPLOY TO CANVAS
                              </button>
                           );
                        })()}
                     </div>
                  </div>
               </div>
            </div>
         )}

         {/* SAVE PAPER MODAL */}
         {isSaveModalOpen && (
            <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
               <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
                  <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                     <div>
                        <h3 className="font-black text-xl text-gray-900 tracking-tight flex items-center gap-2">
                           <Save size={24} className="text-indigo-600" /> Save Examination Paper
                        </h3>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Institutional Repository Integration</p>
                     </div>
                     <button onClick={() => setIsSaveModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={24} /></button>
                  </div>

                  <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                     <div className="space-y-4">
                        <div>
                           <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                              <FileText size={14} /> Name of Paper
                           </label>
                           <input
                              type="text"
                              value={saveForm.title}
                              onChange={e => setSaveForm({ ...saveForm, title: e.target.value })}
                              placeholder="e.g. Physics Mid-Term Assessment"
                              className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                           />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                 <Check size={14} /> Total Marks
                              </label>
                              <input
                                 type="number"
                                 value={saveForm.totalMarks}
                                 onChange={e => setSaveForm({ ...saveForm, totalMarks: parseInt(e.target.value) || 0 })}
                                 className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                              />
                              <p className="text-[9px] text-indigo-500 font-bold mt-1 uppercase">Calculated: {totalCalculatedMarks}</p>
                           </div>
                           <div>
                              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                 <Clock size={14} /> Duration (Mins)
                              </label>
                              <input
                                 type="number"
                                 value={saveForm.durationMinutes}
                                 onChange={e => setSaveForm({ ...saveForm, durationMinutes: parseInt(e.target.value) || 60 })}
                                 className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                              />
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div>
                              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                 <Calendar size={14} /> Exam Date
                              </label>
                              <input
                                 type="date"
                                 value={saveForm.examDate}
                                 onChange={e => setSaveForm({ ...saveForm, examDate: e.target.value })}
                                 className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                              />
                           </div>
                           <div>
                              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                 <ClipboardList size={14} /> Test Type
                              </label>
                              <select
                                 value={saveForm.testType}
                                 onChange={e => setSaveForm({ ...saveForm, testType: e.target.value })}
                                 className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                              >
                                 {TEST_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                              </select>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                           <div className="col-span-2">
                              <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                 <Languages size={14} /> Paper Language
                              </label>
                              <select
                                 value={saveForm.languageMedium}
                                 onChange={e => setSaveForm({ ...saveForm, languageMedium: e.target.value as any })}
                                 className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                              >
                                 <option value="Bilingual">Bilingual (English + Urdu)</option>
                                 <option value="English">Only English</option>
                                 <option value="Urdu">Only Urdu</option>
                              </select>
                           </div>
                        </div>

                        <div className="pt-2">
                           <button
                              onClick={() => setSaveForm({ ...saveForm, isOnline: !saveForm.isOnline })}
                              className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${saveForm.isOnline ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-100' : 'bg-white border-gray-100 text-gray-400'}`}
                           >
                              <div className="flex items-center gap-3">
                                 {saveForm.isOnline ? <CheckSquare size={20} /> : <Square size={20} />}
                                 <div className="text-left">
                                    <p className="text-[11px] font-black uppercase tracking-widest">Online Examination</p>
                                    <p className={`text-[10px] font-bold ${saveForm.isOnline ? 'text-indigo-200' : 'text-gray-400'}`}>Make available in student portal</p>
                                 </div>
                              </div>
                              {saveForm.isOnline && <Globe size={18} className="animate-pulse" />}
                           </button>
                        </div>
                     </div>

                     <div className="bg-indigo-50 p-5 rounded-3xl border border-indigo-100 flex items-start gap-4">
                        <InfoIcon className="text-indigo-600 mt-1" size={20} />
                        <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                           Once saved, this paper will be accessible under the <strong>Saved Papers</strong> module in the institutional dashboard for future printing or editing.
                        </p>
                     </div>
                  </div>

                  <div className="p-8 border-t border-slate-100 bg-gray-50 flex gap-4">
                     <button onClick={() => setIsSaveModalOpen(false)} className="flex-1 py-4 text-sm font-black uppercase tracking-widest text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-2xl transition-all">Discard</button>
                     <button
                        onClick={handleFinalSave}
                        className="flex-[2] py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 transition-all"
                     >
                        <Check size={20} /> Finalize & Save
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* INSTITUTIONAL SIDEBAR */}
         <aside className="w-80 bg-slate-900 flex flex-col h-full shrink-0 border-r border-slate-800 z-50 print:hidden relative shadow-2xl overflow-y-auto">
            <div className="p-8 border-b border-slate-800 bg-slate-950/50 flex flex-col items-center">
               <div className="w-20 h-20 bg-white rounded-2xl p-3 shadow-2xl mb-4 border border-white/10 overflow-hidden">
                  <img src={currentPaper.headerConfig?.logoUrl || '/logo.png'} className="w-full h-full object-contain" />
               </div>
               <h4 className="text-white font-bold text-center text-xs tracking-tight line-clamp-1">{currentPaper.headerConfig?.schoolName || 'Institution Name'}</h4>
               <div className="flex items-center gap-2 mt-4 px-3 py-1.5 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
                  <span className="text-[9px] font-bold text-indigo-100 uppercase tracking-widest">{user.name}</span>
               </div>
            </div>

            <div className="flex-1 p-6 space-y-8">
               {/* TAB SWITCHER */}
               <div className="flex p-1 bg-slate-800 rounded-xl mb-6 border border-slate-700">
                  <button onClick={() => setActiveTab('editor')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'editor' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Editor</button>
                  <button onClick={() => setActiveTab('preview')} className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${activeTab === 'preview' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}>Preview</button>
               </div>

               {/* VIEW MODE SETTING */}
               <div className="space-y-3">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Globe size={14} /> Paper View Mode</p>
                  <div className="relative">
                     <select
                        value={extractionLanguage}
                        onChange={e => setExtractionLanguage(e.target.value as any)}
                        className="w-full h-10 px-3 bg-slate-800 border border-slate-700 rounded-xl text-xs text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition-all"
                     >
                        <option value="Bilingual">Bilingual (English + Urdu)</option>
                        <option value="English">Only English</option>
                        <option value="Urdu">Only Urdu</option>
                     </select>
                     <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                  </div>
               </div>

               {/* NEW PRINT CONFIG */}
               <div className="space-y-3 pt-6 border-t border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Settings2 size={14} /> Print Options</p>
                  <button onClick={() => setShowPartHeadings(!showPartHeadings)} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${showPartHeadings ? 'bg-indigo-600/20 border-indigo-600 text-indigo-300' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}>
                     <span className="text-[10px] font-bold uppercase">Show Part Headings</span>
                     {showPartHeadings ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>
                  <button
                     onClick={() => setCurrentPaper(prev => ({ ...prev, showQuestionMarks: !(prev.showQuestionMarks ?? true) }))}
                     className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${(currentPaper.showQuestionMarks ?? true) ? 'bg-indigo-600/20 border-indigo-600 text-indigo-300' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}
                  >
                     <span className="text-[10px] font-bold uppercase">Marks on Every Question</span>
                     {(currentPaper.showQuestionMarks ?? true) ? <Eye size={14} /> : <EyeOff size={14} />}
                  </button>

                  <div className="space-y-2 rounded-lg border border-slate-700 bg-slate-800/50 p-3">
                     <p className="text-[9px] font-bold text-slate-400 uppercase">Long Question Heading</p>
                     <input
                        value={currentPaper.longQuestionHeading ?? ''}
                        onChange={e => setCurrentPaper(prev => ({ ...prev, longQuestionHeading: e.target.value }))}
                        placeholder="Subjective Part II"
                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-[10px] font-bold text-white outline-none focus:border-indigo-500"
                     />
                     <input
                        dir="rtl"
                        value={currentPaper.longQuestionHeadingUrdu ?? ''}
                        onChange={e => setCurrentPaper(prev => ({ ...prev, longQuestionHeadingUrdu: e.target.value }))}
                        placeholder="حصہ دوم – تفصیلی سوالات"
                        className="w-full rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-right text-[10px] font-urdu font-bold text-white outline-none focus:border-indigo-500"
                     />
                     <textarea
                        value={currentPaper.longQuestionInstruction ?? ''}
                        onChange={e => setCurrentPaper(prev => ({ ...prev, longQuestionInstruction: e.target.value }))}
                        placeholder="Write detailed answers to the following questions."
                        className="min-h-[58px] w-full resize-none rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-[10px] font-semibold text-white outline-none focus:border-indigo-500"
                     />
                     <textarea
                        dir="rtl"
                        value={currentPaper.longQuestionInstructionUrdu ?? ''}
                        onChange={e => setCurrentPaper(prev => ({ ...prev, longQuestionInstructionUrdu: e.target.value }))}
                        placeholder="درج ذیل سوالات کے تفصیلی جوابات لکھیں۔"
                        className="min-h-[58px] w-full resize-none rounded-md border border-slate-600 bg-slate-900 px-2 py-1.5 text-right text-[10px] font-urdu font-semibold text-white outline-none focus:border-indigo-500"
                     />
                  </div>

                  <div className="space-y-2">
                     <p className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><Key size={12} /> Answer Display Mode</p>
                     <div className="flex bg-slate-800 rounded-lg p-1 border border-slate-700">
                        <button
                           onClick={() => setAnswerKeyDisplay('none')}
                           className={`flex-1 py-1.5 text-[9px] font-bold uppercase rounded transition-all ${answerKeyDisplay === 'none' ? 'bg-slate-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                           Hidden
                        </button>
                        <button
                           onClick={() => setAnswerKeyDisplay('inline')}
                           className={`flex-1 py-1.5 text-[9px] font-bold uppercase rounded transition-all ${answerKeyDisplay === 'inline' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                           Inline
                        </button>
                        <button
                           onClick={() => setAnswerKeyDisplay('bottom')}
                           className={`flex-1 py-1.5 text-[9px] font-bold uppercase rounded transition-all ${answerKeyDisplay === 'bottom' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                        >
                           End
                        </button>
                     </div>
                  </div>
               </div>

               {/* TYPOGRAPHY & FONT SETTINGS */}
               <div className="space-y-3 pt-6 border-t border-slate-800">
                  <div className="flex justify-between items-center">
                     <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Tag size={14} /> Typography & Layout</p>
                     <button onClick={() => { setQuestionFontEn(14); setQuestionFontUr(14); setOptionFontEn(9); setOptionFontUr(6); setMcqColumns(4); }} className="text-[9px] font-bold text-indigo-400 hover:underline">Reset</button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                     <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700">
                        <span className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Q (English)</span>
                        <div className="flex items-center justify-between">
                           <button onClick={() => setQuestionFontEn(p => Math.max(8, p - 1))} className="w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs font-bold flex items-center justify-center">-</button>
                           <span className="text-xs font-black text-white">{questionFontEn}px</span>
                           <button onClick={() => setQuestionFontEn(p => Math.min(32, p + 1))} className="w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs font-bold flex items-center justify-center">+</button>
                        </div>
                     </div>

                     <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700">
                        <span className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Q (Urdu)</span>
                        <div className="flex items-center justify-between">
                           <button onClick={() => setQuestionFontUr(p => Math.max(8, p - 1))} className="w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs font-bold flex items-center justify-center">-</button>
                           <span className="text-xs font-black text-white">{questionFontUr}px</span>
                           <button onClick={() => setQuestionFontUr(p => Math.min(36, p + 1))} className="w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs font-bold flex items-center justify-center">+</button>
                        </div>
                     </div>

                     <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700">
                        <span className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Opt (English)</span>
                        <div className="flex items-center justify-between">
                           <button onClick={() => setOptionFontEn(p => Math.max(6, p - 1))} className="w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs font-bold flex items-center justify-center">-</button>
                           <span className="text-xs font-black text-white">{optionFontEn}px</span>
                           <button onClick={() => setOptionFontEn(p => Math.min(24, p + 1))} className="w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs font-bold flex items-center justify-center">+</button>
                        </div>
                     </div>

                     <div className="bg-slate-800/60 p-2 rounded-lg border border-slate-700">
                        <span className="text-[8px] font-bold text-slate-400 uppercase block mb-1">Opt (Urdu)</span>
                        <div className="flex items-center justify-between">
                           <button onClick={() => setOptionFontUr(p => Math.max(5, p - 1))} className="w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs font-bold flex items-center justify-center">-</button>
                           <span className="text-xs font-black text-white">{optionFontUr}px</span>
                           <button onClick={() => setOptionFontUr(p => Math.min(24, p + 1))} className="w-5 h-5 bg-slate-700 hover:bg-slate-600 rounded text-white text-xs font-bold flex items-center justify-center">+</button>
                        </div>
                     </div>
                  </div>

                  <div className="space-y-1.5 pt-1">
                     <span className="text-[8px] font-bold text-slate-400 uppercase block">MCQ Options Columns</span>
                     <div className="flex gap-1 bg-slate-800 rounded-lg p-1 border border-slate-700">
                        {[1, 2, 3, 4].map(cols => (
                           <button
                              key={cols}
                              onClick={() => setMcqColumns(cols)}
                              className={`flex-1 py-1 text-[9px] font-black rounded transition-all ${mcqColumns === cols ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'}`}
                           >
                              {cols} Col{cols > 1 ? 's' : ''}
                           </button>
                        ))}
                     </div>
                  </div>
               </div>

               <div className="space-y-3 pt-6 border-t border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><ListFilter size={14} /> Paper Navigator</p>
                  <div className="space-y-1">
                     {(Object.values(currentPaper.structure) as PaperSectionConfig[]).map(sec => (
                        <button key={sec.id} onClick={() => document.getElementById(`editor-sec-${sec.id}`)?.scrollIntoView({ behavior: 'smooth' })} className="w-full text-left p-2.5 bg-slate-800/50 hover:bg-indigo-600 border border-transparent hover:border-indigo-400 rounded-lg transition-all group">
                           <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-slate-300 group-hover:text-white line-clamp-1">{sec.title}</span>
                              <span className="text-[8px] font-bold text-slate-500 group-hover:text-indigo-200">{getSectionSelectedCount(sec.id)} Qs</span>
                           </div>
                        </button>
                     ))}
                  </div>
               </div>

               <div className="space-y-3 pt-6 border-t border-slate-800">
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Edit3 size={14} /> Settings</p>
                  <button onClick={() => setIsManualEditMode(!isManualEditMode)} className={`w-full flex items-center justify-between p-3.5 rounded-xl border-2 transition-all group ${isManualEditMode ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-400 hover:border-slate-600'}`}>
                     <span className="text-[10px] font-bold uppercase tracking-widest">Manual Mode</span>
                     <div className={`w-8 h-4 rounded-full relative transition-colors ${isManualEditMode ? 'bg-white/20' : 'bg-slate-700'}`}>
                        <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${isManualEditMode ? 'right-0.5' : 'left-0.5'}`}></div>
                     </div>
                  </button>
                  {isManualEditMode && (
                     <button onClick={addNewSection} className="w-full mt-2 py-2 bg-white/5 border border-white/10 text-white text-[9px] font-bold uppercase tracking-widest rounded-lg hover:bg-white/10 transition-all flex items-center justify-center gap-2">
                        <PlusCircle size={14} /> New Section
                     </button>
                  )}
               </div>
            </div>

            <div className="p-6 bg-slate-950 border-t border-slate-800 space-y-3">
               <button onClick={() => setActiveTab('preview')} className="w-full py-3.5 bg-brand text-white rounded-xl font-bold uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-secondary transition-all text-[10px] shadow-lg">
                  <Printer size={16} /> Print Paper
               </button>
               <div className="flex gap-2">
                  <button onClick={() => setIsSaveModalOpen(true)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-2"><Save size={12} /> Save</button>
                  <button onClick={onBack} className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg font-bold uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-2"><X size={12} /> Exit</button>
               </div>
            </div>
         </aside>

         {/* WORKSPACE CANVAS OR PREVIEW TAB */}
         {activeTab === 'preview' ? (
            <div className="flex-1 relative overflow-hidden bg-gray-100">
               <PrintPreview
                  paper={currentPaper}
                  onClose={() => setActiveTab('editor')}
                  isEmbedded={true}
                  showPartHeadings={showPartHeadings}
                  answerKeyDisplay={answerKeyDisplay}
                  onShowQuestionMarksChange={(showQuestionMarks) =>
                     setCurrentPaper(prev => ({ ...prev, showQuestionMarks }))
                  }
               />
            </div>
         ) : (
            <main className="flex-1 overflow-y-auto p-12 md:p-20 flex justify-start bg-white custom-scrollbar print:p-0 relative">
               {/* ... (Existing Editor Canvas) ... */}
               <div className="fixed inset-0 pointer-events-none flex items-center justify-center z-0 select-none opacity-[0.03] grayscale transition-opacity">
                  <img src={currentPaper.headerConfig.logoUrl} className="w-[110mm] animate-pulse" />
               </div>

               <div className={`w-full max-w-5xl relative z-10 ${currentPaper.layoutMode === 'DoubleColumn' ? 'md:columns-2 gap-12' : ''}`}>

                  <div className="relative print:break-inside-avoid">
                     <div className="space-y-8">
                        {/* PART I: OBJECTIVE */}
                        {sectionsByCategory.objective.length > 0 && (
                           <div className="space-y-8">
                              {showPartHeadings && (
                                 <div className="border-b border-slate-900 pb-2 mb-6">
                                    <h2 className="text-xl font-bold text-slate-900 uppercase">Part I: Objective Type</h2>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Weightage: {sectionsByCategory.objective.reduce((acc, sec) => acc + (currentPaper.questions.filter(q => q.sectionId === sec.id).length * sec.marksPerQuestion), 0)} Marks</p>
                                 </div>
                              )}

                              {sectionsByCategory.objective.map(sec => {
                                 const secQuestions = currentPaper.questions.filter(q => q.sectionId === sec.id);
                                 return (
                                    <section key={sec.id} id={`editor-sec-${sec.id}`} className="relative group break-inside-avoid scroll-mt-20">
                                       <div className="absolute -left-12 top-0 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all print:hidden">
                                          {!isManualEditMode && (
                                             <button onClick={() => handleOpenSelection(sec.id)} className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                                                <Plus size={20} strokeWidth={3} />
                                             </button>
                                          )}
                                          {isManualEditMode && (
                                             <>
                                                <button onClick={() => handleOpenConfig(sec.id)} className="w-8 h-8 bg-white border border-slate-200 text-indigo-600 rounded-lg flex items-center justify-center shadow-sm hover:bg-indigo-50 transition-all">
                                                   <Settings2 size={16} />
                                                </button>
                                                <button onClick={() => deleteSectionManual(sec.id)} className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center shadow-md hover:bg-red-600 transition-all">
                                                   <Trash2 size={16} />
                                                </button>
                                             </>
                                          )}
                                          {!isManualEditMode && (
                                             <button onClick={() => handleOpenConfig(sec.id)} className="w-8 h-8 bg-white border border-slate-200 text-slate-500 rounded-lg flex items-center justify-center shadow-sm hover:text-indigo-600 transition-all">
                                                <Settings2 size={14} />
                                             </button>
                                          )}
                                       </div>
                                       <div className="mb-4">
                                          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{sec.title}</h3>
                                          <div className="flex flex-wrap gap-2 mt-2">
                                             <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                                Required: {sec.selectCount}
                                             </span>
                                             <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                                                Choice: {sec.totalCount - sec.selectCount}
                                             </span>
                                             <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                                                {sec.marksPerQuestion} Mark{sec.marksPerQuestion !== 1 ? 's' : ''} each
                                             </span>
                                             <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                                Total: {sec.selectCount * sec.marksPerQuestion} Marks
                                             </span>
                                          </div>
                                       </div>
                                       <div className={`space-y-4 ${sec.questionsPerLine ? 'grid grid-cols-2 gap-x-8 gap-y-4 space-y-0' : ''}`}>
                                          {secQuestions.length === 0 ? (
                                             <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                                                <ListFilter size={24} className="mb-2 opacity-50" />
                                                <span className="text-xs font-bold uppercase tracking-widest">No Questions Selected</span>
                                             </div>
                                          ) : (
                                             secQuestions.map((q, idx) => (
                                                <div key={q.id} className="group/q relative">
                                                   {isManualEditMode && (
                                                      <div className="absolute -left-8 top-0 flex flex-col gap-1 opacity-0 group-hover/q:opacity-100 transition-opacity">
                                                         <button onClick={() => updateQuestionManual(q.id, sec.id, { marks: (q.marks || 0) + 1 })} className="p-1 bg-slate-100 hover:bg-indigo-100 text-indigo-600 rounded"><Plus size={12} /></button>
                                                         <button onClick={() => toggleQuestionSelection(q)} className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded"><Trash size={12} /></button>
                                                      </div>
                                                   )}
                                                   <div className="flex gap-3 items-start">
                                                      <span className="font-bold text-sm min-w-[20px] pt-0.5">{idx + 1}.</span>
                                                      <div className="flex-1 space-y-1">
                                                         <div className="flex justify-between items-start gap-4">
                                                            {(extractionLanguage === 'Bilingual' || extractionLanguage === 'English') && q.text && (
                                                               <div style={{ fontSize: `${questionFontEn}px` }} className="font-semibold text-slate-800 leading-relaxed">
                                                                  <MathRenderer text={q.text} inline />
                                                               </div>
                                                            )}
                                                            {(currentPaper.showQuestionMarks ?? true) && (
                                                               <span className="text-[10px] font-black text-slate-400 pt-0.5 whitespace-nowrap">[{q.marks}]</span>
                                                            )}
                                                         </div>
                                                         {(extractionLanguage === 'Bilingual' || extractionLanguage === 'Urdu') && q.textUrdu && (
                                                            <div dir="rtl" style={{ fontSize: `${questionFontUr}px` }} className="text-right font-urdu text-slate-700 leading-relaxed">
                                                               <MathRenderer text={q.textUrdu} />
                                                            </div>
                                                         )}
                                                         {(q.chapter || q.topic) && (
                                                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 print:hidden">
                                                               {q.chapter && <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">📖 {q.chapter}</span>}
                                                               {q.topic && <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">🏷️ {q.topic}</span>}
                                                            </div>
                                                         )}
                                                         {normalizeType(q.type) === 'mcq' && ((q.options && q.options.length > 0) || (q.optionsUrdu && q.optionsUrdu.length > 0)) && (
                                                            <div className="grid gap-3 mt-2" style={{ gridTemplateColumns: `repeat(${mcqColumns}, minmax(0, 1fr))` }}>
                                                               {((q.options && q.options.length > 0) ? q.options : (q.optionsUrdu || [])).map((opt: string, i: number) => (
                                                                  <div key={i} className="flex gap-2 items-baseline text-slate-600 min-w-0">
                                                                     <span style={{ fontSize: `${optionFontEn}px` }} className="font-bold text-slate-400">({String.fromCharCode(65 + i)})</span>
                                                                     <div className="flex flex-col min-w-0">
                                                                        <span style={{ fontSize: `${optionFontEn}px` }}><MathRenderer text={opt} inline /></span>
                                                                        {q.optionsUrdu && q.optionsUrdu[i] && (
                                                                           <span dir="rtl" style={{ fontSize: `${optionFontUr}px` }} className="text-right font-urdu mt-0.5"><MathRenderer text={q.optionsUrdu[i]} /></span>
                                                                        )}
                                                                     </div>
                                                                  </div>
                                                               ))}
                                                            </div>
                                                         )}
                                                      </div>
                                                   </div>
                                                </div>
                                             ))
                                          )}
                                       </div>
                                    </section>
                                 );
                              })}
                           </div>
                        )}

                        {/* PART II: SUBJECTIVE */}
                        {sectionsByCategory.subjective.length > 0 && (
                           <div className="space-y-8 pt-8 border-t-2 border-dashed border-slate-200">
                              {showPartHeadings && (
                                 <div className="border-b border-slate-900 pb-2 mb-6">
                                    <h2 className="text-xl font-bold text-slate-900 uppercase">Part II: Subjective Type</h2>
                                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Weightage: {sectionsByCategory.subjective.reduce((acc, sec) => acc + (currentPaper.questions.filter(q => q.sectionId === sec.id).length * sec.marksPerQuestion), 0)} Marks</p>
                                 </div>
                              )}

                              {sectionsByCategory.subjective.map(sec => {
                                 const secQuestions = currentPaper.questions.filter(q => q.sectionId === sec.id);
                                 return (
                                    <section key={sec.id} id={`editor-sec-${sec.id}`} className="relative group break-inside-avoid scroll-mt-20">
                                       <div className="absolute -left-12 top-0 flex flex-col gap-1.5 opacity-0 group-hover:opacity-100 transition-all print:hidden">
                                          {!isManualEditMode && (
                                             <button onClick={() => handleOpenSelection(sec.id)} className="w-10 h-10 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all">
                                                <Plus size={20} strokeWidth={3} />
                                             </button>
                                          )}
                                          {isManualEditMode && (
                                             <>
                                                <button onClick={() => handleOpenConfig(sec.id)} className="w-8 h-8 bg-white border border-slate-200 text-indigo-600 rounded-lg flex items-center justify-center shadow-sm hover:bg-indigo-50 transition-all">
                                                   <Settings2 size={16} />
                                                </button>
                                                <button onClick={() => deleteSectionManual(sec.id)} className="w-8 h-8 bg-red-500 text-white rounded-lg flex items-center justify-center shadow-md hover:bg-red-600 transition-all">
                                                   <Trash2 size={16} />
                                                </button>
                                             </>
                                          )}
                                          {!isManualEditMode && (
                                             <button onClick={() => handleOpenConfig(sec.id)} className="w-8 h-8 bg-white border border-slate-200 text-slate-500 rounded-lg flex items-center justify-center shadow-sm hover:text-indigo-600 transition-all">
                                                <Settings2 size={14} />
                                             </button>
                                          )}
                                       </div>
                                       <div className="mb-4">
                                          <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{sec.title}</h3>
                                          <div className="flex flex-wrap gap-2 mt-2">
                                             <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded border border-slate-200">
                                                Required: {sec.selectCount}
                                             </span>
                                             <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded border border-amber-100">
                                                Choice: {sec.totalCount - sec.selectCount}
                                             </span>
                                             <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded border border-indigo-100">
                                                {sec.marksPerQuestion} Mark{sec.marksPerQuestion !== 1 ? 's' : ''} each
                                             </span>
                                             <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">
                                                Total: {sec.selectCount * sec.marksPerQuestion} Marks
                                             </span>
                                          </div>
                                       </div>
                                       <div className="space-y-6">
                                          {secQuestions.length === 0 ? (
                                             <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-slate-50/50">
                                                <ListFilter size={24} className="mb-2 opacity-50" />
                                                <span className="text-xs font-bold uppercase tracking-widest">No Questions Selected</span>
                                             </div>
                                          ) : (
                                             secQuestions.map((q, idx) => (
                                                <div key={q.id} className="group/q relative">
                                                   {isManualEditMode && (
                                                      <div className="absolute -left-8 top-0 flex flex-col gap-1 opacity-0 group-hover/q:opacity-100 transition-opacity">
                                                         <button onClick={() => updateQuestionManual(q.id, sec.id, { marks: (q.marks || 0) + 1 })} className="p-1 bg-slate-100 hover:bg-indigo-100 text-indigo-600 rounded"><Plus size={12} /></button>
                                                         <button onClick={() => toggleQuestionSelection(q)} className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded"><Trash size={12} /></button>
                                                      </div>
                                                   )}
                                                   <div className="flex gap-3 items-start">
                                                      <span style={{ fontSize: `${questionFontEn}px` }} className="font-bold min-w-[20px] pt-0.5">{idx + 1}.</span>
                                                      <div className="flex-1 space-y-2">
                                                         <div className="flex justify-between items-start gap-4">
                                                            {(extractionLanguage === 'Bilingual' || extractionLanguage === 'English') && q.text && (
                                                               <div style={{ fontSize: `${questionFontEn}px` }} className="font-semibold text-slate-800 leading-relaxed">
                                                                  <MathRenderer text={q.text} inline />
                                                               </div>
                                                            )}
                                                            {(currentPaper.showQuestionMarks ?? true) && (
                                                               <span className="text-[10px] font-black text-slate-400 pt-0.5 whitespace-nowrap">[{q.marks}]</span>
                                                            )}
                                                         </div>
                                                         {(extractionLanguage === 'Bilingual' || extractionLanguage === 'Urdu') && q.textUrdu && (
                                                            <div dir="rtl" style={{ fontSize: `${questionFontUr}px` }} className="text-right font-urdu text-slate-700 leading-relaxed">
                                                               <MathRenderer text={q.textUrdu} />
                                                            </div>
                                                         )}
                                                         {(q.chapter || q.topic) && (
                                                            <div className="flex flex-wrap items-center gap-1.5 pt-0.5 print:hidden">
                                                               {q.chapter && <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">📖 {q.chapter}</span>}
                                                               {q.topic && <span className="text-[9px] font-black text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">🏷️ {q.topic}</span>}
                                                            </div>
                                                         )}
                                                         {q.imageUrl && (
                                                            <div className="mt-2">
                                                               <img src={q.imageUrl} alt="Diagram" className="max-h-40 rounded-lg border border-slate-200" />
                                                            </div>
                                                         )}
                                                      </div>
                                                   </div>
                                                </div>
                                             ))
                                          )}
                                       </div>
                                    </section>
                                 );
                              })}
                           </div>
                        )}
                     </div>
                  </div>
               </div>
            </main>
         )}
      </div>
   );
};

export default PaperEditor;
