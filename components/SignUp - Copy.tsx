
import React, { useState } from 'react';
import { User, School } from '../types';
import { addSchool, authenticateUser } from '../services/dataService';
import { ArrowRight, CheckCircle2, ArrowLeft, Loader2 } from 'lucide-react';

interface SignUpProps {
  onLogin: (user: User) => void;
  onNavigate: (view: string) => void;
}

const SignUp: React.FC<SignUpProps> = ({ onLogin, onNavigate }) => {
  const [loading, setLoading] = useState(false);
  
  // Common Fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // School Fields
  const [schoolName, setSchoolName] = useState('');
  const [principalName, setPrincipalName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
        // School Flow
        const newSchool: Partial<School> = {
          name: schoolName,
          principalName,
          contactEmail: email,
          contactPhone: phone,
          address,
          subscriptionPlan: 'Starter',
          status: 'Trial',
          validTill: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14 Days Trial
          subscriptionStartDate: new Date().toISOString(),
          stats: { papersCount: 0, teachersCount: 1, studentCount: 0 }
        };
        
        // This endpoint in dataService creates both School and Admin User
        await addSchool({
            ...newSchool,
            adminPassword: password // Pass password for auto-user creation
        } as any);

        // Auto login
        const loggedInUser = await authenticateUser(email, password);
        onLogin(loggedInUser);
    } catch (error) {
      console.error(error);
      alert("Registration failed. Please try again.");
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
          <h2 className="text-4xl font-black leading-tight mb-6">Start your 14-day free trial.</h2>
          <ul className="space-y-4 text-slate-300">
            <li className="flex items-center gap-3"><CheckCircle2 size={20} className="text-emerald-400"/> AI Question Generation</li>
            <li className="flex items-center gap-3"><CheckCircle2 size={20} className="text-emerald-400"/> Bilingual (English/Urdu) Support</li>
            <li className="flex items-center gap-3"><CheckCircle2 size={20} className="text-emerald-400"/> Export to PDF & Word</li>
            <li className="flex items-center gap-3"><CheckCircle2 size={20} className="text-emerald-400"/> No credit card required</li>
          </ul>
        </div>
        <div className="relative z-10 text-xs text-slate-500">
          &copy; 2024 ExamForge AI. All rights reserved.
        </div>
      </div>

      {/* Right Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12 overflow-y-auto">
        <div className="w-full max-w-md space-y-8">
          <div className="flex items-center justify-between">
             <div>
                <h3 className="text-2xl font-bold text-slate-900">Register Institution</h3>
                <p className="text-slate-500 text-sm mt-1">Create a new school account</p>
             </div>
             <button onClick={() => onNavigate('HOME')} className="text-slate-400 hover:text-slate-600 flex items-center gap-1 text-sm font-bold"><ArrowLeft size={16}/> Back</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
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
              {loading ? <Loader2 className="animate-spin" /> : <>Start 14-Day Free Trial <ArrowRight size={18} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-slate-500 font-medium">
            Already have an account? <button onClick={() => onNavigate('LOGIN')} className="text-indigo-600 font-bold hover:underline">Log in</button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;
