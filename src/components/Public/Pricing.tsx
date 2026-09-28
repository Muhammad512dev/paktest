
import React, { useEffect, useState } from 'react';
import { 
  Check, HelpCircle, X, Zap, Shield, Crown, MessageCircle, 
  CreditCard, Sparkles, Building2, CheckCircle2, ChevronDown, 
  FileSpreadsheet, QrCode, Smartphone, Landmark, Award
} from 'lucide-react';
import { getPublicPlans, getSystemConfig } from '../../services/dataService';
import { SubscriptionPlan, SystemConfig } from '../../types';

const Pricing: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isAnnual, setIsAnnual] = useState(true);
  const [systemConfig, setSystemConfig] = useState<SystemConfig | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  useEffect(() => {
    const load = async () => {
      const data = await getPublicPlans();
      setPlans(data);
      const config = await getSystemConfig();
      setSystemConfig(config);
    };
    load();
  }, []);

  const faqs = [
    {
      q: "Can I generate papers in both English and Urdu (Nastaleeq)?",
      a: "Yes, 100%. Our platform natively supports English, Urdu Nastaleeq, and dual bilingual question layouts for Punjab (PCTB), Federal (FBISE), Sindh, and KPK Boards."
    },
    {
      q: "How does plan activation work after payment?",
      a: "Once you transfer the subscription fee via JazzCash, EasyPaisa, or Online Bank Transfer (Raast / 1Link), simply send the payment receipt on WhatsApp with your registered School Name & Email. Your account is activated within 2 hours."
    },
    {
      q: "Can multiple subject teachers use one school subscription?",
      a: "Yes. Depending on your plan (Standard or Premium), you can assign staff accounts to Physics, Chemistry, Biology, Math, and Urdu teachers so they can generate their own papers simultaneously."
    },
    {
      q: "Will our academy / school logo and watermark appear on the printed tests?",
      a: "Absolutely. You can upload your official school logo, choose your preferred header template (Classic, Modern Academy, Minimal, or Dual Column), and apply customized watermarks with full answer key sheets."
    },
    {
      q: "Is there any setup fee or long-term lock-in contract?",
      a: "None at all. You pay month-to-month or annually as you choose. You can upgrade or cancel anytime without any hidden charges or cancellation penalties."
    }
  ];

  const paymentMethods = [
    {
      title: "EasyPaisa & JazzCash",
      desc: "Instant mobile wallet transfers available 24/7 across Pakistan.",
      icon: Smartphone,
      color: "from-emerald-500 to-green-600"
    },
    {
      title: "Raast & 1Link Bank Transfer",
      desc: "Direct online bank transfer from any Pakistani bank (Meezan, HBL, Alfalah, etc.).",
      icon: Landmark,
      color: "from-blue-500 to-indigo-600"
    },
    {
      title: "WhatsApp Priority Support",
      desc: "Instant receipt verification and activation support on dedicated helpline.",
      icon: MessageCircle,
      color: "from-teal-500 to-emerald-600"
    }
  ];

  return (
    <div className="bg-slate-50 min-h-screen">
      {/* Hero Header */}
      <div className="bg-[#071326] py-20 px-6 relative overflow-hidden text-white border-b border-amber-500/20">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-black uppercase tracking-wider mb-5">
            <Award size={14} className="text-amber-400" /> Transparent Institutional Pricing
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight mb-4">
            Affordable Plans for Schools & Academies
          </h1>
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto mb-9 leading-relaxed font-medium">
            Generate unlimited chapter-wise, half-book, and full-length exam papers with custom school logo watermarks, Nastaleeq Urdu, and automated answer keys.
          </p>
          
          {/* Billing Switch */}
          <div className="inline-flex bg-[#0B192C] p-1.5 rounded-2xl border border-amber-500/30 shadow-inner">
            <button 
                onClick={() => setIsAnnual(false)}
                className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all ${!isAnnual ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white'}`}
            >
                Monthly Billing
            </button>
            <button 
                onClick={() => setIsAnnual(true)}
                className={`px-6 py-2.5 rounded-xl text-xs sm:text-sm font-extrabold transition-all flex items-center gap-2 ${isAnnual ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/20' : 'text-slate-400 hover:text-white'}`}
            >
                Annual <span className="text-[10px] bg-emerald-600 text-white font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Save 20%</span>
            </button>
          </div>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 -mt-10 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            
            {/* Plans List */}
            <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                {plans.map((plan) => {
                    const isPopular = plan.price > 0 && plan.price < 500;
                    return (
                    <div 
                        key={plan.id}
                        className={`bg-white rounded-3xl p-8 border flex flex-col relative transition-all duration-300 hover:shadow-2xl hover:-translate-y-1.5 ${
                            isPopular 
                            ? 'border-amber-500/80 shadow-xl ring-2 ring-amber-500/30' 
                            : 'border-slate-200 shadow-md'
                        }`}
                    >
                        {isPopular && (
                            <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 px-4 py-1 rounded-full text-[11px] font-black uppercase tracking-widest shadow-md flex items-center gap-1.5 border border-amber-300">
                                <Crown size={13} className="text-slate-950" /> Most Popular for Academies
                            </div>
                        )}

                        <div className="mb-6">
                            <h3 className="text-xl font-black text-slate-900 tracking-tight">{plan.name}</h3>
                            <div className="mt-4 flex items-baseline gap-1.5">
                                <span className="text-4xl sm:text-5xl font-black text-slate-900 tracking-tight">
                                    {plan.currencySymbol}{isAnnual ? Math.round(plan.price * 0.8) : plan.price}
                                </span>
                                <span className="text-slate-500 font-bold text-sm">/ month</span>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 font-medium">
                                {isAnnual ? `Billed ${plan.currencySymbol}${Math.round(plan.price * 0.8 * 12)} annually` : 'Billed on a monthly basis'}
                            </p>
                        </div>

                        <div className="space-y-3.5 mb-8 flex-1">
                            <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-800 bg-amber-50/50 p-2.5 rounded-xl border border-amber-100">
                                <div className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 flex items-center justify-center shrink-0 font-black">
                                    <Zap size={15} />
                                </div>
                                <span>{plan.limits.papers >= 9999 ? 'Unlimited Test Paper' : `${plan.limits.papers} Test Papers`} / month</span>
                            </div>
                            
                            <div className="flex items-center gap-3 text-xs sm:text-sm font-bold text-slate-800 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                                <div className="w-7 h-7 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center shrink-0 font-black">
                                    <Building2 size={15} />
                                </div>
                                <span>{plan.limits.staff >= 999 ? 'Unlimited Teacher Accounts' : `${plan.limits.staff} Staff / Teacher Accounts`}</span>
                            </div>
                            
                            <div className="h-px bg-slate-100 my-4"></div>

                            {plan.features.map((feat, i) => (
                                <div key={i} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-600 font-medium">
                                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                                    <span className="leading-snug">{feat}</span>
                                </div>
                            ))}
                        </div>

                        {plan.price === 0 ? (
                            <button 
                                onClick={() => onNavigate('SIGNUP')}
                                className="w-full py-4 rounded-2xl font-black uppercase tracking-wider text-xs transition-all bg-[#0B192C] text-amber-300 hover:bg-slate-950 border border-amber-500/30 shadow-lg hover:shadow-xl"
                            >
                                Start Free Trial Now
                            </button>
                        ) : (
                            <div className="space-y-2.5">
                                <a
                                    href={`https://wa.me/${(systemConfig?.platformContact || '').replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Hi PakParcha Team! I want to activate the ${plan.name} Plan (${plan.currencySymbol}${plan.price}/month).\n\nPlease send me the bank / JazzCash / EasyPaisa payment details.`)}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full py-4 rounded-2xl font-black uppercase tracking-wider text-xs transition-all bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                                >
                                    <MessageCircle size={17} /> Order on WhatsApp
                                </a>
                                <p className="text-[11px] text-slate-400 text-center font-medium">⚡ Instant activation within 2 hours of payment receipt</p>
                            </div>
                        )}
                    </div>
                );
            })}
            </div>

            {/* Custom Academy & Enterprise Side Card */}
            <div className="lg:col-span-4 bg-slate-900 text-white p-8 sm:p-9 rounded-3xl shadow-2xl flex flex-col justify-between relative overflow-hidden border border-slate-800">
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none"></div>
                <div className="relative z-10">
                   <div className="w-13 h-13 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-2xl flex items-center justify-center mb-6">
                      <Award size={26} />
                   </div>
                   <h3 className="font-black text-2xl mb-2.5 tracking-tight">Need a Multi-Campus Plan?</h3>
                   <p className="text-slate-300 text-xs sm:text-sm mb-6 leading-relaxed">
                     Managing a chain of schools, large academy network, or college with multiple branches? We offer customized packages with dedicated servers and customized question digitization.
                   </p>

                   <div className="bg-white/5 border border-white/10 rounded-2xl p-4 mb-6 space-y-3">
                      <div className="text-xs font-black uppercase tracking-wider text-emerald-400">Easy 3-Step Setup</div>
                      {[
                        'Choose plan or request customized quota',
                        'Pay via JazzCash, EasyPaisa, or Raast Bank Transfer',
                        'Send screenshot on WhatsApp — activated within 2 hours'
                      ].map((step, i) => (
                         <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300 font-medium">
                            <div className="w-4 h-4 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center shrink-0 font-black text-[10px]">{i + 1}</div>
                            <span>{step}</span>
                         </div>
                      ))}
                   </div>

                   {systemConfig?.platformContact ? (
                      <a
                         href={`https://wa.me/${systemConfig.platformContact.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Assalam-o-Alaikum! I am contacting from my school/academy and need a custom package for multiple branches.`)}`}
                         target="_blank"
                         rel="noopener noreferrer"
                         className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl shadow-emerald-900/40 flex items-center justify-center gap-2"
                      >
                         <MessageCircle size={16} /> Chat on WhatsApp
                      </a>
                   ) : (
                      <button 
                        onClick={() => onNavigate('CONTACT')}
                        className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-xl flex items-center justify-center gap-2"
                      >
                         <MessageCircle size={16} /> Contact Sales Team
                      </button>
                   )}

                   <div className="mt-4 pt-4 border-t border-white/10 text-center">
                     <span className="text-[11px] text-slate-400 font-medium">Official WhatsApp: <strong className="text-slate-200">{systemConfig?.platformContact || 'Available 7 Days a Week'}</strong></span>
                   </div>
                </div>
            </div>

        </div>
      </div>

      {/* Payment Channels Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Supported Pakistani Payment Methods
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-2">
            No international credit card needed. Pay securely via any Pakistani banking channel or mobile account.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {paymentMethods.map((pm, idx) => {
            const Icon = pm.icon;
            return (
              <div key={idx} className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm flex items-start gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${pm.color} text-white flex items-center justify-center shrink-0 shadow-md`}>
                  <Icon size={22} />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base mb-1">{pm.title}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed font-medium">{pm.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ Accordion Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-black uppercase tracking-wider mb-3">
            <HelpCircle size={14} /> Clear Answers
          </div>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1.5">
            Everything you need to know about subscriptions, test generation, and syllabus coverage.
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div 
                key={idx} 
                className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm transition-all"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 font-bold text-slate-900 hover:text-indigo-600 transition-colors text-sm sm:text-base"
                >
                  <span>{faq.q}</span>
                  <ChevronDown size={18} className={`text-slate-400 transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180 text-indigo-600' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 font-medium leading-relaxed border-t border-slate-100 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Support Banner */}
        <div className="mt-12 bg-indigo-50 border border-indigo-100 rounded-3xl p-8 text-center">
          <h3 className="text-lg font-black text-indigo-950 mb-2">Have a custom question or specific requirements?</h3>
          <p className="text-xs sm:text-sm text-indigo-800/80 mb-5 max-w-xl mx-auto">
            Our support team in Lahore is ready to guide you on syllabus selection, paper setups, and school onboarding.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigate('CONTACT')}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-indigo-200"
            >
              Contact Support
            </button>
            <button
              onClick={() => onNavigate('SIGNUP')}
              className="px-6 py-3 bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 rounded-xl text-xs font-black uppercase tracking-wider transition-all"
            >
              Create Free Trial Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Pricing;

