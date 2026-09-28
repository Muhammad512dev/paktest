
import React from 'react';
import { LayoutDashboard, Menu, X, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';
import CookieConsent from './CookieConsent';

interface PublicLayoutProps {
  children: React.ReactNode;
  currentView: string;
  onNavigate: (view: string) => void;
  systemName: string;
  logoUrl?: string;
}

const PublicLayout: React.FC<PublicLayoutProps> = ({ children, currentView, onNavigate, systemName, logoUrl }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  const navItems = [
    { id: 'HOME', label: 'Home' },
    { id: 'PRICING', label: 'Pricing' },
    { id: 'ABOUT', label: 'About' },
    { id: 'BLOG', label: 'Blog' },
    { id: 'NOTES', label: 'Notes' },
    { id: 'LESSON_PLANS', label: 'Lesson Plans' },
    { id: 'BOOKS', label: 'Books' },
    { id: 'PAST_PAPERS', label: 'Past Papers' },
    { id: 'QUIZ', label: 'Quiz' },
    { id: 'CONTACT', label: 'Contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-800">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 shadow-sm w-full">
        <div className="max-w-[1600px] mx-auto px-3 sm:px-6">
          <div className="flex justify-between items-center h-16 sm:h-20 md:h-24 gap-2 sm:gap-4">
            {/* Logo: Prominent, Large Brand Identity with built-in typography */}
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
                  className="h-10 sm:h-14 md:h-18 lg:h-20 w-auto max-w-[170px] xs:max-w-[210px] sm:max-w-[300px] md:max-w-[380px] object-contain drop-shadow-md transition-transform hover:scale-[1.03]" 
                />
              ) : (
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-11 sm:h-11 bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-emerald-200">
                    <LayoutDashboard size={20} />
                  </div>
                  <span className="font-black text-base sm:text-xl tracking-tight text-slate-900 whitespace-nowrap">{systemName}</span>
                </div>
              )}
            </div>

            {/* Desktop Nav */}
            <div className="hidden xl:flex flex-1 justify-center items-center gap-1 2xl:gap-2 px-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`text-[11px] 2xl:text-xs font-bold uppercase tracking-wider transition-colors whitespace-nowrap py-1.5 px-2.5 rounded-lg hover:bg-slate-50 ${
                    currentView === item.id ? 'text-indigo-600 bg-indigo-50/70 font-black' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* Auth Action Buttons */}
            <div className="hidden xl:flex items-center gap-2 shrink-0">
              <button 
                onClick={() => onNavigate('LOGIN')}
                className="whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-slate-700 active:scale-95"
              >
                Staff Login
              </button>
              <button 
                onClick={() => onNavigate('STUDENT_LOGIN')}
                className="whitespace-nowrap rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-indigo-700 active:scale-95"
              >
                Student Login
              </button>
              <button 
                onClick={() => onNavigate('SIGNUP')}
                className="whitespace-nowrap rounded-lg bg-violet-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-violet-700 active:scale-95"
              >
                Get Started
              </button>
            </div>

            {/* Mobile / Tablet Menu Button */}
            <div className="xl:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 p-2 rounded-lg hover:bg-slate-100" aria-label="Toggle Mobile Menu">
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile / Tablet Menu */}
        {isMobileMenuOpen && (
          <div className="xl:hidden bg-white border-t border-slate-100 absolute w-full left-0 shadow-xl">
            <div className="px-4 pt-2 pb-6 space-y-2">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => { onNavigate(item.id); setIsMobileMenuOpen(false); }}
                  className={`block w-full text-left px-4 py-3 rounded-lg text-sm font-bold ${
                    currentView === item.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-600'
                  }`}
                >
                  {item.label}
                </button>
              ))}
              <div className="h-px bg-slate-100 my-4"></div>
              <button 
                onClick={() => { onNavigate('LOGIN'); setIsMobileMenuOpen(false); }}
                className="block w-full rounded-xl bg-slate-800 px-4 py-3 text-left text-sm font-bold text-white"
              >
                Staff Login
              </button>
              <button 
                onClick={() => { onNavigate('STUDENT_LOGIN'); setIsMobileMenuOpen(false); }}
                className="block w-full text-left px-4 py-3 text-sm font-bold text-indigo-600"
              >
                Student Login
              </button>
              <button 
                onClick={() => { onNavigate('SIGNUP'); setIsMobileMenuOpen(false); }}
                className="block w-full text-left px-4 py-3 text-sm font-bold text-indigo-600"
              >
                Sign Up
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Compact Footer */}
      <footer className="bg-slate-900 text-slate-300 py-6 md:py-8">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                {logoUrl ? (
                  <img 
                    src={logoUrl} 
                    alt={systemName || "PakParcha AI"} 
                    className="h-10 md:h-12 w-auto max-w-[220px] object-contain brightness-110" 
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white">
                      <LayoutDashboard size={16} />
                    </div>
                    <span className="font-bold text-lg text-white">{systemName}</span>
                  </div>
                )}
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                Pakistan’s premier exam paper generation, grading, and curriculum platform for schools, colleges, and academies. 100% aligned with PCTB, FBISE, and provincial board patterns.
              </p>
              <div className="flex gap-4 mt-6">
                <a href="#" className="text-slate-400 hover:text-white" aria-label="Facebook Profile"><Facebook size={18} /></a>
                <a href="#" className="text-slate-400 hover:text-white" aria-label="Twitter Profile"><Twitter size={18} /></a>
                <a href="#" className="text-slate-400 hover:text-white" aria-label="LinkedIn Profile"><Linkedin size={18} /></a>
                <a href="#" className="text-slate-400 hover:text-white" aria-label="Instagram Profile"><Instagram size={18} /></a>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Platform & Resources</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => onNavigate('HOME')} className="hover:text-indigo-400">Home</button></li>
                <li><button onClick={() => onNavigate('PRICING')} className="hover:text-indigo-400">Academy Pricing</button></li>
                <li><button onClick={() => onNavigate('PAST_PAPERS')} className="hover:text-indigo-400">Past Papers</button></li>
                <li><button onClick={() => onNavigate('NOTES')} className="hover:text-indigo-400">Study Notes</button></li>
                <li><button onClick={() => onNavigate('LESSON_PLANS')} className="hover:text-indigo-400">Lesson Plans</button></li>
                <li><button onClick={() => onNavigate('BLOG')} className="hover:text-indigo-400">Blog & Board Guides</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Support & Legal</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => onNavigate('CONTACT')} className="hover:text-indigo-400">Contact Support</button></li>
                <li><button onClick={() => onNavigate('ABOUT')} className="hover:text-indigo-400">About Us</button></li>
                <li><button onClick={() => onNavigate('PRIVACY')} className="hover:text-indigo-400">Privacy Policy</button></li>
                <li><button onClick={() => onNavigate('TERMS')} className="hover:text-indigo-400">Terms of Service</button></li>
                <li><button onClick={() => onNavigate('DISCLAIMER')} className="hover:text-indigo-400">Disclaimer & DMCA</button></li>
                <li><button onClick={() => onNavigate('REFUND')} className="hover:text-indigo-400">Refund Policy</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Stay Updated</h4>
              <p className="text-xs text-slate-400 mb-4">Subscribe for latest pairing schemes, guess papers, and feature updates.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Email address" className="bg-slate-800 border-none rounded-lg px-4 py-2 text-sm text-white w-full focus:ring-2 focus:ring-indigo-500" />
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 cursor-pointer">Go</button>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-6 pt-4 text-center text-xs text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} {systemName} (Pakistan). All rights reserved. &bull; Punjab & Federal Board Aligned
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Quick Support Button */}
      <a
        href="https://wa.me/923000000000?text=Hi%20PakParcha%20Team%2C%20I%20want%20to%20learn%20more%20about%20the%20Exam%20Generator"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Chat with Support on WhatsApp"
        className="fixed bottom-6 right-6 z-40 bg-[#25D366] text-white p-3.5 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all flex items-center gap-2 group"
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
