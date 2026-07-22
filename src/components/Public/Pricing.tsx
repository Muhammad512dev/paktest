
import React, { useEffect, useState } from 'react';
import { Check, HelpCircle, X, Zap, Shield, Crown, MessageCircle } from 'lucide-react';
import { getPublicPlans, getSystemConfig } from '../../services/dataService';
import { SubscriptionPlan, SystemConfig } from '../../types';

const Pricing: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isAnnual, setIsAnnual] = useState(true);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await getPublicPlans();
      setPlans(data);
      const config = await getSystemConfig();
      setSystemConfig(config);
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

      {/* Pricing Layout */}
      <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 py-20 -mt-20 relative z-20">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Plans Grid */}
            <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-8">
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

                        {plan.price === 0 ? (
                            <button 
                                onClick={() => onNavigate('SIGNUP')}
                                className={`w-full py-4 rounded-xl font-bold uppercase tracking-widest text-xs transition-all ${
                                    isPopular 
                                    ? 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-100' 
                                    : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                                }`}
                            >
                                Start Free Trial
                            </button>
                        ) : (
                            <div className="space-y-2">
                                <a
                                    href={`https://wa.me/${(systemConfig?.platformContact || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi! I want to buy the ${plan.name} Plan (${plan.currencySymbol}${plan.price}/month).\n\nPlease guide me on the payment process.`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-4 rounded-xl font-extrabold uppercase tracking-widest text-xs transition-all bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-200 flex items-center justify-center gap-2"
                                >
                                    <MessageCircle size={16} /> Buy on WhatsApp
                                </a>
                                <p className="text-[10px] text-slate-400 text-center font-medium">✅ Plan activated within 2 hours of payment</p>
                            </div>
                        )}
                    </div>
                );
            })}
            </div>

            {/* WhatsApp Upgrade CTA Card (Side Card) */}
            <div className="xl:col-span-5 bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl flex flex-col justify-between relative overflow-hidden border border-white/5 mt-8 xl:mt-16 self-start">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="relative z-10">
                   <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center mb-6 shadow-xl shadow-emerald-900/40">
                      <MessageCircle size={28} className="text-white" />
                   </div>
                   <h3 className="font-bold text-2xl mb-3 leading-tight">Need a Custom Plan?</h3>
                   <p className="text-slate-400 text-sm mb-5 leading-relaxed">Want to upgrade or buy a new plan? Pay the fee and contact us on WhatsApp — your plan will be activated within <span className="text-emerald-400 font-bold">2 hours</span>.</p>

                   <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 space-y-2.5">
                      {['Send payment screenshot on WhatsApp', 'Mention your School Name & Email', 'Plan activated within 2 hours of payment'].map((step, i) => (
                         <div key={i} className="flex items-start gap-3 text-xs text-slate-300 font-medium">
                            <div className="w-5 h-5 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shrink-0 font-black text-[10px]">{i + 1}</div>
                            {step}
                         </div>
                      ))}
                   </div>

                   {systemConfig?.platformContact ? (
                      <a
                         href={`https://wa.me/${systemConfig.platformContact.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hello! I want to buy a school plan.\n\nPlease guide me on the payment process.`)}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2"
                      >
                         <MessageCircle size={16} /> Contact on WhatsApp
                      </a>
                   ) : (
                      <button className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-extrabold text-xs uppercase tracking-[0.2em] rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2">
                         <MessageCircle size={16} /> Contact Support
                      </button>
                   )}

                   <p className="text-[10px] text-slate-500 text-center mt-4">Contact: {systemConfig?.platformContact || 'Not configured'}</p>
                </div>
            </div>

        </div>
      </div>

      {/* FAQ Teaser */}
      <div className="max-w-4xl mx-auto px-6 pb-24">
         <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-10 text-center">
            <h2 className="text-2xl font-bold text-slate-900 mb-4 flex items-center justify-center gap-3">
                <HelpCircle className="text-indigo-500" /> Have Questions?
            </h2>
            <p className="text-slate-500 mb-6 max-w-xl mx-auto">
                Not sure which plan is right for your school? Our sales team can provide a personalized demo and custom quote.
            </p>
            {systemConfig?.platformContact ? (
                <p className="text-slate-600 font-bold mb-4 flex items-center justify-center gap-2">
                   <MessageCircle className="text-emerald-500" size={20} /> WhatsApp Support: {systemConfig.platformContact}
                </p>
            ) : null}
            <button onClick={() => onNavigate('CONTACT')} className="text-indigo-600 font-black uppercase tracking-widest text-sm hover:underline">
                Contact Sales Team
            </button>
         </div>
      </div>
    </div>
  );
};

export default Pricing;
