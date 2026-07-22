
import React, { useState } from 'react';
import { User, UserRole, SystemConfig } from '../types';
import { authenticateUser } from '../services/dataService';
import { ArrowRight, GraduationCap, AlertCircle, Shield, Lock, ArrowLeft, Globe } from 'lucide-react';

interface LoginProps {
  onLogin: (user: User) => void;
  systemConfig: SystemConfig;
  onNavigate?: (view: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, systemConfig, onNavigate }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loginTitle = 'Staff Access';
  const loginSubtitle = 'Admin & Teacher Login Terminal';

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const user = await authenticateUser(email, password);
      const isPermitted = user?.role === UserRole.SUPER_ADMIN
        || user?.role === UserRole.SCHOOL_ADMIN
        || user?.role === UserRole.TEACHER;

      if (user && isPermitted) {
        onLogin(user);
      } else if (user) {
        setError('This account does not have staff access. Please use the Student Login portal.');
      } else {
        setError("Invalid credentials. Please check your email and password.");
      }
    } catch (err) {
      setError("Authentication failed. Please try again or contact support.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative bg-[#020617] font-sans selection:bg-indigo-500/30">
      
      {/* Dynamic Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/20 blur-[120px] rounded-full animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full animate-pulse" style={{animationDelay: '2s'}}></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
      </div>

      <div className="relative z-10 w-full max-w-[1280px] grid grid-cols-1 lg:grid-cols-2 gap-0 lg:gap-12 p-4">
        
        {/* Left Side: Branding & Info */}
        <div className="hidden lg:flex flex-col justify-center p-12 text-white">
            <div className="mb-12">
                <div className="inline-flex items-center gap-3 px-4 py-2 bg-white/5 border border-white/10 rounded-full mb-8 backdrop-blur-md">
                    <Globe size={14} className="text-indigo-400" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">ExamForge AI · Staff Portal</span>
                </div>
                <h1 className="text-6xl font-black leading-[1.1] tracking-tighter mb-6 bg-gradient-to-r from-white via-white to-indigo-400 bg-clip-text text-transparent">
                  Manage exams <br />
                  with complete <br />
                  confidence.
                </h1>
                <p className="text-xl text-slate-400 font-medium leading-relaxed max-w-md">
                  Secure workspace for platform admins, school administrators, and teachers.
                </p>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
                    <p className="text-3xl font-black text-white mb-1">Admin</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Platform & School</p>
                </div>
                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl backdrop-blur-sm">
                    <p className="text-3xl font-black text-white mb-1">Teacher</p>
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Exam Workspace</p>
                </div>
            </div>
        </div>

        {/* Right Side: Login Form */}
        <div className="flex flex-col justify-center">
            <div className="bg-white/10 backdrop-blur-2xl rounded-[3rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] p-10 md:p-14 border border-white/10 relative overflow-hidden group">
              
              {/* Card Header */}
              <div className="mb-10 relative z-10">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                            {systemConfig.platformLogo ? (
                                <img src={systemConfig.platformLogo} className="w-8 h-8 object-contain" alt="Logo" />
                            ) : (
                                <Shield className="text-white" size={24} />
                            )}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white tracking-tight">{loginTitle}</h2>
                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{loginSubtitle}</p>
                        </div>
                    </div>
                    {onNavigate && (
                        <button onClick={() => onNavigate('HOME')} className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white transition-all">
                            <ArrowLeft size={18} />
                        </button>
                    )}
                </div>

              </div>

                <form onSubmit={handleLogin} className="space-y-8 relative z-10">
                    {error && (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 px-4 py-4 rounded-2xl flex items-start gap-3 text-sm font-bold animate-pulse">
                            <AlertCircle size={20} className="shrink-0"/> <span>{error}</span>
                        </div>
                    )}

                    <div className="space-y-4">
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1 group-focus-within:text-indigo-400 transition-colors">Access Identifier</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-7 py-6 bg-black/30 border border-white/10 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-white text-base placeholder:text-slate-600 shadow-inner"
                                placeholder="name@institution.edu"
                                required
                            />
                        </div>
                        <div className="group">
                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2 ml-1 group-focus-within:text-indigo-400 transition-colors">Security Token</label>
                            <div className="relative">
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-7 py-6 bg-black/30 border border-white/10 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-bold text-white text-base placeholder:text-slate-600 shadow-inner"
                                    placeholder="••••••••"
                                    required
                                />
                                <Lock size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600" />
                            </div>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white hover:bg-indigo-50 text-black font-black uppercase tracking-[0.2em] py-5 rounded-2xl transition-all flex items-center justify-center gap-3 group active:scale-[0.98] disabled:opacity-70 text-xs shadow-xl"
                    >
                        {loading ? (
                            <div className="w-5 h-5 border-3 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
                        ) : (
                            <>Authorize Session <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                        )}
                    </button>

                    {onNavigate && (
                      <div className="pt-6 flex items-center justify-center gap-4 text-[10px] font-black uppercase tracking-widest">
                        <button type="button" onClick={() => onNavigate('STUDENT_LOGIN')} className="text-slate-400 hover:text-indigo-300 flex items-center gap-1"><GraduationCap size={13} /> Student Login</button>
                      </div>
                    )}
                </form>

              {/* Card Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 blur-[60px] rounded-full group-hover:bg-indigo-600/20 transition-colors"></div>
            </div>

            {/* Bottom Footer */}
            <div className="mt-8 flex justify-between items-center px-6">
                <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest">&copy; 2024 ExamForge AI</p>
                <div className="flex items-center gap-4">
                    <button className="text-[10px] font-bold text-slate-600 hover:text-indigo-400 uppercase tracking-widest transition-colors">Security</button>
                    <button className="text-[10px] font-bold text-slate-600 hover:text-indigo-400 uppercase tracking-widest transition-colors">Privacy</button>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
