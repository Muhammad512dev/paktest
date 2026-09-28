
import React, { useState, useEffect } from 'react';
import { User, SubscriptionPlan } from '../types';
import { registerSchool, getPublicPlans } from '../services/dataService';
import { ArrowRight, CheckCircle2, ArrowLeft, Loader2, Clock, GraduationCap, Award, ShieldCheck, Building2 } from 'lucide-react';

interface SignUpProps {
  onLogin: (user: User) => void;
  onNavigate: (view: string) => void;
}

const SignUp: React.FC<SignUpProps> = ({ onLogin, onNavigate }) => {
  const [loading, setLoading] = useState(false);
  const [dbPlans, setDbPlans] = useState<SubscriptionPlan[]>([]);
  const [selectedPlanName, setSelectedPlanName] = useState<string>('Starter');
  const [pendingNotice, setPendingNotice] = useState<string | null>(null);

  // Common Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // School Fields
  const [schoolName, setSchoolName] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    getPublicPlans().then(fetched => {
      if (fetched && fetched.length > 0) {
        setDbPlans(fetched);
        const freePlan = fetched.find(p => p.price === 0) || fetched[0];
        setSelectedPlanName(freePlan.name);
      }
    }).catch(() => null);
  }, []);

  const currentSelectedPlan = dbPlans.find(p => p.name === selectedPlanName);
  const isSelectedFree = currentSelectedPlan ? currentSelectedPlan.price === 0 : selectedPlanName.toLowerCase().includes('starter');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setPendingNotice(null);

    try {
      const res = await registerSchool({
        name: schoolName,
        principalName,
        contactEmail: email,
        contactPhone: phone,
        address,
        adminPassword: password,
        subscriptionPlan: selectedPlanName
      });

      if (res.isTrial && res.user) {
        onLogin(res.user);
      } else if (res.pending) {
        setPendingNotice(res.message);
      }
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* Left Banner */}
      <div className="w-full md:w-5/12 bg-slate-900 text-white p-6 sm:p-10 md:p-14 flex flex-col justify-between relative overflow-hidden border-r border-slate-800">
        <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-cyan-600/10 rounded-full blur-[100px] pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-10 cursor-pointer" onClick={() => onNavigate('HOME')}>
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-500/20">
              <GraduationCap size={22} />
            </div>
            <div>
              <span className="font-black text-xl tracking-tight text-white block">PakParcha AI</span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest block">Institution Registration</span>
            </div>
          </div>

          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs font-bold uppercase tracking-wider mb-5">
            <Award size={14} className="text-indigo-400" /> Academic Institution Pass
          </div>

          <h2 className="text-2xl sm:text-4xl font-black leading-tight mb-4 sm:mb-5 text-white">
            {isSelectedFree ? 'Register School & Start 14-Day Free Access.' : `Apply for ${selectedPlanName} School License.`}
          </h2>
          <p className="text-slate-300 text-xs sm:text-sm mb-8 leading-relaxed font-medium">
            Join hundreds of Pakistani schools authoring board-standard tests in minutes with official pairing schemes.
          </p>

          <ul className="space-y-3 text-slate-300 text-xs sm:text-sm font-medium">
            <li className="flex items-center gap-2.5"><CheckCircle2 size={18} className="text-indigo-400 shrink-0" /> Automated Question Authoring (PTB & FBISE)</li>
            <li className="flex items-center gap-2.5"><CheckCircle2 size={18} className="text-indigo-400 shrink-0" /> Native Urdu Nastaleeq & InPage Support</li>
            <li className="flex items-center gap-2.5"><CheckCircle2 size={18} className="text-indigo-400 shrink-0" /> Custom School Header, Logo & Watermark</li>
            <li className="flex items-center gap-2.5"><CheckCircle2 size={18} className="text-indigo-400 shrink-0" /> Instant PDF & Dual Column Print Export</li>
          </ul>
        </div>

        <div className="relative z-10 text-[11px] text-slate-400 pt-8 border-t border-slate-800 flex justify-between items-center mt-6">
          <span>&copy; {new Date().getFullYear()} PakParcha AI (Pakistan)</span>
          <span className="text-indigo-400 font-bold">Punjab & Federal Board Aligned</span>
        </div>
      </div>

      {/* Right Registration Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 md:p-12 overflow-y-auto">
        <div className="w-full max-w-lg space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <h3 className="text-2xl font-black text-slate-900">Register Your Institution</h3>
              <p className="text-slate-500 text-xs mt-0.5 font-medium">Create school administrator account</p>
            </div>
            <button onClick={() => onNavigate('HOME')} className="text-slate-500 hover:text-slate-900 flex items-center gap-1 text-xs font-bold bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-sm"><ArrowLeft size={14} /> Back to Home</button>
          </div>

          {pendingNotice ? (
            <div className="p-8 bg-indigo-50 border border-indigo-200 rounded-3xl space-y-6 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-indigo-100 text-indigo-700 rounded-2xl flex items-center justify-center mx-auto border border-indigo-200">
                <Clock size={32} />
              </div>
              <div className="text-center space-y-2">
                <h4 className="text-xl font-black text-indigo-950">Subscription Request Submitted</h4>
                <p className="text-xs text-indigo-800 leading-relaxed font-medium">
                  {pendingNotice}
                </p>
              </div>
              <div className="p-4 bg-white rounded-2xl border border-indigo-200 text-xs text-slate-700 space-y-1.5">
                <div className="font-bold text-slate-900">Next Steps:</div>
                <p>1. Super Admin reviews your {selectedPlanName} plan application.</p>
                <p>2. Send receipt or WhatsApp confirmation for expedited activation.</p>
                <p>3. Once activated within 2 hours, you can log in directly.</p>
              </div>
              <button
                onClick={() => onNavigate('LOGIN')}
                className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg"
              >
                Go to Staff Portal
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Plan Selection */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase mb-1.5 ml-1">Select License Tier</label>
                <div className="grid grid-cols-2 gap-3">
                  {dbPlans.length > 0 ? (
                    dbPlans.map(plan => {
                      const isFree = plan.price === 0;
                      const isSelected = selectedPlanName === plan.name;
                      return (
                        <button
                          key={plan.id || plan.name}
                          type="button"
                          onClick={() => setSelectedPlanName(plan.name)}
                          className={`p-3.5 rounded-2xl border text-left transition-all ${isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 text-slate-950 ring-2 ring-indigo-500/20'
                              : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                        >
                          <div className="font-black text-xs sm:text-sm flex justify-between items-center">
                            <span className="truncate">{plan.name}</span>
                            <span className="text-[11px] text-indigo-600 font-black shrink-0 ml-1">
                              {isFree ? 'Free Trial' : `${plan.currencySymbol || 'Rs.'}${plan.price}`}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium mt-1">
                            {isFree ? 'Instant 14-Day Access' : 'Requires Verification'}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedPlanName('Starter')}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${selectedPlanName === 'Starter'
                            ? 'border-indigo-600 bg-indigo-50/80 text-slate-950 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white text-slate-700'
                          }`}
                      >
                        <div className="font-bold text-xs sm:text-sm">Starter (Free Trial)</div>
                        <div className="text-[10px] text-slate-500 font-medium">Instant Trial Access</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPlanName('Enterprise')}
                        className={`p-3.5 rounded-2xl border text-left transition-all ${selectedPlanName === 'Enterprise'
                            ? 'border-indigo-600 bg-indigo-50/80 text-slate-950 ring-2 ring-indigo-500/20'
                            : 'border-slate-200 bg-white text-slate-700'
                          }`}
                      >
                        <div className="font-bold text-xs sm:text-sm">Academy Pro</div>
                        <div className="text-[10px] text-slate-500 font-medium">Full Multi-Teacher Access</div>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1 ml-1">School / Academy Name</label>
                  <input required type="text" className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-medium" placeholder="e.g. Falcon Science Academy" value={schoolName} onChange={e => setSchoolName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1 ml-1">Principal / Incharge Name</label>
                  <input required type="text" className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-medium" placeholder="e.g. Prof. Muhammad Tariq" value={principalName} onChange={e => setPrincipalName(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1 ml-1">Contact Phone / WhatsApp</label>
                  <input required type="text" className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-medium" placeholder="0300-1234567" value={phone} onChange={e => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1 ml-1">City / Campus Address</label>
                  <input required type="text" className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-medium" placeholder="e.g. Gulberg, Lahore" value={address} onChange={e => setAddress(e.target.value)} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1 ml-1">Admin Email</label>
                  <input required type="email" className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-medium" placeholder="admin@school.edu.pk" value={email} onChange={e => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-[11px] font-black text-slate-700 uppercase mb-1 ml-1">Create Password</label>
                  <input required type="password" className="w-full px-3.5 py-3 bg-white border border-slate-200 rounded-xl focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 outline-none text-xs font-medium" placeholder="••••••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                </div>
              </div>

              <div className="pt-2">
                <button disabled={loading} className="w-full bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black py-4 rounded-xl shadow-lg shadow-indigo-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs uppercase tracking-widest cursor-pointer">
                  {loading ? <Loader2 className="animate-spin" size={18} /> : <>
                    {isSelectedFree ? 'Create Free Trial Account' : `Submit ${selectedPlanName} Application`} <ArrowRight size={16} />
                  </>}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-xs text-slate-500 font-medium">
            Already registered your school? <button onClick={() => onNavigate('LOGIN')} className="text-indigo-600 font-bold hover:underline">Log in here</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;

