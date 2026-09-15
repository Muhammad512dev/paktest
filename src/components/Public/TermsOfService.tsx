import React from 'react';
import { Scale, CheckSquare, AlertTriangle, HelpCircle, FileCheck, ShieldAlert, Mail } from 'lucide-react';

interface TermsProps {
  appName: string;
}

const TermsOfService: React.FC<TermsProps> = ({ appName }) => {
  return (
    <div className="py-16 md:py-24 max-w-5xl mx-auto px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4">
          <Scale size={14} /> User Agreement
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Terms of Service
        </h1>
        <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto">
          Please review these terms carefully before accessing or using the {appName} platform.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 md:p-12 space-y-10 text-slate-700 text-sm md:text-base leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-black">1</span>
            Acceptance of Terms
          </h2>
          <p>
            By accessing or registering on <strong>{appName}</strong>, you agree to be legally bound by these Terms of Service, all applicable laws and regulations, and agree that you are responsible for compliance with any applicable local laws.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-black">2</span>
            User Accounts & Institutional Responsibility
          </h2>
          <ul className="space-y-2.5 list-disc pl-5">
            <li><strong>Account Security:</strong> You are responsible for maintaining the confidentiality of your username, password, and institutional access codes.</li>
            <li><strong>Authorized Usage:</strong> School accounts must be operated by authorized principals, headmasters, or designated administrative staff.</li>
            <li><strong>Accuracy of Information:</strong> You agree to provide true, accurate, and current information during registration and paper generation.</li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-black">3</span>
            Intellectual Property & Content License
          </h2>
          <p>
            The software, layout design, branding, algorithm engines, math formatting logic, and original platform assets are the exclusive property of {appName}.
          </p>
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs md:text-sm text-slate-600">
            <strong>Permitted Use:</strong> Subscribers and educators are granted a non-exclusive, non-transferable license to generate, customize, print, and distribute exam papers for educational assessment and testing within their registered school or academy.
          </div>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-black">4</span>
            Prohibited Activities
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              'Reselling, sublicensing, or redistributing the software source code.',
              'Attempting to reverse engineer or scrape question databases.',
              'Using the platform to distribute malicious, offensive, or unlawful content.',
              'Sharing single-school accounts across unauthorized third-party institutions.'
            ].map((rule, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-3.5 bg-rose-50/60 rounded-xl border border-rose-100 text-xs md:text-sm text-rose-900 font-medium">
                <AlertTriangle size={16} className="text-rose-600 shrink-0 mt-0.5" />
                <span>{rule}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-black">5</span>
            Subscription Plans & Payments
          </h2>
          <p>
            Access to premium question banks, unlimited PDF generation, and multi-user school management is subject to active subscription tiers. Fees are billed according to the selected billing period (Monthly/Annual).
          </p>
        </section>

        {/* Section 6 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-black">6</span>
            Disclaimer of Warranties
          </h2>
          <p className="text-slate-600 text-sm">
            {appName} is provided on an "AS IS" and "AS AVAILABLE" basis. While we strive for 100% curriculum accuracy and maximum uptime, we do not warrant that question contents will be free from typographical errors or that service will be uninterrupted.
          </p>
        </section>

        {/* Section 7 */}
        <section className="space-y-4 pt-6 border-t border-slate-200">
          <h2 className="text-xl md:text-2xl font-black text-slate-900">Contact for Legal Inquiries</h2>
          <p>For questions or formal inquiries regarding these Terms of Service, please contact:</p>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-sm font-semibold text-slate-800 w-fit">
            <Mail size={16} className="text-indigo-600" />
            <span>legal@{appName.toLowerCase().replace(/\s+/g, '')}.com</span>
          </div>
        </section>

      </div>
    </div>
  );
};

export default TermsOfService;
