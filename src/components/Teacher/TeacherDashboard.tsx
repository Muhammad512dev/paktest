
import React, { useMemo, useEffect, useState } from 'react';
import { 
  Calendar, 
  Clock, 
  FilePlus, 
  FileText, 
  Users,
  Sparkles,
  ArrowRight,
  TrendingUp,
  LayoutDashboard,
  Bell,
  BookOpen,
  Lock
} from 'lucide-react';
import { getPapersBySchool, getSchoolById, getPlans, getTeacherStats } from '../../services/dataService';
import { User, School, SavedPaper, SubscriptionPlan } from '../../types';

interface TeacherDashboardProps {
  onNavigate: (view: string) => void;
  user: User;
}

const TeacherDashboard: React.FC<TeacherDashboardProps> = ({ onNavigate, user }) => {
  /* Fixed: Use state instead of useMemo for Promise-returning service calls */
  const [school, setSchool] = useState<School | null>(null);
  const [myPapers, setMyPapers] = useState<SavedPaper[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [totalSchoolPapers, setTotalSchoolPapers] = useState(0);
  const [statsData, setStatsData] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  
  useEffect(() => {
    /* Fixed: Fetch data asynchronously and update state */
    const loadData = async () => {
      const schoolId = user.schoolId || 's1';
      const [schoolData, allPapers, plansData, stats] = await Promise.all([
        getSchoolById(schoolId),
        getPapersBySchool(schoolId),
        getPlans(),
        getTeacherStats()
      ]);

      setSchool(schoolData);
      setPlans(plansData);
      setTotalSchoolPapers(allPapers.length);
      setStatsData(stats);
      setLoadingStats(false);

      const filtered = allPapers.filter((p: SavedPaper) => p.author === user.name).slice(0, 5);
      setMyPapers(filtered);

      if (schoolData?.branding) {
        const b = schoolData.branding;
        const root = document.documentElement;
        root.style.setProperty('--brand-primary', b.themeColor);
        root.style.setProperty('--brand-secondary', b.secondaryColor);
        root.style.setProperty('--brand-light', b.lightColor);
        root.style.setProperty('--app-font', b.appFont);
      }
    };
    loadData();
  }, [user.schoolId, user.name]);

  // Subscription Logic
  const currentPlan = useMemo(() => plans.find(p => p.name === school?.subscriptionPlan), [plans, school]);
  const isExpired = school?.validTill ? new Date(school.validTill) < new Date() : false;
  const isLimitReached = currentPlan && totalSchoolPapers >= currentPlan.limits.papers;
  const isLocked = isExpired || isLimitReached;

  const stats = [
    { label: 'Papers Found', value: statsData?.papersCount?.toString() || '0', icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Graded Exams', value: statsData?.submissionsCount?.toString() || '0', icon: Calendar, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'My Students', value: statsData?.studentCount?.toString() || '0', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Avg Accuracy', value: statsData?.avgScore || '0%', icon: TrendingUp, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Dynamic Personal Welcome */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/20 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3"></div>
         <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex items-center gap-8">
               <div className="relative">
                  {school?.logo ? (
                     <div className="w-24 h-24 rounded-[2rem] border-4 border-white/10 shadow-2xl overflow-hidden bg-white p-2">
                        <img src={school.logo} className="w-full h-full object-contain" alt="School Logo"/>
                     </div>
                  ) : (
                     <img src={user.avatar} className="w-24 h-24 rounded-[2rem] border-4 border-white/10 shadow-2xl object-cover" alt="User Avatar"/>
                  )}
                  <div className="absolute -bottom-2 -right-2 bg-brand text-white p-2 rounded-xl shadow-lg ring-4 ring-slate-900">
                     <Sparkles size={16} />
                  </div>
               </div>
               <div>
                  <h1 className="text-4xl font-black tracking-tight">Welcome back, {user.name.split(' ')[0]}!</h1>
                  <p className="text-indigo-200 mt-2 text-lg font-medium opacity-80">{school?.name || 'Academic Institution'} • Senior Faculty</p>
                  <div className="flex flex-wrap gap-3 mt-6">
                     <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-indigo-300 bg-white/5 px-4 py-2 rounded-full border border-white/5">
                        <Clock size={14} /> Finalized {myPapers.length > 0 ? myPapers.length : 0} Papers Total
                     </div>
                     {user.assignedSyllabuses && user.assignedSyllabuses.length > 0 ? (
                        user.assignedSyllabuses.map((sub, idx) => (
                           <div key={idx} className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white bg-indigo-600 px-4 py-2 rounded-full border border-indigo-500/50 shadow-md">
                              <BookOpen size={14} /> {sub}
                           </div>
                        ))
                     ) : (
                        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 bg-black/20 px-4 py-2 rounded-full border border-white/5">
                           No Specific Subjects Assigned
                        </div>
                     )}
                  </div>
               </div>
            </div>
            <button 
               onClick={() => !isLocked && onNavigate('generate')}
               disabled={isLocked}
               title={isLocked ? (isExpired ? "School Plan Expired" : "School Paper Limit Reached") : "Draft Exam"}
               className={`group flex items-center gap-3 px-8 py-4 rounded-2xl text-base font-black uppercase tracking-widest transition-all shadow-[0_20px_50px_rgba(79,70,229,0.3)] ${
                   isLocked 
                   ? 'bg-slate-700 text-gray-400 cursor-not-allowed' 
                   : 'bg-brand text-white hover:bg-brand-secondary hover:scale-105'
               }`}
            >
               {isLocked ? <Lock size={22} /> : <FilePlus size={22} />}
               {isLocked ? 'Locked' : 'Draft Exam Paper'}
               {!isLocked && <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />}
            </button>
         </div>
      </div>

      {/* Productivity KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-7 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
              <stat.icon size={28} className={stat.color} />
            </div>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{stat.value}</h3>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-2">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Personal Workflow History */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
             <div>
                <h3 className="font-black text-slate-900 text-xl tracking-tight">My Recent Generations</h3>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">Your personal paper archive</p>
             </div>
             <button onClick={() => onNavigate('saved')} className="text-sm font-black text-brand uppercase tracking-widest flex items-center gap-2 hover:underline">
                View All <ArrowRight size={14} />
             </button>
          </div>
          <div className="divide-y divide-slate-50">
             {myPapers.map(paper => (
               <div key={paper.id} className="p-6 hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer">
                 <div className="flex items-center gap-5">
                   <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-brand group-hover:text-white transition-all">
                     <FileText size={24} />
                   </div>
                   <div>
                     <h4 className="font-bold text-slate-900 text-base group-hover:text-brand transition-colors">{paper.title}</h4>
                     <p className="text-xs text-slate-400 font-bold uppercase mt-1 tracking-wider">{paper.subject} • {paper.classLevel} • {paper.totalMarks} Marks</p>
                   </div>
                 </div>
                 <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-sm ${
                      paper.status === 'Finalized' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                      paper.status === 'Draft' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                    {paper.status}
                 </span>
               </div>
             ))}
             {myPapers.length === 0 && (
                 <div className="p-20 text-center text-slate-300 italic flex flex-col items-center">
                    <FilePlus size={40} className="mb-4 opacity-20" />
                    <p className="text-sm font-bold uppercase tracking-widest">No papers created yet</p>
                 </div>
             )}
          </div>
          <div className="p-8 border-t border-slate-50 bg-slate-50/30">
             <div className="flex items-center gap-4 text-xs font-bold text-slate-500 uppercase tracking-widest">
                <LayoutDashboard size={16} /> Dashboard Tip: Use "AI Generator" for rapid drafting.
             </div>
          </div>
        </div>

        {/* Institution Notices */}
        <div className="space-y-8">
           <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col">
              <div className="p-7 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                 <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                    <Bell size={20} className="text-brand" /> Staff Room Notices
                 </h3>
              </div>
              <div className="p-6 space-y-6">
                 <div className="p-6 bg-brand-light rounded-[2rem] border border-brand/10 relative group">
                    <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-brand animate-ping"></div>
                    <p className="text-[10px] font-black text-brand uppercase tracking-[0.2em] mb-3">Institutional Update</p>
                    <p className="text-sm text-slate-800 font-bold leading-relaxed">Mandatory Faculty Workshop on AI Grading this Friday at 3:00 PM.</p>
                    <div className="mt-4 flex justify-between items-center">
                       <span className="text-[9px] font-bold text-brand uppercase">Auditorium A</span>
                       <span className="text-[9px] font-bold text-slate-400">2h ago</span>
                    </div>
                 </div>

                 <div className="p-6 bg-amber-50 rounded-[2rem] border border-amber-100 group">
                    <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-3">System Alert</p>
                    <p className="text-sm text-slate-800 font-bold leading-relaxed">Exam module v4.2 deployment tonight. Save all drafts.</p>
                    <div className="mt-4 flex justify-between items-center">
                       <span className="text-[9px] font-bold text-amber-700 uppercase">IT Services</span>
                       <span className="text-[9px] font-bold text-slate-400">1 day ago</span>
                    </div>
                 </div>
              </div>
              <button className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] border-t border-slate-100 hover:text-brand transition-colors text-center">
                 View Historical Notices
              </button>
           </div>

           <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl group-hover:bg-indigo-500/20 transition-all"></div>
              <h4 className="text-lg font-black tracking-tight mb-4 flex items-center gap-3">
                 <Users className="text-indigo-400" size={24} /> 
                 Class Performance
              </h4>
              <p className="text-xs text-slate-400 font-medium mb-8 leading-relaxed">Grade 10 Physics results are 15% higher than last year. Keep it up!</p>
              <button 
                 onClick={() => onNavigate('analytics')}
                 className="w-full py-4 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] transition-all"
              >
                 Detailed Report
              </button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherDashboard;
