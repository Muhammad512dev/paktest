import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Search, FileText, Download, Filter, BookOpen, Layers, GraduationCap, ArrowRight, ChevronLeft, ChevronRight, Loader2, ArrowDownCircle, CheckCircle2 } from 'lucide-react';
import { getNotes, getPublicCurriculum } from '../../services/dataService';
import { Syllabus, ClassLevel } from '../../types';

const LessonPlans: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [curriculum, setCurriculum] = useState<{ syllabuses: Syllabus[]; classes: ClassLevel[] }>({
    syllabuses: [],
    classes: []
  });

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedUnit, setSelectedUnit] = useState<string>('ALL');
  const [selectedPlanModal, setSelectedPlanModal] = useState<any | null>(null);

  // View Mode: 'INFINITE' vs 'PAGINATED'
  const [viewMode, setViewMode] = useState<'INFINITE' | 'PAGINATED'>('INFINITE');
  const [visibleCount, setVisibleCount] = useState<number>(20);
  const [isLoadingMore, setIsLoadingMore] = useState<boolean>(false);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  // Pagination & Display Limit (20, 40, 100, 'all')
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<string>('20');
  const [userCustomLimit, setUserCustomLimit] = useState<boolean>(false);

  // Helper functions to normalize strings for robust comparison
  const normalizeNum = (str: string) => String(str || '').replace(/[^0-9]/g, '');
  const normalizeText = (str: string) => String(str || '').toLowerCase().replace(/[^a-z0-9]/g, '');

  // Initial Load: Fetch Curriculum and all Lesson Plans from database
  useEffect(() => {
    let isMounted = true;
    const loadAll = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [currData, plansData] = await Promise.all([
          getPublicCurriculum().catch(() => ({ syllabuses: [], classes: [] })),
          getNotes({ noteType: 'Lesson Plan' }).catch(() => [])
        ]);
        let finalPlans = Array.isArray(plansData) ? plansData : [];
        if (finalPlans.length === 0) {
          const allNotes = await getNotes().catch(() => []);
          if (Array.isArray(allNotes) && allNotes.length > 0) {
            finalPlans = allNotes.filter(n => 
              n.noteType === 'Lesson Plan' ||
              (n.noteType && /lesson\s*plan/i.test(n.noteType)) || 
              (n.title && /lesson\s*plan|teaching\s*guide/i.test(n.title))
            );
          }
        }

        if (isMounted) {
          setCurriculum({ syllabuses: currData?.syllabuses || [], classes: currData?.classes || [] });
          setNotes(finalPlans);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.message || 'Failed to fetch lesson plans. Please try again.');
          setNotes([]);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };
    loadAll();
    return () => { isMounted = false; };
  }, []);

  // Extract boards from uploaded plans or curriculum
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

  // Extract classes from uploaded plans or curriculum
  const availableClasses = useMemo(() => {
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

    if (classSet.size === 0) {
      ['Class 9', 'Class 10', 'Class 11', 'Class 12'].forEach(c => classSet.add(c));
    }

    return Array.from(classSet).sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    }).map(c => ({ id: c, name: c }));
  }, [notes, curriculum.classes, selectedBoard]);

  // Extract subjects for selected class and board
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

  // Extract Chapters / Units
  const availableUnits = useMemo(() => {
    const unitMap = new Map<string, { unit: string; label: string; count: number }>();
    notes.forEach(n => {
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

      // Chapter / Unit Filter
      if (selectedUnit !== 'ALL') {
        const cleanTargetUnit = selectedUnit.replace(/^0+/, '');
        const noteUnit = (n.unit || '').toString().replace(/^0+/, '');
        const inTitle = n.title && (
          new RegExp(`(?:unit|chapter|ch)\\s*0?${cleanTargetUnit}\\b`, 'i').test(n.title)
        );
        if (noteUnit !== cleanTargetUnit && !inTitle) return false;
      }
      return true;
    });
  }, [notes, selectedBoard, selectedClass, selectedSubject, searchTerm, selectedUnit]);

  const isFiltered = Boolean(selectedBoard || selectedClass || selectedSubject || selectedUnit !== 'ALL' || searchTerm);

  useEffect(() => {
    setVisibleCount(20);
    setCurrentPage(1);
  }, [selectedBoard, selectedClass, selectedSubject, selectedUnit, searchTerm]);

  // Infinite Scroll Observer
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
    if (loadMoreRef.current) observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [viewMode, visibleCount, stepNotes.length, handleLoadMore]);

  const totalFilteredCount = stepNotes.length;
  const numericLimit = pageSize === 'all' ? totalFilteredCount : parseInt(pageSize, 10);
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / (numericLimit || 20)));

  const displayedPlans = useMemo(() => {
    if (viewMode === 'INFINITE') return stepNotes.slice(0, visibleCount);
    if (pageSize === 'all') return stepNotes;
    const start = (currentPage - 1) * numericLimit;
    return stepNotes.slice(start, start + numericLimit);
  }, [stepNotes, viewMode, visibleCount, pageSize, currentPage, numericLimit]);

  const handlePageSizeChange = (val: string) => {
    setPageSize(val);
    setUserCustomLimit(true);
    setCurrentPage(1);
  };

  // Dynamic URL Sync
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const board = params.get('board') || '';
      const cls = params.get('class') || '';
      const subject = params.get('subject') || '';
      const unit = params.get('unit') || 'ALL';
      const step = parseInt(params.get('step') || '1', 10);
      const planId = params.get('planId');

      setSelectedBoard(board);
      setSelectedClass(cls);
      setSelectedSubject(subject);
      setSelectedUnit(unit);
      setCurrentStep(step);

      if (planId && notes.length > 0) {
        const found = notes.find(n => String(n.id) === String(planId));
        if (found) setSelectedPlanModal(found);
      } else if (!planId) {
        setSelectedPlanModal(null);
      }
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [notes]);

  const updateRouteUrl = (newBoard: string, newClass: string, newSubject: string, newStep: number, planId?: string, unit = selectedUnit) => {
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
    if (planId) params.set('planId', planId);

    const queryString = params.toString();
    const newPath = queryString ? `/lesson-plans?${queryString}` : '/lesson-plans';
    window.history.pushState(null, '', newPath);
  };

  const handleOpenPlan = (plan: any, openInNewTab = false) => {
    if (openInNewTab) {
      const params = new URLSearchParams();
      if (plan.board) params.set('board', plan.board);
      if (plan.grade) params.set('class', plan.grade);
      if (plan.subject) params.set('subject', plan.subject);
      params.set('step', '4');
      params.set('planId', plan.id);
      window.open(`/lesson-plans?${params.toString()}`, '_blank');
    } else {
      setSelectedPlanModal(plan);
      updateRouteUrl(selectedBoard, selectedClass, selectedSubject, currentStep, plan.id);
    }
  };

  const closePlanModal = () => {
    setSelectedPlanModal(null);
    updateRouteUrl(selectedBoard, selectedClass, selectedSubject, currentStep);
  };

  const resetStepWizard = () => {
    setSelectedBoard('');
    setSelectedClass('');
    setSelectedSubject('');
    setSelectedUnit('ALL');
    setCurrentStep(1);
    setSelectedPlanModal(null);
    setUserCustomLimit(false);
    setVisibleCount(20);
    window.history.pushState(null, '', '/lesson-plans');
  };

  // Colors for pill buttons
  const pillColors = [
    'from-emerald-400 to-green-600 text-white shadow-emerald-200',
    'from-sky-400 to-blue-500 text-white shadow-sky-200',
    'from-teal-400 to-cyan-600 text-white shadow-teal-200',
    'from-amber-400 to-yellow-500 text-slate-900 shadow-yellow-200',
    'from-cyan-400 to-blue-600 text-white shadow-cyan-200',
    'from-fuchsia-400 to-pink-500 text-white shadow-fuchsia-200'
  ];

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header & Breadcrumbs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span className="cursor-pointer hover:text-emerald-600" onClick={resetStepWizard}>Lesson Plans</span>
          {selectedBoard && <span>/</span>}
          {selectedBoard && <span className="cursor-pointer hover:text-emerald-600" onClick={() => updateRouteUrl(selectedBoard, '', '', 1)}>{selectedBoard}</span>}
          {selectedClass && <span>/</span>}
          {selectedClass && <span className="cursor-pointer hover:text-emerald-600" onClick={() => updateRouteUrl(selectedBoard, selectedClass, '', 2)}>{selectedClass}</span>}
          {selectedSubject && <span>/</span>}
          {selectedSubject && <span className="cursor-pointer hover:text-emerald-600" onClick={() => updateRouteUrl(selectedBoard, selectedClass, selectedSubject, 4, undefined, 'ALL')}>{selectedSubject}</span>}
          {selectedUnit !== 'ALL' && <span>/</span>}
          {selectedUnit !== 'ALL' && <span className="text-slate-800 font-bold">Unit {selectedUnit}</span>}
        </div>

        {selectedPlanModal ? (
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                {selectedPlanModal.grade || selectedClass || 'CLASS'} LESSON PLAN
              </span>
              <span className="text-xs font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-full border border-sky-200">
                {selectedPlanModal.subject || 'General'}
              </span>
              {selectedPlanModal.unit && (
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
                  Unit {selectedPlanModal.unit}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 leading-tight">
              {selectedPlanModal.title || `${selectedPlanModal.subject} Lesson Plan`}
            </h1>
          </div>
        ) : (
          <div className="text-center py-4">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 inline-block relative">
              <span className="text-emerald-600 border-b-4 border-emerald-600 pb-1">Teacher</span> Lesson Plans
            </h1>
            <p className="text-slate-500 text-sm mt-2 max-w-2xl mx-auto">
              Ready-to-use structured lesson plans, SLO-based teaching guides, learning objectives, and classroom activity sheets.
            </p>
            {(selectedBoard || selectedClass || selectedSubject) && (
              <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-sm font-black uppercase text-slate-700 tracking-wider">
                {selectedBoard && <span className="bg-slate-100 px-2.5 py-1 rounded-lg">🏛️ {selectedBoard}</span>}
                {selectedBoard && selectedClass && <span>›</span>}
                {selectedClass && <span className="bg-slate-100 px-2.5 py-1 rounded-lg">🎓 {selectedClass}</span>}
                {selectedClass && selectedSubject && <span>›</span>}
                {selectedSubject && <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg">📖 {selectedSubject}</span>}
                {selectedUnit !== 'ALL' && <span>›</span>}
                {selectedUnit !== 'ALL' && <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg">📑 Unit {selectedUnit}</span>}
                <button onClick={resetStepWizard} className="ml-3 text-xs text-rose-500 hover:underline normal-case font-bold">(Reset All)</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* PLAN DETAIL VIEW */}
      {selectedPlanModal ? (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex justify-between items-center">
            <div>
              <h3 className="font-bold text-slate-800 text-base">{selectedPlanModal.title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{selectedPlanModal.grade} • {selectedPlanModal.subject} • Teaching Guide</p>
            </div>
            <button 
              onClick={closePlanModal}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all"
            >
              ← Back to List
            </button>
          </div>

          {selectedPlanModal.fileUrl && (
            <div className="w-full h-[650px] bg-slate-900 rounded-3xl overflow-hidden shadow-xl border border-slate-800">
              <iframe
                src={selectedPlanModal.fileUrl?.includes('drive.google.com') ? selectedPlanModal.fileUrl.replace('/view', '/preview') : selectedPlanModal.fileUrl}
                className="w-full h-full border-0"
                title="Lesson Plan Document Viewer"
              />
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
                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Step 1</span>
                <h2 className="text-xl font-bold text-slate-800 mt-2">Select Board / Curriculum</h2>
                <p className="text-xs text-slate-400 mt-1">Select educational board to view classes</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                <button
                  onClick={() => updateRouteUrl('', '', '', 2)}
                  className="p-6 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-black text-lg shadow-lg shadow-emerald-200 hover:scale-105 transition-all text-center"
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
                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Step 2</span>
                <h2 className="text-xl font-bold text-slate-800 mt-2">Select Class / Level</h2>
                <button onClick={() => updateRouteUrl(selectedBoard, '', '', 1)} className="text-xs text-slate-500 underline hover:text-slate-800 mt-1">← Change Board ({selectedBoard || 'All'})</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                {availableClasses.map((cls, idx) => (
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
                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">Step 3</span>
                <h2 className="text-xl font-bold text-slate-800 mt-2">Select Subject</h2>
                <button onClick={() => updateRouteUrl(selectedBoard, selectedClass, '', 2)} className="text-xs text-slate-500 underline hover:text-slate-800 mt-1">← Change Class ({selectedClass})</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {availableSubjects.map((sub, idx) => (
                  <button
                    key={sub}
                    onClick={() => updateRouteUrl(selectedBoard, selectedClass, sub, 4, undefined, 'ALL')}
                    className={`p-5 rounded-2xl bg-gradient-to-r ${pillColors[idx % pillColors.length]} font-black text-base tracking-wide shadow-md hover:scale-105 transition-all text-center uppercase`}
                  >
                    {sub}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 4: Lazy Loaded Subject Lesson Plans */}
          {(currentStep === 4 || (selectedBoard && selectedClass && selectedSubject)) && (
            <div className="space-y-6 mt-4">
              <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm space-y-4">
                <div className="flex flex-col md:flex-row gap-3 justify-between items-center">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                      type="text" 
                      placeholder={`Search ${selectedSubject || ''} lesson plans...`} 
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-50 rounded-2xl border border-slate-200 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none text-sm transition-all"
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
                  
                  <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                    <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-bold text-slate-600">
                      <button
                        onClick={() => setViewMode('INFINITE')}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                          viewMode === 'INFINITE' ? 'bg-white text-emerald-600 shadow-sm font-black' : 'hover:text-slate-900'
                        }`}
                      >
                        <ArrowDownCircle size={14} />
                        <span>Auto-Scroll</span>
                      </button>
                      <button
                        onClick={() => setViewMode('PAGINATED')}
                        className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                          viewMode === 'PAGINATED' ? 'bg-white text-emerald-600 shadow-sm font-black' : 'hover:text-slate-900'
                        }`}
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

                {/* Chapter / Unit Filter */}
                {availableUnits.length > 0 && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1">
                        <BookOpen size={13} className="text-emerald-600" /> Filter By Chapter / Unit:
                      </span>
                      {selectedUnit !== 'ALL' && (
                        <button onClick={() => setSelectedUnit('ALL')} className="text-[11px] font-bold text-rose-500 hover:underline">
                          Clear Unit
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5">
                      <button
                        onClick={() => setSelectedUnit('ALL')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                          selectedUnit === 'ALL' ? 'bg-slate-900 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
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
                              ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white shadow-md shadow-emerald-200'
                              : 'bg-emerald-50 text-emerald-900 hover:bg-emerald-100 border border-emerald-200/50'
                          }`}
                        >
                          <span>{unitItem.label}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                            selectedUnit === unitItem.unit ? 'bg-white/30 text-white' : 'bg-emerald-200 text-emerald-900'
                          }`}>
                            {unitItem.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Loading Indicator */}
              {isLoading && (
                <div className="py-20 flex flex-col items-center justify-center space-y-4">
                  <Loader2 size={40} className="text-emerald-600 animate-spin" />
                  <p className="text-sm font-bold text-slate-700 animate-pulse">
                    Loading {selectedSubject || ''} Lesson Plans for {selectedClass || 'your class'}...
                  </p>
                </div>
              )}

              {/* Plans Grid */}
              {!isLoading && displayedPlans.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                  {displayedPlans.map(plan => (
                    <div
                      key={plan.id}
                      onClick={() => handleOpenPlan(plan, false)}
                      className="p-5 bg-white rounded-3xl border border-slate-200/80 hover:border-emerald-400 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between text-center group cursor-pointer relative hover:-translate-y-1"
                    >
                      <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                        <GraduationCap size={24} />
                      </div>
                      <h4 className="font-black text-slate-900 text-sm group-hover:text-emerald-600 transition-colors line-clamp-2">{plan.title}</h4>
                      <p className="text-[11px] text-slate-400 font-semibold uppercase mt-1 tracking-wider">{plan.grade || selectedClass} • {plan.subject}</p>
                      
                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenPlan(plan, false); }}
                          className="text-xs font-black text-emerald-600 hover:underline"
                        >
                          View Plan
                        </button>
                        <span className="text-slate-300">•</span>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleOpenPlan(plan, true); }}
                          className="text-xs font-black text-teal-600 hover:underline"
                        >
                          New Tab ↗
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Infinite Scroll Load More */}
              {!isLoading && viewMode === 'INFINITE' && visibleCount < totalFilteredCount && (
                <div ref={loadMoreRef} className="py-8 text-center">
                  <button
                    onClick={handleLoadMore}
                    disabled={isLoadingMore}
                    className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl font-black text-xs uppercase tracking-wider shadow-lg shadow-emerald-200 flex items-center gap-2 mx-auto"
                  >
                    {isLoadingMore ? <Loader2 size={16} className="animate-spin" /> : <ArrowDownCircle size={16} />}
                    <span>Load More Lesson Plans ({totalFilteredCount - visibleCount} remaining)</span>
                  </button>
                </div>
              )}

              {!isLoading && !error && stepNotes.length === 0 && (
                <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
                  <FileText size={48} className="mx-auto mb-3 opacity-20" />
                  <p className="font-bold text-slate-600">No lesson plans found for {selectedSubject || 'this selection'}.</p>
                  <button onClick={resetStepWizard} className="mt-4 text-xs font-bold text-emerald-600 hover:underline">Reset filters and start over</button>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default LessonPlans;
