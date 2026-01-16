
import React, { useState } from 'react';
import { FAQS } from '../constants';
// Added Check to the imports from lucide-react
import { 
  Search, 
  MessageSquare, 
  Book, 
  Mail, 
  ChevronDown, 
  ChevronUp,
  Send,
  HelpCircle,
  FileSpreadsheet,
  Info,
  ShieldCheck,
  Check
} from 'lucide-react';

const Support: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [showImportGuide, setShowImportGuide] = useState(false);

  const filteredFaqs = [
    ...FAQS,
    { 
      question: "How do I fix curriculum import errors?", 
      answer: "Ensure your CSV file uses exact headers: 'Board', 'Grade', 'Subject', 'Chapter', and 'Topic'. Special characters should be avoided in titles. If a Board doesn't exist, our Smart Sync will create it automatically." 
    },
    {
      question: "What is the correct CSV format for bulk curriculum sync?",
      answer: "A plain CSV file with headers in the first row. Example: Board,Grade,Subject,Chapter,Topic. Each row represents one unique curriculum path."
    }
  ].filter(f => 
    f.question.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.answer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-12">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Support & Documentation</h1>
        <p className="text-gray-500 mb-8">Resources to help you master ExamForge AI platform</p>
        <div className="relative max-w-xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search help topics..." 
            className="w-full pl-12 pr-4 py-3 rounded-full border border-gray-300 focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-4">
            <Book size={24} />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">User Guides</h3>
          <p className="text-sm text-gray-500 mb-4">Step-by-step documentation for teachers and administrators.</p>
          <button className="text-blue-600 text-sm font-bold hover:underline">Explore Guides</button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-4">
            <FileSpreadsheet size={24} />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">Curriculum Import</h3>
          <p className="text-sm text-gray-500 mb-4">Technical specifications for bulk syncing your school syllabus.</p>
          <button onClick={() => setShowImportGuide(true)} className="text-indigo-600 text-sm font-bold hover:underline">View Spec Sheet</button>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-purple-50 text-purple-600 rounded-xl flex items-center justify-center mb-4">
            <ShieldCheck size={24} />
          </div>
          <h3 className="font-bold text-gray-900 mb-2">System Status</h3>
          <p className="text-sm text-gray-500 mb-4">Check uptime and scheduled maintenance updates.</p>
          <button className="text-purple-600 text-sm font-bold hover:underline">View Status</button>
        </div>
      </div>

      {showImportGuide && (
        <div className="bg-indigo-900 text-white rounded-3xl p-8 relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
          <button onClick={() => setShowImportGuide(false)} className="absolute top-6 right-6 text-white/50 hover:text-white"><ChevronUp size={24}/></button>
          <h2 className="text-2xl font-bold mb-6 flex items-center gap-2"><Info size={24} className="text-indigo-300"/> Curriculum Import Specification</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-300">CSV Header Requirements</h4>
                <ul className="space-y-2 text-sm">
                   <li className="flex items-start gap-2"><Check size={14} className="text-emerald-400 mt-1"/> <strong>Board</strong>: The exam board name (e.g. Cambridge)</li>
                   <li className="flex items-start gap-2"><Check size={14} className="text-emerald-400 mt-1"/> <strong>Grade</strong>: Level name (e.g. Grade 10)</li>
                   <li className="flex items-start gap-2"><Check size={14} className="text-emerald-400 mt-1"/> <strong>Subject</strong>: Course name (e.g. Physics)</li>
                   <li className="flex items-start gap-2"><Check size={14} className="text-emerald-400 mt-1"/> <strong>Chapter</strong>: Unit title</li>
                   <li className="flex items-start gap-2"><Check size={14} className="text-emerald-400 mt-1"/> <strong>Topic</strong>: Specific sub-topic</li>
                </ul>
             </div>
             <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-indigo-300">Smart Sync Logic</h4>
                <p className="text-sm text-indigo-100 leading-relaxed">
                   The ExamForge engine automatically verifies every node in the hierarchy. If a Board or Subject is missing, it is created instantly. This ensures your repository remains consistent without manual data entry for every grade.
                </p>
                <div className="p-4 bg-white/10 rounded-xl border border-white/10 text-xs">
                   <strong>Pro Tip:</strong> Export a template from the 'Curriculum Manager' to ensure perfect compatibility.
                </div>
             </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <HelpCircle size={20} className="text-indigo-600" /> Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {filteredFaqs.map((faq, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm transition-all hover:border-indigo-100">
                <button 
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex justify-between items-center p-5 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-gray-800">{faq.question}</span>
                  {openFaq === idx ? <ChevronUp size={18} className="text-indigo-600" /> : <ChevronDown size={18} className="text-gray-400" />}
                </button>
                {openFaq === idx && (
                  <div className="p-5 pt-0 text-sm text-gray-600 bg-gray-50 border-t border-gray-100 leading-relaxed">
                    {faq.answer}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm sticky top-6">
            <h3 className="font-bold text-gray-900 mb-2">Technical Support</h3>
            <p className="text-xs text-gray-500 mb-6 uppercase font-bold tracking-widest">Enterprise Support Line</p>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Issue Category</label>
                <select className="w-full p-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50">
                  <option>Curriculum Import Issues</option>
                  <option>AI Question Generation</option>
                  <option>Billing & Subscription</option>
                  <option>User Permissions</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Description</label>
                <textarea 
                  rows={4} 
                  className="w-full p-4 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 resize-none bg-gray-50/50"
                  placeholder="Tell us exactly what happened..."
                ></textarea>
              </div>
              <button className="w-full py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-100">
                <Send size={16} /> Submit Ticket
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Support;