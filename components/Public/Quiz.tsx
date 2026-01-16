
import React, { useState, useEffect, useMemo } from 'react';
import { CheckCircle2, XCircle, RefreshCw, ArrowRight, Settings, BookOpen, Layers, Filter, Hash, Play, Award, CheckSquare, AlertCircle, GraduationCap, X, Languages } from 'lucide-react';
import { getPublicCurriculum, generatePublicQuiz } from '../../services/dataService';
import { Syllabus, ClassLevel, Subject } from '../../types';

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

    const newQuestions = await generatePublicQuiz({
        board: boardName,
        grade: className,
        subject: subjectName,
        chapter: chapterName,
        sources: config.sources,
        count: config.count,
        medium: config.medium
    });
    
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
    questions.forEach(q => {
      // Assuming 'q.correctAnswer' matches one of the options text or index logic.
      if (q.options && q.options[userAnswers[q.id]] === q.correctAnswer) {
        calculatedScore += 1;
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
    <div className="py-20 max-w-4xl mx-auto px-6">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black text-slate-900 mb-2">
          {view === 'SETUP' ? 'Configure Assessment' : view === 'QUIZ' ? `Quiz Mode` : 'Result Card'}
        </h1>
        <p className="text-slate-500">
          {view === 'SETUP' ? 'Customize your practice session parameters.' : view === 'QUIZ' ? 'Focused Practice Session' : 'Performance Summary'}
        </p>
      </div>

      {/* SETUP VIEW */}
      {view === 'SETUP' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-8 md:p-12 relative overflow-hidden transition-all animate-in fade-in zoom-in duration-300">
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <BookOpen size={12} /> Board / Syllabus
                </label>
                <select 
                  value={config.syllabusId}
                  onChange={(e) => setConfig({...config, syllabusId: e.target.value, classId: '', subjectId: '', chapterId: ''})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 transition-all cursor-pointer hover:bg-white"
                >
                  <option value="">Select Board...</option>
                  {curriculum.syllabuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <GraduationCap size={12} /> Grade / Class
                </label>
                <select 
                  value={config.classId}
                  onChange={(e) => setConfig({...config, classId: e.target.value, subjectId: '', chapterId: ''})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 transition-all cursor-pointer hover:bg-white"
                  disabled={!config.syllabusId}
                >
                  <option value="">Select Grade...</option>
                  {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <BookOpen size={12} /> Subject
                </label>
                <select 
                  value={config.subjectId}
                  onChange={(e) => setConfig({...config, subjectId: e.target.value, chapterId: ''})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 transition-all cursor-pointer hover:bg-white"
                  disabled={!config.classId}
                >
                  <option value="">Select Subject...</option>
                  {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Layers size={12} /> Sequence / Chapter
                </label>
                <select 
                  value={config.chapterId}
                  onChange={(e) => setConfig({...config, chapterId: e.target.value})}
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 transition-all cursor-pointer hover:bg-white"
                  disabled={!config.subjectId}
                >
                  <option value="">General / All Chapters</option>
                  {filteredChapters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Languages size={12} /> Language Medium
                </label>
                <div className="grid grid-cols-3 gap-3">
                    {['English', 'Urdu', 'Bilingual'].map((medium) => (
                        <button
                            key={medium}
                            onClick={() => setConfig({...config, medium: medium as any})}
                            className={`p-3 rounded-xl border font-bold text-xs uppercase tracking-wide transition-all ${
                                config.medium === medium 
                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg' 
                                : 'bg-white text-slate-500 border-slate-200 hover:bg-slate-50'
                            }`}
                        >
                            {medium}
                        </button>
                    ))}
                </div>
              </div>

              <div className="space-y-2 md:col-span-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Filter size={12} /> Source Material
                </label>
                <div className="flex flex-wrap gap-2 p-4 bg-slate-50 border border-slate-200 rounded-2xl min-h-[80px]">
                    {ALL_SOURCES.map(src => {
                        const isSelected = config.sources.includes(src);
                        return (
                            <button
                                key={src}
                                onClick={() => toggleSource(src)}
                                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border transition-all flex items-center gap-1 ${
                                    isSelected 
                                    ? 'bg-indigo-50 text-indigo-700 border-indigo-200 shadow-sm' 
                                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
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
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                  <Hash size={12} /> Question Count
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
                  className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-indigo-500 font-bold text-slate-700 transition-all"
                />
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100">
              <button 
                onClick={handleGenerateQuiz}
                disabled={isLoading}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? <RefreshCw className="animate-spin" /> : <Play size={20} fill="currentColor" />} 
                {isLoading ? 'Fetching Questions...' : 'Start Assessment'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* QUIZ VIEW - LIST WISE */}
      {view === 'QUIZ' && questions.length > 0 && (
        <div className="space-y-6 animate-in slide-in-from-bottom-8 duration-500">
          
          {/* Progress Header */}
          <div className="sticky top-20 z-30 bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-slate-200 shadow-lg mb-8 flex justify-between items-center">
             <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center">
                   <CheckSquare size={24} />
                </div>
                <div>
                   <h4 className="font-bold text-slate-900 text-sm">Attempting...</h4>
                   <p className="text-xs text-slate-500">{answeredCount} of {questions.length} Answered</p>
                </div>
             </div>
             <div className="w-32 bg-slate-100 rounded-full h-3 overflow-hidden">
                <div className="bg-indigo-600 h-full transition-all duration-500" style={{ width: `${progress}%` }}></div>
             </div>
          </div>

          {/* Question List */}
          <div className="space-y-6">
            {questions.map((q, qIndex) => (
              <div key={q.id} className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-sm hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-6">
                   <div className="flex gap-4">
                      <span className="w-8 h-8 bg-slate-100 text-slate-500 rounded-lg flex items-center justify-center font-bold text-sm shrink-0">
                        {qIndex + 1}
                      </span>
                      <div>
                        {/* Display based on medium preference */}
                        {(config.medium === 'English' || config.medium === 'Bilingual') && q.text && (
                            <h3 className="font-bold text-lg text-slate-900 leading-snug">{q.text}</h3>
                        )}
                        {(config.medium === 'Urdu' || config.medium === 'Bilingual') && q.textUrdu && (
                            <div className="text-right font-urdu text-xl mt-2 text-slate-700 leading-loose" dir="rtl">{q.textUrdu}</div>
                        )}
                        <div className="flex gap-2 mt-3">
                           <span className="text-[10px] font-bold bg-indigo-50 text-indigo-600 px-2 py-1 rounded border border-indigo-100 uppercase tracking-wider">{q.source}</span>
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
                            ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md ring-1 ring-indigo-600' 
                            : 'border-slate-100 bg-white text-slate-600 hover:border-indigo-200 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-3 w-full">
                          <span className={`w-6 h-6 rounded-full border-2 flex items-center justify-center text-[10px] font-bold shrink-0 ${isSelected ? 'border-indigo-600 bg-indigo-600 text-white' : 'border-slate-300 text-slate-400 group-hover:border-indigo-400'}`}>
                            {String.fromCharCode(65+idx)}
                          </span>
                          <div className="flex flex-col w-full">
                             {(config.medium === 'English' || config.medium === 'Bilingual') && (
                                <span className="text-sm font-medium">{opt}</span>
                             )}
                             {(config.medium === 'Urdu' || config.medium === 'Bilingual') && q.optionsUrdu && q.optionsUrdu[idx] && (
                                <span className="text-right font-urdu text-lg mt-1" dir="rtl">{q.optionsUrdu[idx]}</span>
                             )}
                          </div>
                        </span>
                        {isSelected && <CheckCircle2 size={18} className="text-indigo-600 shrink-0" />}
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
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 px-4 py-2 rounded-lg border border-amber-100 text-sm font-bold animate-pulse">
                   <AlertCircle size={16} /> You have {questions.length - answeredCount} unanswered questions.
                </div>
             )}
             <button 
                onClick={handleSubmitQuiz}
                className="px-12 py-4 bg-slate-900 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-600 shadow-xl shadow-slate-200 transition-all flex items-center gap-3 text-sm transform hover:scale-105 active:scale-95"
             >
                Submit Assessment <ArrowRight size={18} />
             </button>
          </div>
        </div>
      )}

      {/* RESULT VIEW */}
      {view === 'RESULT' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-2xl p-8 md:p-12 animate-in zoom-in duration-300">
          <div className="text-center mb-10">
            <div className="w-32 h-32 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white mx-auto shadow-2xl shadow-emerald-200 mb-6 ring-8 ring-emerald-50">
                <Award size={64} />
            </div>
            
            <div className="space-y-2 mb-8">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Assessment Complete!</h2>
                <p className="text-slate-500 text-lg">Detailed analysis of your performance.</p>
            </div>

            <div className="grid grid-cols-2 gap-4 max-w-sm mx-auto">
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Score</p>
                <p className="text-4xl font-black text-indigo-600">{score} <span className="text-lg text-slate-400">/ {questions.length}</span></p>
                </div>
                <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Accuracy</p>
                <p className="text-4xl font-black text-emerald-600">{questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}%</p>
                </div>
            </div>
          </div>

          <div className="border-t border-slate-100 pt-10">
             <h3 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2"><CheckSquare className="text-indigo-600"/> Detailed Analysis</h3>
             <div className="space-y-6">
                {questions.map((q, qIndex) => {
                    const userAnsIdx = userAnswers[q.id];
                    // Correct answer logic based on string comparison
                    const isCorrect = q.options && q.options[userAnsIdx] === q.correctAnswer;
                    const isSkipped = userAnsIdx === undefined;
                    
                    // Find correct index
                    const correctIdx = q.options ? q.options.indexOf(q.correctAnswer) : -1;

                    return (
                        <div key={q.id} className={`p-6 rounded-2xl border-2 transition-all ${isCorrect ? 'border-emerald-100 bg-emerald-50/30' : 'border-rose-100 bg-rose-50/30'}`}>
                            <div className="flex gap-4 mb-4">
                                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                    {qIndex + 1}
                                </span>
                                <div className="flex-1">
                                    <h4 className="font-bold text-slate-900 text-lg leading-snug">{q.text}</h4>
                                    
                                    <div className="mt-4 space-y-2">
                                        {q.options && q.options.map((opt: string, idx: number) => {
                                            let optionClass = "border-slate-200 bg-white text-slate-500 opacity-70";
                                            let icon = null;

                                            if (idx === correctIdx) {
                                                // Correct Answer (Always Highlight Green)
                                                optionClass = "border-emerald-500 bg-emerald-50 text-emerald-800 font-bold ring-1 ring-emerald-500 opacity-100";
                                                icon = <CheckCircle2 size={18} className="text-emerald-600" />;
                                            } else if (idx === userAnsIdx) {
                                                // User's Wrong Answer (Highlight Red)
                                                optionClass = "border-rose-500 bg-rose-50 text-rose-800 font-bold ring-1 ring-rose-500 opacity-100";
                                                icon = <XCircle size={18} className="text-rose-600" />;
                                            }

                                            return (
                                                <div key={idx} className={`flex justify-between items-center p-3 rounded-xl border-2 text-sm transition-all ${optionClass}`}>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-xs font-black opacity-50">{String.fromCharCode(65+idx)}</span>
                                                        <span>{opt}</span>
                                                    </div>
                                                    {icon}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {isSkipped && (
                                        <div className="mt-3 flex items-center gap-2 text-amber-600 bg-amber-50 px-3 py-2 rounded-lg border border-amber-100 text-xs font-bold w-fit">
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

          <div className="flex justify-center gap-4 mt-12 pt-8 border-t border-slate-100">
            <button onClick={() => setView('SETUP')} className="px-8 py-3 bg-white border-2 border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 hover:text-slate-900 transition-all flex items-center gap-2">
              <Settings size={18} /> New Config
            </button>
            <button onClick={reset} className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200">
              <RefreshCw size={18} /> Restart Quiz
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Quiz;
