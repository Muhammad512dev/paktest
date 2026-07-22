
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  ChevronRight, Check, ArrowLeft, BookOpen, GraduationCap, Settings,
  Sparkles, Filter, Eye, X, Plus, Trash2, CloudLightning,
  Layers, FileText, CheckCircle2, ChevronDown, MonitorPlay, Layout, Library, Settings2,
  Hash, Info, Edit3, Tag, RefreshCw, Zap, Upload, FileUp, Briefcase, Wand2, FileCode, Paperclip, Database, Shuffle
} from 'lucide-react';
import { WizardState, Question, Difficulty, PaperStructure, PaperSectionConfig, User, WatermarkType, PaperLayoutMode, School, UserRole, QuestionType } from '../types';
import { 
  getSyllabuses, getClasses, getSubjects, getChapters, getTopics, getQuestions, getQuestionTypes, getSchoolById, getSystemConfig, checkAndTrackAiUsage
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
  
  // Repository for Manual Generation
  const [repoQuestions, setRepoQuestions] = useState<Question[]>([]);
  
  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Manual Mode State
  const [autoFillRepo, setAutoFillRepo] = useState(true);

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
      const [syls, clss, subs, chs, tops, types, qs] = await Promise.all([
        getSyllabuses(),
        getClasses(),
        getSubjects(),
        getChapters(),
        getTopics(),
        getQuestionTypes(),
        getQuestions({ pageSize: 1000, maxPages: 50 }) // Pre-load questions for Auto-Gen (up to ~50k)
      ]);
      
      // Ensure repository questions are unique by ID to prevent duplication during shuffling
      const uniqueQs = Array.from(new Map(qs.map(q => [q.id, q])).values());
      setRepoQuestions(uniqueQs);

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

      // Use syllabuses directly as the backend already isolates them based on permissions
      setSyllabuses(syls);
      setClasses(clss);
      setSubjects(subs);
      setAllChapters(chs);
      setAllTopics(tops);
      setQuestionTypes([...types]); // Using fetched types which includes customs
      setSchoolData(brandingData);
    };
    loadAllData();
  }, [user.schoolId, user.role]);

  // Filtering Logic for Wizard
  const filteredClasses = useMemo(() => classes.filter(c => c.syllabusId === state.selectedSyllabus), [classes, state.selectedSyllabus]);
  const filteredSubjects = useMemo(() => subjects.filter(s => s.classId === state.selectedClass), [subjects, state.selectedClass]);
  const relevantChapters = useMemo(() => allChapters.filter(c => c.subjectId === state.selectedSubject), [allChapters, state.selectedSubject]);

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
    // Use available types to initialize structure intelligently
    const availableTypeIds = availableTypesForConfig.map(t => t.id);
    // If no types available, fallback to defaults
    const defaultTypes = availableTypeIds.length > 0 ? availableTypeIds.slice(0, 3) : ['MCQ', 'Short Answer', 'Long Answer'];
    
    defaultTypes.forEach((type, idx) => {
      const id = `sec_${Date.now()}_${idx}`;
      // Determine category based on type
      const isObjective = ['MCQ', 'Match Columns', 'Fill in the Blanks', 'True/False', 'Spelling Check'].includes(type);
      
      structure[id] = {
        id: id,
        title: `Q.${idx + 1} ${type}`,
        questionType: type,
        marksPerQuestion: type === 'MCQ' ? 1 : type === 'Short Answer' ? 2 : 5,
        totalCount: type === 'MCQ' ? 10 : 8,
        selectCount: type === 'MCQ' ? 10 : 6, 
        blankLines: 0,
        blankLineType: 'Line',
        questionsPerLine: false,
        languageMedium: 'Bilingual',
        sourceFilter: [],
        category: isObjective ? 'Objective' : 'Subjective',
        subQuestionNumbering: type === 'MCQ' ? 'Numeric' : 'Roman'
      };
    });
    setState(prev => ({ ...prev, paperStructure: structure, step: 'SETUP' }));
  };

  const updateSection = (id: string, updates: Partial<PaperSectionConfig>) => {
    // Automatically update category if question type changes in updates
    let finalUpdates = { ...updates };
    if (updates.questionType) {
        const isObjective = ['MCQ', 'Match Columns', 'Fill in the Blanks', 'True/False', 'Spelling Check'].includes(updates.questionType);
        finalUpdates.category = isObjective ? 'Objective' : 'Subjective';
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
                                title: `Q.${idx+1} ${cfg.type}`,
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

            (Object.values(state.paperStructure) as PaperSectionConfig[]).forEach(sec => {
                const pool = repoQuestions.filter(q => 
                    q.type === sec.questionType &&
                    q.subject === subjectName &&
                    (q.classLevel === className || !q.classLevel) &&
                    (state.selectedChapters.length === 0 || state.selectedChapters.includes(q.chapter || '')) &&
                    matchesSectionMedium(q, sec.languageMedium)
                );
                
                const shuffled = [...pool].sort(() => 0.5 - Math.random());
                const picked = shuffled.slice(0, sec.totalCount);
                
                picked.forEach(q => {
                    generatedQuestions.push({
                        ...q,
                        id: `${q.id}_gen_${Math.random().toString(36).substr(2, 9)}`,
                        sectionId: sec.id,
                        marks: sec.marksPerQuestion
                    });
                });
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
     const steps = ['Board', 'Grade', 'Subject', 'Topics', 'Layout', 'Questions'];
     const currentIdx = ['SYLLABUS', 'CLASS', 'SUBJECT', 'CHAPTERS', 'SETUP', 'EDITOR', 'AI_AGENT'].indexOf(state.step);
     if (state.step === 'AI_AGENT') return null; // Hide standard indicator in AI mode

     return (
        <div className="flex items-center justify-start mb-10 overflow-x-auto px-4 no-scrollbar">
           {steps.map((label, idx) => (
              <React.Fragment key={label}>
                 <div className={`flex items-center gap-2 shrink-0 ${idx <= currentIdx ? 'text-indigo-600' : 'text-gray-400'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                       idx < currentIdx ? 'bg-indigo-600 border-indigo-600 text-white' : idx === currentIdx ? 'border-indigo-600 text-indigo-600 shadow-[0_0_0_4px_rgba(79,70,229,0.1)]' : 'border-gray-200'
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
                 setState({...state, step: 'AI_AGENT', configMode: 'AUTO'})
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

  // --- NEW AI AGENT STEP ---
  if (state.step === 'AI_AGENT') return (
    <div className="p-4 md:p-12 max-w-7xl h-full flex flex-col">
       <button onClick={() => setState({...state, step: 'SYLLABUS'})} className="text-gray-400 hover:text-gray-900 flex items-center gap-2 mb-8 font-bold text-sm uppercase tracking-widest transition-colors"><ArrowLeft size={18} /> Back to Selection</button>
       
       <div className="flex items-center gap-4 mb-10">
          <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
             <Wand2 size={24} />
          </div>
          <div>
             <h2 className="text-3xl font-black text-gray-900 tracking-tight">AI Paper Architect</h2>
             <p className="text-sm text-gray-500 font-medium">Upload your source material and let Gemini construct the exam.</p>
          </div>
       </div>

       <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 overflow-hidden h-full">
          
          {/* COLUMN 1: UPLOAD & CONTEXT */}
          <div className="space-y-6 flex flex-col">
             <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><FileCode size={18} className="text-indigo-600"/> 1. Exam Context</h3>
                <div className="space-y-4">
                   <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Examination Board</label>
                      <select 
                         value={state.selectedSyllabus || ''} 
                         onChange={e => setState({...state, selectedSyllabus: e.target.value, selectedClass: '', selectedSubject: ''})}
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
                      >
                         <option value="">Select Board...</option>
                         {syllabuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Grade Level</label>
                      <select 
                         value={state.selectedClass || ''} 
                         onChange={e => setState({...state, selectedClass: e.target.value, selectedSubject: ''})}
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
                         disabled={!state.selectedSyllabus}
                      >
                         <option value="">Select Grade...</option>
                         {aiFilteredClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                   </div>
                   <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1.5">Subject</label>
                      <select 
                         value={state.selectedSubject || ''} 
                         onChange={e => setState({...state, selectedSubject: e.target.value})}
                         className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 font-medium text-sm"
                         disabled={!state.selectedClass}
                      >
                         <option value="">Select Subject...</option>
                         {aiFilteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                   </div>
                </div>
             </div>

             <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2"><Upload size={18} className="text-indigo-600"/> 2. Source Material</h3>
                <div 
                   onClick={() => fileInputRef.current?.click()}
                   className={`flex-1 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-6 cursor-pointer transition-all ${uploadedFile ? 'border-emerald-400 bg-emerald-50/30' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'}`}
                >
                   {uploadedFile ? (
                      <>
                         <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-3"><Check size={24}/></div>
                         <p className="text-sm font-bold text-emerald-800 line-clamp-1">{uploadedFile.name}</p>
                         <p className="text-[10px] text-emerald-600 mt-1 uppercase font-bold">Ready to Process</p>
                      </>
                   ) : (
                      <>
                         <CloudLightning size={32} className="text-slate-300 mb-3"/>
                         <p className="text-sm font-bold text-slate-500">Click to Upload Document</p>
                         <p className="text-[10px] text-slate-400 mt-1">PDF, JPG, PNG supported</p>
                      </>
                   )}
                   <input type="file" ref={fileInputRef} className="hidden" accept=".pdf,image/*" onChange={handleFileChange} />
                </div>
             </div>
          </div>

          {/* COLUMN 2 & 3: SECTION CONFIG */}
          <div className="lg:col-span-2 bg-slate-900 rounded-[2.5rem] p-8 text-white flex flex-col shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
             
             <div className="flex justify-between items-center mb-8 relative z-10">
                <h3 className="font-bold text-xl flex items-center gap-2"><Settings2 size={20} className="text-indigo-400"/> Initializing Sections</h3>
                <button onClick={addAiSection} className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold uppercase tracking-widest transition-all flex items-center gap-2">
                   <Plus size={14}/> Add Custom Section
                </button>
             </div>

             <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 relative z-10">
                {aiSections.map((sec, idx) => (
                   <div key={sec.id} className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col md:flex-row items-center gap-4 animate-in slide-in-from-right-4 duration-300">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center font-bold text-xs shrink-0">{idx + 1}</div>
                      
                      <div className="flex-1 grid grid-cols-3 gap-4 w-full">
                         <div>
                            <label className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Question Type</label>
                            <select 
                               value={sec.type} 
                               onChange={e => updateAiSection(sec.id, 'type', e.target.value)}
                               className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-sm font-medium outline-none focus:border-indigo-500"
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
                                  onChange={e => updateAiSection(sec.id, 'count', parseInt(e.target.value)||0)}
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-sm font-medium outline-none focus:border-indigo-500"
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
                                  onChange={e => updateAiSection(sec.id, 'marks', parseInt(e.target.value)||0)}
                                  className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 px-3 text-sm font-medium outline-none focus:border-indigo-500"
                               />
                               <span className="absolute right-3 top-2 text-xs text-slate-500 font-bold">Pts</span>
                            </div>
                         </div>
                      </div>

                      <button onClick={() => removeAiSection(sec.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                         <Trash2 size={18}/>
                      </button>
                   </div>
                ))}
                
                {aiSections.length === 0 && (
                   <div className="text-center py-12 text-slate-500 border-2 border-dashed border-white/10 rounded-2xl">
                      <p className="text-sm">No sections defined. Add a section to start.</p>
                   </div>
                )}
             </div>

             <div className="pt-8 mt-4 border-t border-white/10 relative z-10">
                <div className="flex justify-between items-center mb-6">
                   <span className="text-sm font-bold text-slate-400">Total Marks: <span className="text-white ml-2 text-lg">{aiSections.reduce((acc, s) => acc + (s.count * s.marks), 0)}</span></span>
                   <span className="text-sm font-bold text-slate-400">Total Questions: <span className="text-white ml-2 text-lg">{aiSections.reduce((acc, s) => acc + s.count, 0)}</span></span>
                </div>
                
                <button 
                   onClick={() => { handleGenerateClick(); }}
                   disabled={isGenerating || !uploadedFile || !state.selectedSubject || aiSections.length === 0}
                   className="w-full py-5 bg-white text-slate-900 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-indigo-500/20 active:scale-[0.98]"
                >
                   {isGenerating ? (
                      <>
                         <RefreshCw className="animate-spin" /> Analyzing Document & Generating...
                      </>
                   ) : (
                      <>
                         <Sparkles size={20} className="text-indigo-600"/> Generate Examination Paper
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
       <button onClick={() => setState({...state, step: 'SYLLABUS'})} className="text-gray-400 hover:text-gray-900 flex items-center gap-2 mb-8 font-bold text-sm uppercase tracking-widest transition-colors"><ArrowLeft size={18} /> Back</button>
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
                   {syllabuses.find(s=>s.id===c.syllabusId)?.name}
                </span>
             </div>
          ))}
       </div>
    </div>
  );

  if (state.step === 'SUBJECT') return (
    <div className="p-4 md:p-12 max-w-7xl">
       <button onClick={() => setState({...state, step: 'CLASS'})} className="text-gray-400 hover:text-gray-900 flex items-center gap-2 mb-8 font-bold text-sm uppercase tracking-widest transition-colors"><ArrowLeft size={18} /> Back</button>
       <StepIndicator />
       <h2 className="text-3xl font-black text-gray-900 mb-12 tracking-tight">Step 3: Select Subject</h2>
       <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {filteredSubjects.map(s => (
             <div key={s.id} onClick={() => setState({ ...state, selectedSubject: s.id, step: 'CHAPTERS' })} className="group p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-2xl transition-all cursor-pointer">
                <div className="flex justify-between items-start mb-6">
                   <div className="w-14 h-14 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center overflow-hidden border border-emerald-100 shadow-inner group-hover:scale-110 transition-transform">
                      {s.logo ? <img src={s.logo} className="w-full h-full object-cover" /> : <Library size={28}/>}
                   </div>
                   <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                      <ChevronRight size={16} />
                   </div>
                </div>
                <h4 className="font-black text-gray-900 text-lg group-hover:text-indigo-600 transition-colors leading-tight">{s.name}</h4>
                <p className="text-[10px] font-black text-gray-400 uppercase mt-2 tracking-wider flex items-center gap-1.5">
                   <GraduationCap size={12}/> {classes.find(c=>c.id===s.classId)?.name}
                </p>
             </div>
          ))}
       </div>
    </div>
  );

  if (state.step === 'CHAPTERS') return (
    <div className="p-4 md:p-12 max-w-7xl">
       <button onClick={() => setState({...state, step: 'SUBJECT'})} className="text-gray-400 hover:text-gray-900 flex items-center gap-2 mb-8 font-bold text-sm uppercase tracking-widest transition-colors"><ArrowLeft size={18} /> Back</button>
       <StepIndicator />
       <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Step 4: Select Chapters & Topics</h2>
          <div className="flex gap-2">
             <button onClick={() => setState(prev => ({...prev, selectedChapters: [], selectedTopics: []}))} className="px-5 py-2 bg-white border border-gray-200 rounded-xl text-xs font-black text-gray-400 uppercase tracking-widest hover:bg-gray-50 transition-all">Clear Selection</button>
             <button onClick={handleSelectAllChapters} className="px-5 py-2 bg-indigo-50 border border-indigo-100 rounded-xl text-xs font-black text-indigo-600 uppercase tracking-widest hover:bg-indigo-100 transition-all">Select All Content</button>
          </div>
       </div>

       <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden mb-10 divide-y divide-gray-50">
          {relevantChapters.map((c, idx) => (
             <div key={idx} className={`p-6 md:p-8 flex items-start gap-6 transition-all ${state.selectedChapters.includes(c.name) ? 'bg-indigo-50/20' : 'hover:bg-gray-50/50'}`}>
                <div onClick={() => handleChapterToggle(c.name)} className={`mt-1 w-7 h-7 rounded-lg border-2 flex items-center justify-center shrink-0 cursor-pointer transition-all ${state.selectedChapters.includes(c.name) ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-200' : 'border-gray-200 bg-white'}`}>{state.selectedChapters.includes(c.name) && <Check size={16} strokeWidth={3} />}</div>
                <div className="flex-1">
                   <span onClick={() => handleChapterToggle(c.name)} className="font-black block text-lg text-gray-900 cursor-pointer">{c.name}</span>
                   <div className="flex flex-wrap gap-2 mt-4">
                      {getSubtopicsForChapter(c.name).map((sub, i) => (
                         <span key={i} onClick={() => {
                            const isSelected = state.selectedTopics.includes(sub);
                            setState(prev => ({ ...prev, selectedTopics: isSelected ? prev.selectedTopics.filter(t=>t!==sub) : [...prev.selectedTopics, sub] }));
                         }} className={`text-[10px] px-4 py-2 rounded-xl border-2 cursor-pointer transition-all font-black uppercase tracking-widest ${state.selectedTopics.includes(sub) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-100 hover:border-indigo-200'}`}>{sub}</span>
                      ))}
                   </div>
                </div>
             </div>
          ))}
       </div>
       <div className="flex justify-start"><button onClick={initStructure} disabled={state.selectedChapters.length === 0} className="px-12 py-4 bg-indigo-600 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-700 disabled:opacity-50 shadow-2xl shadow-indigo-200 text-sm transition-all transform hover:scale-105 active:scale-95">Continue to Setup</button></div>
    </div>
  );

  if (state.step === 'SETUP') return (
    <div className="p-4 md:p-12 max-w-7xl relative">
       <button onClick={() => setState({...state, step: 'CHAPTERS'})} className="text-gray-400 hover:text-gray-900 flex items-center gap-2 mb-8 font-bold text-sm uppercase tracking-widest transition-colors"><ArrowLeft size={18} /> Back</button>
       <StepIndicator />
       <h2 className="text-3xl font-black text-gray-900 mb-12 tracking-tight">Step 5: Paper Preview Preparation</h2>
       
       <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="space-y-8">
             <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Layout size={18}/> Visual Formatting</h4>
                <div className="grid grid-cols-2 gap-4">
                   <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Watermark Type</label>
                      <select value={state.watermark} onChange={e=>setState({...state, watermark: e.target.value as WatermarkType})} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                         <option value="None">Disabled</option>
                         <option value="Monogram">School Logo</option>
                         <option value="Confidential">CONFIDENTIAL</option>
                         <option value="Draft">DRAFT COPY</option>
                      </select>
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Print Layout</label>
                      <select value={state.paperLayout} onChange={e=>setState({...state, paperLayout: e.target.value as PaperLayoutMode})} className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500">
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

             <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                   <h4 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] flex items-center gap-2"><CheckCircle2 size={18}/> Initializing Sections</h4>
                   <button 
                      onClick={addNewSection}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2"
                   >
                      <Plus size={14} /> Add Custom Section
                   </button>
                </div>
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                   {(Object.values(state.paperStructure) as PaperSectionConfig[]).map((sec, idx) => (
                      <div key={sec.id} className="bg-gray-50 rounded-3xl p-5 border-2 border-transparent hover:border-indigo-100 transition-all group relative">
                         <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-3">
                               <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center text-xs font-black shadow-lg shadow-indigo-100">{idx + 1}</div>
                               <span className="font-black text-sm text-gray-800">{sec.title}</span>
                            </div>
                            <div className="flex gap-2">
                               <button onClick={() => setEditingSection(sec)} className="p-2 bg-white text-gray-400 hover:text-indigo-600 rounded-xl shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-all"><Settings2 size={16}/></button>
                               <button onClick={() => removeSection(sec.id)} className="p-2 bg-white text-gray-400 hover:text-red-500 rounded-xl shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
                            </div>
                         </div>
                         <div className="flex flex-wrap gap-3 ml-12">
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-500 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                               <Library size={12} className="text-indigo-500" /> {sec.questionType}
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-emerald-600 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                               <CheckCircle2 size={12} /> Attempts: {sec.selectCount} / {sec.totalCount} Qs
                            </div>
                            <div className="flex items-center gap-1.5 text-[9px] font-black text-amber-600 uppercase tracking-widest bg-white px-3 py-1.5 rounded-lg border border-slate-200">
                               <Hash size={12} /> {sec.totalCount - sec.selectCount} Ignored
                            </div>
                         </div>
                      </div>
                   ))}
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
                   onClick={() => setState({...state, configMode: 'MANUAL'})}
                   className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${state.configMode === 'MANUAL' ? 'bg-white text-slate-900 shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                   Repository Source
                </button>
                <button 
                   onClick={() => setState({...state, configMode: 'AUTO'})}
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
                            <p className="text-[10px] font-bold text-white uppercase tracking-widest flex items-center gap-2"><Database size={12}/> Auto-fill from Bank</p>
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
                            <button onClick={addAiSection} className="text-indigo-400 hover:text-white flex items-center gap-1"><Plus size={10}/> Add</button>
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
                                        <input type="number" value={sec.count} onChange={e => updateAiSection(sec.id, 'count', parseInt(e.target.value)||0)} className="w-full bg-slate-800 border border-slate-600 rounded-md p-1 text-[10px] text-white text-center" placeholder="Qty"/>
                                        <span className="absolute right-1 top-1 text-[8px] text-slate-500">Qs</span>
                                    </div>
                                    <div className="col-span-1 relative">
                                        <input type="number" value={sec.marks} onChange={e => updateAiSection(sec.id, 'marks', parseInt(e.target.value)||0)} className="w-full bg-slate-800 border border-slate-600 rounded-md p-1 text-[10px] text-white text-center" placeholder="M"/>
                                    </div>
                                    <div className="col-span-1 flex justify-end">
                                        <button onClick={() => removeAiSection(sec.id)} className="text-red-400 hover:text-red-300"><Trash2 size={12}/></button>
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
          <div className="fixed inset-0 z-[100] bg-slate-900/80 backdrop-blur-sm flex items-center justify-center p-4">
             <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                   <h3 className="font-bold text-lg text-gray-900">Configure Section</h3>
                   <button onClick={() => setEditingSection(null)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={20}/></button>
                </div>
                <div className="p-8 space-y-6">
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Section Heading</label>
                      <input 
                         type="text" 
                         value={editingSection.title} 
                         onChange={e => setEditingSection({...editingSection, title: e.target.value})} 
                         className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                   </div>
                   <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Question Type</label>
                      <select 
                         value={editingSection.questionType} 
                         onChange={e => setEditingSection({...editingSection, questionType: e.target.value})} 
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
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total Questions</label>
                         <input 
                            type="number" 
                            value={editingSection.totalCount} 
                            onChange={e => setEditingSection({...editingSection, totalCount: parseInt(e.target.value) || 0})} 
                            className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm"
                         />
                      </div>
                      <div>
                         <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Attempt Req.</label>
                         <input 
                            type="number" 
                            value={editingSection.selectCount} 
                            onChange={e => setEditingSection({...editingSection, selectCount: parseInt(e.target.value) || 0})} 
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
                <div className="p-6 border-t border-gray-100 bg-gray-50 flex gap-3">
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
        watermark: state.watermark,
        layoutMode: state.paperLayout,
        createdAt: new Date().toISOString(),
        createdBy: user.name,
        schoolId: user.schoolId,
        selectedChapters: state.selectedChapters,
        selectedTopics: state.selectedTopics,
        isOnline: state.isOnline
     };
     return <PaperEditor paper={initialPaper} onUpdate={() => {}} onBack={() => { onEditorExit?.(); setState({...state, step: 'SETUP', selectedQuestions: []}); }} user={user} />;
  }
  return null;
};

export default GeneratePaper;
