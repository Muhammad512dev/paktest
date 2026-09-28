
import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle2, AlertCircle, Clock, MessageCircle, ArrowRight } from 'lucide-react';
import { sendContactQuery, getSystemConfig } from '../../services/dataService';

const Contact: React.FC = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', message: '' });
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [config, setConfig] = useState({ 
    platformEmail: 'support@pakparchaai.com', 
    platformAddress: 'Punjab, Pakistan (Serving Lahore, Multan, Rawalpindi, Faisalabad & All Boards)', 
    platformName: 'PakParcha AI',
    platformContact: '+92 300 0000000'
  });

  useEffect(() => {
    const load = async () => {
        try {
            const data = await getSystemConfig();
            setConfig({
                platformEmail: data.platformEmail || 'support@pakparchaai.com',
                platformAddress: data.platformAddress || 'Punjab, Pakistan (Serving Lahore, Multan, Rawalpindi, Faisalabad & All Boards)',
                platformName: data.platformName || 'PakParcha AI',
                platformContact: data.platformContact || '+92 300 0000000'
            });
        } catch (e) {}
    };
    load();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName || !form.email || !form.message) return;
    
    setStatus('LOADING');
    try {
      await sendContactQuery(form);
      setStatus('SUCCESS');
      setForm({ firstName: '', lastName: '', email: '', message: '' });
    } catch (e) {
      setStatus('ERROR');
    }
  };

  return (
    <div className="py-16 max-w-7xl mx-auto px-6 lg:px-8">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0B192C] border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
          <span>🤝</span> Institutional Inquiries & Teacher Support
        </div>
        <h1 className="text-4xl sm:text-5xl font-black text-slate-900 dark:text-white mb-4 tracking-tight">
          Get in Touch with <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 bg-clip-text text-transparent">Our Academic Desk</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-xl mx-auto text-sm sm:text-base font-medium">
          Have questions regarding institution onboarding, board pairing scheme alignment, or bulk teacher licenses? We are here to assist.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-white dark:bg-[#0B192C] p-8 sm:p-10 rounded-[2.5rem] border border-slate-200 dark:border-amber-500/20 shadow-xl">
          <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 font-serif">Send us a Message</h3>
          {status === 'SUCCESS' ? (
             <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 rounded-full flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-4 border border-emerald-500/30">
                   <CheckCircle2 size={32} />
                </div>
                <h4 className="text-xl font-bold text-slate-900 dark:text-white">Inquiry Received!</h4>
                <p className="text-slate-500 dark:text-slate-400 mt-2 text-sm">Thank you for contacting our academic support team. We will get back to you shortly.</p>
                <button onClick={() => setStatus('IDLE')} className="mt-6 text-amber-500 font-bold hover:underline text-sm">Send another message</button>
             </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">First Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#071326] border border-slate-200 dark:border-amber-500/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none text-sm" placeholder="Muhammad" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Last Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#071326] border border-slate-200 dark:border-amber-500/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none text-sm" placeholder="Raza" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Email</label>
                <input type="email" className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#071326] border border-slate-200 dark:border-amber-500/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none text-sm" placeholder="principal@school.edu.pk" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Message</label>
                <textarea rows={4} className="w-full px-4 py-3 rounded-xl bg-slate-50 dark:bg-[#071326] border border-slate-200 dark:border-amber-500/20 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 outline-none resize-none text-sm" placeholder="Tell us how we can help your institution..." value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
              </div>
              
              {status === 'ERROR' && (
                 <div className="flex items-center gap-2 text-rose-600 bg-rose-50 dark:bg-rose-950/40 p-3 rounded-lg text-sm font-bold border border-rose-200 dark:border-rose-900/40">
                    <AlertCircle size={16} /> Failed to send message. Please try again.
                 </div>
              )}

              <button disabled={status === 'LOADING'} className="w-full py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-70">
                {status === 'LOADING' ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> Submit Inquiry</>}
              </button>
            </form>
          )}
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white mb-6 font-serif">Contact Information</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#0B192C] rounded-2xl flex items-center justify-center text-amber-400 shrink-0 border border-amber-500/30 shadow-md">
                  <MapPin size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">Headquarters</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{config.platformAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#0B192C] rounded-2xl flex items-center justify-center text-amber-400 shrink-0 border border-amber-500/30 shadow-md">
                  <Phone size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">Direct Helpline</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{config.platformContact}</p>
                  <p className="text-xs text-amber-500 font-semibold mt-1">Official WhatsApp Desk</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#0B192C] rounded-2xl flex items-center justify-center text-amber-400 shrink-0 border border-amber-500/30 shadow-md">
                  <Mail size={22} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 dark:text-white text-base">Electronic Mail</h4>
                  <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">{config.platformEmail}</p>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">admissions@{config.platformEmail.split('@')[1]}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[#071326] via-[#0B192C] to-[#071326] rounded-[2.5rem] p-8 text-white relative overflow-hidden border border-amber-500/30 shadow-2xl">
            <div className="relative z-10">
              <h4 className="font-bold text-lg mb-6 flex items-center gap-2 font-serif text-amber-300">
                <Clock size={20} className="text-amber-400" /> Academic Helpline Status
              </h4>
              
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-[#071326]/80 border border-amber-500/20 backdrop-blur-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0 border border-emerald-500/30">
                      <MessageCircle size={24} />
                    </div>
                    <div>
                      <span className="block text-xs font-black text-emerald-400 uppercase tracking-widest mb-1">Live WhatsApp Support</span>
                      <p className="text-white font-black text-xl tracking-tight mb-1 font-mono">
                        {config.platformContact}
                      </p>
                      <p className="text-slate-400 text-xs font-medium">Fastest response time for teachers and principals.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                    <span className="text-slate-300 font-medium">Daily Support Desk</span>
                    <span className="font-bold text-amber-300">9:00 AM - 9:00 PM PST</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-300 font-medium">Operation Days</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Monday through Sunday
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-6 border-t border-white/10">
                   <a 
                      href={`https://wa.me/${config.platformContact.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl text-xs sm:text-sm font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/30"
                   >
                      Chat Directly on WhatsApp <ArrowRight size={14} />
                   </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Contact;
