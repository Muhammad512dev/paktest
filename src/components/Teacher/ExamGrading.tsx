import React, { useState, useEffect, useMemo } from 'react';
import { getTeacherSubmissions, submitGrade, submitAllGrades, getClasses, getSubjects, getPapersBySchool, getSyllabuses, getPlans, getSchoolById, getStudents } from '../../services/dataService';
import { ExamSubmission, User, ClassLevel, Subject, SavedPaper, Syllabus, Student } from '../../types';
import { Search, CheckCircle, Clock, ChevronRight, User as UserIcon, BookOpen, AlertCircle, Save, Key, Printer, FileCheck, X, FileSpreadsheet, Calendar } from 'lucide-react';

const renderFormattedText = (text: string) => {
    if (!text) return 'No response provided.';
    let html = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    
    html = html
        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.*?)\*/g, '<em>$1</em>')
        .replace(/\[size=(\d+)\](.*?)\[\/size\]/g, '<span style="font-size: $1px">$2</span>');

    return <span dangerouslySetInnerHTML={{ __html: html }} />;
};

interface ExamGradingProps {
  user: User;
}

const ExamGrading: React.FC<ExamGradingProps> = ({ user }) => {
  const [isOnlineTestEnabled, setIsOnlineTestEnabled] = useState<boolean | null>(null);
  const planHasOnlineTest = (features: any) =>
    Array.isArray(features) && features.some((f: any) => {
      const s = String(f || '').toLowerCase();
      return s.includes('online') && (s.includes('test') || s.includes('exam'));
    });
  const [submissions, setSubmissions] = useState<ExamSubmission[]>([]);
  
  // Data for filters
  const [classes, setClasses] = useState<ClassLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [papers, setPapers] = useState<SavedPaper[]>([]);
  const [syllabuses, setSyllabuses] = useState<Syllabus[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSyllabus, setSelectedSyllabus] = useState('ALL');
  const [selectedClass, setSelectedClass] = useState('ALL');
  const [selectedSubject, setSelectedSubject] = useState('ALL');
  const [selectedPaper, setSelectedPaper] = useState('ALL');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Grading State
  const [selectedSubmission, setSelectedSubmission] = useState<ExamSubmission | null>(null);
  const [gradingData, setGradingData] = useState<Record<string, { score: number, feedback: string }>>({});

  const loadInitialData = async () => {
    setLoadingInitial(true);
    try {
      if (user.schoolId) {
        const [school, plans] = await Promise.all([getSchoolById(user.schoolId), getPlans()]);
        const plan = plans.find((p: any) => p.name === school?.subscriptionPlan);
        const enabled = planHasOnlineTest(plan?.features);
        setIsOnlineTestEnabled(!!enabled);
        if (!enabled) {
          setLoadingInitial(false);
          return;
        }
      } else {
        setIsOnlineTestEnabled(true);
      }

      const [cls, subsj, paps, syls, stus] = await Promise.all([
        getClasses(),
        getSubjects(),
        getPapersBySchool(user.schoolId || ''),
        getSyllabuses(),
        getStudents({ pageSize: 1000 })
      ]);
      setClasses(cls);
      setSubjects(subsj);
      setPapers(paps);
      setSyllabuses(syls);
      setStudents(Array.isArray(stus) ? stus : (stus as any).data || []);
    } catch (err) {
      console.error("Failed to load initial grading data", err);
    } finally {
      setLoadingInitial(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  if (isOnlineTestEnabled === false) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="p-10 bg-gray-50 border-b border-gray-200 text-center">
            <AlertCircle className="mx-auto text-amber-500 mb-4" size={48} />
            <h2 className="text-2xl font-black text-gray-900">Online Grading Restricted</h2>
            <p className="text-gray-600 mt-2 text-sm leading-relaxed max-w-xl mx-auto">
              Your current package does not include the <strong>Online Test</strong> feature. Online submissions and grading are disabled.
            </p>
          </div>
          <div className="p-8 text-center">
            <p className="text-sm text-gray-700 font-medium">Please upgrade your package to enable Online Testing.</p>
          </div>
        </div>
      </div>
    );
  }

  // Filter Cascade Options
  const availableClasses = useMemo(() => {
      return selectedSyllabus === 'ALL' 
        ? classes 
        : classes.filter(c => c.syllabusId === selectedSyllabus);
  }, [classes, selectedSyllabus]);

  const availableSubjects = useMemo(() => {
      return selectedClass === 'ALL' 
        ? subjects 
        : subjects.filter(s => s.classId === selectedClass);
  }, [subjects, selectedClass]);

  const availablePapers = useMemo(() => {
      return papers.filter(p => {
          const sanitize = (s: string) => (s || '').toLowerCase().replace(/class|grade|year|\s+/g, '');
          const classObj = classes.find(c => c.id === selectedClass);
          
          const matchClass = selectedClass === 'ALL' || sanitize(p.classLevel) === sanitize(classObj?.name || '');
          const matchSubject = selectedSubject === 'ALL' || (p.subject || '').toLowerCase() === selectedSubject.toLowerCase();
          
          const examDate = new Date(p.examDate || p.dateCreated);
          const examDateOnly = new Date(examDate.getFullYear(), examDate.getMonth(), examDate.getDate()).getTime();

          let matchDateFrom = true;
          if (dateFrom) {
              const df = new Date(dateFrom);
              matchDateFrom = examDateOnly >= new Date(df.getFullYear(), df.getMonth(), df.getDate()).getTime();
          }

          let matchDateTo = true;
          if (dateTo) {
              const dt = new Date(dateTo);
              matchDateTo = examDateOnly <= new Date(dt.getFullYear(), dt.getMonth(), dt.getDate()).getTime();
          }

          return matchClass && matchSubject && matchDateFrom && matchDateTo;
      });
  }, [papers, selectedClass, selectedSubject, dateFrom, dateTo, classes]);

  // Determine Active Paper
  const activePaperId = useMemo(() => {
      if (searchTerm) return null; // If searching specific student, we don't lock to a paper
      
      let targetPaperId = selectedPaper;
      if (targetPaperId === 'ALL') {
          if (availablePapers.length > 0) {
              const sorted = [...availablePapers].sort((a, b) => new Date(b.examDate || b.dateCreated).getTime() - new Date(a.examDate || a.dateCreated).getTime());
              targetPaperId = sorted[0].id;
          } else {
              return null;
          }
      }
      return targetPaperId;
  }, [selectedPaper, availablePapers, searchTerm]);

  // Dynamic Fetching of Submissions
  useEffect(() => {
      // Do not fetch until initial metadata is loaded
      if (loadingInitial) return;

      const fetchSubs = async () => {
          setLoadingSubmissions(true);
          try {
              if (searchTerm) {
                  // Fetch by search term (name/rollNo bypasses paperId lock)
                  // We simulate this by fetching recent submissions, or ideally endpoint supports ?q=
                  const data = await getTeacherSubmissions({ q: searchTerm, pageSize: 500 });
                  setSubmissions(data);
              } else if (activePaperId) {
                  // Fetch ONLY for the active paper
                  const data = await getTeacherSubmissions({ paperId: activePaperId, pageSize: 500 });
                  setSubmissions(data);
              } else {
                  setSubmissions([]); // No active paper
              }
          } catch(e) {
              console.error("Failed to fetch dynamically", e);
          } finally {
              setLoadingSubmissions(false);
          }
      };

      // Debounce fetch if typing search term
      const timer = setTimeout(() => {
          fetchSubs();
      }, 300);

      return () => clearTimeout(timer);
  }, [activePaperId, searchTerm, loadingInitial]);

  const displayedSubmissions = useMemo(() => {
      // If we are in "Paper View" (activePaperId is set and no search), 
      // we show ALL students of that class and their submission status.
      // Otherwise, we show search results.

      if (searchTerm) {
          const term = searchTerm.toLowerCase();
          return submissions.filter(s => 
              s.student?.name.toLowerCase().includes(term) ||
              s.student?.rollNo?.toLowerCase().includes(term) ||
              (s.paper as any)?.title.toLowerCase().includes(term)
          );
      }

      if (activePaperId) {
          const paper = papers.find(p => p.id === activePaperId);
          if (!paper) return [];

          const sanitize = (s: string) => (s || '').toLowerCase().replace(/class|grade|year|\s+/g, '');
          const paperClass = classes.find(c => sanitize(c.name) === sanitize(paper.classLevel));
          
          // Get all students for this class
          const targetStudents = students.filter(s => paperClass && s.classId === paperClass.id);
          
          return targetStudents.map(student => {
              const submission = submissions.find(sub => sub.studentId === student.id);
              return {
                  ...submission,
                  id: submission?.id || `pending-${student.id}`,
                  student,
                  paper: submission?.paper || paper,
                  isGraded: submission?.isGraded || false,
                  totalScore: submission?.totalScore || 0,
                  isPending: !submission
              };
          });
      }

      return [];
  }, [submissions, searchTerm, activePaperId, students, papers, classes]);

  const gradingOverview = useMemo(() => {
    const paper = papers.find(p => p.id === activePaperId);
    if (!paper || searchTerm) return null;
    const submitted = displayedSubmissions.filter((item: any) => !item.isPending);
    return {
      paper,
      classCount: displayedSubmissions.length,
      submittedCount: submitted.length,
      gradedCount: submitted.filter(item => item.isGraded).length,
      reviewCount: submitted.filter(item => !item.isGraded).length
    };
  }, [activePaperId, papers, displayedSubmissions, searchTerm]);


  const handleSelectSubmission = (s: any) => {
    if (s.isPending) {
        alert("This student has not submitted their exam yet.");
        return;
    }
    setSelectedSubmission(s);
    // Initialize grading data with current values
    const initial: any = {};
    Object.entries(s.answers || {}).forEach(([id, ans]: [string, any]) => {
        if (!ans.isObjective) {
            initial[id] = { score: ans.teacherScore || 0, feedback: ans.feedback || '' };
        }
    });
    setGradingData(initial);
  };

  const handleSaveGrade = async (questionId: string) => {
    if (!selectedSubmission) return;
    const { score, feedback } = gradingData[questionId];
    try {
        await submitGrade({
            submissionId: selectedSubmission.id,
            questionId,
            score,
            feedback
        });
        // Update local state
        const updatedAnswers = { ...selectedSubmission.answers };
        updatedAnswers[questionId] = { ...updatedAnswers[questionId], teacherScore: score, feedback };
        setSelectedSubmission({ ...selectedSubmission, answers: updatedAnswers });
        
        // Refresh local submissions list so status reflects
        setSubmissions(subs => subs.map(sub => sub.id === selectedSubmission.id ? { ...selectedSubmission, answers: updatedAnswers } : sub));
        
        alert("Grade saved successfully!");
    } catch (err) {
        alert("Failed to save grade.");
    }
  };

  const handleSaveAllGrades = async () => {
    if (!selectedSubmission) return;
    try {
        await submitAllGrades({
            submissionId: selectedSubmission.id,
            grades: gradingData
        });
        
        // Update local state for all graded questions
        const updatedAnswers = { ...selectedSubmission.answers };
        Object.entries(gradingData).forEach(([qId, data]) => {
            if (updatedAnswers[qId]) {
                updatedAnswers[qId] = { ...updatedAnswers[qId], teacherScore: data.score, feedback: data.feedback };
            }
        });
        
        const finalizedSubmission = { ...selectedSubmission, answers: updatedAnswers, isGraded: true };
        setSelectedSubmission(finalizedSubmission);
        
        setSubmissions(subs => subs.map(sub => sub.id === selectedSubmission.id ? finalizedSubmission : sub));
        
        alert("All grades saved and submission marked as graded successfully!");
    } catch (err) {
        alert("Failed to save all grades.");
    }
  };

  if (selectedSubmission) {
    return (
      <div className="p-4 md:p-8 max-w-5xl mx-auto">
        <button 
          onClick={() => setSelectedSubmission(null)}
          className="mb-6 flex items-center gap-2 text-indigo-600 font-bold hover:underline"
        >
          <ChevronRight className="rotate-180" size={20} />
          Back to Submissions
        </button>

        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden mb-8">
          <div className="p-8 bg-gray-50 border-b border-gray-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{selectedSubmission.student?.name}</h2>
              <p className="text-gray-500 font-medium">Exam: {(selectedSubmission.paper as any)?.title} • Subject: {(selectedSubmission.paper as any)?.subject}</p>
            </div>
            <div className="flex gap-3 w-full sm:w-auto justify-between sm:justify-end">
              <button 
                onClick={() => window.print()}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-all text-xs font-bold print:hidden shadow-sm"
              >
                <Printer size={16} />
                Print Response
              </button>
              <div className="text-right ml-4">
                <div className="text-3xl font-black text-indigo-600">{selectedSubmission.totalScore}</div>
                <div className="text-xs text-gray-400 font-bold uppercase">Current Total</div>
              </div>
            </div>
          </div>

          <div className="p-8 space-y-12">
            {Object.entries(selectedSubmission.answers).map(([qId, ans]: [string, any]) => {
              // Step 1: fallback - populate from stored context if paper lookup fails
              if (!ans.questionText && !ans.questionTextUrdu) {
                let rawQ = (selectedSubmission.paper as any)?.questions;
                if (typeof rawQ === 'string') { try { rawQ = JSON.parse(rawQ); } catch(e) { rawQ = []; } }
                const qList = Array.isArray(rawQ) ? rawQ : Object.values(rawQ || {});
                const found = qList.find((q: any) => String(q.id) === String(qId) || String(q.questionId) === String(qId));
                if (found) {
                  ans.questionText = found.text || ''; ans.questionTextUrdu = found.textUrdu || '';
                  ans.questionType = found.type || ''; ans.questionMarks = found.marks || 1;
                  ans.questionMedium = found.medium || 'English';
                  ans.questionOptions = found.options || []; ans.questionOptionsUrdu = found.optionsUrdu || [];
                  ans.questionCorrectAnswer = found.correctAnswer || '';
                }
              }
              // Step 2: read all fields AFTER fallback
              const qText       = ans.questionText || '';
              const qTextUrdu   = ans.questionTextUrdu || '';
              const qType       = ans.questionType || (ans.isObjective ? 'MCQ' : 'Short Answer');
              const qMarks      = ans.questionMarks || 1;
              const qMedium     = ans.questionMedium || 'English';
              const qCorrectKey = String(ans.questionCorrectAnswer || '').trim().toUpperCase();
              const sAns        = String(ans.studentAnswer || '').trim().toUpperCase();
              
              let qOpts: string[] = []; let qOptsUrdu: string[] = [];
              try { qOpts     = Array.isArray(ans.questionOptions)     ? ans.questionOptions     : JSON.parse(ans.questionOptions     || '[]'); } catch(e) {}
              try { qOptsUrdu = Array.isArray(ans.questionOptionsUrdu) ? ans.questionOptionsUrdu : JSON.parse(ans.questionOptionsUrdu || '[]'); } catch(e) {}

              const question = {
                  text: qText,
                  textUrdu: qTextUrdu,
                  type: qType,
                  marks: qMarks,
                  medium: qMedium,
                  options: qOpts,
                  optionsUrdu: qOptsUrdu,
                  correctAnswer: qCorrectKey
              };

              return (
              <div key={qId} className="space-y-4 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div className="flex justify-between items-start">
                   <div className="flex-1">
                       <h3 className="font-bold text-gray-800 text-lg mb-2">{ans.isObjective ? 'Objective Question' : 'Subjective Question'}</h3>
                       {question && (
                          <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 mb-3">
                            <p className="text-gray-700 font-medium">{question.text || 'Question text not available'}</p>
                            {question.textUrdu && <p className="text-gray-600 font-urdu mt-2 text-right">{question.textUrdu}</p>}
                            
                            {/* MCQ OPTIONS DISPLAY */}
                            {question.type === 'MCQ' && (
                                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                                    {(() => {
                                        const optsList = Array.isArray(question.options) ? question.options : [];
                                        const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                                        
                                        return optsList.map((opt: string, i: number) => {
                                            const letter = letters[i] || '?';
                                            const studentAns = String(ans?.studentAnswer || '').toLowerCase();
                                            const correctKey = String(question?.correctAnswer || '').toLowerCase();
                                            
                                            const isStudentPick = studentAns === letter.toLowerCase() || studentAns === String(opt).toLowerCase();
                                            const isCorrect = correctKey === letter.toLowerCase() || correctKey === String(opt).toLowerCase();
                                            
                                            let optUrdu = '';
                                            if (Array.isArray(question.optionsUrdu) && question.optionsUrdu[i]) optUrdu = question.optionsUrdu[i];
                                            
                                            return (
                                                <div key={i} className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${isStudentPick ? 'bg-indigo-100 border-indigo-300 shadow-sm' : isCorrect ? 'bg-emerald-50 border-emerald-200' : 'bg-white border-gray-100'}`}>
                                                    <div className="flex gap-2 items-center">
                                                        <span className="text-indigo-600 font-black text-[10px]">{letter}.</span>
                                                        <span className={`flex-1 text-xs ${isStudentPick || isCorrect ? 'font-bold' : ''}`}>{opt}</span>
                                                        {isStudentPick && <span className="text-[8px] uppercase text-indigo-500 font-black">Student's Choice</span>}
                                                        {isCorrect && !isStudentPick && <span className="text-[8px] uppercase text-emerald-500 font-black">Key</span>}
                                                    </div>
                                                    {optUrdu && (
                                                        <div className="text-right font-urdu text-sm text-gray-600 mt-1" dir="rtl">
                                                            {optUrdu}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        });
                                    })()}
                                </div>
                            )}

                            <div className="flex flex-wrap gap-x-4 gap-y-2 mt-4 pt-3 border-t border-indigo-100/50">
                              <span className="text-xs text-indigo-600 font-bold">Question Value: {question.marks || 0} Marks</span>
                              {ans.isObjective && (
                                <>
                                  <span className={`text-xs font-bold ${ans.isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                                    Auto-Grading Result: {ans.autoScore || 0} / {question.marks || 0}
                                  </span>
                                  {question.correctAnswer && (
                                    <span className="text-xs text-amber-600 font-bold flex items-center gap-1">
                                      <Key size={12}/> Key: {question.correctAnswer}
                                    </span>
                                  )}
                                </>
                              )}
                            </div>
                          </div>
                       )}
                    </div>
                    <div className="flex flex-col items-end gap-2 ml-4">
                       <label className="text-xs font-bold text-gray-400 uppercase">Score</label>
                       <input 
                         type="number"
                         className="w-20 px-3 py-2 border-2 border-indigo-100 rounded-lg focus:border-indigo-600 outline-none font-black text-center text-lg text-indigo-600"
                         value={gradingData[qId]?.score ?? (ans.isObjective ? ans.autoScore : 0)}
                         onChange={e => setGradingData({...gradingData, [qId]: { ...gradingData[qId], score: parseFloat(e.target.value) || 0 }})}
                       />
                    </div>
                 </div>

                 <div className={`p-6 rounded-xl border transition-colors ${ans.isCorrect ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
                   <p className={`text-[10px] font-bold uppercase mb-2 ${ans.isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>Student Response:</p>
                   <div className={`whitespace-pre-wrap font-mono text-sm leading-relaxed font-bold ${ans.isCorrect ? 'text-emerald-900' : 'text-red-900'}`}>
                     {typeof ans.studentAnswer === 'object' ? (
                       <pre className="text-[10px] bg-white p-2 border border-gray-100 rounded">
                         {JSON.stringify(ans.studentAnswer, null, 2)}
                       </pre>
                     ) : (
                       renderFormattedText(ans.studentAnswer)
                     )}
                   </div>
                 </div>

                <div>
                   <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Teacher Feedback</label>
                   <textarea 
                      className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:border-indigo-600 resize-none h-24 text-sm font-medium"
                      placeholder="Add comments or feedback for the student..."
                      value={gradingData[qId]?.feedback}
                      onChange={e => setGradingData({...gradingData, [qId]: { ...gradingData[qId], feedback: e.target.value }})}
                   ></textarea>
                </div>

                <div className="flex justify-end">
                   <button 
                      onClick={() => handleSaveGrade(qId)}
                      className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md transition-all active:scale-95"
                   >
                      <Save size={18} />
                      Save Grade & Feedback
                   </button>
                </div>
              </div>
            );
            })}

            {Object.entries(selectedSubmission.answers).filter(([_, ans]: [string, any]) => !ans.isObjective).length === 0 && (
              <div className="text-center py-6 bg-emerald-50 rounded-2xl border border-emerald-100 mb-4 shadow-sm">
                 <CheckCircle size={36} className="text-emerald-500 mx-auto mb-2" />
                 <p className="text-emerald-700 font-bold">This exam only contains objective questions which were auto-graded.</p>
              </div>
            )}

            <div className="mt-8 flex flex-col items-center justify-center border-t border-gray-200 pt-8 pb-4">
                <p className="text-gray-500 text-sm font-medium mb-4 text-center">
                    Once you are done reviewing or grading, click below to finalize.
                    <br/>The student will instantly be able to see this review.
                </p>
                <button 
                    onClick={handleSaveAllGrades}
                    className="flex items-center gap-3 px-8 py-4 bg-emerald-600 text-white rounded-2xl font-black text-lg hover:bg-emerald-700 shadow-xl shadow-emerald-200 transition-all active:scale-95"
                >
                    <FileCheck size={24} />
                    Complete & Save All Grades
                </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 print:p-0 print:space-y-4">
      {/* Premium Header */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden print:hidden">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
                <h1 className="text-4xl font-black tracking-tight mb-2">Exam Grading</h1>
                <p className="text-indigo-200 font-medium">Review and grade specific tests assigned to your subjects.</p>
            </div>
            <div className="flex items-center gap-2 text-sm text-indigo-200 font-medium bg-white/10 px-4 py-2 rounded-xl backdrop-blur-sm border border-white/10">
                <BookOpen size={16} />
                Your Subjects: <span className="font-bold text-white">{user.assignedSyllabuses?.join(', ') || 'All'}</span>
            </div>
        </div>
        <div className="absolute right-[-20px] bottom-[-20px] w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      </div>

      {/* Sheet-like Filters (Mirrors ResultCenter) */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                
                {/* Search Override */}
                <div className="space-y-2 lg:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Search Submission (Student or Roll No)</label>
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input 
                            type="text" 
                            className="w-full pl-12 pr-10 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-sm"
                            placeholder="Type to find specific student submissions..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>

                <div className="space-y-2 lg:col-span-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Test Date Range</label>
                    <div className="flex gap-4">
                        <div className="relative flex-1">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="date" 
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-sm disabled:opacity-50"
                                value={dateFrom}
                                onChange={e => setDateFrom(e.target.value)}
                                disabled={!!searchTerm}
                            />
                        </div>
                        <div className="relative flex-1">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input 
                                type="date" 
                                className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-sm disabled:opacity-50"
                                value={dateTo}
                                onChange={e => setDateTo(e.target.value)}
                                disabled={!!searchTerm}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Syllabus</label>
                    <div className="relative">
                        <select 
                            className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-sm appearance-none disabled:opacity-50"
                            value={selectedSyllabus}
                            onChange={e => { setSelectedSyllabus(e.target.value); setSelectedClass('ALL'); setSelectedSubject('ALL'); setSelectedPaper('ALL'); }}
                            disabled={!!searchTerm}
                        >
                            <option value="ALL">All Boards</option>
                            {syllabuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Class</label>
                    <div className="relative">
                        <select 
                            className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-sm appearance-none disabled:opacity-50"
                            value={selectedClass}
                            onChange={e => { setSelectedClass(e.target.value); setSelectedSubject('ALL'); setSelectedPaper('ALL'); }}
                            disabled={!!searchTerm}
                        >
                            <option value="ALL">All Classes</option>
                            {availableClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Subject</label>
                    <div className="relative">
                        <select 
                            className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-sm appearance-none disabled:opacity-50"
                            value={selectedSubject}
                            onChange={e => { setSelectedSubject(e.target.value); setSelectedPaper('ALL'); }}
                            disabled={!!searchTerm}
                        >
                            <option value="ALL">All Subjects</option>
                            {availableSubjects.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Specific Test</label>
                    <div className="relative">
                        <select 
                            className="w-full pl-4 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold text-sm appearance-none disabled:opacity-50"
                            value={selectedPaper}
                            onChange={e => setSelectedPaper(e.target.value)}
                            disabled={!!searchTerm}
                        >
                            <option value="ALL">Latest / Auto</option>
                            {availablePapers.map(p => <option key={p.id} value={p.id}>{new Date(p.examDate || p.dateCreated).toLocaleDateString()} — {p.subject} — {p.title}</option>)}
                        </select>
                    </div>
                </div>

            </div>
        </div>
      </div>

      {!loadingInitial && !loadingSubmissions && gradingOverview && (
        <section className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 print:hidden">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Selected class test</p>
              <h2 className="mt-1 text-xl font-black text-slate-900">{gradingOverview.paper.title}</h2>
              <p className="mt-1 text-sm font-bold text-slate-500">
                {new Date(gradingOverview.paper.examDate || gradingOverview.paper.dateCreated).toLocaleDateString()} · {gradingOverview.paper.subject} · {gradingOverview.paper.classLevel}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ['Class', gradingOverview.classCount, 'text-slate-700'],
                ['Submitted', gradingOverview.submittedCount, 'text-indigo-600'],
                ['To review', gradingOverview.reviewCount, 'text-amber-600'],
                ['Graded', gradingOverview.gradedCount, 'text-emerald-600']
              ].map(([label, value, color]) => (
                <div key={String(label)} className="min-w-[92px] rounded-2xl bg-slate-50 border border-slate-100 p-3 text-center">
                  <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">{label}</p>
                  <p className={`mt-1 text-xl font-black ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {loadingInitial || loadingSubmissions ? (
          <div className="p-32 flex flex-col items-center">
              <div className="w-16 h-16 border-4 border-slate-900 border-t-indigo-500 rounded-full animate-spin mb-4"></div>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Fetching Submissions...</p>
          </div>
      ) : (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:border-none print:shadow-none print:rounded-none">
            {displayedSubmissions.length === 0 ? (
                <div className="p-32 text-center print:hidden">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileSpreadsheet className="text-slate-200" size={40} />
                    </div>
                    <h3 className="text-slate-900 font-bold text-lg">No Submissions Found</h3>
                    <p className="text-slate-400 text-sm max-w-xs mx-auto mt-2">Adjust your filters or assign exams to receive submissions.</p>
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                          <th className="px-8 py-5">Student</th>
                          <th className="px-8 py-5">Exam Title</th>
                          <th className="px-8 py-5">Test Date</th>
                          <th className="px-8 py-5 text-center">Score</th>
                          <th className="px-8 py-5">Status</th>
                          <th className="px-8 py-5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {displayedSubmissions.map(sub => (
                          <tr key={sub.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-8 py-6">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black shadow-md">
                                   {sub.student?.name.charAt(0)}
                                </div>
                                <div>
                                   <p className="font-bold text-slate-900">{sub.student?.name}</p>
                                   <p className="text-xs font-bold text-slate-500">Roll No: {sub.student?.rollNo || 'N/A'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-8 py-6">
                               <p className="font-bold text-slate-800">{(sub.paper as any)?.title}</p>
                               <p className="text-xs font-bold text-slate-500">{(sub.paper as any)?.subject} • {(sub.paper as any)?.classLevel}</p>
                            </td>
                            <td className="px-8 py-6 text-sm font-bold text-slate-600">
                               {(sub.paper as any)?.examDate || (sub.paper as any)?.dateCreated
                                 ? new Date((sub.paper as any).examDate || (sub.paper as any).dateCreated).toLocaleDateString()
                                 : 'Not scheduled'}
                            </td>
                            <td className="px-8 py-6 text-center">
                               <span className="text-xl font-black text-indigo-600">{sub.totalScore}</span>
                            </td>
                            <td className="px-8 py-6">
                                 {(sub as any).isPending ? (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                      <AlertCircle size={12} /> Pending Submission
                                    </span>
                                 ) : sub.isGraded ? (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                      <CheckCircle size={12} /> Graded
                                    </span>
                                 ) : (
                                    <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 text-amber-700 rounded-lg text-[10px] font-black uppercase tracking-widest">
                                      <Clock size={12} /> Needs Review
                                    </span>
                                 )}
                            </td>
                            <td className="px-8 py-6 text-right">
                               <button 
                                  onClick={() => handleSelectSubmission(sub)}
                                  disabled={(sub as any).isPending}
                                  className={`px-5 py-2.5 border-2 rounded-xl font-bold transition-all flex items-center gap-2 ml-auto active:scale-95 shadow-sm ${
                                    (sub as any).isPending 
                                      ? 'bg-gray-50 border-gray-100 text-gray-300 cursor-not-allowed'
                                      : 'bg-white border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200'
                                  }`}
                               >
                                  {(sub as any).isPending ? 'Not Submitted' : 'Grade Now'}
                                  <ChevronRight size={18} />
                               </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
            )}
          </div>
      )}
    </div>
  );
};

export default ExamGrading;
