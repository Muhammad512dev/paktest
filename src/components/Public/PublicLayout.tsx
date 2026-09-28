
import React, { useState, useEffect } from 'react';
import { LayoutDashboard, Menu, X, Facebook, Twitter, Linkedin, Instagram, GraduationCap, ShieldCheck, Sparkles, Award } from 'lucide-react';
import CookieConsent from './CookieConsent';
import { getSystemConfig } from '../../services/dataService';

interface PublicLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  systemName: string;
  logoUrl?: string;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children, currentView, onNavigate, systemName, logoUrl }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [whatsappContact, setWhatsappContact] = useState<string>('923000000000');

  useEffect(() => {
    getSystemConfig().then((cfg) => {
      if (cfg?.platformContact) {
        setWhatsappContact(cfg.platformContact.replace(/[^0-9]/g, ''));
      }
    }).catch(() => {});
  }, []);

  const navItems = [
    { id: 'HOME', label: 'Home' },
    { id: 'PRICING', label: 'Pricing' },
    { id: 'ABOUT', label: 'About' },
    { id: 'BLOG', label: 'Guides & Blog' },
    { id: 'NOTES', label: 'Study Notes' },
    { id: 'LESSON_PLANS', label: 'Lesson Plans' },
    { id: 'BOOKS', label: 'Textbooks' },
    { id: 'PAST_PAPERS', label: 'Past Papers' },
    { id: 'QUIZ', label: 'Online Quiz' },
    { id: 'CONTACT', label: 'Contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800 selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Academic Ribbon */}
      <div className="bg-slate-900 text-slate-300 text-[11px] font-semibold py-1.5 px-4 border-b border-slate-800">
        <div className="max-w-[1600px] mx-auto flex flex-wrap justify-between items-center gap-2">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded border border-indigo-500/30 text-[10px] font-black uppercase tracking-wider">
              <Award size={11} className="text-indigo-400" /> Academic Exam System
            </span>
            <span className="text-slate-300">100% Curriculum Compliant with Punjab (PCTB), Federal (FBISE), Sindh & KPK Boards</span>
          </div>
          <div className="hidden md:flex items-center gap-4 text-slate-400 text-[11px]">
            <span className="flex items-center gap-1 text-emerald-400">
              <ShieldCheck size={12} /> Verified Question Bank
            </span>
            <span>🇵🇰 Urdu Nastaleeq + English Bilingual</span>
          </div>
        </div>
      </div>

      {/* Main Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/80 shadow-sm w-full">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6">
          <div className="flex justify-between items-center h-16 sm:h-20 gap-2 sm:gap-3">
            {/* Logo */}
            <div className="flex items-center cursor-pointer shrink-0 py-1 sm:py-2" onClick={() => onNavigate('HOME')}>
              {logoUrl ? (
                <img 
                  src={logoUrl} 
                  alt={systemName || "PakParcha AI"} 
                  onError={(e) => {
                    const target = e.currentTarget;
                    if (target.src.endsWith('.webp')) {
                      target.src = '/logo.png';
                    } else if (target.src.endsWith('.png')) {
                      target.src = '/favicon.svg';
                    }
                  }}
                  className="h-10 sm:h-12 md:h-14 w-auto max-w-[170px] sm:max-w-[260px] md:max-w-[320px] object-contain drop-shadow-sm transition-transform hover:scale-[1.02]" 
                />
              ) : (
                <div className="flex items-center gap-2.5 sm:gap-3">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 bg-gradient-to-br from-indigo-600 to-indigo-700 rounded-xl flex items-center justify-center text-white shadow-md shadow-indigo-200 font-black">
                    <GraduationCap size={22} className="text-white" />
                  </div>
                  <div>
                    <span className="font-black text-base sm:text-xl tracking-tight text-slate-900 block leading-tight">{systemName}</span>
                    <span className="text-[10px] text-indigo-600 uppercase tracking-widest font-black block">Exam System</span>
                  </div>
                </div>
              )}
            </div>

            {/* Desktop Nav Items - Compact Gap Between Tab Names */}
            <div className="hidden xl:flex flex-1 justify-center items-center gap-0.5 2xl:gap-1 px-1">
              {navItems.map((item) => {
                const isActive = currentView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`text-[11px] 2xl:text-xs font-bold uppercase tracking-wider transition-all whitespace-nowrap py-2 px-2.5 rounded-xl ${
                      isActive 
                        ? 'text-indigo-600 bg-indigo-50 border border-indigo-200/70 shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/70'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </div>

            {/* Auth Action Buttons */}
            <div className="hidden xl:flex items-center gap-2 shrink-0">
              <button 
                onClick={() => onNavigate('LOGIN')}
                className="whitespace-nowrap rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 px-3 py-2 text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                Staff Portal
              </button>
              <button 
                onClick={() => onNavigate('STUDENT_LOGIN')}
                className="whitespace-nowrap rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 px-3 py-2 text-xs font-bold transition-all shadow-sm active:scale-95"
              >
                Student Portal
              </button>
              <button 
                onClick={() => onNavigate('SIGNUP')}
                className="whitespace-nowrap rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-black px-4 py-2 text-xs uppercase tracking-wider transition-all shadow-lg shadow-indigo-200 active:scale-95"
              >
                Start Free Trial
              </button>
            </div>

            {/* Mobile / Tablet Menu Button */}
            <div className="xl:hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
                className="text-slate-700 p-2 rounded-xl bg-slate-100 border border-slate-200 hover:bg-slate-200" 
                aria-label="Toggle Mobile Menu"
              >
                {isMobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Menu */}
        {isMobileMenuOpen && (
          <div className="xl:hidden bg-white border-t border-slate-200 absolute w-full left-0 shadow-2xl">
            <div className="px-4 pt-3 pb-6 space-y-1">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); setIsMobileMenuOpen(false); }}
                  className={`block w-full text-left px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider ${
                    currentView === item.id 
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' 
                      : 'text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="h-px bg-slate-200 my-3"></div>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => { onNavigate('LOGIN'); setIsMobileMenuOpen(false); }}
                  className="rounded-xl bg-slate-100 px-3 py-2.5 text-center text-xs font-bold text-slate-800 border border-slate-200"
                >
                  Staff Portal
                </button>
                <button 
                  onClick={() => { onNavigate('STUDENT_LOGIN'); setIsMobileMenuOpen(false); }}
                  className="rounded-xl bg-indigo-50 px-3 py-2.5 text-center text-xs font-bold text-indigo-700 border border-indigo-200"
                >
                  Student Portal
                </button>
              </div>
              <button 
                onClick={() => { onNavigate('SIGNUP'); setIsMobileMenuOpen(false); }}
                className="w-full mt-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 text-white font-black px-4 py-3 text-center text-xs uppercase tracking-wider shadow-lg shadow-indigo-200"
              >
                Create School Trial Account
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Page Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer in Clean Slate & Indigo */}
      <footer className="bg-slate-900 text-slate-300 py-12 md:py-16 border-t border-slate-800">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            
            {/* Column 1: Brand Info */}
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={systemName || "PakParcha AI"} 
                    className="h-10 md:h-12 w-auto max-w-[220px] object-contain brightness-110" 
                  />
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 bg-amber-500 rounded-lg flex items-center justify-center text-slate-950 font-black">
                      <GraduationCap size={18} />
                    </div>
                    <span className="font-black text-lg text-white">{systemName}</span>
                  </div>
                )}
              </div>
              <p className="text-xs leading-relaxed text-slate-400 mb-5">
                Pakistan’s gold standard in automated examination authoring, institutional test generation, and syllabus assessment. Aligned with PCTB (all 9 Punjab Boards), FBISE Islamabad, Sindh Board, and KPK Board specifications.
              </p>
              <div className="flex gap-3">
                <a href="#" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center text-slate-400 transition-colors" aria-label="Facebook"><Facebook size={15} /></a>
                <a href="#" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center text-slate-400 transition-colors" aria-label="Twitter"><Twitter size={15} /></a>
                <a href="#" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center text-slate-400 transition-colors" aria-label="LinkedIn"><Linkedin size={15} /></a>
                <a href="#" className="w-8 h-8 rounded-lg bg-slate-800 hover:bg-amber-500 hover:text-slate-950 flex items-center justify-center text-slate-400 transition-colors" aria-label="Instagram"><Instagram size={15} /></a>
              </div>
            </div>
            
            {/* Column 2: Academic Resources */}
            <div>
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Academic Resources
              </h4>
              <ul className="space-y-2.5 text-xs font-medium text-slate-300">
                <li><button onClick={() => onNavigate('HOME')} className="hover:text-amber-300 transition-colors">Platform Overview</button></li>
                <li><button onClick={() => onNavigate('PRICING')} className="hover:text-amber-300 transition-colors">School & Academy Plans</button></li>
                <li><button onClick={() => onNavigate('PAST_PAPERS')} className="hover:text-amber-300 transition-colors">Board Past Papers Archive</button></li>
                <li><button onClick={() => onNavigate('NOTES')} className="hover:text-amber-300 transition-colors">Curriculum Revision Notes</button></li>
                <li><button onClick={() => onNavigate('BOOKS')} className="hover:text-amber-300 transition-colors">Textbook PDF Library</button></li>
                <li><button onClick={() => onNavigate('BLOG')} className="hover:text-amber-300 transition-colors">Exam Guides & Pairing Schemes</button></li>
              </ul>
            </div>

            {/* Column 3: Trust & Institutional Policy */}
            <div>
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Institutional Policy
              </h4>
              <ul className="space-y-2.5 text-xs font-medium text-slate-300">
                <li><button onClick={() => onNavigate('ABOUT')} className="hover:text-amber-300 transition-colors">Academic Mission & Founder Story</button></li>
                <li><button onClick={() => onNavigate('CONTACT')} className="hover:text-amber-300 transition-colors">Official Contact & Support</button></li>
                <li><button onClick={() => onNavigate('PRIVACY')} className="hover:text-amber-300 transition-colors">Privacy & Data Protection Policy</button></li>
                <li><button onClick={() => onNavigate('TERMS')} className="hover:text-amber-300 transition-colors">Institutional Terms of Service</button></li>
                <li><button onClick={() => onNavigate('DISCLAIMER')} className="hover:text-amber-300 transition-colors">Fair Use & DMCA Compliance</button></li>
                <li><button onClick={() => onNavigate('REFUND')} className="hover:text-amber-300 transition-colors">7-Day Guarantee & Refund Policy</button></li>
              </ul>
            </div>

            {/* Column 4: Board Affiliation & Urdu Nastaleeq Support */}
            <div>
              <h4 className="text-xs font-black text-amber-400 uppercase tracking-widest mb-4 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span> Pakistani Board Coverage
              </h4>
              <p className="text-xs text-slate-400 mb-3.5 leading-relaxed">
                Dedicated question banks covering Matric (9th & 10th) and Intermediate (FSc Pre-Medical, Pre-Engineering, ICS, I.Com) with automatic chapter-wise schemes.
              </p>
              <div className="bg-[#0B192C] border border-slate-800 rounded-xl p-3 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Sparkles size={14} className="text-amber-400" /> 100% Urdu Nastaleeq Supported
                </div>
                <div className="text-[11px] text-slate-400">
                  Equations rendered via native LaTeX & InPage formatting.
                </div>
              </div>
            </div>

          </div>

          <div className="border-t border-slate-800/80 mt-10 pt-5 flex flex-col sm:flex-row justify-between items-center gap-3 text-center sm:text-left text-xs text-slate-500 font-medium">
            <div>
              &copy; {new Date().getFullYear()} {systemName} (Pakistan). All rights reserved.
            </div>
            <div className="flex items-center gap-3 text-slate-400">
              <span>Punjab Curriculum (PCTB)</span>
              <span>&bull;</span>
              <span>Federal Board (FBISE)</span>
              <span>&bull;</span>
              <span>Sindh & KPK</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Quick Support Button */}
      <a
        href={`https://wa.me/${whatsappContact}?text=${encodeURIComponent('Assalam-o-Alaikum! I want to learn more about the PakParcha Exam Generator & School Plans.')}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Support on WhatsApp"
        className="fixed bottom-6 right-6 z-40 bg-[#25D366] hover:bg-[#20bd5a] text-white p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-2 group cursor-pointer border-2 border-white/20"
      >
        <svg className="w-6 h-6 fill-current" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.886-4.434 9.889-9.885.002-5.462-4.415-9.89-9.881-9.892-5.452 0-9.887 4.434-9.889 9.884-.001 2.225.651 3.891 1.746 5.634l-.999 3.648 3.742-.981zm11.387-5.464c-.074-.124-.272-.198-.57-.347-.297-.149-1.758-.868-2.031-.967-.272-.099-.47-.149-.669.149-.198.297-.768.967-.941 1.165-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.521.151-.172.2-.296.3-.495.099-.198.05-.372-.025-.521-.075-.148-.669-1.611-.916-2.206-.242-.579-.487-.501-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.263.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.695.248-1.29.173-1.414z"/>
        </svg>
        <span className="hidden group-hover:inline-block font-bold text-xs pr-1">Need Help? WhatsApp Us</span>
      </a>

      {/* GDPR & Google AdSense Cookie Consent Banner */}
      <CookieConsent onNavigate={onNavigate} />
    </div>
  );
};

export default PublicLayout;

