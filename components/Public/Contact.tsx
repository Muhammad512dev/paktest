
import React, { useState, useEffect } from 'react';
import { Mail, Phone, MapPin, Send, Loader2, CheckCircle2, AlertCircle, Clock, MessageCircle, ArrowRight } from 'lucide-react';
import { sendContactQuery, getSystemConfig } from '../../services/dataService';

const Contact: React.FC = () => {
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', message: '' });
  const [status, setStatus] = useState<'IDLE' | 'LOADING' | 'SUCCESS' | 'ERROR'>('IDLE');
  const [config, setConfig] = useState({ 
    platformEmail: 'support@examforge.com', 
    platformAddress: '123 Tech Park, SF, CA', 
    platformName: 'ExamForge AI',
    platformContact: '+1 (555) 123-4567'
  });

  useEffect(() => {
    const load = async () => {
        try {
            const data = await getSystemConfig();
            setConfig({
                platformEmail: data.platformEmail || 'support@examforge.com',
                platformAddress: data.platformAddress || '123 Tech Park, SF, CA',
                platformName: data.platformName || 'ExamForge AI',
                platformContact: data.platformContact || '+1 (555) 123-4567'
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
    <div className="py-20 max-w-7xl mx-auto px-6 lg:px-8">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-black text-slate-900 mb-4">Get in Touch</h1>
        <p className="text-slate-500 max-w-xl mx-auto">Have questions about our platform? Our team is here to help you get started.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Send us a Message</h3>
          {status === 'SUCCESS' ? (
             <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 mb-4">
                   <CheckCircle2 size={32} />
                </div>
                <h4 className="text-xl font-bold text-slate-900">Message Sent!</h4>
                <p className="text-slate-500 mt-2">Thank you for contacting us. We will get back to you shortly.</p>
                <button onClick={() => setStatus('IDLE')} className="mt-6 text-indigo-600 font-bold hover:underline">Send another message</button>
             </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">First Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="John" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Last Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Doe" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email</label>
                <input type="email" className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="john@school.edu" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message</label>
                <textarea rows={4} className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="How can we help?" value={form.message} onChange={e => setForm({...form, message: e.target.value})} />
              </div>
              
              {status === 'ERROR' && (
                 <div className="flex items-center gap-2 text-rose-600 bg-rose-50 p-3 rounded-lg text-sm font-bold">
                    <AlertCircle size={16} /> Failed to send message. Please try again.
                 </div>
              )}

              <button disabled={status === 'LOADING'} className="w-full py-4 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 disabled:opacity-70">
                {status === 'LOADING' ? <Loader2 size={18} className="animate-spin" /> : <><Send size={18} /> Send Message</>}
              </button>
            </form>
          )}
        </div>

        <div className="space-y-8">
          <div>
            <h3 className="text-xl font-bold text-slate-900 mb-6">Contact Information</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                  <MapPin size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Headquarters</h4>
                  <p className="text-slate-500 text-sm mt-1">{config.platformAddress}</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center text-purple-600 shrink-0">
                  <Phone size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Phone</h4>
                  <p className="text-slate-500 text-sm mt-1">{config.platformContact}</p>
                  <p className="text-xs text-slate-400 mt-1">See availability below</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                  <Mail size={20} />
                </div>
                <div>
                  <h4 className="font-bold text-slate-900">Email</h4>
                  <p className="text-slate-500 text-sm mt-1">{config.platformEmail}</p>
                  <p className="text-slate-500 text-sm">sales@{config.platformEmail.split('@')[1]}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

            <div className="relative z-10">
              <h4 className="font-bold text-lg mb-6 flex items-center gap-2">
                <Clock size={20} className="text-emerald-400" /> Availability Status
              </h4>
              
              <div className="space-y-6">
                <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-emerald-500/20 text-emerald-400 rounded-xl shrink-0">
                      <MessageCircle size={24} />
                    </div>
                    <div>
                      <span className="block text-xs font-bold text-emerald-400 uppercase tracking-widest mb-1">WhatsApp Only</span>
                      <p className="text-white font-bold text-xl tracking-tight mb-1">
                        {config.platformContact}
                      </p>
                      <p className="text-slate-400 text-xs font-medium">Voice calls may not be monitored.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center text-sm border-b border-white/10 pb-3">
                    <span className="text-slate-400 font-medium">Daily Schedule</span>
                    <span className="font-bold text-white">9:00 AM - 6:00 PM PST</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-400 font-medium">Operation Days</span>
                    <span className="font-bold text-emerald-400 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      Every Day
                    </span>
                  </div>
                </div>

                <div className="mt-4 pt-6 border-t border-white/10">
                   <a 
                      href={`https://wa.me/${config.platformContact.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-900/20"
                   >
                      Start Chat <ArrowRight size={14} />
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
