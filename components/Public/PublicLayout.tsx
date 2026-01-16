
import React from 'react';
import { LayoutDashboard, Menu, X, Facebook, Twitter, Linkedin, Instagram } from 'lucide-react';

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
    { id: 'PAST_PAPERS', label: 'Past Papers' },
    { id: 'QUIZ', label: 'Quiz' },
    { id: 'CONTACT', label: 'Contact' },
  ];

  return (
    <div className="min-h-screen flex flex-col bg-white font-sans text-slate-800">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-100 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('HOME')}>
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="w-10 h-10 object-contain" />
              ) : (
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                  <LayoutDashboard size={20} />
                </div>
              )}
              <span className="font-black text-xl tracking-tight text-slate-900">{systemName}</span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center space-x-6 lg:space-x-8">
              {navItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`text-sm font-bold uppercase tracking-wide transition-colors ${
                    currentView === item.id ? 'text-indigo-600' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <div className="hidden md:flex items-center space-x-4">
              <button 
                onClick={() => onNavigate('LOGIN')}
                className="text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors"
              >
                Log In
              </button>
              <button 
                onClick={() => onNavigate('SIGNUP')}
                className="px-6 py-2.5 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
              >
                Get Started
              </button>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600">
                {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white border-t border-slate-100 absolute w-full left-0 shadow-xl">
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
                className="block w-full text-left px-4 py-3 text-sm font-bold text-slate-600"
              >
                Log In
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

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-300 py-12 md:py-16">
        <div className="max-w-7xl mx-auto px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="col-span-1 md:col-span-1">
              <div className="flex items-center gap-2 mb-6">
                {logoUrl ? (
                  <img src={logoUrl} alt="Logo" className="w-8 h-8 object-contain" />
                ) : (
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center text-white">
                    <LayoutDashboard size={16} />
                  </div>
                )}
                <span className="font-bold text-lg text-white">{systemName}</span>
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                Empowering academic institutions with AI-driven assessment tools and curriculum management.
              </p>
              <div className="flex gap-4 mt-6">
                <a href="#" className="text-slate-400 hover:text-white"><Facebook size={18} /></a>
                <a href="#" className="text-slate-400 hover:text-white"><Twitter size={18} /></a>
                <a href="#" className="text-slate-400 hover:text-white"><Linkedin size={18} /></a>
                <a href="#" className="text-slate-400 hover:text-white"><Instagram size={18} /></a>
              </div>
            </div>
            
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Platform</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => onNavigate('HOME')} className="hover:text-indigo-400">Home</button></li>
                <li><button onClick={() => onNavigate('PRICING')} className="hover:text-indigo-400">Pricing</button></li>
                <li><button onClick={() => onNavigate('ABOUT')} className="hover:text-indigo-400">About Us</button></li>
                <li><button onClick={() => onNavigate('BLOG')} className="hover:text-indigo-400">Blog</button></li>
                <li><button onClick={() => onNavigate('NOTES')} className="hover:text-indigo-400">Study Notes</button></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Support</h4>
              <ul className="space-y-3 text-sm">
                <li><button onClick={() => onNavigate('CONTACT')} className="hover:text-indigo-400">Contact Support</button></li>
                <li><a href="#" className="hover:text-indigo-400">Documentation</a></li>
                <li><a href="#" className="hover:text-indigo-400">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-400">Terms of Service</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-6">Stay Updated</h4>
              <p className="text-xs text-slate-400 mb-4">Subscribe to our newsletter for the latest AI features.</p>
              <div className="flex gap-2">
                <input type="email" placeholder="Email address" className="bg-slate-800 border-none rounded-lg px-4 py-2 text-sm text-white w-full focus:ring-2 focus:ring-indigo-500" />
                <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700">Go</button>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-xs text-slate-500 font-medium">
            &copy; {new Date().getFullYear()} {systemName}. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PublicLayout;
