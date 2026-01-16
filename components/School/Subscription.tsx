
import React, { useState, useEffect, useMemo } from 'react';
import { getPlans, getSchoolById, getSystemConfig } from '../../services/dataService';
import { SubscriptionPlan, School, User } from '../../types';
import { Check, CreditCard, AlertCircle, Calendar, Clock, ArrowUpRight, ShieldCheck, Zap, Hourglass } from 'lucide-react';

interface SubscriptionManagerProps {
  user: User;
}

const SubscriptionManager: React.FC<SubscriptionManagerProps> = ({ user }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [school, setSchool] = useState<School | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState('$');

  useEffect(() => {
    const loadData = async () => {
      const plansData = await getPlans();
      setPlans(plansData);
      
      const schoolId = user.schoolId || 's1';
      try {
        const schoolData = await getSchoolById(schoolId);
        setSchool(schoolData || null);
      } catch (e) {
        console.error("Failed to load school data for subscription view", e);
      }

      const config = await getSystemConfig();
      setCurrencySymbol(config.currencySymbol);
    };
    loadData();
  }, [user.schoolId]);

  const currentPlan = useMemo(() => 
    plans.find(p => p.name === school?.subscriptionPlan), 
    [plans, school]
  );

  const lifecycle = useMemo(() => {
    if (!school?.subscriptionStartDate || !school?.validTill) {
        return { progress: 0, daysLeft: 0, totalDays: 365, status: 'Unknown' };
    }
    
    const start = new Date(school.subscriptionStartDate).getTime();
    const end = new Date(school.validTill).getTime();
    const now = new Date().getTime();
    
    const totalMs = end - start;
    const elapsedMs = now - start;
    
    const totalDays = Math.ceil(totalMs / (1000 * 60 * 60 * 24));
    let daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    if (daysLeft < 0) daysLeft = 0;

    let progress = 0;
    if (totalMs > 0) {
        progress = Math.min(100, Math.max(0, (elapsedMs / totalMs) * 100));
    }

    let status = 'Active';
    if (daysLeft <= 0) status = 'Expired';
    else if (daysLeft <= 30) status = 'Renew Soon';

    return { progress: Math.round(progress), daysLeft, totalDays, status };
  }, [school]);

  // Estimate storage: 0.005 GB (5MB) per paper
  const estimatedStorage = useMemo(() => {
      const count = school?.stats?.papersCount || 0;
      return (count * 0.005).toFixed(2);
  }, [school]);

  const formatLimit = (val?: number) => {
      if (val === undefined) return '0';
      return val >= 9999 ? 'Unlimited' : val.toLocaleString();
  };

  const currentPlanName = school?.subscriptionPlan || 'Custom';

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Institutional Billing</h1>
          <p className="text-sm text-gray-500 mt-1">Manage your enterprise contract, usage limits, and renewal dates</p>
        </div>
        <div className="flex items-center gap-3 bg-indigo-50 px-5 py-2 rounded-2xl border border-indigo-100 shadow-sm">
           <ShieldCheck className="text-indigo-600" size={20} />
           <div>
              <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest leading-none">Security Status</p>
              <p className="text-xs font-extrabold text-indigo-900">Payments Encrypted</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Current Contract Details */}
         <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm relative overflow-hidden">
               <div className="flex flex-col md:flex-row justify-between items-start mb-10 gap-6">
                  <div>
                     <div className="flex items-center gap-3 mb-4">
                        <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[10px] font-extrabold uppercase tracking-[0.2em] shadow-lg shadow-indigo-100">
                            {currentPlanName} Plan
                        </span>
                        <span className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border ${
                            lifecycle.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                            lifecycle.status === 'Expired' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-amber-50 text-amber-700 border-amber-100'
                        }`}>
                            {lifecycle.status}
                        </span>
                     </div>
                     <h2 className="text-2xl font-bold text-gray-900">Active Subscription</h2>
                     <p className="text-sm text-gray-500 font-medium mt-1">Billed annually for institutional access</p>
                  </div>
                  <div className="flex gap-8 bg-gray-50 p-4 rounded-2xl border border-gray-100">
                     <div className="text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Start Date</p>
                        <p className="text-sm font-bold text-gray-900 flex items-center gap-2 justify-center">
                           <Calendar size={14} className="text-indigo-400" /> {school?.subscriptionStartDate ? new Date(school.subscriptionStartDate).toLocaleDateString() : 'N/A'}
                        </p>
                     </div>
                     <div className="w-px bg-gray-200"></div>
                     <div className="text-center">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Renewal Date</p>
                        <p className="text-sm font-bold text-gray-900 flex items-center gap-2 justify-center">
                           <Clock size={14} className="text-indigo-400" /> {school?.validTill ? new Date(school.validTill).toLocaleDateString() : 'N/A'}
                        </p>
                     </div>
                  </div>
               </div>

               {/* Updated Contract Lifecycle */}
               <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-10">
                  <div className="flex justify-between items-end mb-3">
                     <div>
                        <p className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-2">
                            <Hourglass size={14} className="text-indigo-500" /> Contract Lifecycle
                        </p>
                        <p className="text-[10px] text-gray-400 mt-1 font-medium">
                            {lifecycle.daysLeft} days remaining of {lifecycle.totalDays} day term
                        </p>
                     </div>
                     <p className="text-xl font-black text-indigo-600">{lifecycle.progress}%</p>
                  </div>
                  <div className="w-full h-4 bg-white rounded-full border border-gray-200 overflow-hidden p-0.5">
                     <div 
                        style={{ width: `${lifecycle.progress}%` }} 
                        className={`h-full rounded-full shadow-sm transition-all duration-1000 ${
                            lifecycle.daysLeft < 30 ? 'bg-gradient-to-r from-amber-500 to-red-500' : 'bg-gradient-to-r from-indigo-500 to-indigo-600'
                        }`}
                     ></div>
                  </div>
               </div>
               
               <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-100 transition-colors">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Exam Papers</p>
                     <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-gray-900">{school?.stats?.papersCount || 0}</span>
                        <span className="text-xs text-gray-400 font-bold">/ {formatLimit(currentPlan?.limits.papers)}</span>
                     </div>
                  </div>
                  <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-100 transition-colors">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Staff Slots</p>
                     <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-gray-900">{school?.stats?.teachersCount || 0}</span>
                        <span className="text-xs text-gray-400 font-bold">/ {formatLimit(currentPlan?.limits.staff)}</span>
                     </div>
                  </div>
                  <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:border-indigo-100 transition-colors">
                     <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Storage</p>
                     <div className="flex items-baseline gap-1">
                        <span className="text-2xl font-black text-gray-900">{estimatedStorage}</span>
                        <span className="text-xs text-gray-400 font-bold">GB / {currentPlan?.limits.storageGB || 0}GB</span>
                     </div>
                  </div>
               </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-6">
               <div className="flex-1 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                     <CreditCard size={24} />
                  </div>
                  <div className="flex-1">
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Payment Method</p>
                     <p className="text-sm font-bold text-gray-900">Visa ending in 4242</p>
                     <p className="text-xs text-gray-500 mt-0.5">Auto-renewal enabled</p>
                  </div>
                  <button className="text-xs font-bold text-indigo-600 hover:underline">Manage</button>
               </div>
               <div className="flex-1 p-6 bg-white rounded-3xl border border-gray-100 shadow-sm flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center shrink-0">
                     <Zap size={24} />
                  </div>
                  <div>
                     <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Contract Status</p>
                     <p className="text-sm font-bold text-gray-900">Enterprise Verified</p>
                     <p className="text-xs text-gray-500 mt-0.5">SLA: 99.9% Uptime</p>
                  </div>
               </div>
            </div>
         </div>

         {/* Upgrade CTA / Sales */}
         <div className="bg-slate-900 text-white p-8 rounded-[2rem] shadow-2xl flex flex-col justify-between relative overflow-hidden border border-white/5">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
            <div className="relative z-10">
               <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center mb-8 shadow-xl shadow-indigo-900/50">
                  <ArrowUpRight size={28} className="text-white" />
               </div>
               <h3 className="font-bold text-2xl mb-4 leading-tight">Scale Your Institution</h3>
               <p className="text-slate-400 text-sm mb-8 leading-relaxed">Looking for deeper AI integrations, custom API endpoints, or multi-campus coordination? Our specialist team is ready to assist.</p>
               
               <ul className="space-y-4 mb-10">
                  {['Dedicated Account Manager', 'On-Premise Training', 'Priority Feature Access'].map((f, i) => (
                     <li key={i} className="flex items-center gap-3 text-xs font-medium text-slate-300">
                        <Check size={14} className="text-emerald-500" /> {f}
                     </li>
                  ))}
               </ul>

               <button className="w-full py-4 bg-white text-slate-900 font-extrabold text-xs uppercase tracking-[0.2em] rounded-2xl hover:bg-indigo-50 transition-all shadow-xl">
                  Speak to Specialist
               </button>
            </div>
         </div>
      </div>

      <div className="pt-8">
         <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-3">
            <ShieldCheck size={24} className="text-indigo-600" /> 
            Alternative Tiers
         </h3>
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map(plan => (
               <div key={plan.id} className={`p-8 rounded-[2rem] border-2 bg-white flex flex-col transition-all hover:shadow-xl ${
                  plan.name === currentPlanName 
                  ? 'border-indigo-600 shadow-lg relative' 
                  : 'border-gray-100 hover:border-indigo-200'
               }`}>
                  {plan.name === currentPlanName && (
                     <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-5 py-1.5 rounded-full text-[10px] font-extrabold uppercase tracking-widest shadow-lg">
                        Current Contract
                     </span>
                  )}
                  <div className="mb-8">
                     <h4 className="text-lg font-extrabold text-gray-900 uppercase tracking-widest">{plan.name}</h4>
                     <div className="mt-4 flex items-baseline gap-1">
                        <span className="text-4xl font-black text-gray-900">{currencySymbol}{plan.price}</span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">/ Month</span>
                     </div>
                  </div>
                  <ul className="space-y-4 mb-10 flex-1">
                     {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-600 font-medium">
                           <div className="mt-1 w-4 h-4 bg-emerald-50 rounded-full flex items-center justify-center shrink-0">
                              <Check size={10} className="text-emerald-600" />
                           </div>
                           {feat}
                        </li>
                     ))}
                  </ul>
                  <button className={`w-full py-4 rounded-2xl font-extrabold text-xs uppercase tracking-[0.2em] transition-all ${
                     plan.name === currentPlanName 
                        ? 'bg-gray-100 text-gray-400 cursor-default' 
                        : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100'
                  }`}>
                     {plan.name === currentPlanName ? 'Active Plan' : 'Switch Tier'}
                  </button>
               </div>
            ))}
         </div>
      </div>
    </div>
  );
};

export default SubscriptionManager;
