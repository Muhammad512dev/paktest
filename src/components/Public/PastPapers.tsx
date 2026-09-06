
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

  // Step Navigation State: 1 = Board, 2 = Level/Class, 3 = Subject, 4 = Year, 5 = Papers/PDF View
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  const filteredPastPapers = useMemo(() => {
    return papers.filter(p => {
      if (selectedBoard && p.board && p.board.toLowerCase() !== selectedBoard.toLowerCase()) return false;
      if (selectedLevel && p.level && p.level.toLowerCase() !== selectedLevel.toLowerCase()) return false;
      if (selectedSubject && p.subject && p.subject.toLowerCase() !== selectedSubject.toLowerCase()) return false;
      if (selectedYear && p.year && String(p.year) !== selectedYear) return false;
      if (filters.resource && p.resource) {
        const items = p.resource.split(',').map((s: string) => s.trim().toLowerCase());
        if (!items.includes(filters.resource.toLowerCase())) return false;
      }
      return true;
    });
  }, [papers, selectedBoard, selectedLevel, selectedSubject, selectedYear, filters.resource]);

  const resetStepWizard = () => {
    setSelectedBoard('');
    setSelectedLevel('');
    setSelectedSubject('');
    setSelectedYear('');
    setFilters({ board: '', level: '', subject: '', year: '', resource: '' });
    setCurrentStep(1);
  };

  const stepDescriptions = [
    { title: 'Step 1: Choose Board / Syllabus', desc: 'Select your educational board or syllabus system to view targeted past papers.' },
    { title: 'Step 2: Choose Academic Level / Class', desc: 'Select your class level (e.g. 9th, 10th, FSc, Matric).' },
    { title: 'Step 3: Choose Subject', desc: 'Select the subject examination paper you want to practice.' },
    { title: 'Step 4: Choose Examination Year', desc: 'Select the past exam year (e.g., 2023, 2022, Annual/Supply).' },
    { title: 'Step 5: View & Open PDF Papers', desc: 'Access and open past paper PDF files in a new tab.' }
  ];

  return (
    <div className="py-12 max-w-7xl mx-auto px-6 lg:px-8">
      {/* Title Header */}
      <div className="text-center mb-10">
        <span className="px-4 py-1 bg-indigo-50 text-indigo-600 rounded-full text-xs font-black uppercase tracking-widest border border-indigo-100">Step-by-Step Past Papers</span>
        <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3 mb-2">Past Examination Papers Portal</h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-sm">Filter past examination papers step-by-step by board, class, subject, and year, then open or download the PDF file.</p>
      </div>

      {/* Step Navigation Progress Box */}
      <div className="mb-8 p-6 bg-slate-900 text-white rounded-3xl shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Step {currentStep} of 5</span>
              <span className="text-slate-600">•</span>
              <span className="text-xs font-bold text-slate-400">{filteredPastPapers.length} Papers Available</span>
            </div>
            <h2 className="text-xl font-black text-white tracking-tight mt-0.5">{stepDescriptions[currentStep - 1]?.title}</h2>
            <p className="text-xs text-slate-400 mt-1">{stepDescriptions[currentStep - 1]?.desc}</p>
          </div>
          {(selectedBoard || selectedLevel || selectedSubject || selectedYear || currentStep > 1) && (
            <button 
              onClick={resetStepWizard}
              className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shrink-0"
            >
              Reset to Start
            </button>
          )}
        </div>

        {/* Step Numbers Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {[
            { step: 1, label: 'Syllabus / Board', val: selectedBoard || 'All' },
            { step: 2, label: 'Level / Class', val: selectedLevel || 'All' },
            { step: 3, label: 'Subject', val: selectedSubject || 'All' },
            { step: 4, label: 'Exam Year', val: selectedYear || 'All' },
            { step: 5, label: 'PDF Papers', val: `${filteredPastPapers.length} Files` }
          ].map(s => (
            <button
              key={s.step}
              onClick={() => setCurrentStep(s.step)}
              className={`p-3 rounded-2xl border text-left transition-all ${currentStep === s.step ? 'bg-indigo-600 text-white border-indigo-400 shadow-lg' : currentStep > s.step ? 'bg-slate-800 text-emerald-400 border-slate-700' : 'bg-slate-800/50 text-slate-400 border-slate-800 opacity-60'}`}
            >
              <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-wider mb-1">
                <span>Step {s.step}</span>
                {currentStep > s.step && <span className="text-emerald-400">✓</span>}
              </div>
              <p className="text-xs font-bold truncate">{s.label}</p>
              <p className="text-[11px] opacity-80 truncate mt-0.5">{s.val}</p>
            </button>
          ))}
        </div>
      </div>

      {/* STEP 1: Select Board */}
      {currentStep === 1 && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-8">
          <h3 className="text-lg font-black text-slate-900 mb-2">Step 1: Select Educational Board</h3>
          <p className="text-sm text-slate-500 mb-6">Choose an examination board to view past papers.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            <button onClick={() => { setSelectedBoard(''); setCurrentStep(2); }} className={`p-5 rounded-2xl border text-left transition-all ${!selectedBoard ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
              <h4 className="font-bold text-slate-900 text-base">All Boards</h4>
              <p className="text-xs text-slate-500 mt-1">Include past papers across all boards.</p>
            </button>
            {allBoards.map(b => (
              <button key={b} onClick={() => { setSelectedBoard(b); setCurrentStep(2); }} className={`p-5 rounded-2xl border text-left transition-all ${selectedBoard === b ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                <h4 className="font-bold text-slate-900 text-base">{b}</h4>
                <p className="text-xs text-slate-500 mt-1">Past papers for {b}.</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Select Level */}
      {currentStep === 2 && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Step 2: Select Academic Level / Class</h3>
              <p className="text-sm text-slate-500">Board selected: <span className="font-bold text-indigo-600">{selectedBoard || 'All Boards'}</span></p>
            </div>
            <button onClick={() => setCurrentStep(1)} className="text-xs font-bold text-slate-500 hover:text-slate-800 underline">← Change Board</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            <button onClick={() => { setSelectedLevel(''); setCurrentStep(3); }} className={`p-5 rounded-2xl border text-left transition-all ${!selectedLevel ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
              <h4 className="font-bold text-slate-900 text-base">All Levels</h4>
              <p className="text-xs text-slate-500 mt-1">Include papers across all class levels.</p>
            </button>
            {allLevels.map(l => (
              <button key={l} onClick={() => { setSelectedLevel(l); setCurrentStep(3); }} className={`p-5 rounded-2xl border text-left transition-all ${selectedLevel === l ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                <h4 className="font-bold text-slate-900 text-base">{l}</h4>
                <p className="text-xs text-slate-500 mt-1">Past papers for level {l}.</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: Select Subject */}
      {currentStep === 3 && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Step 3: Select Subject</h3>
              <p className="text-sm text-slate-500">Board: <span className="font-bold text-indigo-600">{selectedBoard || 'All'}</span> • Level: <span className="font-bold text-indigo-600">{selectedLevel || 'All'}</span></p>
            </div>
            <button onClick={() => setCurrentStep(2)} className="text-xs font-bold text-slate-500 hover:text-slate-800 underline">← Change Level</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-6">
            <button onClick={() => { setSelectedSubject(''); setCurrentStep(4); }} className={`p-5 rounded-2xl border text-left transition-all ${!selectedSubject ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
              <h4 className="font-bold text-slate-900 text-base">All Subjects</h4>
              <p className="text-xs text-slate-500 mt-1">Include papers for all subjects.</p>
            </button>
            {allSubjects.map(s => (
              <button key={s} onClick={() => { setSelectedSubject(s); setCurrentStep(4); }} className={`p-5 rounded-2xl border text-left transition-all ${selectedSubject === s ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                <h4 className="font-bold text-slate-900 text-base">{s}</h4>
                <p className="text-xs text-slate-500 mt-1">Past papers for {s}.</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: Select Year */}
      {currentStep === 4 && (
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-black text-slate-900">Step 4: Select Exam Year</h3>
              <p className="text-sm text-slate-500">Board: <span className="font-bold text-indigo-600">{selectedBoard || 'All'}</span> • Subject: <span className="font-bold text-indigo-600">{selectedSubject || 'All'}</span></p>
            </div>
            <button onClick={() => setCurrentStep(3)} className="text-xs font-bold text-slate-500 hover:text-slate-800 underline">← Change Subject</button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 mt-6">
            <button onClick={() => { setSelectedYear(''); setCurrentStep(5); }} className={`p-4 rounded-2xl border text-center transition-all ${!selectedYear ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
              <h4 className="font-bold text-slate-900 text-sm">All Years</h4>
            </button>
            {allYears.map(y => (
              <button key={y} onClick={() => { setSelectedYear(y); setCurrentStep(5); }} className={`p-4 rounded-2xl border text-center transition-all ${selectedYear === y ? 'bg-indigo-50 border-indigo-500 shadow-md ring-2 ring-indigo-500' : 'bg-white border-slate-200 hover:border-indigo-300'}`}>
                <h4 className="font-bold text-slate-900 text-sm">{y}</h4>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 5 / Main View: Past Papers List */}
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
                {filteredPastPapers.map(p => (
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
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white hover:bg-indigo-700 rounded-lg transition-all text-xs font-bold uppercase tracking-wider shadow-sm"
                      >
                        <Download size={14} /> Open PDF File
                      </a>
                    </td>
                  </tr>
                ))}
                {!isLoading && filteredPastPapers.length === 0 && (
                    <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-400">
                           <Filter size={32} className="mx-auto mb-2 opacity-20"/>
                           No past papers found matching your step selections.
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
                      {recent.level || 'General'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{recent.subject}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-indigo-300 transition-colors line-clamp-1">{recent.title}</h4>
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-700/40">
                    <span className="text-[10px] text-slate-400">{recent.board} ({recent.year})</span>
                    <a 
                      href={recent.fileUrl} 
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-black text-indigo-400 hover:text-indigo-300 flex items-center gap-1 uppercase"
                    >
                      <Download size={12} /> Open PDF
                    </a>
                  </div>
                </div>
              ))}

              {recentFivePapers.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-6">No recent past papers found.</p>
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
