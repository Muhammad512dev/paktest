
import React, { useState, useEffect } from 'react';
import { User, SubscriptionPlan } from '../types';
import { registerSchool, getPublicPlans } from '../services/dataService';
import { ArrowRight, CheckCircle2, ArrowLeft, Loader2, Clock } from 'lucide-react';

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
        // Default to first free plan or first plan
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
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Left Banner */}
      <div className="w-full md:w-5/12 bg-slate-900 text-white p-12 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80')] bg-cover opacity-20"></div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-10 cursor-pointer" onClick={() => onNavigate('HOME')}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="font-bold text-lg">E</span>
            </div>
            <span className="font-bold text-xl tracking-tight">ExamForge</span>
          </div>
          <h2 className="text-4xl font-black leading-tight mb-6">
            {isSelectedFree ? 'Start your 14-day free trial.' : `Request ${selectedPlanName} Access.`}
          </h2>
          <ul className="space-y-4 text-slate-300">
            <li className="flex items-center gap-3"><CheckCircle2 size={20} className="text-emerald-400" /> AI Question Generation</li>
            <li className="flex items-center gap-3"><CheckCircle2 size={20} className="text-emerald-400" /> Bilingual (English/Urdu) Support</li>
            <li className="flex items-center gap-3"><CheckCircle2 size={20} className="text-emerald-400" /> Export to PDF & Word</li>
            <li className="flex items-center gap-3"><CheckCircle2 size={20} className="text-emerald-400" /> Enterprise approval workflow</li>
          </ul>
        </div>
        <div className="relative z-10 text-xs text-slate-500">
          &copy; 2024 ExamForge AI. All rights reserved.
        </div>
      </div>

      {/* Right Form / Notice */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold text-slate-900">Register Institution</h3>
              <p className="text-slate-500 text-sm mt-1">Create a new school account</p>
            </div>
            <button onClick={() => onNavigate('HOME')} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-bold"><ArrowLeft size={16} /> Back</button>
          </div>

          {pendingNotice ? (
            <div className="p-8 bg-amber-50 border border-amber-200 rounded-3xl space-y-6 animate-in fade-in duration-300">
              <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center mx-auto">
                <Clock size={32} />
              </div>
              <div className="text-center space-y-2">
                <h4 className="text-xl font-bold text-amber-950">Subscription Pending Approval</h4>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  {pendingNotice}
                </p>
              </div>
              <div className="p-4 bg-white/80 rounded-2xl border border-amber-200 text-xs text-slate-600 space-y-1">
                <div className="font-bold text-slate-800">What happens next?</div>
                <p>1. Super Admin reviews your {selectedPlanName} plan request.</p>
                <p>2. Upon approval, your account is activated and an official invoice is generated.</p>
                <p>3. You can then log in using your registered credentials.</p>
              </div>
              <button
                onClick={() => onNavigate('LOGIN')}
                className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-amber-200"
              >
                Go to Staff Login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Dynamic Database Plan Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Select Subscription Plan</label>
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
                          className={`p-3.5 rounded-xl border text-left transition-all ${isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-600/20'
                              : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-slate-300'
                            }`}
                        >
                          <div className="font-bold text-sm flex justify-between items-center">
                            <span className="truncate">{plan.name}</span>
                            <span className="text-[11px] text-indigo-600 font-extrabold shrink-0 ml-1">
                              {isFree ? 'Free' : `${plan.currencySymbol || '$'}${plan.price}`}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-medium mt-1">
                            {isFree ? 'Instant 14-Day Trial' : 'Requires Admin Approval'}
                          </div>
                        </button>
                      );
                    })
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={() => setSelectedPlanName('Starter')}
                        className={`p-3 rounded-xl border text-left transition-all ${selectedPlanName === 'Starter'
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-600/20'
                            : 'border-slate-200 bg-slate-50 text-slate-600'
                          }`}
                      >
                        <div className="font-bold text-sm">Starter (Free)</div>
                        <div className="text-[10px] text-slate-500 font-medium">Instant Trial Access</div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedPlanName('Enterprise')}
                        className={`p-3 rounded-xl border text-left transition-all ${selectedPlanName === 'Enterprise'
                            ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-600/20'
                            : 'border-slate-200 bg-slate-50 text-slate-600'
                          }`}
                      >
                        <div className="font-bold text-sm">Enterprise</div>
                        <div className="text-[10px] text-slate-500 font-medium">Requires Admin Approval</div>
                      </button>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">School Name</label>
                  <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="Beacon High" value={schoolName} onChange={e => setSchoolName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Principal Name</label>
                  <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="Dr. Smith" value={principalName} onChange={e => setPrincipalName(e.target.value)} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Phone Number</label>
                <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="+1 (555) 000-0000" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Address</label>
                <input required type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium" placeholder="Street, City, Country" value={address} onChange={e => setAddress(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Admin Email</label>
                <input required type="email" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" placeholder="admin@school.edu" value={email} onChange={e => setEmail(e.target.value)} />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Admin Password</label>
                <input required type="password" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-medium" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
              </div>

              <button disabled={loading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                {loading ? <Loader2 className="animate-spin" /> : <>
                  {isSelectedFree ? 'Start Free Access' : `Submit ${selectedPlanName} Request`} <ArrowRight size={18} />
                </>}
              </button>
            </form>
          )}

          <p className="text-center text-sm text-slate-500 font-medium">
            Already have an account? <button onClick={() => onNavigate('LOGIN')} className="text-indigo-600 font-bold hover:underline">Log in</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
