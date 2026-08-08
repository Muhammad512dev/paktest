
import React, { useState, useEffect, useMemo } from 'react';
import { Search, FileText, Download, Filter, ChevronLeft, ChevronRight, GraduationCap, Layers, Tag } from 'lucide-react';
import { getNotes, getPublicCurriculum } from '../../services/dataService';
import { Syllabus, ClassLevel } from '../../types';

const NOTE_TYPES = [
  'Book Notes',
  'Class Notes',
  'ECAT/Entry Test',
  'NTS',
  'MDCAT',
  'Past Paper',
  'Other'
];

const Notes: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [notes, setNotes] = useState<any[]>([]);
  const [curriculum, setCurriculum] = useState<{ syllabuses: Syllabus[]; classes: ClassLevel[] }>({
    syllabuses: [],
    classes: []
  });
  const [filters, setFilters] = useState({ board: '', grade: '', noteType: '' });
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getPublicCurriculum();
        setCurriculum({ syllabuses: data?.syllabuses || [], classes: data?.classes || [] });
      } catch {
        setCurriculum({ syllabuses: [], classes: [] });
      }
    };
    load();
  }, []);

  useEffect(() => {
    const t = setTimeout(async () => {
      const data = await getNotes({
        search: searchTerm,
        board: filters.board,
        grade: filters.grade,
        noteType: filters.noteType
      });
      setNotes(Array.isArray(data) ? data : []);
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm, filters.board, filters.grade, filters.noteType]);

  // Dynamic boards strictly extracted from actual existing notes input fields
  const availableBoards = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    notes.forEach(n => {
      if (n.board && !list.some(b => b.name.toLowerCase() === n.board.toLowerCase() || b.id === n.board)) {
        list.push({ id: n.board, name: n.board });
      }
    });
    return list;
  }, [notes]);

  // Dynamic classes strictly extracted from actual existing notes input fields
  const availableClasses = useMemo(() => {
    const list: { id: string; name: string; syllabusId?: string }[] = [];
    notes.forEach(n => {
      if (n.grade && !list.some(c => c.name.toLowerCase() === n.grade.toLowerCase())) {
        list.push({ id: n.grade, name: n.grade, syllabusId: n.board });
      }
    });
    return list;
  }, [notes]);

  const filteredClasses = useMemo(() => {
    return availableClasses.filter(c => !filters.board || !c.syllabusId || c.syllabusId === filters.board || c.syllabusId === filters.board);
  }, [availableClasses, filters.board]);

  // Recent 5 added notes for right-side widget
  const recentFiveNotes = useMemo(() => {
    return [...notes].slice(0, 5);
  }, [notes]);

  const filteredNotes = notes;

  // Pagination Logic
  const totalPages = Math.ceil(filteredNotes.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentNotes = filteredNotes.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage, filters.board, filters.grade, filters.noteType]);

  return (
    <div className="py-12 max-w-7xl mx-auto px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Study Notes Library</h1>
        <p className="text-slate-500">Curated resources for students and teachers.</p>
      </div>

      {/* Step Wizard Bar */}
      <div className="mb-8 p-6 bg-slate-900 text-white rounded-3xl shadow-xl border border-slate-800">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-6">
          <div>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Interactive Step Wizard</span>
            <h2 className="text-xl font-black text-white tracking-tight mt-0.5">Filter Notes Step-by-Step</h2>
          </div>
          {(filters.board || filters.grade || filters.noteType) && (
            <button 
              onClick={() => setFilters({ board: '', grade: '', noteType: '' })}
              className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
            >
              Reset Step Filters
            </button>
          )}
        </div>

        {/* Step 1: Board Selection */}
        <div className="space-y-3 mb-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center text-[10px]">1</span> Select Board
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button 
              onClick={() => setFilters(prev => ({ ...prev, board: '', grade: '' }))}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${!filters.board ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black' : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
            >
              All Boards
            </button>
            {availableBoards.map(s => (
              <button
                key={s.id}
                onClick={() => setFilters(prev => ({ ...prev, board: s.id, grade: '' }))}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filters.board === s.id ? 'bg-emerald-500 text-slate-950 border-emerald-400 shadow-md font-black' : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Class Selection */}
        <div className="space-y-3 mb-6">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-indigo-500 text-white flex items-center justify-center text-[10px]">2</span> Select Academic Class
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button 
              onClick={() => setFilters(prev => ({ ...prev, grade: '' }))}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${!filters.grade ? 'bg-indigo-600 text-white border-indigo-500 shadow-md font-black' : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
            >
              All Classes
            </button>
            {filteredClasses.map(c => (
              <button
                key={c.id}
                onClick={() => setFilters(prev => ({ ...prev, grade: c.name }))}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filters.grade === c.name ? 'bg-indigo-600 text-white border-indigo-500 shadow-md font-black' : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Type Selection */}
        <div className="space-y-3">
          <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center text-[10px]">3</span> Select Resource Type
          </p>
          <div className="flex flex-wrap gap-2.5">
            <button 
              onClick={() => setFilters(prev => ({ ...prev, noteType: '' }))}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${!filters.noteType ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black' : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
            >
              All Resource Types
            </button>
            {NOTE_TYPES.map(t => (
              <button
                key={t}
                onClick={() => setFilters(prev => ({ ...prev, noteType: t }))}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${filters.noteType === t ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-black' : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
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

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2">
            <Filter className="text-slate-400" size={16} />
            <span className="text-sm font-bold text-slate-500 whitespace-nowrap">Classic Filters:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full md:w-[520px]">
            <div className="relative">
              <GraduationCap className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={filters.board}
                onChange={(e) => setFilters(prev => ({ ...prev, board: e.target.value, grade: '' }))}
                className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl bg-white text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">All Boards</option>
                {availableBoards.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Layers className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={filters.grade}
                onChange={(e) => setFilters(prev => ({ ...prev, grade: e.target.value }))}
                className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl bg-white text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer disabled:opacity-50"
              >
                <option value="">All Classes</option>
                {filteredClasses.map(c => (
                  <option key={c.id} value={c.name}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <select
                value={filters.noteType}
                onChange={(e) => setFilters(prev => ({ ...prev, noteType: e.target.value }))}
                className="w-full pl-9 pr-3 py-3 border border-slate-200 rounded-xl bg-white text-sm font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="">All Types</option>
                {NOTE_TYPES.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>
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

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Main Notes Grid */}
        <div className="lg:col-span-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {currentNotes.map(note => (
              <div key={note.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm hover:shadow-lg transition-all group cursor-pointer">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                    <FileText size={24} />
                  </div>
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 text-[10px] font-bold uppercase tracking-widest rounded-full">{note.grade}</span>
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-1">{note.title}</h3>
                <p className="text-sm text-slate-500 mb-6">
                  {note.subject}
                  {note.noteType ? ` • ${note.noteType}` : ''}
                  {note.board ? ` • ${note.board}` : ''}
                  {note.book ? ` • ${note.book}` : ''}
                  {' • '}By {note.author}
                </p>
                <div className="flex justify-between items-center border-t border-slate-50 pt-4">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-rose-50 text-rose-600 rounded-lg text-xs font-black uppercase tracking-wider border border-rose-100">
                    <FileText size={14} /> PDF Resource
                  </span>
                  <a 
                    href={note.fileUrl} 
                    target={note.fileUrl?.includes('drive.google.com') || note.fileUrl?.startsWith('http') ? '_blank' : '_self'} 
                    rel="noreferrer"
                    download={!note.fileUrl?.includes('drive.google.com')}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider shadow-sm transition-all"
                  >
                    <Download size={14} /> {note.fileUrl?.includes('drive.google.com') ? 'View / Download PDF' : 'Download PDF'}
                  </a>
                </div>
              </div>
            ))}
            {currentNotes.length === 0 && (
                <div className="col-span-full py-12 text-center text-gray-400 bg-white rounded-2xl border border-slate-100">
                   <FileText size={48} className="mx-auto mb-4 opacity-20"/>
                   <p>No notes found matching your search.</p>
                </div>
            )}
          </div>
        </div>

        {/* Right Side Box: Recent 5 Added Notes */}
        <div className="lg:col-span-1">
          <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl sticky top-6">
            <div className="flex items-center gap-2 border-b border-slate-800 pb-4 mb-5">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="text-base font-black text-white uppercase tracking-wider">Recently Added Notes</h3>
            </div>

            <div className="space-y-4">
              {recentFiveNotes.map((recent, idx) => (
                <div key={recent.id || idx} className="p-3.5 bg-slate-800/60 hover:bg-slate-800 rounded-2xl border border-slate-700/60 transition-all group">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                      {recent.grade || 'General'}
                    </span>
                    <span className="text-[10px] text-slate-400 font-bold">{recent.subject}</span>
                  </div>
                  <h4 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-1">{recent.title}</h4>
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

              {recentFiveNotes.length === 0 && (
                <p className="text-xs text-slate-500 italic text-center py-6">No recent notes found.</p>
              )}
            </div>
          </div>
        </div>
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
