
import React, { useState, useMemo, useEffect } from 'react';
import { 
  Printer, Save, Trash2, Plus, X, Settings as SettingsIcon, Search, Sparkles, 
  Library, RefreshCw, Box, ListFilter, Edit3, Trash, PlusCircle, Layers, FileText, Check, Tag, Filter,
  Calendar, Clock, ClipboardList, Info as InfoIcon, CheckSquare, Square, ChevronDown, Globe, Languages, GraduationCap, ChevronRight, ChevronUp, BookOpen, Settings2, HelpCircle, Eye, EyeOff, Key, FileCheck
} from 'lucide-react';
import { ExamPaper, Question, PaperSectionConfig, Difficulty, User, QuestionSource, SavedPaper, QuestionType, Syllabus, ClassLevel, Subject } from '../types';
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
  const [currentPaper, setCurrentPaper] = useState<ExamPaper>(paper);
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

  // Repository Data States
  const [repoQuestions, setRepoQuestions] = useState<Question[]>([]);
  const [allChapters, setAllChapters] = useState<any[]>([]);
  const [allTopics, setAllTopics] = useState<any[]>([]);
  const [availableQuestionTypes, setAvailableQuestionTypes] = useState<any[]>([]);

  /* Load data asynchronously on mount */
  useEffect(() => {
    const loadRepoData = async () => {
      const [qs, chs, tops, types] = await Promise.all([
        getQuestions(),
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
  const [extractionLanguage, setExtractionLanguage] = useState<'English' | 'Urdu' | 'Bilingual'>('Bilingual');

  // Filters for Modal - initialized with paper selection but mutable
  const [activeChapters, setActiveChapters] = useState<string[]>(paper.selectedChapters);
  const [activeTopics, setActiveTopics] = useState<string[]>(paper.selectedTopics);
  
  // Dynamic Source & Type Filters based on availability
  const [activeSources, setActiveSources] = useState<string[]>([]);
  const [activeTypes, setActiveTypes] = useState<string[]>([]);

  // Toggle State for Scope Section
  const [isScopeExpanded, setIsScopeExpanded] = useState(true);

  // Calculated Marks
  const totalCalculatedMarks = useMemo(() => {
    return currentPaper.questions.reduce((acc, q) => acc + (q.marks || 0), 0);
  }, [currentPaper.questions]);

  // Initializing Save Modal State with defaults
  const [saveForm, setSaveForm] = useState({
    title: currentPaper.title || '',
    totalMarks: totalCalculatedMarks,
    examDate: new Date().toISOString().split('T')[0],
    durationMinutes: currentPaper.durationMinutes || 60,
    testType: 'Monthly Test'
  });

  // Sync save form marks when questions change
  useEffect(() => {
    setSaveForm(prev => ({ ...prev, totalMarks: totalCalculatedMarks }));
  }, [totalCalculatedMarks]);

  // --- DYNAMIC FILTER LOGIC ---
  
  // 1. First, get questions that match the broad Subject/Class context
  //    AND match the currently selected 'Active Scope' (Chapters/Topics checkboxes)
  const scopeFilteredQuestions = useMemo(() => {
      return repoQuestions.filter(q => 
          q.subject === paper.subject && 
          (!q.classLevel || q.classLevel === paper.classLevel) &&
          (activeChapters.length === 0 || activeChapters.includes(q.chapter || '')) &&
          (activeTopics.length === 0 || activeTopics.includes(q.topic || ''))
      );
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
      
      // Allow searching for the specific section type OR other types if user selected them in filter
      const matchesType = activeTypes.length === 0 || activeTypes.includes(q.type); 

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
    const shuffled = [...availableQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, count);
    const otherQuestions = currentPaper.questions.filter(q => q.sectionId !== activeSectionId);
    const newQuestions = selected.map(q => ({ ...q, sectionId: activeSectionId, marks: sectionConfig.marksPerQuestion }));
    setCurrentPaper(prev => ({ ...prev, questions: [...otherQuestions, ...newQuestions] }));
  };

  const toggleQuestionSelection = (q: Question) => {
    if (!sectionConfig) return;
    const isSelected = currentPaper.questions.some(sq => sq.id === q.id && sq.sectionId === activeSectionId);
    if (isSelected) {
      setCurrentPaper(prev => ({
        ...prev,
        questions: prev.questions.filter(sq => !(sq.id === q.id && sq.sectionId === activeSectionId))
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

  const updateSectionConfig = () => {
    if (!sectionConfig) return;
    setCurrentPaper(prev => ({
        ...prev,
        structure: {
            ...prev.structure,
            [activeSectionId]: sectionConfig
        },
        // Optionally update marks of existing questions in this section
        questions: prev.questions.map(q => 
            q.sectionId === activeSectionId ? { ...q, marks: sectionConfig.marksPerQuestion } : q
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

  const handleFinalSave = () => {
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
      durationMinutes: saveForm.durationMinutes
    };

    savePaper(fullPaperPayload);
    setIsSaveModalOpen(false);
    alert('Paper successfully saved to institution repository!');
    onBack();
  };

  const sectionsByCategory = useMemo(() => {
    const obj: PaperSectionConfig[] = [];
    const subj: PaperSectionConfig[] = [];
    (Object.values(currentPaper.structure) as PaperSectionConfig[]).forEach(sec => {
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
        <div className="fixed inset-0 z-[250] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-[95vw] h-[90vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden border border-slate-200">
              <div className="px-8 py-5 border-b border-slate-100 flex justify-between items-center bg-white shrink-0">
                 <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-indigo-50 border border-indigo-100 rounded-2xl flex items-center justify-center shadow-inner shrink-0">
                       <Library size={28} className="text-indigo-600" />
                    </div>
                    <div>
                       <div className="flex items-center gap-3">
                          <h3 className="font-black text-2xl text-slate-900 tracking-tight">{sectionConfig.title}</h3>
                          <span className="text-slate-300 font-medium text-2xl">|</span>
                          <span className="text-slate-400 font-bold text-lg">Question Selection</span>
                       </div>
                       <div className="flex items-center gap-4 mt-1.5">
                          <span className="text-[11px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">SUBJECT: {currentPaper.subject.toUpperCase()}</span>
                          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                             <Layers size={12}/>
                             <span>
                               {activeChapters.length > 0 ? `${activeChapters.length} Chapters` : 'All Chapters'} &bull; {activeTopics.length > 0 ? `${activeTopics.length} Topics` : 'All Topics'}
                             </span>
                          </div>
                       </div>
                    </div>
                 </div>
                 <button onClick={() => setIsSelectionModalOpen(false)} className="text-slate-300 hover:text-red-500 p-2 hover:bg-red-50 rounded-full transition-all">
                    <X size={36} />
                 </button>
              </div>

              <div className="flex-1 flex overflow-hidden">
                {/* SIDEBAR FILTERS - DYNAMIC & INTERACTIVE */}
                <aside className="w-80 border-r border-slate-100 bg-white p-6 overflow-y-auto space-y-6 custom-scrollbar shrink-0">
                   
                   {/* 1. INTERACTIVE SCOPE */}
                   <div>
                        <div 
                            className="flex justify-between items-center cursor-pointer mb-4 group"
                            onClick={() => setIsScopeExpanded(!isScopeExpanded)}
                        >
                            <h4 className="text-[12px] font-black text-indigo-600 uppercase tracking-[0.15em] flex items-center gap-2">
                                <BookOpen size={16}/> Active Scope
                            </h4>
                            {isScopeExpanded ? <ChevronUp size={16} className="text-slate-400"/> : <ChevronDown size={16} className="text-slate-400"/>}
                        </div>
                        
                        {isScopeExpanded && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-4">
                                {paper.selectedChapters.length > 0 ? (
                                    paper.selectedChapters.map(chap => {
                                        const isChapActive = activeChapters.includes(chap);
                                        const topicsInChapter = allTopics.filter(t => t.chapterId === allChapters.find(c=>c.name===chap)?.id && paper.selectedTopics.includes(t.name));
                                        
                                        return (
                                            <div key={chap} className="space-y-2">
                                                <label className="flex items-start gap-2 cursor-pointer group">
                                                    <div className="relative flex items-center justify-center mt-0.5">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={isChapActive}
                                                            onChange={() => {
                                                                if(isChapActive) setActiveChapters(prev => prev.filter(c => c !== chap));
                                                                else setActiveChapters(prev => [...prev, chap]);
                                                            }}
                                                            className="peer appearance-none w-4 h-4 rounded border-2 border-slate-300 checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer" 
                                                        />
                                                        <Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={4} />
                                                    </div>
                                                    <span className={`text-[11px] font-bold leading-tight ${isChapActive ? 'text-slate-800' : 'text-slate-400'}`}>{chap}</span>
                                                </label>
                                                
                                                {isChapActive && topicsInChapter.length > 0 && (
                                                    <div className="pl-6 flex flex-wrap gap-1.5">
                                                        {topicsInChapter.map(t => {
                                                            const isTopicActive = activeTopics.includes(t.name);
                                                            return (
                                                                <button 
                                                                    key={t.id} 
                                                                    onClick={() => {
                                                                        if(isTopicActive) setActiveTopics(prev => prev.filter(top => top !== t.name));
                                                                        else setActiveTopics(prev => [...prev, t.name]);
                                                                    }}
                                                                    className={`text-[9px] px-2 py-0.5 rounded border transition-all ${isTopicActive ? 'bg-white border-slate-300 text-slate-600' : 'bg-transparent border-transparent text-slate-300 line-through'}`}
                                                                >
                                                                    {t.name}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-xs text-slate-400 italic">No specific chapters filtered.</p>
                                )}
                            </div>
                        )}
                   </div>

                   <div className="h-px bg-slate-100 w-full"></div>

                   {/* 2. QUESTION TYPES (Dynamic) */}
                   <div>
                      <h4 className="text-[12px] font-black text-indigo-600 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                        <ListFilter size={16}/> Question Types
                      </h4>
                      {availableTypesInScope.length > 0 ? (
                          <div className="space-y-2">
                             {availableTypesInScope.map(({type, count}) => (
                                <label key={type} className="flex items-center justify-between cursor-pointer group p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                   <div className="flex items-center gap-3">
                                       <div className="relative flex items-center justify-center">
                                          <input 
                                            type="checkbox" 
                                            checked={activeTypes.includes(type)}
                                            onChange={() => setActiveTypes(prev => prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type])}
                                            className="peer appearance-none w-5 h-5 rounded-md border-2 border-slate-200 checked:bg-purple-600 checked:border-purple-600 transition-all cursor-pointer" 
                                          />
                                          <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={4} />
                                       </div>
                                       <span className="text-xs font-bold text-slate-600 group-hover:text-purple-600 transition-colors">{type}</span>
                                   </div>
                                   <span className="text-[10px] font-black text-slate-300 bg-slate-100 px-1.5 rounded">{count}</span>
                                </label>
                             ))}
                          </div>
                      ) : (
                          <p className="text-xs text-slate-400 italic">No question types found for selected scope.</p>
                      )}
                   </div>

                   <div className="h-px bg-slate-100 w-full"></div>

                   {/* 3. QUESTION SOURCE (Dynamic) */}
                   <div>
                      <h4 className="text-[12px] font-black text-indigo-600 uppercase tracking-[0.15em] mb-4 flex items-center gap-2">
                        <Filter size={16}/> Question Source
                      </h4>
                      {availableSourcesInScope.length > 0 ? (
                          <div className="space-y-2">
                             {availableSourcesInScope.map(({source, count}) => (
                                <label key={source} className="flex items-center justify-between cursor-pointer group p-2 hover:bg-slate-50 rounded-lg transition-colors">
                                   <div className="flex items-center gap-3">
                                       <div className="relative flex items-center justify-center">
                                          <input 
                                            type="checkbox" 
                                            checked={activeSources.includes(source)}
                                            onChange={() => setActiveSources(prev => prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source])}
                                            className="peer appearance-none w-5 h-5 rounded-md border-2 border-slate-200 checked:bg-indigo-600 checked:border-indigo-600 transition-all cursor-pointer" 
                                          />
                                          <Check className="absolute w-3.5 h-3.5 text-white opacity-0 peer-checked:opacity-100 pointer-events-none transition-opacity" strokeWidth={4} />
                                       </div>
                                       <span className="text-xs font-bold text-slate-600 group-hover:text-indigo-600 transition-colors">{source}</span>
                                   </div>
                                   <span className="text-[10px] font-black text-slate-300 bg-slate-100 px-1.5 rounded">{count}</span>
                                </label>
                             ))}
                          </div>
                      ) : (
                          <p className="text-xs text-slate-400 italic">No sources found for selected scope.</p>
                      )}
                   </div>

                   <button onClick={executeSearch} disabled={isSearching} className="w-full mt-4 py-4 bg-[#1a202c] text-white font-black uppercase tracking-[0.2em] rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-3 shadow-xl shadow-slate-200 active:scale-95">
                         {isSearching ? <RefreshCw className="animate-spin" size={20} /> : <Search size={20} />} FETCH QUESTIONS
                   </button>
                </aside>

                {/* CONTENT AREA */}
                <main className="flex-1 bg-white p-10 overflow-y-auto custom-scrollbar relative border-l border-slate-50">
                   {isSearching ? (
                      <div className="h-full flex flex-col items-center justify-center space-y-6">
                         <div className="w-20 h-20 border-[6px] border-indigo-50 border-t-indigo-600 rounded-full animate-spin"></div>
                         <p className="text-slate-400 font-black uppercase tracking-widest text-sm animate-pulse">Scanning Repository...</p>
                      </div>
                   ) : availableQuestions.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-slate-300">
                         <div className="w-32 h-32 bg-slate-50 rounded-full flex items-center justify-center mb-6 shadow-inner">
                            <Search size={56} className="opacity-50" />
                         </div>
                         <p className="font-black uppercase tracking-[0.2em] text-sm text-center">NO QUESTIONS FOUND.<br/><span className="text-xs text-slate-400 font-bold mt-2 block">Try adjusting your filters or active scope.</span></p>
                      </div>
                   ) : (
                      <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-300">
                         <div className="flex justify-between items-center mb-4">
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{availableQuestions.length} Results Found</span>
                            <div className="flex gap-2">
                                <span className="w-3 h-3 bg-indigo-50 border border-indigo-200 rounded-full"></span>
                                <span className="text-[10px] font-bold text-slate-400">Available</span>
                                <span className="w-3 h-3 bg-indigo-600 rounded-full ml-2"></span>
                                <span className="text-[10px] font-bold text-slate-400">Selected</span>
                            </div>
                         </div>
                         {availableQuestions.map((q, idx) => {
                            const isSelected = currentPaper.questions.some(sq => sq.id === q.id && sq.sectionId === activeSectionId);
                            return (
                              <div key={q.id} onClick={() => toggleQuestionSelection(q)} className={`p-6 rounded-[1.5rem] border-2 transition-all cursor-pointer group relative overflow-hidden ${isSelected ? 'border-indigo-600 bg-indigo-50/20 shadow-md' : 'border-slate-100 hover:border-indigo-200 hover:bg-slate-50/50'}`}>
                                 {isSelected && <div className="absolute top-0 right-0 w-12 h-12 bg-indigo-600 flex items-center justify-center rounded-bl-2xl text-white shadow-lg"><Check size={20} strokeWidth={4}/></div>}
                                 <div className="flex gap-5 items-start">
                                    <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all font-black text-xs ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white' : 'border-slate-200 bg-white text-slate-300'}`}>{idx + 1}</div>
                                    <div className="flex-1 space-y-4 pr-8">
                                       <div className="flex justify-between items-start gap-4">
                                          {(extractionLanguage === 'Bilingual' || extractionLanguage === 'English') && q.text && (
                                            <MathRenderer text={q.text} className="text-sm font-bold text-slate-800 leading-relaxed" />
                                          )}
                                          <div className="flex flex-col items-end gap-1">
                                              <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[9px] font-black uppercase tracking-widest shrink-0 border border-slate-200 whitespace-nowrap">
                                                {q.type}
                                              </span>
                                              <div className="flex flex-wrap justify-end gap-1">
                                                  {q.sources && q.sources.length > 0 ? q.sources.map(s => (
                                                      <span key={s} className="px-2 py-0.5 bg-white text-slate-400 rounded text-[9px] font-bold uppercase tracking-widest shrink-0 border border-slate-100 whitespace-nowrap">
                                                        {s}
                                                      </span>
                                                  )) : (
                                                      <span className="px-2 py-0.5 bg-white text-slate-400 rounded text-[9px] font-bold uppercase tracking-widest shrink-0 border border-slate-100 whitespace-nowrap">
                                                        {q.source}
                                                      </span>
                                                  )}
                                              </div>
                                          </div>
                                       </div>
                                       {(extractionLanguage === 'Bilingual' || extractionLanguage === 'Urdu') && q.textUrdu && (
                                         <div className="font-urdu text-2xl text-slate-700 leading-relaxed text-right border-t border-slate-50 pt-2" dir="rtl">
                                            <MathRenderer text={q.textUrdu} />
                                         </div>
                                       )}
                                       {q.imageUrl && (
                                          <div className="mt-2 p-2 bg-slate-50 rounded-lg border border-slate-100 w-fit">
                                              <img src={q.imageUrl} alt="Question Diagram" className="h-20 w-auto object-contain rounded" />
                                          </div>
                                       )}
                                    </div>
                                 </div>
                              </div>
                            );
                         })}
                      </div>
                   )}
                </main>
              </div>

              {/* MODAL FOOTER */}
              <div className="px-10 py-6 border-t border-slate-100 bg-white flex flex-col md:flex-row justify-between items-center gap-8 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.02)]">
                 <div className="flex items-center gap-4">
                    <p className="text-[12px] font-black text-slate-400 uppercase tracking-[0.3em]">PROGRESS:</p>
                    <div className="flex items-baseline gap-2">
                       <span className={`text-4xl font-black tracking-tighter tabular-nums ${getSectionSelectedCount(activeSectionId) >= (sectionConfig?.totalCount || 0) ? 'text-emerald-600' : 'text-indigo-600'}`}>
                          {getSectionSelectedCount(activeSectionId)}
                       </span>
                       <span className="text-slate-300 font-bold text-2xl">/</span>
                       <span className="text-slate-400 font-black text-4xl tracking-tighter tabular-nums">{sectionConfig?.totalCount}</span>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <button onClick={handleRandomSelect} disabled={availableQuestions.length === 0} className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-700 font-black uppercase tracking-widest rounded-xl hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-100 transition-all text-xs flex items-center gap-3 active:scale-95">
                       <Sparkles size={18} /> SMART RANDOM
                    </button>
                    <button onClick={() => { setCurrentPaper({ ...currentPaper, structure: { ...currentPaper.structure, [activeSectionId]: sectionConfig } }); setIsSelectionModalOpen(false); }} className="px-14 py-3 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-xl hover:bg-indigo-700 shadow-2xl shadow-indigo-200 transition-all text-xs active:scale-95 border-b-4 border-indigo-800">DEPLOY TO CANVAS</button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* SAVE PAPER MODAL */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-[300] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
           {/* ... (Existing Save Modal Content) ... */}
           {/* Re-rendering logic kept for brevity as it was not requested to change */}
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200">
              {/* ... Headers and inputs similar to original file ... */}
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <div>
                    <h3 className="font-black text-xl text-gray-900 tracking-tight flex items-center gap-2">
                       <Save size={24} className="text-indigo-600" /> Save Examination Paper
                    </h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Institutional Repository Integration</p>
                 </div>
                 <button onClick={() => setIsSaveModalOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors"><X size={24}/></button>
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
                          onChange={e => setSaveForm({...saveForm, title: e.target.value})} 
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
                             onChange={e => setSaveForm({...saveForm, totalMarks: parseInt(e.target.value) || 0})} 
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
                             onChange={e => setSaveForm({...saveForm, durationMinutes: parseInt(e.target.value) || 60})} 
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
                             onChange={e => setSaveForm({...saveForm, examDate: e.target.value})} 
                             className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                          />
                       </div>
                       <div>
                          <label className="block text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                             <ClipboardList size={14} /> Test Type
                          </label>
                          <select 
                             value={saveForm.testType} 
                             onChange={e => setSaveForm({...saveForm, testType: e.target.value})} 
                             className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl font-bold text-gray-800 outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
                          >
                             {TEST_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                          </select>
                       </div>
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
               <img src={currentPaper.headerConfig.logoUrl} className="w-full h-full object-contain" />
            </div>
            <h4 className="text-white font-bold text-center text-xs tracking-tight line-clamp-1">{currentPaper.headerConfig.schoolName}</h4>
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
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Globe size={14}/> Paper View Mode</p>
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
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Settings2 size={14}/> Print Options</p>
                <button onClick={() => setShowPartHeadings(!showPartHeadings)} className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all ${showPartHeadings ? 'bg-indigo-600/20 border-indigo-600 text-indigo-300' : 'bg-slate-800/50 border-slate-700 text-slate-400'}`}>
                    <span className="text-[10px] font-bold uppercase">Show Part Headings</span>
                    {showPartHeadings ? <Eye size={14}/> : <EyeOff size={14}/>}
                </button>
                
                <div className="space-y-2">
                    <p className="text-[9px] font-bold text-slate-500 uppercase flex items-center gap-1.5"><Key size={12}/> Answer Display Mode</p>
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

            <div className="space-y-3 pt-6 border-t border-slate-800">
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><ListFilter size={14}/> Paper Navigator</p>
               <div className="space-y-1">
                  {(Object.values(currentPaper.structure) as PaperSectionConfig[]).map(sec => (
                     <button key={sec.id} onClick={() => document.getElementById(`editor-sec-${sec.id}`)?.scrollIntoView({behavior: 'smooth'})} className="w-full text-left p-2.5 bg-slate-800/50 hover:bg-indigo-600 border border-transparent hover:border-indigo-400 rounded-lg transition-all group">
                        <div className="flex justify-between items-center">
                           <span className="text-xs font-medium text-slate-300 group-hover:text-white line-clamp-1">{sec.title}</span>
                           <span className="text-[8px] font-bold text-slate-500 group-hover:text-indigo-200">{getSectionSelectedCount(sec.id)} Qs</span>
                        </div>
                     </button>
                  ))}
               </div>
            </div>

            <div className="space-y-3 pt-6 border-t border-slate-800">
               <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2"><Edit3 size={14}/> Settings</p>
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
               <button onClick={() => setIsSaveModalOpen(true)} className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-bold uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-2"><Save size={12}/> Save</button>
               <button onClick={onBack} className="flex-1 py-2.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg font-bold uppercase tracking-widest text-[9px] transition-all flex items-center justify-center gap-2"><X size={12}/> Exit</button>
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
                                                      <button onClick={() => updateQuestionManual(q.id, sec.id, { marks: (q.marks || 0) + 1 })} className="p-1 bg-slate-100 hover:bg-indigo-100 text-indigo-600 rounded"><Plus size={12}/></button>
                                                      <button onClick={() => toggleQuestionSelection(q)} className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded"><Trash size={12}/></button>
                                                   </div>
                                                )}
                                                <div className="flex gap-3 items-start">
                                                   <span className="font-bold text-sm min-w-[20px] pt-0.5">{idx + 1}.</span>
                                                   <div className="flex-1 space-y-1">
                                                      <div className="flex justify-between items-start gap-4">
                                                         {(extractionLanguage === 'Bilingual' || extractionLanguage === 'English') && q.text && (
                                                            <div className="text-sm font-semibold text-slate-800 leading-relaxed">
                                                               <MathRenderer text={q.text} inline />
                                                            </div>
                                                         )}
                                                         <span className="text-[10px] font-black text-slate-400 pt-0.5 whitespace-nowrap">[{q.marks}]</span>
                                                      </div>
                                                      {(extractionLanguage === 'Bilingual' || extractionLanguage === 'Urdu') && q.textUrdu && (
                                                         <div className="text-right font-urdu text-lg text-slate-700 leading-relaxed" dir="rtl">
                                                            <MathRenderer text={q.textUrdu} />
                                                         </div>
                                                      )}
                                                      {q.type === 'MCQ' && q.options && (
                                                         <div className={`grid ${sec.questionsPerLine ? 'grid-cols-1' : 'grid-cols-2 md:grid-cols-4'} gap-3 mt-2`}>
                                                            {q.options.map((opt, i) => (
                                                               <div key={i} className="flex gap-2 items-baseline text-xs text-slate-600">
                                                                  <span className="font-bold text-slate-400">({String.fromCharCode(65+i)})</span>
                                                                  <div className="flex flex-col">
                                                                     <span><MathRenderer text={opt} inline /></span>
                                                                     {q.optionsUrdu && q.optionsUrdu[i] && (
                                                                        <span className="text-right font-urdu text-sm mt-0.5" dir="rtl"><MathRenderer text={q.optionsUrdu[i]} /></span>
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
                                                      <button onClick={() => updateQuestionManual(q.id, sec.id, { marks: (q.marks || 0) + 1 })} className="p-1 bg-slate-100 hover:bg-indigo-100 text-indigo-600 rounded"><Plus size={12}/></button>
                                                      <button onClick={() => toggleQuestionSelection(q)} className="p-1 bg-red-50 hover:bg-red-100 text-red-600 rounded"><Trash size={12}/></button>
                                                   </div>
                                                )}
                                                <div className="flex gap-3 items-start">
                                                   <span className="font-bold text-sm min-w-[20px] pt-0.5">{idx + 1}.</span>
                                                   <div className="flex-1 space-y-2">
                                                      <div className="flex justify-between items-start gap-4">
                                                         {(extractionLanguage === 'Bilingual' || extractionLanguage === 'English') && q.text && (
                                                            <div className="text-sm font-semibold text-slate-800 leading-relaxed">
                                                               <MathRenderer text={q.text} inline />
                                                            </div>
                                                         )}
                                                         <span className="text-[10px] font-black text-slate-400 pt-0.5 whitespace-nowrap">[{q.marks}]</span>
                                                      </div>
                                                      {(extractionLanguage === 'Bilingual' || extractionLanguage === 'Urdu') && q.textUrdu && (
                                                         <div className="text-right font-urdu text-lg text-slate-700 leading-relaxed" dir="rtl">
                                                            <MathRenderer text={q.textUrdu} />
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
