
import React, { useEffect, useState } from 'react';
import { Check, HelpCircle, X, Zap, Shield, Crown } from 'lucide-react';
import { getPublicPlans } from '../../services/dataService';
import { SubscriptionPlan } from '../../types';

const Pricing: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isAnnual, setIsAnnual] = useState(true);

  useEffect(() => {
    const load = async () => {
      const data = await getPublicPlans();
      setPlans(data);
    };
    load();
  }, []);

  return (
    <div className="bg-white min-h-screen">
      {/* Header */}
      <div className="bg-[#0F172A] py-24 px-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto text-center relative z-10">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-10">
            Choose the plan that fits your institution. No hidden fees, cancel anytime.
          </p>
          
          <div className="inline-flex bg-white/10 p-1 rounded-xl backdrop-blur-sm border border-white/10">
            <button 
                onClick={() => setIsAnnual(false)}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${!isAnnual ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-300 hover:text-white'}`}
            >
                Monthly
            </button>
            <button 
                onClick={() => setIsAnnual(true)}
                className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${isAnnual ? 'bg-white text-slate-900 shadow-lg' : 'text-slate-300 hover:text-white'}`}
            >
                Annual <span className="text-[9px] bg-green-500 text-white px-2 py-0.5 rounded-full uppercase tracking-wider">Save 20%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards */}
      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-20 -mt-20 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {plans.map((plan, idx) => {
                const isPopular = plan.price > 0 && plan.price < 500; // Just heuristic for styling
                return (
                    <div 
                        key={plan.id}
                        className={`bg-white rounded-[2.5rem] p-8 border-2 flex flex-col relative transition-all hover:-translate-y-2 duration-300 ${
                            isPopular 
                            ? 'border-indigo-600 shadow-2xl shadow-indigo-200 z-10 scale-105' 
                            : 'border-slate-100 shadow-xl'
                        }`}
                    >
                        {isPopular && (
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest shadow-lg flex items-center gap-2">
                                <Crown size={12} className="text-yellow-300" /> Most Popular
                            </div>
                        )}

                        <div className="mb-8">
                            <h3 className="text-xl font-black text-slate-900 uppercase tracking-wide">{plan.name}</h3>
                            <div className="mt-4 flex items-baseline gap-1">
                                <span className="text-5xl font-black text-slate-900">
                                    {plan.currencySymbol}{isAnnual ? Math.round(plan.price * 0.8) : plan.price}
                                </span>
                                <span className="text-slate-500 font-bold">/ month</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 font-medium">
                                {isAnnual ? `Billed ${plan.currencySymbol}${Math.round(plan.price * 0.8 * 12)} yearly` : 'Billed monthly'}
                            </p>
                        </div>

                        <div className="space-y-4 mb-8 flex-1">
                            <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                                    <Zap size={16} />
                                </div>
                                {plan.limits.papers >= 9999 ? 'Unlimited' : plan.limits.papers} Papers / mo
                            </div>
                            <div className="flex items-center gap-3 text-sm font-bold text-slate-700">
                                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                                    <Shield size={16} />
                                </div>
                                {plan.limits.staff >= 999 ? 'Unlimited' : plan.limits.staff} Staff Accounts
                            </div>
                            
                            <div className="h-px bg-slate-100 my-4"></div>

                            {plan.features.map((feat, i) => (
                                <div key={i} className="flex items-start gap-3 text-sm text-slate-600">
                                    <Check size={18} className="text-indigo-500 shrink-0 mt-0.5" />
                                    <span className="leading-snug">{feat}</span>
                                </div>
                            ))}
                        </div>

                        <button 
                            onClick={() => onNavigate('SIGNUP')}
                            className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${
                                isPopular 
                                ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100' 
                                : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                            }`}
                        >
                            Choose {plan.name}
                        </button>
                    </div>
                );
            })}
        </div>
      </div>

      {/* FAQ Teaser */}
      <div className="max-w-4xl mx-auto px-6 pb-24">
         <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center justify-center gap-3">
                <HelpCircle className="text-indigo-500" /> Have Questions?
            </h2>
            <p className="text-slate-500 mb-8 max-w-xl mx-auto">
                Not sure which plan is right for your school? Our sales team can provide a personalized demo and custom quote.
            </p>
            <button onClick={() => onNavigate('CONTACT')} className="text-indigo-600 font-black uppercase tracking-widest text-sm hover:underline">
                Contact Sales Team
            </button>
         </div>
      </div>
    </div>
  );
};

export default Pricing;
