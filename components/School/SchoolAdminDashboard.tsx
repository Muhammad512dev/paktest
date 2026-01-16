
import React, { useMemo, useEffect, useState } from 'react';
import { 
  FilePlus, 
  Files, 
  Users, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Info,
  ShieldAlert,
  Zap,
  Building2,
  History,
  FileText,
  Lock
} from 'lucide-react';
import { getSchoolById, getPapersBySchool, getNotificationsForSchool, getActivityLogsBySchool, getPlans } from '../../services/dataService';
import { User, PlatformNotification, ActivityLog, School, SavedPaper, SubscriptionPlan } from '../../types';

interface SchoolAdminDashboardProps {
  onNavigate: (view: string) => void;
  user: User;
}

const SchoolAdminDashboard: React.FC<SchoolAdminDashboardProps> = ({ onNavigate, user }) => {
  const schoolId = user.schoolId || 's1';
  /* Fixed: Use state for school, papers, notifications and logs instead of direct Promise usage */
  const [school, setSchool] = useState<School | null>(null);
  const [recentPapers, setRecentPapers] = useState<SavedPaper[]>([]);
  const [totalPapersCount, setTotalPapersCount] = useState(0);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  useEffect(() => {
    /* Fixed: Use async function to fetch all data since service functions return Promises */
    const fetchData = async () => {
      const [schoolData, papersData, notesData, logsData, plansData] = await Promise.all([
        getSchoolById(schoolId),
        getPapersBySchool(schoolId),
        getNotificationsForSchool(schoolId),
        getActivityLogsBySchool(schoolId),
        getPlans()
      ]);

      setSchool(schoolData);
      setRecentPapers(papersData.slice(0, 5));
      setTotalPapersCount(papersData.length);
      setNotifications(notesData);
      setRecentLogs(logsData.slice(0, 5));
      setPlans(plansData);
      
      if (schoolData?.branding) {
        const b = schoolData.branding;
        const root = document.documentElement;
        root.style.setProperty('--brand-primary', b.themeColor);
        root.style.setProperty('--brand-secondary', b.secondaryColor);
        root.style.setProperty('--brand-light', b.lightColor);
        root.style.setProperty('--app-font', b.appFont);
      }
    };
    fetchData();
  }, [schoolId]);

  const daysRemaining = useMemo(() => {
    if (!school?.validTill) return 0;
    const expiry = new Date(school.validTill);
    const today = new Date();
    const diff = expiry.getTime() - today.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }, [school]);

  // Subscription Limit Checks
  const currentPlan = useMemo(() => plans.find(p => p.name === school?.subscriptionPlan), [plans, school]);
  const isExpired = daysRemaining === 0;
  const isPaperLimitReached = currentPlan && totalPapersCount >= currentPlan.limits.papers;
  const isGenerationLocked = isExpired || isPaperLimitReached;

  const stats = [
    { label: 'Papers Repository', value: school?.stats?.papersCount?.toLocaleString() || '0', trend: '+12%', icon: Files, color: 'text-brand', bg: 'bg-brand-light' },
    { label: 'Teaching Staff', value: school?.stats?.teachersCount?.toString() || '0', trend: 'Stable', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Saved Papers', value: totalPapersCount.toLocaleString(), trend: 'Live', icon: FileText, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Platform Activity', value: recentLogs.length.toString(), trend: '+18%', icon: History, color: 'text-amber-600', bg: 'bg-amber-50' },
  ];

  const getNoteIcon = (type: string) => {
    switch(type) {
      case 'URGENT': return <ShieldAlert size={16} className="text-rose-600" />;
      case 'WARNING': return <AlertTriangle size={16} className="text-amber-600" />;
      case 'UPDATE': return <Zap size={16} className="text-brand" />;
      default: return <Info size={16} className="text-brand" />;
    }
  };

  const getNoteBg = (type: string) => {
    switch(type) {
      case 'URGENT': return 'bg-rose-50 border-rose-100';
      case 'WARNING': return 'bg-amber-50 border-amber-100';
      case 'UPDATE': return 'bg-brand-light border-brand/10';
      default: return 'bg-brand-light border-brand/10';
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Institutional Health Header */}
      {school && (
        <div className={`p-5 rounded-[2rem] border flex flex-col md:flex-row items-center justify-between gap-4 transition-all shadow-sm ${
          daysRemaining < 30 ? 'bg-amber-50 border-amber-200' : 'bg-brand-light border-brand/10'
        }`}>
          <div className="flex items-center gap-5">
             <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
               daysRemaining < 30 ? 'bg-amber-100 text-amber-600' : 'bg-white text-brand'
             }`}>
                {daysRemaining < 30 ? <AlertTriangle size={28}/> : <CheckCircle2 size={28}/>}
             </div>
             <div>
                <h4 className="font-bold text-gray-900 text-lg">
                   {school.subscriptionPlan} Plan Status: <span className={daysRemaining < 30 ? 'text-amber-700' : 'text-brand'}>{school.status}</span>
                </h4>
                <p className="text-sm text-gray-500 font-medium">
                   Expiring <span className="font-bold text-gray-700">{new Date(school.validTill).toLocaleDateString()}</span> • Institutional access will lock in <span className="font-bold text-brand">{daysRemaining} days</span>.
                </p>
             </div>
          </div>
          <button 
            onClick={() => onNavigate('billing')}
            className={`px-8 py-3 rounded-2xl text-xs font-extrabold uppercase tracking-widest transition-all shadow-lg ${
              daysRemaining < 30 
              ? 'bg-amber-600 text-white hover:bg-amber-700 shadow-amber-200' 
              : 'bg-brand text-white hover:bg-brand-secondary shadow-brand/20'
            }`}
          >
            {daysRemaining < 30 ? 'Renew Immediately' : 'Manage Billing'}
          </button>
        </div>
      )}

      {/* Hero Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-8">
        <div className="flex items-center gap-6">
           <div className="w-20 h-20 rounded-3xl bg-white border border-gray-100 shadow-sm flex items-center justify-center overflow-hidden p-1">
              {school?.logo ? <img src={school.logo} className="w-full h-full object-contain" /> : <Building2 size={32} className="text-gray-300" />}
           </div>
           <div>
             <h1 className="text-4xl font-black text-gray-900 tracking-tight">{school?.name || 'Institution Admin'}</h1>
             <p className="text-sm text-gray-500 mt-1 uppercase font-bold tracking-[0.2em]">
               Administrator Command Center • {user.name}
             </p>
           </div>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => !isGenerationLocked && onNavigate('generate')}
            disabled={isGenerationLocked || false}
            title={isGenerationLocked ? (isExpired ? "Subscription Expired" : "Paper Limit Reached") : "Generate New Exam"}
            className={`w-full md:w-auto px-8 py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-xl ${
                isGenerationLocked 
                ? 'bg-gray-400 text-white cursor-not-allowed shadow-none' 
                : 'bg-brand text-white hover:bg-brand-secondary shadow-brand/20'
            }`}
          >
            {isGenerationLocked ? <Lock size={20} /> : <FilePlus size={20} />}
            {isGenerationLocked ? 'Generation Locked' : 'Generate New Exam'}
          </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-7 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all cursor-default group">
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 ${stat.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <stat.icon size={28} className={stat.color} />
              </div>
              <span className="text-[10px] font-extrabold text-green-700 bg-green-50 px-3 py-1.5 rounded-full border border-green-100 uppercase tracking-widest">
                {stat.trend}
              </span>
            </div>
            <h3 className="text-4xl font-black text-gray-900 tracking-tight">{stat.value}</h3>
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-3">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Institutional Repository Preview */}
        <div className="lg:col-span-2 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
            <div>
               <h3 className="font-bold text-gray-900 text-xl">Institution Exam Repository</h3>
               <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-1">Recently finalized academic papers</p>
            </div>
            <button 
              onClick={() => onNavigate('saved')}
              className="px-6 py-2.5 bg-white border border-gray-200 rounded-xl text-xs text-brand font-bold hover:bg-brand-light transition-all flex items-center gap-2 shadow-sm"
            >
              Full Repository <ArrowRight size={14} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Exam Title</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Subject Path</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Author</th>
                  <th className="px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentPapers.map((paper: any) => (
                  <tr key={paper.id} className="hover:bg-brand-light/20 transition-colors group cursor-pointer">
                    <td className="px-8 py-6">
                       <div className="font-bold text-base text-gray-900 group-hover:text-brand transition-colors">{paper.title}</div>
                       <div className="text-[10px] text-gray-400 font-bold uppercase mt-1">Finalized: {paper.dateCreated}</div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="text-sm font-bold text-gray-700">{paper.subject}</div>
                       <div className="text-xs text-gray-400 font-medium">{paper.classLevel}</div>
                    </td>
                    <td className="px-8 py-6">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500">{(paper.author || paper.createdBy || 'U').charAt(0)}</div>
                          <span className="text-sm font-semibold text-gray-600">{paper.author || paper.createdBy || 'Unknown'}</span>
                       </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`inline-flex items-center px-4 py-1.5 rounded-full text-[10px] font-black border uppercase tracking-[0.1em] ${
                          paper.status === 'Finalized' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                      }`}>
                        {paper.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Global Platform Updates */}
        <div className="space-y-8">
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-7 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <Bell size={20} className="text-brand" /> Platform Broadcasts
              </h3>
              <span className="bg-brand/10 text-brand px-3 py-1 rounded-full text-[10px] font-black uppercase">{notifications.length} NEW</span>
            </div>
            <div className="p-6 space-y-4 max-h-[450px] overflow-y-auto custom-scrollbar">
              {notifications.map((note) => (
                <div key={note.id} className={`p-5 rounded-3xl border ${getNoteBg(note.type)} transition-all hover:shadow-lg cursor-default group`}>
                   <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center gap-3">
                         <div className="p-2 bg-white rounded-xl shadow-sm">
                            {getNoteIcon(note.type)}
                         </div>
                         <span className="font-black text-[11px] uppercase tracking-widest text-gray-900">{note.title}</span>
                      </div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">{new Date(note.timestamp).toLocaleDateString()}</span>
                   </div>
                   <p className="text-xs text-gray-600 leading-relaxed font-medium mt-3">{note.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-40 h-40 bg-brand/20 rounded-full blur-[60px] group-hover:bg-brand/30 transition-all"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-8">
                 <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
                    <TrendingUp className="text-brand" size={32} />
                 </div>
                 <div className="text-right">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Tier</p>
                    <h4 className="text-xl font-black text-brand uppercase">{school?.subscriptionPlan}</h4>
                 </div>
              </div>
              <h3 className="font-bold text-2xl mb-2">Institutional Growth</h3>
              <p className="text-slate-400 text-xs mb-10 leading-relaxed font-medium">Your institution has generated <strong>{totalPapersCount} exams</strong> this year. Ready for higher volume?</p>
              <button 
                onClick={() => onNavigate('billing')}
                className="w-full py-4 bg-white text-slate-900 text-[11px] font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-light transition-all shadow-xl group-hover:scale-105"
              >
                Expansion Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SchoolAdminDashboard;
