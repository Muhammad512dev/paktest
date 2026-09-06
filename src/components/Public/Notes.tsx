
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
      if (n.board && n.board.trim()) {
        const trimmed = n.board.trim();
        if (!list.some(b => b.name.toLowerCase() === trimmed.toLowerCase())) {
          list.push({ id: trimmed, name: trimmed });
        }
      }
    });
    return list;
  }, [notes]);

  // Dynamic classes strictly extracted from actual existing notes input fields
  const availableClasses = useMemo(() => {
    const list: { id: string; name: string; board?: string }[] = [];
    notes.forEach(n => {
      if (n.grade && n.grade.trim()) {
        const trimmedGrade = n.grade.trim();
        const trimmedBoard = (n.board || '').trim();
        if (!list.some(c => c.name.toLowerCase() === trimmedGrade.toLowerCase() && (c.board || '').toLowerCase() === trimmedBoard.toLowerCase())) {
          list.push({ id: trimmedGrade, name: trimmedGrade, board: trimmedBoard });
        }
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

  // Extract available subjects from notes for the selected board & class
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    notes.forEach(n => {
      if (n.subject && n.subject.trim()) {
        if (selectedBoard && n.board && n.board.trim().toLowerCase() !== selectedBoard.trim().toLowerCase()) return;
        if (selectedClass && n.grade && n.grade.trim().toLowerCase() !== selectedClass.trim().toLowerCase()) return;
        set.add(n.subject.trim());
      }
    });
    return Array.from(set);
  }, [notes, selectedBoard, selectedClass]);

  const stepClasses = useMemo(() => {
    const set = new Set<string>();
    notes.forEach(n => {
      if (n.grade && n.grade.trim()) {
        if (selectedBoard && n.board && n.board.trim().toLowerCase() !== selectedBoard.trim().toLowerCase()) return;
        set.add(n.grade.trim());
      }
    });
    return Array.from(set).map(g => ({ id: g, name: g }));
  }, [notes, selectedBoard]);

  const stepNotes = useMemo(() => {
    return notes.filter(n => {
      if (selectedBoard && n.board && n.board.trim().toLowerCase() !== selectedBoard.trim().toLowerCase()) return false;
      if (selectedClass && n.grade && n.grade.trim().toLowerCase() !== selectedClass.trim().toLowerCase()) return false;
      if (selectedSubject && n.subject && n.subject.trim().toLowerCase() !== selectedSubject.trim().toLowerCase()) return false;
      if (selectedType && n.noteType && n.noteType.trim().toLowerCase() !== selectedType.trim().toLowerCase()) return false;
      if (filters.resource && n.resource) {
        const items = n.resource.split(',').map((s: string) => s.trim().toLowerCase());
        if (!items.includes(filters.resource.toLowerCase())) return false;
      }
      return true;
    });
  }, [notes, selectedBoard, selectedClass, selectedSubject, selectedType, filters.resource]);

  // Dynamic URL Sync effect for step wizard navigation and note view
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const board = params.get('board') || '';
      const cls = params.get('class') || '';
      const subject = params.get('subject') || '';
      const step = parseInt(params.get('step') || '1', 10);
      const noteId = params.get('noteId');

      setSelectedBoard(board);
      setSelectedClass(cls);
      setSelectedSubject(subject);
      setCurrentStep(step);

      if (noteId && notes.length > 0) {
        const found = notes.find(n => String(n.id) === String(noteId));
        if (found) setSelectedNoteModal(found);
      } else if (!noteId) {
        setSelectedNoteModal(null);
      }
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [notes]);

  const updateRouteUrl = (newBoard: string, newClass: string, newSubject: string, newStep: number, noteId?: string) => {
    setSelectedBoard(newBoard);
    setSelectedClass(newClass);
    setSelectedSubject(newSubject);
    setCurrentStep(newStep);

    const params = new URLSearchParams();
    if (newBoard) params.set('board', newBoard);
    if (newClass) params.set('class', newClass);
    if (newSubject) params.set('subject', newSubject);
    if (newStep > 1) params.set('step', newStep.toString());
    if (noteId) params.set('noteId', noteId);

    const queryString = params.toString();
    const newPath = queryString ? `/notes?${queryString}` : '/notes';
    window.history.pushState(null, '', newPath);
  };

  const handleOpenNote = (note: any, openInNewTab = false) => {
    if (openInNewTab) {
      const params = new URLSearchParams();
      if (note.board) params.set('board', note.board);
      if (note.grade) params.set('class', note.grade);
      if (note.subject) params.set('subject', note.subject);
      params.set('step', '4');
      params.set('noteId', note.id);
      window.open(`/notes?${params.toString()}`, '_blank');
    } else {
      setSelectedNoteModal(note);
      updateRouteUrl(selectedBoard, selectedClass, selectedSubject, currentStep, note.id);
    }
  };

  const closeNoteModal = () => {
    setSelectedNoteModal(null);
    updateRouteUrl(selectedBoard, selectedClass, selectedSubject, currentStep);
  };

  const resetStepWizard = () => {
    setSelectedBoard('');
    setSelectedClass('');
    setSelectedSubject('');
    setSelectedType('');
    setFilters({ board: '', grade: '', noteType: '', resource: '' });
    setCurrentStep(1);
    setSelectedNoteModal(null);
    window.history.pushState(null, '', '/notes');
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

  // Selected Note Modal State
  const [selectedNoteModal, setSelectedNoteModal] = useState<any | null>(null);

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Dynamic Header & Breadcrumbs matching screenshot 2 */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span className="cursor-pointer hover:text-indigo-600" onClick={resetStepWizard}>Notes & Key Books</span>
          {selectedBoard && <span>/</span>}
          {selectedBoard && <span className="cursor-pointer hover:text-indigo-600" onClick={() => updateRouteUrl(selectedBoard, '', '', 1)}>{selectedBoard}</span>}
          {selectedClass && <span>/</span>}
          {selectedClass && <span className="cursor-pointer hover:text-indigo-600" onClick={() => updateRouteUrl(selectedBoard, selectedClass, '', 2)}>{selectedClass} Notes</span>}
          {selectedSubject && <span>/</span>}
          {selectedSubject && <span className="text-slate-800 font-bold">{selectedSubject}</span>}
        </div>

        {selectedNoteModal ? (
          <div>
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              {selectedNoteModal.grade || selectedClass || 'CLASS'} NOTES
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 leading-tight">
              {selectedNoteModal.title || `${selectedNoteModal.subject} Notes (${selectedNoteModal.grade || 'General'})`}
            </h1>
            {selectedNoteModal.author && (
              <p className="text-xs text-slate-500 font-medium mt-1">Author / Source: {selectedNoteModal.author}</p>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 inline-block relative">
              <span className="text-amber-500 border-b-4 border-amber-500 pb-1">Study</span> Notes
            </h1>
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
        )}
      </div>

      {/* DEDICATED ACTIVE NOTE PAGE VIEW (Matching screenshot layout) */}
      {selectedNoteModal ? (
        <div className="space-y-8">
          {/* TOP SECTION: Detailed Resource Description Box */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Resource Details & Overview</h3>
              <button 
                onClick={closeNoteModal}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                ← Back to Note List
              </button>
            </div>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line font-medium">
              {selectedNoteModal.description || selectedNoteModal.content || `Complete study notes and reference material for ${selectedNoteModal.subject || 'this course'} (${selectedNoteModal.grade || 'General'}). Curated for exam preparation according to the ${selectedNoteModal.board || 'standard educational board'} syllabus.`}
            </p>
          </div>

          {/* CENTER SECTION: Embedded PDF Frame with Arrow to Drive */}
          {selectedNoteModal.fileUrl ? (
            <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-rose-500/20 text-rose-400 rounded-xl flex items-center justify-center font-bold">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{selectedNoteModal.title}</h4>
                    <p className="text-[11px] text-slate-400">PDF Document • {selectedNoteModal.resource || selectedNoteModal.noteType || 'Study Note'}</p>
                  </div>
                </div>
                
                {/* Arrow Launch Button to Google Drive / Link */}
                <a
                  href={selectedNoteModal.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:scale-105"
                >
                  <span>Open PDF Drive Link</span>
                  <span className="text-base">➔</span>
                </a>
              </div>

              {/* Large Center PDF Frame */}
              <div className="w-full h-[650px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
                <iframe
                  src={selectedNoteModal.fileUrl?.includes('drive.google.com') ? selectedNoteModal.fileUrl.replace('/view', '/preview') : selectedNoteModal.fileUrl}
                  className="w-full h-full border-0"
                  title="PDF Document Viewer"
                />
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-amber-50 border border-amber-200 text-amber-800 rounded-3xl font-bold">
              PDF preview link unavailable for this note. Please refer to the text description above.
            </div>
          )}

          {/* BOTTOM SECTION: Discover More & Other Filtered Notes Recommendations */}
          <div className="pt-8 border-t border-slate-200 space-y-6">
            <div className="bg-sky-50/80 p-5 rounded-2xl border border-sky-100 flex justify-between items-center">
              <div>
                <h4 className="font-bold text-sky-900 text-base">Discover More Notes & Textbooks</h4>
                <p className="text-xs text-sky-700 mt-0.5">Explore related study materials for {selectedClass || 'your class'} and {selectedSubject || 'subjects'}</p>
              </div>
              <button 
                onClick={closeNoteModal}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl transition-all shadow-md"
              >
                View All {selectedClass} Notes
              </button>
            </div>

            <h3 className="text-lg font-black text-slate-800">Other Related Notes</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
              {stepNotes.filter(n => n.id !== selectedNoteModal.id).slice(0, 4).map(note => (
                <div
                  key={note.id}
                  onClick={() => handleOpenNote(note, false)}
                  className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 shadow-sm hover:shadow-xl transition-all flex flex-col items-center justify-center text-center group cursor-pointer relative"
                >
                  <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                    <FileText size={22} />
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-2">{note.title || `${note.subject} Notes`}</h4>
                  <p className="text-[11px] text-slate-400 font-semibold uppercase mt-1 tracking-wider">{note.grade || selectedClass} • {note.subject}</p>
                  <div className="mt-3 flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenNote(note, false); }}
                      className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-600 hover:underline"
                    >
                      <span>View Note</span>
                    </button>
                    <span className="text-slate-300">•</span>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleOpenNote(note, true); }}
                      className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 hover:underline"
                    >
                      <span>New Tab</span>
                      <span>↗</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* WIZARD SELECTION STEPS WHEN NO SINGLE ACTIVE NOTE IS FOCUSED */
        <>
          {/* STEP 1: Select Syllabus / Board */}
          {currentStep === 1 && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="text-center mb-6">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Step 1</span>
                <h2 className="text-xl font-bold text-slate-800 mt-2">Select Educational Board / Syllabus</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                <button
                  onClick={() => updateRouteUrl('', '', '', 2)}
                  className="p-6 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-black text-lg shadow-lg shadow-sky-200 hover:scale-105 transition-all text-center"
                >
                  ALL BOARDS
                </button>
                {availableBoards.map((board, idx) => (
                  <button
                    key={board.id}
                    onClick={() => updateRouteUrl(board.id, '', '', 2)}
                    className={`p-6 rounded-2xl bg-gradient-to-r ${pillColors[idx % pillColors.length]} font-black text-lg shadow-lg hover:scale-105 transition-all text-center`}
                  >
                    {board.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Select Class / Level */}
          {currentStep === 2 && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="text-center mb-6">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Step 2</span>
                <h2 className="text-xl font-bold text-slate-800 mt-2">Select Class / Level</h2>
                <button onClick={() => updateRouteUrl(selectedBoard, '', '', 1)} className="text-xs text-slate-500 underline hover:text-slate-800 mt-1">← Change Board ({selectedBoard || 'All'})</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                {stepClasses.map((cls, idx) => (
                  <button
                    key={cls.id}
                    onClick={() => updateRouteUrl(selectedBoard, cls.name, '', 3)}
                    className={`p-6 rounded-2xl bg-gradient-to-r ${pillColors[idx % pillColors.length]} font-black text-xl tracking-wider shadow-lg hover:scale-105 transition-all text-center uppercase`}
                  >
                    {cls.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: Select Subject */}
          {currentStep === 3 && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="text-center mb-6">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Step 3</span>
                <h2 className="text-xl font-bold text-slate-800 mt-2">Select Subject</h2>
                <button onClick={() => updateRouteUrl(selectedBoard, selectedClass, '', 2)} className="text-xs text-slate-500 underline hover:text-slate-800 mt-1">← Change Class ({selectedClass})</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {availableSubjects.map((sub, idx) => (
                  <button
                    key={sub}
                    onClick={() => updateRouteUrl(selectedBoard, selectedClass, sub, 4)}
                    className={`p-5 rounded-2xl bg-gradient-to-r ${pillColors[idx % pillColors.length]} font-black text-base tracking-wide shadow-md hover:scale-105 transition-all text-center uppercase`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4 / PDF Notes Cards View */}
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
                  <div
                    key={note.id}
                    onClick={() => handleOpenNote(note, false)}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 shadow-sm hover:shadow-xl transition-all flex flex-col items-center justify-center text-center group cursor-pointer relative"
                  >
                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <FileText size={22} />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-2">{note.title || `${note.subject} Notes`}</h4>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase mt-1 tracking-wider">{note.grade || selectedClass} • {note.subject}</p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenNote(note, false); }}
                        className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-600 hover:underline"
                      >
                        <span>Details & Preview</span>
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenNote(note, true); }}
                        className="inline-flex items-center gap-1 text-[11px] font-black text-emerald-600 hover:underline"
                        title="Open in new browser tab with direct URL"
                      >
                        <span>New Tab</span>
                        <span>↗</span>
                      </button>
                    </div>
                  </div>
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
        </>
      )}
    </div>
  );
};

export default Notes;



