
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { getPaperForExam, submitExam, saveExamDraft, getExamDraft } from '../../services/dataService';
import { ExamPaper } from '../../types';
import { Clock, Shield, CheckCircle, Send, AlertCircle, Save, Lock, ChevronLeft, ChevronRight, CloudUpload, Bold, Italic, Copy, Clipboard } from 'lucide-react';

interface OnlineExamPortalProps {
  paperId: string;
  onComplete: (submissionId: string) => void;
}

type QStatus = 'not_visited' | 'visited' | 'answered' | 'saved';

const STORAGE_KEY = (id: string) => `exam_progress_${id}`;

const OnlineExamPortal: React.FC<OnlineExamPortalProps> = ({ paperId, onComplete }) => {
  const [paper, setPaper] = useState<ExamPaper | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [savedSet, setSavedSet] = useState<Set<string>>(new Set());
  const [visitedSet, setVisitedSet] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft] = useState<number>(-1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [syncCounter, setSyncCounter] = useState(0);
  const lastSyncRef = useRef<string>('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [textEditorState, setTextEditorState] = useState<'bold' | 'italic' | 'normal'>('normal');

  // --- Functions ---
  
  const syncToServer = useCallback(async () => {
    if (!paper || isFinished || isSyncing) return;
    const currentData = JSON.stringify(answers);
    if (currentData === lastSyncRef.current) return;

    setIsSyncing(true);
    try {
        await saveExamDraft({
            paperId,
            answers,
            timeLeft,
            currentIdx,
            visitedSet: Array.from(visitedSet),
            savedSet: Array.from(savedSet)
        });
        lastSyncRef.current = currentData;
        setSyncCounter(0);
    } catch (err) {
        console.error("Cloud sync failed", err);
    } finally {
        setIsSyncing(false);
    }
  }, [paper, paperId, answers, timeLeft, currentIdx, visitedSet, savedSet, isFinished, isSyncing]);

  const handleSubmit = useCallback(async () => {
    console.log(">>> handleSubmit called", { isSubmitting, isFinished, paperId });
    if (isSubmitting || isFinished) return;
    setIsSubmitting(true);
    try {
      console.log(">>> Sending answers to server...", answers);
      const res = await submitExam(paperId, answers);
      console.log(">>> Submission success!", res);
      setIsFinished(true);
      localStorage.removeItem(STORAGE_KEY(paperId));
      onComplete(res.submissionId);
    } catch (err) {
      console.error(">>> Submission FAILED:", err);
      const msg = (err as any).error || (err as any).message || "Unknown error";
      alert(`Failed to submit exam: ${msg}. Please check your connection and try again.`);
    } finally {
      setIsSubmitting(false);
    }
  }, [paperId, answers, isSubmitting, isFinished, onComplete]);

  const handleAnswerChange = (qId: string, answer: any) => {
    if (savedSet.has(qId)) return;
    setAnswers(prev => ({ ...prev, [qId]: answer }));
  };

  const applyTextFormat = (format: 'bold' | 'italic' | 'size', value?: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = textarea.value.substring(start, end);
    
    if (!selectedText) return;

    let formatted = selectedText;
    if (format === 'bold') formatted = `**${selectedText}**`;
    else if (format === 'italic') formatted = `*${selectedText}*`;
    else if (format === 'size') formatted = `[size=${value}]${selectedText}[/size]`;

    const newText = textarea.value.substring(0, start) + formatted + textarea.value.substring(end);
    handleAnswerChange(paper?.questions[currentIdx]?.id || '', newText);
    
    setTimeout(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = start + formatted.length;
    }, 0);
  };


  const navigateTo = (idx: number) => {
    if (!paper) return;
    setCurrentIdx(idx);
    setVisitedSet(prev => new Set(prev).add(paper.questions[idx].id));
  };

  const handleSaveQuestion = (qId: string) => {
    if (answers[qId] === undefined || answers[qId] === '' || (Array.isArray(answers[qId]) && answers[qId].every((a:any) => !a.right))) {
        alert("Please provide an answer before saving.");
        return;
    }
    setSavedSet(prev => new Set(prev).add(qId));
    setSyncCounter(prev => prev + 1);
    if (paper && currentIdx < paper.questions.length - 1) {
        setTimeout(() => navigateTo(currentIdx + 1), 300);
    }
    syncToServer();
  };

  // --- Effects ---

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPaperForExam(paperId);
        setPaper(data);
        
        let initialTime = data.durationMinutes * 60;
        if (data.examDate) {
            const examStartTime = new Date(data.examDate);
            const now = new Date();
            
            // Check if exam is scheduled for today (local time)
            const isToday = examStartTime.getFullYear() === now.getFullYear() &&
                           examStartTime.getMonth() === now.getMonth() &&
                           examStartTime.getDate() === now.getDate();
            
            let examEnd = examStartTime.getTime() + (data.durationMinutes * 60 * 1000);
            
            if (isToday) {
                // If it's today, allow the exam to be taken until the end of the day
                const endOfToday = new Date(now);
                endOfToday.setHours(23, 59, 59, 999);
                examEnd = Math.max(examEnd, endOfToday.getTime());
            }

            console.log(">>> Exam Timing Debug:", { 
                examStartTime: examStartTime.toLocaleString(), 
                isToday, 
                examEnd: new Date(examEnd).toLocaleString(), 
                now: now.toLocaleString() 
            });

            if (now.getTime() > examEnd) {
                alert("This examination session has already concluded.");
                onComplete(""); 
                return;
            }
            
            const remainingSlot = Math.floor((examEnd - now.getTime()) / 1000);
            initialTime = Math.max(0, Math.min(initialTime, remainingSlot));
        }
        
        setTimeLeft(initialTime);
        console.log(">>> initialTime set to:", initialTime);

        try {
            const serverDraft = await getExamDraft(paperId);
            if (serverDraft) {
                console.log(">>> Restoring from server draft...");
                if (serverDraft.answers) setAnswers(serverDraft.answers);
                if (serverDraft.savedSet) setSavedSet(new Set(serverDraft.savedSet));
                if (serverDraft.visitedSet) setVisitedSet(new Set(serverDraft.visitedSet));
                if (serverDraft.timeLeft && serverDraft.timeLeft < initialTime) setTimeLeft(serverDraft.timeLeft);
                if (typeof serverDraft.currentIdx === 'number') setCurrentIdx(serverDraft.currentIdx);
                lastSyncRef.current = JSON.stringify(serverDraft.answers);
            } else {
                const raw = localStorage.getItem(STORAGE_KEY(paperId));
                if (raw) {
                  try {
                    const restored = JSON.parse(raw);
                    console.log(">>> Restoring from local storage...");
                    if (restored.answers) setAnswers(restored.answers);
                    if (restored.saved) setSavedSet(new Set(restored.saved));
                    if (restored.visited) setVisitedSet(new Set(restored.visited));
                    if (restored.timeLeft && restored.timeLeft < initialTime) setTimeLeft(restored.timeLeft);
                    if (typeof restored.currentIdx === 'number') setCurrentIdx(restored.currentIdx);
                  } catch (_) {}
                }
            }
        } catch (e) {
            console.error(">>> Restore failed:", e);
        } finally {
            setIsInitialLoad(false); // Mark load as complete
        }

        if (data.questions?.length > 0) {
          setVisitedSet(prev => new Set(prev).add(data.questions[0].id));
        }
        setLoading(false);
      } catch (err) {
        console.error("Failed to load paper", err);
      }
    };
    load();

    const ctx = (e: MouseEvent) => e.preventDefault();
    const key = (e: KeyboardEvent) => {
      // Strictly block Copy, Paste, Cut, and other shortcuts
      if ((e.ctrlKey || e.metaKey) && ['c','v','x','u','i','j','s','p'].includes(e.key.toLowerCase())) {
        e.preventDefault();
      }
    };
    document.addEventListener('contextmenu', ctx);
    document.addEventListener('keydown', key);
    return () => { document.removeEventListener('contextmenu', ctx); document.removeEventListener('keydown', key); };
  }, [paperId]);

  useEffect(() => {
    if (!paper || isInitialLoad) return; // Prevent overwriting during initial load
    localStorage.setItem(STORAGE_KEY(paperId), JSON.stringify({
      answers, saved: Array.from(savedSet), visited: Array.from(visitedSet), timeLeft, currentIdx
    }));
  }, [answers, savedSet, visitedSet, timeLeft, currentIdx, paper, paperId, isInitialLoad]);

  useEffect(() => {
    if (syncCounter >= 10) syncToServer();
  }, [syncCounter, syncToServer]);

  useEffect(() => {
    if (timeLeft > 0 && !isFinished) {
      const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
      
      // Heartbeat Sync: Save to server every 60 seconds to prevent data loss
      const syncInterval = setInterval(() => {
          console.log(">>> [HEARTBEAT] Auto-syncing state to server...");
          syncToServer();
      }, 60000);

      return () => {
          clearInterval(t);
          clearInterval(syncInterval);
      };
    } else if (timeLeft === 0 && paper && !isFinished && !isSubmitting) {
        console.log(">>> AUTO-SUBMIT TRIGGERED: Time is zero", { paperId: paper.id, answersCount: Object.keys(answers).length });
        handleSubmit();
    }
  }, [timeLeft, isFinished, paper, isSubmitting, handleSubmit, syncToServer]);

  // --- Rendering Helpers ---

  const getStatus = (qId: string): QStatus => {
    if (savedSet.has(qId)) return 'saved';
    if (answers[qId] !== undefined && answers[qId] !== '') return 'answered';
    if (visitedSet.has(qId)) return 'visited';
    return 'not_visited';
  };

  const statusColor = (s: QStatus) => {
    switch (s) {
      case 'saved': return 'bg-emerald-500 text-white border-emerald-600';
      case 'answered': return 'bg-indigo-500 text-white border-indigo-600';
      case 'visited': return 'bg-amber-400 text-white border-amber-500';
      default: return 'bg-gray-100 text-gray-500 border-gray-200';
    }
  };

  const formatTime = (s: number) => {
    if (s < 0) return "--:--";
    return `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
  };

  if (loading || !paper) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Loading Exam...</p>
      </div>
    </div>
  );

  if (isFinished && !isSubmitting) {
      return (
        <div className="h-screen flex items-center justify-center bg-gray-50 p-6">
          <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-10 text-center border border-gray-100">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle size={40}/>
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">Exam Completed</h2>
            <p className="text-gray-500 mb-8">Your responses have been securely transmitted to the server. You can now close this page.</p>
            <button onClick={() => onComplete("")} className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                Return to Dashboard
            </button>
          </div>
        </div>
      );
  }

  const q = paper.questions[currentIdx];
  const isSaved = savedSet.has(q.id);
  const progress = ((currentIdx + 1) / paper.questions.length) * 100;
  const answeredCount = Object.keys(answers).filter(k => answers[k] !== undefined && answers[k] !== '').length;
  const savedCount = savedSet.size;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col select-none">
      <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-3 flex justify-between items-center sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-indigo-600 text-white p-2 rounded-lg"><GradCap size={20} /></div>
          <div className="hidden sm:block">
            <h1 className="font-bold text-gray-900 text-sm">{paper.title}</h1>
            <p className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">{paper.subject} • {paper.classLevel}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-[10px] font-bold text-gray-400 uppercase hidden md:block">
            {answeredCount}/{paper.questions.length} Answered • {savedCount} Saved
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono font-bold text-sm ${timeLeft < 300 ? 'bg-red-50 text-red-600 animate-pulse' : 'bg-gray-100 text-gray-700'}`}>
            <Clock size={16} /> {formatTime(timeLeft)}
          </div>
          {isSyncing && (
            <div className="flex items-center gap-1.5 text-indigo-600 text-[10px] font-bold animate-pulse"><CloudUpload size={14}/> Syncing...</div>
          )}
          <div className="hidden md:flex items-center gap-1.5 text-green-600 text-[10px] font-bold bg-green-50 px-2.5 py-1 rounded-full border border-green-100"><Shield size={12} /> Secure</div>
        </div>
      </header>

      <div className="w-full h-1 bg-gray-200"><div className="h-full bg-indigo-600 transition-all duration-300" style={{width:`${progress}%`}}/></div>

      <div className="flex-1 flex overflow-hidden">
        <aside className="w-20 md:w-64 bg-white border-r border-gray-200 flex flex-col shrink-0">
          <div className="p-3 md:p-4 border-b border-gray-100">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:block">Question Navigator</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 md:p-4">
            <div className="grid grid-cols-3 md:grid-cols-5 gap-1.5 md:gap-2">
              {paper.questions.map((qq, i) => (
                <button key={qq.id} onClick={() => navigateTo(i)}
                  className={`w-full aspect-square rounded-lg border-2 flex items-center justify-center text-xs font-black transition-all hover:scale-105 active:scale-95 ${i === currentIdx ? 'ring-2 ring-indigo-400 ring-offset-1 scale-105' : ''} ${statusColor(getStatus(qq.id))}`}>
                  {i + 1}
                </button>
              ))}
            </div>
          </div>
          <div className="p-3 border-t border-gray-100 space-y-1 hidden md:block text-[9px] font-bold text-gray-400 uppercase">
            {[['bg-gray-100','Not Visited'],['bg-amber-400','Visited'],['bg-indigo-500','Answered'],['bg-emerald-500','Saved ✓']].map(([c,l]) => (
              <div key={l} className="flex items-center gap-2"><div className={`w-3 h-3 rounded ${c}`}/><span>{l}</span></div>
            ))}
          </div>
        </aside>

        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-3xl w-full mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-widest">Q {currentIdx + 1} / {paper.questions.length}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase">{q.type}</span>
                </div>
                <div className="flex items-center gap-2 text-sm font-medium text-gray-400">
                  <span>{q.marks} Marks</span>
                  {isSaved && <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100"><Lock size={10}/> Locked</span>}
                </div>
              </div>

              <div className="p-6 md:p-8">
                {/* Question Text - Language Aware */}
                <div className="mb-6">
                  {/* Show English if medium is English or Bilingual */}
                  {(q.text && (q.medium !== 'Urdu')) && (
                    <h2 className="text-lg md:text-xl font-bold text-gray-900 leading-relaxed">
                      {q.text}
                    </h2>
                  )}
                  {/* Show Urdu if medium is Urdu or Bilingual */}
                  {(q.textUrdu && (q.medium === 'Urdu' || q.medium === 'Bilingual')) && (
                    <p className="text-xl md:text-2xl font-urdu text-gray-900 leading-loose text-right mt-3" dir="rtl">
                      {q.textUrdu}
                    </p>
                  )}
                  {/* Fallback: show whatever text is available */}
                  {(!q.text && !q.textUrdu) && (
                    <h2 className="text-lg font-bold text-gray-400 italic">Question text not available</h2>
                  )}
                </div>

                <div className="space-y-3">
                  {q.type === 'MCQ' && (() => {
                    const opts: string[] = Array.isArray(q.options) ? q.options : [];
                    const optsUrdu: string[] = Array.isArray(q.optionsUrdu) ? q.optionsUrdu : [];
                    const letters = ['A','B','C','D','E','F','G','H'];
                    return opts.map((opt: string, i: number) => {
                      const letter = letters[i] || String(i+1);
                      // Store LETTER as the answer for reliable grading
                      const isSelected = answers[q.id] === letter || answers[q.id] === opt;
                      return (
                        <button key={i} onClick={() => handleAnswerChange(q.id, letter)} disabled={isSaved}
                          className={`w-full text-left p-4 rounded-xl border-2 transition-all ${isSaved ? 'opacity-75 cursor-not-allowed' : 'hover:scale-[1.01]'} ${isSelected ? 'border-indigo-600 bg-indigo-50 shadow-md' : 'border-gray-100 hover:border-indigo-200 hover:bg-gray-50'}`}>
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{letter}</span>
                            <div className="flex-1">
                              {/* Show English option if not Urdu-only */}
                              {opt && q.medium !== 'Urdu' && <span className="text-gray-700 text-sm">{opt}</span>}
                              {/* Show Urdu option if Urdu or Bilingual */}
                              {optsUrdu[i] && (q.medium === 'Urdu' || q.medium === 'Bilingual') && (
                                <p className="text-right font-urdu text-base text-gray-700 mt-1" dir="rtl">{optsUrdu[i]}</p>
                              )}
                            </div>
                          </div>
                          {isSelected && <CheckCircle className="text-indigo-600 shrink-0 ml-2" size={20}/>}
                        </button>
                      );
                    });
                  })()}

                  {q.type === 'True/False' && ['True','False'].map(opt => (
                    <button key={opt} onClick={() => handleAnswerChange(q.id, opt)} disabled={isSaved}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all flex items-center justify-between ${answers[q.id] === opt ? 'border-indigo-600 bg-indigo-50/50' : 'border-gray-100 hover:border-gray-200'}`}>
                      <span className="text-gray-700 font-medium">{opt}</span>
                      {answers[q.id] === opt && <CheckCircle className="text-indigo-600" size={20}/>}
                    </button>
                  ))}

                  {q.type === 'Fill in the Blanks' && (
                    <input type="text" placeholder="Type answer..." disabled={isSaved} className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-indigo-600 outline-none" value={answers[q.id] || ''} onChange={e => handleAnswerChange(q.id, e.target.value)}/>
                  )}

                  {(q.type === 'Short Answer' || q.type === 'Long Answer') && (
                    <div className="space-y-2">
                      {/* Formatting Toolbar */}
                      <div className="flex gap-2 p-3 bg-slate-100 rounded-lg border border-gray-200">
                        <button 
                          onClick={() => applyTextFormat('bold')} 
                          disabled={isSaved}
                          title="Make text bold (select text first)"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm font-bold text-gray-700 disabled:opacity-50"
                        >
                          <Bold size={14} /> Bold
                        </button>
                        <button 
                          onClick={() => applyTextFormat('italic')} 
                          disabled={isSaved}
                          title="Make text italic (select text first)"
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded hover:bg-gray-100 text-sm font-bold text-gray-700 disabled:opacity-50"
                        >
                          <Italic size={14} /> Italic
                        </button>
                        
                        <div className="flex items-center gap-2 ml-2">
                           <span className="text-[10px] font-bold text-gray-400 uppercase">Size</span>
                           <select 
                              onChange={(e) => applyTextFormat('size', e.target.value)}
                              disabled={isSaved}
                              className="bg-white border border-gray-300 rounded px-2 py-1 text-xs font-bold outline-none focus:ring-1 focus:ring-indigo-500"
                           >
                              <option value="14">Auto</option>
                              <option value="16">16px</option>
                              <option value="20">20px</option>
                              <option value="24">24px</option>
                              <option value="28">28px</option>
                           </select>
                        </div>

                        <div className="flex-1"></div>
                        <div className="flex items-center gap-1 text-[10px] font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded border border-rose-100">
                           <Shield size={10} /> Copy-Paste Disabled
                        </div>
                      </div>
                      {/* Textarea for answer */}
                      <textarea 
                        ref={textareaRef}
                        placeholder="Type response..." 
                        disabled={isSaved} 
                        rows={q.type === 'Long Answer' ? 8 : 4} 
                        className="w-full p-4 rounded-xl border-2 border-gray-200 focus:border-indigo-600 outline-none resize-none font-mono text-sm" 
                        value={answers[q.id] || ''} 
                        onChange={e => handleAnswerChange(q.id, e.target.value)}
                      />
                      <p className="text-[10px] text-gray-400">Tip: Use **text** for bold and *text* for italic.</p>
                    </div>
                  )}

                  {q.type === 'Match Columns' && q.matchingPairs && (
                    <div className="space-y-3">
                      {(q.matchingPairs ?? []).map((pair: any, i: number) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="flex-1 p-3 bg-gray-50 rounded-lg border border-gray-200 text-sm">{pair.left}</div>
                          <span className="text-gray-400 font-bold">➔</span>
                          <select disabled={isSaved} className="flex-1 p-3 bg-white border-2 border-gray-200 rounded-lg outline-none" value={answers[q.id]?.[i]?.right || ''}
                            onChange={e => {
                              const arr = [...(answers[q.id] || (q.matchingPairs ?? []).map((p: any) => ({ left: p.left, right: '' })))];
                              arr[i] = {...arr[i], right: e.target.value};
                              handleAnswerChange(q.id, arr);
                            }}>
                            <option value="">Select...</option>
                            {(q.matchingPairs ?? []).map((p: any) => p.right).sort().map((r: string, j: number) => <option key={j} value={r}>{r}</option>)}
                          </select>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-between items-center gap-3">
                <button onClick={() => navigateTo(Math.max(0, currentIdx - 1))} disabled={currentIdx === 0} className="flex items-center gap-1.5 px-4 py-2 text-gray-600 font-bold hover:bg-gray-200 rounded-xl disabled:opacity-30 text-sm"><ChevronLeft size={18}/> Prev</button>
                <div className="flex gap-2">
                  {!isSaved && (
                    <button onClick={() => handleSaveQuestion(q.id)} disabled={!answers[q.id] && answers[q.id] !== 0} className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 text-white font-bold rounded-xl hover:bg-emerald-700 shadow-md text-sm"><Save size={16}/> Save Answer</button>
                  )}
                  {currentIdx === paper.questions.length - 1 ? (
                    <button onClick={handleSubmit} disabled={isSubmitting} className="flex items-center gap-1.5 px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg text-sm"><Send size={16}/> {isSubmitting ? 'Submitting...' : 'Submit Exam'}</button>
                  ) : (
                    <button onClick={() => navigateTo(Math.min(paper.questions.length - 1, currentIdx + 1))} className="flex items-center gap-1.5 px-5 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-md text-sm">Next <ChevronRight size={18}/></button>
                  )}
                </div>
              </div>
            </div>
            <div className="mt-4 text-center text-gray-400 text-[10px] font-bold uppercase tracking-widest flex items-center justify-center gap-2">
              <AlertCircle size={12} className="text-amber-500"/> Do not refresh. Progress auto-saved locally and in the cloud.
            </div>
          </div>
        </main>
      </div>
      {/* Submitting Overlay */}
      {isSubmitting && (
          <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-[100] flex items-center justify-center">
              <div className="text-center">
                  <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
                  <h3 className="text-xl font-black text-gray-900 mb-1">Submitting Your Exam</h3>
                  <p className="text-gray-500 font-medium">Please do not close your browser...</p>
              </div>
          </div>
      )}
    </div>
  );
};

const GradCap: React.FC<{size: number}> = ({size}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 10L12 5L2 10L12 15L22 10Z"/><path d="M6 12V17C6 17 9 20 12 20C15 20 18 17 18 17V12"/></svg>
);

export default OnlineExamPortal;
