
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
  const [error, setError] = useState<string | null>(null);

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
      } catch (err: any) {
        setError(err.message || 'Failed to fetch past papers.');
        setPapers([]);
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

  // Step Navigation State: 1 = Board, 2 = Level/Class, 3 = Subject, 4 = Year, 5 = Papers/PDF View
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [selectedLevel, setSelectedLevel] = useState<string>('');
  const [selectedSubject, setSelectedSubject] = useState<string>('');
  const [selectedYear, setSelectedYear] = useState<string>('');

  // Extract dynamic boards strictly from actual existing past paper records (deduplicated)
  const allBoards = useMemo(() => {
    const list: string[] = [];
    papers.forEach(p => {
      if (p.board && p.board.trim()) {
        const b = p.board.trim();
        if (!list.some(item => item.toLowerCase() === b.toLowerCase())) {
          list.push(b);
        }
      }
    });
    return list;
  }, [papers]);

  // Extract dynamic levels strictly from actual existing past paper records filtered by selected board
  const allLevels = useMemo(() => {
    const list: string[] = [];
    papers.forEach(p => {
      if (p.level && p.level.trim()) {
        if (selectedBoard && p.board && p.board.trim().toLowerCase() !== selectedBoard.trim().toLowerCase()) return;
        const l = p.level.trim();
        if (!list.some(item => item.toLowerCase() === l.toLowerCase())) {
          list.push(l);
        }
      }
    });
    return list;
  }, [papers, selectedBoard]);

  // Extract dynamic subjects strictly from actual existing past paper records filtered by board & level
  const allSubjects = useMemo(() => {
    const list: string[] = [];
    papers.forEach(p => {
      if (p.subject && p.subject.trim()) {
        if (selectedBoard && p.board && p.board.trim().toLowerCase() !== selectedBoard.trim().toLowerCase()) return;
        if (selectedLevel && p.level && p.level.trim().toLowerCase() !== selectedLevel.trim().toLowerCase()) return;
        const s = p.subject.trim();
        if (!list.some(item => item.toLowerCase() === s.toLowerCase())) {
          list.push(s);
        }
      }
    });
    return list;
  }, [papers, selectedBoard, selectedLevel]);

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

  // Dynamic URL Sync effect for Past Papers
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const board = params.get('board') || '';
      const level = params.get('class') || params.get('level') || '';
      const subject = params.get('subject') || '';
      const step = parseInt(params.get('step') || '1', 10);

      setSelectedBoard(board);
      setSelectedLevel(level);
      setSelectedSubject(subject);
      setCurrentStep(step);
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const updateRouteUrl = (newBoard: string, newLevel: string, newSubject: string, newStep: number) => {
    setSelectedBoard(newBoard);
    setSelectedLevel(newLevel);
    setSelectedSubject(newSubject);
    setCurrentStep(newStep);

    const params = new URLSearchParams();
    if (newBoard) params.set('board', newBoard);
    if (newLevel) params.set('class', newLevel);
    if (newSubject) params.set('subject', newSubject);
    if (newStep > 1) params.set('step', newStep.toString());

    const queryString = params.toString();
    const newPath = queryString ? `/past_papers?${queryString}` : '/past_papers';
    window.history.pushState(null, '', newPath);
  };

  const filteredPastPapers = useMemo(() => {
    return papers.filter(p => {
      if (selectedBoard && p.board && p.board.trim().toLowerCase() !== selectedBoard.trim().toLowerCase()) return false;
      if (selectedLevel && p.level && p.level.trim().toLowerCase() !== selectedLevel.trim().toLowerCase()) return false;
      if (selectedSubject && p.subject && p.subject.trim().toLowerCase() !== selectedSubject.trim().toLowerCase()) return false;
      if (selectedYear && p.year && String(p.year) !== selectedYear) return false;
      return true;
    });
  }, [papers, selectedBoard, selectedLevel, selectedSubject, selectedYear]);

  const resetStepWizard = () => {
    setSelectedBoard('');
    setSelectedLevel('');
    setSelectedSubject('');
    setSelectedYear('');
    setFilters({ board: '', level: '', subject: '', year: '', resource: '' });
    setCurrentStep(1);
    window.history.pushState(null, '', '/past_papers');
  };

  const stepDescriptions = [
    { title: 'Step 1: Choose Board / Syllabus', desc: 'Select your educational board system to view past papers.' },
    { title: 'Step 2: Choose Class', desc: 'Select your academic class level.' },
    { title: 'Step 3: Choose Subject', desc: 'Select the subject to view available past examination papers.' }
  ];

  // Colors for class/subject pill buttons like screenshot
  const pillColors = [
    'from-sky-400 to-blue-500 text-white shadow-sky-200',
    'from-emerald-400 to-green-600 text-white shadow-emerald-200',
    'from-cyan-400 to-blue-600 text-white shadow-cyan-200',
    'from-amber-300 to-orange-400 text-slate-900 shadow-amber-200',
    'from-amber-400 to-yellow-500 text-slate-900 shadow-yellow-200',
    'from-teal-400 to-cyan-600 text-white shadow-teal-200',
    'from-fuchsia-400 to-pink-500 text-white shadow-fuchsia-200',
    'from-emerald-500 to-teal-600 text-white shadow-emerald-200'
  ];

  // Group papers by Year for Step 4
  const papersByYear = useMemo(() => {
    const map: Record<string, any[]> = {};
    filteredPastPapers.forEach(p => {
      const yr = String(p.year || 'General');
      if (!map[yr]) map[yr] = [];
      map[yr].push(p);
    });
    // Sort years descending (2024, 2023, 2022...)
    return Object.keys(map).sort((a, b) => b.localeCompare(a)).map(yr => ({
      year: yr,
      papers: map[yr]
    }));
  }, [filteredPastPapers]);

  return (
    <div className="py-10 sm:py-12 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Title Banner */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
          <span>🏛️</span> Official Board Examination Archive
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-slate-900">
          <span className="text-indigo-600">Official Past</span> Papers Archive
        </h1>
        <p className="mt-3 text-slate-600 max-w-2xl mx-auto text-sm sm:text-base font-medium">
          Download authenticated matriculation and intermediate past examination papers from PCTB, Federal Board (FBISE), KPK, and Sindh boards.
        </p>
        
        {/* Dynamic Breadcrumbs */}
        {(selectedBoard || selectedLevel || selectedSubject) && (
          <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-2 bg-slate-900 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-2xl border border-slate-800 shadow-md text-xs sm:text-sm font-bold uppercase tracking-wider">
            {selectedBoard && <span className="text-indigo-300">🏛️ {selectedBoard}</span>}
            {selectedBoard && selectedLevel && <span className="text-slate-500">›</span>}
            {selectedLevel && <span className="text-sky-300">🎓 {selectedLevel}</span>}
            {selectedLevel && selectedSubject && <span className="text-slate-500">›</span>}
            {selectedSubject && <span className="text-emerald-300">📖 {selectedSubject}</span>}
            <button onClick={resetStepWizard} className="ml-3 text-xs text-rose-400 hover:text-rose-300 underline font-semibold normal-case">(Reset Filter)</button>
          </div>
        )}
      </div>

      {/* STEP 1: Select Syllabus / Board */}
      {currentStep === 1 && (
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center mb-6">
            <span className="text-xs font-black text-indigo-700 uppercase tracking-widest bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-200/80 shadow-sm">Step 1 of 3</span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">Select Educational Board / Syllabus</h2>
            <p className="text-slate-500 text-xs sm:text-sm mt-1">Select your provincial board to filter papers</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
            <button
              onClick={() => updateRouteUrl('', '', '', 2)}
              className="p-6 rounded-2xl bg-slate-900 text-white font-black text-lg border-2 border-slate-800 shadow-xl hover:border-indigo-500 hover:scale-105 transition-all text-center group"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">🌟</div>
              ALL BOARDS
            </button>
            {allBoards.map((board, idx) => (
              <button
                key={board}
                onClick={() => updateRouteUrl(board, '', '', 2)}
                className={`p-6 rounded-2xl bg-gradient-to-r ${pillColors[idx % pillColors.length]} font-black text-lg shadow-lg hover:scale-105 transition-all text-center`}
              >
                {board}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 2: Select Class / Level */}
      {currentStep === 2 && (
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center mb-6">
            <span className="text-xs font-black text-indigo-700 uppercase tracking-widest bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-200/80 shadow-sm">Step 2 of 3</span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">Select Class / Level</h2>
            <button onClick={() => updateRouteUrl(selectedBoard, '', '', 1)} className="text-xs text-indigo-600 font-bold hover:underline mt-1 inline-flex items-center gap-1">
              ← Change Board ({selectedBoard || 'All'})
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
            {allLevels.map((lvl, idx) => (
              <button
                key={lvl}
                onClick={() => updateRouteUrl(selectedBoard, lvl, '', 3)}
                className={`p-6 rounded-2xl bg-gradient-to-r ${pillColors[idx % pillColors.length]} font-black text-xl tracking-wider shadow-lg hover:scale-105 transition-all text-center uppercase`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 3: Select Subject */}
      {currentStep === 3 && (
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center mb-6">
            <span className="text-xs font-black text-indigo-700 uppercase tracking-widest bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-200/80 shadow-sm">Step 3 of 3</span>
            <h2 className="text-2xl font-black text-slate-900 mt-2">Select Subject</h2>
            <button onClick={() => updateRouteUrl(selectedBoard, selectedLevel, '', 2)} className="text-xs text-indigo-600 font-bold hover:underline mt-1 inline-flex items-center gap-1">
              ← Change Class ({selectedLevel})
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {allSubjects.map((sub, idx) => (
              <button
                key={sub}
                onClick={() => updateRouteUrl(selectedBoard, selectedLevel, sub, 4)}
                className={`p-5 rounded-2xl bg-gradient-to-r ${pillColors[idx % pillColors.length]} font-black text-base tracking-wide shadow-md hover:scale-105 transition-all text-center uppercase`}
              >
                {sub}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* STEP 4: Year Grouping PDF Cards View */}
      {(currentStep === 4 || (selectedBoard && selectedLevel && selectedSubject)) && (
        <div className="space-y-6 mt-4">
          <div className="bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row gap-4 justify-between items-center text-white">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search paper by board, title or year..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Limit selector dropdown */}
              <div className="flex items-center gap-1.5 bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold text-slate-300">
                <span className="text-slate-400 font-semibold">Show:</span>
                <select
                  value={itemsPerPage === 9999 ? 'all' : itemsPerPage.toString()}
                  onChange={(e) => {
                    const val = e.target.value;
                    setItemsPerPage(val === 'all' ? 9999 : parseInt(val, 10));
                    setCurrentPage(1);
                  }}
                  className="bg-transparent font-black text-indigo-400 focus:outline-none cursor-pointer"
                >
                  <option value="20" className="bg-slate-900 text-white">20</option>
                  <option value="40" className="bg-slate-900 text-white">40</option>
                  <option value="100" className="bg-slate-900 text-white">100</option>
                  <option value="all" className="bg-slate-900 text-white">All</option>
                </select>
              </div>

              <button onClick={resetStepWizard} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md">
                Change Selection
              </button>
            </div>
          </div>

          {/* Results Summary Bar */}
          {filteredPastPapers.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-1 text-xs text-slate-500 font-semibold">
              <div>
                Showing <span className="font-bold text-slate-900">{filteredPastPapers.length}</span> authentic board papers
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                {['20', '40', '100', 'all'].map((opt) => (
                  <button
                    key={opt}
                    onClick={() => {
                      setItemsPerPage(opt === 'all' ? 9999 : parseInt(opt, 10));
                      setCurrentPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase transition-all ${
                      (opt === 'all' && itemsPerPage === 9999) || itemsPerPage === parseInt(opt, 10)
                        ? 'bg-indigo-600 text-white font-black shadow-sm' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {opt === 'all' ? 'All' : opt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Grouped by Year Headers */}
          {papersByYear.map(group => (
            <div key={group.year} className="space-y-4">
              {/* Year Header Banner */}
              <div className="w-full bg-slate-900 text-white py-3 px-6 rounded-2xl font-black text-center text-lg tracking-widest shadow-lg border border-slate-800 flex items-center justify-center gap-3">
                <span className="text-indigo-400 text-sm">✦</span>
                <span className="text-indigo-300 font-serif text-xl">{group.year}</span>
                <span className="text-xs uppercase tracking-widest text-slate-300 font-sans font-bold">Annual & Supplementary Examinations</span>
                <span className="text-indigo-400 text-sm">✦</span>
              </div>

              {/* Grid of PDF Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {group.papers.map(p => (
                  <a
                    key={p.id}
                    href={p.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 shadow-sm hover:shadow-xl transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
                  >
                    <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-rose-100 transition-all border border-rose-200">
                      <Download size={22} />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-2">{p.title || `${p.board || 'Board'} Paper`}</h4>
                    <p className="text-[11px] text-slate-500 font-semibold uppercase mt-1 tracking-wider">{p.subject} • {p.year}</p>
                    <span className="mt-3 text-[11px] font-black text-indigo-700 bg-indigo-50 border border-indigo-200/70 px-3 py-1 rounded-full group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                      View / Download PDF →
                    </span>
                  </a>
                ))}
              </div>
            </div>
          ))}

          {filteredPastPapers.length === 0 && (
            <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200 shadow-md">
              <Filter size={48} className="mx-auto mb-3 opacity-20 text-indigo-500" />
              <p className="font-bold text-slate-700">No past papers found for this specific selection.</p>
              <button onClick={resetStepWizard} className="mt-4 text-xs font-bold text-indigo-600 hover:underline">
                Reset filters and explore other subjects
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PastPapers;
