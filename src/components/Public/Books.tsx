import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { 
  Search, BookOpen, ExternalLink, ChevronLeft, ChevronRight, 
  Layers, Filter, ArrowDownCircle, CheckCircle2, Loader2, Sparkles, X
} from 'lucide-react';
import { getNotes, getPublicCurriculum } from '../../services/dataService';
import { Syllabus, ClassLevel } from '../../types';

const Books: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [curriculum, setCurriculum] = useState<{ syllabuses: Syllabus[]; classes: ClassLevel[] }>({
    syllabuses: [],
    classes: []
  });

  // Step Navigation state: 1 = Board/Syllabus, 2 = Class, 3 = Subject, 4 = Books Grid
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');

  // Selected Book Modal Viewer
  const [selectedBookModal, setSelectedBookModal] = useState<any | null>(null);

  // View Mode: 'INFINITE' vs 'PAGINATED'
  const [viewMode, setViewMode] = useState<'INFINITE' | 'PAGINATED'>('INFINITE');
  const [visibleCount, setVisibleCount] = useState<number>(20);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Pagination & Display Limit
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<string>('20');
  const [userCustomLimit, setUserCustomLimit] = useState<boolean>(false);

  // Helper functions to normalize strings for robust comparison
  const normalizeNum = (str: string) => String(str || '').replace(/[^0-9]/g, '');
  const normalizeText = (str: string) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // Initial Load: Fetch Curriculum and all Textbooks from database
  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [currData, booksData] = await Promise.all([
          getPublicCurriculum().catch(() => ({ syllabuses: [], classes: [] })),
          getNotes({ noteType: 'Textbook' }).catch(() => [])
        ]);
        let finalBooks = Array.isArray(booksData) ? booksData : [];
        // If noteType: 'Textbook' returns empty, fallback to fetching all notes to find books
        if (finalBooks.length === 0) {
          const allNotes = await getNotes().catch(() => []);
          if (Array.isArray(allNotes) && allNotes.length > 0) {
            finalBooks = allNotes.filter(n => 
              !n.noteType || 
              /textbook|book|complete/i.test(n.noteType) || 
              (n.title && /book|textbook|guide/i.test(n.title))
            );
            if (finalBooks.length === 0) finalBooks = allNotes;
          }
        }

        if (isMounted) {
          setCurriculum({ syllabuses: currData?.syllabuses || [], classes: currData?.classes || [] });
          setBooks(finalBooks);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch textbooks. Please try again.');
          setBooks([]);
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

  // Extract deduplicated boards from uploaded books and curriculum
  const availableBoards = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    
    books.forEach(b => {
      if (b.board && b.board.trim()) {
        const trimmed = b.board.trim();
        if (!list.some(item => item.name.toLowerCase() === trimmed.toLowerCase())) {
          list.push({ id: trimmed, name: trimmed });
        }
      }
    });

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
  }, [curriculum.syllabuses, books]);

  // Extract deduplicated and sorted classes
  const stepClasses = useMemo(() => {
    const classSet = new Set<string>();

    books.forEach(b => {
      if (b.grade && String(b.grade).trim()) {
        if (selectedBoard && b.board) {
          const nb = normalizeText(b.board);
          const sb = normalizeText(selectedBoard);
          if (nb && sb && !nb.includes(sb) && !sb.includes(nb)) return;
        }
        let g = String(b.grade).trim();
        if (/^\d+$/.test(g)) g = `Class ${g}`;
        classSet.add(g);
      }
    });

    if (curriculum.classes.length > 0) {
      curriculum.classes.forEach(c => {
        if (c.name && c.name.trim()) classSet.add(c.name.trim());
      });
    }

    if (classSet.size === 0) {
      ['Class 9', 'Class 10', 'Class 11', 'Class 12'].forEach(c => classSet.add(c));
    }

    return Array.from(classSet).sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    }).map(g => ({ id: g, name: g }));
  }, [books, curriculum.classes, selectedBoard]);

  // Available subjects for selected class and board
  const availableSubjects: string[] = useMemo(() => {
    const subSet = new Set<string>();

    books.forEach(b => {
      if (b.subject && String(b.subject).trim()) {
        if (selectedClass && b.grade) {
          const ng = normalizeNum(b.grade);
          const sg = normalizeNum(selectedClass);
          if (ng && sg && ng !== sg) return;
        }
        if (selectedBoard && b.board) {
          const nb = normalizeText(b.board);
          const sb = normalizeText(selectedBoard);
          if (nb && sb && !nb.includes(sb) && !sb.includes(nb)) return;
        }
        subSet.add(String(b.subject).trim());
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
  }, [books, curriculum.classes, selectedClass, selectedBoard]);

  // Extract Chapter / Unit filter chips
  const availableUnits = useMemo(() => {
    const unitMap = new Map<string, { unit: string; label: string; count: number }>();
    books.forEach(b => {
      if (selectedClass && b.grade) {
        const ng = normalizeNum(b.grade);
        const sg = normalizeNum(selectedClass);
        if (ng && sg && ng !== sg) return;
      }
      if (selectedSubject && b.subject) {
        const ns = normalizeText(b.subject);
        const ss = normalizeText(selectedSubject);
        if (ns && ss && !ns.includes(ss) && !ss.includes(ns)) return;
      }

      let unitNum = '';
      if (b.unit) {
        unitNum = String(b.unit).trim();
      } else if (b.title) {
        const m = b.title.match(/(?:unit|chapter|ch)\s*0?(\d+)/i);
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
  }, [books, selectedClass, selectedSubject]);

  // Filtered books based on search, board, class, subject & unit
  const stepBooks = useMemo(() => {
    return books.filter(b => {
      // Board Filter
      if (selectedBoard && b.board) {
        const nb = normalizeText(b.board);
        const sb = normalizeText(selectedBoard);
        if (nb && sb && !nb.includes(sb) && !sb.includes(nb)) return false;
      }

      // Class Filter
      if (selectedClass && b.grade) {
        const ng = normalizeNum(b.grade);
        const sg = normalizeNum(selectedClass);
        if (ng && sg && ng !== sg) return false;
      }

      // Subject Filter
      if (selectedSubject && b.subject) {
        const ns = normalizeText(b.subject);
        const ss = normalizeText(selectedSubject);
        if (ns && ss && !ns.includes(ss) && !ss.includes(ns)) return false;
      }

      // Search Filter
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const t = String(b.title || '').toLowerCase();
        const s = String(b.subject || '').toLowerCase();
        const a = String(b.author || '').toLowerCase();
        const d = String(b.description || '').toLowerCase();
        if (!t.includes(q) && !s.includes(q) && !a.includes(q) && !d.includes(q)) return false;
      }

      // Chapter / Unit Filter
      if (selectedUnit !== 'ALL') {
        const cleanTargetUnit = selectedUnit.replace(/^0+/, '');
        const bookUnit = (b.unit || '').toString().replace(/^0+/, '');
        const inTitle = b.title && (
          new RegExp(`(?:unit|chapter|ch)\\s*0?${cleanTargetUnit}\\b`, 'i').test(b.title)
        );
        if (bookUnit !== cleanTargetUnit && !inTitle) return false;
      }
      return true;
    });
  }, [books, selectedBoard, selectedClass, selectedSubject, searchTerm, selectedUnit]);

  const isFiltered = Boolean(selectedBoard || selectedClass || selectedSubject || selectedUnit !== 'ALL' || searchTerm);

  useEffect(() => {
    setVisibleCount(20);
    setCurrentPage(1);
  }, [selectedBoard, selectedClass, selectedSubject, selectedUnit, searchTerm]);

  // Infinite Scroll Intersection Observer
  const handleLoadMore = useCallback(() => {
    if (visibleCount < stepBooks.length && !isLoadingMore) {
      setIsLoadingMore(true);
      setTimeout(() => {
        setVisibleCount(prev => Math.min(prev + 20, stepBooks.length));
        setIsLoadingMore(false);
      }, 150);
    }
  }, [visibleCount, stepBooks.length, isLoadingMore]);

  useEffect(() => {
    if (viewMode !== 'INFINITE') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < stepBooks.length) {
          handleLoadMore();
        }
      },
      { threshold: 0.1, rootMargin: '200px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [viewMode, visibleCount, stepBooks.length, handleLoadMore]);

  // Dynamic URL Sync
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const board = params.get('board') || '';
      const cls = params.get('class') || '';
      const subject = params.get('subject') || '';
      const unit = params.get('unit') || 'ALL';
      const step = parseInt(params.get('step') || '1', 10);
      const bookId = params.get('bookId');

      setSelectedBoard(board);
      setSelectedClass(cls);
      setSelectedSubject(subject);
      setSelectedUnit(unit);
      setCurrentStep(step);

      if (bookId && books.length > 0) {
        const found = books.find(b => String(b.id) === String(bookId));
        if (found) setSelectedBookModal(found);
      } else if (!bookId) {
        setSelectedBookModal(null);
      }
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [books]);

  const updateRouteUrl = (newBoard: string, newClass: string, newSubject: string, newStep: number, bookId?: string, unit = selectedUnit) => {
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
    if (bookId) params.set('bookId', bookId);

    const queryString = params.toString();
    const newPath = queryString ? `/books?${queryString}` : '/books';
    window.history.pushState(null, '', newPath);
  };

  const handleOpenBook = (book: any, openInNewTab = false) => {
    if (openInNewTab) {
      const params = new URLSearchParams();
      if (book.board) params.set('board', book.board);
      if (book.grade) params.set('class', book.grade);
      if (book.subject) params.set('subject', book.subject);
      params.set('step', '4');
      params.set('bookId', book.id);
      window.open(`/books?${params.toString()}`, '_blank');
    } else {
      setSelectedBookModal(book);
      updateRouteUrl(selectedBoard, selectedClass, selectedSubject, currentStep, book.id);
    }
  };

  const closeBookModal = () => {
    setSelectedBookModal(null);
    updateRouteUrl(selectedBoard, selectedClass, selectedSubject, currentStep);
  };

  const resetStepWizard = () => {
    setSelectedBoard('');
    setSelectedClass('');
    setSelectedSubject('');
    setSelectedUnit('ALL');
    setCurrentStep(1);
    setSelectedBookModal(null);
    setUserCustomLimit(false);
    setVisibleCount(20);
    window.history.pushState(null, '', '/books');
  };

  const totalFilteredCount = stepBooks.length;
  const numericLimit = pageSize === 'all' ? totalFilteredCount : parseInt(pageSize, 10);
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / (numericLimit || 20)));

  const displayedBooks = useMemo(() => {
    if (viewMode === 'INFINITE') {
      return stepBooks.slice(0, visibleCount);
    }
    if (pageSize === 'all') return stepBooks;
    const start = (currentPage - 1) * numericLimit;
    return stepBooks.slice(start, start + numericLimit);
  }, [stepBooks, viewMode, visibleCount, pageSize, currentPage, numericLimit]);

  const handlePageSizeChange = (val: string) => {
    setPageSize(val);
    setUserCustomLimit(true);
    setCurrentPage(1);
  };

  const pillColors = [
    'from-indigo-600 to-blue-600 text-white shadow-indigo-200',
    'from-emerald-500 to-teal-600 text-white shadow-emerald-200',
    'from-purple-600 to-pink-600 text-white shadow-purple-200',
    'from-amber-500 to-orange-500 text-white shadow-amber-200',
    'from-cyan-600 to-blue-500 text-white shadow-cyan-200',
    'from-rose-500 to-red-600 text-white shadow-rose-200',
    'from-violet-600 to-indigo-700 text-white shadow-violet-200',
    'from-teal-600 to-emerald-700 text-white shadow-teal-200'
  ];

  return (
    <div className="py-6 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
      {/* Breadcrumbs */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span className="cursor-pointer hover:text-indigo-600 flex items-center gap-1" onClick={resetStepWizard}>
            <BookOpen size={14} />
            <span>Books & Key Books</span>
          </span>
          {selectedBoard && <span>/</span>}
          {selectedBoard && (
            <span 
              className={`cursor-pointer hover:text-indigo-600 ${currentStep === 1 ? 'text-indigo-600 font-bold' : ''}`}
              onClick={() => updateRouteUrl(selectedBoard, '', '', 2)}
            >
              {selectedBoard}
            </span>
          )}
          {selectedClass && <span>/</span>}
          {selectedClass && (
            <span 
              className={`cursor-pointer hover:text-indigo-600 ${currentStep === 2 ? 'text-indigo-600 font-bold' : ''}`}
              onClick={() => updateRouteUrl(selectedBoard, selectedClass, '', 3)}
            >
              Class {selectedClass}
            </span>
          )}
          {selectedSubject && <span>/</span>}
          {selectedSubject && (
            <span 
              className={`cursor-pointer hover:text-indigo-600 ${currentStep === 3 ? 'text-indigo-600 font-bold' : ''}`}
              onClick={() => updateRouteUrl(selectedBoard, selectedClass, selectedSubject, 4)}
            >
              {selectedSubject}
            </span>
          )}
          {selectedBookModal && <span>/</span>}
          {selectedBookModal && <span className="text-indigo-600 font-bold line-clamp-1">{selectedBookModal.title}</span>}
        </div>

        {selectedBookModal ? (
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                {selectedBookModal.board || 'TEXTBOOK'}
              </span>
              {selectedBookModal.grade && (
                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  Class {selectedBookModal.grade}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 leading-tight">
              {selectedBookModal.title}
            </h1>
          </div>
        ) : (
          <div className="text-center py-4">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 inline-block relative">
              <span className="text-indigo-600 border-b-4 border-indigo-600 pb-1">Books</span> & Key Books
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto font-medium">
              Official board textbooks, syllabus guidebooks, and curriculum key reference books.
            </p>
          </div>
        )}
      </div>

      {/* STEP INDICATOR WIZARD */}
      {!selectedBookModal && (
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="grid grid-cols-4 gap-2 sm:gap-4 relative">
            <div 
              onClick={() => updateRouteUrl('', '', '', 1)}
              className={`flex flex-col items-center text-center p-2 sm:p-3 rounded-xl cursor-pointer transition-all ${
                currentStep === 1 
                  ? 'bg-indigo-50 border-2 border-indigo-600 text-indigo-700 shadow-sm' 
                  : currentStep > 1 
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-700' 
                  : 'bg-slate-50 text-slate-400 border border-transparent'
              }`}
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs mb-1 sm:mb-1.5 ${
                currentStep === 1 ? 'bg-indigo-600 text-white' : currentStep > 1 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                1
              </div>
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider line-clamp-1">
                {selectedBoard ? selectedBoard.split(' ')[0] : 'Board'}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 hidden sm:inline">Select Syllabus</span>
            </div>

            <div 
              onClick={() => selectedBoard && updateRouteUrl(selectedBoard, '', '', 2)}
              className={`flex flex-col items-center text-center p-2 sm:p-3 rounded-xl transition-all ${
                !selectedBoard ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'
              } ${
                currentStep === 2 
                  ? 'bg-indigo-50 border-2 border-indigo-600 text-indigo-700 shadow-sm' 
                  : currentStep > 2 
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-700' 
                  : 'bg-slate-50 text-slate-400 border border-transparent'
              }`}
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs mb-1 sm:mb-1.5 ${
                currentStep === 2 ? 'bg-indigo-600 text-white' : currentStep > 2 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                2
              </div>
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider line-clamp-1">
                {selectedClass || 'Class'}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 hidden sm:inline">Select Grade</span>
            </div>

            <div 
              onClick={() => selectedClass && updateRouteUrl(selectedBoard, selectedClass, '', 3)}
              className={`flex flex-col items-center text-center p-2 sm:p-3 rounded-xl transition-all ${
                !selectedClass ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'
              } ${
                currentStep === 3 
                  ? 'bg-indigo-50 border-2 border-indigo-600 text-indigo-700 shadow-sm' 
                  : currentStep > 3 
                  ? 'bg-emerald-50 border border-emerald-300 text-emerald-700' 
                  : 'bg-slate-50 text-slate-400 border border-transparent'
              }`}
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs mb-1 sm:mb-1.5 ${
                currentStep === 3 ? 'bg-indigo-600 text-white' : currentStep > 3 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                3
              </div>
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider line-clamp-1">
                {selectedSubject || 'Subject'}
              </span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 hidden sm:inline">Select Subject</span>
            </div>

            <div 
              onClick={() => selectedSubject && updateRouteUrl(selectedBoard, selectedClass, selectedSubject, 4)}
              className={`flex flex-col items-center text-center p-2 sm:p-3 rounded-xl transition-all ${
                !selectedSubject ? 'opacity-50 cursor-not-allowed bg-slate-50' : 'cursor-pointer'
              } ${
                currentStep === 4 
                  ? 'bg-indigo-50 border-2 border-indigo-600 text-indigo-700 shadow-sm' 
                  : 'bg-slate-50 text-slate-400 border border-transparent'
              }`}
            >
              <div className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-black text-xs mb-1 sm:mb-1.5 ${
                currentStep === 4 ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                4
              </div>
              <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider line-clamp-1">Books</span>
              <span className="text-[9px] sm:text-[10px] text-slate-500 hidden sm:inline">Read & Download</span>
            </div>
          </div>
        </div>
      )}

      {selectedBookModal ? (
        /* SINGLE BOOK VIEW */
        <div className="space-y-6">
          <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Book Information & Summary</h3>
              <button 
                onClick={closeBookModal}
                className="px-3 sm:px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                ← Back to Books
              </button>
            </div>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line font-medium">
              {selectedBookModal.description || `Official textbook and curriculum material for ${selectedBookModal.title}. Curated and distributed according to the ${selectedBookModal.board || 'standard educational'} board guidelines.`}
            </p>
          </div>

          {selectedBookModal.fileUrl ? (
            <div className="bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center font-bold shrink-0">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{selectedBookModal.title}</h4>
                    <p className="text-[11px] text-slate-400">PDF Textbook • {selectedBookModal.board || 'Official Board'}</p>
                  </div>
                </div>
                
                <a
                  href={selectedBookModal.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:scale-105"
                >
                  <span>Open Drive Link</span>
                  <span>➔</span>
                </a>
              </div>

              <div className="w-full h-[500px] sm:h-[650px] bg-slate-950 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-800">
                <iframe
                  src={selectedBookModal.fileUrl?.includes('drive.google.com') ? selectedBookModal.fileUrl.replace('/view', '/preview') : selectedBookModal.fileUrl}
                  className="w-full h-full border-0"
                  title="PDF Textbook Viewer"
                />
              </div>
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl sm:rounded-3xl font-bold">
              PDF preview link is not attached to this book.
            </div>
          )}
        </div>
      ) : (
        /* STEP WIZARD CONTENT */
        <div className="space-y-6">
          {/* STEP 1: SELECT BOARD */}
          {currentStep === 1 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  Step 1 of 4
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Choose Educational Board</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Select your board or curriculum authority to discover official textbooks.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
                {availableBoards.map((b, idx) => (
                  <button
                    key={b.id}
                    onClick={() => updateRouteUrl(b.name, '', '', 2)}
                    className="p-6 bg-white hover:bg-slate-50 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 shadow-sm hover:shadow-xl transition-all text-left group relative overflow-hidden flex flex-col justify-between h-36"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pillColors[idx % pillColors.length]} flex items-center justify-center font-black text-sm shadow-md`}>
                        {b.name.charAt(0)}
                      </div>
                      <ChevronRight size={18} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-base group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {b.name}
                      </h3>
                      <p className="text-[11px] text-slate-400 font-semibold mt-0.5">Official Board Curriculum</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: SELECT CLASS */}
          {currentStep === 2 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  Step 2 of 4 • {selectedBoard}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Select Academic Class</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Choose your grade or class level to view available textbooks.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
                {stepClasses.map((c, idx) => (
                  <button
                    key={c.id}
                    onClick={() => updateRouteUrl(selectedBoard, c.name, '', 3)}
                    className="p-6 bg-white hover:bg-slate-50 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 shadow-sm hover:shadow-xl transition-all text-center group flex flex-col items-center justify-center gap-3 h-36"
                  >
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pillColors[idx % pillColors.length]} flex items-center justify-center font-black text-lg shadow-md group-hover:scale-110 transition-transform`}>
                      <Layers size={22} />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                        {c.name}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Textbooks</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={() => updateRouteUrl('', '', '', 1)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  <ChevronLeft size={14} />
                  <span>Change Board</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: SELECT SUBJECT */}
          {currentStep === 3 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              <div className="text-center max-w-xl mx-auto space-y-2">
                <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  Step 3 of 4 • {selectedBoard} • Class {selectedClass}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">Select Subject</h2>
                <p className="text-xs sm:text-sm text-slate-500">
                  Pick the subject to explore complete syllabus textbooks and key guides.
                </p>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                {availableSubjects.map((s, idx) => (
                  <button
                    key={s}
                    onClick={() => updateRouteUrl(selectedBoard, selectedClass, s, 4)}
                    className="p-5 bg-white hover:bg-slate-50 rounded-2xl border-2 border-slate-200 hover:border-indigo-500 shadow-sm hover:shadow-xl transition-all text-left group flex flex-col justify-between h-32"
                  >
                    <div className="flex items-center justify-between">
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${pillColors[idx % pillColors.length]} flex items-center justify-center font-black text-sm shadow-md`}>
                        <BookOpen size={16} />
                      </div>
                      <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                    </div>
                    <div>
                      <h3 className="font-black text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {s}
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Click to Load</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="text-center">
                <button
                  onClick={() => updateRouteUrl(selectedBoard, '', '', 2)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all"
                >
                  <ChevronLeft size={14} />
                  <span>Change Class</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 4: BOOKS GRID & VIEWER */}
          {currentStep === 4 && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-200">
              {/* Header Info & Switch Subject Button */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-0.5 rounded-md border border-indigo-100">
                      {selectedBoard || 'ALL BOARDS'}
                    </span>
                    {selectedClass && (
                      <span className="text-xs font-black text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-0.5 rounded-md border border-emerald-100">
                        Class {selectedClass}
                      </span>
                    )}
                    {selectedSubject && (
                      <span className="text-xs font-black text-purple-600 uppercase tracking-wider bg-purple-50 px-2.5 py-0.5 rounded-md border border-purple-100">
                        {selectedSubject}
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
                    {selectedSubject ? `${selectedSubject} Textbooks` : 'All Textbooks'}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => updateRouteUrl(selectedBoard, selectedClass, '', 3)}
                    className="px-3.5 py-1.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 rounded-xl text-xs font-bold transition-all"
                  >
                    ← Switch Subject
                  </button>
                  <button
                    onClick={resetStepWizard}
                    className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
                  >
                    Reset All
                  </button>
                </div>
              </div>

              {/* Search Bar & Options */}
              <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
                <div className="relative flex-1 w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input 
                    type="text" 
                    placeholder="Search books by title, chapter, or keyword..." 
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                  {/* View Mode Toggle */}
                  <div className="flex items-center bg-slate-100 p-0.5 rounded-xl text-xs font-bold">
                    <button
                      onClick={() => setViewMode('INFINITE')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        viewMode === 'INFINITE' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Infinite Scroll
                    </button>
                    <button
                      onClick={() => setViewMode('PAGINATED')}
                      className={`px-3 py-1.5 rounded-lg transition-all ${
                        viewMode === 'PAGINATED' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Pages
                    </button>
                  </div>

                  {viewMode === 'PAGINATED' && (
                    <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs font-bold text-slate-700">
                      <span className="text-slate-400 font-semibold">Show:</span>
                      <select
                        value={pageSize}
                        onChange={(e) => handlePageSizeChange(e.target.value)}
                        className="bg-transparent font-black text-indigo-600 focus:outline-none cursor-pointer"
                      >
                        <option value="20">20</option>
                        <option value="40">40</option>
                        <option value="100">100</option>
                        <option value="all">All</option>
                      </select>
                    </div>
                  )}
                </div>
              </div>

              {/* CHAPTER / UNIT FILTER CHIPS (IF UNITS EXIST) */}
              {availableUnits.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                      <Filter size={14} className="text-indigo-600" />
                      <span>Filter By Chapter / Unit:</span>
                    </h3>
                    {selectedUnit !== 'ALL' && (
                      <button
                        onClick={() => setSelectedUnit('ALL')}
                        className="text-xs font-bold text-red-500 hover:text-red-700"
                      >
                        Reset Unit Filter
                      </button>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => setSelectedUnit('ALL')}
                      className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                        selectedUnit === 'ALL'
                          ? 'bg-indigo-600 text-white shadow-indigo-200 scale-105'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      All Units ({books.length})
                    </button>
                    {availableUnits.map(u => (
                      <button
                        key={u.unit}
                        onClick={() => setSelectedUnit(u.unit)}
                        className={`px-3 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm flex items-center gap-1.5 ${
                          selectedUnit === u.unit
                            ? 'bg-emerald-600 text-white shadow-emerald-200 scale-105'
                            : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <span>{u.label}</span>
                        <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                          selectedUnit === u.unit ? 'bg-emerald-700 text-white' : 'bg-slate-100 text-slate-500'
                        }`}>
                          {u.count}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* LOADING INDICATOR ON DEMAND */}
              {isLoading && (
                <div className="py-20 text-center space-y-4 bg-white rounded-3xl border border-slate-200 shadow-sm animate-in fade-in duration-200">
                  <div className="relative inline-flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-indigo-600 animate-spin" />
                    <Sparkles className="w-5 h-5 text-amber-500 absolute animate-pulse" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-base font-black text-slate-800">Loading Textbooks & Keybooks...</h3>
                    <p className="text-xs text-slate-400 font-medium">Fetching verified curriculum textbooks from server</p>
                  </div>
                </div>
              )}

              {/* ERROR STATE */}
              {!isLoading && error && (
                <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-100 p-6">
                  <div className="text-red-500 mb-2 font-bold">Failed to load textbooks</div>
                  <p className="text-red-600 text-xs">{error}</p>
                  <button 
                    onClick={() => updateRouteUrl(selectedBoard, selectedClass, selectedSubject, 4)} 
                    className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-xl font-bold text-xs hover:bg-red-200 transition-colors"
                  >
                    Retry Loading
                  </button>
                </div>
              )}

              {/* EMPTY STATE */}
              {!isLoading && !error && stepBooks.length === 0 && (
                <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 p-6">
                  <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="font-bold text-slate-600">No textbooks found for this subject or filter.</p>
                  <p className="text-xs text-slate-400 mt-1">Try switching to another class or reset filters.</p>
                  <button 
                    onClick={() => updateRouteUrl(selectedBoard, selectedClass, '', 3)} 
                    className="mt-4 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-xs font-bold hover:bg-indigo-100 transition-all"
                  >
                    Choose Another Subject
                  </button>
                </div>
              )}

              {/* BOOKS GRID */}
              {!isLoading && !error && stepBooks.length > 0 && (
                <>
                  <div className="flex justify-between items-center px-1 text-xs text-slate-500 font-semibold">
                    <div>
                      Showing <span className="font-bold text-slate-800">{displayedBooks.length}</span> of <span className="font-bold text-slate-800">{totalFilteredCount}</span> textbooks
                      {isFiltered && <span className="text-indigo-600 font-bold ml-1">(Filtered)</span>}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
                    {displayedBooks.map((book) => (
                      <div
                        key={book.id}
                        onClick={() => handleOpenBook(book, false)}
                        className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between text-center group cursor-pointer relative"
                      >
                        <div>
                          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                            <BookOpen size={24} />
                          </div>
                          <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors line-clamp-2">
                            {book.title}
                          </h3>

                          <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                            {book.grade && (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                                Class {book.grade}
                              </span>
                            )}
                            {book.board && (
                              <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                                {book.board}
                              </span>
                            )}
                          </div>

                          {book.description && (
                            <p className="text-xs text-slate-400 mt-2 line-clamp-2 font-medium">
                              {book.description}
                            </p>
                          )}
                        </div>

                        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-3">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenBook(book, false); }}
                            className="inline-flex items-center gap-1 text-xs font-black text-indigo-600 hover:underline"
                          >
                            <span>Read Book</span>
                          </button>
                          <span className="text-slate-300">•</span>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleOpenBook(book, true); }}
                            className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 hover:underline"
                            title="Open in new browser tab with direct URL"
                          >
                            <span>New Tab</span>
                            <ExternalLink size={12} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* INFINITE SCROLL LOADER REF & SKELETON TRIGGER */}
                  {viewMode === 'INFINITE' && (
                    <div ref={loadMoreRef} className="py-6 text-center">
                      {isLoadingMore ? (
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-full text-xs font-bold text-slate-600 animate-pulse">
                          <Loader2 size={14} className="animate-spin text-indigo-600" />
                          <span>Loading more textbooks...</span>
                        </div>
                      ) : visibleCount < stepBooks.length ? (
                        <button
                          onClick={handleLoadMore}
                          className="px-5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition-all inline-flex items-center gap-1.5"
                        >
                          <ArrowDownCircle size={14} />
                          <span>Load More ({stepBooks.length - visibleCount} remaining)</span>
                        </button>
                      ) : (
                        <div className="inline-flex items-center gap-1.5 text-xs text-slate-400 font-bold">
                          <CheckCircle2 size={14} className="text-emerald-500" />
                          <span>All {stepBooks.length} textbooks loaded</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TRADITIONAL PAGINATION BAR */}
                  {viewMode === 'PAGINATED' && pageSize !== 'all' && totalPages > 1 && (
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
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Books;
