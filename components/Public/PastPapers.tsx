
import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Download, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { getPastPapers } from '../../services/dataService';

const PastPapers: React.FC = () => {
  const [papers, setPapers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    const fetchPapers = async () => {
      const data = await getPastPapers();
      setPapers(data);
    };
    fetchPapers();
  }, []);

  // Filter Logic
  const filteredPapers = papers.filter(p => 
    p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.board.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.year.toString().includes(searchTerm)
  );

  // Pagination Logic
  const totalPages = Math.ceil(filteredPapers.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentPapers = filteredPapers.slice(indexOfFirstItem, indexOfLastItem);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  return (
    <div className="py-12 max-w-7xl mx-auto px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Past Papers Archive</h1>
        <p className="text-slate-500">Access thousands of previous examination papers for practice.</p>
      </div>

      {/* Search & Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-8 flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="relative flex-1 w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by title, board, subject or year..." 
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
           <span className="text-sm font-bold text-slate-500 whitespace-nowrap">Show:</span>
           <select 
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(Number(e.target.value))}
              className="px-4 py-2.5 border border-slate-200 rounded-xl bg-white text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
           >
              <option value={20}>20 Rows</option>
              <option value={40}>40 Rows</option>
              <option value={50}>50 Rows</option>
           </select>
        </div>
      </div>

      <div className="overflow-hidden bg-white border border-slate-200 rounded-2xl shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-widest">
            <tr>
              <th className="px-6 py-4">Paper Title</th>
              <th className="px-6 py-4">Board / Year</th>
              <th className="px-6 py-4">Level</th>
              <th className="px-6 py-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {currentPapers.map(p => (
              <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-slate-900">{p.title}</td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <div className="flex items-center gap-2">
                    {p.board} <span className="w-1 h-1 bg-slate-300 rounded-full"></span> {p.year}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-slate-600">
                  <span className="bg-indigo-50 text-indigo-700 px-2 py-1 rounded text-xs font-bold">{p.level}</span>
                </td>
                <td className="px-6 py-4 text-right">
                  <a href={p.fileUrl} download className="text-indigo-600 hover:text-indigo-800 p-2 rounded hover:bg-indigo-50 transition-colors inline-block">
                    <Download size={20} />
                  </a>
                </td>
              </tr>
            ))}
            {currentPapers.length === 0 && (
                <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-400">
                       <Filter size={32} className="mx-auto mb-2 opacity-20"/>
                       No past papers found matching your search.
                    </td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {filteredPapers.length > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
           <div className="text-sm text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{indexOfFirstItem + 1}</span> to <span className="font-bold text-slate-900">{Math.min(indexOfLastItem, filteredPapers.length)}</span> of <span className="font-bold text-slate-900">{filteredPapers.length}</span> papers
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

export default PastPapers;
