
import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileText, Download, Filter, ChevronLeft, ChevronRight, GraduationCap, Layers, Tag } from 'lucide-react';
import { getNotes, getPublicCurriculum } from '../../services/dataService';
import { Syllabus, ClassLevel } from '../../types';

const NOTE_TYPES = [
  'Book Notes',
  'Class Notes',
  'ECAT/Entry Test',
  'NTS',
  'MDCAT',
  'Past Paper',
  'Other'
];

const Notes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [curriculum, setCurriculum] = useState<{ syllabuses: Syllabus[]; classes: ClassLevel[] }>({
    syllabuses: [],
    classes: []
  });
  const [filters, setFilters] = useState({ board: '', grade: '', noteType: '', resource: '' });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPublicCurriculum();
        setCurriculum({ syllabuses: data?.syllabuses || [], classes: data?.classes || [] });
      } catch {
        setCurriculum({ syllabuses: [], classes: [] });
      }
    };
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      const data = await getNotes({
        search: searchTerm,
        board: filters.board,
        grade: filters.grade,
        noteType: filters.noteType
      });
      setNotes(Array.isArray(data) ? data : []);
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm, filters.board, filters.grade, filters.noteType]);

  // Dynamic boards strictly extracted from actual existing notes input fields
  const availableBoards = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    notes.forEach(n => {
      if (n.board && !list.some(b => b.name.toLowerCase() === n.board.toLowerCase() || b.id === n.board)) {
        list.push({ id: n.board, name: n.board });
      }
    });
    return list;
  }, [notes]);

  // Dynamic classes strictly extracted from actual existing notes input fields
  const availableClasses = useMemo(() => {
    const list: { id: string; name: string; syllabusId?: string }[] = [];
    notes.forEach(n => {
      if (n.grade && !list.some(c => c.name.toLowerCase() === n.grade.toLowerCase())) {
        list.push({ id: n.grade, name: n.grade, syllabusId: n.board });
      }
    });
    return list;
  }, [notes]);

  // Dynamic note types strictly extracted from actual existing notes
  const availableNoteTypes = useMemo(() => {
    const set = new Set<string>();
    notes.forEach(n => {
      if (n.noteType) set.add(n.noteType);
    });
    return Array.from(set);
  }, [notes]);

  // Dynamic resources strictly extracted from comma-separated resource inputs in notes
  const availableResources = useMemo(() => {
    const set = new Set<string>();
    notes.forEach(n => {
      const raw = n.resource || n.source || n.book || '';
      if (raw) {
        raw.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((r: string) => set.add(r));
      }
    });
    return Array.from(set);
  }, [notes]);

  // Step Navigation state: 1 = Syllabus/Board, 2 = Class, 3 = Subject/NoteType, 4 = Notes/PDF View
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');

  // Extract available subjects from notes
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    notes.forEach(n => {
      if (n.subject) set.add(n.subject);
    });
    return Array.from(set);
  }, [notes]);

  const stepClasses = useMemo(() => {
    return availableClasses.filter(c => !selectedBoard || !c.syllabusId || c.syllabusId === selectedBoard);
  }, [availableClasses, selectedBoard]);

  const stepNotes = useMemo(() => {
    return notes.filter(n => {
      if (selectedBoard && n.board && n.board.toLowerCase() !== selectedBoard.toLowerCase()) return false;
      if (selectedClass && n.grade && n.grade.toLowerCase() !== selectedClass.toLowerCase()) return false;
      if (selectedSubject && n.subject && n.subject.toLowerCase() !== selectedSubject.toLowerCase()) return false;
      if (selectedType && n.noteType && n.noteType.toLowerCase() !== selectedType.toLowerCase()) return false;
      if (filters.resource && n.resource) {
        const items = n.resource.split(',').map((s: string) => s.trim().toLowerCase());
        if (!items.includes(filters.resource.toLowerCase())) return false;
      }
      return true;
    });
  }, [notes, selectedBoard, selectedClass, selectedSubject, selectedType, filters.resource]);

  const resetStepWizard = () => {
    setSelectedBoard('');
    setSelectedClass('');
    setSelectedSubject('');
    setSelectedType('');
    setFilters({ board: '', grade: '', noteType: '', resource: '' });
    setCurrentStep(1);
  };

  const totalPages = Math.ceil(stepNotes.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNotes = stepNotes.slice(indexOfFirstItem, indexOfLastItem);
  const recentFiveNotes = useMemo(() => stepNotes.slice(0, 5), [stepNotes]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage, selectedBoard, selectedClass, selectedSubject, selectedType]);

  const stepDescriptions = [
    { title: 'Step 1: Choose Board / Syllabus', desc: 'Select your educational board or syllabus system to view targeted notes.' },
    { title: 'Step 2: Choose Academic Class', desc: 'Select the class or grade level for your selected board.' },
    { title: 'Step 3: Choose Subject & Note Type', desc: 'Select your subject or specific category of notes.' },
    { title: 'Step 4: View & Download Notes', desc: 'Browse available notes and open or download the PDF files directly.' }
  ];

  return (
    <div className="py-12 max-w-7xl mx-auto px-6 lg:px-8">
      {/* Title & Description Header */}
      <div className="text-center mb-10">
        <span className="px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100">Step-by-Step Study Notes</span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3 mb-2">Interactive Study Notes Portal</h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-sm">Follow the step-by-step navigation below to easily find and open PDF notes for any board, class, or subject.</p>
      </div>

      {/* Breadcrumb Step Progress Indicator */}
      <div className="mb-8 p-6 bg-slate-900 text-white rounded-3xl shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Step {currentStep} of 4</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-bold text-slate-400">{stepNotes.length} Notes Available</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight mt-0.5">{stepDescriptions[currentStep - 1]?.title}</h2>
            <p className="text-xs text-slate-400 mt-1">{stepDescriptions[currentStep - 1]?.desc}</p>
          </div>
          {(selectedBoard || selectedClass || selectedSubject || selectedType || currentStep > 1) && (
            <button 
              onClick={resetStepWizard}
              className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0"
            >
              Reset to Start
            </button>
          )}
        </div>

        {/* Step Numbers Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { step: 1, label: 'Syllabus / Board', val: selectedBoard || 'All Boards' },
            { step: 2, label: 'Class / Grade', val: selectedClass || 'All Classes' },
            { step: 3, label: 'Subject / Type', val: selectedSubject || selectedType || 'All Subjects' },
            { step: 4, label: 'PDF Notes File', val: `${stepNotes.length} Files` }
          ].map(s => (
            <button
              key={s.step}
              onClick={() => setCurrentStep(s.step)}
              className={`p-3 rounded-2xl border text-left transition-all ${currentStep === s.step ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg' : currentStep > s.step ? 'bg-slate-800 text-emerald-400 border-slate-700' : 'bg-slate-800/50 text-slate-400 border-slate-800 opacity-60'}`}
            >
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-1">
                <span>Step {s.step}</span>
                {currentStep > s.step && <span className="text-emerald-400">✓ Done</span>}
              </div>
              <p className="text-xs font-bold truncate">{s.label}</p>
              <p className="text-[11px] opacity-80 truncate mt-0.5">{s.val}</p>
            </button>
          ))}
        </div>
      </div>

      {/* PAGE 1: Select Board / Syllabus */}
      {currentStep === 1 && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-8">
          <h3 className="text-lg font-black text-slate-900 mb-2">Step 1: Select Educational Board / Syllabus</h3>
          <p className="text-sm text-slate-500 mb-6">Choose a board to filter classes and subjects uploaded for that syllabus.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <button
              onClick={() => { setSelectedBoard(''); setCurrentStep(2); }}
              className={`p-5 rounded-2xl border text-left transition-all ${!selectedBoard ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow'}`}
            >
              <GraduationCap className="text-indigo-600 mb-3" size={28} />
              <h4 className="font-bold text-slate-900 text-base">All Boards</h4>
              <p className="text-xs text-slate-500 mt-1">Show study notes from all educational boards.</p>
            </button>

            {availableBoards.map(board => (
              <button
                key={board.id}
                onClick={() => { setSelectedBoard(board.id); setCurrentStep(2); }}
                className={`p-5 rounded-2xl border text-left transition-all ${selectedBoard === board.id ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow'}`}
              >
                <GraduationCap className="text-indigo-600 mb-3" size={28} />
                <h4 className="font-bold text-slate-900 text-base">{board.name}</h4>
                <p className="text-xs text-slate-500 mt-1">View classes and subject notes for {board.name}.</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PAGE 2: Select Class */}
      {currentStep === 2 && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Step 2: Select Academic Class</h3>
              <p className="text-sm text-slate-500">Board selected: <span className="font-bold text-indigo-600">{selectedBoard || 'All Boards'}</span></p>
            </div>
            <button onClick={() => setCurrentStep(1)} className="text-xs font-bold text-slate-500 hover:text-slate-800 underline">← Change Board</button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            <button
              onClick={() => { setSelectedClass(''); setCurrentStep(3); }}
              className={`p-5 rounded-2xl border text-left transition-all ${!selectedClass ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow'}`}
            >
              <Layers className="text-indigo-600 mb-3" size={28} />
              <h4 className="font-bold text-slate-900 text-base">All Classes</h4>
              <p className="text-xs text-slate-500 mt-1">Include notes across all class levels.</p>
            </button>

            {stepClasses.map(cls => (
              <button
                key={cls.id}
                onClick={() => { setSelectedClass(cls.name); setCurrentStep(3); }}
                className={`p-5 rounded-2xl border text-left transition-all ${selectedClass === cls.name ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300 hover:shadow'}`}
              >
                <Layers className="text-indigo-600 mb-3" size={28} />
                <h4 className="font-bold text-slate-900 text-base">{cls.name}</h4>
                <p className="text-xs text-slate-500 mt-1">Browse notes available for {cls.name}.</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* PAGE 3: Select Subject / Note Type */}
      {currentStep === 3 && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-8 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-black text-slate-900">Step 3: Select Subject or Resource Type</h3>
              <p className="text-sm text-slate-500">Board: <span className="font-bold text-indigo-600">{selectedBoard || 'All'}</span> • Class: <span className="font-bold text-indigo-600">{selectedClass || 'All'}</span></p>
            </div>
            <button onClick={() => setCurrentStep(2)} className="text-xs font-bold text-slate-500 hover:text-slate-800 underline">← Change Class</button>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Filter By Subject</h4>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { setSelectedSubject(''); setCurrentStep(4); }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border ${!selectedSubject ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
              >
                All Subjects
              </button>
              {availableSubjects.map(sub => (
                <button
                  key={sub}
                  onClick={() => { setSelectedSubject(sub); setCurrentStep(4); }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border ${selectedSubject === sub ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-3">Filter By Resource Type</h4>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => { setSelectedType(''); setCurrentStep(4); }}
                className={`px-4 py-2.5 rounded-xl text-xs font-bold border ${!selectedType ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
              >
                All Types
              </button>
              {(availableNoteTypes.length > 0 ? availableNoteTypes : NOTE_TYPES).map(type => (
                <button
                  key={type}
                  onClick={() => { setSelectedType(type); setCurrentStep(4); }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold border ${selectedType === type ? 'bg-amber-500 text-slate-950 border-amber-400' : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'}`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* PAGE 4 / Main View: Notes Cards + Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search notes by title, subject or author..." 
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
           <span className="text-sm font-bold text-slate-500 whitespace-nowrap">Show per page:</span>
           <select 
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
           >
              <option value={20}>20 Cards</option>
              <option value={40}>40 Cards</option>
              <option value={50}>50 Cards</option>
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Notes Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentNotes.map(note => (
              <div key={note.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-xl transition-all group cursor-pointer flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      <FileText size={24} />
                    </div>
                    <span className="px-3 py-1 bg-slate-100 text-slate-700 text-[10px] font-black uppercase tracking-widest rounded-full">{note.grade || 'General'}</span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mb-1 line-clamp-2">{note.title}</h3>
                  <p className="text-xs text-slate-500 mb-4 leading-relaxed">
                    <span className="font-bold text-slate-700">{note.subject}</span>
                    {note.noteType ? ` • ${note.noteType}` : ''}
                    {note.board ? ` • ${note.board}` : ''}
                    {note.book ? ` • ${note.book}` : ''}
                    {' • '}By {note.author || 'ExamForge'}
                  </p>
                </div>
                <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-black uppercase tracking-wider border border-rose-100">
                    <FileText size={14} /> PDF File
                  </span>
                  <a 
                    href={note.fileUrl} 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-2 text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
                  >
                    <Download size={14} /> Open PDF File
                  </a>
                </div>
              </div>
            ))}
            {currentNotes.length === 0 && (
                <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                   <FileText size={48} className="mx-auto mb-4 opacity-20"/>
                   <p className="font-bold text-slate-600">No notes found for your selected criteria.</p>
                   <button onClick={resetStepWizard} className="mt-4 text-xs font-bold text-indigo-600 hover:underline">Reset step wizard filters</button>
                </div>
            )}
          </div>
        </div>

        {/* Right Side Box: Recent 5 Added Notes */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl sticky top-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-base font-black text-white uppercase tracking-wider">Recently Added Notes</h3>
            </div>

            <div className="space-y-4">
              {recentFiveNotes.map((recent, idx) => (
                <div key={recent.id || idx} className="p-3.5 bg-slate-800/60 hover:bg-slate-800 rounded-2xl border border-slate-700/60 transition-all group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {recent.grade || 'General'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{recent.subject}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">{recent.title}</h4>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/40">
                    <span className="text-[10px] text-slate-400">{recent.board || 'PTB'}</span>
                    <a 
                      href={recent.fileUrl} 
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase"
                    >
                      <Download size={12} /> Open PDF
                    </a>
                  </div>
                </div>
              ))}

              {recentFiveNotes.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-6">No recent notes found.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Controls */}
      {stepNotes.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-12 gap-4 border-t border-slate-200 pt-8">
           <div className="text-sm text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{indexOfFirstItem + 1}</span> to <span className="font-bold text-slate-900">{Math.min(indexOfLastItem, stepNotes.length)}</span> of <span className="font-bold text-slate-900">{stepNotes.length}</span> notes
           </div>
           
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                 <ChevronLeft size={20} />
              </button>
              
              <div className="px-4 py-2 bg-slate-50 rounded-lg text-sm font-bold text-slate-700">
                 Page {currentPage} of {totalPages || 1}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                 <ChevronRight size={20} />
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
