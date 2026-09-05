
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
   ChevronRight, Check, ArrowLeft, BookOpen, GraduationCap, Settings,
   Sparkles, Filter, Eye, X, Plus, Trash2, CloudLightning,
   Layers, FileText, CheckCircle2, ChevronDown, MonitorPlay, Layout, Library, Settings2,
   Hash, Info, Edit3, Tag, RefreshCw, Zap, Upload, FileUp, Briefcase, Wand2, FileCode, Paperclip, Database, Shuffle
} from 'lucide-react';
import { WizardState, Question, Difficulty, PaperStructure, PaperSectionConfig, User, WatermarkType, PaperLayoutMode, School, UserRole, getDefaultSectionInstruction, getDefaultSectionInstructionUrdu, PairingScheme, SchemeSectionDef, SchemeVersion } from '../types';
import {
   getSyllabuses, getClasses, getSubjects, getChapters, getTopics, getQuestions, getQuestionTypes, getSchoolById, getSystemConfig, checkAndTrackAiUsage, getSchemes
} from '../services/dataService';
import { generatePaperFromDocument, AISectionRequest } from '../services/geminiService';
import { MOCK_SCHOOLS } from '../constants';
import PaperEditor from './PaperEditor';

interface GeneratePaperProps {
   onBack: () => void;
   user: User;
   onEditorEnter?: () => void;
   onEditorExit?: () => void;
}

const GeneratePaper: React.FC<GeneratePaperProps> = ({ onBack, user, onEditorEnter, onEditorExit }) => {
   const [syllabuses, setSyllabuses] = useState<any[]>([]);
   const [classes, setClasses] = useState<any[]>([]);
   const [subjects, setSubjects] = useState<any[]>([]);
   const [allChapters, setAllChapters] = useState<any[]>([]);
   const [allTopics, setAllTopics] = useState<any[]>([]);
   const [questionTypes, setQuestionTypes] = useState<any[]>([]);
   const [schoolData, setSchoolData] = useState<School | null>(null);
   const [allSchemes, setAllSchemes] = useState<PairingScheme[]>([]);

   // Repository for Manual Generation
   const [repoQuestions, setRepoQuestions] = useState<Question[]>([]);

   // AI Generation State
   const [isGenerating, setIsGenerating] = useState(false);
   const [uploadedFile, setUploadedFile] = useState<File | null>(null);
   const fileInputRef = useRef<HTMLInputElement>(null);

   // Manual Mode State
   const [autoFillRepo, setAutoFillRepo] = useState(true);

   // Quick Auto-Builder for Section Initializing
   const [isQuickBuilderOpen, setIsQuickBuilderOpen] = useState(false);
   const [builderTab, setBuilderTab] = useState<'SIMPLE' | 'ADVANCED'>('SIMPLE');

   // Simple 1-Step Input: Total Marks, Question Type, Choice or Not
   const [quickSimpleType, setQuickSimpleType] = useState<string>('Short Question');
   const [quickSimpleMarksPerQ, setQuickSimpleMarksPerQ] = useState<number>(2);
   const [quickSimpleTotalMarks, setQuickSimpleTotalMarks] = useState<number>(10);
   const [quickSimpleHasChoice, setQuickSimpleHasChoice] = useState<boolean>(true);
   const [quickSimpleExtraChoices, setQuickSimpleExtraChoices] = useState<number>(3); // e.g. 5 to attempt + 3 extra = 8 total

   const [quickSections, setQuickSections] = useState<Array<{
      id: string;
      questionType: string;
      marksPerQuestion: number;
      selectCount: number;
      hasChoice: boolean;
      totalCount: number;
   }>>([
      { id: 'qs_1', questionType: 'Multiple Choice', marksPerQuestion: 1, selectCount: 10, hasChoice: false, totalCount: 10 },
      { id: 'qs_2', questionType: 'Short Question', marksPerQuestion: 2, selectCount: 5, hasChoice: true, totalCount: 8 },
      { id: 'qs_3', questionType: 'Long Answer', marksPerQuestion: 4, selectCount: 2, hasChoice: true, totalCount: 3 }
   ]);

   // AI Configuration - Multiple Sections
   const [aiSections, setAiSections] = useState<AISectionRequest[]>([
      { id: 'ai_1', type: 'MCQ', count: 10, marks: 1 },
      { id: 'ai_2', type: 'Short Answer', count: 5, marks: 2 },
      { id: 'ai_3', type: 'Long Answer', count: 2, marks: 5 }
   ]);

   const [state, setState] = useState<WizardState>({
      step: 'SYLLABUS',
      selectedSyllabus: '',
      selectedClass: '',
      selectedSubject: '',
      selectedSchemeVersion: 'NEW',
      selectedSchemeId: '',
      selectedChapters: [],
      selectedTopics: [],
      selectedQuestions: [],
      configMode: 'MANUAL',
      paperStructure: {},
      paperLayout: 'Standard',
      watermark: 'Monogram',
      isOnline: false
   });

   /* Refactored data loading to handle async responses correctly and support Super Admin */
   useEffect(() => {
      const loadAllData = async () => {
         const results = await Promise.allSettled([
            getSyllabuses().catch(() => []),
            getClasses().catch(() => []),
            getSubjects().catch(() => []),
            getChapters().catch(() => []),
            getTopics().catch(() => []),
            getQuestionTypes().catch(() => []),
            getQuestions({ pageSize: 1000, maxPages: 50 }).catch(() => []),
            getSchemes({ includeGlobal: true }).catch(() => [])
         ]);

         const syls = results[0].status === 'fulfilled' ? (results[0].value || []) : [];
         const clss = results[1].status === 'fulfilled' ? (results[1].value || []) : [];
         const subs = results[2].status === 'fulfilled' ? (results[2].value || []) : [];
         const chs = results[3].status === 'fulfilled' ? (results[3].value || []) : [];
         const tops = results[4].status === 'fulfilled' ? (results[4].value || []) : [];
         const types = results[5].status === 'fulfilled' ? (results[5].value || []) : [];
         const qs = results[6].status === 'fulfilled' ? (results[6].value || []) : [];
         const scs = results[7].status === 'fulfilled' ? (results[7].value || []) : [];

         // Ensure repository questions are unique by ID to prevent duplication during shuffling
         const uniqueQs = Array.from(new Map((qs as any[]).map(q => [q.id, q])).values());
         setRepoQuestions(uniqueQs);
         setAllSchemes(scs as any[]);

         let brandingData: School | null = null;

         // Handle Super Admin Context (Use System Config) vs School Admin Context
         if (user.role === UserRole.SUPER_ADMIN) {
            try {
               const config = await getSystemConfig();
               brandingData = {
                  id: 'global',
                  name: config.platformName || 'Platform Administration',
                  logo: config.platformLogo || '',
                  address: 'Global HQ',
                  principalName: user.name,
                  contactEmail: user.email,
                  contactPhone: '',
                  subscriptionPlan: 'Internal',
                  status: 'Active',
                  validTill: 'Unlimited',
                  subscriptionStartDate: new Date().toISOString(),
                  stats: { papersCount: 0, teachersCount: 0, studentCount: 0 },
                  branding: config.branding
               } as School;
            } catch (e) {
               console.error("Failed to load system config", e);
               brandingData = MOCK_SCHOOLS[0];
            }
         } else {
            try {
               brandingData = await getSchoolById(user.schoolId || 's1');
            } catch (e) {
               console.error("Failed to load school", e);
               brandingData = MOCK_SCHOOLS[0];
            }
         }

         setSyllabuses(syls as any[]);
         setClasses(clss as any[]);
         setSubjects(subs as any[]);
         setAllChapters(chs as any[]);
         setAllTopics(tops as any[]);
         setQuestionTypes([...(types as any[])]);
         setSchoolData(brandingData);
      };
      loadAllData();
   }, [user.schoolId, user.role]);

   // Filtering Logic for Wizard
   const filteredClasses = useMemo(() => classes.filter(c => c.syllabusId === state.selectedSyllabus), [classes, state.selectedSyllabus]);
   const filteredSubjects = useMemo(() => subjects.filter(s => s.classId === state.selectedClass), [subjects, state.selectedClass]);
   const relevantChapters = useMemo(() => allChapters.filter(c => c.subjectId === state.selectedSubject), [allChapters, state.selectedSubject]);

   // Pairing schemes are filtered by subject and Old/New version. Missing version means legacy OLD.
   const relevantSchemes = useMemo(() => allSchemes.filter(s => s.subjectId === state.selectedSubject), [allSchemes, state.selectedSubject]);
   const versionedSchemes = useMemo(() => relevantSchemes.filter(s => (s.schemeVersion || 'OLD') === (state.selectedSchemeVersion || 'NEW')), [relevantSchemes, state.selectedSchemeVersion]);
   const globalSchemes = useMemo(() => versionedSchemes.filter(s => s.isGlobal), [versionedSchemes]);
   const customSchemes = useMemo(() => versionedSchemes.filter(s => !s.isGlobal), [versionedSchemes]);
   const selectedScheme = useMemo(() => relevantSchemes.find(s => s.id === state.selectedSchemeId), [relevantSchemes, state.selectedSchemeId]);

   // Filtering Logic for AI Agent (Independent Selection)
   const aiFilteredClasses = useMemo(() => classes.filter(c => !state.selectedSyllabus || c.syllabusId === state.selectedSyllabus), [classes, state.selectedSyllabus]);
   const aiFilteredSubjects = useMemo(() => subjects.filter(s => !state.selectedClass || s.classId === state.selectedClass), [subjects, state.selectedClass]);

   // Dynamic Question Types Filtering based on Repository Content
   const availableTypesForConfig = useMemo(() => {
      // If repo is empty or not yet loaded, return all types as fallback
      if (repoQuestions.length === 0) return questionTypes;

      const currentSubject = subjects.find(s => s.id === state.selectedSubject)?.name;
      const currentClass = classes.find(c => c.id === state.selectedClass)?.name;

      const relevant = repoQuestions.filter(q => {
         const matchSub = !currentSubject || q.subject === currentSubject;
         // Soft match for classLevel (allow if question has no classLevel specified)
         const matchCls = !currentClass || !q.classLevel || q.classLevel === currentClass;

         // Filter by chapters if any are selected (using names for matching as stored in state)
         const matchChap = state.selectedChapters.length === 0 ||
            (q.chapter && state.selectedChapters.some(cName => cName.toLowerCase() === q.chapter?.toLowerCase()));

         return matchSub && matchCls && matchChap;
      });

      if (relevant.length === 0) {
         console.warn("No questions found matching criteria for type filtering", { currentSubject, currentClass, selectedChapters: state.selectedChapters });
         return questionTypes; // Fallback to all types if filtering is too strict
      }

      const typeSet = new Set(relevant.map(q => q.type));
      return questionTypes.filter(t => typeSet.has(t.id));
   }, [repoQuestions, state.selectedSubject, state.selectedClass, state.selectedChapters, questionTypes, subjects, classes]);

   const getSubtopicsForChapter = (chapterName: string) => {
      const chapterObj = allChapters.find(c => c.name === chapterName);
      if (chapterObj) return allTopics.filter(t => t.chapterId === chapterObj.id).map(t => t.name);
      return [];
   };

   const handleSelectAllChapters = () => {
      const allNames = relevantChapters.map(c => c.name);
      const allTops: string[] = [];
      allNames.forEach(c => allTops.push(...getSubtopicsForChapter(c)));
      setState(prev => ({ ...prev, selectedChapters: allNames, selectedTopics: allTops }));
   };

   const handleChapterToggle = (chapter: string) => {
      const isSelected = state.selectedChapters.includes(chapter);
      const chapterSubtopics = getSubtopicsForChapter(chapter);
      setState(prev => {
         let newChapters = isSelected ? prev.selectedChapters.filter(c => c !== chapter) : [...prev.selectedChapters, chapter];
         let newTopics = isSelected
            ? prev.selectedTopics.filter(t => !chapterSubtopics.includes(t))
            : [...prev.selectedTopics, ...chapterSubtopics.filter(t => !prev.selectedTopics.includes(t))];
         return { ...prev, selectedChapters: newChapters, selectedTopics: newTopics };
      });
   };

   const initStructure = () => {
      const structure: PaperStructure = {};
      // If a pairing scheme was selected, populate structure from the scheme
      if (selectedScheme && selectedScheme.structure && selectedScheme.structure.length > 0) {
         selectedScheme.structure.forEach((secDef, idx) => {
            const id = secDef.id || `sec_${Date.now()}_${idx}`;
            const isObjective = (secDef.sectionRole === 'OBJECTIVE') || ['MCQ', 'Match Columns', 'Fill in the Blanks', 'True/False', 'Spelling Check'].includes(secDef.type);
            structure[id] = {
               id: id,
               title: secDef.title || `Q.${idx + 1} ${secDef.type}`,
               instruction: secDef.instruction || getDefaultSectionInstruction(secDef.type, secDef.selectCount, secDef.totalCount),
               instructionUrdu: secDef.instructionUrdu || getDefaultSectionInstructionUrdu(secDef.type, secDef.selectCount, secDef.totalCount),
               questionType: secDef.type,
               marksPerQuestion: secDef.marksPerQuestion || (secDef.type === 'MCQ' ? 1 : secDef.type === 'Short Answer' ? 2 : 5),
               totalCount: secDef.totalCount,
               selectCount: secDef.selectCount,
               blankLines: 0,
               blankLineType: 'Line',
               questionsPerLine: false,
               languageMedium: 'Bilingual',
               sourceFilter: [],
               category: isObjective ? 'Objective' : 'Subjective',
               subQuestionNumbering: secDef.type === 'MCQ' ? 'Numeric' : 'Alpha',
               sectionRole: secDef.sectionRole,
               questionNumber: secDef.questionNumber || idx + 1,
               hasParts: secDef.hasParts,
               parts: secDef.parts,
               hasInternalChoice: secDef.hasInternalChoice,
               chapterDistribution: secDef.chapterDistribution,
               isCompulsory: secDef.isCompulsory
            };
         });
      } else {
         // Use available types to initialize structure intelligently
         const availableTypeIds = availableTypesForConfig.map(t => t.id);
         const defaultTypes = availableTypeIds.length > 0 ? availableTypeIds.slice(0, 3) : ['MCQ', 'Short Answer', 'Long Answer'];

         defaultTypes.forEach((type, idx) => {
            const id = `sec_${Date.now()}_${idx}`;
            const isObjective = ['MCQ', 'Match Columns', 'Fill in the Blanks', 'True/False', 'Spelling Check'].includes(type);
            const totalCount = type === 'MCQ' ? 10 : 8;
            const selectCount = type === 'MCQ' ? 10 : 6;

            structure[id] = {
               id: id,
               title: `Q.${idx + 1} ${type}`,
               instruction: getDefaultSectionInstruction(type, selectCount, totalCount),
               questionType: type,
               marksPerQuestion: type === 'MCQ' ? 1 : type === 'Short Answer' ? 2 : 5,
               totalCount: totalCount,
               selectCount: selectCount,
               blankLines: 0,
               blankLineType: 'Line',
               questionsPerLine: false,
               languageMedium: 'Bilingual',
               sourceFilter: [],
               category: isObjective ? 'Objective' : 'Subjective',
               subQuestionNumbering: type === 'MCQ' ? 'Numeric' : 'Alpha'
            };
         });
      }
      setState(prev => ({ ...prev, paperStructure: structure, step: 'SETUP' }));
   };

   const updateSection = (id: string, updates: Partial<PaperSectionConfig>) => {
      // Automatically update category if question type changes in updates
      let finalUpdates = { ...updates };
      const currentSec = state.paperStructure[id];
      if (updates.questionType || updates.selectCount !== undefined || updates.totalCount !== undefined) {
         const type = updates.questionType || currentSec?.questionType || 'MCQ';
         const sel = updates.selectCount !== undefined ? updates.selectCount : (currentSec?.selectCount || 5);
         const tot = updates.totalCount !== undefined ? updates.totalCount : (currentSec?.totalCount || 5);
         if (!updates.instruction) {
            finalUpdates.instruction = getDefaultSectionInstruction(type, sel, tot);
         }
         if (updates.category === undefined) {
            const isObjective = ['MCQ', 'Match Columns', 'Fill in the Blanks', 'True/False', 'Spelling Check'].includes(type);
            finalUpdates.category = isObjective ? 'Objective' : 'Subjective';
         }
      }

      setState(prev => ({
         ...prev,
         paperStructure: {
            ...prev.paperStructure,
            [id]: { ...prev.paperStructure[id], ...finalUpdates }
         }
      }));
   };

   const addNewSection = () => {
      const id = `sec_${Date.now()}`;
      const nextNum = Object.keys(state.paperStructure).length + 1;
      // Default to first available type
      const defaultType = availableTypesForConfig.length > 0 ? availableTypesForConfig[0].id : (questionTypes.length > 0 ? questionTypes[0].id : 'MCQ');
      const isObjective = ['MCQ', 'Match Columns', 'Fill in the Blanks', 'True/False', 'Spelling Check'].includes(defaultType);

      const newSec: PaperSectionConfig = {
         id: id,
         title: `Q.${nextNum} New Section`,
         instruction: getDefaultSectionInstruction(defaultType, 5, 5),
         questionType: defaultType,
         marksPerQuestion: 1,
         totalCount: 5,
         selectCount: 5,
         blankLines: 0,
         blankLineType: 'Line',
         questionsPerLine: false,
         languageMedium: 'Bilingual',
         sourceFilter: [],
         category: isObjective ? 'Objective' : 'Subjective',
         subQuestionNumbering: 'Numeric'
      };
      setState(prev => ({
         ...prev,
         paperStructure: { ...prev.paperStructure, [id]: newSec }
      }));
      setEditingSection(newSec);
   };

   const removeSection = (id: string) => {
      setState(prev => {
         const newStruct = { ...prev.paperStructure };
         delete newStruct[id];
         return { ...prev, paperStructure: newStruct };
      });
   };

   // Quick Auto-Builder Management
   const addQuickSection = () => {
      const id = `qs_${Date.now()}`;
      setQuickSections(prev => [
         ...prev,
         {
            id,
            questionType: 'Short Question',
            marksPerQuestion: 2,
            selectCount: 5,
            hasChoice: true,
            totalCount: 8
         }
      ]);
   };

   const removeQuickSection = (id: string) => {
      setQuickSections(prev => prev.filter(s => s.id !== id));
   };

   const updateQuickSection = (id: string, updates: Partial<{
      questionType: string;
      marksPerQuestion: number;
      selectCount: number;
      hasChoice: boolean;
      totalCount: number;
   }>) => {
      setQuickSections(prev => prev.map(s => {
         if (s.id !== id) return s;
         const updated = { ...s, ...updates };
         // Auto adjust counts when choice toggled
         if (updates.hasChoice !== undefined) {
            if (updates.hasChoice) {
               // Add choice
               const extra = updated.questionType === 'Multiple Choice' ? 0 : updated.selectCount >= 5 ? 3 : 2;
               updated.totalCount = updated.selectCount + extra;
            } else {
               // No choice
               updated.totalCount = updated.selectCount;
            }
         }
         if (updates.selectCount !== undefined && !updated.hasChoice) {
            updated.totalCount = updates.selectCount;
         }
         return updated;
      }));
   };

   const applySimpleQuickBuild = () => {
      const marksPerQ = Math.max(1, quickSimpleMarksPerQ);
      const totalMarks = Math.max(marksPerQ, quickSimpleTotalMarks);
      const selectCount = Math.max(1, Math.round(totalMarks / marksPerQ));
      const extra = quickSimpleHasChoice ? Math.max(1, quickSimpleExtraChoices) : 0;
      const totalCount = selectCount + extra;
      const isObjective = ['Multiple Choice', 'Fill in the Blanks', 'True/False'].includes(quickSimpleType);

      const secId = `sec_quick_${Date.now()}`;
      const nextNum = Object.keys(state.paperStructure).length + 1;
      const newSec: PaperSectionConfig = {
         id: secId,
         title: `Q.${nextNum} ${quickSimpleType}`,
         instruction: getDefaultSectionInstruction(quickSimpleType, selectCount, totalCount),
         instructionUrdu: getDefaultSectionInstructionUrdu(quickSimpleType, selectCount, totalCount),
         questionType: quickSimpleType,
         marksPerQuestion: marksPerQ,
         totalCount: totalCount,
         selectCount: selectCount,
         blankLines: 0,
         blankLineType: 'Line',
         questionsPerLine: false,
         languageMedium: 'Bilingual',
         sourceFilter: [],
         category: isObjective ? 'Objective' : 'Subjective',
         subQuestionNumbering: 'Numeric'
      };

      // Add to existing sections
      setState(prev => ({
         ...prev,
         paperStructure: {
            ...prev.paperStructure,
            [secId]: newSec
         }
      }));
      setIsQuickBuilderOpen(false);
   };

   const applyQuickSections = () => {
      const newStructure: PaperStructure = {};
      quickSections.forEach((qsec, idx) => {
         const secId = `sec_quick_${Date.now()}_${idx}`;
         const isObjective = ['Multiple Choice', 'Fill in the Blanks', 'True/False'].includes(qsec.questionType);
         const total = qsec.hasChoice ? Math.max(qsec.selectCount, qsec.totalCount) : qsec.selectCount;
         newStructure[secId] = {
            id: secId,
            title: `Q.${idx + 1} ${qsec.questionType}`,
            instruction: getDefaultSectionInstruction(qsec.questionType, qsec.selectCount, total),
            instructionUrdu: getDefaultSectionInstructionUrdu(qsec.questionType, qsec.selectCount, total),
            questionType: qsec.questionType,
            marksPerQuestion: qsec.marksPerQuestion,
            totalCount: total,
            selectCount: qsec.selectCount,
            blankLines: 0,
            blankLineType: 'Line',
            questionsPerLine: false,
            languageMedium: 'Bilingual',
            sourceFilter: [],
            category: isObjective ? 'Objective' : 'Subjective',
            subQuestionNumbering: 'Numeric'
         };
      });

      setState(prev => ({
         ...prev,
         paperStructure: newStructure
      }));
      setIsQuickBuilderOpen(false);
   };

   // Handle Document Upload
   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files && e.target.files[0]) {
         setUploadedFile(e.target.files[0]);
      }
   };

   const addAiSection = () => {
      setAiSections(prev => [
         ...prev,
         { id: `ai_${Date.now()}`, type: 'MCQ', count: 5, marks: 1 }
      ]);
   };

   const removeAiSection = (id: string) => {
      setAiSections(prev => prev.filter(s => s.id !== id));
   };

   const updateAiSection = (id: string, field: keyof AISectionRequest, value: any) => {
      setAiSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
   };

   const handleGenerateClick = async () => {
      if (state.configMode === 'AUTO') {
         // AI Mode - Check Limits First
         await handleAutoGenerate();
      } else {
         // Repository Mode
         if (autoFillRepo) {
            await handleAutoGenerate();
         } else {
            // Manual pick - just enter editor with structure
            setState(prev => ({
               ...prev,
               step: 'EDITOR',
               selectedQuestions: [] // Ensure clean state
            }));
            onEditorEnter?.();
         }
      }
   };

   const handleAutoGenerate = async () => {
      setIsGenerating(true);

      try {
         // 1. Check AI Usage Limits (New Logic)
         if (user.role !== UserRole.SUPER_ADMIN) {
            try {
               const limitCheck = await checkAndTrackAiUsage();
               if (!limitCheck.success) {
                  alert("Daily AI limit reached. Please upgrade your plan or try again tomorrow.");
                  setIsGenerating(false);
                  return;
               }
            } catch (e: any) {
               // If the error message is available from the API response
               alert(e.message || "Daily AI limit reached.");
               setIsGenerating(false);
               return;
            }
         }

         const subjectName = subjects.find(s => s.id === state.selectedSubject)?.name || 'General';
         const className = classes.find(c => c.id === state.selectedClass)?.name || 'General';
         let generatedQuestions: Question[] = [];
         let structure: PaperStructure = {};

         // Case 1: AI Mode with File
         if (state.configMode === 'AUTO' && uploadedFile) {
            const reader = new FileReader();
            reader.readAsDataURL(uploadedFile);

            await new Promise<void>((resolve, reject) => {
               reader.onload = async () => {
                  try {
                     const base64Data = reader.result?.toString().split(',')[1] || '';
                     const mimeType = uploadedFile.type;

                     // Pass full sections config to Gemini
                     const aiQuestions = await generatePaperFromDocument(
                        base64Data,
                        mimeType,
                        aiSections,
                        subjectName,
                        true // Bilingual default
                     );

                     // Create structure sections based on aiSections config
                     aiSections.forEach((cfg, idx) => {
                        const secId = `sec_ai_${Date.now()}_${idx}`;
                        const sectionQs = aiQuestions.filter(q => q.type === cfg.type);
                        const isObjective = ['MCQ', 'Match Columns', 'Fill in the Blanks', 'True/False', 'Spelling Check'].includes(cfg.type);

                        structure[secId] = {
                           id: secId,
                           title: `Q.${idx + 1} ${cfg.type}`,
                           questionType: cfg.type,
                           marksPerQuestion: cfg.marks,
                           totalCount: sectionQs.length || cfg.count,
                           selectCount: sectionQs.length || cfg.count,
                           blankLines: 0,
                           blankLineType: 'Line',
                           questionsPerLine: cfg.type === 'MCQ',
                           languageMedium: 'Bilingual',
                           sourceFilter: [],
                           category: isObjective ? 'Objective' : 'Subjective',
                           subQuestionNumbering: cfg.type === 'MCQ' ? 'Numeric' : 'Roman'
                        };

                        sectionQs.forEach(q => {
                           generatedQuestions.push({
                              ...q,
                              sectionId: secId,
                              classLevel: className,
                              marks: cfg.marks
                           } as Question);
                        });
                     });
                     resolve();
                  } catch (e) {
                     reject(e);
                  }
               };
               reader.onerror = (e) => reject(e);
            });
         }
         // Case 2: Repository Shuffle (Manual Mode with Auto-Fill)
         else {
            const matchesSectionMedium = (q: any, sectionMedium: 'English' | 'Urdu' | 'Bilingual') => {
               const qm = (q?.medium || 'Bilingual') as 'English' | 'Urdu' | 'Bilingual';
               if (sectionMedium === 'Bilingual') return qm === 'Bilingual' || qm === 'English' || qm === 'Urdu';
               if (sectionMedium === 'English') return qm === 'English' || qm === 'Bilingual';
               if (sectionMedium === 'Urdu') return qm === 'Urdu' || qm === 'Bilingual';
               return true;
            };

            const isChapterMatch = (questionChapter?: string, targetChapters: string[] = []): boolean => {
               if (!questionChapter) return false;
               if (targetChapters.length === 0) return true;
               const qCh = questionChapter.trim().toLowerCase();
               const qNumMatch = qCh.match(/\b\d+\b/);
               const qNum = qNumMatch ? qNumMatch[0] : null;

               return targetChapters.some(tc => {
                  const t = tc.trim().toLowerCase();
                  if (qCh === t) return true;
                  if (qCh.includes(t) || t.includes(qCh)) return true;
                  if (qNum) {
                     const tNumMatch = t.match(/\b\d+\b/);
                     if (tNumMatch && tNumMatch[0] === qNum) return true;
                  }
                  return false;
               });
            };

(Object.values(state.paperStructure) as PaperSectionConfig[]).forEach(sec => {
               // Scheme Handling 1: Long Answer with sub-parts (a), (b), (c)...
               if (sec.hasParts && sec.parts && sec.parts.length > 0) {
                  sec.parts.forEach(part => {
                     const targetChapters = part.chapter ? [part.chapter] : (part.chapters || []);
                     const partPool = repoQuestions.filter(q =>
                        q.type === sec.questionType &&
                        q.subject === subjectName &&
                        (q.classLevel === className || !q.classLevel) &&
                        (targetChapters.length === 0 || isChapterMatch(q.chapter, targetChapters)) &&
                        matchesSectionMedium(q, sec.languageMedium)
                     );
                     const poolToUse = partPool.length > 0 ? partPool : repoQuestions.filter(q => q.type === sec.questionType && q.subject === subjectName);
                     const picked = poolToUse.length > 0 ? poolToUse[Math.floor(Math.random() * poolToUse.length)] : null;
                     if (picked) {
                        generatedQuestions.push({
                           ...picked,
                           id: `${picked.id}_part_${part.label}_${Math.random().toString(36).substr(2, 7)}`,
                           sectionId: sec.id,
                           marks: part.marks,
                           text: `(${part.label}) ${picked.text || ''}`,
                           textUrdu: picked.textUrdu ? `(${part.label}) ${picked.textUrdu}` : undefined
                        });
                     }
                  });
               }
               // Scheme Handling 2: Section with specific chapter distribution rules
               else if (sec.chapterDistribution && sec.chapterDistribution.length > 0) {
                  const usedIds = new Set<string>();
                  sec.chapterDistribution.forEach(rule => {
                     const rulePool = repoQuestions.filter(q =>
                        !usedIds.has(q.id) &&
                        q.type === sec.questionType &&
                        q.subject === subjectName &&
                        (q.classLevel === className || !q.classLevel) &&
                        isChapterMatch(q.chapter, rule.chapters) &&
                        matchesSectionMedium(q, sec.languageMedium)
                     );
                     const shuffled = [...rulePool].sort(() => 0.5 - Math.random());
                     const picked = shuffled.slice(0, rule.count);
                     picked.forEach(q => {
                        usedIds.add(q.id);
                        generatedQuestions.push({
                           ...q,
                           id: `${q.id}_gen_${Math.random().toString(36).substr(2, 9)}`,
                           sectionId: sec.id,
                           marks: sec.marksPerQuestion
                        });
                     });
                  });
                  // Fill any remainder from the broader chapter pool
                  const secGenerated = generatedQuestions.filter(q => q.sectionId === sec.id).length;
                  if (secGenerated < sec.totalCount) {
                     const remainder = sec.totalCount - secGenerated;
                     const fallbackPool = repoQuestions.filter(q =>
                        !usedIds.has(q.id) &&
                        q.type === sec.questionType &&
                        q.subject === subjectName &&
                        (q.classLevel === className || !q.classLevel) &&
                        (state.selectedChapters.length === 0 || state.selectedChapters.includes(q.chapter || '')) &&
                        matchesSectionMedium(q, sec.languageMedium)
                     );
                     const shuffled = [...fallbackPool].sort(() => 0.5 - Math.random());
                     shuffled.slice(0, remainder).forEach(q => {
                        generatedQuestions.push({
                           ...q,
                           id: `${q.id}_gen_${Math.random().toString(36).substr(2, 9)}`,
                           sectionId: sec.id,
                           marks: sec.marksPerQuestion
                        });
                     });
                  }
               }
               // Standard Random Selection (Balanced & Fair across selected chapters)
               else {
                  const pool = repoQuestions.filter(q =>
                     q.type === sec.questionType &&
                     q.subject === subjectName &&
                     (q.classLevel === className || !q.classLevel) &&
                     (state.selectedChapters.length === 0 || state.selectedChapters.includes(q.chapter || '')) &&
                     matchesSectionMedium(q, sec.languageMedium)
                  );

                  // Group by chapter for equal distribution
                  const byChapter: Record<string, Question[]> = {};
                  pool.forEach(q => {
                     const chKey = q.chapter || 'general';
                     if (!byChapter[chKey]) byChapter[chKey] = [];
                     byChapter[chKey].push(q);
                  });

                  // Shuffle within each chapter
                  Object.keys(byChapter).forEach(ch => {
                     byChapter[ch] = [...byChapter[ch]].sort(() => 0.5 - Math.random());
                  });

                  const chapterKeys = Object.keys(byChapter).sort(() => 0.5 - Math.random());
                  const picked: Question[] = [];
                  const targetCount = sec.totalCount;

                  if (chapterKeys.length > 0) {
                     let round = 0;
                     while (picked.length < targetCount) {
                        let addedThisRound = false;
                        for (const ch of chapterKeys) {
                           if (picked.length >= targetCount) break;
                           const chList = byChapter[ch];
                           if (round < chList.length) {
                              picked.push(chList[round]);
                              addedThisRound = true;
                           }
                        }
                        round++;
                        if (!addedThisRound) break;
                     }
                  }

                  // If still short of targetCount, fill remainder from pool
                  if (picked.length < targetCount && pool.length > 0) {
                     const pickedIds = new Set(picked.map(p => p.id));
                     const remaining = pool.filter(q => !pickedIds.has(q.id)).sort(() => 0.5 - Math.random());
                     for (const q of remaining) {
                        if (picked.length >= targetCount) break;
                        picked.push(q);
                     }
                  }

                  picked.forEach(q => {
                     generatedQuestions.push({
                        ...q,
                        id: `${q.id}_gen_${Math.random().toString(36).substr(2, 9)}`,
                        sectionId: sec.id,
                        marks: sec.marksPerQuestion
                     });
                  });
               }

               // Enforce the configured count even when a narrow chapter rule returned too few rows.
               // Reusing a repository item with a unique generated ID is preferable to silently producing
               // fewer questions than the selected pairing scheme requires.
               if (!sec.hasParts) {
                  const eligiblePool = repoQuestions.filter(q =>
                     q.type === sec.questionType &&
                     q.subject === subjectName &&
                     (q.classLevel === className || !q.classLevel) &&
                     matchesSectionMedium(q, sec.languageMedium)
                  );
                  const sectionItems = generatedQuestions.filter(q => q.sectionId === sec.id);
                  const requiredMainCount = Math.max(0, sec.totalCount);
                  for (let i = sectionItems.length; i < requiredMainCount && eligiblePool.length > 0; i += 1) {
                     const source = eligiblePool[i % eligiblePool.length];
                     generatedQuestions.push({
                        ...source,
                        id: `${source.id}_exact_${sec.id}_${i}_${Math.random().toString(36).substr(2, 6)}`,
                        sectionId: sec.id,
                        marks: sec.marksPerQuestion
                     });
                  }

                  if (sec.hasInternalChoice && sec.sectionRole === 'LONG_QUESTION' && eligiblePool.length > 0) {
                     const main = generatedQuestions.find(q => q.sectionId === sec.id);
                     if (main) {
                        const choiceGroupId = `choice_${sec.id}`;
                        main.internalChoiceGroupId = choiceGroupId;
                        const unused = eligiblePool.find(q => q.id !== main.id && !main.id.startsWith(`${q.id}_`)) || eligiblePool[0];
                        generatedQuestions.push({
                           ...unused,
                           id: `${unused.id}_alternative_${sec.id}_${Math.random().toString(36).substr(2, 6)}`,
                           sectionId: sec.id,
                           marks: sec.marksPerQuestion,
                           internalChoiceGroupId: choiceGroupId,
                           isInternalChoiceAlternative: true
                        });
                     }
                  }
               }
            });

            // Objective scheme sections always print exactly four choices (A-D).
            generatedQuestions = generatedQuestions.map(q => {
               const sec = state.paperStructure[q.sectionId || ''];
               const isMcq = sec?.questionType?.toLowerCase().includes('mcq') || q.type?.toLowerCase().includes('mcq');
               if (!isMcq) return q;
               const options = [...(q.options || [])].slice(0, 4);
               const optionsUrdu = [...(q.optionsUrdu || [])].slice(0, 4);
               while (options.length < 4) options.push('________________');
               while (optionsUrdu.length < 4) optionsUrdu.push('________________');
               return { ...q, options, optionsUrdu };
            });
            structure = state.paperStructure;
         }

         setState(prev => ({
            ...prev,
            selectedQuestions: generatedQuestions,
            paperStructure: Object.keys(structure).length > 0 ? structure : prev.paperStructure,
            step: 'EDITOR'
         }));
         onEditorEnter?.();

      } catch (e) {
         console.error("Generation failed", e);
         alert("Failed to generate paper. Please check the file or try again.");
      } finally {
         setIsGenerating(false);
      }
   };

   const StepIndicator = () => {
      const steps = ['Board', 'Grade', 'Subject', 'Scheme', 'Topics', 'Layout', 'Questions'];
      const currentIdx = ['SYLLABUS', 'CLASS', 'SUBJECT', 'SCHEME', 'CHAPTERS', 'SETUP', 'EDITOR', 'AI_AGENT'].indexOf(state.step);
      if (state.step === 'AI_AGENT') return null; // Hide standard indicator in AI mode

      return (
         <div className="flex items-center justify-start mb-10 overflow-x-auto px-4 no-scrollbar">
            {steps.map((label, idx) => (
               <React.Fragment key={label}>
                  <div className={`flex items-center gap-2 shrink-0 ${idx <= currentIdx ? 'text-indigo-600' : 'text-gray-400'}`}>
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${idx < currentIdx ? 'bg-indigo-600 border-indigo-600 text-white' : idx === currentIdx ? 'border-indigo-600 text-indigo-600 shadow-[0_0_0_4px_rgba(79,70,229,0.1)]' : 'border-gray-200'
                        }`}>{idx < currentIdx ? <Check size={14} /> : idx + 1}</div>
                     <span className="font-bold text-[10px] uppercase tracking-widest hidden sm:block">{label}</span>
                  </div>
                  {idx < steps.length - 1 && <div className={`w-8 md:w-16 h-0.5 mx-2 shrink-0 transition-colors ${idx < currentIdx ? 'bg-indigo-600' : 'bg-gray-200'}`}></div>}
               </React.Fragment>
            ))}
         </div>
      );
   };

   const [editingSection, setEditingSection] = useState<PaperSectionConfig | null>(null);

   if (state.step === 'SYLLABUS') return (
      <div className="p-4 md:p-12 max-w-7xl">
         <button onClick={onBack} className="text-gray-400 hover:text-gray-900 flex items-center gap-2 mb-8 font-bold text-sm uppercase tracking-widest transition-colors"><ArrowLeft size={18} /> Exit Generator</button>
         <StepIndicator />

         <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
            <div>
               <h2 className="text-3xl font-black text-gray-900 tracking-tight">Select Examination Board</h2>
               <p className="text-gray-500 mt-2 text-sm">Choose curriculum to begin manual paper drafting</p>
            </div>

            {/* NEW AI ENTRY POINT */}
            <button
               onClick={() => {
                  if (!schoolData?.subscriptionPlan || schoolData.subscriptionPlan === 'Starter') {
                     alert("Your current package (Starter) only supports Paper Generation from Question Bank and PDF Printing. Please upgrade to unlock the AI Paper Architect.");
                     return;
                  }
                  setState({ ...state, step: 'AI_AGENT', configMode: 'AUTO' })
               }}
               className="relative group overflow-hidden bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-4 rounded-2xl shadow-xl shadow-indigo-200 transition-all hover:scale-[1.02] active:scale-95"
            >
               <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
               <div className="flex items-center gap-3 relative z-10">
                  <Wand2 size={20} className="text-yellow-300 animate-pulse" />
                  <div className="text-left">
                     <span className="block text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">New Feature</span>
                     <span className="block font-bold text-sm">Generate from AI Agent</span>
                  </div>
                  <ChevronRight size={20} className="ml-2 group-hover:translate-x-1 transition-transform" />
               </div>
            </button>
         </div>

         {syllabuses.length === 0 ? (
            <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
               <p className="text-gray-400 font-bold uppercase tracking-widest">No assigned syllabuses found.</p>
               <p className="text-xs text-gray-400 mt-2">Contact administrator to assign curriculum entitlements.</p>
            </div>
         ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
               {syllabuses.map(s => (
                  <div key={s.id} onClick={() => setState({ ...state, selectedSyllabus: s.id, step: 'CLASS', configMode: 'MANUAL' })} className="group relative h-48 rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer">
                     {s.logo ? <img src={s.logo} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600" />}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                     <div className="absolute bottom-0 left-0 right-0 p-8">
                        <h3 className="font-bold text-white text-2xl group-hover:translate-x-1 transition-transform">{s.name}</h3>
                        <p className="text-white/70 text-sm mt-1 line-clamp-1 font-medium">{s.description}</p>
                     </div>
                     <div className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md border border-white/30 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all">
                        <ChevronRight size={20} />
                     </div>
                  </div>
               ))}
            </div>
         )}
      </div>
   );

   // --- AI AGENT STEP ---
   if (state.step === 'AI_AGENT') return (
      <div className="p-4 sm:p-6 md:p-12 max-w-7xl">
         <button onClick={() => { onEditorExit?.(); setState({ ...state, step: 'SYLLABUS' }); }} className="text-slate-400 hover:text-white flex items-center gap-2 mb-8 font-bold text-sm uppercase tracking-widest transition-colors"><ArrowLeft size={18} /> Exit Manual/Doc Setup</button>
         <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Left Column - Configurations */}
            <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6 text-white shadow-2xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -z-0 pointer-events-none"></div>

               <div>
                  <h3 className="text-xl font-black tracking-tight text-white mb-1 flex items-center gap-2"><Briefcase size={20} className="text-indigo-400" /> Academic Profile</h3>
                  <p className="text-xs text-slate-400">Specify curriculum parameters for your paper structure</p>
               </div>

               <div className="space-y-4">
                  <div>
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Examination Board</label>
                     <select
                        value={state.selectedSyllabus || ''}
                        onChange={e => setState(p => ({ ...p, selectedSyllabus: e.target.value, selectedClass: '', selectedSubject: '' }))}
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-colors"
                     >
                        <option value="">Select Board</option>
                        {syllabuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                     </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Grade</label>
                        <select
                           value={state.selectedClass || ''}
                           onChange={e => setState(p => ({ ...p, selectedClass: e.target.value, selectedSubject: '' }))}
                           disabled={!state.selectedSyllabus}
                           className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                        >
                           <option value="">Select Grade</option>
                           {aiFilteredClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                     </div>

                     <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Subject</label>
                        <select
                           value={state.selectedSubject || ''}
                           onChange={e => setState(p => ({ ...p, selectedSubject: e.target.value }))}
                           disabled={!state.selectedClass}
                           className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 px-4 text-sm font-bold text-white outline-none focus:border-indigo-500 transition-colors disabled:opacity-50"
                        >
                           <option value="">Select Subject</option>
                           {aiFilteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800">
                     <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Document Source (PDF/Doc/Image)</label>

                     <div
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${uploadedFile ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-400' : 'border-slate-700 hover:border-indigo-500 bg-slate-800/50 text-slate-400'
                           }`}
                     >
                        <input
                           type="file"
                           ref={fileInputRef}
                           onChange={handleFileChange}
                           accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                           className="hidden"
                        />
                        {uploadedFile ? (
                           <>
                              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                                 <FileUp size={24} />
                              </div>
                              <div>
                                 <p className="font-bold text-sm text-white truncate max-w-[200px] sm:max-w-xs">{uploadedFile.name}</p>
                                 <p className="text-[10px] text-emerald-400 mt-0.5">{(uploadedFile.size / (1024 * 1024)).toFixed(2)} MB • Ready for processing</p>
                              </div>
                           </>
                        ) : (
                           <>
                              <div className="w-12 h-12 rounded-xl bg-slate-700/50 text-slate-400 flex items-center justify-center">
                                 <Upload size={24} />
                              </div>
                              <div>
                                 <p className="font-bold text-sm text-white">Click to upload document</p>
                                 <p className="text-[10px] text-slate-500 mt-1">Supports PDF, PNG, JPG, DOCX (Max 25MB)</p>
                              </div>
                           </>
                        )}
                     </div>
                  </div>
               </div>
            </div>

            {/* Right Column - Structure Builder */}
            <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-white shadow-2xl space-y-6 relative overflow-hidden">
               <div className="flex justify-between items-center">
                  <div>
                     <h3 className="text-xl font-black tracking-tight text-white mb-1 flex items-center gap-2"><Layout size={20} className="text-indigo-400" /> Paper Output Architecture</h3>
                     <p className="text-xs text-slate-400">Define the exact breakdown of questions to extract</p>
                  </div>
                  <button
                     onClick={addAiSection}
                     className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-lg shadow-indigo-600/30"
                  >
                     <Plus size={14} /> Add Section
                  </button>
               </div>

               <div className="space-y-4 max-h-[420px] overflow-y-auto pr-2 custom-scrollbar">
                  {aiSections.map((sec, index) => (
                     <div key={sec.id} className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 justify-between transition-all">
                        <div className="w-8 h-8 rounded-lg bg-slate-700 text-slate-300 flex items-center justify-center font-black text-xs shrink-0">
                           {index + 1}
                        </div>

                        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                           <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Question Type</label>
                              <select
                                 value={sec.type}
                                 onChange={e => updateAiSection(sec.id, 'type', e.target.value)}
                                 className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 px-3 text-sm font-medium outline-none focus:border-indigo-500"
                              >
                                 {questionTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                              </select>
                           </div>
                           <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Quantity</label>
                              <div className="relative">
                                 <input
                                    type="number"
                                    min="1"
                                    value={sec.count}
                                    onChange={e => updateAiSection(sec.id, 'count', parseInt(e.target.value) || 0)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 px-3 text-sm font-medium outline-none focus:border-indigo-500"
                                 />
                                 <span className="absolute right-3 top-2 text-xs text-slate-500 font-bold">Qs</span>
                              </div>
                           </div>
                           <div>
                              <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Marks Each</label>
                              <div className="relative">
                                 <input
                                    type="number"
                                    min="1"
                                    value={sec.marks}
                                    onChange={e => updateAiSection(sec.id, 'marks', parseInt(e.target.value) || 0)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg py-2 px-3 text-sm font-medium outline-none focus:border-indigo-500"
                                 />
                                 <span className="absolute right-3 top-2 text-xs text-slate-500 font-bold">Pts</span>
                              </div>
                           </div>
                        </div>

                        <button onClick={() => removeAiSection(sec.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors shrink-0">
                           <Trash2 size={18} />
                        </button>
                     </div>
                  ))}

                  {aiSections.length === 0 && (
                     <div className="text-center py-12 text-slate-500 border-2 border-dashed border-white/10 rounded-2xl">
                        <p className="text-sm">No sections defined. Add a section to start.</p>
                     </div>
                  )}
               </div>

               <div className="pt-6 mt-6 border-t border-white/10 relative z-10">
                  <div className="flex justify-between items-center mb-6">
                     <span className="text-sm font-bold text-slate-400">Total Marks: <span className="text-white ml-2 text-lg">{aiSections.reduce((acc, s) => acc + (s.count * s.marks), 0)}</span></span>
                     <span className="text-sm font-bold text-slate-400">Total Questions: <span className="text-white ml-2 text-lg">{aiSections.reduce((acc, s) => acc + s.count, 0)}</span></span>
                  </div>

                  <button
                     onClick={() => { handleGenerateClick(); }}
                     disabled={isGenerating || !uploadedFile || !state.selectedSubject || aiSections.length === 0}
                     className="w-full py-4 sm:py-5 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-[0.15em] sm:tracking-[0.2em] hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/20 active:scale-[0.98] text-sm sm:text-base"
                  >
                     {isGenerating ? (
                        <>
                           <RefreshCw className="animate-spin" /> Analyzing Document & Generating...
                        </>
                     ) : (
                        <>
                           <Sparkles size={20} className="text-indigo-600" /> Generate Examination Paper
                        </>
                     )}
                  </button>
               </div>
            </div>
         </div>
      </div>
   );

   // --- EXISTING MANUAL WIZARD STEPS ---
   if (state.step === 'CLASS') return (
      <div className="p-4 md:p-12 max-w-7xl">
         <button onClick={() => setState({ ...state, step: 'SYLLABUS' })} className="text-gray-400 hover:text-gray-900 flex items-center gap-2 mb-8 font-bold text-sm uppercase tracking-widest transition-colors"><ArrowLeft size={18} /> Back</button>
         <StepIndicator />
         <h2 className="text-3xl font-black text-gray-900 mb-12 tracking-tight">Step 2: Select Academic Grade</h2>
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredClasses.map(c => (
               <div key={c.id} onClick={() => setState({ ...state, selectedClass: c.id, step: 'SUBJECT' })} className="group p-8 rounded-3xl border border-gray-100 bg-white shadow-sm hover:shadow-2xl border-b-4 border-b-indigo-500 flex flex-col items-center text-center transition-all cursor-pointer">
                  <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-all overflow-hidden border border-indigo-100 shadow-inner">
                     {c.logo ? <img src={c.logo} className="w-full h-full object-cover" /> : <GraduationCap size={36} />}
                  </div>
                  <h3 className="font-black text-gray-900 text-xl group-hover:text-indigo-600 transition-colors">{c.name}</h3>
                  <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2 px-3 py-1 bg-gray-50 rounded-full border border-gray-100">
                     {syllabuses.find(s => s.id === c.syllabusId)?.name}
                  </span>
               </div>
            ))}
         </div>
      </div>
   );

   if (state.step === 'SUBJECT') return (
      <div className="p-4 md:p-12 max-w-7xl">
         <button onClick={() => setState({ ...state, step: 'CLASS' })} className="text-gray-400 hover:text-gray-900 flex items-center gap-2 mb-8 font-bold text-sm uppercase tracking-widest transition-colors"><ArrowLeft size={18} /> Back</button>
         <StepIndicator />
         <h2 className="text-3xl font-black text-gray-900 mb-12 tracking-tight">Step 3: Select Subject</h2>
         <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {filteredSubjects.map(s => (
               <div key={s.id} onClick={() => setState({ ...state, selectedSubject: s.id, selectedSchemeId: '', step: 'CHAPTERS' })} className="group p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-2xl transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-6">
                     <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center overflow-hidden border border-emerald-100 shadow-inner group-hover:scale-110 transition-transform">
                        {s.logo ? <img src={s.logo} className="w-full h-full object-cover" /> : <Library size={28} />}
                     </div>
                     <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <ChevronRight size={16} />
                     </div>
                  </div>
                  <h4 className="font-black text-gray-900 text-lg group-hover:text-indigo-600 transition-colors leading-tight">{s.name}</h4>
                  <p className="text-[10px] font-black text-gray-400 uppercase mt-2 tracking-wider flex items-center gap-1.5">
                     <GraduationCap size={12} /> {classes.find(c => c.id === s.classId)?.name}
                  </p>
               </div>
            ))}
         </div>
      </div>
   );

   if (state.step === 'SCHEME') return (
      <div className="p-4 md:p-12 max-w-7xl">
         <button onClick={() => setState({ ...state, step: 'SUBJECT' })} className="text-gray-400 hover:text-gray-900 flex items-center gap-2 mb-8 font-bold text-sm uppercase tracking-widest transition-colors"><ArrowLeft size={18} /> Back</button>
         <StepIndicator />
         <div className="flex flex-col md:flex-row md:items-end justify-between gap-5 mb-8">
            <div>
               <h2 className="text-3xl font-black text-gray-900 tracking-tight">Step 4: Select Pairing Scheme</h2>
               <p className="text-gray-500 text-sm mt-2">Old/New is an additional filter. Board and custom scheme choices remain available.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
               <button
                  onClick={() => setState(prev => ({ ...prev, selectedSchemeId: '', step: 'CHAPTERS' }))}
                  className="px-5 py-2.5 bg-white border-2 border-gray-200 rounded-xl text-xs font-black text-gray-500 uppercase tracking-widest hover:bg-gray-50 hover:border-indigo-200 transition-all"
               >
                  Skip → Continue to Topics
               </button>
               <div className="grid grid-cols-2 gap-2 p-1.5 bg-gray-100 rounded-2xl min-w-[260px]">
                  {(['OLD', 'NEW'] as SchemeVersion[]).map(version => (
                     <button key={version} type="button" onClick={() => setState(prev => ({ ...prev, selectedSchemeVersion: version, selectedSchemeId: '' }))}
                        className={`h-11 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${(state.selectedSchemeVersion || 'NEW') === version ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-500 hover:bg-white'}`}>
                        {version === 'OLD' ? 'Old Scheme' : 'New Scheme'}
                     </button>
                  ))}
               </div>
            </div>
         </div>

         {versionedSchemes.length === 0 ? (
            <div className="p-10 bg-amber-50 border border-amber-200 rounded-3xl text-center">
               <Info className="mx-auto text-amber-500 mb-3" />
               <p className="font-black text-amber-900">No {(state.selectedSchemeVersion || 'NEW').toLowerCase()} pairing scheme is available for this subject.</p>
               <button onClick={() => setState(prev => ({ ...prev, selectedSchemeId: '', step: 'CHAPTERS' }))} className="mt-5 px-6 py-3 bg-white border border-amber-300 rounded-xl text-xs font-black text-amber-800 uppercase tracking-widest">Continue Without Scheme</button>
            </div>
         ) : (
            <div className="space-y-8">
               {[{ label: 'Official Board Schemes', items: globalSchemes }, { label: 'School / Custom Schemes', items: customSchemes }].map(group => group.items.length > 0 && (
                  <section key={group.label}>
                     <h3 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-4">{group.label}</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {group.items.map(scheme => (
                           <button key={scheme.id} type="button" onClick={() => setState(prev => ({ ...prev, selectedSchemeId: scheme.id, step: 'CHAPTERS' }))}
                              className={`text-left p-6 bg-white border-2 rounded-3xl hover:border-indigo-500 hover:shadow-xl transition-all relative overflow-hidden ${ (scheme.schemeVersion || 'OLD') === 'NEW' ? 'border-indigo-200 shadow-md' : 'border-gray-100'}`}>
                              {(scheme.schemeVersion || 'OLD') === 'NEW' && (
                                 <div className="absolute top-3 right-3 bg-indigo-600 text-white text-[8px] font-black uppercase px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <Sparkles size={8} /> Latest
                                 </div>
                              )}
                              <div className="flex items-center justify-between gap-2 mb-3">
                                 <span className={`text-[9px] px-2 py-1 rounded-full font-black uppercase ${scheme.isGlobal ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>{scheme.isGlobal ? 'Board' : 'Custom'}</span>
                                 <span className={`text-[9px] px-2 py-1 rounded-full font-black uppercase ${ (scheme.schemeVersion || 'OLD') === 'NEW' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>{scheme.schemeVersion || 'OLD'}</span>
                              </div>
                              <h4 className="font-black text-gray-900">{scheme.name}</h4>
                              <p className="mt-3 text-xs font-bold text-gray-400">{scheme.totalMarks} marks • {scheme.durationMin} min • {scheme.structure.length} sections</p>
                           </button>
                        ))}
                     </div>
                  </section>
               ))}
            </div>
         )}
      </div>
   );

   if (state.step === 'CHAPTERS') {
      const boardScheme = selectedScheme;

      const handleFullPaperWithScheme = () => {
         if (!boardScheme) return;
         const allChNames = relevantChapters.map(c => c.name);
         const allTopNames = relevantChapters.flatMap(c => getSubtopicsForChapter(c.name));

         const struct: PaperStructure = {};
         (boardScheme.structure as SchemeSectionDef[]).forEach((secDef, idx) => {
            const secId = `sec_scheme_${Date.now()}_${idx}`;
            const sectionRole = secDef.sectionRole || (secDef.type === 'Long Answer' ? 'LONG_QUESTION' : secDef.type === 'Short Answer' ? 'SHORT_GROUP' : 'OBJECTIVE');
            const isObjective = sectionRole === 'OBJECTIVE';
            const instruction = secDef.instruction || (sectionRole === 'SHORT_GROUP'
               ? `Write short answers to any ${secDef.selectCount} questions:`
               : getDefaultSectionInstruction(secDef.type, secDef.selectCount, secDef.totalCount));
            const instructionUrdu = secDef.instructionUrdu || (sectionRole === 'SHORT_GROUP'
               ? `کوئی سے ${secDef.selectCount} سوالات کے مختصر جوابات لکھئے:`
               : getDefaultSectionInstructionUrdu(secDef.type, secDef.selectCount, secDef.totalCount));
            struct[secId] = {
               id: secId,
               title: secDef.title || `Q.${idx + 1} ${secDef.type}`,
               instruction,
               instructionUrdu,
               questionType: secDef.type,
               marksPerQuestion: secDef.marksPerQuestion,
               totalCount: secDef.totalCount,
               selectCount: secDef.selectCount,
               blankLines: 0,
               blankLineType: 'Line',
               questionsPerLine: false,
               languageMedium: 'Bilingual',
               sourceFilter: [],
               category: isObjective ? 'Objective' : 'Subjective',
               subQuestionNumbering: secDef.type === 'MCQ' ? 'Numeric' : 'Roman',
               sectionRole,
               questionNumber: secDef.questionNumber || idx + 1,
               hasParts: secDef.hasParts,
               parts: secDef.parts,
               hasInternalChoice: secDef.hasInternalChoice,
               chapterDistribution: secDef.chapterDistribution,
               isCompulsory: secDef.isCompulsory
            };
         });

         setState(prev => ({
            ...prev,
            selectedChapters: allChNames,
            selectedTopics: allTopNames,
            paperStructure: struct,
            step: 'SETUP'
         }));
      };

      return (
         <div className="p-4 md:p-12 max-w-7xl">
            <button onClick={() => setState({ ...state, step: 'SUBJECT' })} className="text-gray-400 hover:text-gray-900 flex items-center gap-2 mb-8 font-bold text-sm uppercase tracking-widest transition-colors"><ArrowLeft size={18} /> Back</button>
            <StepIndicator />
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
               <div>
                  <h2 className="text-3xl font-black text-gray-900 tracking-tight">Step 4: Select Chapters &amp; Topics</h2>
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                     <p className="text-gray-500 text-xs">Select individual chapters/topics or generate a Full Book Paper</p>
                     {boardScheme ? (
                        <span className="text-[9px] px-2.5 py-1 rounded-full bg-indigo-100 text-indigo-700 font-black uppercase border border-indigo-200 flex items-center gap-1">
                           <Sparkles size={8} /> {boardScheme.name}
                        </span>
                     ) : (
                        <span className="text-[9px] px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 font-black uppercase">No Scheme Selected</span>
                     )}
                  </div>
               </div>
               <div className="flex flex-wrap items-center gap-2">
                  <button onClick={() => setState({ ...state, step: 'SCHEME' })} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200">
                     <Layers size={14} /> Pairing Schemes
                  </button>
                  <button onClick={() => setState(prev => ({ ...prev, selectedChapters: [], selectedTopics: [] }))} className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all">Clear Selection</button>
                  <button onClick={handleSelectAllChapters} className="px-5 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-black text-gray-700 uppercase tracking-widest hover:bg-gray-100 transition-all">Select All Topics (Normal)</button>
                  {boardScheme && (
                     <button onClick={handleFullPaperWithScheme} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200">
                        <Sparkles size={14} /> Full Book ({boardScheme.name})
                     </button>
                  )}
               </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
               {relevantChapters.map((c, idx) => (
                  <div key={idx} className={`p-5 bg-white rounded-[2rem] border-2 flex items-start gap-4 transition-all ${state.selectedChapters.includes(c.name) ? 'border-indigo-300 bg-indigo-50/20 shadow-md' : 'border-gray-100 hover:bg-gray-50/50'}`}>
                     <div onClick={() => handleChapterToggle(c.name)} className={`mt-1.5 w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all ${state.selectedChapters.includes(c.name) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'border-gray-200 bg-white'}`}>{state.selectedChapters.includes(c.name) && <Check size={16} strokeWidth={3} />}</div>
                     <div className="flex-1 min-w-0">
                        <span onClick={() => handleChapterToggle(c.name)} className="font-black block text-xl text-gray-900 cursor-pointer leading-tight mb-3">{c.name}</span>
                        <div className="flex flex-wrap gap-2">
                           {getSubtopicsForChapter(c.name).map((sub, i) => (
                              <span key={i} onClick={() => {
                                 const isSelected = state.selectedTopics.includes(sub);
                                 setState(prev => {
                                    const newTopics = isSelected ? prev.selectedTopics.filter(t => t !== sub) : [...prev.selectedTopics, sub];
                                    const newChapters = !isSelected && !prev.selectedChapters.includes(c.name) ? [...prev.selectedChapters, c.name] : prev.selectedChapters;
                                    return { ...prev, selectedTopics: newTopics, selectedChapters: newChapters };
                                 });
                              }} className={`text-[10px] px-3 py-1.5 rounded-xl border-2 cursor-pointer transition-all font-black uppercase tracking-widest ${state.selectedTopics.includes(sub) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-200'}`}>{sub}</span>
                           ))}
                        </div>
                     </div>
                  </div>
               ))}
            </div>
            <div className="flex justify-start"><button onClick={initStructure} disabled={state.selectedChapters.length === 0} className="px-12 py-4 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-700 disabled:opacity-50 shadow-2xl shadow-indigo-200 text-sm transition-all transform hover:scale-105 active:scale-95">Continue to Setup</button></div>
         </div>
      );
   }

   if (state.step === 'SETUP') return (
      <div className="p-4 md:p-12 max-w-7xl relative">
         <button onClick={() => setState({ ...state, step: 'CHAPTERS' })} className="text-gray-400 hover:text-gray-900 flex items-center gap-2 mb-8 font-bold text-sm uppercase tracking-widest transition-colors"><ArrowLeft size={18} /> Back</button>
         <StepIndicator />
         <h2 className="text-3xl font-black text-gray-900 mb-12 tracking-tight">Step 5: Paper Preview Preparation</h2>

         <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            <div className="space-y-8">
               <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Layout size={18} /> Visual Formatting</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Watermark Type</label>
                        <select value={state.watermark} onChange={e => setState({ ...state, watermark: e.target.value as WatermarkType })} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                           <option value="None">Disabled</option>
                           <option value="Monogram">School Logo</option>
                           <option value="Confidential">CONFIDENTIAL</option>
                           <option value="Draft">DRAFT COPY</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Print Layout</label>
                        <select value={state.paperLayout} onChange={e => setState({ ...state, paperLayout: e.target.value as PaperLayoutMode })} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                           <option value="Standard">Standard (Full Page)</option>
                           <option value="DoubleColumn">Compact (2 Columns)</option>
                        </select>
                     </div>
                  </div>

                  <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                     <div>
                        <p className="text-xs font-black text-gray-800 uppercase tracking-widest">Student Online Portal</p>
                        <p className="text-[10px] text-gray-400 font-medium">Make this exam available for student login</p>
                     </div>
                     <button
                        onClick={() => setState(prev => ({ ...prev, isOnline: !prev.isOnline }))}
                        className={`w-12 h-6 rounded-full relative transition-all ${state.isOnline ? 'bg-indigo-600' : 'bg-gray-200'}`}
                     >
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${state.isOnline ? 'right-1' : 'left-1 shadow-sm'}`}></div>
                     </button>
                  </div>
               </div>

               <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-[2rem] sm:rounded-[2.5rem] border border-gray-100 shadow-sm min-w-0">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-5 sm:mb-6">
                     <div>
                        <h4 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2"><CheckCircle2 size={18} /> Initializing Sections</h4>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">Quickly set marks, question type, and choice to auto-compose the paper.</p>
                     </div>
                     <div className="flex flex-wrap items-center gap-2">
                        <button
                           type="button"
                           onClick={() => setIsQuickBuilderOpen(true)}
                           className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:from-indigo-700 hover:to-violet-700 transition-all flex items-center justify-center gap-2 shadow-md shadow-indigo-200"
                        >
                           <Sparkles size={14} className="text-amber-300" /> Quick Auto-Builder
                        </button>
                        <button
                           onClick={addNewSection}
                           className="w-full sm:w-auto justify-center px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2"
                        >
                           <Plus size={14} /> Add Custom Section
                        </button>
                     </div>
                  </div>

                  {/* SUMMARY STATS STRIP */}
                  {Object.keys(state.paperStructure).length > 0 && (
                     <div className="mb-5 grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-200/70 text-xs">
                        <div className="text-center p-1.5 bg-white rounded-xl shadow-xs">
                           <span className="text-[9px] uppercase tracking-wider text-slate-400 font-black block">Sections</span>
                           <span className="text-sm font-black text-indigo-600">{Object.keys(state.paperStructure).length}</span>
                        </div>
                        <div className="text-center p-1.5 bg-white rounded-xl shadow-xs">
                           <span className="text-[9px] uppercase tracking-wider text-slate-400 font-black block">Total Qs</span>
                           <span className="text-sm font-black text-slate-800">
                              {Object.values(state.paperStructure).reduce((acc: number, s: any) => acc + (s.totalCount || 0), 0)}
                           </span>
                        </div>
                        <div className="text-center p-1.5 bg-white rounded-xl shadow-xs">
                           <span className="text-[9px] uppercase tracking-wider text-slate-400 font-black block">To Attempt</span>
                           <span className="text-sm font-black text-emerald-600">
                              {Object.values(state.paperStructure).reduce((acc: number, s: any) => acc + (s.selectCount || 0), 0)}
                           </span>
                        </div>
                        <div className="text-center p-1.5 bg-white rounded-xl shadow-xs">
                           <span className="text-[9px] uppercase tracking-wider text-slate-400 font-black block">Total Marks</span>
                           <span className="text-sm font-black text-rose-600">
                              {Object.values(state.paperStructure).reduce((acc: number, s: any) => acc + ((s.selectCount || 0) * (s.marksPerQuestion || 1)), 0)}
                           </span>
                        </div>
                     </div>
                  )}

                  <div className="space-y-4 max-h-[55vh] lg:max-h-[440px] overflow-y-scroll overscroll-contain pr-2 custom-scrollbar">
                     {(Object.values(state.paperStructure) as PaperSectionConfig[]).map((sec, idx) => {
                        const isLongQ = sec.questionType === 'Long Answer';
                        const hasStudentChoice = sec.totalCount > sec.selectCount;
                        return (
                           <div key={sec.id} className="bg-gray-50 rounded-2xl sm:rounded-3xl p-4 sm:p-5 border-2 border-transparent hover:border-indigo-100 transition-all group relative min-w-0">
                              <div className="flex items-center justify-between gap-2 mb-4">
                                 <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-indigo-100">{idx + 1}</div>
                                    <span className="font-black text-sm text-gray-800">{sec.title}</span>
                                 </div>
                                 <div className="flex gap-2 shrink-0">
                                    <button onClick={() => setEditingSection(sec)} className="p-2 bg-white text-gray-400 hover:text-indigo-600 rounded-xl shadow-sm border border-gray-100 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all"><Settings2 size={16} /></button>
                                    <button onClick={() => removeSection(sec.id)} className="p-2 bg-white text-gray-400 hover:text-red-500 rounded-xl shadow-sm border border-gray-100 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                                 </div>
                              </div>
                              <div className="sm:ml-12 mb-3">
                                 <div className="flex gap-2 items-start">
                                    <textarea
                                       value={sec.instruction || getDefaultSectionInstruction(sec.questionType, sec.selectCount, sec.totalCount)}
                                       onChange={e => updateSection(sec.id, { instruction: e.target.value })}
                                       placeholder="Question heading / statement..."
                                       rows={2}
                                       className="flex-1 resize-y text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-2 outline-none focus:border-indigo-500"
                                    />
                                    <button
                                       onClick={() => updateSection(sec.id, { instruction: getDefaultSectionInstruction(sec.questionType, sec.selectCount, sec.totalCount) })}
                                       className="px-2.5 py-1.5 text-[9px] font-black text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg hover:bg-indigo-100 transition-all whitespace-nowrap mt-0.5"
                                    >Default</button>
                                 </div>
                              </div>
                              <div className="flex flex-wrap items-center gap-2 sm:ml-12">
                                 <div className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border ${sec.category === 'Objective' ? 'text-blue-600 border-blue-200' : 'text-purple-600 border-purple-200'}`}>
                                    <Layers size={12} /> {sec.category} Part
                                 </div>

                                 {/* INLINE QUESTION TYPE DROPDOWN */}
                                 <div className="flex items-center gap-1 bg-white px-2 py-1 rounded-lg border border-slate-200">
                                    <Library size={12} className="text-indigo-500 shrink-0" />
                                    <select
                                       value={sec.questionType}
                                       onChange={e => {
                                          const newType = e.target.value;
                                          const newCategory = newType === 'Multiple Choice' ? 'Objective' : 'Subjective';
                                          const newMarks = newType === 'Multiple Choice' ? 1 : newType === 'Short Question' ? 2 : 4;
                                          updateSection(sec.id, {
                                             questionType: newType,
                                             category: newCategory,
                                             marksPerQuestion: newMarks,
                                             instruction: getDefaultSectionInstruction(newType, sec.selectCount, sec.totalCount)
                                          });
                                       }}
                                       className="text-[10px] font-black uppercase tracking-wider text-slate-700 bg-transparent outline-none cursor-pointer"
                                    >
                                       <option value="Multiple Choice">Multiple Choice</option>
                                       <option value="Short Question">Short Question</option>
                                       <option value="Long Answer">Long Answer</option>
                                       <option value="Fill in the Blanks">Fill in Blanks</option>
                                       <option value="True/False">True/False</option>
                                       <option value="Translation">Translation</option>
                                       <option value="Words/Sentences">Words/Sentences</option>
                                    </select>
                                 </div>

                                 {/* CHOICE TOGGLE BUTTON */}
                                 <button
                                    type="button"
                                    onClick={() => {
                                       if (hasStudentChoice) {
                                          updateSection(sec.id, {
                                             totalCount: sec.selectCount,
                                             instruction: getDefaultSectionInstruction(sec.questionType, sec.selectCount, sec.selectCount)
                                          });
                                       } else {
                                          const extra = sec.questionType === 'Multiple Choice' ? 0 : sec.selectCount >= 5 ? 3 : 2;
                                          const newTotal = sec.selectCount + extra;
                                          updateSection(sec.id, {
                                             totalCount: newTotal,
                                             instruction: getDefaultSectionInstruction(sec.questionType, sec.selectCount, newTotal)
                                          });
                                       }
                                    }}
                                    className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border transition-all ${
                                       hasStudentChoice 
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100' 
                                          : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
                                    }`}
                                    title="Toggle student choice on/off for this section"
                                 >
                                    {hasStudentChoice ? (
                                       <>
                                          <CheckCircle2 size={12} className="text-emerald-600" />
                                          <span>Choice: {sec.selectCount} of {sec.totalCount}</span>
                                       </>
                                    ) : (
                                       <>
                                          <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                          <span>No Choice (All {sec.selectCount})</span>
                                       </>
                                    )}
                                 </button>

                                 <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 bg-white px-2.5 py-1 rounded-lg border border-emerald-200">
                                    <CheckCircle2 size={12} />
                                    <span className="uppercase tracking-widest text-slate-500">Attempt:</span>
                                    <input
                                       type="number"
                                       min="1"
                                       max={sec.totalCount}
                                       value={sec.selectCount}
                                       onChange={e => {
                                          const val = parseInt(e.target.value) || 1;
                                          const newTotal = Math.max(val, sec.totalCount);
                                          updateSection(sec.id, {
                                             selectCount: val,
                                             totalCount: newTotal,
                                             instruction: getDefaultSectionInstruction(sec.questionType, val, newTotal)
                                          });
                                       }}
                                       className="w-10 h-6 text-center font-black text-emerald-600 bg-emerald-50 border border-emerald-200 rounded outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                                    />
                                    <span className="text-slate-400">/</span>
                                    <input
                                       type="number"
                                       min={sec.selectCount}
                                       value={sec.totalCount}
                                       onChange={e => {
                                          const val = parseInt(e.target.value) || 1;
                                          updateSection(sec.id, {
                                             totalCount: Math.max(val, sec.selectCount),
                                             instruction: getDefaultSectionInstruction(sec.questionType, sec.selectCount, Math.max(val, sec.selectCount))
                                          });
                                       }}
                                       className="w-10 h-6 text-center font-black text-slate-700 bg-slate-50 border border-slate-200 rounded outline-none focus:ring-2 focus:ring-indigo-500 text-xs"
                                    />
                                    <span className="uppercase tracking-widest text-slate-500">Qs</span>
                                 </div>
                                 <div className="flex items-center gap-1.5 text-[9px] font-black text-rose-600 bg-white px-2.5 py-1 rounded-lg border border-rose-200">
                                    <Tag size={12} />
                                    <span className="uppercase tracking-widest text-slate-500">Marks/Q:</span>
                                    <input
                                       type="number"
                                       min="1"
                                       value={sec.marksPerQuestion}
                                       onChange={e => updateSection(sec.id, { marksPerQuestion: parseInt(e.target.value) || 1 })}
                                       className="w-12 h-6 text-center font-black text-rose-600 bg-rose-50 border border-rose-200 rounded outline-none focus:ring-2 focus:ring-rose-500 text-xs"
                                    />
                                 </div>
                                 <div className="flex items-center gap-1 text-[9px] font-black text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg border border-purple-200">
                                    <span className="uppercase tracking-widest text-purple-400">Total:</span>
                                    <span>{(sec.selectCount || 0) * (sec.marksPerQuestion || 1)} M</span>
                                 </div>
                              </div>
                              {isLongQ && (
                                 <div className="sm:ml-12 mt-3 flex flex-wrap gap-2">
                                    <button
                                       onClick={() => updateSection(sec.id, { hasParts: !sec.hasParts })}
                                       className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${ sec.hasParts ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-500 border-gray-200 hover:border-indigo-300'}`}
                                    >
                                       {sec.hasParts ? '✓ Sub-parts (a,b,c) On' : '+ Enable Sub-parts (a,b,c)'}
                                    </button>
                                    <button
                                       onClick={() => updateSection(sec.id, { isCompulsory: !sec.isCompulsory })}
                                       className={`flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border transition-all ${ sec.isCompulsory ? 'bg-amber-500 text-white border-amber-500' : 'bg-white text-gray-500 border-gray-200 hover:border-amber-300'}`}
                                    >
                                       {sec.isCompulsory ? '★ Compulsory' : '☆ Mark as Compulsory'}
                                    </button>
                                 </div>
                              )}
                           </div>
                        );
                     })}
                  </div>
               </div>
            </div>

            <div className="bg-slate-900 rounded-[3rem] p-10 flex flex-col justify-center items-center text-center text-white relative overflow-hidden shadow-2xl h-fit self-start">
               <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl"></div>
               <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center mb-6 backdrop-blur-md border border-white/10">
                  <MonitorPlay size={40} className="text-brand" />
               </div>
               <h3 className="text-2xl font-black tracking-tight mb-4">Ready to Draft?</h3>
               <p className="text-slate-400 text-sm leading-relaxed mb-8 max-w-xs">
                  Configure your preferred generation mode.
               </p>

               {/* MODE SWITCHER */}
               <div className="w-full bg-slate-800 p-1.5 rounded-xl flex mb-8">
                  <button
                     onClick={() => setState({ ...state, configMode: 'MANUAL' })}
                     className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${state.configMode === 'MANUAL' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
                  >
                     Repository Source
                  </button>
                  <button
                     onClick={() => setState({ ...state, configMode: 'AUTO' })}
                     className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${state.configMode === 'AUTO' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                  >
                     <Zap size={12} /> AI Document Source
                  </button>
               </div>

               {/* REPOSITORY MODE CONFIG */}
               {state.configMode === 'MANUAL' && (
                  <div className="w-full mb-8 bg-slate-800/50 p-4 rounded-2xl border border-slate-700 animate-in fade-in zoom-in">
                     <div className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-700 cursor-pointer" onClick={() => setAutoFillRepo(!autoFillRepo)}>
                        <div className="text-left">
                           <p className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2"><Database size={12} /> Auto-fill from Bank</p>
                           <p className="text-[9px] text-slate-400 mt-1">Randomly pick questions from repository</p>
                        </div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${autoFillRepo ? 'bg-indigo-600' : 'bg-slate-600'}`}>
                           <div className={`absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all ${autoFillRepo ? 'right-0.5' : 'left-0.5'}`}></div>
                        </div>
                     </div>
                     {!autoFillRepo && (
                        <p className="text-[9px] text-slate-400 mt-3 italic">You will select questions manually inside the editor.</p>
                     )}
                  </div>
               )}

               {/* AI MODE CONFIG */}
               {state.configMode === 'AUTO' && (
                  <div className="w-full mb-8 bg-slate-800/50 p-4 rounded-2xl border border-slate-700 animate-in fade-in zoom-in">
                     <div
                        onClick={() => fileInputRef.current?.click()}
                        className="border-2 border-dashed border-slate-600 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-400 hover:bg-slate-700 transition-all group mb-4"
                     >
                        <Upload size={24} className="mx-auto mb-2 text-slate-400 group-hover:text-white" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{uploadedFile ? uploadedFile.name : "Upload Document Source (PDF/IMG)"}</p>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
                     </div>

                     <div className="space-y-2 mb-4">
                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                           <span>Initializing Sections</span>
                           <button onClick={addAiSection} className="text-indigo-400 hover:text-white flex items-center gap-1"><Plus size={10} /> Add</button>
                        </div>
                        <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                           {aiSections.map((sec, idx) => (
                              <div key={sec.id} className="grid grid-cols-7 gap-2 items-center bg-slate-900/50 p-2 rounded-lg border border-slate-700">
                                 <div className="col-span-3">
                                    <select value={sec.type} onChange={e => updateAiSection(sec.id, 'type', e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-md p-1 text-[10px] text-white">
                                       {questionTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                                    </select>
                                 </div>
                                 <div className="col-span-2 relative">
                                    <input type="number" value={sec.count} onChange={e => updateAiSection(sec.id, 'count', parseInt(e.target.value) || 0)} className="w-full bg-slate-800 border border-slate-600 rounded-md p-1 text-[10px] text-white text-center" placeholder="Qty" />
                                    <span className="absolute right-1 top-1 text-[8px] text-slate-500">Qs</span>
                                 </div>
                                 <div className="col-span-1 relative">
                                    <input type="number" value={sec.marks} onChange={e => updateAiSection(sec.id, 'marks', parseInt(e.target.value) || 0)} className="w-full bg-slate-800 border border-slate-600 rounded-md p-1 text-[10px] text-white text-center" placeholder="M" />
                                 </div>
                                 <div className="col-span-1 flex justify-end">
                                    <button onClick={() => removeAiSection(sec.id)} className="text-red-400 hover:text-red-300"><Trash2 size={12} /></button>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  </div>
               )}

               <button
                  onClick={() => { handleGenerateClick(); }}
                  disabled={isGenerating || (state.configMode === 'AUTO' && !uploadedFile)}
                  className="w-full py-5 bg-white text-slate-900 font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-light transition-all shadow-xl text-xs active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
               >
                  {isGenerating ? (
                     <>
                        <RefreshCw className="animate-spin" /> Generating...
                     </>
                  ) : (
                     state.configMode === 'AUTO'
                        ? 'Generate from Document'
                        : (autoFillRepo ? 'Auto-Generate Paper' : 'Enter Blank Editor')
                  )}
               </button>
            </div>
         </div>

         {/* SECTION PROPERTY EDITOR MODAL */}
         {editingSection && (
            <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-hidden">
               <div className="bg-white rounded-2xl sm:rounded-[2.5rem] shadow-2xl w-full max-w-md max-h-[calc(100dvh-1rem)] sm:max-h-[calc(100dvh-2rem)] overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col">
                  <div className="px-5 sm:px-8 py-4 sm:py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0">
                     <h3 className="font-bold text-lg text-gray-900">Configure Section</h3>
                     <button onClick={() => setEditingSection(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20} /></button>
                  </div>
                  <div className="p-5 sm:p-8 space-y-5 sm:space-y-6 overflow-y-auto overscroll-contain custom-scrollbar min-h-0">
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Section Heading</label>
                        <input
                           type="text"
                           value={editingSection.title}
                           onChange={e => setEditingSection({ ...editingSection, title: e.target.value })}
                           className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Paper Part</label>
                        <select
                           value={editingSection.category}
                           onChange={e => setEditingSection({ ...editingSection, category: e.target.value as 'Objective' | 'Subjective' })}
                           className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                           <option value="Objective">Objective Part</option>
                           <option value="Subjective">Subjective Part</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Question Type</label>
                        <select
                           value={editingSection.questionType}
                           onChange={e => setEditingSection({ ...editingSection, questionType: e.target.value })}
                           className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                           {availableTypesForConfig.length > 0 ? (
                              availableTypesForConfig.map(t => <option key={t.id} value={t.id}>{t.name}</option>)
                           ) : (
                              <option disabled>No questions available for this scope</option>
                           )}
                        </select>
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Language</label>
                        <select
                           value={editingSection.languageMedium}
                           onChange={e => setEditingSection({ ...editingSection, languageMedium: e.target.value as any })}
                           className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                           <option value="English">English</option>
                           <option value="Urdu">Urdu</option>
                           <option value="Bilingual">Both</option>
                        </select>
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">English Question Heading / Statement</label>
                        <textarea
                           value={editingSection.instruction || ''}
                           onChange={e => setEditingSection({ ...editingSection, instruction: e.target.value })}
                           placeholder="Subjective Part 2&#10;Write answers in detail. Attempt any 5 questions."
                           className="w-full min-h-[88px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                     </div>
                     <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Urdu Question Heading / Statement</label>
                        <textarea
                           dir="rtl"
                           value={editingSection.instructionUrdu || ''}
                           onChange={e => setEditingSection({ ...editingSection, instructionUrdu: e.target.value })}
                           placeholder="حصہ دوم&#10;تفصیلی جواب لکھیں۔ کوئی پانچ سوال حل کریں۔"
                           className="w-full min-h-[88px] px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl font-urdu font-bold text-sm text-right outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                        />
                     </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Questions</label>
                           <input
                              type="number"
                              value={editingSection.totalCount}
                              onChange={e => setEditingSection({ ...editingSection, totalCount: parseInt(e.target.value) || 0 })}
                              className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm"
                           />
                        </div>
                        <div>
                           <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Attempt Req.</label>
                           <input
                              type="number"
                              value={editingSection.selectCount}
                              onChange={e => setEditingSection({ ...editingSection, selectCount: parseInt(e.target.value) || 0 })}
                              className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm"
                           />
                        </div>
                     </div>
                     <div className="p-4 bg-indigo-50 rounded-2xl flex items-start gap-3">
                        <Info size={18} className="text-indigo-600 mt-0.5" />
                        <p className="text-[10px] text-indigo-900 font-bold uppercase tracking-tight leading-relaxed">
                           Choice Logic: Student will be provided <strong>{editingSection.totalCount}</strong> questions and must attempt <strong>{editingSection.selectCount}</strong>.
                           The remaining <strong>{editingSection.totalCount - editingSection.selectCount}</strong> will be 'ignored' options.
                        </p>
                     </div>
                  </div>
                  <div className="p-4 sm:p-6 border-t border-gray-100 bg-gray-50 flex gap-3 shrink-0">
                     <button onClick={() => setEditingSection(null)} className="flex-1 py-3 text-sm font-bold text-gray-400 hover:bg-gray-200 rounded-xl transition-all">Cancel</button>
                     <button
                        onClick={() => {
                           updateSection(editingSection.id, editingSection);
                           setEditingSection(null);
                        }}
                        className="flex-[2] py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all"
                     >
                        Apply Configuration
                     </button>
                  </div>
               </div>
            </div>
         )}

         {/* QUICK AUTO-BUILDER MODAL */}
         {isQuickBuilderOpen && (
            <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
               <div className="bg-white rounded-3xl sm:rounded-[2.5rem] w-full max-w-2xl border border-slate-100 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
                  <div className="p-5 sm:p-6 border-b border-slate-100 flex items-center justify-between shrink-0 bg-gradient-to-r from-indigo-50/80 via-white to-violet-50/80">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                           <Sparkles size={20} className="text-amber-300" />
                        </div>
                        <div>
                           <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">Quick Paper Auto-Builder</h3>
                           <p className="text-[10px] sm:text-xs text-slate-500 font-medium">Just specify marks, question type, and choice. The system creates and auto-fills questions.</p>
                        </div>
                     </div>
                     <button
                        onClick={() => setIsQuickBuilderOpen(false)}
                        className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-all"
                     >
                        <X size={18} />
                     </button>
                  </div>

                  {/* TAB SWITCHER */}
                  <div className="px-5 pt-3 border-b border-slate-100 bg-slate-50/50 flex gap-2 shrink-0">
                     <button
                        type="button"
                        onClick={() => setBuilderTab('SIMPLE')}
                        className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
                           builderTab === 'SIMPLE'
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                     >
                        <Zap size={13} className="text-amber-500" />
                        Quick 1-Step (Total Marks + Type + Choice)
                     </button>
                     <button
                        type="button"
                        onClick={() => setBuilderTab('ADVANCED')}
                        className={`pb-2.5 px-3 text-xs font-black uppercase tracking-wider border-b-2 transition-all flex items-center gap-1.5 ${
                           builderTab === 'ADVANCED'
                              ? 'border-indigo-600 text-indigo-600'
                              : 'border-transparent text-slate-400 hover:text-slate-600'
                        }`}
                     >
                        <Layers size={13} />
                        Multi-Section Blueprint ({quickSections.length})
                     </button>
                  </div>

                  {/* MODAL BODY */}
                  <div className="p-5 sm:p-6 overflow-y-auto space-y-4 custom-scrollbar flex-1">
                     {builderTab === 'SIMPLE' ? (
                        /* SIMPLE MODE: ONLY ASK TOTAL MARKS, QUESTION TYPE, CHOICE OR NOT */
                        <div className="space-y-4">
                           <div className="bg-gradient-to-br from-indigo-50/90 to-purple-50/60 p-4 rounded-2xl border border-indigo-100">
                              <p className="text-xs font-bold text-indigo-950 leading-relaxed">
                                 Enter <strong>Total Marks</strong>, choose <strong>Question Type</strong>, and select whether to give <strong>Student Choice</strong>.
                                 The system will automatically calculate the questions to attempt and auto-fill them evenly across your chapters!
                              </p>
                           </div>

                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* QUESTION TYPE */}
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                                 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Library size={13} className="text-indigo-600" /> 1. Question Type
                                 </label>
                                 <select
                                    value={quickSimpleType}
                                    onChange={e => {
                                       const t = e.target.value;
                                       setQuickSimpleType(t);
                                       const defMarks = t === 'Multiple Choice' ? 1 : t === 'Short Question' ? 2 : 4;
                                       setQuickSimpleMarksPerQ(defMarks);
                                    }}
                                    className="w-full h-11 px-3 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 cursor-pointer"
                                 >
                                    <option value="Short Question">Short Question</option>
                                    <option value="Multiple Choice">Multiple Choice (MCQ)</option>
                                    <option value="Long Answer">Long Answer</option>
                                    <option value="Fill in the Blanks">Fill in the Blanks</option>
                                    <option value="True/False">True / False</option>
                                    <option value="Translation">Translation</option>
                                    <option value="Words/Sentences">Words / Sentences</option>
                                 </select>
                                 <p className="text-[10px] text-slate-400 mt-2">Default: {quickSimpleMarksPerQ} marks per question</p>
                              </div>

                              {/* TOTAL MARKS */}
                              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80">
                                 <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                    <Tag size={13} className="text-rose-600" /> 2. Total Marks for Section
                                 </label>
                                 <div className="flex items-center gap-2">
                                    <input
                                       type="number"
                                       min="1"
                                       step="1"
                                       value={quickSimpleTotalMarks}
                                       onChange={e => setQuickSimpleTotalMarks(Math.max(1, parseInt(e.target.value) || 1))}
                                       className="flex-1 h-11 px-3 bg-white border border-slate-200 rounded-xl text-base font-black text-rose-600 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100 text-center"
                                    />
                                    <span className="text-xs font-black text-slate-400">Marks</span>
                                 </div>
                                 <div className="flex items-center justify-between mt-2 text-[10px] text-slate-500">
                                    <span>Marks / Q:</span>
                                    <input
                                       type="number"
                                       min="1"
                                       value={quickSimpleMarksPerQ}
                                       onChange={e => setQuickSimpleMarksPerQ(Math.max(1, parseInt(e.target.value) || 1))}
                                       className="w-12 h-6 text-center font-bold text-slate-700 bg-white border border-slate-200 rounded outline-none text-xs"
                                    />
                                 </div>
                              </div>
                           </div>

                           {/* CHOICE OR NOT */}
                           <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
                                 <CheckCircle2 size={13} className="text-emerald-600" /> 3. Student Choice
                              </label>
                              <div className="grid grid-cols-2 gap-3">
                                 <button
                                    type="button"
                                    onClick={() => setQuickSimpleHasChoice(true)}
                                    className={`py-3 px-4 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                       quickSimpleHasChoice
                                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-100'
                                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                 >
                                    <CheckCircle2 size={15} /> Give Choice (e.g. 5 of 8)
                                 </button>
                                 <button
                                    type="button"
                                    onClick={() => setQuickSimpleHasChoice(false)}
                                    className={`py-3 px-4 rounded-xl border text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                                       !quickSimpleHasChoice
                                          ? 'bg-slate-800 text-white border-slate-800 shadow-md shadow-slate-200'
                                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                                    }`}
                                 >
                                    <span>✕</span> No Choice (Attempt All)
                                 </button>
                              </div>

                              {quickSimpleHasChoice && (
                                 <div className="bg-white p-3 rounded-xl border border-emerald-100 flex items-center justify-between text-xs">
                                    <span className="text-slate-600 font-semibold">Extra optional questions for choice:</span>
                                    <div className="flex items-center gap-2">
                                       <input
                                          type="number"
                                          min="1"
                                          value={quickSimpleExtraChoices}
                                          onChange={e => setQuickSimpleExtraChoices(Math.max(1, parseInt(e.target.value) || 1))}
                                          className="w-12 h-7 text-center font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg outline-none text-xs"
                                       />
                                       <span className="text-slate-400 font-bold">extra Qs</span>
                                    </div>
                                 </div>
                              )}
                           </div>

                           {/* LIVE PREVIEW OF SYSTEM AUTO CALCULATION */}
                           {(() => {
                              const marksPerQ = Math.max(1, quickSimpleMarksPerQ);
                              const totalMarks = Math.max(marksPerQ, quickSimpleTotalMarks);
                              const selectCount = Math.max(1, Math.round(totalMarks / marksPerQ));
                              const extra = quickSimpleHasChoice ? Math.max(1, quickSimpleExtraChoices) : 0;
                              const totalCount = selectCount + extra;
                              return (
                                 <div className="bg-indigo-900 text-white p-4 rounded-2xl flex items-center justify-between shadow-lg shadow-indigo-950/20">
                                    <div>
                                       <span className="text-[9px] uppercase tracking-widest text-indigo-300 font-black block">Auto-Calculated Output</span>
                                       <span className="text-sm font-black">
                                          Print {totalCount} Questions → Student Attempts {selectCount}
                                       </span>
                                       <span className="text-[11px] text-indigo-200 block mt-0.5">
                                          ({selectCount} Qs × {marksPerQ} Marks = {selectCount * marksPerQ} Marks total)
                                       </span>
                                    </div>
                                    <div className="text-right bg-white/10 px-3 py-1.5 rounded-xl border border-white/10">
                                       <span className="text-[9px] uppercase tracking-wider text-indigo-200 font-black block">Choice Status</span>
                                       <span className="text-xs font-black text-amber-300">
                                          {quickSimpleHasChoice ? `Attempt ${selectCount} of ${totalCount}` : 'Compulsory (All)'}
                                       </span>
                                    </div>
                                 </div>
                              );
                           })()}
                        </div>
                     ) : (
                        /* ADVANCED MODE: MULTIPLE SECTION BLUEPRINT */
                        <>
                           <div className="flex items-center justify-between">
                              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Sections Blueprint</span>
                              <button
                                 type="button"
                                 onClick={addQuickSection}
                                 className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 transition-all"
                              >
                                 <Plus size={12} /> Add Section Row
                              </button>
                           </div>

                           <div className="space-y-3">
                              {quickSections.map((qsec, index) => (
                                 <div
                                    key={qsec.id}
                                    className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 hover:border-indigo-200 transition-all space-y-3"
                                 >
                                    <div className="flex items-center justify-between">
                                       <div className="flex items-center gap-2">
                                          <span className="w-6 h-6 rounded-lg bg-indigo-600 text-white text-[11px] font-black flex items-center justify-center">
                                             {index + 1}
                                          </span>
                                          <span className="text-xs font-black text-slate-800">
                                             Section {index + 1}
                                          </span>
                                       </div>
                                       <div className="flex items-center gap-2">
                                          <span className="text-[11px] font-black text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200">
                                             {qsec.selectCount * qsec.marksPerQuestion} Marks
                                          </span>
                                          {quickSections.length > 1 && (
                                             <button
                                                type="button"
                                                onClick={() => removeQuickSection(qsec.id)}
                                                className="text-slate-400 hover:text-rose-500 p-1 transition-all"
                                                title="Remove row"
                                             >
                                                <Trash2 size={15} />
                                             </button>
                                          )}
                                       </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
                                       {/* QUESTION TYPE */}
                                       <div className="sm:col-span-4">
                                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Type of Question</label>
                                          <select
                                             value={qsec.questionType}
                                             onChange={e => {
                                                const newType = e.target.value;
                                                const defMarks = newType === 'Multiple Choice' ? 1 : newType === 'Short Question' ? 2 : 4;
                                                updateQuickSection(qsec.id, {
                                                   questionType: newType,
                                                   marksPerQuestion: defMarks
                                                });
                                             }}
                                             className="w-full h-9 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-indigo-500"
                                          >
                                             <option value="Multiple Choice">Multiple Choice (MCQ)</option>
                                             <option value="Short Question">Short Question</option>
                                             <option value="Long Answer">Long Answer</option>
                                             <option value="Fill in the Blanks">Fill in the Blanks</option>
                                             <option value="True/False">True / False</option>
                                             <option value="Translation">Translation</option>
                                             <option value="Words/Sentences">Words / Sentences</option>
                                          </select>
                                       </div>

                                       {/* MARKS PER QUESTION */}
                                       <div className="sm:col-span-2">
                                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Marks / Q</label>
                                          <input
                                             type="number"
                                             min="1"
                                             value={qsec.marksPerQuestion}
                                             onChange={e => updateQuickSection(qsec.id, { marksPerQuestion: parseInt(e.target.value) || 1 })}
                                             className="w-full h-9 px-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-rose-600 text-center outline-none focus:border-rose-500"
                                          />
                                       </div>

                                       {/* ATTEMPT REQUIRED */}
                                       <div className="sm:col-span-3">
                                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Required Attempt</label>
                                          <input
                                             type="number"
                                             min="1"
                                             value={qsec.selectCount}
                                             onChange={e => updateQuickSection(qsec.id, { selectCount: parseInt(e.target.value) || 1 })}
                                             className="w-full h-9 px-2 bg-white border border-slate-200 rounded-xl text-xs font-black text-emerald-600 text-center outline-none focus:border-emerald-500"
                                          />
                                       </div>

                                       {/* CHOICE TOGGLE */}
                                       <div className="sm:col-span-3">
                                          <label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">Student Choice</label>
                                          <button
                                             type="button"
                                             onClick={() => updateQuickSection(qsec.id, { hasChoice: !qsec.hasChoice })}
                                             className={`w-full h-9 px-2 rounded-xl text-[10px] font-black uppercase tracking-wider border transition-all flex items-center justify-center gap-1 ${
                                                qsec.hasChoice
                                                   ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                                   : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-100'
                                             }`}
                                          >
                                             {qsec.hasChoice ? '✓ Choice ON' : '✕ No Choice'}
                                          </button>
                                       </div>
                                    </div>

                                    {/* CHOICE DETAIL ROW */}
                                    {qsec.hasChoice && (
                                       <div className="flex items-center gap-3 bg-white p-2.5 rounded-xl border border-emerald-100 text-xs">
                                          <Info size={14} className="text-emerald-600 shrink-0" />
                                          <span className="text-[11px] text-slate-600 font-medium">
                                             Total questions to print:
                                          </span>
                                          <input
                                             type="number"
                                             min={qsec.selectCount}
                                             value={qsec.totalCount}
                                             onChange={e => updateQuickSection(qsec.id, { totalCount: Math.max(parseInt(e.target.value) || qsec.selectCount, qsec.selectCount) })}
                                             className="w-14 h-7 text-center font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                                          />
                                          <span className="text-[11px] font-black text-emerald-700">
                                             (Student attempts {qsec.selectCount} of {qsec.totalCount} Qs)
                                          </span>
                                       </div>
                                    )}
                                 </div>
                              ))}
                           </div>

                           {/* STATS PREVIEW */}
                           <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-100 flex flex-wrap items-center justify-between gap-2 text-xs">
                              <div className="flex items-center gap-4 text-indigo-900 font-bold text-[11px]">
                                 <span>Sections: <strong>{quickSections.length}</strong></span>
                                 <span>Total Qs: <strong>{quickSections.reduce((sum, s) => sum + (s.hasChoice ? s.totalCount : s.selectCount), 0)}</strong></span>
                                 <span>Attempt Qs: <strong>{quickSections.reduce((sum, s) => sum + s.selectCount, 0)}</strong></span>
                              </div>
                              <div className="text-xs font-black text-rose-600 bg-white px-3 py-1 rounded-xl shadow-xs border border-rose-100">
                                 Total Paper Marks: {quickSections.reduce((sum, s) => sum + (s.selectCount * s.marksPerQuestion), 0)}
                               </div>
                           </div>
                        </>
                     )}
                  </div>

                  {/* FOOTER */}
                  <div className="p-4 sm:p-6 border-t border-slate-100 bg-slate-50 flex gap-3 shrink-0">
                     <button
                        type="button"
                        onClick={() => setIsQuickBuilderOpen(false)}
                        className="flex-1 py-3 text-xs font-black text-slate-500 hover:bg-slate-200 rounded-2xl transition-all uppercase tracking-wider"
                     >
                        Cancel
                     </button>
                     <button
                        type="button"
                        onClick={builderTab === 'SIMPLE' ? applySimpleQuickBuild : applyQuickSections}
                        className="flex-[2] py-3 bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-xl shadow-indigo-200 hover:from-indigo-700 hover:to-violet-700 transition-all flex items-center justify-center gap-2"
                     >
                        <CheckCircle2 size={16} /> Auto-Generate Sections & Pick Questions
                     </button>
                  </div>
               </div>
            </div>
         )}
      </div>
   );

   if (state.step === 'EDITOR' && schoolData) {
      const initialPaper: any = {
         id: `p-${Date.now()}`,
         title: `${subjects.find(s => s.id === state.selectedSubject)?.name || 'General'} Assessment`,
         subject: subjects.find(s => s.id === state.selectedSubject)?.name || 'General',
         classLevel: classes.find(c => c.id === state.selectedClass)?.name || 'Grade',
         totalMarks: 0,
         durationMinutes: 60,
         questions: state.selectedQuestions || [], // Use pre-filled questions if Auto-Gen
         headerConfig: {
            schoolName: schoolData.name,
            logoUrl: schoolData.logo,
            examTitle: 'Examination Paper',
            showDate: true,
            showStudentName: true,
            showRollNo: true,
            showClass: true,
            showSection: true,
            instructions: 'Carefully follow all section instructions.'
         },
         structure: state.paperStructure,
         selectedSchemeId: selectedScheme?.id,
         schemeVersion: state.selectedSchemeVersion,
         attemptLongQuestions: selectedScheme?.attemptLongQuestions,
         compulsoryQuestionNumber: selectedScheme?.compulsoryQuestionNumber,
         watermark: state.watermark,
         layoutMode: state.paperLayout,
         showQuestionMarks: true,
         longQuestionHeading: 'Subjective Part II',
         longQuestionHeadingUrdu: 'حصہ دوم – تفصیلی سوالات',
         longQuestionInstruction: selectedScheme
            ? `Attempt ${selectedScheme.attemptLongQuestions || selectedScheme.structure.filter(s => (s.sectionRole || (s.type === 'Long Answer' ? 'LONG_QUESTION' : '')) === 'LONG_QUESTION').filter(s => !s.isCompulsory).length} questions in all.${selectedScheme.compulsoryQuestionNumber ? ` Question No. ${selectedScheme.compulsoryQuestionNumber} is Compulsory.` : ''}`
            : 'Write detailed answers to the following questions.',
         longQuestionInstructionUrdu: selectedScheme
            ? `کل ${selectedScheme.attemptLongQuestions || selectedScheme.structure.filter(s => (s.sectionRole || (s.type === 'Long Answer' ? 'LONG_QUESTION' : '')) === 'LONG_QUESTION').filter(s => !s.isCompulsory).length} سوالات حل کریں۔${selectedScheme.compulsoryQuestionNumber ? ` سوال نمبر ${selectedScheme.compulsoryQuestionNumber} لازمی ہے۔` : ''}`
            : 'درج ذیل سوالات کے تفصیلی جوابات لکھیں۔',
         createdAt: new Date().toISOString(),
         createdBy: user.name,
         schoolId: user.schoolId,
         selectedChapters: state.selectedChapters,
         selectedTopics: state.selectedTopics,
         isOnline: state.isOnline
      };
      return <PaperEditor paper={initialPaper} onUpdate={() => { }} onBack={() => { onEditorExit?.(); setState({ ...state, step: 'SETUP', selectedQuestions: [] }); }} user={user} />;
   }
   return null;
};

export default GeneratePaper;
