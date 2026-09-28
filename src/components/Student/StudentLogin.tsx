
import React, { useState } from 'react';
import { authenticateStudent } from '../../services/dataService';
import { GraduationCap, Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, ArrowLeft, Award, Sparkles } from 'lucide-react';

interface StudentLoginProps {
  onLogin: (student: any) => void;
  onSwitchToAdmin: () => void;
  onBack: () => void;
}

const StudentLogin: React.FC<StudentLoginProps> = ({ onLogin, onSwitchToAdmin, onBack }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const student = await authenticateStudent(email, password);
      onLogin(student);
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your student credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#071326] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none"></div>
      <div className="absolute bottom-10 left-10 w-[400px] h-[400px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="max-w-md w-full relative z-10">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <button
            type="button"
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-[#0B192C] px-4 py-2 text-xs font-bold text-slate-300 shadow-sm transition-colors hover:border-amber-500/40 hover:text-amber-300"
          >
            <ArrowLeft size={15} /> Back to Platform
          </button>
          
          <div className="inline-flex items-center justify-center p-4 bg-gradient-to-br from-amber-400 to-amber-600 rounded-3xl shadow-xl shadow-amber-500/20 mb-4 transform -rotate-3 border border-amber-300">
            <GraduationCap className="text-slate-950" size={36} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight">Student Exam Portal</h1>
          <p className="text-slate-400 mt-1.5 text-xs sm:text-sm font-medium">Access your school tests, quizzes & performance analytics</p>
        </div>

        <div className="bg-[#0B192C]/95 rounded-3xl shadow-2xl border border-amber-500/30 overflow-hidden backdrop-blur-xl">
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-rose-950/50 border border-rose-800 text-rose-300 rounded-2xl flex items-center gap-3 text-xs font-medium">
                <AlertCircle size={18} className="shrink-0 text-rose-400" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5 ml-1">Student Roll No / Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    required
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-900/90 border border-slate-700 rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all text-xs sm:text-sm font-medium text-white placeholder:text-slate-600"
                    placeholder="student@school.edu.pk"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-black uppercase tracking-wider text-slate-300 mb-1.5 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                  <input 
                    required
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-11 pr-4 py-3.5 bg-slate-900/90 border border-slate-700 rounded-xl outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-500/20 transition-all text-xs sm:text-sm font-medium text-white placeholder:text-slate-600"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 group shadow-lg shadow-amber-500/20 cursor-pointer"
                >
                  {loading ? 'Authenticating...' : 'Sign In to Student Portal'}
                  {!loading && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                </button>
              </div>
            </form>
          </div>

          <div className="px-8 py-5 bg-[#071326] border-t border-slate-800 flex flex-col items-center gap-3">
            <button 
              onClick={onSwitchToAdmin}
              className="text-xs font-bold text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-2"
            >
              <ShieldCheck size={16} />
              Switch to Teacher / Admin Portal
            </button>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">
              Verified Academic Portal • Punjab & Federal Board
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;

