import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Search, BookOpen, ExternalLink, ChevronDown, Check, Filter, Layers, X } from 'lucide-react';
import { getNotes, getPublicCurriculum } from '../../services/dataService';
import { Syllabus, ClassLevel } from '../../types';

const Books: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [curriculum, setCurriculum] = useState<{ syllabuses: Syllabus[]; classes: ClassLevel[] }>({
    syllabuses: [],
    classes: []
  });

  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [selectedGrade, setSelectedGrade] = useState<string>('');
  const [isClassDropdownOpen, setIsClassDropdownOpen] = useState(false);
  const [selectedBookModal, setSelectedBookModal] = useState<any | null>(null);
  const classDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (classDropdownRef.current && !classDropdownRef.current.contains(e.target as Node)) {
        setIsClassDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      setIsLoading(true);
      setError(null);
      try {
        const data = await getNotes({
          search: searchTerm,
          board: selectedBoard,
          grade: selectedGrade,
          noteType: 'Textbook'
        });
        setBooks(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || 'Failed to fetch books. Please try again.');
        setBooks([]);
      } finally {
        setIsLoading(false);
      }
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm, selectedBoard, selectedGrade]);

  // Extract deduplicated boards
  const availableBoards = useMemo(() => {
    const list: { id: string; name: string }[] = [];
    if (curriculum.syllabuses.length > 0) {
      curriculum.syllabuses.forEach(s => {
        if (s.name && !list.some(b => b.name.trim().toLowerCase() === s.name.trim().toLowerCase())) {
          list.push({ id: s.name.trim(), name: s.name.trim() });
        }
      });
    }
    books.forEach(b => {
      if (b.board && b.board.trim() && !list.some(item => item.name.toLowerCase() === b.board.trim().toLowerCase())) {
        list.push({ id: b.board.trim(), name: b.board.trim() });
      }
    });
    return list;
  }, [curriculum.syllabuses, books]);

  // Extract deduplicated and sorted classes
  const availableClasses = useMemo(() => {
    const classSet = new Set<string>();

    // From database books
    books.forEach(b => {
      if (b.grade && String(b.grade).trim()) {
        classSet.add(String(b.grade).trim());
      }
    });

    // From curriculum setup
    if (curriculum.classes.length > 0) {
      curriculum.classes.forEach(c => {
        if (c.name && c.name.trim()) {
          classSet.add(c.name.trim());
        }
      });
    }

    // Default common Pakistani classes if list is empty
    if (classSet.size === 0) {
      ['Pre-1', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', '9-10', '11-12'].forEach(c => classSet.add(c));
    }

    // Custom sort: Pre-1, 1..12, compound
    return Array.from(classSet).sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
      if (a.toLowerCase().includes('pre')) return -1;
      if (b.toLowerCase().includes('pre')) return 1;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
  }, [curriculum.classes, books]);

  // Dynamic URL Sync effect for Books
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const board = params.get('board') || '';
      const grade = params.get('grade') || '';
      const bookId = params.get('bookId');

      setSelectedBoard(board);
      setSelectedGrade(grade);

      if (bookId && books.length > 0) {
        const found = books.find(b => String(b.id) === String(bookId));
        if (found) setSelectedBookModal(found);
      } else if (!bookId) {
        setSelectedBookModal(null);
      }
    };

    handlePopState();
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [books]);

  const updateRouteUrl = (newBoard: string, newGrade: string = selectedGrade, bookId?: string) => {
    setSelectedBoard(newBoard);
    setSelectedGrade(newGrade);

    const params = new URLSearchParams();
    if (newBoard) params.set('board', newBoard);
    if (newGrade) params.set('grade', newGrade);
    if (bookId) params.set('bookId', bookId);

    const queryString = params.toString();
    const newPath = queryString ? `/books?${queryString}` : '/books';
    window.history.pushState(null, '', newPath);
  };

  const handleOpenBook = (book: any, openInNewTab = false) => {
    if (openInNewTab) {
      const params = new URLSearchParams();
      if (book.board) params.set('board', book.board);
      if (book.grade) params.set('grade', book.grade);
      params.set('bookId', book.id);
      window.open(`/books?${params.toString()}`, '_blank');
    } else {
      setSelectedBookModal(book);
      updateRouteUrl(selectedBoard, selectedGrade, book.id);
    }
  };

  const closeBookModal = () => {
    setSelectedBookModal(null);
    updateRouteUrl(selectedBoard, selectedGrade);
  };

  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      if (selectedBoard && b.board && b.board.trim().toLowerCase() !== selectedBoard.trim().toLowerCase()) return false;
      if (selectedGrade && b.grade) {
        const bg = String(b.grade).trim().toLowerCase();
        const sg = selectedGrade.trim().toLowerCase();
        if (bg !== sg && !bg.includes(sg)) return false;
      }
      return true;
    });
  }, [books, selectedBoard, selectedGrade]);

  return (
    <div className="py-6 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span className="cursor-pointer hover:text-indigo-600" onClick={() => updateRouteUrl('', '')}>Books & Key Books</span>
          {selectedBoard && <span>/</span>}
          {selectedBoard && <span className="text-slate-900 font-bold">{selectedBoard}</span>}
          {selectedGrade && <span>/</span>}
          {selectedGrade && <span className="text-indigo-600 font-bold">Class {selectedGrade}</span>}
          {selectedBookModal && <span>/</span>}
          {selectedBookModal && <span className="text-indigo-600 font-bold line-clamp-1">{selectedBookModal.title}</span>}
        </div>

        {selectedBookModal ? (
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                {selectedBookModal.board || 'TEXTBOOK'}
              </span>
              {selectedBookModal.grade && (
                <span className="text-xs font-black text-emerald-600 uppercase tracking-widest bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                  Class {selectedBookModal.grade}
                </span>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2 leading-tight">
              {selectedBookModal.title}
            </h1>
          </div>
        ) : (
          <div className="text-center py-4">
            <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 inline-block relative">
              <span className="text-indigo-600 border-b-4 border-indigo-600 pb-1">Books</span> & Key Books
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 max-w-xl mx-auto font-medium">
              Official board textbooks, syllabus guidebooks, and curriculum key reference books.
            </p>
          </div>
        )}
      </div>

      {selectedBookModal ? (
        /* Single Book View */
        <div className="space-y-6">
          <div className="bg-slate-50 p-5 sm:p-6 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest">Book Information & Summary</h3>
              <button 
                onClick={closeBookModal}
                className="px-3 sm:px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                ← Back to Books
              </button>
            </div>
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed whitespace-pre-line font-medium">
              {selectedBookModal.description || `Official textbook and curriculum material for ${selectedBookModal.title}. Curated and distributed according to the ${selectedBookModal.board || 'standard educational'} board guidelines.`}
            </p>
          </div>

          {selectedBookModal.fileUrl ? (
            <div className="bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 shadow-2xl border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center font-bold shrink-0">
                    <BookOpen size={22} />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white line-clamp-1">{selectedBookModal.title}</h4>
                    <p className="text-[11px] text-slate-400">PDF Textbook • {selectedBookModal.board || 'Official Board'}</p>
                  </div>
                </div>
                
                <a
                  href={selectedBookModal.fileUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-lg hover:scale-105"
                >
                  <span>Open Drive Link</span>
                  <span>➔</span>
                </a>
              </div>

              <div className="w-full h-[500px] sm:h-[650px] bg-slate-950 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-800">
                <iframe
                  src={selectedBookModal.fileUrl?.includes('drive.google.com') ? selectedBookModal.fileUrl.replace('/view', '/preview') : selectedBookModal.fileUrl}
                  className="w-full h-full border-0"
                  title="PDF Textbook Viewer"
                />
              </div>
            </div>
          ) : (
            <div className="p-8 sm:p-12 text-center bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl sm:rounded-3xl font-bold">
              PDF preview link is not attached to this book.
            </div>
          )}
        </div>
      ) : (
        /* Books Catalog, Board Selection & Class Dropdown Menu */
        <div className="space-y-6">
          {/* Top Bar: Board Selector & Class Filter Menu */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-50/80 p-4 sm:p-5 rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm">
            {/* Board Selector */}
            <div className="space-y-2 flex-1">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">Board / Syllabus:</h2>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => updateRouteUrl('')}
                  className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                    !selectedBoard ? 'bg-indigo-600 text-white shadow-indigo-200 scale-105' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  ALL BOARDS
                </button>
                {availableBoards.map(board => (
                  <button
                    key={board.id}
                    onClick={() => updateRouteUrl(board.name)}
                    className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition-all shadow-sm ${
                      selectedBoard.toLowerCase() === board.name.toLowerCase() ? 'bg-indigo-600 text-white shadow-indigo-200 scale-105' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {board.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Class Filter Dropdown Menu */}
            <div className="relative shrink-0" ref={classDropdownRef}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Filter By Class:</h2>
              <button
                type="button"
                onClick={() => setIsClassDropdownOpen(!isClassDropdownOpen)}
                className={`w-full sm:w-56 flex items-center justify-between gap-2 px-4 py-2.5 rounded-xl text-xs font-bold border transition-all shadow-sm ${
                  selectedGrade 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-emerald-100' 
                    : 'bg-white text-slate-700 border-slate-300 hover:border-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Layers size={15} />
                  <span>{selectedGrade ? `Class: ${selectedGrade}` : 'All Classes / Grades'}</span>
                </div>
                <ChevronDown size={16} className={`transition-transform duration-200 ${isClassDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {/* Class Dropdown Menu Modal / Panel */}
              {isClassDropdownOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-3 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-1">
                    <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">Select Class</span>
                    {selectedGrade && (
                      <button 
                        onClick={() => { updateRouteUrl(selectedBoard, ''); setIsClassDropdownOpen(false); }}
                        className="text-[11px] font-bold text-red-500 hover:text-red-700"
                      >
                        Clear Filter
                      </button>
                    )}
                  </div>

                  <div className="max-h-60 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                    <button
                      onClick={() => { updateRouteUrl(selectedBoard, ''); setIsClassDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                        !selectedGrade ? 'bg-indigo-50 text-indigo-700 font-black' : 'text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <span>All Classes</span>
                      {!selectedGrade && <Check size={14} className="text-indigo-600" />}
                    </button>

                    {availableClasses.map(cls => (
                      <button
                        key={cls}
                        onClick={() => { updateRouteUrl(selectedBoard, cls); setIsClassDropdownOpen(false); }}
                        className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-between transition-colors ${
                          selectedGrade.toLowerCase() === cls.toLowerCase() 
                            ? 'bg-emerald-50 text-emerald-700 font-black' 
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>Class {cls}</span>
                        {selectedGrade.toLowerCase() === cls.toLowerCase() && (
                          <Check size={14} className="text-emerald-600" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Search bar & Active Filter Badges */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search books by title, subject, or author..." 
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
              {selectedBoard && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold">
                  <span>Board: {selectedBoard}</span>
                  <X size={13} className="cursor-pointer hover:text-indigo-900" onClick={() => updateRouteUrl('', selectedGrade)} />
                </span>
              )}

              {selectedGrade && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold">
                  <span>Class {selectedGrade}</span>
                  <X size={13} className="cursor-pointer hover:text-emerald-900" onClick={() => updateRouteUrl(selectedBoard, '')} />
                </span>
              )}

              {(selectedBoard || selectedGrade || searchTerm) && (
                <button 
                  onClick={() => { setSearchTerm(''); updateRouteUrl('', ''); }} 
                  className="w-full sm:w-auto px-3.5 py-1.5 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Book Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {filteredBooks.map((book) => (
              <div
                key={book.id}
                onClick={() => handleOpenBook(book, false)}
                className="p-5 sm:p-6 bg-white rounded-2xl border border-slate-200 hover:border-indigo-400 shadow-sm hover:shadow-xl transition-all flex flex-col justify-between text-center group cursor-pointer relative"
              >
                <div>
                  <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 mx-auto group-hover:scale-110 transition-transform">
                    <BookOpen size={24} />
                  </div>
                  <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors line-clamp-2">
                    {book.title}
                  </h3>

                  <div className="flex flex-wrap items-center justify-center gap-1.5 mt-2">
                    {book.grade && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-md">
                        Class {book.grade}
                      </span>
                    )}
                    {book.board && (
                      <span className="text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md">
                        {book.board}
                      </span>
                    )}
                  </div>

                  {book.description && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 font-medium">
                      {book.description}
                    </p>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center gap-3">
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenBook(book, false); }}
                    className="inline-flex items-center gap-1 text-xs font-black text-indigo-600 hover:underline"
                  >
                    <span>Read Book</span>
                  </button>
                  <span className="text-slate-300">•</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleOpenBook(book, true); }}
                    className="inline-flex items-center gap-1 text-xs font-black text-emerald-600 hover:underline"
                    title="Open in new browser tab with direct URL"
                  >
                    <span>New Tab</span>
                    <ExternalLink size={12} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {isLoading && (
            <div className="flex justify-center items-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          )}

          {!isLoading && error && (
            <div className="text-center py-12 bg-red-50 rounded-xl border border-red-100">
              <div className="text-red-500 mb-2 font-semibold">Oops!</div>
              <p className="text-red-600">{error}</p>
              <button onClick={() => window.location.reload()} className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors">
                Retry
              </button>
            </div>
          )}

          {!isLoading && !error && filteredBooks.length === 0 && (
            <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
              <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-slate-600">No books found for this class or board filter.</p>
              <button onClick={() => updateRouteUrl('', '')} className="mt-4 text-xs font-bold text-indigo-600 hover:underline">
                View all books
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Books;
