import React from 'react';
import { AlertCircle, BookOpen, Copyright, ShieldAlert, Mail, FileText } from 'lucide-react';

interface DisclaimerProps {
  appName: string;
}

const Disclaimer: React.FC<DisclaimerProps> = ({ appName }) => {
  return (
    <div className="py-16 md:py-24 max-w-5xl mx-auto px-6 lg:px-8">
      {/* Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold uppercase tracking-wider mb-4">
          <AlertCircle size={14} /> Legal Notice
        </div>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
          Disclaimer & DMCA Policy
        </h1>
        <p className="text-slate-500 text-sm md:text-base max-w-2xl mx-auto">
          Educational fair use declaration, academic source attribution, and copyright compliance.
        </p>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-8 md:p-12 space-y-10 text-slate-700 text-sm md:text-base leading-relaxed">
        
        {/* Section 1 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-sm font-black">1</span>
            Educational Purpose & Fair Use
          </h2>
          <p>
            <strong>{appName}</strong> is an independent educational technology and assessment platform designed solely for teaching, academic assessment, student exam preparation, and test paper generation.
          </p>
          <p>
            Any past examination papers, syllabus outlines, model questions, or board references available on this platform are organized strictly for non-commercial academic reference and preparation under <strong>Fair Use</strong> provisions.
          </p>
        </section>

        {/* Section 2 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-sm font-black">2</span>
            No Official Government Affiliation
          </h2>
          <div className="p-5 bg-amber-50/70 border border-amber-200 rounded-2xl text-amber-950 text-sm leading-relaxed">
            <strong>Important Clarification:</strong> {appName} is an independent private platform and is <strong>NOT</strong> affiliated with, endorsed by, or officially associated with any Government Board of Intermediate and Secondary Education (BISE), Federal Board (FBISE), Cambridge Assessment International Education (CAIE), or official educational ministries. All trademarked names and board acronyms are used strictly for identification and curriculum categorization purposes.
          </div>
        </section>

        {/* Section 3 */}
        <section className="space-y-4">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
            <span className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center text-sm font-black">3</span>
            Accuracy & Verification of Content
          </h2>
          <p>
            While our academic editorial team and educators exert continuous efforts to verify question keys, Urdu translations, and mathematical equations, teachers and examiners are advised to conduct a final review of generated test papers before conducting formal examinations.
          </p>
        </section>

        {/* Section 4 - DMCA Policy */}
        <section className="space-y-4 bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200">
          <h2 className="text-xl md:text-2xl font-black text-slate-900 flex items-center gap-3">
            <Copyright size={24} className="text-indigo-600" />
            DMCA Copyright Takedown Notice
          </h2>
          <p>
            We respect the intellectual property rights of authors, publishers, and educators. If you believe any question, study note, textbook excerpt, or past paper on our site infringes upon your copyright, please submit a notice containing:
          </p>
          <ul className="space-y-2 list-disc pl-5 text-sm text-slate-600">
            <li>Identification of the copyrighted work claimed to have been infringed.</li>
            <li>Direct URL or exact title of the specific question or material.</li>
            <li>Your contact information (name, address, telephone number, email).</li>
            <li>A statement affirming good faith belief of unauthorized use.</li>
          </ul>
          <p className="text-xs text-slate-500 mt-2">
            Upon receipt of a valid notice, we will promptly investigate and remove or disable access to the infringing material within 24-48 business hours.
          </p>
        </section>

        {/* Section 5 - Contact */}
        <section className="space-y-4 pt-6 border-t border-slate-200">
          <h2 className="text-xl md:text-2xl font-black text-slate-900">DMCA & Compliance Contact</h2>
          <div className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl text-sm font-semibold text-slate-800 w-fit">
            <Mail size={16} className="text-indigo-600" />
            <span>dmca@{appName.toLowerCase().replace(/\s+/g, '')}.com</span>
          </div>
        </section>

      </div>
    </div>
  );
};

export default Disclaimer;
