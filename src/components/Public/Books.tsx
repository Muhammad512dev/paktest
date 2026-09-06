import React, { useState, useEffect, useMemo } from 'react';
import { Search, BookOpen, ExternalLink } from 'lucide-react';
import { getNotes, getPublicCurriculum } from '../../services/dataService';
import { Syllabus, ClassLevel } from '../../types';

const Books: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [books, setBooks] = useState<any[]>([]);
  const [curriculum, setCurriculum] = useState<{ syllabuses: Syllabus[]; classes: ClassLevel[] }>({
    syllabuses: [],
    classes: []
  });

  const [selectedBoard, setSelectedBoard] = useState<string>('');
  const [selectedBookModal, setSelectedBookModal] = useState<any | null>(null);

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
        board: selectedBoard,
        noteType: 'Textbook'
      });
      setBooks(Array.isArray(data) ? data : []);
    }, 250);
    return () => clearTimeout(t);
  }, [searchTerm, selectedBoard]);

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

  // Dynamic URL Sync effect for Books
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const board = params.get('board') || '';
      const bookId = params.get('bookId');

      setSelectedBoard(board);

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

  const updateRouteUrl = (newBoard: string, bookId?: string) => {
    setSelectedBoard(newBoard);

    const params = new URLSearchParams();
    if (newBoard) params.set('board', newBoard);
    if (bookId) params.set('bookId', bookId);

    const queryString = params.toString();
    const newPath = queryString ? `/books?${queryString}` : '/books';
    window.history.pushState(null, '', newPath);
  };

  const handleOpenBook = (book: any, openInNewTab = false) => {
    if (openInNewTab) {
      const params = new URLSearchParams();
      if (book.board) params.set('board', book.board);
      params.set('bookId', book.id);
      window.open(`/books?${params.toString()}`, '_blank');
    } else {
      setSelectedBookModal(book);
      updateRouteUrl(selectedBoard, book.id);
    }
  };

  const closeBookModal = () => {
    setSelectedBookModal(null);
    updateRouteUrl(selectedBoard);
  };

  const filteredBooks = useMemo(() => {
    return books.filter(b => {
      if (selectedBoard && b.board && b.board.trim().toLowerCase() !== selectedBoard.trim().toLowerCase()) return false;
      return true;
    });
  }, [books, selectedBoard]);

  return (
    <div className="py-6 sm:py-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6 sm:space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          <span className="cursor-pointer hover:text-indigo-600" onClick={() => updateRouteUrl('')}>Books & Key Books</span>
          {selectedBoard && <span>/</span>}
          {selectedBoard && <span className="text-slate-900 font-bold">{selectedBoard}</span>}
          {selectedBookModal && <span>/</span>}
          {selectedBookModal && <span className="text-indigo-600 font-bold line-clamp-1">{selectedBookModal.title}</span>}
        </div>

        {selectedBookModal ? (
          <div>
            <span className="text-xs font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
              {selectedBookModal.board || 'TEXTBOOK'}
            </span>
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
        /* Books Catalog & Board Selection */
        <div className="space-y-6">
          {/* Board Selector */}
          <div className="space-y-3">
            <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">Filter by Educational Board / Syllabus:</h2>
            <div className="flex flex-wrap gap-2.5 sm:gap-3">
              <button
                onClick={() => updateRouteUrl('')}
                className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm ${
                  !selectedBoard ? 'bg-indigo-600 text-white shadow-indigo-200 scale-105' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                ALL BOARDS
              </button>
              {availableBoards.map(board => (
                <button
                  key={board.id}
                  onClick={() => updateRouteUrl(board.name)}
                  className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm transition-all shadow-sm ${
                    selectedBoard.toLowerCase() === board.name.toLowerCase() ? 'bg-indigo-600 text-white shadow-indigo-200 scale-105' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {board.name}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row gap-3 justify-between items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text" 
                placeholder="Search books by title..." 
                className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            {selectedBoard && (
              <button 
                onClick={() => updateRouteUrl('')} 
                className="w-full sm:w-auto px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl text-xs font-bold uppercase tracking-wider transition-all"
              >
                Clear Board Filter
              </button>
            )}
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
                  {book.board && (
                    <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md">
                      {book.board}
                    </span>
                  )}
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

          {filteredBooks.length === 0 && (
            <div className="py-16 text-center text-slate-400 bg-white rounded-3xl border border-slate-200">
              <BookOpen size={48} className="mx-auto mb-3 opacity-20" />
              <p className="font-bold text-slate-600">No books uploaded yet for this selection.</p>
              <button onClick={() => updateRouteUrl('')} className="mt-4 text-xs font-bold text-indigo-600 hover:underline">
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
