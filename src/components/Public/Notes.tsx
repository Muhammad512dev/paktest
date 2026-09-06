
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

  // Colors for class/subject pill buttons like screenshot
  const pillColors = [
    'from-sky-400 to-blue-500 text-white shadow-sky-200',
    'from-emerald-400 to-green-600 text-white shadow-emerald-200',
    'from-cyan-400 to-blue-600 text-white shadow-cyan-200',
    'from-amber-300 to-orange-400 text-slate-900 shadow-amber-200',
    'from-amber-400 to-yellow-500 text-slate-900 shadow-yellow-200',
    'from-teal-400 to-cyan-600 text-white shadow-teal-200',
    'from-fuchsia-400 to-pink-500 text-white shadow-fuchsia-200',
    'from-emerald-500 to-teal-600 text-white shadow-emerald-200'
  ];

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Title Banner matching screenshot */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 inline-block relative">
          <span className="text-amber-500 border-b-4 border-amber-500 pb-1">Study</span> Notes
        </h1>
        {/* Dynamic Breadcrumbs matching screenshot: 10TH > COMPUTER */}
        {(selectedBoard || selectedClass || selectedSubject) && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-black uppercase text-slate-700 tracking-wider">
            {selectedBoard && <span>🏛️ {selectedBoard}</span>}
            {selectedBoard && selectedClass && <span>›</span>}
            {selectedClass && <span>🎓 {selectedClass}</span>}
            {selectedClass && selectedSubject && <span>›</span>}
            {selectedSubject && <span>📖 {selectedSubject}</span>}
            <button onClick={resetStepWizard} className="ml-3 text-xs text-rose-500 hover:underline normal-case font-bold">(Reset)</button>
          </div>
        )}
      </div>

      {/* STEP 1: Select Syllabus / Board */}
      {currentStep === 1 && (
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center mb-6">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Step 1</span>
            <h2 className="text-xl font-bold text-slate-800 mt-2">Select Educational Board / Syllabus</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            <button
              onClick={() => { setSelectedBoard(''); setCurrentStep(2); }}
              className="p-6 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-black text-lg shadow-lg shadow-sky-200 hover:scale-105 transition-all text-center"
            >
              ALL BOARDS
            </button>
            {availableBoards.map((board, idx) => (
              <button
                key={board.id}
                onClick={() => { setSelectedBoard(board.id); setCurrentStep(2); }}
                className={`p-6 rounded-2xl bg-gradient-to-r ${pillColors[idx % pillColors.length]} font-black text-lg shadow-lg hover:scale-105 transition-all text-center`}
              >
                {board.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Select Class / Level (Matching Screenshot 1 Pill Buttons: 9TH, 10TH, 11TH, 12TH) */}
      {currentStep === 2 && (
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center mb-6">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Step 2</span>
            <h2 className="text-xl font-bold text-slate-800 mt-2">Select Class / Level</h2>
            <button onClick={() => setCurrentStep(1)} className="text-xs text-slate-500 underline hover:text-slate-800 mt-1">← Change Board ({selectedBoard || 'All'})</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            {stepClasses.map((cls, idx) => (
              <button
                key={cls.id}
                onClick={() => { setSelectedClass(cls.name); setCurrentStep(3); }}
                className={`p-6 rounded-2xl bg-gradient-to-r ${pillColors[idx % pillColors.length]} font-black text-xl tracking-wider shadow-lg hover:scale-105 transition-all text-center uppercase`}
              >
                {cls.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: Select Subject (Matching Screenshot 2 Grid Pill Buttons) */}
      {currentStep === 3 && (
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center mb-6">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Step 3</span>
            <h2 className="text-xl font-bold text-slate-800 mt-2">Select Subject</h2>
            <button onClick={() => setCurrentStep(2)} className="text-xs text-slate-500 underline hover:text-slate-800 mt-1">← Change Class ({selectedClass})</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {availableSubjects.map((sub, idx) => (
              <button
                key={sub}
                onClick={() => { setSelectedSubject(sub); setCurrentStep(4); }}
                className={`p-5 rounded-2xl bg-gradient-to-r ${pillColors[idx % pillColors.length]} font-black text-base tracking-wide shadow-md hover:scale-105 transition-all text-center uppercase`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4 / PDF Notes Cards View (Matching Screenshot 3 Grid PDF Cards) */}
      {(currentStep === 4 || (selectedBoard && selectedClass && selectedSubject)) && (
        <div className="space-y-8 mt-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Search notes by title, subject or author..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button onClick={resetStepWizard} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
              Change Selection
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {stepNotes.map(note => (
              <a
                key={note.id}
                href={note.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 shadow-sm hover:shadow-xl transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
              >
                {/* Red PDF Icon matching screenshot 3 */}
                <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <FileText size={22} />
                </div>
                <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-2">{note.title || `${note.subject} Notes`}</h4>
                <p className="text-[11px] text-slate-400 font-semibold uppercase mt-1 tracking-wider">{note.grade || selectedClass} • {note.subject}</p>
              </a>
            ))}
          </div>

          {stepNotes.length === 0 && (
            <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
              <FileText size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-slate-600">No notes uploaded yet for your selection.</p>
              <button onClick={resetStepWizard} className="mt-4 text-xs font-bold text-indigo-600 hover:underline">Reset filters and start over</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Notes;
