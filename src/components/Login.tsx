
import React, { useState } from 'react';
import { User, UserRole, SystemConfig } from '../types';
import { authenticateUser } from '../services/dataService';
import { ArrowRight, AlertCircle, Lock, ArrowLeft, Eye, EyeOff, CheckCircle, BookOpen, Users, Award, Zap } from 'lucide-react';

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
    { icon: BookOpen, label: 'Paper Generation', desc: 'AI-powered exam creation' },
    { icon: Users, label: 'Student Management', desc: 'Complete class oversight' },
    { icon: Award, label: 'Smart Grading', desc: 'Instant objective grading' },
    { icon: Zap, label: 'Real-time Results', desc: 'Instant student feedback' },
  ];

  return (
    <div className="min-h-screen w-full flex items-stretch relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #0a0f1e 0%, #0d1b2a 50%, #0a1628 100%)' }}>

      {/* Animated Background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute w-[700px] h-[700px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #00875a 0%, transparent 70%)', top: '-200px', left: '-200px', animation: 'float1 8s ease-in-out infinite' }} />
        <div className="absolute w-[500px] h-[500px] rounded-full opacity-8" style={{ background: 'radial-gradient(circle, #1a6b4a 0%, transparent 70%)', bottom: '-100px', left: '20%', animation: 'float2 10s ease-in-out infinite' }} />
        <div className="absolute w-[400px] h-[400px] rounded-full opacity-6" style={{ background: 'radial-gradient(circle, #2d9670 0%, transparent 70%)', top: '30%', right: '10%', animation: 'float3 12s ease-in-out infinite' }} />
        {/* Grid lines */}
        <div className="absolute inset-0 opacity-[0.03]" style={{ backgroundImage: 'linear-gradient(rgba(0,200,130,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(0,200,130,0.5) 1px, transparent 1px)', backgroundSize: '80px 80px' }} />
      </div>

      <style>{`
        @keyframes float1 { 0%, 100% { transform: translate(0, 0) scale(1); } 50% { transform: translate(30px, 20px) scale(1.05); } }
        @keyframes float2 { 0%, 100% { transform: translate(0, 0) rotate(0deg); } 50% { transform: translate(-20px, -30px) rotate(5deg); } }
        @keyframes float3 { 0%, 100% { transform: translate(0, 0); } 50% { transform: translate(15px, -20px); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        @keyframes spinSlow { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .slide-up { animation: slideUp 0.6s ease forwards; }
        .fade-in { animation: fadeIn 0.8s ease forwards; }
        .shimmer-text {
          background: linear-gradient(90deg, #fff 0%, #00c87a 40%, #fff 60%, #7effc0 100%);
          background-size: 200% auto;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          animation: shimmer 4s linear infinite;
        }
        .input-glow:focus { box-shadow: 0 0 0 3px rgba(0,180,100,0.2), 0 4px 20px rgba(0,0,0,0.3); }
        .card-glass {
          background: rgba(255, 255, 255, 0.04);
          backdrop-filter: blur(24px);
          -webkit-backdrop-filter: blur(24px);
          border: 1px solid rgba(255, 255, 255, 0.08);
        }
        .btn-primary {
          background: linear-gradient(135deg, #00a86b 0%, #007a4d 100%);
          transition: all 0.3s ease;
        }
        .btn-primary:hover { background: linear-gradient(135deg, #00c47e 0%, #009660 100%); transform: translateY(-1px); box-shadow: 0 12px 40px rgba(0,168,107,0.4); }
        .btn-primary:active { transform: translateY(0px); }
        .feature-card { transition: all 0.3s ease; }
        .feature-card:hover { background: rgba(0, 168, 107, 0.08); border-color: rgba(0, 168, 107, 0.2); transform: translateX(4px); }
        .pk-star { animation: spinSlow 20s linear infinite; }
      `}</style>

      {/* LEFT PANEL */}
      <div className="hidden lg:flex flex-col justify-between w-[52%] relative z-10 p-14">
        
        {/* Top: Logo */}
        <div className="fade-in" style={{ animationDelay: '0.1s', opacity: 0 }}>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl" style={{ background: 'linear-gradient(135deg, #00a86b, #005c3b)' }}>
              {systemConfig.platformLogo ? (
                <img src={systemConfig.platformLogo} className="w-8 h-8 object-contain" alt="Logo" />
              ) : (
                <span className="text-white font-black text-xl">P</span>
              )}
            </div>
            <div>
              <p className="text-white font-black text-lg tracking-tight">{systemConfig.platformName || 'PakTest'}</p>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#00c87a' }}>Staff Portal</p>
            </div>
          </div>
        </div>

        {/* Middle: Headline */}
        <div>
          <div className="slide-up mb-10" style={{ animationDelay: '0.2s', opacity: 0 }}>
            {/* Pakistan-inspired decorative element */}
            <div className="flex items-center gap-3 mb-8">
              <div className="h-px flex-1 opacity-20" style={{ background: 'linear-gradient(90deg, transparent, #00c87a)' }} />
              <div className="pk-star text-2xl" style={{ color: '#00c87a' }}>✦</div>
              <div className="h-px flex-1 opacity-20" style={{ background: 'linear-gradient(90deg, #00c87a, transparent)' }} />
            </div>

            <h1 className="text-6xl font-black leading-[1.05] tracking-tighter mb-6">
              <span className="shimmer-text">Pakistan's</span>
              <br />
              <span className="text-white">Smartest</span>
              <br />
              <span className="text-white">Exam</span>
              <span className="shimmer-text"> Platform.</span>
            </h1>
            <p className="text-lg font-medium leading-relaxed max-w-md" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Empowering educators with intelligent tools for paper generation, online testing, and student performance analytics.
            </p>
          </div>

          {/* Feature cards */}
          <div className="grid grid-cols-2 gap-3" style={{ animationDelay: '0.4s' }}>
            {features.map((f, i) => (
              <div key={i} className="feature-card p-4 rounded-2xl border" style={{ background: 'rgba(255,255,255,0.03)', borderColor: 'rgba(255,255,255,0.06)', animationDelay: `${0.4 + i * 0.1}s` }}>
                <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: 'rgba(0,168,107,0.15)' }}>
                  <f.icon size={16} style={{ color: '#00c87a' }} />
                </div>
                <p className="text-white font-bold text-sm">{f.label}</p>
                <p className="text-xs font-medium mt-0.5" style={{ color: 'rgba(255,255,255,0.35)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom footer */}
        <div className="flex items-center gap-6">
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.2)' }}>
            © 2025 {systemConfig.platformName || 'PakTest'}
          </p>
          <div className="flex gap-4">
            {['Security', 'Privacy', 'Help'].map(t => (
              <button key={t} className="text-xs font-bold uppercase tracking-widest transition-colors" style={{ color: 'rgba(255,255,255,0.2)' }}
                onMouseEnter={e => (e.currentTarget.style.color = '#00c87a')}
                onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.2)')}
              >{t}</button>
            ))}
          </div>
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex flex-col justify-center items-center w-full lg:w-[48%] relative z-10 p-6 md:p-10 lg:p-16">
        
        {/* Back button on mobile */}
        {onNavigate && (
          <div className="w-full max-w-[440px] mb-4 lg:hidden">
            <button onClick={() => onNavigate('HOME')} className="flex items-center gap-2 text-sm font-bold transition-colors" style={{ color: 'rgba(255,255,255,0.4)' }}
              onMouseEnter={e => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.4)')}>
              <ArrowLeft size={16} /> Back to Home
            </button>
          </div>
        )}

        <div className="w-full max-w-[440px]">
          
          {/* Card */}
          <div className="card-glass rounded-[2rem] p-8 md:p-10 slide-up" style={{ animationDelay: '0.15s', opacity: 0 }}>
            
            {/* Card header */}
            <div className="flex items-start justify-between mb-8">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-2 h-2 rounded-full" style={{ background: '#00c87a', boxShadow: '0 0 8px #00c87a' }} />
                  <span className="text-xs font-black uppercase tracking-widest" style={{ color: '#00c87a' }}>Staff Access Terminal</span>
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight">Sign In</h2>
                <p className="text-sm font-medium mt-1" style={{ color: 'rgba(255,255,255,0.4)' }}>Admin · Teacher · Supervisor</p>
              </div>
              {onNavigate && (
                <button onClick={() => onNavigate('HOME')} className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hidden lg:flex" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.1)'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.05)'; }}>
                  <ArrowLeft size={16} style={{ color: 'rgba(255,255,255,0.5)' }} />
                </button>
              )}
            </div>

            {/* Error */}
            {error && (
              <div className="mb-6 px-4 py-3 rounded-xl flex items-start gap-3 text-sm font-medium" style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5' }}>
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              
              {/* Email field */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2 transition-colors" style={{ color: focusedField === 'email' ? '#00c87a' : 'rgba(255,255,255,0.35)' }}>
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    className="input-glow w-full px-5 py-4 rounded-2xl text-white text-sm font-medium outline-none transition-all placeholder:text-gray-600"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: focusedField === 'email' ? '1px solid rgba(0,200,122,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    }}
                    placeholder="admin@school.edu.pk"
                    required
                  />
                  {email && <CheckCircle size={16} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: '#00c87a' }} />}
                </div>
              </div>

              {/* Password field */}
              <div>
                <label className="block text-xs font-black uppercase tracking-widest mb-2 transition-colors" style={{ color: focusedField === 'password' ? '#00c87a' : 'rgba(255,255,255,0.35)' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    className="input-glow w-full px-5 py-4 pr-12 rounded-2xl text-white text-sm font-medium outline-none transition-all placeholder:text-gray-600"
                    style={{
                      background: 'rgba(0,0,0,0.3)',
                      border: focusedField === 'password' ? '1px solid rgba(0,200,122,0.5)' : '1px solid rgba(255,255,255,0.08)',
                    }}
                    placeholder="••••••••••••"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 transition-colors" style={{ color: 'rgba(255,255,255,0.3)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.7)')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(255,255,255,0.3)')}>
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Divider */}
              <div className="flex items-center gap-3 py-1">
                <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
                <Lock size={12} style={{ color: 'rgba(255,255,255,0.2)' }} />
                <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.06)' }} />
              </div>

              {/* Submit button */}
              <button type="submit" disabled={loading} className="btn-primary w-full py-4 rounded-2xl text-white font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
                {loading ? (
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 border-2 rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: '#fff' }} />
                    <span>Authenticating...</span>
                  </div>
                ) : (
                  <>
                    <span>Access Staff Portal</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            {/* Switch to student login */}
            {onNavigate && (
              <div className="mt-6 pt-5" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-center text-xs font-bold" style={{ color: 'rgba(255,255,255,0.25)' }}>
                  Not a staff member?{' '}
                  <button onClick={() => onNavigate('STUDENT_LOGIN')} className="font-black transition-colors" style={{ color: 'rgba(0,200,122,0.7)' }}
                    onMouseEnter={e => (e.currentTarget.style.color = '#00c87a')}
                    onMouseLeave={e => (e.currentTarget.style.color = 'rgba(0,200,122,0.7)')}>
                    Student Login →
                  </button>
                </p>
              </div>
            )}
          </div>

          {/* Trust badges */}
          <div className="mt-6 flex items-center justify-center gap-6">
            {['256-bit SSL', 'Pakistan Hosted', 'GDPR Safe'].map(badge => (
              <div key={badge} className="flex items-center gap-1.5">
                <CheckCircle size={11} style={{ color: '#00c87a', opacity: 0.6 }} />
                <span className="text-xs font-bold" style={{ color: 'rgba(255,255,255,0.2)' }}>{badge}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
