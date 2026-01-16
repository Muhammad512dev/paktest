import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  BookOpen, 
  GraduationCap, 
  Library, 
  Layers, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Search, 
  Book, 
  Filter, 
  FileText, 
  ChevronRight, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Check, 
  Tag, 
  List, 
  Sparkles, 
  Image as ImageIcon,
  RefreshCw,
  Database,
  CheckCircle,
  FileUp,
  CloudDownload,
  Info,
  FileCheck,
  Loader2,
  ChevronDown,
  ArrowRight,
  Settings,
  CheckSquare,
  Square,
  Paperclip,
  Trash
} from 'lucide-react';
import { 
  getSyllabuses, addSyllabus, deleteSyllabus,
  getClasses, addClass, deleteClass,
  getSubjects, addSubject, deleteSubject,
  getChapters, addChapter, deleteChapter,
  getTopics, addTopic, deleteTopic,
  getSources, addSource, deleteSource,
  ensureCurriculumPath, uploadFile
} from '../../services/dataService';
import { Syllabus, ClassLevel, Subject, QuestionSource } from '../../types';

const CurriculumManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'SYLLABUS' | 'CLASS' | 'SUBJECT' | 'CHAPTER' | 'TOPIC' | 'SOURCE'>('SYLLABUS');
  
  // --- DATA STATES ---
  const [syllabuses, setSyllabuses] = useState<Syllabus[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [topics, setTopics] = useState<any[]>([]);
  const [sources, setSources] = useState<any[]>([]);

  /* Fixed: Make refreshData async and await Promise results for curriculum nodes */
  const refreshData = async () => {
    const syls = await getSyllabuses();
    setSyllabuses(syls);
    const clss = await getClasses();
    setClasses(clss);
    const subs = await getSubjects();
    setSubjects(subs);
    const chs = await getChapters();
    setChapters(chs);
    const tops = await getTopics();
    setTopics(tops);
    const srcs = await getSources();
    setSources(srcs);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // --- MODAL & IMPORT STATES ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSequenceImportModalOpen, setIsSequenceImportModalOpen] = useState(false);
  const [isSyncScreenOpen, setIsSyncScreenOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [importRows, setImportRows] = useState<any[]>([]);
  const sequenceFileInputRef = useRef<HTMLInputElement>(null);
  
  // AI Extraction State
  const [isAIImportOpen, setIsAIImportOpen] = useState(false);
  const [aiProcessing, setAiProcessing] = useState(false);
  const [aiBookFile, setAiBookFile] = useState<File | null>(null);
  
  // Creation Form State
  const [newItemName, setNewItemName] = useState('');
  const [newItemDesc, setNewItemDesc] = useState('');
  const [newItemImage, setNewItemImage] = useState<File | null>(null);
  
  // Sequential Selection States
  const [selSyllabusId, setSelSyllabusId] = useState('');
  const [selClassId, setSelClassId] = useState('');
  const [selSubjectId, setSelSubjectId] = useState('');
  const [selChapterId, setSelChapterId] = useState('');

  // Multi-Selection Storage
  const [multiSelSyllabusIds, setMultiSelSyllabusIds] = useState<string[]>([]);
  const [multiSelClassIds, setMultiSelClassIds] = useState<string[]>([]);
  const [multiSelSubjectIds, setMultiSelSubjectIds] = useState<string[]>([]);
  const [multiSelChapterIds, setMultiSelChapterIds] = useState<string[]>([]);

  // Filtering Logic
  const availableClasses = useMemo(() => classes.filter(c => c.syllabusId === selSyllabusId), [classes, selSyllabusId]);
  const availableSubjects = useMemo(() => subjects.filter(s => s.classId === selClassId), [subjects, selClassId]);
  const availableChapters = useMemo(() => chapters.filter(ch => ch.subjectId === selSubjectId), [chapters, selSubjectId]);

  const getSyllabusName = (id: string) => syllabuses.find(s => s.id === id)?.name || 'N/A';
  const getClassName = (id: string) => classes.find(c => c.id === id)?.name || 'N/A';
  const getSubjectName = (id: string) => subjects.find(s => s.id === id)?.name || 'N/A';
  const getChapterName = (id: string) => chapters.find(ch => ch.id === id)?.name || 'N/A';

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      const rows = lines.slice(1).filter(l => l.trim()).map(line => {
        const values = line.split(',');
        const obj: any = {};
        headers.forEach((h, i) => {
           // Basic mapping to ensure column names don't fail due to case sensitivity
           const header = h.trim();
           const val = values[i]?.trim();
           if (header.toLowerCase() === 'board') obj.Board = val;
           else if (header.toLowerCase() === 'grade') obj.Grade = val;
           else if (header.toLowerCase() === 'subject') obj.Subject = val;
           else if (header.toLowerCase() === 'chapter') obj.Chapter = val;
           else if (header.toLowerCase() === 'topic') obj.Topic = val;
           else obj[header] = val;
        });
        return obj;
      });
      setImportRows(rows);
      setIsSequenceImportModalOpen(false);
      setIsAddModalOpen(false);
      setIsSyncScreenOpen(true);
    };
    reader.readAsText(file);
    if (e.target) e.target.value = '';
  };

  const executeSynchronization = async () => {
    setIsSyncing(true);
    // Add small delay to show processing
    await new Promise(r => setTimeout(r, 1200));
    
    try {
      for (const row of importRows) {
        await ensureCurriculumPath({
          board: row.Board || row.board || 'Global',
          grade: row.Grade || row.grade || 'General',
          subject: row.Subject || row.subject || 'General',
          chapter: row.Chapter || row.chapter || 'Introduction',
          topic: row.Topic || row.topic || 'General Concepts'
        });
      }
      await refreshData();
      setIsSyncing(false);
      setIsSyncScreenOpen(false);
      alert(`Successfully synchronized ${importRows.length} curriculum nodes.`);
    } catch (err) {
      console.error("Sync error:", err);
      alert("Failed to synchronize curriculum. Please check CSV format.");
      setIsSyncing(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItemName) return;
    const timestamp = Date.now();
    let logoStr = '';
    if (newItemImage) {
        try {
            logoStr = await uploadFile(newItemImage);
        } catch (e) {
            alert("Failed to upload image");
            return;
        }
    }
    
    if (activeTab === 'SYLLABUS') {
      await addSyllabus({ id: `syl_${timestamp}`, name: newItemName, description: newItemDesc, logo: logoStr });
    } else if (activeTab === 'CLASS') {
      for (const [idx, sId] of multiSelSyllabusIds.entries()) {
        await addClass({ id: `cls_${timestamp}_${idx}`, name: newItemName, syllabusId: sId, logo: logoStr });
      }
    } else if (activeTab === 'SUBJECT') {
      for (const [idx, cId] of multiSelClassIds.entries()) {
        const parentClass = classes.find(c => c.id === cId);
        /* Fixed: Removed 'originalId' as it is not a property of Subject type */
        await addSubject({ id: `sub_${timestamp}_${idx}`, name: newItemName, icon: Book, classId: cId, syllabusId: parentClass?.syllabusId || selSyllabusId, logo: logoStr });
      }
    } else if (activeTab === 'CHAPTER') {
      for (const [idx, sId] of multiSelSubjectIds.entries()) {
        const parentSubject = subjects.find(s => s.id === sId);
        await addChapter({ id: `ch_${timestamp}_${idx}`, name: newItemName, subjectId: sId, classId: parentSubject?.classId || selClassId, syllabusId: parentSubject?.syllabusId || selSyllabusId });
      }
    } else if (activeTab === 'TOPIC') {
      for (const [idx, chId] of multiSelChapterIds.entries()) {
        await addTopic({ id: `top_${timestamp}_${idx}`, name: newItemName, chapterId: chId });
      }
    } else if (activeTab === 'SOURCE') {
      await addSource({ id: `src_${timestamp}`, name: newItemName });
    }

    await refreshData();
    setIsAddModalOpen(false);
    setNewItemName('');
    setNewItemImage(null);
  };

  const tabs = [
    { id: 'SYLLABUS', label: 'Boards', icon: BookOpen },
    { id: 'CLASS', label: 'Grades', icon: GraduationCap },
    { id: 'SUBJECT', label: 'Subjects', icon: Library },
    { id: 'CHAPTER', label: 'Chapters', icon: Layers },
    { id: 'TOPIC', label: 'Topics', icon: FileText },
    { id: 'SOURCE', label: 'Sources', icon: Tag },
  ];

  const handleOpenAddModal = () => {
    setNewItemName('');
    setNewItemImage(null);
    setSelSyllabusId('');
    setSelClassId('');
    setSelSubjectId('');
    setMultiSelSyllabusIds([]);
    setMultiSelClassIds([]);
    setMultiSelSubjectIds([]);
    setMultiSelChapterIds([]);
    setIsAddModalOpen(true);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Curriculum Manager</h1>
          <p className="text-sm text-gray-500 mt-1">Manage boards, grades, subjects, and topics repository</p>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setIsAIImportOpen(true)} className="bg-purple-50 text-purple-700 border border-purple-200 px-4 py-2 rounded-lg font-bold hover:bg-purple-100 transition-all flex items-center gap-2">
            <Sparkles size={18} /> AI Extract
          </button>
          <button onClick={() => setIsSequenceImportModalOpen(true)} className="bg-indigo-50 text-indigo-700 border border-indigo-200 px-4 py-2 rounded-lg font-bold hover:bg-indigo-100 transition-all flex items-center gap-2">
            <FileUp size={18} /> Smart Bulk Sync
          </button>
          <button onClick={handleOpenAddModal} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-100">
            <Plus size={18} /> Add {activeTab.toLowerCase()}
          </button>
        </div>
      </div>

      <div className="flex gap-4 border-b border-gray-200 mb-8 overflow-x-auto scrollbar-hide">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`flex items-center gap-2 px-6 py-4 text-sm font-bold border-b-2 transition-all whitespace-nowrap ${activeTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'}`}>
            <tab.icon size={18} /> {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm min-h-[500px] relative overflow-hidden">
         {/* LIST VIEW RENDERING */}
         {activeTab === 'SYLLABUS' && (
             <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {syllabuses.map(s => (
                  <div key={s.id} className="group relative h-48 rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-2xl transition-all cursor-pointer">
                     {s.logo ? <img src={s.logo} className="absolute inset-0 w-full h-full object-cover" /> : <div className="absolute inset-0 bg-gradient-to-br from-indigo-500 to-purple-600" />}
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                     <div className="absolute bottom-0 left-0 right-0 p-6">
                        <h3 className="font-bold text-white text-xl">{s.name}</h3>
                        <p className="text-white/70 text-sm mt-1 line-clamp-1">{s.description}</p>
                     </div>
                     <button onClick={() => { deleteSyllabus(s.id); refreshData(); }} className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md text-white rounded-lg opacity-0 group-hover:opacity-100 hover:bg-red-600"><Trash2 size={16}/></button>
                  </div>
                ))}
             </div>
         )}
         
         {activeTab === 'CLASS' && (
             <div className="p-8">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                   {classes.map(c => (
                      <div key={c.id} className="group p-6 rounded-2xl border border-gray-100 bg-white shadow-sm hover:shadow-xl border-b-4 border-b-indigo-500 flex flex-col items-center text-center">
                         <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all overflow-hidden border border-indigo-100">
                            {c.logo ? <img src={c.logo} className="w-full h-full object-cover" /> : <GraduationCap size={32} />}
                         </div>
                         <h3 className="font-bold text-gray-900 text-lg">{c.name}</h3>
                         <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{getSyllabusName(c.syllabusId)}</span>
                         <button onClick={() => { deleteClass(c.id); refreshData(); }} className="mt-4 p-2 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={16}/></button>
                      </div>
                   ))}
                </div>
             </div>
         )}

         {activeTab === 'SUBJECT' && (
            <div className="p-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
               {subjects.map(s => (
                  <div key={s.id} className="group p-5 bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-xl transition-all">
                     <div className="flex justify-between items-start mb-4">
                        <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center overflow-hidden border border-emerald-100">
                           {s.logo ? <img src={s.logo} className="w-full h-full object-cover" /> : <Library size={24}/>}
                        </div>
                        <button onClick={() => { deleteSubject(s.id); refreshData(); }} className="p-1.5 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={14}/></button>
                     </div>
                     <h4 className="font-bold text-gray-900">{s.name}</h4>
                     <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">{getClassName(s.classId)}</p>
                  </div>
               ))}
            </div>
         )}

         {activeTab === 'SOURCE' && (
            <div className="p-8 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
               {sources.map(src => (
                  <div key={src.id} className="p-4 bg-gray-50 border border-gray-200 rounded-xl flex items-center justify-between group">
                     <span className="font-bold text-gray-700 text-sm">{src.name}</span>
                     <button onClick={() => { deleteSource(src.id); refreshData(); }} className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100"><Trash2 size={14}/></button>
                  </div>
               ))}
            </div>
         )}

         {(activeTab === 'CHAPTER' || activeTab === 'TOPIC') && (
             <div className="p-8 divide-y divide-gray-100">
                {(activeTab === 'CHAPTER' ? chapters : topics).map(item => (
                   <div key={item.id} className="py-4 flex items-center justify-between hover:bg-gray-50 px-4 rounded-xl group transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center">
                            {activeTab === 'CHAPTER' ? <Layers size={20}/> : <FileText size={20}/>}
                         </div>
                         <div>
                            <p className="font-bold text-gray-900">{item.name}</p>
                            <p className="text-[10px] text-gray-400 uppercase font-bold">
                               {activeTab === 'CHAPTER' ? getSubjectName(item.subjectId) : getChapterName(item.chapterId)}
                            </p>
                         </div>
                      </div>
                      <button onClick={() => { 
                         if(activeTab === 'CHAPTER') deleteChapter(item.id); 
                         else deleteTopic(item.id);
                         refreshData();
                      }} className="opacity-0 group-hover:opacity-100 text-red-500 p-2"><Trash2 size={16}/></button>
                   </div>
                ))}
             </div>
         )}
      </div>

      {/* MANUAL ADD MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col">
              <div className="px-8 py-6 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                 <div>
                    <h3 className="font-bold text-xl text-gray-900 flex items-center gap-2">
                       <Plus size={24} className="text-indigo-600"/> 
                       Add {activeTab.toLowerCase()}
                    </h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Manual Repository Builder</p>
                 </div>
                 <button onClick={() => setIsAddModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors"><X size={24}/></button>
              </div>
              
              <div className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
                 {/* SEQUENTIAL DRILL-DOWN */}
                 {(activeTab === 'CLASS' || activeTab === 'SUBJECT' || activeTab === 'CHAPTER' || activeTab === 'TOPIC') && (
                    <div className="space-y-6">
                       {/* 1. BOARD */}
                       <div className="space-y-3">
                          <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><BookOpen size={12}/> 1. Select Board{activeTab === 'CLASS' ? '(s)' : ''}</label>
                          {activeTab === 'CLASS' ? (
                             <div className="grid grid-cols-2 gap-2 border border-gray-200 rounded-2xl p-4 bg-white max-h-40 overflow-y-auto">
                                {syllabuses.map(s => (
                                   <label key={s.id} onClick={() => setMultiSelSyllabusIds(prev => prev.includes(s.id) ? prev.filter(i => i !== s.id) : [...prev, s.id])} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${multiSelSyllabusIds.includes(s.id) ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
                                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${multiSelSyllabusIds.includes(s.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300'}`}>{multiSelSyllabusIds.includes(s.id) && <Check size={12}/>}</div>
                                      <span className="text-xs font-bold text-gray-700">{s.name}</span>
                                   </label>
                                ))}
                             </div>
                          ) : (
                             <select className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-white font-medium" value={selSyllabusId} onChange={(e) => { setSelSyllabusId(e.target.value); setSelClassId(''); setSelSubjectId(''); }}>
                                <option value="">Choose Board...</option>
                                {syllabuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                             </select>
                          )}
                       </div>

                       {/* 2. GRADE */}
                       {(activeTab === 'SUBJECT' || activeTab === 'CHAPTER' || activeTab === 'TOPIC') && selSyllabusId && (
                          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><GraduationCap size={12}/> 2. Select Grade{activeTab === 'SUBJECT' ? '(s)' : ''}</label>
                             {activeTab === 'SUBJECT' ? (
                                <div className="grid grid-cols-2 gap-2 border border-gray-200 rounded-2xl p-4 bg-white max-h-40 overflow-y-auto">
                                   {availableClasses.map(c => (
                                      <label key={c.id} onClick={() => setMultiSelClassIds(prev => prev.includes(c.id) ? prev.filter(i => i !== c.id) : [...prev, c.id])} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${multiSelClassIds.includes(c.id) ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
                                         <div className={`w-5 h-5 rounded border flex items-center justify-center ${multiSelClassIds.includes(c.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300'}`}>{multiSelClassIds.includes(c.id) && <Check size={12}/>}</div>
                                         <span className="text-xs font-bold text-gray-700">{c.name}</span>
                                      </label>
                                   ))}
                                </div>
                             ) : (
                                <select className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-white font-medium" value={selClassId} onChange={(e) => { setSelClassId(e.target.value); setSelSubjectId(''); }}>
                                   <option value="">Choose Grade...</option>
                                   {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                             )}
                          </div>
                       )}

                       {/* 3. SUBJECT */}
                       {(activeTab === 'CHAPTER' || activeTab === 'TOPIC') && selClassId && (
                          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Library size={12}/> 3. Select Subject{activeTab === 'CHAPTER' ? '(s)' : ''}</label>
                             {activeTab === 'CHAPTER' ? (
                                <div className="grid grid-cols-1 gap-2 border border-gray-200 rounded-2xl p-4 bg-white max-h-40 overflow-y-auto">
                                   {availableSubjects.map(s => (
                                      <label key={s.id} onClick={() => setMultiSelSubjectIds(prev => prev.includes(s.id) ? prev.filter(i => i !== s.id) : [...prev, s.id])} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${multiSelSubjectIds.includes(s.id) ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
                                         <div className={`w-5 h-5 rounded border flex items-center justify-center ${multiSelSubjectIds.includes(s.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300'}`}>{multiSelSubjectIds.includes(s.id) && <Check size={12}/>}</div>
                                         <span className="text-xs font-bold text-gray-700">{s.name}</span>
                                      </label>
                                   ))}
                                </div>
                             ) : (
                                <select className="w-full px-4 py-3 border border-gray-200 rounded-xl outline-none bg-white font-medium" value={selSubjectId} onChange={(e) => { setSelSubjectId(e.target.value); setSelChapterId(''); }}>
                                   <option value="">Choose Subject...</option>
                                   {availableSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                </select>
                             )}
                          </div>
                       )}

                       {/* 4. CHAPTER */}
                       {activeTab === 'TOPIC' && selSubjectId && (
                          <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Layers size={12}/> 4. Select Chapter(s)</label>
                             <div className="grid grid-cols-1 gap-2 border border-gray-200 rounded-2xl p-4 bg-white max-h-40 overflow-y-auto">
                                {availableChapters.map(ch => (
                                   <label key={ch.id} onClick={() => setMultiSelChapterIds(prev => prev.includes(ch.id) ? prev.filter(i => i !== ch.id) : [...prev, ch.id])} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${multiSelChapterIds.includes(ch.id) ? 'bg-indigo-50 border-indigo-200 shadow-sm' : 'bg-gray-50 border-transparent hover:border-gray-200'}`}>
                                      <div className={`w-5 h-5 rounded border flex items-center justify-center ${multiSelChapterIds.includes(ch.id) ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-300'}`}>{multiSelChapterIds.includes(ch.id) && <Check size={12}/>}</div>
                                      <span className="text-xs font-bold text-gray-700">{ch.name}</span>
                                   </label>
                                ))}
                             </div>
                          </div>
                       )}
                    </div>
                 )}

                 {/* LOGO UPLOAD (Boards, Classes, Subjects) */}
                 {(activeTab === 'SYLLABUS' || activeTab === 'CLASS' || activeTab === 'SUBJECT') && (
                    <div className="space-y-3">
                       <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1">Symbol / Logo Upload</label>
                       <div className="p-5 border border-indigo-50 rounded-3xl bg-indigo-50/20 flex items-center gap-6">
                          <div className="w-20 h-20 bg-white border-2 border-dashed border-indigo-200 rounded-2xl flex items-center justify-center overflow-hidden relative group cursor-pointer shadow-sm">
                             {newItemImage ? <img src={URL.createObjectURL(newItemImage)} className="w-full h-full object-contain" /> : <ImageIcon size={32} className="text-indigo-200"/>}
                             <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" onChange={e => setNewItemImage(e.target.files?.[0] || null)} />
                          </div>
                          <div>
                             <p className="text-xs font-bold text-indigo-900 mb-1">Set Visual Identity</p>
                             <p className="text-[10px] text-indigo-400 leading-relaxed">This logo will appear in the Paper Generator selection screens.</p>
                             {newItemImage && <button onClick={() => setNewItemImage(null)} className="mt-2 text-[10px] font-bold text-red-500 uppercase flex items-center gap-1"><Trash size={10}/> Clear</button>}
                          </div>
                       </div>
                    </div>
                 )}

                 {/* MAIN NAME INPUT */}
                 <div className="space-y-3 pt-6 border-t border-gray-100">
                    <label className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest ml-1">{activeTab} Title</label>
                    <input type="text" className="w-full px-5 py-4 border border-indigo-100 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 text-lg font-bold shadow-sm bg-indigo-50/5" placeholder={`Enter name for this ${activeTab.toLowerCase()}...`} value={newItemName} onChange={e => setNewItemName(e.target.value)} />
                    {activeTab === 'SYLLABUS' && <textarea className="w-full px-4 py-3 border border-gray-200 rounded-xl min-h-[100px] text-sm" placeholder="Brief description..." value={newItemDesc} onChange={e => setNewItemDesc(e.target.value)} />}
                 </div>

                 {/* BULK IMPORT CTA */}
                 <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-100 p-6 rounded-3xl flex items-center justify-between shadow-sm">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 bg-white border border-amber-200 rounded-2xl flex items-center justify-center text-amber-600 shadow-sm"><FileSpreadsheet size={24}/></div>
                       <div>
                          <p className="text-sm font-bold text-amber-900">Need to add hundreds?</p>
                          <p className="text-[10px] text-amber-700">Import entire curriculum paths instantly via CSV</p>
                       </div>
                    </div>
                    <button onClick={() => { setIsAddModalOpen(false); setIsSequenceImportModalOpen(true); }} className="px-5 py-3 bg-amber-600 text-white text-[10px] font-extrabold uppercase rounded-2xl hover:bg-amber-700 transition-all flex items-center gap-2 shadow-lg shadow-amber-200">Go to Bulk Sync <ArrowRight size={14}/></button>
                 </div>
              </div>

              <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                 <button onClick={() => setIsAddModalOpen(false)} className="px-8 py-3 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-2xl transition-all">Cancel</button>
                 <button disabled={!newItemName} onClick={handleAddItem} className="px-12 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50">Commit to Repository</button>
              </div>
           </div>
        </div>
      )}

      {/* Bulk Sync Modal */}
      {isSequenceImportModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden flex flex-col">
              <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
                 <div>
                    <h3 className="font-bold text-2xl flex items-center gap-2 tracking-tight"><FileUp size={24}/> Smart Curriculum Sync</h3>
                    <p className="text-xs text-indigo-100 font-medium uppercase tracking-widest mt-1">Global Repository Importer</p>
                 </div>
                 <button onClick={() => setIsSequenceImportModalOpen(false)} className="hover:bg-white/20 p-2 rounded-full transition-colors"><X size={24}/></button>
              </div>
              <div className="p-10 space-y-8">
                 <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-start gap-4">
                    <Info className="text-indigo-600 mt-1" size={20}/>
                    <p className="text-xs text-indigo-900 leading-relaxed font-medium">
                       Uploading a CSV with headers <strong>Board, Grade, Subject, Chapter, Topic</strong> will automatically build the entire hierarchy if parts are missing.
                    </p>
                 </div>
                 <div 
                    onClick={() => sequenceFileInputRef.current?.click()}
                    className="border-2 border-dashed border-indigo-200 rounded-[2rem] h-48 flex flex-col items-center justify-center text-center bg-gray-50/50 group cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all"
                  >
                    <CloudDownload size={48} className="text-indigo-300 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Drop Master CSV File</p>
                    <button className="mt-4 px-10 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-extrabold uppercase shadow-xl shadow-indigo-100">Browse Files</button>
                    <input type="file" ref={sequenceFileInputRef} className="hidden" accept=".csv" onChange={handleFileUpload} />
                 </div>
                 <div className="flex justify-center text-xs text-gray-400 font-bold uppercase tracking-tighter">
                    Need help with the CSV format? Visit the Platform Support module.
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* Sync Screen Verification */}
      {isSyncScreenOpen && (
        <div className="fixed inset-0 z-[70] bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl h-[80vh] flex flex-col overflow-hidden">
              <div className="px-8 py-5 border-b border-gray-100 flex justify-between items-center bg-indigo-600 text-white">
                 <div>
                    <h3 className="font-bold text-lg flex items-center gap-2"><RefreshCw size={20} className={isSyncing ? "animate-spin" : ""}/> Curriculum Path Verification</h3>
                    <p className="text-[10px] text-indigo-100 font-medium uppercase tracking-widest mt-1">Reviewing {importRows.length} sequence nodes</p>
                 </div>
                 <button onClick={() => setIsSyncScreenOpen(false)} className="p-2 hover:bg-white/20 rounded-full"><X size={20}/></button>
              </div>
              <div className="flex-1 overflow-auto">
                 <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 border-b border-gray-200 sticky top-0 z-10 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                       <tr><th className="px-6 py-4">{'Board > Grade'}</th><th className="px-6 py-4">Subject</th><th className="px-6 py-4">{'Chapter' > 'Topic'}</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                       {importRows.map((row, i) => (
                          <tr key={i} className="hover:bg-slate-50 transition-colors">
                             <td className="px-6 py-4">
                                <p className="text-sm font-bold text-gray-900">{row.Board}</p>
                                <p className="text-xs text-gray-500 font-medium">{row.Grade}</p>
                             </td>
                             <td className="px-6 py-4 text-sm font-bold text-indigo-600">{row.Subject}</td>
                             <td className="px-6 py-4">
                                <p className="text-sm font-medium text-gray-700">{row.Chapter}</p>
                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{row.Topic}</p>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
              <div className="p-6 border-t border-gray-100 bg-slate-50 flex justify-between items-center">
                 <div className="flex items-center gap-2 text-xs text-slate-500"><Info size={16}/> New paths will be created if they don't exist.</div>
                 <div className="flex gap-3">
                    <button onClick={() => setIsSyncScreenOpen(false)} className="px-6 py-2 text-sm font-bold text-gray-500">Discard</button>
                    <button onClick={executeSynchronization} disabled={isSyncing} className="px-10 py-2.5 bg-indigo-600 text-white rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100">
                       {isSyncing ? <Loader2 size={18} className="animate-spin"/> : <FileCheck size={18}/>} Commit Sync
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}

      {/* AI Extraction Modal */}
      {isAIImportOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
           <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
              <h3 className="font-bold text-2xl mb-2 flex items-center gap-2"><Sparkles className="text-purple-600"/> AI Curriculum Extraction</h3>
              <p className="text-sm text-gray-500 mb-8 leading-relaxed">Upload a textbook image or PDF contents page to extract hierarchy.</p>
              <div className="space-y-6">
                 <div>
                    <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5 block">Target Subject</label>
                    <select className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-white outline-none" value={selSubjectId} onChange={e => setSelSubjectId(e.target.value)}>
                       <option value="">Choose Subject...</option>
                       {subjects.map(s => <option key={s.id} value={s.id}>{s.name} ({getClassName(s.classId)})</option>)}
                    </select>
                 </div>
                 <div className="border-2 border-dashed border-gray-100 rounded-3xl p-8 text-center bg-gray-50 group hover:border-purple-300 transition-all cursor-pointer" onClick={() => (document.getElementById('ai-file-cur') as HTMLInputElement)?.click()}>
                    <ImageIcon size={40} className="mx-auto text-gray-300 mb-2 group-hover:text-purple-500 transition-all" />
                    <p className="text-xs font-bold text-gray-500 uppercase">{aiBookFile ? aiBookFile.name : 'Select Image/PDF'}</p>
                    <input id="ai-file-cur" type="file" className="hidden" onChange={e => setAiBookFile(e.target.files?.[0] || null)} />
                 </div>
                 <div className="flex gap-3 pt-4">
                    <button onClick={() => setIsAIImportOpen(false)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50">Cancel</button>
                    <button disabled={aiProcessing || !aiBookFile || !selSubjectId} onClick={() => {}} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 disabled:opacity-50">
                       {aiProcessing ? <RefreshCw className="animate-spin" size={18}/> : "Extract Path"}
                    </button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default CurriculumManager;