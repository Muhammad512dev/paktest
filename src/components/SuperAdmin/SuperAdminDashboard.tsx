
import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Building2, 
  CreditCard, 
  Activity, 
  TrendingUp, 
  ArrowUpRight, 
  Globe, 
  Server, 
  Bell, 
  Plus, 
  Trash2, 
  X, 
  Send, 
  Zap, 
  ShieldAlert, 
  Info, 
  AlertTriangle, 
  LayoutDashboard, 
  Cpu,
  Calendar,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { 
  getPlatformNotifications, 
  addPlatformNotification, 
  deletePlatformNotification, 
  getSchools, 
  getSystemConfig,
  getUsers,
  getTransactions,
  getQuestions,
  approveSchool
} from '../../services/dataService';
import { PlatformNotification, School } from '../../types';

const SuperAdminDashboard: React.FC = () => {
  const [notifications, setNotifications] = useState<PlatformNotification[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  
  // Real-time Metrics State
  const [metrics, setMetrics] = useState({
    revenue: 0,
    userCount: 0,
    schoolCount: 0,
    aiTokens: 0
  });
  
  const [newNote, setNewNote] = useState({
    title: '',
    message: '',
    type: 'INFO' as PlatformNotification['type'],
    targetSchoolId: 'ALL'
  });

  /* Refactored data loading to handle async responses correctly */
  const loadData = async () => {
    try {
      const [notes, schoolList, config, usersList, txList, questionsList] = await Promise.all([
        getPlatformNotifications().catch(() => []),
        getSchools().catch(() => []),
        getSystemConfig().catch(() => ({ currencySymbol: '$' })),
        getUsers().catch(() => []),
        getTransactions().catch(() => []),
        getQuestions().catch(() => [])
      ]);

      setNotifications(notes || []);
      setSchools(schoolList || []);
      setCurrencySymbol(config?.currencySymbol || '$');

      // Calculate Real-time Metrics
      const totalRevenue = (txList || []).reduce((acc: number, tx: any) => acc + (tx?.amount || 0), 0);
      // Estimate tokens: approx 750 tokens per question generated (input + output + reasoning)
      const estimatedTokens = (questionsList || []).length * 750; 

      setMetrics({
        revenue: totalRevenue || 0,
        userCount: usersList?.length || 0,
        schoolCount: schoolList?.length || 0,
        aiTokens: estimatedTokens || 0
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      // Keep default metrics if loading fails
      setMetrics({
        revenue: 0,
        userCount: 0,
        schoolCount: 0,
        aiTokens: 0
      });
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBroadcast = async () => {
    if (!newNote.title || !newNote.message) return;
    
    const notification: PlatformNotification = {
      id: `note_${Date.now()}`,
      title: newNote.title,
      message: newNote.message,
      type: newNote.type,
      targetSchoolId: newNote.targetSchoolId,
      timestamp: new Date().toISOString(),
      createdBy: 'Alexandra Pierce'
    };

    await addPlatformNotification(notification);
    await loadData();
    setIsModalOpen(false);
    setNewNote({ title: '', message: '', type: 'INFO', targetSchoolId: 'ALL' });
  };

  const removeNote = async (id: string) => {
    await deletePlatformNotification(id);
    await loadData();
  };

  const handleApproveSchool = async (schoolId: string) => {
    try {
      const res = await approveSchool(schoolId);
      alert(`Subscription Approved! Institution is now active & Invoice ${res.transaction?.invoiceId || ''} was generated.`);
      await loadData();
    } catch (err: any) {
      console.error(err);
      alert(err?.message || "Failed to approve request.");
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <div className="flex justify-between items-center border-b border-gray-200 pb-8">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
             <LayoutDashboard size={40} className="text-indigo-600" />
             Platform Control Center
          </h1>
          <p className="text-slate-500 mt-2 uppercase font-black tracking-[0.3em] text-[11px]">ExamForge AI • Platform Administrator</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-3 text-sm font-bold text-slate-600 bg-white px-6 py-3 rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse"></div>
            Core AI Nodes Operational
          </div>
          <button 
             onClick={() => setIsModalOpen(true)}
             className="bg-slate-900 text-white px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-800 transition-all flex items-center gap-3 shadow-2xl shadow-slate-900/20"
          >
             <Zap size={18} className="text-amber-400" />
             Global Alert
          </button>
        </div>
      </div>

      {/* Global KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
         {[
           { 
             label: 'Total Revenue', 
             value: `${currencySymbol}${formatNumber(metrics?.revenue || 0)}`, 
             change: '+14.2%', 
             icon: CreditCard, 
             color: 'text-indigo-600', 
             bg: 'bg-indigo-50' 
           },
           { 
             label: 'Partner Schools', 
             value: (metrics?.schoolCount || 0).toString(), 
             change: '+9.1%', 
             icon: Building2, 
             color: 'text-blue-600', 
             bg: 'bg-blue-50' 
           },
           { 
             label: 'Active Users', 
             value: formatNumber(metrics?.userCount || 0), 
             change: '+22%', 
             icon: Users, 
             color: 'text-purple-600', 
             bg: 'bg-purple-50' 
           },
           { 
             label: 'AI Tokens Used', 
             value: formatNumber(metrics?.aiTokens || 0), 
             change: '+31%', 
             icon: Cpu, 
             color: 'text-emerald-600', 
             bg: 'bg-emerald-50' 
           }
         ].map((kpi, idx) => (
           <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl transition-all group">
             <div className="flex justify-between items-start mb-6">
                <div className={`w-16 h-16 ${kpi.bg} rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform`}>
                   <kpi.icon className={kpi.color} size={32} />
                </div>
                <span className="flex items-center text-[10px] font-black text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100 uppercase tracking-widest">
                   <ArrowUpRight size={14} className="mr-1" /> {kpi.change}
                </span>
             </div>
             <h3 className="text-4xl font-black text-slate-900 tracking-tighter">{kpi.value}</h3>
             <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mt-3">{kpi.label}</p>
           </div>
         ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
         {/* System Trajectory Chart Area */}
         <div className="lg:col-span-2 bg-white rounded-[3rem] border border-slate-100 shadow-sm p-10 flex flex-col">
            <div className="flex justify-between items-center mb-12">
               <div>
                  <h3 className="font-black text-slate-900 text-2xl tracking-tight">Global Revenue Projection</h3>
                  <p className="text-sm text-slate-400 font-bold uppercase tracking-widest mt-1">Consolidated institutional earnings</p>
               </div>
               <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100 text-xs font-black text-slate-500">
                     <Calendar size={14} /> Fiscal Q4 2024
                  </div>
               </div>
            </div>
            <div className="h-72 flex items-end justify-between gap-3 px-2">
               {[40, 55, 45, 60, 75, 65, 85, 90, 80, 95, 100, 110].map((h, i) => (
                  <div key={i} className="w-full bg-indigo-50/20 rounded-2xl hover:bg-indigo-50/50 transition-all relative group h-full flex items-end overflow-hidden">
                     <div 
                        className="w-full bg-indigo-600 rounded-t-2xl transition-all duration-700 shadow-lg group-hover:bg-indigo-500"
                        style={{ height: `${h}%` }}
                     ></div>
                     <div className="opacity-0 group-hover:opacity-100 absolute bottom-full mb-3 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-black py-2 px-4 rounded-xl shadow-2xl z-20 transition-all pointer-events-none whitespace-nowrap">
                        {currencySymbol}{h}k MRR
                     </div>
                  </div>
               ))}
            </div>
            <div className="flex justify-between mt-8 px-4 text-[10px] text-slate-400 font-black uppercase tracking-[0.4em]">
               <span>JANUARY</span><span>MAY</span><span>AUGUST</span><span>DECEMBER</span>
            </div>
         </div>

         {/* Global Admin Broadcasts */}
         <div className="bg-slate-900 rounded-[3rem] shadow-2xl flex flex-col overflow-hidden border border-white/5">
            <div className="p-8 border-b border-white/5 bg-white/5 flex justify-between items-center">
               <h3 className="font-black text-white text-lg flex items-center gap-3">
                  <Bell size={22} className="text-indigo-400" /> Active Broadcasts
               </h3>
               <span className="text-[10px] font-black text-indigo-300 bg-indigo-500/20 px-3 py-1 rounded-full uppercase tracking-widest">{notifications.length} LIVE</span>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
               {notifications.map((note) => {
                  const match = note.message ? note.message.match(/\[schoolId:([^\]]+)\]/) : null;
                  const pendingSchoolId = match ? match[1] : null;

                  return (
                    <div key={note.id} className="p-6 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 transition-all group relative">
                       <button 
                          onClick={() => removeNote(note.id)}
                          className="absolute top-6 right-6 text-white/20 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                       >
                          <Trash2 size={16} />
                       </button>
                       <div className="flex items-center gap-3 mb-4">
                          <div className={`p-2 rounded-xl ${note.type === 'URGENT' || pendingSchoolId ? 'bg-amber-500/20 text-amber-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                             {pendingSchoolId ? <AlertTriangle size={16} /> : note.type === 'URGENT' ? <ShieldAlert size={16} /> : <Info size={16} />}
                          </div>
                          <span className="text-[11px] font-black text-white uppercase tracking-widest">{note.title}</span>
                       </div>
                       <p className="text-xs text-slate-400 leading-relaxed font-medium">
                         {note.message.replace(/\[schoolId:[^\]]+\]/, '')}
                       </p>

                       {pendingSchoolId && (
                         <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest flex items-center gap-1">
                              <AlertTriangle size={12} /> Pending Activation
                            </span>
                            <button
                              onClick={() => handleApproveSchool(pendingSchoolId)}
                              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-lg transition-all"
                            >
                              <CheckCircle2 size={14} /> Approve & Invoice
                            </button>
                         </div>
                       )}

                       <div className="mt-5 flex justify-between items-center border-t border-white/5 pt-4">
                          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{note.targetSchoolId === 'ALL' ? 'Global' : 'Specific'}</span>
                          <span className="text-[10px] font-black text-slate-600">{new Date(note.timestamp).toLocaleDateString()}</span>
                       </div>
                    </div>
                  );
               })}
               {notifications.length === 0 && (
                  <div className="py-24 text-center text-slate-600 flex flex-col items-center">
                     <Bell size={48} className="opacity-10 mb-4" />
                     <p className="text-sm font-black uppercase tracking-widest italic">No Platform Announcements</p>
                  </div>
               )}
            </div>
            <button 
               onClick={() => setIsModalOpen(true)}
               className="m-6 py-4 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-900/20"
            >
               Deploy New Broadcast
            </button>
         </div>
      </div>

      {/* Broadcast Modal */}
      {isModalOpen && (
         <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
               <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                  <div>
                     <h3 className="font-black text-2xl text-slate-900 tracking-tight">System-Wide Broadcast</h3>
                     <p className="text-[11px] text-slate-500 uppercase font-black tracking-[0.2em] mt-1">Multi-tenant notification engine</p>
                  </div>
                  <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-3 hover:bg-slate-200 rounded-full transition-all">
                     <X size={28} />
                  </button>
               </div>

               <div className="p-10 space-y-8">
                  <div className="grid grid-cols-2 gap-8">
                     <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Severity Level</label>
                        <div className="flex gap-2 p-2 bg-slate-100 rounded-2xl">
                           {[
                              { id: 'INFO', icon: Info, color: 'text-blue-600' },
                              { id: 'UPDATE', icon: Zap, color: 'text-indigo-600' },
                              { id: 'WARNING', icon: AlertTriangle, color: 'text-amber-600' },
                              { id: 'URGENT', icon: ShieldAlert, color: 'text-rose-600' }
                           ].map(t => (
                              <button 
                                 key={t.id}
                                 onClick={() => setNewNote({...newNote, type: t.id as any})}
                                 className={`flex-1 flex items-center justify-center p-3 rounded-xl transition-all ${newNote.type === t.id ? 'bg-white shadow-xl ring-1 ring-slate-200' : 'hover:bg-slate-200'}`}
                              >
                                 <t.icon size={22} className={newNote.type === t.id ? t.color : 'text-slate-400'} />
                              </button>
                           ))}
                        </div>
                     </div>
                     <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Target Infrastructure</label>
                        <select 
                           className="w-full h-[64px] px-6 bg-slate-100 border border-slate-200 rounded-2xl text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                           value={newNote.targetSchoolId}
                           onChange={e => setNewNote({...newNote, targetSchoolId: e.target.value})}
                        >
                           <option value="ALL">ALL INSTALLED NODES</option>
                           {schools.map(s => <option key={s.id} value={s.id}>{s.name.toUpperCase()}</option>)}
                        </select>
                     </div>
                  </div>

                  <div className="space-y-3">
                     <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Announcement Title</label>
                     <input 
                        type="text"
                        className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-black focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                        placeholder="e.g. CORE SYSTEM UPGRADE v4.2"
                        value={newNote.title}
                        onChange={e => setNewNote({...newNote, title: e.target.value})}
                     />
                  </div>

                  <div className="space-y-3">
                     <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Payload Content</label>
                     <textarea 
                        className="w-full px-6 py-5 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none min-h-[160px] leading-relaxed transition-all"
                        placeholder="Detailed technical or administrative update description..."
                        value={newNote.message}
                        onChange={e => setNewNote({...newNote, message: e.target.value})}
                     />
                  </div>
               </div>

               <div className="p-10 border-t border-slate-100 flex gap-6 bg-slate-50">
                  <button 
                     onClick={() => setIsModalOpen(false)}
                     className="flex-1 py-4 text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-2xl transition-all"
                  >
                     Discard Broadcast
                  </button>
                  <button 
                     onClick={handleBroadcast}
                     className="flex-[2] py-4 bg-indigo-600 text-white text-[11px] font-black uppercase tracking-[0.3em] rounded-2xl hover:bg-indigo-500 shadow-[0_20px_50px_rgba(79,70,229,0.3)] flex items-center justify-center gap-4 transition-all"
                  >
                     <Send size={20} /> Execute Global Deployment
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
