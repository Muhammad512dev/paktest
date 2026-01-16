
import React, { useState, useMemo, useEffect } from 'react';
import { 
  ChevronRight, Check, ArrowLeft, BookOpen, GraduationCap, Settings,
  Sparkles, Filter, Eye, X, Plus, Trash2, CloudLightning,
  Layers, FileText, CheckCircle2, ChevronDown, MonitorPlay, Layout, Library, Settings2,
  Hash, Info, Edit3, Tag, RefreshCw, Zap
} from 'lucide-react';
import { WizardState, Question, Difficulty, PaperStructure, PaperSectionConfig, User, WatermarkType, PaperLayoutMode, School, UserRole } from '../types';
import { 
  getSyllabuses, getClasses, getSubjects, getChapters, getTopics, getQuestions, getQuestionTypes, getSchoolById, getSystemConfig
} from '../services/dataService';
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
  
  // Repository for Auto-Generation
  const [repoQuestions, setRepoQuestions] = useState<Question[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  const [state, setState] = useState<WizardState>(() => ({
    step: 'SYLLABUS',
    selectedChapters: [],
    selectedTopics: [],
    selectedQuestions: [],
    configMode: 'MANUAL',
    paperStructure: {},
    paperLayout: 'Standard',
    watermark: 'Monogram'
  }));

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
        getQuestions() // Pre-load questions for Auto-Gen
      ]);
      
      setRepoQuestions(qs);

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

      // Filter syllabuses if restricted by school (Skip filter for Super Admin)
      let finalSyllabuses = syls;
      if (user.role !== UserRole.SUPER_ADMIN && brandingData?.assignedSyllabuses?.length && brandingData.assignedSyllabuses.length > 0) {
          finalSyllabuses = syls.filter(s => brandingData?.assignedSyllabuses?.includes(s.id));
      }

      setSyllabuses(finalSyllabuses);
      setClasses(clss);
      setSubjects(subs);
      setAllChapters(chs);
      setAllTopics(tops);
      setQuestionTypes([...types]);
      setSchoolData(brandingData);
    };
    loadAllData();
  }, [user.schoolId, user.role]);

  const filteredClasses = useMemo(() => classes.filter(c => c.syllabusId === state.selectedSyllabus), [classes, state.selectedSyllabus]);
  const filteredSubjects = useMemo(() => subjects.filter(s => s.classId === state.selectedClass), [subjects, state.selectedClass]);
  const relevantChapters = useMemo(() => allChapters.filter(c => c.subjectId === state.selectedSubject), [allChapters, state.selectedSubject]);

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
    const defaultTypes = ['MCQ', 'Short Answer', 'Long Answer'];
    defaultTypes.forEach((type, idx) => {
      const id = `sec_${Date.now()}_${idx}`;
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
        category: type === 'MCQ' ? 'Objective' : 'Subjective',
        subQuestionNumbering: type === 'MCQ' ? 'Numeric' : 'Roman'
      };
    });
    setState(prev => ({ ...prev, paperStructure: structure, step: 'SETUP' }));
  };

  const updateSection = (id: string, updates: Partial<PaperSectionConfig>) => {
    setState(prev => ({
      ...prev,
      paperStructure: {
        ...prev.paperStructure,
        [id]: { ...prev.paperStructure[id], ...updates }
      }
    }));
  };

  const addNewSection = () => {
    const id = `sec_${Date.now()}`;
    const nextNum = Object.keys(state.paperStructure).length + 1;
    const newSec: PaperSectionConfig = {
      id: id,
      title: `Q.${nextNum} New Section`,
      questionType: 'MCQ',
      marksPerQuestion: 1,
      totalCount: 5,
      selectCount: 5,
      blankLines: 0,
      blankLineType: 'Line',
      questionsPerLine: false,
      languageMedium: 'Bilingual',
      sourceFilter: [],
      category: 'Objective',
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

  const handleAutoGenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
        const generatedQuestions: Question[] = [];
        const subjectName = subjects.find(s => s.id === state.selectedSubject)?.name;
        const className = classes.find(c => c.id === state.selectedClass)?.name;

        (Object.values(state.paperStructure) as PaperSectionConfig[]).forEach(sec => {
            // Filter pool
            const pool = repoQuestions.filter(q => 
                q.type === sec.questionType &&
                q.subject === subjectName &&
                (q.classLevel === className || !q.classLevel) && // Loose matching for class if missing
                (state.selectedChapters.length === 0 || state.selectedChapters.includes(q.chapter || ''))
            );
            
            // Randomize and Pick
            const shuffled = [...pool].sort(() => 0.5 - Math.random());
            const picked = shuffled.slice(0, sec.totalCount);
            
            picked.forEach(q => {
                generatedQuestions.push({
                    ...q,
                    // Assign a new unique ID to this instance of the question on the paper
                    // This prevents React key collisions if the same question is picked for different sections
                    // or if the repo contained duplicates.
                    id: `${q.id}_gen_${Math.random().toString(36).substr(2, 9)}`,
                    sectionId: sec.id,
                    marks: sec.marksPerQuestion
                });
            });
        });

        setState(prev => ({ ...prev, selectedQuestions: generatedQuestions, step: 'EDITOR' }));
        onEditorEnter?.();
        setIsGenerating(false);
    }, 1500); // Fake delay for UX
  };

  const StepIndicator = () => {
     const steps = ['Board', 'Grade', 'Subject', 'Topics', 'Layout', 'Questions'];
     const currentIdx = ['SYLLABUS', 'CLASS', 'SUBJECT', 'CHAPTERS', 'SETUP', 'EDITOR'].indexOf(state.step);
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
       <h2 className="text-3xl font-black text-gray-900 mb-12 tracking-tight">Step 1: Select Examination Board</h2>
       {syllabuses.length === 0 ? (
           <div className="text-center py-20 bg-gray-50 rounded-3xl border border-gray-100">
               <p className="text-gray-400 font-bold uppercase tracking-widest">No assigned syllabuses found.</p>
               <p className="text-xs text-gray-400 mt-2">Contact administrator to assign curriculum entitlements.</p>
           </div>
       ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {syllabuses.map(s => (
                 <div key={s.id} onClick={() => setState({ ...state, selectedSyllabus: s.id, step: 'CLASS' })} className="group relative h-48 rounded-[2rem] overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer">
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
                   Manual Selection
                </button>
                <button 
                   onClick={() => setState({...state, configMode: 'AUTO'})}
                   className={`flex-1 py-3 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-2 ${state.configMode === 'AUTO' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                   <Zap size={12} /> Auto-Generate
                </button>
             </div>

             <button 
                onClick={() => state.configMode === 'AUTO' ? handleAutoGenerate() : (onEditorEnter?.(), setState({...state, step: 'EDITOR'}))} 
                disabled={isGenerating}
                className="w-full py-5 bg-white text-slate-900 font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-light transition-all shadow-xl text-xs active:scale-95 flex items-center justify-center gap-3 disabled:opacity-50"
             >
                {isGenerating ? <RefreshCw className="animate-spin" /> : (state.configMode === 'AUTO' ? 'Generate & Enter Editor' : 'Enter Editor Context')}
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
                         {['MCQ', 'Short Answer', 'Long Answer', 'Diagram Based', 'Fill in the Blanks', 'True/False', 'Match Columns'].map(t => <option key={t} value={t}>{t}</option>)}
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
        selectedTopics: state.selectedTopics
     };
     return <PaperEditor paper={initialPaper} onUpdate={() => {}} onBack={() => { onEditorExit?.(); setState({...state, step: 'SETUP', selectedQuestions: []}); }} user={user} />;
  }
  return null;
};

export default GeneratePaper;
