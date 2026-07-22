
import React, { useState } from 'react';
import { authenticateStudent } from '../../services/dataService';
import { GraduationCap, Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, ArrowLeft } from 'lucide-react';

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
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <button
            type="button"
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 shadow-sm transition-colors hover:border-indigo-200 hover:text-indigo-600"
          >
            <ArrowLeft size={16} /> Back to Home
          </button>
          <div className="inline-flex items-center justify-center p-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-200 mb-4 transform -rotate-6">
            <GraduationCap className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Student Portal</h1>
          <p className="text-slate-500 mt-2 font-medium">Access your exams and track performance</p>
        </div>

        <div className="bg-white rounded-3xl shadow-2xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
          <div className="p-8">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl flex items-center gap-3 text-sm font-medium animate-shake">
                <AlertCircle size={20} className="shrink-0" />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Official Email</label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    required
                    type="email" 
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700"
                    placeholder="student@school.edu"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 ml-1">Password</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input 
                    required
                    type="password" 
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all font-medium text-slate-700"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-[0.98] disabled:opacity-50 disabled:active:scale-100 flex items-center justify-center gap-2 group"
              >
                {loading ? 'Authenticating...' : 'Sign In to Portal'}
                {!loading && <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />}
              </button>
            </form>
          </div>

          <div className="px-8 py-6 bg-slate-50 border-t border-slate-100 flex flex-col items-center gap-4">
            <button 
              onClick={onSwitchToAdmin}
              className="text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors flex items-center gap-2"
            >
              <ShieldCheck size={18} />
              Switch to Teacher / Admin Login
            </button>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
              Secure Session • Powered by ExamForge AI
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentLogin;
