import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Search, FileText, Download, ChevronLeft, ChevronRight, 
  BookOpen, Sparkles, CheckSquare, ShieldCheck, Printer, ExternalLink,
  Layers, Filter, ArrowDownCircle, CheckCircle2, Loader2
} from 'lucide-react';
import { getNotes, getPublicCurriculum } from '../../services/dataService';
import { Syllabus, ClassLevel } from '../../types';

const Notes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [curriculum, setCurriculum] = useState<{ syllabuses: Syllabus[]; classes: ClassLevel[] }>({
    syllabuses: [],
    classes: []
  });
  
  // Scope Filter: 'ALL' | 'CHAPTER_WISE' | 'FULL_BOOK' | 'PAST_PAPERS'
  const [scopeFilter, setScopeFilter] = useState<'ALL' | 'CHAPTER_WISE' | 'FULL_BOOK' | 'PAST_PAPERS'>('ALL');

  // Chapter / Unit Filter: 'ALL' | unit string (e.g. '1', '2', '10', etc.)
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');

  // Note Type Sub-Filter: 'ALL' | 'Solved MCQs' | 'Short Questions' | 'Long Questions' | 'Solved Numericals' | 'Full Book Complete'
  const [selectedNoteType, setSelectedNoteType] = useState<string>('ALL');

  // Selected Note Detail View State
  const [selectedNoteModal, setSelectedNoteModal] = useState<any | null>(null);

  // View Mode: 'INFINITE' (Scroll to load more) vs 'PAGINATED' (Page 1, 2, 3...)
  const [viewMode, setViewMode] = useState<'INFINITE' | 'PAGINATED'>('INFINITE');

  // Infinite Scroll State
  const [visibleCount, setVisibleCount] = useState<number>(20);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Traditional Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState<string>('20');
  const [userCustomLimit, setUserCustomLimit] = useState<boolean>(false);

  // Step Navigation state: 1 = Syllabus/Board, 2 = Class, 3 = Subject, 4 = Notes/PDF View
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');

  // Helper functions to normalize strings for robust comparison
  const normalizeNum = (str: string) => String(str || '').replace(/[^0-9]/g, '');
  const normalizeText = (str: string) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // Initial Load: Fetch Curriculum and all Study Notes from database
  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [currData, notesData] = await Promise.all([
          getPublicCurriculum().catch(() => ({ syllabuses: [], classes: [] })),
          getNotes().catch(() => [])
        ]);
        if (isMounted) {
          setCurriculum({ syllabuses: currData?.syllabuses || [], classes: currData?.classes || [] });
          setNotes(Array.isArray(notesData) ? notesData : []);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch notes. Please try again.');
          setNotes([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          setIsNavigating(false);
        }
      }
    };
    loadAll();
    return () => { isMounted = false; };
  }, []);

  // Available Boards from uploaded notes and curriculum
  const availableBoards = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    
    // From uploaded notes
    notes.forEach(n => {
      if (n.board && n.board.trim()) {
        const trimmed = n.board.trim();
        if (!list.some(b => b.name.toLowerCase() === trimmed.toLowerCase())) {
          list.push({ id: trimmed, name: trimmed });
        }
      }
    });

    // From curriculum setup
    if (curriculum.syllabuses.length > 0) {
      curriculum.syllabuses.forEach(s => {
        if (s.name && !list.some(b => b.name.trim().toLowerCase() === s.name.trim().toLowerCase())) {
          list.push({ id: s.name.trim(), name: s.name.trim() });
        }
      });
    }

    if (list.length === 0) {
      list.push({ id: 'PCTB (Punjab Curriculum & Textbook Board)', name: 'PCTB (Punjab Board)' });
      list.push({ id: 'Federal Board (FBISE)', name: 'Federal Board (FBISE)' });
      list.push({ id: 'KPK Board', name: 'KPK Board' });
      list.push({ id: 'Sindh Board', name: 'Sindh Board' });
    }
    return list;
  }, [curriculum.syllabuses, notes]);

  // Available Classes filtered by selected board or all available
  const stepClasses = useMemo(() => {
    const classSet = new Set<string>();

    notes.forEach(n => {
      if (n.grade && String(n.grade).trim()) {
        if (selectedBoard && n.board) {
          const nb = normalizeText(n.board);
          const sb = normalizeText(selectedBoard);
          if (nb && sb && !nb.includes(sb) && !sb.includes(nb)) return;
        }
        let g = String(n.grade).trim();
        if (/^\d+$/.test(g)) g = `Class ${g}`;
        classSet.add(g);
      }
    });

    if (curriculum.classes.length > 0) {
      curriculum.classes.forEach(c => {
        if (c.name && c.name.trim()) classSet.add(c.name.trim());
      });
    }

    // Default standard classes if empty
    if (classSet.size === 0) {
      ['Class 9', 'Class 10', 'Class 11', 'Class 12'].forEach(c => classSet.add(c));
    }

    return Array.from(classSet).sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    }).map(g => ({ id: g, name: g }));
  }, [notes, curriculum.classes, selectedBoard]);

  // Available Subjects for selected Class and Board
  const availableSubjects: string[] = useMemo(() => {
    const subSet = new Set<string>();

    notes.forEach(n => {
      if (n.subject && String(n.subject).trim()) {
        if (selectedClass && n.grade) {
          const ng = normalizeNum(n.grade);
          const sg = normalizeNum(selectedClass);
          if (ng && sg && ng !== sg) return;
        }
        if (selectedBoard && n.board) {
          const nb = normalizeText(n.board);
          const sb = normalizeText(selectedBoard);
          if (nb && sb && !nb.includes(sb) && !sb.includes(nb)) return;
        }
        subSet.add(String(n.subject).trim());
      }
    });

    if (subSet.size === 0) {
      const foundClass: any = (curriculum.classes as any[]).find((c: any) => 
        c.name && (
          c.name.trim().toLowerCase() === selectedClass.trim().toLowerCase() ||
          normalizeNum(c.name) === normalizeNum(selectedClass)
        )
      );

      if (foundClass && Array.isArray(foundClass.subjects) && foundClass.subjects.length > 0) {
        foundClass.subjects.forEach((s: string) => subSet.add(s));
      } else {
        [
          'Mathematics',
          'Physics',
          'Chemistry',
          'Biology',
          'Computer Science',
          'English',
          'Islamiat',
          'Urdu',
          'Pakistan Studies',
          'Tarjuma-tul-Quran'
        ].forEach(s => subSet.add(s));
      }
    }

    return Array.from(subSet).sort();
  }, [notes, curriculum.classes, selectedClass, selectedBoard]);

  // Extract available Chapters / Units dynamically from filtered notes
  const availableUnits = useMemo(() => {
    const unitMap = new Map<string, { unit: string; label: string; count: number }>();
    
    notes.forEach(n => {
      // Filter by class and subject if selected
      if (selectedClass && n.grade) {
        const ng = normalizeNum(n.grade);
        const sg = normalizeNum(selectedClass);
        if (ng && sg && ng !== sg) return;
      }
      if (selectedSubject && n.subject) {
        const ns = normalizeText(n.subject);
        const ss = normalizeText(selectedSubject);
        if (ns && ss && !ns.includes(ss) && !ss.includes(ns)) return;
      }

      let unitNum = '';
      if (n.unit) {
        unitNum = String(n.unit).trim();
      } else if (n.title) {
        const m = n.title.match(/(?:unit|chapter|ch)\s*0?(\d+)/i);
        if (m) unitNum = m[1];
      }

      if (unitNum) {
        const cleanUnit = unitNum.replace(/^0+/, '');
        if (cleanUnit) {
          const current = unitMap.get(cleanUnit) || { unit: cleanUnit, label: `Unit ${cleanUnit}`, count: 0 };
          current.count += 1;
          unitMap.set(cleanUnit, current);
        }
      }
    });

    return Array.from(unitMap.values()).sort((a, b) => {
      const na = parseInt(a.unit, 10);
      const nb = parseInt(b.unit, 10);
      if (!isNaN(na) && !isNaN(nb)) return na - nb;
      return a.unit.localeCompare(b.unit);
    });
  }, [notes, selectedClass, selectedSubject]);

  // Extract available Note Types dynamically
  const availableNoteTypes = useMemo(() => {
    const typeSet = new Map<string, number>();
    notes.forEach(n => {
      const t = n.noteType || 'Chapter Questions';
      typeSet.set(t, (typeSet.get(t) || 0) + 1);
    });
    return Array.from(typeSet.entries()).map(([type, count]) => ({ type, count }));
  }, [notes]);

  // Filtered Notes List
  const stepNotes = useMemo(() => {
    return notes.filter(n => {
      // Board Filter
      if (selectedBoard && n.board) {
        const nb = normalizeText(n.board);
        const sb = normalizeText(selectedBoard);
        if (nb && sb && !nb.includes(sb) && !sb.includes(nb)) return false;
      }

      // Class Filter
      if (selectedClass && n.grade) {
        const ng = normalizeNum(n.grade);
        const sg = normalizeNum(selectedClass);
        if (ng && sg && ng !== sg) return false;
      }

      // Subject Filter
      if (selectedSubject && n.subject) {
        const ns = normalizeText(n.subject);
        const ss = normalizeText(selectedSubject);
        if (ns && ss && !ns.includes(ss) && !ss.includes(ns)) return false;
      }

      // Search Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const t = String(n.title || '').toLowerCase();
        const s = String(n.subject || '').toLowerCase();
        const a = String(n.author || '').toLowerCase();
        const d = String(n.description || '').toLowerCase();
        if (!t.includes(q) && !s.includes(q) && !a.includes(q) && !d.includes(q)) return false;
      }

      // NoteType Filter
      if (selectedNoteType !== 'ALL' && n.noteType && n.noteType.trim().toLowerCase() !== selectedNoteType.trim().toLowerCase()) {
        return false;
      }

      // Chapter / Unit Filter
      if (selectedUnit !== 'ALL') {
        const cleanTargetUnit = selectedUnit.replace(/^0+/, '');
        const noteUnit = (n.unit || '').toString().replace(/^0+/, '');
        const inTitle = n.title && (
          new RegExp(`(?:unit|chapter|ch)\\s*0?${cleanTargetUnit}\\b`, 'i').test(n.title) ||
          new RegExp(`exercise\\s*0?${cleanTargetUnit}\\.`, 'i').test(n.title)
        );
        if (noteUnit !== cleanTargetUnit && !inTitle) return false;
      }
      
      // Scope Filter
      if (scopeFilter === 'CHAPTER_WISE') {
        const isChapter = n.scope === 'CHAPTER_WISE' || n.unit || n.noteType === 'Chapter Questions' || (n.title && /chapter|unit|ch\s*\d|exercise/i.test(n.title));
        if (!isChapter) return false;
      } else if (scopeFilter === 'FULL_BOOK') {
        const isFull = n.scope === 'FULL_BOOK' || n.noteType === 'Full Book Complete' || n.noteType === 'Book Notes' || (n.title && /full\s*book|complete|master/i.test(n.title));
        if (!isFull) return false;
      } else if (scopeFilter === 'PAST_PAPERS') {
        const isPaper = n.noteType === 'Past Paper' || (n.title && /past\s*paper|annual/i.test(n.title));
        if (!isPaper) return false;
      }

      return true;
    });
  }, [notes, selectedBoard, selectedClass, selectedSubject, searchTerm, selectedNoteType, selectedUnit, scopeFilter]);

  // Reset pagination & visible count when filters change
  useEffect(() => {
    setVisibleCount(20);
    setCurrentPage(1);
  }, [searchTerm, selectedBoard, selectedClass, selectedSubject, selectedUnit, selectedNoteType, scopeFilter]);

  // Infinite Scroll Intersection Observer
  const handleLoadMore = useCallback(() => {
    if (visibleCount < stepNotes.length && !isLoadingMore) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + 20, stepNotes.length));
        setIsLoadingMore(false);
      }, 150);
    }
  }, [visibleCount, stepNotes.length, isLoadingMore]);

  useEffect(() => {
    if (viewMode !== 'INFINITE') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < stepNotes.length) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [viewMode, visibleCount, stepNotes.length, handleLoadMore]);

  // Dynamic URL Sync effect
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const board = params.get('board') || '';
      const cls = params.get('class') || '';
      const subject = params.get('subject') || '';
      const unit = params.get('unit') || 'ALL';
      const step = parseInt(params.get('step') || '1', 10);
      const noteId = params.get('noteId');

      setSelectedBoard(board);
      setSelectedClass(cls);
      setSelectedSubject(subject);
      setSelectedUnit(unit);
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

  const updateRouteUrl = (newBoard: string, newClass: string, newSubject: string, newStep: number, noteId?: string, unit = selectedUnit) => {
    setIsNavigating(true);
    setSelectedBoard(newBoard);
    setSelectedClass(newClass);
    setSelectedSubject(newSubject);
    setCurrentStep(newStep);
    if (unit) setSelectedUnit(unit);

    const params = new URLSearchParams();
    if (newBoard) params.set('board', newBoard);
    if (newClass) params.set('class', newClass);
    if (newSubject) params.set('subject', newSubject);
    if (unit && unit !== 'ALL') params.set('unit', unit);
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
      if (note.unit) params.set('unit', note.unit);
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
    setSelectedUnit('ALL');
    setSelectedNoteType('ALL');
    setScopeFilter('ALL');
    setCurrentStep(1);
    setSelectedNoteModal(null);
    setUserCustomLimit(false);
    setVisibleCount(20);
    window.history.pushState(null, '', '/notes');
  };

  const isFiltered = Boolean(selectedBoard || selectedClass || selectedSubject || selectedUnit !== 'ALL' || selectedNoteType !== 'ALL' || scopeFilter !== 'ALL' || searchTerm);

  const totalFilteredCount = stepNotes.length;
  const numericLimit = pageSize === 'all' ? totalFilteredCount : parseInt(pageSize, 10);
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / (numericLimit || 20)));

  // Displayed Notes: Infinite Scroll slice vs Paginated slice
  const displayedNotes = useMemo(() => {
    if (viewMode === 'INFINITE') {
      return stepNotes.slice(0, visibleCount);
    }
    if (pageSize === 'all') return stepNotes;
    const start = (currentPage - 1) * numericLimit;
    return stepNotes.slice(start, start + numericLimit);
  }, [stepNotes, viewMode, visibleCount, pageSize, currentPage, numericLimit]);

  const handlePageSizeChange = (val: string) => {
    setPageSize(val);
    setUserCustomLimit(true);
    setCurrentPage(1);
  };

  // Colors for class/subject pill buttons
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
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header & Breadcrumbs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span className="cursor-pointer hover:text-indigo-600" onClick={resetStepWizard}>Notes & Key Books</span>
          {selectedBoard && <span>/</span>}
          {selectedBoard && <span className="cursor-pointer hover:text-indigo-600" onClick={() => updateRouteUrl(selectedBoard, '', '', 1)}>{selectedBoard}</span>}
          {selectedClass && <span>/</span>}
          {selectedClass && <span className="cursor-pointer hover:text-indigo-600" onClick={() => updateRouteUrl(selectedBoard, selectedClass, '', 2)}>{selectedClass} Notes</span>}
          {selectedSubject && <span>/</span>}
          {selectedSubject && <span className="cursor-pointer hover:text-indigo-600" onClick={() => updateRouteUrl(selectedBoard, selectedClass, selectedSubject, 4, undefined, 'ALL')}>{selectedSubject}</span>}
          {selectedUnit !== 'ALL' && <span>/</span>}
          {selectedUnit !== 'ALL' && <span className="text-slate-800 font-bold">Unit {selectedUnit}</span>}
        </div>

        {selectedNoteModal ? (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                {selectedNoteModal.grade || selectedClass || 'CLASS'} NOTES
              </span>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1">
                <Sparkles size={13} /> SNC 2025–2026 Syllabus Aligned
              </span>
              <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                {selectedNoteModal.scope === 'FULL_BOOK' || selectedNoteModal.noteType === 'Full Book Complete' ? '📚 Full Book Master Notes' : '📖 Chapter-Wise Question Solutions'}
              </span>
              {selectedNoteModal.unit && (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  Unit {selectedNoteModal.unit}
                </span>
              )}
            </div>
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
              <span className="text-amber-500 border-b-4 border-amber-500 pb-1">Study</span> Notes & Chapter Solutions
            </h1>
            <p className="text-slate-500 text-sm mt-2 max-w-2xl mx-auto">
              Comprehensive chapter-wise solved questions, MCQs with answer keys, numericals, and full book complete notes for matric & intermediate exams.
            </p>
            {(selectedBoard || selectedClass || selectedSubject) && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm font-black uppercase text-slate-700 tracking-wider">
                {selectedBoard && <span className="bg-slate-100 px-2.5 py-1 rounded-lg">🏛️ {selectedBoard}</span>}
                {selectedBoard && selectedClass && <span>›</span>}
                {selectedClass && <span className="bg-slate-100 px-2.5 py-1 rounded-lg">🎓 {selectedClass}</span>}
                {selectedClass && selectedSubject && <span>›</span>}
                {selectedSubject && <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-lg">📖 {selectedSubject}</span>}
                {selectedUnit !== 'ALL' && <span>›</span>}
                {selectedUnit !== 'ALL' && <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg">📑 Unit {selectedUnit}</span>}
                <button onClick={resetStepWizard} className="ml-3 text-xs text-rose-500 hover:underline normal-case font-bold">(Reset All)</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ACTIVE NOTE DETAIL VIEW */}
      {selectedNoteModal ? (
        <div className="space-y-8">
          <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <BookOpen className="text-indigo-600" size={18} />
                  Comprehensive Study Guide & Syllabus Overview
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">Aligned with latest PCTB, Federal FBISE, and National Curriculum standards</p>
              </div>
              <button 
                onClick={closeNoteModal}
                className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                ← Back to Note List
              </button>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-indigo-50/60 rounded-2xl border border-indigo-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  <CheckSquare size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-indigo-950 uppercase">Solved MCQs</h4>
                  <p className="text-[11px] text-indigo-800/80 mt-0.5">Chapter-wise textbook & conceptual MCQs with correct answers.</p>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  <FileText size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-950 uppercase">Short & Long Q&A</h4>
                  <p className="text-[11px] text-emerald-800/80 mt-0.5">Precise pointwise answers for maximum exam scoring.</p>
                </div>
              </div>

              <div className="p-4 bg-sky-50/60 rounded-2xl border border-sky-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-sky-950 uppercase">Exercise Solutions</h4>
                  <p className="text-[11px] text-sky-800/80 mt-0.5">Complete textbook exercise questions and solved numericals.</p>
                </div>
              </div>

              <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100 flex items-start gap-3">
                <div className="w-8 h-8 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                  <ShieldCheck size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950 uppercase">Board Compatibility</h4>
                  <p className="text-[11px] text-amber-800/80 mt-0.5">Valid for all Punjab, Federal, Sindh, and KPK BISE Boards.</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="prose prose-slate max-w-none text-slate-700 text-sm leading-relaxed whitespace-pre-line bg-slate-50 p-6 rounded-2xl border border-slate-200">
              {selectedNoteModal.description || selectedNoteModal.content || `
### Detailed Course Overview:
These study notes for **${selectedNoteModal.subject || 'this subject'} (Class ${selectedNoteModal.grade || selectedClass || '9/10/11/12'})** provide a complete revision and practice pack tailored specifically to help students excel in their annual board examinations.
              `}
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
              <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
                <span className="flex items-center gap-1"><ShieldCheck size={14} className="text-emerald-600" /> Verified Content</span>
                <span>•</span>
                <span>PDF Format</span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  <Printer size={15} />
                  <span>Print Note</span>
                </button>
                {selectedNoteModal.fileUrl && (
                  <a
                    href={selectedNoteModal.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md flex items-center gap-2"
                  >
                    <Download size={15} />
                    <span>Download PDF / Drive</span>
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* PDF Frame */}
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
                
                <a
                  href={selectedNoteModal.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:scale-105"
                >
                  <span>Open Full PDF</span>
                  <ExternalLink size={15} />
                </a>
              </div>

              <div className="w-full h-[680px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
                <iframe
                  src={selectedNoteModal.fileUrl?.includes('drive.google.com') ? selectedNoteModal.fileUrl.replace('/view', '/preview') : selectedNoteModal.fileUrl}
                  className="w-full h-full border-0"
                  title="PDF Document Viewer"
                />
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-amber-50 border border-amber-200 text-amber-800 rounded-3xl font-bold">
              PDF preview link unavailable for this note.
            </div>
          )}
        </div>
      ) : (
        /* CASCADING ON-DEMAND STEP DRILLDOWN */
        <>
          {/* STEP 1: Select Syllabus / Board */}
          {currentStep === 1 && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="text-center mb-6">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Step 1</span>
                <h2 className="text-xl font-bold text-slate-800 mt-2">Select Educational Board / Syllabus</h2>
                <p className="text-xs text-slate-400 mt-1">Pick a curriculum board to view available classes</p>
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
                    onClick={() => updateRouteUrl(selectedBoard, selectedClass, sub, 4, undefined, 'ALL')}
                    className={`p-5 rounded-2xl bg-gradient-to-r ${pillColors[idx % pillColors.length]} font-black text-base tracking-wide shadow-md hover:scale-105 transition-all text-center uppercase flex items-center justify-center gap-2`}
                  >
                    <span>{sub}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Lazy Loaded Subject Notes Grid with Chapter & Type Filters */}
          {(currentStep === 4 || (selectedBoard && selectedClass && selectedSubject)) && (
            <div className="space-y-6 mt-4">
              
              {/* Filter Toolbar */}
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                
                {/* Search Bar + Navigation */}
                <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder={`Search ${selectedSubject || ''} notes (e.g. Unit 1, MCQs, Numericals)...`} 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm transition-all"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                    {/* View Mode Toggle: Infinite Scroll vs Pagination */}
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                      <button
                        onClick={() => setViewMode('INFINITE')}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                          viewMode === 'INFINITE'
                            ? 'bg-white text-indigo-600 shadow-sm font-black'
                            : 'hover:text-slate-900'
                        }`}
                        title="Smooth infinite scroll that loads items as you scroll down"
                      >
                        <ArrowDownCircle size={14} />
                        <span>Auto-Scroll</span>
                      </button>
                      <button
                        onClick={() => setViewMode('PAGINATED')}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                          viewMode === 'PAGINATED'
                            ? 'bg-white text-indigo-600 shadow-sm font-black'
                            : 'hover:text-slate-900'
                        }`}
                        title="Traditional page numbers"
                      >
                        <Layers size={14} />
                        <span>Pages</span>
                      </button>
                    </div>

                    <button 
                      onClick={() => updateRouteUrl(selectedBoard, selectedClass, '', 3)} 
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
                    >
                      ← Change Subject
                    </button>
                  </div>
                </div>

                {/* 1. Scope Filter */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                  <span className="text-xs font-black text-slate-400 uppercase tracking-wider flex items-center gap-1 mr-1">
                    <Filter size={13} /> Scope:
                  </span>
                  {[
                    { id: 'ALL', label: 'All Resources' },
                    { id: 'CHAPTER_WISE', label: '📖 Chapter-Wise Solutions' },
                    { id: 'FULL_BOOK', label: '📚 Full Book Master Notes' },
                    { id: 'PAST_PAPERS', label: '📝 Past Papers' }
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setScopeFilter(tab.id as any);
                        if (tab.id === 'FULL_BOOK') setSelectedUnit('ALL');
                      }}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                        scopeFilter === tab.id
                          ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-200 scale-105'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* 2. Interactive Chapter / Unit Filter */}
                {availableUnits.length > 0 && scopeFilter !== 'FULL_BOOK' && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-indigo-950 uppercase tracking-wider flex items-center gap-1">
                        <BookOpen size={13} className="text-indigo-600" /> Filter By Chapter / Unit:
                      </span>
                      {selectedUnit !== 'ALL' && (
                        <button 
                          onClick={() => setSelectedUnit('ALL')}
                          className="text-[11px] font-bold text-rose-500 hover:underline"
                        >
                          Clear Unit Filter
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-slate-200">
                      <button
                        onClick={() => setSelectedUnit('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1 ${
                          selectedUnit === 'ALL'
                            ? 'bg-slate-900 text-white shadow-sm scale-105'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        All Units ({availableUnits.reduce((acc, u) => acc + u.count, 0)})
                      </button>

                      {availableUnits.map(unitItem => (
                        <button
                          key={unitItem.unit}
                          onClick={() => setSelectedUnit(unitItem.unit)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 ${
                            selectedUnit === unitItem.unit
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md shadow-amber-200 scale-105'
                              : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200/50'
                          }`}
                        >
                          <span>{unitItem.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                            selectedUnit === unitItem.unit ? 'bg-white/30 text-white' : 'bg-amber-200/80 text-amber-900'
                          }`}>
                            {unitItem.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* 3. Note Type Sub-Filter */}
                {availableNoteTypes.length > 1 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-100">
                    <span className="text-[11px] font-bold text-slate-400 uppercase mr-1">Type:</span>
                    <button
                      onClick={() => setSelectedNoteType('ALL')}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all ${
                        selectedNoteType === 'ALL'
                          ? 'bg-indigo-100 text-indigo-700 font-black'
                          : 'text-slate-500 hover:bg-slate-100'
                      }`}
                    >
                      All Types
                    </button>
                    {availableNoteTypes.map(({ type, count }) => (
                      <button
                        key={type}
                        onClick={() => setSelectedNoteType(type)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                          selectedNoteType === type
                            ? 'bg-indigo-600 text-white shadow-xs font-black'
                            : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/60'
                        }`}
                      >
                        <span>{type}</span>
                        <span className="opacity-70 text-[10px]">({count})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Status Header */}
              {!isLoading && (
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1 text-xs text-slate-500 font-semibold">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span>Showing <strong className="text-slate-900">{displayedNotes.length}</strong> of <strong className="text-slate-900">{totalFilteredCount}</strong> notes</span>
                    {selectedUnit !== 'ALL' && (
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                        Unit {selectedUnit} <button onClick={() => setSelectedUnit('ALL')} className="hover:text-red-600">×</button>
                      </span>
                    )}
                    {selectedNoteType !== 'ALL' && (
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
                        {selectedNoteType} <button onClick={() => setSelectedNoteType('ALL')} className="hover:text-red-600">×</button>
                      </span>
                    )}
                  </div>

                  {viewMode === 'PAGINATED' && (
                    <div className="flex items-center gap-2">
                      <span className="text-slate-400">Page Limit:</span>
                      <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg">
                        {['20', '40', '100', 'all'].map((opt) => (
                          <button
                            key={opt}
                            onClick={() => handlePageSizeChange(opt)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase transition-all ${
                              pageSize === opt 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                            }`}
                          >
                            {opt === 'all' ? 'All' : opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* LOADING INDICATOR ON DEMAND */}
              {isLoading && (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <div className="relative">
                    <Loader2 size={40} className="text-indigo-600 animate-spin" />
                    <Sparkles size={16} className="text-amber-500 absolute -top-1 -right-1 animate-pulse" />
                  </div>
                  <p className="text-sm font-bold text-slate-700 animate-pulse">
                    Loading {selectedSubject || 'Study'} Notes for {selectedClass || 'your class'}...
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 w-full pt-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} className="p-6 bg-white rounded-3xl border border-slate-200 animate-pulse space-y-4">
                        <div className="w-12 h-12 bg-slate-100 rounded-2xl mx-auto" />
                        <div className="h-4 bg-slate-100 rounded-md w-3/4 mx-auto" />
                        <div className="h-3 bg-slate-100 rounded-md w-1/2 mx-auto" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PDF Notes Cards Grid */}
              {!isLoading && displayedNotes.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {displayedNotes.map(note => (
                    <div
                      key={note.id}
                      onClick={() => handleOpenNote(note, false)}
                      className="p-5 bg-white rounded-3xl border border-slate-200/80 hover:border-indigo-400 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between text-center group cursor-pointer relative hover:-translate-y-1"
                    >
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-1 w-full mb-3">
                        <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                          {note.grade || selectedClass}
                        </span>
                        {note.unit && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200/60">
                            Unit {note.unit}
                          </span>
                        )}
                        {note.scope === 'FULL_BOOK' && (
                          <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            Full Book
                          </span>
                        )}
                      </div>

                      {/* Icon & Title */}
                      <div className="space-y-2 my-auto">
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center mx-auto group-hover:scale-110 group-hover:bg-rose-100 transition-all shadow-sm">
                          <FileText size={24} />
                        </div>
                        <h4 className="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                          {note.title || `${note.subject} Notes`}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                          {note.subject} • {note.noteType || 'Study Note'}
                        </p>
                      </div>

                      {/* Card Action Buttons */}
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenNote(note, false); }}
                          className="inline-flex items-center gap-1 text-xs font-black text-indigo-600 hover:text-indigo-800 transition-colors"
                        >
                          <span>Open PDF</span>
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenNote(note, true); }}
                          className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 hover:text-emerald-800 transition-colors"
                          title="Open in new browser tab"
                        >
                          <span>New Tab</span>
                          <span>↗</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* INFINITE SCROLL / LOAD MORE */}
              {!isLoading && viewMode === 'INFINITE' && visibleCount < totalFilteredCount && (
                <div ref={loadMoreRef} className="py-8 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-blue-600 hover:from-indigo-600 hover:to-blue-700 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-indigo-200 transition-all flex items-center gap-2 mx-auto"
                  >
                    {isLoadingMore ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span>Loading more notes...</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownCircle size={16} />
                        <span>Load More Notes ({totalFilteredCount - visibleCount} remaining)</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* All Items Loaded Indicator */}
              {!isLoading && viewMode === 'INFINITE' && totalFilteredCount > 0 && visibleCount >= totalFilteredCount && (
                <div className="py-6 text-center text-xs font-bold text-slate-400 flex items-center justify-center gap-1.5">
                  <CheckCircle2 size={15} className="text-emerald-500" />
                  <span>All {totalFilteredCount} notes loaded and ready.</span>
                </div>
              )}

              {/* TRADITIONAL PAGINATION */}
              {!isLoading && viewMode === 'PAGINATED' && pageSize !== 'all' && totalPages > 1 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-200">
                  <span className="text-xs font-bold text-slate-500">
                    Page <span className="text-indigo-600 font-black">{currentPage}</span> of <span className="font-bold text-slate-800">{totalPages}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
                        currentPage === 1 
                          ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50' 
                          : 'border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <ChevronLeft size={16} />
                      <span className="hidden sm:inline">Prev</span>
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter(p => p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2))
                      .map((pageNum, idx, arr) => {
                        const prev = arr[idx - 1];
                        const showEllipsis = prev && pageNum - prev > 1;
                        return (
                          <React.Fragment key={pageNum}>
                            {showEllipsis && <span className="px-1 text-slate-400">...</span>}
                            <button
                              onClick={() => setCurrentPage(pageNum)}
                              className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                                currentPage === pageNum 
                                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105' 
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {pageNum}
                            </button>
                          </React.Fragment>
                        );
                      })}

                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
                        currentPage === totalPages 
                          ? 'border-slate-200 text-slate-300 cursor-not-allowed bg-slate-50' 
                          : 'border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      <span className="hidden sm:inline">Next</span>
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {!isLoading && error && (
                <div className="text-center py-12 bg-red-50 rounded-xl border border-red-100">
                  <div className="text-red-500 mb-2 font-semibold">Oops!</div>
                  <p className="text-red-600">{error}</p>
                  <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                    Retry
                  </button>
                </div>
              )}

              {!isLoading && !error && stepNotes.length === 0 && (
                <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                  <FileText size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="font-bold text-slate-600">No notes found for {selectedSubject || 'this subject'}.</p>
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
