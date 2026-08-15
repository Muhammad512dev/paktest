
import React, { useState, useEffect, useMemo } from 'react';
import { Download, Search, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { getPastPaperFilters, getPastPapers } from '../../services/dataService';

const PastPapers: React.FC = () => {
  const [papers, setPapers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({ board: '', level: '', subject: '', year: '', resource: '' });
  const [filterOptions, setFilterOptions] = useState({ boards: [] as string[], levels: [] as string[], subjects: [] as string[], years: [] as string[] });
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  // Load filter values separately, without downloading the paper archive.
  useEffect(() => {
    getPastPaperFilters()
      .then(setFilterOptions)
      .catch(() => setFilterOptions({ boards: [], levels: [], subjects: [], years: [] }));
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(async () => {
      setIsLoading(true);
      try {
        const result = await getPastPapers({ ...filters, search: searchTerm, page: currentPage, pageSize: itemsPerPage });
        setPapers(result.data);
        setTotalItems(result.pagination.total || 0);
        setTotalPages(Math.max(1, result.pagination.pages || 1));
      } finally {
        setIsLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timer);
  }, [searchTerm, filters, currentPage, itemsPerPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filters, itemsPerPage]);

  // Extract dynamic boards strictly from actual existing past paper records
  const allBoards = useMemo(() => {
    const list: string[] = [];
    papers.forEach(p => {
      if (p.board && !list.includes(p.board)) {
        list.push(p.board);
      }
    });
    return list;
  }, [papers]);

  // Extract dynamic levels strictly from actual existing past paper records
  const allLevels = useMemo(() => {
    const list: string[] = [];
    papers.forEach(p => {
      if (p.level && !list.includes(p.level)) {
        list.push(p.level);
      }
    });
    return list;
  }, [papers]);

  // Extract dynamic subjects strictly from actual existing past paper records
  const allSubjects = useMemo(() => {
    const list: string[] = [];
    papers.forEach(p => {
      if (p.subject && !list.includes(p.subject)) {
        list.push(p.subject);
      }
    });
    return list;
  }, [papers]);

  // Extract dynamic years strictly from actual existing past paper records
  const allYears = useMemo(() => {
    const list: string[] = [];
    papers.forEach(p => {
      if (p.year && !list.includes(String(p.year))) {
        list.push(String(p.year));
      }
    });
    return list;
  }, [papers]);

  // Extract dynamic resources strictly from comma-separated resource inputs in past papers
  const allResources = useMemo(() => {
    const set = new Set<string>();
    papers.forEach(p => {
      const raw = p.resource || p.source || '';
      if (raw) {
        raw.split(',').map((s: string) => s.trim()).filter(Boolean).forEach((r: string) => set.add(r));
      }
    });
    return Array.from(set);
  }, [papers]);

  // Recent 5 added past papers
  const recentFivePapers = useMemo(() => {
    return [...papers].slice(0, 5);
  }, [papers]);

  return (
    <div className="py-12 max-w-7xl mx-auto px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Past Papers Archive</h1>
        <p className="text-slate-500">Access a growing collection of previous examination papers for practice.</p>
      </div>

      {/* Interactive Step Wizard */}
      <div className="mb-8 p-6 bg-slate-900 text-white rounded-3xl shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Interactive Step Wizard</span>
            <h2 className="text-xl font-black text-white tracking-tight mt-0.5">Filter Past Papers Step-by-Step</h2>
          </div>
          {(filters.board || filters.level || filters.subject || filters.year || filters.resource) && (
            <button 
              onClick={() => setFilters({ board: '', level: '', subject: '', year: '', resource: '' })}
              className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              Reset Step Filters
            </button>
          )}
        </div>

        {/* Step 1: Board */}
        <div className="space-y-3 mb-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px]">1</span> Select Board
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button 
              onClick={() => setFilters(prev => ({ ...prev, board: '' }))}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${!filters.board ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black' : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
            >
              All Boards
            </button>
            {allBoards.map((b: string) => (
              <button
                key={b}
                onClick={() => setFilters(prev => ({ ...prev, board: b }))}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filters.board === b ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black' : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
              >
                {b}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Level */}
        <div className="space-y-3 mb-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">2</span> Select Academic Level / Class
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button 
              onClick={() => setFilters(prev => ({ ...prev, level: '' }))}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${!filters.level ? 'bg-indigo-600 text-white border-indigo-500 shadow-md font-black' : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
            >
              All Levels
            </button>
            {allLevels.map((l: string) => (
              <button
                key={l}
                onClick={() => setFilters(prev => ({ ...prev, level: l }))}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filters.level === l ? 'bg-indigo-600 text-white border-indigo-500 shadow-md font-black' : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Subject */}
        <div className="space-y-3 mb-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px]">3</span> Select Subject
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button 
              onClick={() => setFilters(prev => ({ ...prev, subject: '' }))}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${!filters.subject ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black' : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
            >
              All Subjects
            </button>
            {allSubjects.map((s: string) => (
              <button
                key={s}
                onClick={() => setFilters(prev => ({ ...prev, subject: s }))}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filters.subject === s ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black' : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        {/* Step 4: Year */}
        <div className="space-y-3 mb-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-rose-500 text-white flex items-center justify-center text-[10px]">4</span> Select Exam Year
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button 
              onClick={() => setFilters(prev => ({ ...prev, year: '' }))}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${!filters.year ? 'bg-rose-600 text-white border-rose-500 shadow-md font-black' : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
            >
              All Years
            </button>
            {allYears.map((y: string) => (
              <button
                key={y}
                onClick={() => setFilters(prev => ({ ...prev, year: y }))}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filters.year === y ? 'bg-rose-600 text-white border-rose-500 shadow-md font-black' : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
              >
                {y}
              </button>
            ))}
          </div>
        </div>

        {/* Step 5: Resource */}
        {allResources.length > 0 && (
          <div className="space-y-3">
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center text-[10px]">5</span> Select Resource / Source
            </p>
            <div className="flex flex-wrap gap-2.5">
              <button 
                onClick={() => setFilters(prev => ({ ...prev, resource: '' }))}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${!filters.resource ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-black' : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
              >
                All Resources
              </button>
              {allResources.map((r: string) => (
                <button
                  key={r}
                  onClick={() => setFilters(prev => ({ ...prev, resource: r }))}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filters.resource === r ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md font-black' : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
        )}
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
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 w-full md:w-auto">
          {([
            ['board', 'All Boards', allBoards],
            ['level', 'All Levels', allLevels],
            ['subject', 'All Subjects', allSubjects],
            ['year', 'All Years', allYears],
            ['resource', 'All Resources', allResources]
          ] as const).map(([key, label, options]) => (
            <select key={key} value={filters[key]} onChange={e => setFilters(prev => ({ ...prev, [key]: e.target.value }))}
              className="px-3 py-2.5 border border-slate-200 rounded-xl bg-white text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer">
              <option value="">{label}</option>
              {options.map((option: string) => <option key={option} value={option}>{option}</option>)}
            </select>
          ))}
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Table */}
        <div className="lg:col-span-3">
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
                {papers.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-slate-900">
                      <div className="flex items-center gap-3">
                        <span className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-black text-xs border border-rose-100 shrink-0">
                          PDF
                        </span>
                        <span>{p.title}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <div className="flex items-center gap-2">
                        {p.board} <span className="w-1 h-1 bg-slate-300 rounded-full"></span> {p.year}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      <span className="bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-md text-xs font-bold">{p.level}</span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <a 
                        href={p.fileUrl} 
                        target={p.fileUrl?.includes('drive.google.com') || p.fileUrl?.startsWith('http') ? '_blank' : '_self'} 
                        rel="noreferrer"
                        download={!p.fileUrl?.includes('drive.google.com')} 
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-600 text-indigo-600 hover:text-white rounded-lg transition-all text-xs font-bold uppercase tracking-wider"
                      >
                        <Download size={14} /> {p.fileUrl?.includes('drive.google.com') ? 'View / Download PDF' : 'Download PDF'}
                      </a>
                    </td>
                  </tr>
                ))}
                {!isLoading && papers.length === 0 && (
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
        </div>

        {/* Right Side Box: Recent 5 Added Past Papers */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl sticky top-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-5">
              <span className="w-3 h-3 rounded-full bg-indigo-400 animate-pulse" />
              <h3 className="text-base font-black text-white uppercase tracking-wider">Recently Added Papers</h3>
            </div>

            <div className="space-y-4">
              {recentFivePapers.map((recent: any, idx: number) => (
                <div key={recent.id || idx} className="p-3.5 bg-slate-800/60 hover:bg-slate-800 rounded-2xl border border-slate-700/60 transition-all group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20">
                      {recent.year || '2024'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{recent.level || 'Matric'}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">{recent.title}</h4>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/40">
                    <span className="text-[10px] text-slate-400">{recent.board || 'PTB'}</span>
                    <a 
                      href={recent.fileUrl} 
                      target={recent.fileUrl?.includes('drive.google.com') || recent.fileUrl?.startsWith('http') ? '_blank' : '_self'}
                      rel="noreferrer"
                      className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase"
                    >
                      <Download size={12} /> View
                    </a>
                  </div>
                </div>
              ))}

              {recentFivePapers.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-6">No recent papers found.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Pagination Footer */}
      {totalItems > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
           <div className="text-sm text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-900">{(currentPage - 1) * itemsPerPage + 1}</span> to <span className="font-bold text-slate-900">{Math.min(currentPage * itemsPerPage, totalItems)}</span> of <span className="font-bold text-slate-900">{totalItems}</span> papers
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
