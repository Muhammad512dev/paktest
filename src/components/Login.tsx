
import React, { useState } from 'react';
import { User, UserRole, SystemConfig } from '../types';
import { authenticateUser } from '../services/dataService';
import { ArrowRight, AlertCircle, Lock, ArrowLeft, Eye, EyeOff, CheckCircle, BookOpen, Users, Award, Zap, GraduationCap, ShieldCheck } from 'lucide-react';

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
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
        setError('Invalid credentials. Please check your email and password.');
      }
    } catch (err) {
      setError('Authentication failed. Please try again or contact support.');
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: BookOpen, label: 'Paper Generation', desc: 'Curriculum-aligned authoring' },
    { icon: Users, label: 'Institutional Accounts', desc: 'Multi-teacher departments' },
    { icon: Award, label: 'Board Pairing Schemes', desc: '100% verified SLO matrices' },
    { icon: Zap, label: 'Instant PDF Output', desc: 'School logo & watermark' },
  ];

  return (
    <div className="min-h-screen w-full flex items-stretch relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #071326 0%, #0B192C 50%, #08162B 100%)' }}>

      {/* Ambient Academic Gold & Navy Background Glows */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[600px] h-[600px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #D4AF37 0%, transparent 70%)', top: '-150px', left: '-150px', animation: 'float1 10s ease-in-out infinite' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #2563EB 0%, transparent 70%)', bottom: '-100px', left: '20%', animation: 'float2 12s ease-in-out infinite' }} />
        {/* Subtle Grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(212,175,55,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(212,175,55,0.4) 1px, transparent 1px)', backgroundSize: '70px 70px' }} />
      </div>

      <style>{`
        @keyframes float1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(30px, 20px) scale(1.05); } }
        @keyframes float2 { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(-20px, -30px) rotate(5deg); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .slide-up { animation: slideUp 0.5s ease forwards; }
        .fade-in { animation: fadeIn 0.7s ease forwards; }
        .shimmer-gold {
          background: linear-gradient(90deg, #FFFFFF 0%, #F59E0B 40%, #FFFFFF 60%, #FDE68A 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .card-academic {
          background: rgba(11, 25, 44, 0.75);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(212, 175, 55, 0.25);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
        }
        .btn-gold {
          background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
          color: #0B192C;
          font-weight: 900;
          transition: all 0.3s ease;
        }
        .btn-gold:hover { background: linear-gradient(135deg, #FBBF24 0%, #F59E0B 100%); transform: translateY(-1px); box-shadow: 0 10px 30px rgba(245,158,11,0.35); }
        .feature-card { transition: all 0.3s ease; }
        .feature-card:hover { background: rgba(212, 175, 55, 0.08); border-color: rgba(212, 175, 55, 0.3); transform: translateX(4px); }
      `}</style>

      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] relative z-10 p-14 border-r border-slate-800/80">
        
        {/* Top: Logo */}
        <div className="fade-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <div className="flex items-center gap-4 cursor-pointer" onClick={() => onNavigate && onNavigate('HOME')}>
            {systemConfig.platformLogo ? (
              <img src={systemConfig.platformLogo} className="h-12 w-auto max-w-[220px] object-contain drop-shadow-lg" alt="PakParcha AI Logo" />
            ) : (
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl bg-gradient-to-br from-amber-400 to-amber-600">
                  <GraduationCap size={26} className="text-slate-950" />
                </div>
                <div>
                  <p className="text-white font-black text-lg tracking-tight">{systemConfig.platformName || 'PakParcha AI'}</p>
                  <p className="text-xs font-black uppercase tracking-widest text-amber-400">Staff Portal</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Middle: Headline */}
        <div>
          <div className="slide-up mb-10" style={{ animationDelay: '0.2s', opacity: 0 }}>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-wider mb-6">
              <ShieldCheck size={14} className="text-amber-400" /> Authorized Institutional Terminal
            </div>

            <h1 className="text-5xl font-black leading-[1.1] tracking-tight mb-5 text-white">
              Pakistan's Gold Standard <br />
              <span className="shimmer-gold font-serif italic">Exam Authoring</span> Portal.
            </h1>
            <p className="text-sm sm:text-base font-medium leading-relaxed max-w-md text-slate-300">
              Empowering school administrators and faculty with instant board-compliant test creation, Nastaleeq typesetting, and automated answer sheets.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-3" style={{ animationDelay: '0.4s' }}>
            {features.map((f, i) => (
              <div key={i} className="feature-card p-4 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.02)', borderColor: 'rgba(212,175,55,0.15)' }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-2.5 bg-amber-500/15 border border-amber-500/20 text-amber-400">
                  <f.icon size={16} />
                </div>
                <p className="text-white font-black text-xs sm:text-sm">{f.label}</p>
                <p className="text-[11px] font-medium mt-0.5 text-slate-400">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom footer */}
        <div className="flex items-center justify-between">
          <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
            © {new Date().getFullYear()} {systemConfig.platformName || 'PakParcha AI'}
          </p>
          <div className="flex gap-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            <span className="hover:text-amber-300 cursor-pointer">Security</span>
            <span>&bull;</span>
            <span className="hover:text-amber-300 cursor-pointer">Privacy</span>
            <span>&bull;</span>
            <span className="hover:text-amber-300 cursor-pointer">Helpdesk</span>
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-col justify-center items-center w-full lg:w-[48%] relative z-10 p-6 md:p-10 lg:p-14">
        
        {/* Back button on mobile */}
        {onNavigate && (
          <div className="w-full max-w-[420px] mb-4 lg:hidden">
            <button onClick={() => onNavigate('HOME')} className="flex items-center gap-2 text-xs font-bold text-slate-300 hover:text-white transition-colors">
              <ArrowLeft size={16} /> Back to Home
            </button>
          </div>
        )}

        <div className="w-full max-w-[420px]">
          
          {/* Card */}
          <div className="card-academic rounded-[2rem] p-8 md:p-10 slide-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
            
            {/* Card header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <div className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_#f59e0b]" />
                  <span className="text-[11px] font-black uppercase tracking-widest text-amber-400">Staff Portal</span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Staff Sign In</h2>
                <p className="text-xs font-medium text-slate-400 mt-0.5">Principal · Subject Teacher · Exam Coordinator</p>
              </div>
              {onNavigate && (
                <button onClick={() => onNavigate('HOME')} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hidden lg:flex bg-slate-800/80 border border-slate-700 text-slate-300 hover:text-white hover:bg-slate-700">
                  <ArrowLeft size={16} />
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl flex items-start gap-3 text-xs font-medium bg-rose-950/50 border border-rose-800 text-rose-300">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Email field */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5 text-slate-300">
                  Registered Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-3.5 rounded-xl text-white text-xs sm:text-sm font-medium outline-none transition-all placeholder:text-slate-500 bg-slate-900/90 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
                    placeholder="principal@academy.edu.pk"
                    required
                  />
                  {email && <CheckCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-amber-400" />}
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider mb-1.5 text-slate-300">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="w-full px-4 py-3.5 pr-11 rounded-xl text-white text-xs sm:text-sm font-medium outline-none transition-all placeholder:text-slate-500 bg-slate-900/90 border border-slate-700 focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20"
                    placeholder="••••••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-2">
                <button type="submit" disabled={loading} className="btn-gold w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer">
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
                      <span>Authenticating...</span>
                    </div>
                  ) : (
                    <>
                      <span>Sign In to Staff Portal</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Switch to student login & signup */}
            {onNavigate && (
              <div className="mt-6 pt-5 border-t border-slate-800 text-center space-y-2 text-xs">
                <p className="text-slate-400 font-medium">
                  Looking for student exam portal?{' '}
                  <button onClick={() => onNavigate('STUDENT_LOGIN')} className="font-bold text-amber-400 hover:text-amber-300 underline">
                    Student Login &rarr;
                  </button>
                </p>
                <p className="text-slate-400 font-medium">
                  New school or academy?{' '}
                  <button onClick={() => onNavigate('SIGNUP')} className="font-bold text-amber-400 hover:text-amber-300 underline">
                    Start 14-Day Free Trial
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-5 text-xs text-slate-400 font-semibold">
            <span className="flex items-center gap-1.5"><ShieldCheck size={14} className="text-amber-400" /> SSL Encrypted</span>
            <span>&bull;</span>
            <span>Punjab & Federal Board Aligned</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

