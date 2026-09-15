import React from 'react';
import { Shield, Lock, Eye, FileText, CheckCircle, Mail, Globe, Server } from 'lucide-react';

interface PolicyProps {
  appName: string;
}

const PrivacyPolicy: React.FC<PolicyProps> = ({ appName }) => {
  return (
    <div className="py-16 md:py-24 max-w-5xl mx-auto px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-4">
          <Shield size={14} /> Legal & Compliance
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Privacy Policy
        </h1>
        <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto">
          Last updated: {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 md:p-12 space-y-10 text-slate-700 text-sm md:text-base leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-black">1</span>
            Introduction & Scope
          </h2>
          <p>
            Welcome to <strong>{appName}</strong>. We value your trust and are committed to protecting your privacy and personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website, utilize our exam generation tools, study resources, assessment portal, or interact with our services.
          </p>
          <p>
            Please read this policy carefully. If you disagree with any terms, please discontinue use of our platform immediately.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-black">2</span>
            Information We Collect
          </h2>
          <p>We may collect information about you in a variety of ways:</p>
          <ul className="space-y-3 list-none pl-2">
            <li className="flex items-start gap-2.5">
              <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Personal Identification:</strong> Name, institutional email address, school affiliation, contact phone number, and account credentials when registering as an administrator, teacher, or student.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Academic & Test Data:</strong> Curriculum configurations, saved exam papers, question selections, student test submissions, grading records, and performance reports.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle size={18} className="text-emerald-500 shrink-0 mt-0.5" />
              <span><strong>Log & Device Data:</strong> IP address, browser type, operating system, referring URLs, device identifiers, and timestamps of platform visits.</span>
            </li>
          </ul>
        </section>

        {/* Section 3 - Google AdSense & Third-Party Cookies */}
        <section className="space-y-4 bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-sm font-black">3</span>
            Google AdSense & Third-Party Advertising
          </h2>
          <p>
            We may display advertisements served by third-party advertising partners, including <strong>Google AdSense</strong>.
          </p>
          <ul className="space-y-3 list-none pl-2 text-slate-600 text-sm">
            <li className="flex items-start gap-2.5">
              <Eye size={18} className="text-indigo-600 shrink-0 mt-0.5" />
              <span>Google and third-party vendors use cookies (such as the DoubleClick DART cookie) to serve ads based on a user's prior visits to our website or other websites across the internet.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Lock size={18} className="text-indigo-600 shrink-0 mt-0.5" />
              <span>Users may opt out of personalized advertising by visiting <a href="https://www.google.com/settings/ads" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold underline">Google Ads Settings</a> or <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-indigo-600 font-bold underline">www.aboutads.info</a>.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <Globe size={18} className="text-indigo-600 shrink-0 mt-0.5" />
              <span>Third-party ad servers or ad networks use technology in their advertisements and links that appear on {appName}, which are sent directly to your browser. They automatically receive your IP address when this occurs.</span>
            </li>
          </ul>
        </section>

        {/* Section 4 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-black">4</span>
            How We Use Your Information
          </h2>
          <p>We use collected data for the following purposes:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            {[
              'To generate, render, and archive bilingual exam papers.',
              'To manage student grading, quizzes, and automated analytics.',
              'To secure institution accounts and prevent unauthorized access.',
              'To improve platform performance, math formatting, and UI.',
              'To process institutional subscriptions and billing invoices.',
              'To serve relevant educational resources and announcements.'
            ].map((text, idx) => (
              <div key={idx} className="flex items-start gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs md:text-sm font-medium text-slate-700">
                <CheckCircle size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Section 5 - Data Protection & Security */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-black">5</span>
            Data Storage & Security
          </h2>
          <p>
            We implement industry-standard encryption (SSL/TLS), hashed password storage (bcrypt), and role-based access control to protect your personal and exam data from unauthorized access, modification, or disclosure.
          </p>
        </section>

        {/* Section 6 - Children's Privacy */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-black">6</span>
            Children's Privacy Protection (COPPA / GDPR)
          </h2>
          <p>
            {appName} provides assessment tools for schools and students. We do not knowingly collect personal information directly from children under 13 without verified school or parental authorization. School accounts are managed directly by authorized educational administrators.
          </p>
        </section>

        {/* Section 7 - Contact Us */}
        <section className="space-y-4 pt-6 border-t border-slate-200">
          <h2 className="text-xl md:text-2xl font-black text-slate-900">Questions & Privacy Requests</h2>
          <p>
            If you have questions regarding this Privacy Policy, wish to request data correction or deletion, please reach out to us:
          </p>
          <div className="flex flex-wrap items-center gap-4 text-sm font-semibold text-slate-800">
            <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl">
              <Mail size={16} className="text-indigo-600" />
              <span>privacy@{appName.toLowerCase().replace(/\s+/g, '')}.com</span>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
};

export default PrivacyPolicy;
