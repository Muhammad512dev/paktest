import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileText, Download, Filter, BookOpen, Layers, GraduationCap, ArrowRight } from 'lucide-react';
import { getNotes, getPublicCurriculum } from '../../services/dataService';
import { Syllabus, ClassLevel } from '../../types';

const LessonPlans: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [curriculum, setCurriculum] = useState<{ syllabuses: Syllabus[]; classes: ClassLevel[] }>({
    syllabuses: [],
    classes: []
  });

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedPlanModal, setSelectedPlanModal] = useState<any | null>(null);

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
        board: selectedBoard,
        grade: selectedClass,
        noteType: 'Lesson Plan'
      });
      setNotes(Array.isArray(data) ? data : []);
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm, selectedBoard, selectedClass]);

  // Extract boards from curriculum or notes
  const availableBoards = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    if (curriculum.syllabuses.length > 0) {
      curriculum.syllabuses.forEach(s => list.push({ id: s.name, name: s.name }));
    } else {
      notes.forEach(n => {
        if (n.board && !list.some(b => b.name.toLowerCase() === n.board.toLowerCase())) {
          list.push({ id: n.board, name: n.board });
        }
      });
    }
    return list;
  }, [curriculum.syllabuses, notes]);

  // Extract classes
  const availableClasses = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    if (curriculum.classes.length > 0) {
      curriculum.classes.forEach(c => {
        if (!list.some(item => item.name.toLowerCase() === c.name.toLowerCase())) {
          list.push({ id: c.name, name: c.name });
        }
      });
    } else {
      notes.forEach(n => {
        if (n.grade && !list.some(c => c.name.toLowerCase() === n.grade.toLowerCase())) {
          list.push({ id: n.grade, name: n.grade });
        }
      });
    }
    return list;
  }, [curriculum.classes, notes]);

  // Extract subjects
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    notes.forEach(n => {
      if (n.subject) set.add(n.subject);
    });
    if (set.size === 0) {
      ['Mathematics', 'Physics', 'Chemistry', 'Biology', 'Computer Science', 'English', 'Urdu', 'Islamiyat'].forEach(s => set.add(s));
    }
    return Array.from(set);
  }, [notes]);

  const stepNotes = useMemo(() => {
    return notes.filter(n => {
      if (selectedBoard && n.board && n.board.toLowerCase() !== selectedBoard.toLowerCase()) return false;
      if (selectedClass && n.grade && n.grade.toLowerCase() !== selectedClass.toLowerCase()) return false;
      if (selectedSubject && n.subject && n.subject.toLowerCase() !== selectedSubject.toLowerCase()) return false;
      return true;
    });
  }, [notes, selectedBoard, selectedClass, selectedSubject]);

  // Dynamic URL Sync effect for Lesson Plans
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const board = params.get('board') || '';
      const cls = params.get('class') || '';
      const subject = params.get('subject') || '';
      const step = parseInt(params.get('step') || '1', 10);
      const planId = params.get('planId');

      setSelectedBoard(board);
      setSelectedClass(cls);
      setSelectedSubject(subject);
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

  const updateRouteUrl = (newBoard: string, newClass: string, newSubject: string, newStep: number, planId?: string) => {
    setSelectedBoard(newBoard);
    setSelectedClass(newClass);
    setSelectedSubject(newSubject);
    setCurrentStep(newStep);

    const params = new URLSearchParams();
    if (newBoard) params.set('board', newBoard);
    if (newClass) params.set('class', newClass);
    if (newSubject) params.set('subject', newSubject);
    if (newStep > 1) params.set('step', newStep.toString());
    if (planId) params.set('planId', planId);

    const queryString = params.toString();
    const newPath = queryString ? `/lesson_plans?${queryString}` : '/lesson_plans';
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
      window.open(`/lesson_plans?${params.toString()}`, '_blank');
    } else {
      setSelectedPlanModal(plan);
      updateRouteUrl(selectedBoard, selectedClass, selectedSubject, currentStep, plan.id);
    }
  };

  const closePlanModal = () => {
    setSelectedPlanModal(null);
    updateRouteUrl(selectedBoard, selectedClass, selectedSubject, currentStep);
  };

  const resetWizard = () => {
    setSelectedBoard('');
    setSelectedClass('');
    setSelectedSubject('');
    setCurrentStep(1);
    setSelectedPlanModal(null);
    window.history.pushState(null, '', '/lesson_plans');
  };

  const pillColors = [
    'from-sky-400 to-blue-500 text-white shadow-sky-200',
    'from-emerald-400 to-green-600 text-white shadow-emerald-200',
    'from-cyan-400 to-blue-600 text-white shadow-cyan-200',
    'from-amber-300 to-orange-400 text-slate-900 shadow-amber-200',
    'from-indigo-400 to-purple-600 text-white shadow-purple-200',
    'from-teal-400 to-cyan-600 text-white shadow-teal-200',
  ];

  return (
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
      {/* Header & Breadcrumbs */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span className="cursor-pointer hover:text-indigo-600" onClick={resetWizard}>Lesson Plans</span>
          {selectedBoard && <span>/</span>}
          {selectedBoard && <span className="cursor-pointer hover:text-indigo-600" onClick={() => updateRouteUrl(selectedBoard, '', '', 1)}>{selectedBoard}</span>}
          {selectedClass && <span>/</span>}
          {selectedClass && <span className="cursor-pointer hover:text-indigo-600" onClick={() => updateRouteUrl(selectedBoard, selectedClass, '', 2)}>{selectedClass} Plans</span>}
          {selectedSubject && <span>/</span>}
          {selectedSubject && <span className="text-slate-800 font-bold">{selectedSubject}</span>}
        </div>

        {selectedPlanModal ? (
          <div>
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              LESSON PLAN • {selectedPlanModal.grade || selectedClass || 'GENERAL'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 leading-tight">
              {selectedPlanModal.title || `${selectedPlanModal.subject} Lesson Plan`}
            </h1>
            {selectedPlanModal.author && (
              <p className="text-xs text-slate-500 font-medium mt-1">Author / Curriculum: {selectedPlanModal.author}</p>
            )}
          </div>
        ) : (
          <div className="text-center py-4">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 inline-block relative">
              <span className="text-indigo-600 border-b-4 border-indigo-600 pb-1">Lesson</span> Plans & Curriculum Guide
            </h1>
            {(selectedBoard || selectedClass || selectedSubject) && (
              <div className="mt-4 flex items-center justify-center gap-2 text-sm font-black uppercase text-slate-700 tracking-wider">
                {selectedBoard && <span>🏛️ {selectedBoard}</span>}
                {selectedBoard && selectedClass && <span>›</span>}
                {selectedClass && <span>🎓 {selectedClass}</span>}
                {selectedClass && selectedSubject && <span>›</span>}
                {selectedSubject && <span>📖 {selectedSubject}</span>}
                <button onClick={resetWizard} className="ml-3 text-xs text-rose-500 hover:underline normal-case font-bold">(Reset)</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ACTIVE PLAN VIEW */}
      {selectedPlanModal ? (
        <div className="space-y-8">
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Lesson Plan Overview & Objectives</h3>
              <button 
                onClick={closePlanModal}
                className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                ← Back to Plans List
              </button>
            </div>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line font-medium">
              {selectedPlanModal.description || selectedPlanModal.content || `Structured teacher lesson plan, learning outcomes, topic breakdown and teaching methodology for ${selectedPlanModal.subject || 'this subject'} (${selectedPlanModal.grade || 'General'}). Designed for classroom instruction and curriculum mapping.`}
            </p>
          </div>

          {/* Embedded File / PDF Viewer */}
          {selectedPlanModal.fileUrl ? (
            <div className="bg-slate-900 rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center font-bold">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{selectedPlanModal.title}</h4>
                    <p className="text-[11px] text-slate-400">Lesson Plan Document • {selectedPlanModal.subject}</p>
                  </div>
                </div>

                <a
                  href={selectedPlanModal.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:scale-105"
                >
                  <span>Open File / Drive Link</span>
                  <span className="text-base">➔</span>
                </a>
              </div>

              <div className="w-full h-[650px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-800">
                <iframe
                  src={selectedPlanModal.fileUrl?.includes('drive.google.com') ? selectedPlanModal.fileUrl.replace('/view', '/preview') : selectedPlanModal.fileUrl}
                  className="w-full h-full border-0"
                  title="Lesson Plan Viewer"
                />
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-indigo-50 border border-indigo-200 text-indigo-900 rounded-3xl font-bold">
              Lesson plan document link unavailable. Please read the topic details above.
            </div>
          )}
        </div>
      ) : (
        /* STEP WIZARD */
        <>
          {currentStep === 1 && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="text-center mb-6">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Step 1</span>
                <h2 className="text-xl font-bold text-slate-800 mt-2">Select Board / Syllabus</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
                <button
                  onClick={() => updateRouteUrl('', '', '', 2)}
                  className="p-6 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-black text-lg shadow-lg hover:scale-105 transition-all text-center"
                >
                  ALL BOARDS
                </button>
                {availableBoards.map((board, idx) => (
                  <button
                    key={board.id}
                    onClick={() => updateRouteUrl(board.name, '', '', 2)}
                    className={`p-6 rounded-2xl bg-gradient-to-r ${pillColors[idx % pillColors.length]} font-black text-lg shadow-lg hover:scale-105 transition-all text-center`}
                  >
                    {board.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="text-center mb-6">
                <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Step 2</span>
                <h2 className="text-xl font-bold text-slate-800 mt-2">Select Class / Grade</h2>
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

          {(currentStep === 4 || (selectedBoard && selectedClass && selectedSubject)) && (
            <div className="space-y-8 mt-4">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative flex-1 w-full md:max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    type="text" 
                    placeholder="Search lesson plans..." 
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
                <button onClick={resetWizard} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
                  Change Selection
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
                {stepNotes.map(plan => (
                  <div
                    key={plan.id}
                    onClick={() => handleOpenPlan(plan, false)}
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 shadow-sm hover:shadow-xl transition-all flex flex-col items-center justify-center text-center group cursor-pointer relative"
                  >
                    <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <FileText size={22} />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-2">{plan.title || `${plan.subject} Lesson Plan`}</h4>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase mt-1 tracking-wider">{plan.grade || selectedClass} • {plan.subject}</p>
                    <div className="mt-3 flex items-center justify-center gap-2">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenPlan(plan, false); }}
                        className="inline-flex items-center gap-1 text-[11px] font-black text-indigo-600 hover:underline"
                      >
                        <span>View Plan</span>
                      </button>
                      <span className="text-slate-300">•</span>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleOpenPlan(plan, true); }}
                        className="inline-flex items-center gap-1 text-[11px] font-black text-purple-600 hover:underline"
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
                  <p className="font-bold text-slate-600">No lesson plans uploaded yet for your selection.</p>
                  <button onClick={resetWizard} className="mt-4 text-xs font-bold text-indigo-600 hover:underline">Reset filters and start over</button>
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
