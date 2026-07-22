import React, { useState, useEffect } from 'react';
import { getAssignedPapers, getStudentResults, getSchoolById, getPlans } from '../../services/dataService';
import { ExamSubmission, School } from '../../types';
import { BookOpen, Clock, Play, FileText, BarChart2, Calendar, Layout, Award, TrendingUp, User, HelpCircle, ChevronRight, CheckCircle, AlertCircle, Target, GraduationCap, Lock, Filter, Eye, Key, Zap, Edit3, Check, X, Printer, FileCheck } from 'lucide-react';
import OnlineExamPortal from './OnlineExamPortal';

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

interface StudentDashboardProps {
  user: any;
  initialTab?: 'TESTS' | 'RESULTS' | 'SETTINGS';
}

const StudentDashboard: React.FC<StudentDashboardProps> = ({ user, initialTab }) => {
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'TESTS' | 'RESULTS' | 'SETTINGS'>(
    initialTab === 'TESTS' ? 'TESTS' : initialTab === 'RESULTS' ? 'RESULTS' : initialTab === 'SETTINGS' ? 'SETTINGS' : 'DASHBOARD'
  );
  const [viewingResult, setViewingResult] = useState<ExamSubmission | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  const [assignedPapers, setAssignedPapers] = useState<any[]>([]);
  const [results, setResults] = useState<ExamSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaperId, setSelectedPaperId] = useState<string | null>(null);
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [fetchedPapers, setFetchedPapers] = useState<Record<string, any>>({});
  const [schoolData, setSchoolData] = useState<School | null>(null);
  const [isOnlineTestEnabled, setIsOnlineTestEnabled] = useState<boolean | null>(null);
  const planHasOnlineTest = (features: any) =>
    Array.isArray(features) && features.some((f: any) => {
      const s = String(f || '').toLowerCase();
      return s.includes('online') && (s.includes('test') || s.includes('exam'));
    });

  useEffect(() => {
    const fetchMissingQuestions = async () => {
      if (!viewingResult) return;
      const rawQ = (viewingResult.paper as any)?.questions;
      // If questions array is missing or empty, force fetch the complete paper
      if (!rawQ || (Array.isArray(rawQ) && rawQ.length === 0) || (typeof rawQ === 'object' && Object.keys(rawQ).length === 0)) {
        if (fetchedPapers[viewingResult.paperId]) return; // already fetched
        try {
          const token = localStorage.getItem('token');
          const res = await fetch(`/api/student/papers/${viewingResult.paperId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            const data = await res.json();
            setFetchedPapers(prev => ({ ...prev, [viewingResult.paperId]: data }));
          }
        } catch (e) {
          console.error("Failed to fetch full paper fallback", e);
        }
      }
    };
    fetchMissingQuestions();
  }, [viewingResult, fetchedPapers]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [school, plans] = await Promise.all([
        getSchoolById(user.schoolId),
        getPlans()
      ]);
      setSchoolData(school);

      const plan = plans.find((p: any) => p.name === school?.subscriptionPlan);
      const enabledByPlan = planHasOnlineTest(plan?.features);
      setIsOnlineTestEnabled(!!enabledByPlan);

      if (!enabledByPlan) {
        setAssignedPapers([]);
        setResults([]);
        return;
      }

      const [papers, res] = await Promise.all([
        getAssignedPapers(),
        getStudentResults()
      ]);
      setAssignedPapers(papers);
      setResults(res);
    } catch (err) {
      console.error("Failed to load dashboard data", err);
      // If package is restricted, student APIs may 403; show locked UI instead of a blank error
      setIsOnlineTestEnabled(false);
      setAssignedPapers([]);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  // Stats
  const totalExams = results.length;
  const gradedResults = results.filter(r => r.isGraded);
  const avgScore = gradedResults.length > 0
    ? Math.round(gradedResults.reduce((a, r) => a + ((r.totalScore / ((r.paper as any)?.totalMarks || 1)) * 100), 0) / gradedResults.length)
    : 0;
  const bestScore = gradedResults.length > 0
    ? Math.max(...gradedResults.map(r => Math.round((r.totalScore / ((r.paper as any)?.totalMarks || 1)) * 100)))
    : 0;

  const isOnlineLocked = isOnlineTestEnabled === false || schoolData?.securityConfig?.isOnlineExamsEnabled === false;

  if (selectedPaperId) {
    return (
      <OnlineExamPortal
        paperId={selectedPaperId}
        onComplete={() => {
          setSelectedPaperId(null);
          loadData();
          setActiveTab('RESULTS');
        }}
      />
    );
  }

  const tabs = [
    { id: 'DASHBOARD', label: 'Overview', icon: Layout },
    { id: 'TESTS', label: 'My Exams', icon: FileText },
    { id: 'RESULTS', label: 'Results', icon: BarChart2 },
    { id: 'SETTINGS', label: 'Settings', icon: User },
  ] as const;

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto min-h-screen">
      {/* Welcome Header */}
      <div className="mb-8 bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 rounded-3xl p-6 md:p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.05%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')] opacity-50"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mb-1">Student Portal</p>
            <h1 className="text-2xl md:text-3xl font-bold">Welcome back, {user.name}!</h1>
            <p className="text-indigo-200 text-sm mt-1 flex items-center gap-2">
              <GraduationCap size={16} />
              {(user as any).classLevel?.name || 'Class N/A'} • Roll No: {(user as any).rollNo || 'N/A'}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 text-center border border-white/10">
              <p className="text-2xl font-black">{assignedPapers.length}</p>
              <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">Pending</p>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl px-5 py-3 text-center border border-white/10">
              <p className="text-2xl font-black">{totalExams}</p>
              <p className="text-[10px] text-indigo-200 font-bold uppercase tracking-widest">Completed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-8 bg-white p-1 rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 md:px-6 py-2.5 rounded-xl font-bold transition-all text-sm whitespace-nowrap ${activeTab === t.id ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-500 hover:bg-gray-100'
              }`}>
            <t.icon size={16} /> {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <>
          {/* DASHBOARD TAB */}
          {activeTab === 'DASHBOARD' && (
            isOnlineLocked ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-gray-200 shadow-sm max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-6">
                  <Lock size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Online Module Locked</h2>
                <p className="text-slate-500 max-w-md">Your school package does not include Online Testing. Exams and results are disabled.</p>
              </div>
            ) : (
            <div className="space-y-8">
              {/* Stats Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Exams Taken', value: totalExams, icon: FileText, color: 'indigo', sub: 'Total submissions' },
                  { label: 'Avg Score', value: `${avgScore}%`, icon: TrendingUp, color: 'emerald', sub: 'Across graded exams' },
                  { label: 'Best Score', value: `${bestScore}%`, icon: Award, color: 'amber', sub: 'Personal best' },
                  { label: 'Pending', value: assignedPapers.length, icon: Clock, color: 'rose', sub: 'Exams to take' },
                ].map((s, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-shadow">
                    <div className={`w-10 h-10 rounded-xl bg-${s.color}-50 text-${s.color}-600 flex items-center justify-center mb-3`}>
                      <s.icon size={20} />
                    </div>
                    <p className="text-2xl font-black text-gray-900">{s.value}</p>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Pending Exams Quick View */}
              {assignedPapers.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><AlertCircle size={18} className="text-amber-500" /> Pending Exams</h3>
                    <button onClick={() => setActiveTab('TESTS')} className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">View All <ChevronRight size={14} /></button>
                  </div>
                  <div className="space-y-3">
                    {assignedPapers.slice(0, 3).map(p => (
                      <div key={p.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-indigo-50 transition-colors group">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center"><FileText size={18} /></div>
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{p.title}</p>
                            <p className="text-xs text-gray-500">{p.subject} • {p.durationMinutes} mins • {p.totalMarks} marks</p>
                            {p.examDate && (
                              <p className={`text-[10px] font-bold mt-1 ${new Date(p.examDate).setHours(23, 59, 59, 999) < Date.now() ? 'text-rose-500' : 'text-emerald-600'}`}>
                                {new Date(p.examDate).setHours(23, 59, 59, 999) < Date.now() ? 'Expired' : `Exam Date: ${new Date(p.examDate).toLocaleDateString()}`}
                              </p>
                            )}
                          </div>
                        </div>
                        {(!p.examDate || new Date(p.examDate).setHours(23, 59, 59, 999) >= Date.now()) ? (
                          <button onClick={() => setSelectedPaperId(p.id)}
                            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                            <Play size={14} fill="currentColor" /> Start
                          </button>
                        ) : (
                          <div className="px-3 py-1.5 bg-gray-100 text-gray-400 rounded-lg text-[10px] font-bold uppercase tracking-widest">
                            Closed
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Results */}
              {results.length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2"><CheckCircle size={18} className="text-emerald-500" /> Recent Results</h3>
                    <button onClick={() => setActiveTab('RESULTS')} className="text-xs text-indigo-600 font-bold hover:underline flex items-center gap-1">View All <ChevronRight size={14} /></button>
                  </div>
                  <div className="space-y-3">
                    {results.slice(0, 3).map(r => {
                      const pct = Math.round((r.totalScore / ((r.paper as any)?.totalMarks || 1)) * 100);
                      return (
                        <div key={r.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div>
                            <p className="font-bold text-gray-900 text-sm">{(r.paper as any)?.title}</p>
                            <p className="text-xs text-gray-500">{(r.paper as any)?.subject} • {new Date(r.submittedAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className={`text-lg font-black ${pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600'}`}>{pct}%</div>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${r.isGraded ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                              {r.isGraded ? 'Graded' : 'Pending'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
            )
          )}

          {/* TESTS TAB */}
          {activeTab === 'TESTS' && (
            isOnlineLocked ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-gray-200 shadow-sm max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-6">
                  <Lock size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Online Exams Locked</h2>
                <p className="text-slate-500 max-w-md">Your institution has not enabled the Online Exams module. All examinations must be taken offline on paper.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {assignedPapers.length > 0 ? (
                  assignedPapers.map(paper => (
                    <div key={paper.id} className="bg-white rounded-3xl border border-gray-200 shadow-sm p-6 hover:shadow-xl transition-all group flex flex-col">
                      <div className="flex justify-between items-start mb-5">
                        <div className="bg-indigo-50 p-3 rounded-2xl text-indigo-600"><FileText size={24} /></div>
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase tracking-widest">Available</span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-indigo-600 transition-colors">{paper.title}</h3>
                      <p className="text-gray-500 text-sm mb-5 flex items-center gap-2"><BookOpen size={14} /> {paper.subject}</p>
                      <div className="space-y-2 mb-6 bg-gray-50 p-4 rounded-2xl text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">Duration</span><span className="font-bold text-gray-800">{paper.durationMinutes} mins</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">Total Marks</span><span className="font-bold text-gray-800">{paper.totalMarks}</span></div>
                        {paper.examDate && <div className="flex justify-between"><span className="text-gray-500">Date</span><span className="font-bold text-gray-800">{new Date(paper.examDate).toLocaleDateString()}</span></div>}
                        {paper.testType && <div className="flex justify-between"><span className="text-gray-500">Type</span><span className="font-bold text-gray-800">{paper.testType}</span></div>}
                      </div>
                      {(!paper.examDate || new Date(paper.examDate).setHours(23, 59, 59, 999) >= Date.now()) ? (
                        <button onClick={() => setSelectedPaperId(paper.id)}
                          className="mt-auto w-full py-3.5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 flex items-center justify-center gap-2 text-sm">
                          <Play size={16} fill="currentColor" /> Start Exam
                        </button>
                      ) : (
                        <div className="mt-auto w-full py-3.5 bg-gray-100 text-gray-400 rounded-2xl font-bold text-center border border-gray-200 flex items-center justify-center gap-2 text-sm">
                          <Lock size={16} /> Exam Period Closed
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="col-span-full py-20 bg-white rounded-3xl border border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400">
                    <Calendar size={48} className="mb-4 opacity-20" />
                    <p className="font-bold text-lg">No exams assigned</p>
                    <p className="text-sm mt-1">Check back later for new exams from your school.</p>
                  </div>
                )}
              </div>
            )
          )}

          {/* RESULTS TAB */}
          {activeTab === 'RESULTS' && (
            isOnlineLocked ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-3xl border border-gray-200 shadow-sm max-w-2xl mx-auto">
                <div className="w-20 h-20 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mb-6">
                  <Lock size={40} />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">Results Locked</h2>
                <p className="text-slate-500 max-w-md">Your school package does not include Online Testing. Results review is disabled.</p>
              </div>
            ) : (
            <div className="bg-white rounded-3xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                <h3 className="font-black text-gray-900 uppercase tracking-tight text-lg">Academic History</h3>
                <div className="flex gap-2">
                  <div className="relative">
                    <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                      className="pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-indigo-500 appearance-none shadow-sm"
                      onChange={(e) => setSubjectFilter(e.target.value)}
                      value={subjectFilter}
                    >
                      <option value="All">All Subjects</option>
                      {Array.from(new Set(results.map(r => (r.paper as any)?.subject))).filter(Boolean).map(s => (
                        <option key={s as string} value={s as string}>{s as string}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              {results.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold border-b border-gray-200 tracking-widest">
                        <th className="px-8 py-5">Exam Details</th>
                        <th className="px-8 py-5 text-center">Score</th>
                        <th className="px-8 py-5 text-center">Percentage</th>
                        <th className="px-8 py-5">Status</th>
                        <th className="px-8 py-5">Submission Date</th>
                        <th className="px-8 py-5 text-right">Review</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {results.filter(r => subjectFilter === 'All' || (r.paper as any)?.subject === subjectFilter).map(r => {
                        const pct = Math.round((r.totalScore / ((r.paper as any)?.totalMarks || 1)) * 100);
                        return (
                          <tr key={r.id} className="hover:bg-gray-50/80 transition-colors group">
                            <td className="px-8 py-6">
                              <p className="font-bold text-gray-900">{(r.paper as any)?.title}</p>
                              <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1">
                                <BookOpen size={12} /> {(r.paper as any)?.subject}
                              </p>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <div className="text-sm font-black text-gray-900">{r.totalScore} / {(r.paper as any)?.totalMarks}</div>
                            </td>
                            <td className="px-8 py-6 text-center">
                              <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-black ${pct >= 80 ? 'bg-emerald-50 text-emerald-600' : pct >= 50 ? 'bg-amber-50 text-amber-600' : 'bg-red-50 text-red-600'
                                }`}>
                                {pct}%
                              </div>
                            </td>
                            <td className="px-8 py-6">
                              <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${r.isGraded ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                                {r.isGraded ? 'Graded' : 'Pending Review'}
                              </span>
                            </td>
                            <td className="px-8 py-6 text-gray-500 text-xs">
                              {new Date(r.submittedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                            </td>
                            <td className="px-8 py-6 text-right">
                              <button onClick={() => setViewingResult(r)}
                                className="p-2 bg-white border border-gray-200 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white hover:border-indigo-600 transition-all shadow-sm active:scale-95">
                                <Eye size={18} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-20 text-gray-400">
                  <Target size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="font-bold text-lg">No results yet</p>
                  <p className="text-sm mt-1">Complete your first exam to see results here.</p>
                </div>
              )}

              {/* RESULT DETAILS MODAL */}
              {viewingResult && (
                <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="bg-white rounded-[2.5rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col">
                    <div className="flex justify-between items-center px-8 py-6 bg-white border-b border-gray-100">
                      <div className="flex items-center gap-4">
                        <div className="bg-indigo-600 text-white p-3 rounded-2xl shadow-lg shadow-indigo-100">
                          <FileCheck size={24} />
                        </div>
                        <div>
                          <h2 className="text-xl font-black text-gray-900 leading-none mb-1">Exam Review</h2>
                          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                            {(viewingResult.paper as any)?.title} • Submitted on {new Date(viewingResult.submittedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => window.print()}
                          className="flex items-center gap-2 px-5 py-2.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-100 transition-all text-xs font-black"
                        >
                          <Printer size={16} />
                          Print Response
                        </button>
                        <button
                          onClick={() => setViewingResult(null)}
                          className="p-2.5 bg-rose-50 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all"
                        >
                          <X size={20} />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8">
                      <div className="grid grid-cols-3 gap-6 print-header-grid">
                        <div className="bg-indigo-50 p-6 rounded-3xl text-center print-compact-box print-bg-indigo">
                          <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-1 print-text-sm">Score</p>
                          <p className="text-4xl font-black text-indigo-600 print-text-lg">{viewingResult.totalScore}<span className="text-lg text-indigo-300 print-text-sm">/{(viewingResult.paper as any)?.totalMarks}</span></p>
                        </div>
                        <div className="bg-emerald-50 p-6 rounded-3xl text-center print-compact-box print-bg-emerald">
                          <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1 print-text-sm">Percentage</p>
                          <p className="text-4xl font-black text-emerald-600 print-text-lg">{Math.round((viewingResult.totalScore / ((viewingResult.paper as any)?.totalMarks || 1)) * 100)}%</p>
                        </div>
                        <div className="bg-slate-50 p-6 rounded-3xl text-center print-compact-box">
                          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1 print-text-sm">Status</p>
                          <p className={`text-xl font-black mt-2 print-text-lg ${viewingResult.isGraded ? 'text-emerald-600' : 'text-amber-600'}`}>
                            {viewingResult.isGraded ? 'Graded' : 'Pending Review'}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-5 pt-4">
                        <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                          <FileText size={20} className="text-indigo-600" />
                          Question-wise Analysis
                          <span className="text-[10px] bg-red-100 text-red-700 px-2 rounded">
                            Debug: Paper {viewingResult.paper ? 'Yes' : 'No'} | Questions: {
                              viewingResult.paper ? (typeof (viewingResult.paper as any).questions === 'string' ? 'String' : Array.isArray((viewingResult.paper as any).questions) ? 'Array' : 'Object') : 'N/A'
                            }
                          </span>
                        </h3>

                        <style>{`
                             @media print {
                               .no-print { display: none !important; }
                               
                               @page {
                                 size: A4;
                                 margin: 10mm;
                               }

                               body { 
                                 background: white !important; 
                                 color: black !important;
                                 font-size: 11px !important;
                               }

                               .print-container {
                                 width: 100% !important;
                                 max-width: none !important;
                                 margin: 0 !important;
                                 padding: 0 !important;
                                 box-shadow: none !important;
                                 border: none !important;
                               }

                               .print-card { 
                                 border: 1px solid #000 !important;
                                 box-shadow: none !important;
                                 break-inside: avoid;
                                 margin-bottom: 1rem !important;
                                 padding: 1rem !important;
                                 border-radius: 4px !important;
                               }
                               
                               .print-label {
                                 font-weight: bold !important;
                                 text-transform: uppercase !important;
                                 font-size: 9px !important;
                                 margin-bottom: 4px !important;
                                 display: block !important;
                                 color: #333 !important;
                               }

                               .print-compact-box {
                                 padding: 0.25rem 0.5rem !important;
                                 margin-bottom: 0.25rem !important;
                               }

                               .print-header-grid {
                                 display: grid !important;
                                 grid-template-columns: repeat(3, 1fr) !important;
                                 gap: 0.5rem !important;
                                 margin-bottom: 1rem !important;
                                 border: 1px solid #000 !important;
                                 padding: 0.5rem !important;
                               }

                               .print-text-lg { font-size: 14px !important; font-weight: bold !important; }
                               .print-text-sm { font-size: 10px !important; }
                               
                               .print-bg-indigo { background-color: #f8fafc !important; }
                               .print-bg-emerald { background-color: #f0fdf4 !important; }
                               
                               h1, h2, h3 { color: black !important; margin: 0 !important; }
                               
                               /* Maximize space */
                               .overflow-y-auto { overflow: visible !important; height: auto !important; }
                               .flex-1 { flex: none !important; display: block !important; }
                               .space-y-8 > :not([hidden]) ~ :not([hidden]) { margin-top: 1rem !important; }
                               
                               /* Question Report Layout */
                               .question-item {
                                 border-bottom: 1px dashed #ccc !important;
                                 padding-bottom: 1rem !important;
                                 margin-bottom: 1rem !important;
                               }
                               
                               .no-screen { display: block !important; }
                               .screen-only { display: none !important; }
                             }
                             
                             .no-screen { display: none; }
                           `}</style>


                        {(() => {
                          // 2-day window after grading
                          const gradedAt = viewingResult.gradedAt ? new Date(viewingResult.gradedAt) : null;
                          const daysSinceGraded = gradedAt ? (Date.now() - gradedAt.getTime()) / 86400000 : 0;

                          const answerEntries = Object.entries(viewingResult.answers || {});
                          const answersClearedByServer = viewingResult.isGraded && answerEntries.length === 0;
                          const isReviewLocked = viewingResult.isGraded && ((gradedAt && daysSinceGraded > 2) || answersClearedByServer);

                          if (isReviewLocked) {
                            return (
                              <div className="bg-slate-50 border-2 border-slate-200 rounded-3xl p-10 text-center">
                                <AlertCircle className="mx-auto text-slate-400 mb-4" size={48} />
                                <p className="text-slate-800 font-black text-2xl mb-2">Review No Longer Available</p>
                                <p className="text-slate-600 text-sm max-w-md mx-auto leading-relaxed">
                                  To save space, detailed paper reviews are permanently deleted <strong>48 hours after grading</strong>.
                                </p>
                                <div className="mt-6 inline-block bg-white border border-slate-200 rounded-xl px-6 py-4 shadow-sm">
                                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Your Final Score</p>
                                  <p className="text-3xl font-black text-indigo-600">{viewingResult.totalScore} <span className="text-sm font-medium text-slate-400">marks</span></p>
                                </div>
                              </div>
                            );
                          }

                          return answerEntries.map(([qId, ans]: [string, any], qIdx: number) => {
                            let rawQ = (viewingResult.paper as any)?.questions;
                            if (fetchedPapers[viewingResult.paperId]?.questions) {
                              rawQ = fetchedPapers[viewingResult.paperId].questions;
                            }
                            if (typeof rawQ === 'string') { try { rawQ = JSON.parse(rawQ); } catch (e) { rawQ = []; } }
                            const qList = Array.isArray(rawQ) ? rawQ : Object.values(rawQ || {});
                            // Fallback: match by ID or positional index
                            const found = qList.find((q: any) => String(q.id) === String(qId) || String(q.questionId) === String(qId)) || qList[qIdx] || {};

                            const qText = ans.questionText || found.text || '';
                            const qTextUrdu = ans.questionTextUrdu || found.textUrdu || '';
                            const qType = ans.questionType || found.type || (ans.isObjective ? 'MCQ' : 'Short Answer');
                            const qMarks = ans.questionMarks || found.marks || 1;
                            const qMedium = ans.questionMedium || found.medium || 'English';
                            const qCorrectKey = String(ans.questionCorrectAnswer || found.correctAnswer || '').trim();

                            const rawOpts = ans.questionOptions || found.options || [];
                            const rawOptsUrdu = ans.questionOptionsUrdu || found.optionsUrdu || [];

                            let qOpts: string[] = []; let qOptsUrdu: string[] = [];
                            try { qOpts = Array.isArray(rawOpts) ? rawOpts : JSON.parse(rawOpts); } catch (e) { qOpts = []; }
                            try { qOptsUrdu = Array.isArray(rawOptsUrdu) ? rawOptsUrdu : JSON.parse(rawOptsUrdu); } catch (e) { qOptsUrdu = []; }

                            // Reconstruct the question object for the JSX below to consume
                            const question = {
                              text: qText,
                              textUrdu: qTextUrdu,
                              type: qType,
                              marks: qMarks,
                              medium: qMedium,
                              options: qOpts,
                              optionsUrdu: qOptsUrdu,
                              correctAnswer: qCorrectKey,
                              matchingPairs: ans.questionMatchingPairs || found.matchingPairs || []
                            };

                            return (
                              <div key={qId} className="space-y-3 p-6 bg-white rounded-2xl border border-gray-100 shadow-sm mt-4 print-card question-item">
                                <div className="flex justify-between items-start">
                                  <div className="flex-1">
                                    <h3 className="font-bold text-gray-800 text-base mb-1 flex items-center gap-2">
                                      <span className="w-5 h-5 rounded bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center shrink-0">
                                        {qIdx + 1}
                                      </span>
                                      {ans.isObjective ? 'Objective Question' : 'Subjective Question'}
                                    </h3>

                                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200 mb-3">
                                      <span className="print-label no-screen">Question:</span>
                                      <p className="text-gray-700 font-medium">
                                        {question.text ? renderFormattedText(question.text) : 'Question text not available'}
                                      </p>
                                      {question.textUrdu && <p className="text-gray-600 font-urdu mt-2 text-right">{question.textUrdu}</p>}

                                      {/* MCQ OPTIONS DISPLAY */}
                                      {question.type === 'MCQ' && (
                                        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-2">
                                          {(() => {
                                            let opts = question.options;
                                            if (typeof opts === 'string') {
                                              try { opts = JSON.parse(opts); } catch (e) { opts = []; }
                                            }
                                            const optsList = Array.isArray(opts) ? opts : [];
                                            const letters = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];
                                            const normalize = (v: any) => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');

                                            const resolveChoiceIndex = (raw: any) => {
                                              const norm = normalize(raw);
                                              if (!norm) return -1;

                                              // 1) Letter formats: "A", "a.", "(b)", "option c"
                                              const compact = norm.replace(/\s+/g, '');
                                              const m1 = compact.match(/^\(?([a-h])\)?[\).:\-]*$/i);
                                              if (m1?.[1]) return ['a','b','c','d','e','f','g','h'].indexOf(m1[1].toLowerCase());
                                              const m2 = compact.match(/option([a-h])/i);
                                              if (m2?.[1]) return ['a','b','c','d','e','f','g','h'].indexOf(m2[1].toLowerCase());

                                              // 1b) Starts with a letter token: "D - ...", "D) ...", "D. ...", "D: ..."
                                              const startLetter = norm.match(/^\s*\(?\s*([a-h])\s*[\).:\-]/i);
                                              if (startLetter?.[1]) return ['a','b','c','d','e','f','g','h'].indexOf(startLetter[1].toLowerCase());

                                              // 2) Numeric index
                                              if (/^\d+$/.test(compact)) {
                                                const idx = parseInt(compact, 10);
                                                if (Number.isFinite(idx) && idx >= 0 && idx < optsList.length) return idx;
                                              }

                                              // 3) Exact option text match
                                              const byText = optsList.findIndex((opt: string) => normalize(opt) === norm);
                                              if (byText !== -1) return byText;

                                              return -1;
                                            };

                                            let correctIdx = resolveChoiceIndex(question?.correctAnswer);
                                            const studentIdx = resolveChoiceIndex(ans?.studentAnswer);

                                            // If DB key isn't parseable but auto-grader gave full marks, treat student's choice as correct
                                            const gotFullMarks = Number(ans?.autoScore || 0) === Number(question?.marks || 0) && Number(question?.marks || 0) > 0;
                                            if (correctIdx === -1 && gotFullMarks && studentIdx !== -1) correctIdx = studentIdx;

                                            const isWrongPick = studentIdx !== -1 && correctIdx !== -1 && studentIdx !== correctIdx;

                                            return optsList.map((opt: string, i: number) => {
                                              const letter = letters[i] || '?';
                                              const isStudentPick = i === studentIdx;
                                              const isCorrect = i === correctIdx;

                                              // Extract Urdu option if available
                                              let optUrdu = '';
                                              if (question.optionsUrdu) {
                                                let optsU = question.optionsUrdu;
                                                if (typeof optsU === 'string') {
                                                  try { optsU = JSON.parse(optsU); } catch (e) { optsU = []; }
                                                }
                                                if (Array.isArray(optsU) && optsU[i]) optUrdu = optsU[i];
                                              }
                                              return (
                                                <div key={i} className={`p-3 rounded-xl border flex flex-col gap-1 transition-all ${isCorrect
                                                    ? 'bg-emerald-50 border-emerald-400 shadow-sm'
                                                    : isStudentPick
                                                      ? 'bg-red-50 border-red-300'
                                                      : 'bg-white border-gray-100'
                                                  }`}>
                                                  <div className="flex gap-2 items-center">
                                                    <span className={`font-black text-[10px] ${isCorrect ? 'text-emerald-600' : 'text-indigo-600'}`}>{letter}.</span>
                                                    <span className={`flex-1 text-xs ${isStudentPick || isCorrect ? 'font-bold' : ''}`}>{opt}</span>
                                                    {isCorrect && (
                                                      <span className="text-[8px] uppercase text-emerald-600 font-black flex items-center gap-1">
                                                        {isStudentPick ? <CheckCircle size={10} /> : null} Correct Answer
                                                      </span>
                                                    )}
                                                    {isStudentPick && !isCorrect && (
                                                      <span className="text-[8px] uppercase text-red-500 font-black">
                                                        Your Pick (Wrong)
                                                      </span>
                                                    )}
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

                                          {/* If student picked wrong, also show a clear answer key (text) */}
                                          {(() => {
                                            const normalize = (v: any) => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');
                                            let opts: any = question.options;
                                            if (typeof opts === 'string') {
                                              try { opts = JSON.parse(opts); } catch (e) { opts = []; }
                                            }
                                            const optsList = Array.isArray(opts) ? opts : [];

                                            let optsUrdu: any = question.optionsUrdu;
                                            if (typeof optsUrdu === 'string') {
                                              try { optsUrdu = JSON.parse(optsUrdu); } catch (e) { optsUrdu = []; }
                                            }
                                            const optsUrduList = Array.isArray(optsUrdu) ? optsUrdu : [];

                                            const rawKey = String(question?.correctAnswer || '').trim();

                                            // replicate index resolution (limited) for display only
                                            const norm = normalize(rawKey);
                                            const compact = norm.replace(/\s+/g, '');
                                            const m1 = compact.match(/^\(?([a-h])\)?[\).:\-]*$/i);
                                            const m2 = compact.match(/option([a-h])/i);
                                            const startLetter = norm.match(/^\s*\(?\s*([a-h])\s*[\).:\-]/i);
                                            const letterToken = (m1?.[1] || m2?.[1] || startLetter?.[1] || '').toLowerCase();
                                            const letterIdx = letterToken ? ['a','b','c','d','e','f','g','h'].indexOf(letterToken) : -1;
                                            const byTextIdx = optsList.findIndex((opt: string) => normalize(opt) === norm);
                                            const keyIdx = letterIdx !== -1 ? letterIdx : (byTextIdx !== -1 ? byTextIdx : -1);

                                            const studentRaw = ans?.studentAnswer;
                                            const studentNorm = normalize(studentRaw);
                                            const studentCompact = studentNorm.replace(/\s+/g, '');
                                            const sm = studentCompact.match(/^\(?([a-h])\)?[\).:\-]*$/i);
                                            const studentLetter = sm?.[1]?.toLowerCase() || '';
                                            const studentIdx = studentLetter ? ['a','b','c','d','e','f','g','h'].indexOf(studentLetter) : (/^\d+$/.test(studentCompact) ? parseInt(studentCompact, 10) : optsList.findIndex((opt: string) => normalize(opt) === studentNorm));

                                            const isWrongPick = studentIdx !== -1 && keyIdx !== -1 && studentIdx !== keyIdx;
                                            if (!isWrongPick) return null;

                                            const displayLetter = keyIdx !== -1 ? (['A','B','C','D','E','F','G','H'][keyIdx] || '') : '';
                                            const displayText = keyIdx !== -1 ? (optsList[keyIdx] || '') : '';
                                            const displayUrdu = keyIdx !== -1 ? (optsUrduList[keyIdx] || '') : '';

                                            return (
                                              <div className="md:col-span-2 mt-2 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900">
                                                <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1">Correct Answer</p>
                                                <div className="text-xs font-bold">
                                                  {displayLetter ? `${displayLetter}. ` : ''}
                                                  {displayText ? renderFormattedText(displayText) : (rawKey ? renderFormattedText(rawKey) : 'No key available.')}
                                                </div>
                                                {displayUrdu && (
                                                  <div className="text-right font-urdu text-sm mt-1" dir="rtl">
                                                    {displayUrdu}
                                                  </div>
                                                )}
                                              </div>
                                            );
                                          })()}

                                          {(() => {
                                            const normalize = (v: any) => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');
                                            const rawKey = String(question?.correctAnswer || '').trim();
                                            let opts: any = question.options;
                                            if (typeof opts === 'string') {
                                              try { opts = JSON.parse(opts); } catch (e) { opts = []; }
                                            }
                                            const optsList = Array.isArray(opts) ? opts : [];
                                            const hasGreen = (() => {
                                              const norm = normalize(rawKey);
                                              if (!norm) return false;
                                              const compact = norm.replace(/\s+/g, '');
                                              const m1 = compact.match(/^\(?([a-h])\)?[\).:\-]*$/i);
                                              if (m1?.[1]) return true;
                                              const m2 = compact.match(/option([a-h])/i);
                                              if (m2?.[1]) return true;
                                              const startLetter = norm.match(/^\s*\(?\s*([a-h])\s*[\).:\-]/i);
                                              if (startLetter?.[1]) return true;
                                              return false;
                                            })();

                                            // If key isn't parseable and doesn't match any option text, show raw key below as fallback
                                            if (!rawKey) return null;
                                            if (hasGreen) return null;

                                            const byText = optsList.findIndex((opt: string) => normalize(opt) === normalize(rawKey));
                                            if (byText !== -1) return null;

                                            return (
                                              <div className="md:col-span-2 mt-2 p-3 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-900">
                                                <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1">Answer Key</p>
                                                <div className="text-xs font-bold">{renderFormattedText(rawKey)}</div>
                                              </div>
                                            );
                                          })()}
                                        </div>
                                      )}

                                      {/* OTHER OBJECTIVE TYPES (Fill Blanks / True-False / Matching / Short Objective) */}
                                      {ans.isObjective && question.type !== 'MCQ' && (
                                        <div className="mt-4 space-y-3">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border ${
                                              ans.isCorrect ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
                                            }`}>
                                              {ans.isCorrect ? 'Correct' : 'Incorrect'}
                                            </span>
                                            <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded border bg-white text-gray-600 border-gray-200">
                                              Answer Key
                                            </span>
                                          </div>

                                          {String(question.type || '').toLowerCase().includes('true') && String(question.type || '').toLowerCase().includes('false') ? (
                                            <div className="grid grid-cols-2 gap-2">
                                              {(() => {
                                                const normalize = (v: any) => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');
                                                const correctKey = normalize(question.correctAnswer);
                                                const studentKey = normalize(ans?.studentAnswer);
                                                const opts = ['True', 'False'];
                                                return opts.map((opt) => {
                                                  const optKey = normalize(opt);
                                                  const isCorrectOpt = optKey === correctKey || (optKey === 'true' && correctKey === 't') || (optKey === 'false' && correctKey === 'f');
                                                  const isStudentPick = optKey === studentKey || (optKey === 'true' && studentKey === 't') || (optKey === 'false' && studentKey === 'f');
                                                  return (
                                                    <div key={opt} className={`p-3 rounded-xl border flex items-center justify-between text-xs font-bold transition-all ${
                                                      isCorrectOpt
                                                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                                                        : isStudentPick
                                                          ? 'bg-red-50 border-red-200 text-red-800'
                                                          : 'bg-white border-gray-100 text-gray-700'
                                                    }`}>
                                                      <span>{opt}</span>
                                                      {isCorrectOpt && <span className="text-[9px] font-black uppercase">Correct Answer</span>}
                                                      {isStudentPick && !isCorrectOpt && <span className="text-[9px] font-black uppercase">Your Pick</span>}
                                                    </div>
                                                  );
                                                });
                                              })()}
                                            </div>
                                          ) : String(question.type || '').toLowerCase().includes('match') ? (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                              {(() => {
                                                const normalize = (v: any) => String(v || '').trim().toLowerCase().replace(/\s+/g, ' ');
                                                const correctPairs: any[] = Array.isArray(question.matchingPairs) ? question.matchingPairs : [];
                                                const studentPairs: any[] = Array.isArray(ans?.studentAnswer) ? ans.studentAnswer : [];
                                                return (
                                                  <>
                                                    <div className="p-3 bg-white rounded-xl border border-gray-200">
                                                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Your Matching</p>
                                                      {studentPairs.length === 0 ? (
                                                        <p className="text-xs text-gray-600">No matching submitted.</p>
                                                      ) : (
                                                        <div className="space-y-2">
                                                          {studentPairs.map((p: any, idx: number) => {
                                                            const correctRight = correctPairs.find(cp => normalize(cp.left) === normalize(p.left))?.right;
                                                            const rowCorrect = normalize(p.right) && correctRight ? normalize(p.right) === normalize(correctRight) : false;
                                                            return (
                                                              <div key={idx} className={`text-xs font-medium p-2 rounded-lg border ${
                                                                rowCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-red-50 border-red-200 text-red-900'
                                                              }`}>
                                                                <span className="font-black">{p.left}</span> → <span className="font-black">{p.right || '—'}</span>
                                                              </div>
                                                            );
                                                          })}
                                                        </div>
                                                      )}
                                                    </div>

                                                    <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                                                      <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-2">Correct Answer</p>
                                                      {correctPairs.length === 0 ? (
                                                        <p className="text-xs text-emerald-900">No key available.</p>
                                                      ) : (
                                                        <div className="space-y-2">
                                                          {correctPairs.map((p: any, idx: number) => (
                                                            <div key={idx} className="text-xs font-bold text-emerald-900 p-2 rounded-lg bg-white/70 border border-emerald-200">
                                                              <span className="font-black">{p.left}</span> → <span className="font-black">{p.right}</span>
                                                            </div>
                                                          ))}
                                                        </div>
                                                      )}
                                                    </div>
                                                  </>
                                                );
                                              })()}
                                            </div>
                                          ) : (
                                            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                                              <p className="text-[9px] font-black text-emerald-700 uppercase tracking-widest mb-1">Correct Answer</p>
                                              <div className="text-xs font-bold text-emerald-900 whitespace-pre-wrap">
                                                {question.correctAnswer ? renderFormattedText(question.correctAnswer) : 'No key available.'}
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      )}

                                      <div className="flex flex-wrap gap-x-4 gap-y-2 mt-2 pt-2 border-t border-indigo-100/50">
                                        <span className="text-[10px] text-indigo-600 font-bold">Marks: {question.marks || 0}</span>
                                        {ans.isObjective && (
                                          <>
                                            <span className={`text-[10px] font-bold ${ans.isCorrect ? 'text-emerald-600' : 'text-red-600'}`}>
                                              Auto: {ans.autoScore || 0} / {question.marks || 0}
                                            </span>
                                            {question.correctAnswer && question.type === 'MCQ' && (
                                              <span className="text-[10px] text-emerald-600 font-black flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                                                <Key size={10} /> SYSTEM KEY: {question.correctAnswer}
                                              </span>
                                            )}
                                          </>
                                        )}
                                        {!ans.isObjective && question.correctAnswer && (
                                          <div className="w-full mt-1 p-2 bg-emerald-50 border border-emerald-100 rounded-lg">
                                            <p className="text-[9px] font-black text-emerald-600 uppercase mb-0.5">Reference / Model Answer:</p>
                                            <div className="text-[10px] text-emerald-900 font-medium">
                                              {renderFormattedText(question.correctAnswer)}
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex flex-col items-center justify-center ml-4 px-3 py-2 bg-gray-50 rounded-xl border border-gray-100 min-w-[80px] print-bg-slate">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Score</label>
                                    <span className={`text-lg font-black ${ans.isCorrect || (ans.teacherScore && ans.teacherScore > 0) ? 'text-emerald-600' : 'text-gray-900'}`}>
                                      {(ans.autoScore || 0) + (ans.teacherScore || 0)}
                                    </span>
                                  </div>
                                </div>

                                <div className={`p-4 rounded-xl border transition-colors print-card ${ans.isCorrect ? 'bg-emerald-50/50 border-emerald-100' : 'bg-red-50/50 border-red-100'}`}>
                                  <span className="print-label no-screen">Your Response:</span>
                                  <p className={`text-[9px] font-bold uppercase mb-1 screen-only ${ans.isCorrect ? 'text-emerald-500' : 'text-red-500'}`}>Your Attempted Response:</p>
                                  <div className={`whitespace-pre-wrap font-mono text-xs leading-relaxed font-bold ${ans.isCorrect ? 'text-emerald-900' : 'text-red-900'}`}>
                                    {typeof ans.studentAnswer === 'object' ? (
                                      <pre className="text-[10px] bg-white p-2 border border-gray-100 rounded">
                                        {JSON.stringify(ans.studentAnswer, null, 2)}
                                      </pre>
                                    ) : (
                                      renderFormattedText(ans.studentAnswer)
                                    )}
                                  </div>
                                </div>

                                {(ans.feedback || ans.teacherFeedback) && (
                                  <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl mt-3">
                                    <label className="block text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Teacher Feedback</label>
                                    <p className="text-gray-800 text-sm font-medium italic leading-relaxed">
                                      "{ans.feedback || ans.teacherFeedback}"
                                    </p>
                                  </div>
                                )}
                              </div>
                            );
                          })
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            )
          )}


          {/* SETTINGS/PROFILE TAB */}
          {activeTab === 'SETTINGS' && (
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="bg-white rounded-[2.5rem] border border-gray-200 shadow-xl overflow-hidden">
                <div className="p-10 bg-gray-50 border-b border-gray-200 flex flex-col md:flex-row items-center gap-8">
                  <div className="relative">
                    <div className="w-28 h-28 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2.5rem] flex items-center justify-center text-white text-4xl font-black shadow-2xl">
                      {user.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-2 rounded-xl shadow-lg ring-4 ring-gray-50">
                      <CheckCircle size={16} />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tight">{user.name}</h2>
                    <p className="text-gray-500 font-medium text-lg">{user.email}</p>
                    <div className="mt-4 flex flex-wrap justify-center md:justify-start gap-3">
                      <span className="px-4 py-1.5 bg-indigo-50 text-indigo-600 rounded-full text-xs font-bold uppercase tracking-widest border border-indigo-100">Student Identity Verified</span>
                      <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-bold uppercase tracking-widest border border-emerald-100">Academic Standing: Good</span>
                    </div>
                  </div>
                </div>

                <div className="p-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-6">
                      <h3 className="font-black text-gray-900 uppercase tracking-widest text-[11px] mb-4">Institutional Details</h3>
                      {[
                        { label: 'Academic Roll Number', value: (user as any).rollNo || 'EF-2024-001', icon: Target },
                        { label: 'Assigned Class', value: (user as any).classLevel?.name || 'Grade 10 - Alpha', icon: GraduationCap },
                        { label: 'Primary Campus', value: 'Main Institutional Wing', icon: Award },
                        { label: 'Academic Session', value: '2024-2025', icon: Calendar },
                      ].map((item, i) => (
                        <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                          <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-indigo-600">
                            <item.icon size={20} />
                          </div>
                          <div>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{item.label}</p>
                            <p className="font-bold text-gray-900">{item.value}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="space-y-6">
                      <h3 className="font-black text-gray-900 uppercase tracking-widest text-[11px] mb-4">Security & Access</h3>
                      <div className="space-y-4">
                        <button className="w-full p-5 bg-white border-2 border-gray-100 rounded-2xl flex items-center justify-between hover:border-indigo-500 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center"><Lock size={18} /></div>
                            <div className="text-left">
                              <p className="font-bold text-gray-900">Change Password</p>
                              <p className="text-xs text-gray-400">Update your account security</p>
                            </div>
                          </div>
                          <ChevronRight size={20} className="text-gray-300 group-hover:text-indigo-600 transition-all" />
                        </button>

                        <button className="w-full p-5 bg-white border-2 border-gray-100 rounded-2xl flex items-center justify-between hover:border-indigo-500 transition-all group">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center"><HelpCircle size={18} /></div>
                            <div className="text-left">
                              <p className="font-bold text-gray-900">Support Center</p>
                              <p className="text-xs text-gray-400">Get help with exams or portal</p>
                            </div>
                          </div>
                          <ChevronRight size={20} className="text-gray-300 group-hover:text-indigo-600 transition-all" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
                <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
                  <div className="flex-1">
                    <h3 className="text-2xl font-black mb-2 tracking-tight">Performance Summary</h3>
                    <p className="text-slate-400 font-medium">Your academic progress visualized across all examinations.</p>
                  </div>
                  <div className="grid grid-cols-3 gap-6 flex-1 w-full max-w-md">
                    <div className="text-center">
                      <p className="text-3xl font-black text-indigo-400">{totalExams}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Attempted</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-black text-emerald-400">{avgScore}%</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Average</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-black text-amber-400">{bestScore}%</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Percentile</p>
                    </div>
                  </div>
                </div>
                <div className="absolute right-0 top-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px]"></div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const GradCap: React.FC<{ size: number }> = ({ size }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

export default StudentDashboard;
