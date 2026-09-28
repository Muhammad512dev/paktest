
import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, XCircle, RefreshCw, ArrowRight, Settings, BookOpen, Layers, Filter, Hash, Play, Award, CheckSquare, AlertCircle, GraduationCap, X, Languages } from 'lucide-react';
import { getPublicCurriculum, generatePublicQuiz } from '../../services/dataService';
import { Syllabus, ClassLevel, Subject } from '../../types';
import MathRenderer from '../MathRenderer';

const ALL_SOURCES = [
  'Textbook Exercise',
  'Past Paper',
  'ECAT/Entry Test',
  'Conceptual',
  'Model Paper',
  'Board Exam',
  'Guess Paper',
  'Pre-Board Exam',
  'Unit Test'
];

const Quiz: React.FC = () => {
  const [view, setView] = useState<'SETUP' | 'QUIZ' | 'RESULT'>('SETUP');
  const [isLoading, setIsLoading] = useState(false);
  
  // Data from Backend
  const [curriculum, setCurriculum] = useState<{
      syllabuses: Syllabus[], 
      classes: ClassLevel[], 
      subjects: Subject[], 
      chapters: any[], 
      sources: any[] 
  }>({ syllabuses: [], classes: [], subjects: [], chapters: [], sources: [] });

  // Configuration State (IDs)
  const [config, setConfig] = useState({
    syllabusId: '',
    classId: '',
    subjectId: '',
    chapterId: '',
    level: 'All' as 'All' | 'Easy' | 'Medium' | 'Hard',
    sources: [] as string[],
    count: 10,
    medium: 'Bilingual' as 'English' | 'Urdu' | 'Bilingual'
  });

  useEffect(() => {
    const load = async () => {
        const data = await getPublicCurriculum();
        setCurriculum(data);
    };
    load();
  }, []);

  // Filtered Options based on Selection
  const filteredClasses = useMemo(() => {
      return curriculum.classes.filter(c => !config.syllabusId || c.syllabusId === config.syllabusId);
  }, [curriculum.classes, config.syllabusId]);

  const filteredSubjects = useMemo(() => {
      return curriculum.subjects.filter(s => !config.classId || s.classId === config.classId);
  }, [curriculum.subjects, config.classId]);

  const filteredChapters = useMemo(() => {
      return curriculum.chapters.filter(c => !config.subjectId || c.subjectId === config.subjectId);
  }, [curriculum.chapters, config.subjectId]);

  // Quiz Runtime State
  const [questions, setQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, number>>({}); 
  const [score, setScore] = useState(0);

  const toggleSource = (sourceName: string) => {
      setConfig(prev => {
          const current = prev.sources;
          if (current.includes(sourceName)) {
              return { ...prev, sources: current.filter(s => s !== sourceName) };
          } else {
              return { ...prev, sources: [...current, sourceName] };
          }
      });
  };

  const handleGenerateQuiz = async () => {
    setIsLoading(true);
    
    // Resolve names for backend API
    const boardName = curriculum.syllabuses.find(s => s.id === config.syllabusId)?.name || '';
    const className = curriculum.classes.find(c => c.id === config.classId)?.name || '';
    const subjectName = curriculum.subjects.find(s => s.id === config.subjectId)?.name || '';
    const chapterName = curriculum.chapters.find(c => c.id === config.chapterId)?.name || '';

    let newQuestions = await generatePublicQuiz({
        board: boardName,
        grade: className,
        subject: subjectName,
        chapter: chapterName,
        sources: config.sources,
        count: config.count,
        medium: config.medium
    });

    if (newQuestions && newQuestions.length > 0 && config.level !== 'All') {
        const filtered = newQuestions.filter((q: any) => String(q.difficulty || '').toLowerCase() === config.level.toLowerCase());
        if (filtered.length > 0) newQuestions = filtered;
    }
    
    if (newQuestions && newQuestions.length > 0) {
        setQuestions(newQuestions);
        setUserAnswers({});
        setView('QUIZ');
        setScore(0);
        window.scrollTo(0, 0);
    } else {
        alert("No questions found for the selected criteria. Please try different options.");
    }
    setIsLoading(false);
  };

  const handleOptionSelect = (qId: string, optionIdx: number) => {
    setUserAnswers(prev => ({
      ...prev,
      [qId]: optionIdx
    }));
  };

  const handleSubmitQuiz = () => {
    let calculatedScore = 0;
    const normalize = (v: any) => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');
    questions.forEach(q => {
      const userAnsIdx = userAnswers[q.id];
      if (userAnsIdx !== undefined && q.options) {
          let correctIdx = -1;
          const correctKey = normalize(q.correctAnswer);
          const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
          const correctLetterIdx = letters.indexOf(correctKey);
          if (correctLetterIdx !== -1 && q.options[correctLetterIdx]) {
              correctIdx = correctLetterIdx;
          } else {
              correctIdx = q.options.findIndex((opt: string) => normalize(opt) === correctKey);
          }
          if (userAnsIdx === correctIdx) {
              calculatedScore += 1;
          }
      }
    });
    setScore(calculatedScore);
    setView('RESULT');
    window.scrollTo(0, 0);
  };

  const reset = () => {
    setView('SETUP');
    setQuestions([]);
    setUserAnswers({});
    setScore(0);
  };

  const answeredCount = Object.keys(userAnswers).length;
  const progress = Math.round((answeredCount / questions.length) * 100);

  return (
    <div className="py-16 max-w-4xl mx-auto px-6">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0B192C] border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
          <span>🎯</span> Interactive Board-Standard MCQ Bench
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-slate-900 dark:text-white mb-2 tracking-tight font-serif">
          {view === 'SETUP' ? 'Interactive Board Quiz' : view === 'QUIZ' ? `Live Exam Simulation` : 'Performance Result Card'}
        </h1>
        <p className="text-slate-600 dark:text-slate-300 text-sm sm:text-base font-medium">
          {view === 'SETUP' ? 'Select your board, class, and chapters to practice authentic MCQs with instant scoring.' : view === 'QUIZ' ? 'Focused board examination testing environment.' : 'Detailed breakdown of your accuracy and correct answers.'}
        </p>
      </div>

      {/* SETUP VIEW */}
      {view === 'SETUP' && (
        <div className="bg-white dark:bg-[#0B192C] rounded-[2.5rem] border border-slate-200 dark:border-amber-500/20 shadow-2xl p-8 md:p-12 relative overflow-hidden transition-all">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 dark:text-amber-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <BookOpen size={14} /> Board / Syllabus
                </label>
                <select 
                  value={config.syllabusId}
                  onChange={(e) => setConfig({...config, syllabusId: e.target.value, classId: '', subjectId: '', chapterId: ''})}
                  className="w-full p-4 bg-slate-50 dark:bg-[#071326] border border-slate-200 dark:border-amber-500/20 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 dark:text-white transition-all cursor-pointer"
                >
                  <option value="" className="bg-[#071326] text-white">Select Board / Syllabus...</option>
                  {curriculum.syllabuses.map(s => <option key={s.id} value={s.id} className="bg-[#071326] text-white">{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 dark:text-amber-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <GraduationCap size={14} /> Grade / Class
                </label>
                <select 
                  value={config.classId}
                  onChange={(e) => setConfig({...config, classId: e.target.value, subjectId: '', chapterId: ''})}
                  className="w-full p-4 bg-slate-50 dark:bg-[#071326] border border-slate-200 dark:border-amber-500/20 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 dark:text-white transition-all cursor-pointer disabled:opacity-50"
                  disabled={!config.syllabusId}
                >
                  <option value="" className="bg-[#071326] text-white">Select Grade / Class...</option>
                  {filteredClasses.map(c => <option key={c.id} value={c.id} className="bg-[#071326] text-white">{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 dark:text-amber-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <BookOpen size={14} /> Subject
                </label>
                <select 
                  value={config.subjectId}
                  onChange={(e) => setConfig({...config, subjectId: e.target.value, chapterId: ''})}
                  className="w-full p-4 bg-slate-50 dark:bg-[#071326] border border-slate-200 dark:border-amber-500/20 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 dark:text-white transition-all cursor-pointer disabled:opacity-50"
                  disabled={!config.classId}
                >
                  <option value="" className="bg-[#071326] text-white">Select Subject...</option>
                  {filteredSubjects.map(s => <option key={s.id} value={s.id} className="bg-[#071326] text-white">{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-slate-500 dark:text-amber-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Layers size={14} /> Sequence / Chapter
                </label>
                <select 
                  value={config.chapterId}
                  onChange={(e) => setConfig({...config, chapterId: e.target.value})}
                  className="w-full p-4 bg-slate-50 dark:bg-[#071326] border border-slate-200 dark:border-amber-500/20 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 dark:text-white transition-all cursor-pointer disabled:opacity-50"
                  disabled={!config.subjectId}
                >
                  <option value="" className="bg-[#071326] text-white">General / All Chapters</option>
                  {filteredChapters.map(c => <option key={c.id} value={c.id} className="bg-[#071326] text-white">{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-slate-500 dark:text-amber-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Award size={14} /> Difficulty Level
                </label>
                <div className="grid grid-cols-4 gap-3">
                  {['All', 'Easy', 'Medium', 'Hard'].map((lvl) => (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setConfig({...config, level: lvl as any})}
                      className={`p-3 rounded-xl border font-bold text-xs uppercase tracking-wide transition-all ${
                        config.level === lvl
                          ? 'bg-amber-500 text-slate-950 font-black border-amber-500 shadow-md'
                          : 'bg-slate-50 dark:bg-[#071326] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-amber-500/20 hover:border-amber-500/50'
                      }`}
                    >
                      {lvl === 'All' ? '⚡ All Levels' : lvl}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-slate-500 dark:text-amber-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Languages size={14} /> Language Medium
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {['English', 'Urdu', 'Bilingual'].map((medium) => (
                        <button
                            key={medium}
                            type="button"
                            onClick={() => setConfig({...config, medium: medium as any})}
                            className={`p-3 rounded-xl border font-bold text-xs uppercase tracking-wide transition-all ${
                                config.medium === medium 
                                ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black border-amber-500 shadow-md' 
                                : 'bg-slate-50 dark:bg-[#071326] text-slate-600 dark:text-slate-300 border-slate-200 dark:border-amber-500/20 hover:border-amber-500/50'
                            }`}
                        >
                            {medium}
                        </button>
                    ))}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-slate-500 dark:text-amber-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Filter size={14} /> Question Scope / Sources
                </label>
                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 dark:bg-[#071326] border border-slate-200 dark:border-amber-500/20 rounded-2xl min-h-[80px]">
                    {ALL_SOURCES.map(src => {
                        const isSelected = config.sources.includes(src);
                        return (
                            <button
                                key={src}
                                onClick={() => toggleSource(src)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1 ${
                                    isSelected 
                                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-sm' 
                                    : 'bg-white dark:bg-[#0B192C] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-amber-500/10 hover:border-amber-500/30'
                                }`}
                            >
                                {src}
                                {isSelected && <X size={10} />}
                            </button>
                        );
                    })}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-xs font-black text-slate-500 dark:text-amber-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Hash size={14} /> Number of Questions
                </label>
                <input 
                  type="number" 
                  min="1" 
                  max="50"
                  value={config.count}
                  onChange={(e) => {
                    let val = parseInt(e.target.value) || 0;
                    if (val > 50) val = 50;
                    if (val < 0) val = 1;
                    setConfig({...config, count: val});
                  }}
                  className="w-full p-4 bg-slate-50 dark:bg-[#071326] border border-slate-200 dark:border-amber-500/20 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 font-bold text-slate-900 dark:text-white transition-all text-sm"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-200 dark:border-amber-500/20">
              <button 
                onClick={handleGenerateQuiz}
                disabled={isLoading}
                className="w-full py-5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-500/20 hover:scale-[1.01] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <RefreshCw className="animate-spin" /> : <Play size={20} fill="currentColor" />} 
                {isLoading ? 'Retrieving Question Bank...' : 'Start Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUIZ VIEW - LIST WISE */}
      {view === 'QUIZ' && questions.length > 0 && (
        <div className="space-y-6">
          {/* Progress Header */}
          <div className="sticky top-20 z-30 bg-white/95 dark:bg-[#0B192C]/95 backdrop-blur-md p-4 rounded-2xl border border-slate-200 dark:border-amber-500/30 shadow-xl mb-8 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-amber-50 dark:bg-amber-950/40 text-amber-500 rounded-xl flex items-center justify-center border border-amber-500/30">
                   <CheckSquare size={24} />
                </div>
                <div>
                   <h4 className="font-bold text-slate-900 dark:text-white text-sm">Attempting Exam Questions</h4>
                   <p className="text-xs text-slate-500 dark:text-slate-400">{answeredCount} of {questions.length} Questions Answered</p>
                </div>
             </div>
             <div className="w-32 bg-slate-100 dark:bg-[#071326] rounded-full h-3 overflow-hidden border border-slate-200 dark:border-amber-500/20">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
             </div>
          </div>

          {/* Question List */}
          <div className="space-y-6">
            {questions.map((q, qIndex) => (
              <div key={q.id} className="bg-white dark:bg-[#0B192C] rounded-3xl border border-slate-200 dark:border-amber-500/20 p-6 md:p-8 shadow-sm hover:shadow-lg transition-all">
                <div className="flex justify-between items-start mb-6">
                   <div className="flex gap-4">
                      <span className="w-8 h-8 bg-amber-50 dark:bg-[#071326] text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                        {qIndex + 1}
                      </span>
                      <div>
                        {/* Display based on medium preference */}
                        {(config.medium === 'English' || config.medium === 'Bilingual') && q.text && (
                            <h3 className="font-bold text-lg text-slate-900 dark:text-white leading-snug">
                               <MathRenderer text={q.text} />
                            </h3>
                        )}
                        {(config.medium === 'Urdu' || config.medium === 'Bilingual') && q.textUrdu && (
                            <div className="text-right font-urdu text-xl mt-2 text-slate-800 dark:text-slate-200 leading-loose" dir="rtl">
                               <MathRenderer text={q.textUrdu} dir="rtl" />
                            </div>
                        )}
                        {q.imageUrl && (
                            <div className="mt-4 flex justify-center">
                               <img src={q.imageUrl} alt="Question diagram" className="max-w-full max-h-[400px] object-contain rounded-xl border border-slate-200 dark:border-amber-500/20" />
                            </div>
                        )}
                        <div className="flex gap-2 mt-3">
                           <span className="text-[10px] font-bold bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 px-2.5 py-1 rounded-md border border-amber-200 dark:border-amber-500/30 uppercase tracking-wider">{q.source}</span>
                        </div>
                      </div>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pl-0 md:pl-12">
                  {q.options && q.options.map((opt: string, idx: number) => {
                    const isSelected = userAnswers[q.id] === idx;
                    return (
                      <button 
                        key={idx}
                        onClick={() => handleOptionSelect(q.id, idx)}
                        className={`text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center group ${
                          isSelected 
                            ? 'border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-slate-900 dark:text-white shadow-md ring-1 ring-amber-500' 
                            : 'border-slate-100 dark:border-amber-500/10 bg-white dark:bg-[#071326] text-slate-700 dark:text-slate-300 hover:border-amber-500/40'
                        }`}
                      >
                        <span className="flex items-center gap-3 w-full">
                          <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0 ${isSelected ? 'border-amber-500 bg-amber-500 text-slate-950 font-black' : 'border-slate-300 dark:border-slate-600 text-slate-400 group-hover:border-amber-400'}`}>
                            {String.fromCharCode(65+idx)}
                          </span>
                          <div className="flex flex-col w-full">
                             {(config.medium === 'English' || config.medium === 'Bilingual') && (
                                <span className="text-sm font-medium"><MathRenderer text={opt} inline /></span>
                             )}
                             {(config.medium === 'Urdu' || config.medium === 'Bilingual') && q.optionsUrdu && q.optionsUrdu[idx] && (
                                <span className="text-right font-urdu text-lg mt-1" dir="rtl"><MathRenderer text={q.optionsUrdu[idx]} inline dir="rtl" /></span>
                             )}
                          </div>
                        </span>
                        {isSelected && <CheckCircle2 size={18} className="text-amber-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Submit Action */}
          <div className="pt-8 flex flex-col items-center gap-4">
             {answeredCount < questions.length && (
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-4 py-2 rounded-lg border border-amber-200 dark:border-amber-500/30 text-sm font-bold">
                   <AlertCircle size={16} /> You have {questions.length - answeredCount} unanswered questions remaining.
                </div>
             )}
             <button 
                onClick={handleSubmitQuiz}
                className="px-12 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center gap-3 text-sm transform hover:scale-105 active:scale-95"
             >
                Submit Assessment <ArrowRight size={18} />
             </button>
          </div>
        </div>
      )}

      {/* RESULT VIEW */}
      {view === 'RESULT' && (
        <div className="bg-white dark:bg-[#0B192C] rounded-[2.5rem] border border-slate-200 dark:border-amber-500/20 shadow-2xl p-8 md:p-12">
          <div className="text-center mb-10">
            <div className="w-28 h-28 bg-gradient-to-br from-amber-400 to-amber-600 rounded-full flex items-center justify-center text-slate-950 mx-auto shadow-2xl shadow-amber-500/30 mb-6 ring-8 ring-amber-500/20">
                <Award size={56} />
            </div>
            
            <div className="space-y-2 mb-8">
                <h2 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight font-serif">Assessment Complete!</h2>
                <p className="text-slate-500 dark:text-slate-300 text-base">Detailed breakdown of your examination performance.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <div className="p-6 bg-slate-50 dark:bg-[#071326] rounded-2xl border border-slate-200 dark:border-amber-500/20">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Score</p>
                  <p className="text-4xl font-black text-amber-500 font-mono">{score} <span className="text-lg text-slate-400">/ {questions.length}</span></p>
                </div>
                <div className="p-6 bg-slate-50 dark:bg-[#071326] rounded-2xl border border-slate-200 dark:border-amber-500/20">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Accuracy</p>
                  <p className="text-4xl font-black text-emerald-500 font-mono">{questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}%</p>
                </div>
            </div>
          </div>

          <div className="border-t border-slate-200 dark:border-amber-500/20 pt-10">
             <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2"><CheckSquare className="text-amber-500"/> Detailed Question Review</h3>
             <div className="space-y-6">
                {questions.map((q, qIndex) => {
                    const userAnsIdx = userAnswers[q.id];
                    const normalize = (v: any) => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');
                    
                    let correctIdx = -1;
                    if (q.options) {
                        const correctKey = normalize(q.correctAnswer);
                        const letters = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
                        const correctLetterIdx = letters.indexOf(correctKey);
                        if (correctLetterIdx !== -1 && q.options[correctLetterIdx]) {
                            correctIdx = correctLetterIdx;
                        } else {
                            correctIdx = q.options.findIndex((opt: string) => normalize(opt) === correctKey);
                        }
                    }

                    const isCorrect = userAnsIdx === correctIdx;
                    const isSkipped = userAnsIdx === undefined;

                    return (
                        <div key={q.id} className={`p-6 rounded-2xl border-2 transition-all ${isCorrect ? 'border-emerald-500/30 bg-emerald-50/20 dark:bg-emerald-950/20' : 'border-rose-500/30 bg-rose-50/20 dark:bg-rose-950/20'}`}>
                            <div className="flex gap-4 mb-4">
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${isCorrect ? 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300' : 'bg-rose-100 dark:bg-rose-900/60 text-rose-700 dark:text-rose-300'}`}>
                                    {qIndex + 1}
                                </span>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-900 dark:text-white text-lg leading-snug">
                                       <MathRenderer text={q.text} />
                                    </h4>
                                    
                                    <div className="mt-4 space-y-2">
                                        {q.options && q.options.map((opt: string, idx: number) => {
                                            let optionClass = "border-slate-200 dark:border-slate-700 bg-white dark:bg-[#071326] text-slate-500 opacity-70";
                                            let icon = null;

                                            if (idx === correctIdx) {
                                                optionClass = "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300 font-bold ring-1 ring-emerald-500 opacity-100";
                                                icon = <CheckCircle2 size={18} className="text-emerald-600 dark:text-emerald-400" />;
                                            } else if (idx === userAnsIdx) {
                                                optionClass = "border-rose-500 bg-rose-50 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 font-bold ring-1 ring-rose-500 opacity-100";
                                                icon = <XCircle size={18} className="text-rose-600 dark:text-rose-400" />;
                                            }

                                            return (
                                                <div key={idx} className={`flex justify-between items-center p-3 rounded-xl border-2 text-sm transition-all ${optionClass}`}>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs font-black opacity-50">{String.fromCharCode(65+idx)}</span>
                                                        <MathRenderer text={opt} inline />
                                                    </div>
                                                    {icon}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {isSkipped && (
                                        <div className="mt-3 flex items-center gap-2 text-amber-600 bg-amber-50 dark:bg-amber-950/50 px-3 py-2 rounded-lg border border-amber-200 dark:border-amber-500/30 text-xs font-bold w-fit">
                                            <AlertCircle size={14}/> Not Attempted
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
             </div>
          </div>

          <div className="flex justify-center gap-4 mt-12 pt-8 border-t border-slate-200 dark:border-amber-500/20">
            <button onClick={() => setView('SETUP')} className="px-8 py-3 bg-white dark:bg-[#071326] border-2 border-slate-200 dark:border-amber-500/20 text-slate-700 dark:text-slate-300 font-bold rounded-xl hover:border-amber-500 transition-all flex items-center gap-2 text-sm">
              <Settings size={18} /> New Configuration
            </button>
            <button onClick={reset} className="px-8 py-3 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-black rounded-xl hover:from-amber-400 hover:to-amber-500 transition-all flex items-center gap-2 shadow-lg shadow-amber-500/20 text-sm">
              <RefreshCw size={18} /> Restart Assessment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
