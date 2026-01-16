
import React, { useState } from 'react';
import { User, UserRole, SystemConfig } from '../types';
import { authenticateUser } from '../services/dataService';
import { LayoutDashboard, ShieldCheck, ArrowRight, UserCheck, GraduationCap, AlertCircle, Info, CloudOff, Building2, Shield, Lock, ArrowLeft } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  systemConfig: SystemConfig;
  onNavigate?: (view: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, systemConfig, onNavigate }) => {
  const [email, setEmail] = useState('principal@beaconhigh.edu');
  const [password, setPassword] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const user = await authenticateUser(email, password);
      if (user) {
        onLogin(user);
      } else {
        setError("Login failed. Verify credentials or use 'principal@beaconhigh.edu'");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const setDemoCreds = (role: 'SCHOOL' | 'ADMIN') => {
      setError(null);
      if (role === 'SCHOOL') {
          setEmail('principal@beaconhigh.edu');
          setPassword('password');
      } else {
          setEmail('admin@examforge.com');
          setPassword('password');
      }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden font-sans">
      
      {/* Background Layer */}
      <div 
        className="absolute inset-0 z-0"
        style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1497864149936-d7e61461a332?auto=format&fit=crop&q=80&w=2500')`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900/95 via-slate-900/90 to-indigo-950/80 backdrop-blur-[2px]"></div>
      </div>

      {/* Content Layer */}
      <div className="relative z-10 w-full max-w-xl p-4">
        
        {/* Brand Header */}
        <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center p-3 mb-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/10 shadow-2xl">
                {systemConfig.platformLogo ? (
                    <img src={systemConfig.platformLogo} className="w-10 h-10 object-contain" alt="Logo" />
                ) : (
                    <LayoutDashboard className="text-white" size={32} />
                )}
            </div>
            <h1 className="text-3xl font-black text-white tracking-tight">{systemConfig.platformName}</h1>
            <p className="text-indigo-200 text-sm font-medium mt-1 tracking-wide uppercase">Enterprise Assessment Platform</p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-[2.5rem] shadow-2xl p-8 md:p-10 border border-white/20">
          <div className="mb-6 flex justify-between items-start">
            <div className="text-left">
              <h2 className="text-2xl font-bold text-slate-900">Welcome Back</h2>
              <p className="text-slate-500 text-sm mt-1">Please authenticate to continue</p>
            </div>
            {onNavigate && (
                <button onClick={() => onNavigate('HOME')} className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center gap-1">
                    <ArrowLeft size={14} /> Back
                </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
             <button 
                type="button" 
                onClick={() => setDemoCreds('SCHOOL')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${email === 'principal@beaconhigh.edu' ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-inner' : 'border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600'}`}
             >
                <Building2 size={20} className="mb-1.5"/>
                <span className="text-[10px] font-bold uppercase tracking-widest">School Admin</span>
             </button>
             <button 
                type="button" 
                onClick={() => setDemoCreds('ADMIN')}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all ${email === 'admin@examforge.com' ? 'border-purple-600 bg-purple-50 text-purple-700 shadow-inner' : 'border-slate-100 text-slate-400 hover:border-slate-300 hover:text-slate-600'}`}
             >
                <Shield size={20} className="mb-1.5"/>
                <span className="text-[10px] font-bold uppercase tracking-widest">Super Admin</span>
             </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {error && (
               <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-2xl flex items-start gap-3 text-xs font-bold animate-in fade-in">
                  <AlertCircle size={16} className="mt-0.5 shrink-0"/> <span>{error}</span>
               </div>
            )}
            
            <div className="space-y-4">
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">Secure Identity</label>
                    <input
                        type="email"
                        autoComplete="username"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 text-sm placeholder:text-slate-300"
                        placeholder="admin@institution.edu"
                        required
                    />
                </div>
                <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 ml-2">Access Key</label>
                    <div className="relative">
                        <input
                            type="password"
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 text-sm placeholder:text-slate-300"
                            placeholder="••••••••"
                            required
                        />
                        <Lock size={18} className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" />
                    </div>
                </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black uppercase tracking-[0.2em] py-4 rounded-2xl transition-all flex items-center justify-center gap-3 group shadow-xl shadow-slate-900/20 active:scale-[0.98] disabled:opacity-70 mt-2 text-xs"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Access Dashboard <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" /></>
              )}
            </button>
          </form>

          {onNavigate && (
            <div className="mt-6 text-center">
                <p className="text-sm text-slate-500 font-medium">
                    Don't have an account? <button onClick={() => onNavigate('SIGNUP')} className="text-indigo-600 font-bold hover:underline">Start Free Trial</button>
                </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-8 text-center space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/5 border border-white/10 rounded-full">
                <ShieldCheck size={12} className="text-emerald-400" />
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">End-to-End Encrypted</span>
            </div>
            <p className="text-[10px] text-slate-500 font-medium">
                &copy; 2024 {systemConfig.platformName}. Authorized Personnel Only.
            </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
