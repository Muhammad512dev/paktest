
import React, { useMemo, useEffect, useState } from 'react';
import { 
  FilePlus, 
  Files, 
  Users, 
  TrendingUp, 
  Clock, 
  ArrowRight,
  MoreHorizontal,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Bell,
  Info,
  ShieldAlert,
  Zap
} from 'lucide-react';
import { getSchoolById, getPapersBySchool, getNotificationsForSchool } from '../services/dataService';
import { User, PlatformNotification, School, SavedPaper } from '../types';

interface DashboardProps {
  onNavigate: (view: string) => void;
  user: User;
}

const Dashboard: React.FC<DashboardProps> = ({ onNavigate, user }) => {
  const schoolId = user.schoolId || 's1';
  /* Refactored school, papers and notifications to use state to handle async loading */
  const [school, setSchool] = useState<School | null>(null);
  const [recentPapers, setRecentPapers] = useState<SavedPaper[]>([]);
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const schoolData = await getSchoolById(schoolId);
      setSchool(schoolData);
      
      const papers = await getPapersBySchool(schoolId);
      setRecentPapers(papers.slice(0, 5));
      
      const notes = await getNotificationsForSchool(schoolId);
      setNotifications(notes);

      // Apply institutional branding if available
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

  const stats = [
    { label: 'Total Papers', value: school?.stats.papersCount.toLocaleString() || '0', trend: '+12%', icon: Files, color: 'text-brand', bg: 'bg-brand-light' },
    { label: 'Active Students', value: school?.stats.studentCount.toLocaleString() || '0', trend: '+5%', icon: Users, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { label: 'Avg. Score', value: '78%', trend: '+2%', icon: TrendingUp, color: 'text-purple-600', bg: 'bg-purple-50' },
    { label: 'Teachers', value: school?.stats.teachersCount.toString() || '0', trend: 'Stable', icon: Users, color: 'text-amber-600', bg: 'bg-amber-50' },
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
      {/* Institutional Status Header */}
      {school && (
        <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
          daysRemaining < 30 ? 'bg-amber-50 border-amber-200' : 'bg-brand-light border-brand/10'
        }`}>
          <div className="flex items-center gap-4">
             <div className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-sm ${
               daysRemaining < 30 ? 'bg-amber-100 text-amber-600' : 'bg-white text-brand'
             }`}>
                {daysRemaining < 30 ? <AlertTriangle size={24}/> : <CheckCircle2 size={24}/>}
             </div>
             <div>
                <h4 className="font-bold text-gray-900 text-sm">
                   {school.subscriptionPlan} Plan - <span className={daysRemaining < 30 ? 'text-amber-700' : 'text-brand'}>{school.status}</span>
                </h4>
                <p className="text-xs text-gray-500 font-medium">
                   Your subscription is valid until <span className="font-bold">{school.validTill}</span> ({daysRemaining} days left)
                </p>
             </div>
          </div>
          <button 
            onClick={() => onNavigate('billing')}
            className={`px-6 py-2 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all ${
              daysRemaining < 30 
              ? 'bg-amber-600 text-white hover:bg-amber-700' 
              : 'bg-white text-brand border border-brand/10 hover:bg-brand hover:text-white'
            }`}
          >
            {daysRemaining < 30 ? 'Renew Now' : 'View Plan Details'}
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{school?.name || 'Dashboard'}</h1>
          <p className="text-sm text-gray-500 mt-1 uppercase font-bold tracking-widest">
            Welcome back, {user.name} • Institutional Overview
          </p>
        </div>
        <div className="flex gap-3 w-full md:w-auto">
          <button 
            onClick={() => onNavigate('generate')}
            className="w-full md:w-auto px-6 py-2.5 bg-brand text-white rounded-xl text-sm font-bold hover-bg-brand transition-all flex items-center justify-center gap-2 shadow-xl shadow-brand/20"
          >
            <FilePlus size={18} />
            Create Exam Paper
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => (
          <div key={idx} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg transition-all cursor-default">
            <div className="flex justify-between items-start mb-5">
              <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                <stat.icon size={24} className={stat.color} />
              </div>
              <span className="text-[10px] font-extrabold text-green-700 bg-green-50 px-2.5 py-1 rounded-full border border-green-100 uppercase tracking-tight">
                {stat.trend}
              </span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 tracking-tight">{stat.value}</h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-2">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Papers Table */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/30">
            <div>
               <h3 className="font-bold text-gray-900 text-base">Recent Examination Papers</h3>
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-0.5">Global institute repository</p>
            </div>
            <button 
              onClick={() => onNavigate('saved')}
              className="px-4 py-1.5 bg-white border border-gray-200 rounded-lg text-xs text-brand font-bold hover:bg-brand-light transition-all flex items-center gap-2"
            >
              View Repository <ArrowRight size={12} />
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Paper Title</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Subject / Class</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Generation Date</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {recentPapers.map((paper) => (
                  <tr key={paper.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-6 py-4">
                       <div className="font-bold text-sm text-gray-900 group-hover:text-brand transition-colors">{paper.title}</div>
                       <div className="text-[10px] text-gray-400 font-bold uppercase mt-0.5">Author: {paper.author}</div>
                    </td>
                    <td className="px-6 py-4">
                       <div className="text-sm font-medium text-gray-700">{paper.subject}</div>
                       <div className="text-xs text-gray-400">{paper.classLevel}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-gray-500 whitespace-nowrap">{paper.dateCreated}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-extrabold border uppercase tracking-wider ${
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

        {/* Platform Notifications & Quick Actions */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Bell size={18} className="text-brand" /> Platform Updates
              </h3>
            </div>
            <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto custom-scrollbar">
              {notifications.map((note) => (
                <div key={note.id} className={`p-4 rounded-xl border ${getNoteBg(note.type)} transition-all hover:shadow-md cursor-default group`}>
                   <div className="flex justify-between items-start mb-1">
                      <div className="flex items-center gap-2">
                         {getNoteIcon(note.type)}
                         <span className="font-bold text-[10px] uppercase tracking-widest text-gray-900">{note.title}</span>
                      </div>
                      <span className="text-[9px] font-bold text-gray-400 uppercase">{new Date(note.timestamp).toLocaleDateString()}</span>
                   </div>
                   <p className="text-xs text-gray-600 leading-relaxed mt-2">{note.message}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-900 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all"></div>
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-6">
                 <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                    <Calendar className="text-brand" size={24} />
                 </div>
                 <span className="bg-brand px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest">{school?.subscriptionPlan}</span>
              </div>
              <h3 className="font-bold text-xl mb-1">Contract Validity</h3>
              <p className="text-slate-400 text-xs mb-8 leading-relaxed">Your institution has <strong>{daysRemaining} days</strong> of premium access remaining.</p>
              <button 
                onClick={() => onNavigate('billing')}
                className="w-full py-3 bg-white text-slate-900 text-xs font-extrabold uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-light transition-colors shadow-lg"
              >
                Contract Details
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
