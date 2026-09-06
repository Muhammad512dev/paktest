
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
    <div className="py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Title Banner matching screenshot */}
      <div className="text-center mb-8">
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 inline-block relative">
          <span className="text-amber-500 border-b-4 border-amber-500 pb-1">Past</span> Papers
        </h1>
        {/* Dynamic Breadcrumbs matching screenshot: 10TH > COMPUTER */}
        {(selectedBoard || selectedLevel || selectedSubject) && (
          <div className="mt-4 flex items-center justify-center gap-2 text-sm font-black uppercase text-slate-700 tracking-wider">
            {selectedBoard && <span>🏛️ {selectedBoard}</span>}
            {selectedBoard && selectedLevel && <span>›</span>}
            {selectedLevel && <span>🎓 {selectedLevel}</span>}
            {selectedLevel && selectedSubject && <span>›</span>}
            {selectedSubject && <span>📖 {selectedSubject}</span>}
            <button onClick={resetStepWizard} className="ml-3 text-xs text-rose-500 hover:underline normal-case font-bold">(Reset)</button>
          </div>
        )}
      </div>

      {/* STEP 1: Select Syllabus / Board */}
      {currentStep === 1 && (
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center mb-6">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Step 1</span>
            <h2 className="text-xl font-bold text-slate-800 mt-2">Select Educational Board / Syllabus</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
            <button
              onClick={() => updateRouteUrl('', '', '', 2)}
              className="p-6 rounded-2xl bg-gradient-to-r from-sky-400 to-blue-500 text-white font-black text-lg shadow-lg shadow-sky-200 hover:scale-105 transition-all text-center"
            >
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

      {/* STEP 2: Select Class / Level (Matching Screenshot Pill Buttons) */}
      {currentStep === 2 && (
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center mb-6">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Step 2</span>
            <h2 className="text-xl font-bold text-slate-800 mt-2">Select Class / Level</h2>
            <button onClick={() => updateRouteUrl(selectedBoard, '', '', 1)} className="text-xs text-slate-500 underline hover:text-slate-800 mt-1">← Change Board ({selectedBoard || 'All'})</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-5">
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

      {/* STEP 3: Select Subject (Matching Screenshot Grid Pill Buttons) */}
      {currentStep === 3 && (
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="text-center mb-6">
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">Step 3</span>
            <h2 className="text-xl font-bold text-slate-800 mt-2">Select Subject</h2>
            <button onClick={() => updateRouteUrl(selectedBoard, selectedLevel, '', 2)} className="text-xs text-slate-500 underline hover:text-slate-800 mt-1">← Change Class ({selectedLevel})</button>
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

      {/* STEP 4: Year Grouping PDF Cards View (Matching Screenshot 3 Header & PDF Card Cards) */}
      {(currentStep === 4 || (selectedBoard && selectedLevel && selectedSubject)) && (
        <div className="space-y-8 mt-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 w-full md:max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="Search paper by board, title or year..." 
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <button onClick={resetStepWizard} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all">
              Change Selection
            </button>
          </div>

          {/* Grouped by Year Headers (e.g. 2024, 2023) */}
          {papersByYear.map(group => (
            <div key={group.year} className="space-y-4">
              {/* Year Header Banner matching screenshot 3 */}
              <div className="w-full bg-gradient-to-r from-teal-500 to-blue-700 text-white py-2.5 px-6 rounded-xl font-black text-center text-lg tracking-widest shadow-md">
                {group.year}
              </div>

              {/* Grid of PDF Cards matching screenshot 3 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {group.papers.map(p => (
                  <a
                    key={p.id}
                    href={p.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 shadow-sm hover:shadow-xl transition-all flex flex-col items-center justify-center text-center group cursor-pointer"
                  >
                    {/* Red PDF Icon matching screenshot 3 */}
                    <div className="w-10 h-10 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Download size={22} />
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">{p.title || `${p.board || 'Board'} Paper`}</h4>
                    <p className="text-[11px] text-slate-400 font-semibold uppercase mt-1 tracking-wider">{p.subject} • {p.year}</p>
                  </a>
                ))}
              </div>
            </div>
          ))}

          {filteredPastPapers.length === 0 && (
            <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
              <Filter size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-slate-600">No past papers uploaded yet for your selection.</p>
              <button onClick={resetStepWizard} className="mt-4 text-xs font-bold text-indigo-600 hover:underline">Reset filters and start over</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default PastPapers;
