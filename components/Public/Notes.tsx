
import React, { useState, useEffect } from 'react';
import { Search, FileText, Download, Filter, ChevronLeft, ChevronRight } from 'lucide-react';
import { getNotes } from '../../services/dataService';

const Notes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    const fetchNotes = async () => {
      const data = await getNotes();
      setNotes(data);
    };
    fetchNotes();
  }, []);

  const filteredNotes = notes.filter(n => 
    n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    n.subject.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNotes = filteredNotes.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  return (
    <div className="py-12 max-w-7xl mx-auto px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Study Notes Library</h1>
        <p className="text-slate-500">Curated resources for students and teachers.</p>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search notes by title or subject..." 
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
           <span className="text-sm font-bold text-slate-500 whitespace-nowrap">Show:</span>
           <select 
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-4 py-3 border border-slate-200 rounded-xl bg-white text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
           >
              <option value={20}>20 Cards</option>
              <option value={40}>40 Cards</option>
              <option value={50}>50 Cards</option>
           </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentNotes.map(note => (
          <div key={note.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <FileText size={24} />
              </div>
              <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-full">{note.grade}</span>
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-1">{note.title}</h3>
            <p className="text-sm text-slate-500 mb-6">{note.subject} • By {note.author}</p>
            <div className="flex justify-between items-center border-t border-slate-50 pt-4">
              <span className="text-xs text-slate-400 font-bold uppercase">Resource</span>
              <a href={note.fileUrl} download className="text-indigo-600 hover:text-indigo-700 flex items-center gap-1 text-xs font-bold uppercase">
                <Download size={14} /> Download
              </a>
            </div>
          </div>
        ))}
        {currentNotes.length === 0 && (
            <div className="col-span-full py-12 text-center text-gray-400">
               <FileText size={48} className="mx-auto mb-4 opacity-20"/>
               <p>No notes found matching your search.</p>
            </div>
        )}
      </div>

      {/* Pagination Controls */}
      {filteredNotes.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-12 gap-4 border-t border-slate-100 pt-8">
           <div className="text-sm text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{indexOfFirstItem + 1}</span> to <span className="font-bold text-slate-900">{Math.min(indexOfLastItem, filteredNotes.length)}</span> of <span className="font-bold text-slate-900">{filteredNotes.length}</span> notes
           </div>
           
           <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                 <ChevronLeft size={20} />
              </button>
              
              <div className="px-4 py-2 bg-slate-50 rounded-lg text-sm font-bold text-slate-700">
                 Page {currentPage} of {totalPages || 1}
              </div>

              <button 
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-2 border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                 <ChevronRight size={20} />
              </button>
           </div>
        </div>
      )}
    </div>
  );
};

export default Notes;
