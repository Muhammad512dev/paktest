
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

  const filteredClasses = useMemo(() => {
    return curriculum.classes.filter(c => !filters.board || c.syllabusId === filters.board);
  }, [curriculum.classes, filters.board]);

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
            <span className="text-sm font-bold text-slate-500 whitespace-nowrap">Filters:</span>
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
                {curriculum.syllabuses.map(s => (
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
                {(filters.board ? filteredClasses : curriculum.classes).map(c => (
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
            <p className="text-sm text-slate-500 mb-6">
              {note.subject}
              {note.noteType ? ` • ${note.noteType}` : ''}
              {note.board ? ` • ${note.board}` : ''}
              {note.book ? ` • ${note.book}` : ''}
              {' • '}By {note.author}
            </p>
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
