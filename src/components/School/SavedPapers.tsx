
import React, { useState, useEffect, useMemo } from 'react';
import { getPapersBySchool, deletePaper, getPaperById } from '../../services/dataService';
import { SavedPaper, User, ExamPaper } from '../../types';
import { Search, Filter, Printer, Edit, Trash2, FileText, X, Calendar, ClipboardList, Clock } from 'lucide-react';
import PrintPreview from '../PrintPreview';
import PaperEditor from '../PaperEditor';

interface SavedPapersProps {
  user: User;
}

const SavedPapers: React.FC<SavedPapersProps> = ({ user }) => {
  const [papers, setPapers] = useState<SavedPaper[]>([]);
  const [filterSubject, setFilterSubject] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // State for Print and Edit modes
  const [printingPaper, setPrintingPaper] = useState<ExamPaper | null>(null);
  const [editingPaper, setEditingPaper] = useState<(ExamPaper & { selectedChapters: string[], selectedTopics: string[] }) | null>(null);

  /* Refactored data loading to handle async responses correctly */
  const loadPapers = async () => {
    setIsLoading(true);
    try {
        const papersList = await getPapersBySchool(user.schoolId || 's1');
        setPapers(papersList);
    } finally {
        setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPapers();
  }, [user.schoolId]);

  const handleDelete = async (id: string) => {
    if(window.confirm("Are you sure?")) {
        await deletePaper(id);
        await loadPapers();
    }
  };

  const handlePrint = async (paper: any) => {
      try {
          const fullPaper = await getPaperById(paper.id);
          setPrintingPaper(fullPaper);
      } catch (err) {
          alert("Failed to load paper details for printing.");
      }
  };

  const handleEdit = async (paper: any) => {
      try {
          const fullPaper = await getPaperById(paper.id);
          const editorPaper = {
              ...fullPaper,
              selectedChapters: (fullPaper as any).selectedChapters || [],
              selectedTopics: (fullPaper as any).selectedTopics || []
          };
          setEditingPaper(editorPaper as any);
      } catch (err) {
          alert("Failed to load paper details for editing.");
      }
  };

  const filteredPapers = useMemo(() => {
    return papers.filter(p => 
      (filterSubject === 'All' || p.subject === filterSubject) &&
      (p.title.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [papers, filterSubject, searchTerm]);

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Saved Papers</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Managing repository for {user.schoolId ? 'your institution' : 'the system'}</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search papers by title..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <select 
            className="flex-1 md:flex-none px-4 py-2 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
            value={filterSubject}
            onChange={(e) => setFilterSubject(e.target.value)}
          >
            <option value="All">All Subjects</option>
            <option value="Mathematics">Mathematics</option>
            <option value="Physics">Physics</option>
            <option value="Chemistry">Chemistry</option>
            <option value="English">English</option>
          </select>
          <button className="p-2 border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600">
            <Filter size={20} />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex-1 flex flex-col">
        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 text-xs font-semibold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Paper Title & Subject</th>
                <th className="px-6 py-4">Exam Details</th>
                <th className="px-6 py-4">Test Profile</th>
                <th className="px-6 py-4">Author</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredPapers.map((paper: any) => (
                <tr key={paper.id} className="hover:bg-gray-50/80 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center shrink-0">
                        <FileText size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 text-sm">{paper.title}</div>
                        <div className="text-xs text-indigo-600 font-bold uppercase tracking-tighter">{paper.subject} • {paper.classLevel}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="space-y-1">
                      <div className="text-xs font-bold text-gray-700 flex items-center gap-2">
                        <Calendar size={12} className="text-slate-400" /> {paper.examDate || paper.dateCreated || 'Not set'}
                      </div>
                      <div className="text-[10px] font-bold text-gray-400 flex items-center gap-2 uppercase">
                        <Clock size={12} className="text-slate-400" /> {paper.durationMinutes || 60} Minutes
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                     <div className="space-y-1">
                        <div className="text-xs font-bold text-gray-700 flex items-center gap-2 capitalize">
                           <ClipboardList size={12} className="text-indigo-400" /> {paper.testType || 'Standard'}
                        </div>
                        <div className="text-[10px] font-black text-emerald-600 uppercase">
                           Total: {paper.totalMarks} Marks
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-700">{paper.author || paper.createdBy || 'Unknown'}</div>
                    <div className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">On: {paper.dateCreated}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                      paper.status === 'Finalized' ? 'bg-green-50 text-green-700 border-green-200' :
                      paper.status === 'Draft' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                      'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {paper.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => handlePrint(paper)} 
                        title="Print" 
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Printer size={18} />
                      </button>
                      <button 
                        onClick={() => handleEdit(paper)} 
                        title="Edit" 
                        className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button 
                        onClick={() => handleDelete(paper.id)} 
                        title="Delete" 
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredPapers.length === 0 && (
           <div className="p-20 text-center flex flex-col items-center gap-4">
              <ClipboardList size={48} className="text-slate-200" />
              <p className="text-gray-400 font-bold uppercase tracking-widest text-sm">No papers found matching your criteria.</p>
           </div>
        )}
      </div>

      {/* OVERLAYS */}
      {printingPaper && (
          <PrintPreview 
              paper={printingPaper} 
              onClose={() => setPrintingPaper(null)} 
          />
      )}

      {editingPaper && (
          <div className="fixed inset-0 z-[100] bg-white overflow-hidden">
              <PaperEditor 
                  paper={editingPaper} 
                  user={user}
                  onUpdate={() => {}} // Internal save handles updates
                  onBack={async () => {
                      await loadPapers();
                      setEditingPaper(null);
                  }}
              />
          </div>
      )}
    </div>
  );
};

export default SavedPapers;
