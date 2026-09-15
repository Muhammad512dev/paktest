import React, { useState, useEffect } from 'react';
import { Cookie, X, Check, Shield } from 'lucide-react';

interface CookieConsentProps {
  onNavigate: (view: string) => void;
}

const CookieConsent: React.FC<CookieConsentProps> = ({ onNavigate }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem('cookie_consent');
    if (!consent) {
      // Small delay so it animates smoothly into view
      const timer = setTimeout(() => setIsVisible(true), 1200);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem('cookie_consent', 'accepted');
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem('cookie_consent', 'declined');
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-6 md:max-w-md z-[100] animate-in fade-in slide-in-from-bottom-5 duration-300">
      <div className="bg-slate-900/95 backdrop-blur-md text-white p-5 rounded-2xl border border-slate-700 shadow-2xl space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5 font-bold text-sm text-white">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 flex items-center justify-center shrink-0">
              <Cookie size={18} />
            </div>
            <span>Cookie & Ad Consent</span>
          </div>
          <button 
            onClick={() => setIsVisible(false)} 
            className="text-slate-400 hover:text-white p-1 rounded-lg transition-colors"
            aria-label="Dismiss banner"
          >
            <X size={16} />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          We use cookies and third-party advertising partners (such as Google AdSense) to analyze traffic, personalize advertisements, and enhance your learning experience. Read our{' '}
          <button 
            onClick={() => onNavigate('PRIVACY')} 
            className="text-indigo-400 font-bold underline hover:text-indigo-300"
          >
            Privacy Policy
          </button>.
        </p>

        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={handleAccept}
            className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5"
          >
            <Check size={14} /> Accept All
          </button>
          <button
            onClick={handleDecline}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold transition-all border border-slate-700"
          >
            Essential Only
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
