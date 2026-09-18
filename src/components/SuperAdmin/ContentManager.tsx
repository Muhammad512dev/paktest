import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  getBlogs, addBlog, updateBlog, deleteBlog,
  getNotes, addNote, updateNote, deleteNote,
  getPastPapers, addPastPaper, updatePastPaper, deletePastPaper, uploadFile,
  getPublicCurriculum
} from '../../services/dataService';
import { 
  Plus, Trash2, Edit2, X, FileText, Upload, BookOpen, Clock, 
  Calendar, CheckSquare, Image as ImageIcon, Download, 
  FileSpreadsheet, AlertTriangle, CheckCircle, HelpCircle, Layers, ExternalLink,
  Search, ChevronLeft, ChevronRight
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Syllabus, ClassLevel } from '../../types';

const ContentManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BLOG' | 'NOTES' | 'LESSON_PLANS' | 'BOOKS' | 'PAPERS'>('BLOG');
  const [items, setItems] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any | null>(null);
  
  // Search & Pagination State (20, 40, 100, 'all')
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeFilter, setSelectedGradeFilter] = useState('');
  const [pageSize, setPageSize] = useState<string>('20');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [userCustomLimit, setUserCustomLimit] = useState<boolean>(false);
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importReport, setImportReport] = useState<{
    total: number;
    success: number;
    failed: number;
    missingClasses: string[];
    errors: string[];
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [curriculum, setCurriculum] = useState<{ syllabuses: Syllabus[]; classes: ClassLevel[] }>({ syllabuses: [], classes: [] });
  
  // Forms State
  const [blogForm, setBlogForm] = useState({ title: '', excerpt: '', content: '', category: 'EdTech', author: '', image: '' });
  const [noteForm, setNoteForm] = useState({ title: '', subject: '', grade: '', board: '', noteType: '', resource: '', book: '', author: '', fileUrl: '', description: '' });
  const [paperForm, setPaperForm] = useState({ title: '', year: new Date().getFullYear(), board: '', level: '', subject: '', resource: '', fileUrl: '' });
  const [bookForm, setBookForm] = useState({ title: '', board: '', grade: '', subject: '', fileUrl: '', description: '' });

  useEffect(() => {
    const loadCurriculum = async () => {
      try {
        const data = await getPublicCurriculum();
        setCurriculum({ syllabuses: data?.syllabuses || [], classes: data?.classes || [] });
      } catch (_) {}
    };
    loadCurriculum();
  }, []);

  const loadData = async () => {
    let data = [];
    if (activeTab === 'BLOG') data = await getBlogs();
    else if (activeTab === 'NOTES') data = await getNotes();
    else if (activeTab === 'LESSON_PLANS') data = await getNotes({ noteType: 'Lesson Plan' });
    else if (activeTab === 'BOOKS') data = await getNotes({ noteType: 'Textbook' });
    else if (activeTab === 'PAPERS') data = (await getPastPapers({ pageSize: 1000 })).data;
    setItems(data);
  };

  useEffect(() => {
    loadData();
    setCurrentPage(1);
  }, [activeTab]);

  // Extract unique classes present in current items
  const availableItemClasses = useMemo(() => {
    const set = new Set<string>();
    items.forEach(it => {
      const g = it.grade || it.level;
      if (g && String(g).trim()) set.add(String(g).trim());
    });
    return Array.from(set).sort((a, b) => {
      const numA = parseInt(a.replace(/[^0-9]/g, '')) || 0;
      const numB = parseInt(b.replace(/[^0-9]/g, '')) || 0;
      if (numA !== numB) return numA - numB;
      return a.localeCompare(b);
    });
  }, [items]);

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (selectedGradeFilter) {
        const g = String(item.grade || item.level || '').trim().toLowerCase();
        if (g !== selectedGradeFilter.toLowerCase()) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const t = String(item.title || '').toLowerCase();
        const s = String(item.subject || '').toLowerCase();
        const b = String(item.board || '').toLowerCase();
        const a = String(item.author || '').toLowerCase();
        const d = String(item.description || item.excerpt || '').toLowerCase();
        if (!t.includes(q) && !s.includes(q) && !b.includes(q) && !a.includes(q) && !d.includes(q)) {
          return false;
        }
      }
      return true;
    });
  }, [items, selectedGradeFilter, searchQuery]);

  const isFiltered = Boolean(selectedGradeFilter || searchQuery.trim());

  useEffect(() => {
    if (!userCustomLimit) {
      if (isFiltered) {
        setPageSize('all');
      } else {
        setPageSize('20');
      }
    }
    setCurrentPage(1);
  }, [selectedGradeFilter, searchQuery, isFiltered, userCustomLimit]);

  const totalFilteredCount = filteredItems.length;
  const numericLimit = pageSize === 'all' ? totalFilteredCount : parseInt(pageSize, 10);
  const totalPages = Math.max(1, Math.ceil(totalFilteredCount / (numericLimit || 20)));

  const paginatedItems = useMemo(() => {
    if (pageSize === 'all') return filteredItems;
    const start = (currentPage - 1) * numericLimit;
    return filteredItems.slice(start, start + numericLimit);
  }, [filteredItems, pageSize, currentPage, numericLimit]);

  const handlePageSizeChange = (val: string) => {
    setPageSize(val);
    setUserCustomLimit(true);
    setCurrentPage(1);
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setBlogForm({ title: '', excerpt: '', content: '', category: 'EdTech', author: '', image: '' });
    setNoteForm({ title: '', subject: '', grade: '', board: '', noteType: '', resource: '', book: '', author: '', fileUrl: '', description: '' });
    setBookForm({ title: '', board: '', grade: '', subject: '', fileUrl: '', description: '' });
    setPaperForm({ title: '', year: new Date().getFullYear(), board: '', level: '', subject: '', resource: '', fileUrl: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (item: any) => {
    setEditingItem(item);
    if (activeTab === 'BLOG') {
      setBlogForm({
        title: item.title || '',
        excerpt: item.excerpt || '',
        content: item.content || '',
        category: item.category || 'EdTech',
        author: item.author || '',
        image: item.image || ''
      });
    } else if (activeTab === 'BOOKS') {
      setBookForm({
        title: item.title || '',
        board: item.board || '',
        grade: item.grade || '',
        subject: item.subject || '',
        fileUrl: item.fileUrl || '',
        description: item.description || ''
      });
    } else if (activeTab === 'NOTES' || activeTab === 'LESSON_PLANS') {
      setNoteForm({
        title: item.title || '',
        subject: item.subject || '',
        grade: item.grade || '',
        board: item.board || '',
        noteType: item.noteType || (activeTab === 'LESSON_PLANS' ? 'Lesson Plan' : 'Book Notes'),
        resource: item.resource || '',
        book: item.book || '',
        author: item.author || '',
        fileUrl: item.fileUrl || '',
        description: item.description || ''
      });
    } else if (activeTab === 'PAPERS') {
      setPaperForm({
        title: item.title || '',
        year: item.year || new Date().getFullYear(),
        board: item.board || '',
        level: item.level || '',
        subject: item.subject || '',
        resource: item.resource || '',
        fileUrl: item.fileUrl || ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    try {
      if (activeTab === 'BLOG') {
         if (!blogForm.title) return alert("Title is required");
         if (editingItem) {
           await updateBlog(editingItem.id, { ...blogForm });
         } else {
           await addBlog({ ...blogForm, date: new Date(), readTime: '5 min read' });
         }
         setBlogForm({ title: '', excerpt: '', content: '', category: 'EdTech', author: '', image: '' });
      } else if (activeTab === 'NOTES' || activeTab === 'LESSON_PLANS') {
         if (!noteForm.title) return alert("Title is required");
         const payload = {
           ...noteForm,
           noteType: activeTab === 'LESSON_PLANS' ? 'Lesson Plan' : (noteForm.noteType || 'Book Notes')
         };
         if (editingItem) {
           await updateNote(editingItem.id, payload);
         } else {
           await addNote(payload);
         }
         setNoteForm({ title: '', subject: '', grade: '', board: '', noteType: '', resource: '', book: '', author: '', fileUrl: '', description: '' });
      } else if (activeTab === 'BOOKS') {
         if (!bookForm.title) return alert("Book title is required");
         const payload = {
           title: bookForm.title,
           board: bookForm.board,
           grade: bookForm.grade,
           subject: bookForm.subject,
           fileUrl: bookForm.fileUrl,
           description: bookForm.description,
           noteType: 'Textbook'
         };
         if (editingItem) {
           await updateNote(editingItem.id, payload);
         } else {
           await addNote(payload);
         }
         setBookForm({ title: '', board: '', grade: '', subject: '', fileUrl: '', description: '' });
      } else {
         if (!paperForm.title) return alert("Paper title is required");
         const { resource, ...cleanPaperData } = paperForm;
         const payload = { ...cleanPaperData, year: parseInt(paperForm.year as any) };
         if (editingItem) {
           await updatePastPaper(editingItem.id, payload);
         } else {
           await addPastPaper(payload);
         }
         setPaperForm({ title: '', year: new Date().getFullYear(), board: '', level: '', subject: '', resource: '', fileUrl: '' });
      }
      setIsModalOpen(false);
      setEditingItem(null);
      await loadData();
    } catch (err: any) {
      alert(`Failed to save: ${err.message || 'Unknown error'}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    if (activeTab === 'BLOG') await deleteBlog(id);
    else if (activeTab === 'NOTES' || activeTab === 'LESSON_PLANS' || activeTab === 'BOOKS') await deleteNote(id);
    else await deletePastPaper(id);
    loadData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    if (e.target.files && e.target.files[0]) {
      try {
        const url = await uploadFile(e.target.files[0]);
        if (activeTab === 'BLOG') setBlogForm({ ...blogForm, image: url });
        else if (activeTab === 'BOOKS') setBookForm({ ...bookForm, fileUrl: url });
        else if (activeTab === 'NOTES' || activeTab === 'LESSON_PLANS') setNoteForm({ ...noteForm, fileUrl: url });
        else setPaperForm({ ...paperForm, fileUrl: url });
      } catch (err) {
        alert("File upload failed");
      }
    }
  };

  // ─── CSV / EXCEL TEMPLATE GENERATION ─────────────────────────────────────────
  const handleDownloadTemplate = () => {
    let template: any[] = [];
    let filename = `Import_${activeTab}_Template.xlsx`;

    if (activeTab === 'BOOKS') {
      template = [
        {
          "Title": "Mathematics 9 (EM)",
          "Subject": "Mathematics",
          "Grade": "9",
          "Board": "PCTB (Punjab Curriculum & Textbook Board)",
          "FileURL": "https://drive.google.com/file/d/1uB6C5v9C4x2P7b2yY7T1a5qZ1wV5c7e/preview",
          "Description": "Official PCTB Mathematics 9 (Science Group - English Medium) Textbook."
        },
        {
          "Title": "Physics 9 (EM)",
          "Subject": "Physics",
          "Grade": "9",
          "Board": "PCTB (Punjab Curriculum & Textbook Board)",
          "FileURL": "https://drive.google.com/file/d/1zG1H0v4C9x7P2b7yD2T6a0qZ6wV0c2e/preview",
          "Description": "Official PCTB Physics 9 (English Medium) Textbook."
        }
      ];
    } else if (activeTab === 'NOTES' || activeTab === 'LESSON_PLANS') {
      template = [
        {
          "Title": "Chapter 1 Physical Quantities Notes",
          "Subject": "Physics",
          "Grade": "9",
          "Board": "Punjab Board",
          "NoteType": activeTab === 'LESSON_PLANS' ? "Lesson Plan" : "Book Notes",
          "FileURL": "https://drive.google.com/file/d/.../preview",
          "Description": "Complete solved short questions and numerical problems."
        }
      ];
    } else if (activeTab === 'PAPERS') {
      template = [
        {
          "Title": "Physics 9th Annual Group 1 2024",
          "Subject": "Physics",
          "Level": "9",
          "Board": "BISE Lahore",
          "Year": 2024,
          "FileURL": "https://drive.google.com/file/d/.../preview"
        }
      ];
    } else if (activeTab === 'BLOG') {
      template = [
        {
          "Title": "Top Study Tips for Board Exam Preparation 2026",
          "Category": "EdTech",
          "Author": "PakParcha AI Team",
          "Excerpt": "Discover proven strategies to ace your annual matric & inter exams.",
          "Content": "<h2>Introduction</h2><p>Here are effective tips...</p>",
          "Image": "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800"
        }
      ];
    }

    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");

    if (curriculum.classes.length > 0 || curriculum.syllabuses.length > 0) {
      const refData = curriculum.classes.map(c => ({
        "Available Grade / Class": c.name,
        "System ID": c.id
      }));
      const wsRef = XLSX.utils.json_to_sheet(refData);
      XLSX.utils.book_append_sheet(wb, wsRef, "Classes_Reference");
    }

    XLSX.writeFile(wb, filename);
  };

  // ─── CSV / EXCEL IMPORT HANDLER ─────────────────────────────────────────────
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      setIsImporting(true);
      setImportReport(null);

      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const rows: any[] = XLSX.utils.sheet_to_json(ws);

        if (!rows || rows.length === 0) {
          alert("The uploaded file is empty!");
          setIsImporting(false);
          return;
        }

        let successCount = 0;
        let failCount = 0;
        const missingClassSet = new Set<string>();
        const errorList: string[] = [];

        const validClassNames = new Set(
          curriculum.classes.map(c => c.name.trim().toLowerCase().replace(/^(class|grade)\s*/i, ''))
        );

        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const rowNum = i + 2;

          const title = row.Title || row.title || row.Name || row.name;
          const subject = row.Subject || row.subject || '';
          const grade = String(row.Grade || row.grade || row.Class || row.class || row.Level || row.level || '').trim();
          const board = row.Board || row.board || row.Syllabus || row.syllabus || 'PCTB (Punjab Curriculum & Textbook Board)';
          const fileUrl = row.FileURL || row.FileUrl || row.fileUrl || row.Link || row.link || row.URL || row.url || '';
          const description = row.Description || row.description || row.Excerpt || row.excerpt || '';
          const noteType = row.NoteType || row.noteType || (activeTab === 'BOOKS' ? 'Textbook' : activeTab === 'LESSON_PLANS' ? 'Lesson Plan' : 'Book Notes');
          const year = parseInt(row.Year || row.year || new Date().getFullYear());

          if (!title) {
            failCount++;
            errorList.push(`Row #${rowNum}: Title is missing.`);
            continue;
          }

          if (grade) {
            const cleanGrade = grade.toLowerCase().replace(/^(class|grade)\s*/i, '');
            if (curriculum.classes.length > 0 && !validClassNames.has(cleanGrade) && !validClassNames.has(grade.toLowerCase())) {
              missingClassSet.add(grade);
            }
          }

          try {
            if (activeTab === 'BLOG') {
              await addBlog({
                title,
                category: row.Category || row.category || 'General',
                author: row.Author || row.author || 'Admin',
                excerpt: description,
                content: row.Content || row.content || description || `<p>${title}</p>`,
                image: row.Image || row.image || fileUrl,
                date: new Date(),
                readTime: '5 min read'
              });
            } else if (activeTab === 'PAPERS') {
              await addPastPaper({
                title,
                subject,
                level: grade,
                board,
                year: isNaN(year) ? new Date().getFullYear() : year,
                fileUrl
              });
            } else {
              await addNote({
                title,
                subject,
                grade: grade || '9',
                board,
                noteType: activeTab === 'BOOKS' ? 'Textbook' : activeTab === 'LESSON_PLANS' ? 'Lesson Plan' : noteType,
                fileUrl,
                description,
                book: title,
                author: board
              });
            }
            successCount++;
          } catch (itemErr: any) {
            failCount++;
            errorList.push(`Row #${rowNum} ("${title}"): ${itemErr.message || 'Failed to insert'}`);
          }
        }

        setImportReport({
          total: rows.length,
          success: successCount,
          failed: failCount,
          missingClasses: Array.from(missingClassSet),
          errors: errorList.slice(0, 10)
        });

        await loadData();
      } catch (parseErr: any) {
        alert(`Failed to parse file: ${parseErr.message}`);
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };

    reader.readAsBinaryString(file);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header with Add & Excel/CSV Import Buttons */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Content CMS</h1>
          <p className="text-sm text-gray-500 mt-1">Manage public-facing resources, edit items & bulk upload data</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Download Excel / CSV Template */}
          <button 
            onClick={handleDownloadTemplate} 
            className="bg-white border border-gray-300 text-gray-700 px-3.5 py-2 rounded-xl font-bold hover:bg-gray-50 hover:border-gray-400 flex items-center gap-2 text-sm shadow-sm transition-all"
            title="Download formatted Excel template"
          >
            <Download size={16} className="text-gray-500" /> Download Template
          </button>

          {/* Import Excel / CSV Button */}
          <button 
            onClick={() => setIsImportModalOpen(true)} 
            className="bg-emerald-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-emerald-700 flex items-center gap-2 text-sm shadow-sm shadow-emerald-200 transition-all"
          >
            <FileSpreadsheet size={16} /> Import Excel / CSV
          </button>

          {/* Add Single Item Modal */}
          <button 
            onClick={handleOpenAddModal} 
            className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-bold hover:bg-indigo-700 flex items-center gap-2 text-sm shadow-sm shadow-indigo-200 transition-all"
          >
            <Plus size={18} /> Add {activeTab === 'BLOG' ? 'Post' : activeTab === 'NOTES' ? 'Note' : activeTab === 'LESSON_PLANS' ? 'Lesson Plan' : activeTab === 'BOOKS' ? 'Book' : 'Paper'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-6 flex-wrap">
        {['BLOG', 'NOTES', 'LESSON_PLANS', 'BOOKS', 'PAPERS'].map(tab => (
          <button 
            key={tab} 
            onClick={() => {
              setActiveTab(tab as any);
              setImportReport(null);
            }}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tab === 'BLOG' ? 'Blog Posts' : tab === 'NOTES' ? 'Study Notes' : tab === 'LESSON_PLANS' ? 'Lesson Plans' : tab === 'BOOKS' ? 'Textbooks & Key Books' : 'Past Papers'}
          </button>
        ))}
      </div>

      {/* Search, Filter & Display Limit Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder={`Search ${activeTab.toLowerCase().replace('_', ' ')} by title, subject, board...`} 
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Class Filter if available */}
          {availableItemClasses.length > 0 && (
            <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700">
              <span className="text-gray-400 font-semibold">Class:</span>
              <select
                value={selectedGradeFilter}
                onChange={e => { setSelectedGradeFilter(e.target.value); setCurrentPage(1); }}
                className="bg-transparent font-bold text-gray-800 focus:outline-none cursor-pointer"
              >
                <option value="">All Classes</option>
                {availableItemClasses.map(cls => (
                  <option key={cls} value={cls}>Class {cls}</option>
                ))}
              </select>
            </div>
          )}

          {/* Display Limit Dropdown (20, 40, 100, All) */}
          <div className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 px-3 py-1.5 rounded-xl text-xs font-bold text-gray-700">
            <span className="text-gray-400 font-semibold">Show:</span>
            <select
              value={pageSize}
              onChange={e => handlePageSizeChange(e.target.value)}
              className="bg-transparent font-black text-indigo-600 focus:outline-none cursor-pointer"
            >
              <option value="20">20</option>
              <option value="40">40</option>
              <option value="100">100</option>
              <option value="all">All</option>
            </select>
          </div>

          {(searchQuery || selectedGradeFilter) && (
            <button 
              onClick={() => { setSearchQuery(''); setSelectedGradeFilter(''); setUserCustomLimit(false); }} 
              className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-bold transition-all"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Summary count bar */}
      {totalFilteredCount > 0 && (
        <div className="flex flex-col sm:flex-row justify-between items-center gap-2 px-1 text-xs text-gray-500 font-semibold">
          <div>
            Showing <span className="font-bold text-gray-800">
              {pageSize === 'all' ? `1–${totalFilteredCount}` : `${(currentPage - 1) * numericLimit + 1}–${Math.min(currentPage * numericLimit, totalFilteredCount)}`}
            </span> of <span className="font-bold text-gray-800">{totalFilteredCount}</span> items
            {isFiltered && <span className="text-indigo-600 font-bold ml-1">(Filtered)</span>}
          </div>

          <div className="flex items-center gap-1 bg-gray-100 p-0.5 rounded-lg">
            {['20', '40', '100', 'all'].map((opt) => (
              <button
                key={opt}
                onClick={() => handlePageSizeChange(opt)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-bold uppercase transition-all ${
                  pageSize === opt 
                    ? 'bg-indigo-600 text-white shadow-sm' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white'
                }`}
              >
                {opt === 'all' ? 'All' : opt}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Grid of Items with Edit & Delete Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedItems.map((item: any) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative group flex flex-col justify-between">
             {/* Edit & Delete Action Buttons */}
             <div className="absolute top-4 right-4 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-all z-10">
               <button 
                 onClick={() => handleOpenEditModal(item)} 
                 className="p-2 bg-white text-indigo-600 hover:bg-indigo-50 rounded-lg shadow-sm border border-gray-200 transition-all"
                 title="Edit this item"
               >
                 <Edit2 size={15}/>
               </button>
               <button 
                 onClick={() => handleDelete(item.id)} 
                 className="p-2 bg-white text-red-500 hover:bg-red-50 rounded-lg shadow-sm border border-gray-200 transition-all"
                 title="Delete this item"
               >
                 <Trash2 size={15}/>
               </button>
             </div>
             
             {activeTab === 'BLOG' && (
                <div>
                   {item.image && <img src={item.image} className="w-full h-40 object-cover rounded-xl mb-4" />}
                   <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded uppercase">{item.category}</span>
                   <h3 className="font-bold text-lg mt-2 line-clamp-2 text-gray-900">{item.title}</h3>
                   <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.excerpt}</p>
                   <div className="flex items-center gap-2 mt-4 text-xs text-gray-400 font-medium">
                      <span>{item.author}</span> • <span>{new Date(item.date).toLocaleDateString()}</span>
                   </div>
                </div>
             )}

             {(activeTab === 'NOTES' || activeTab === 'LESSON_PLANS' || activeTab === 'BOOKS') && (
                <div>
                   <div className="flex items-start justify-between mb-2">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center font-bold">
                        {activeTab === 'BOOKS' ? <BookOpen size={20}/> : <FileText size={20}/>}
                      </div>
                      <div className="flex items-center gap-1">
                        {item.grade && (
                          <span className="text-[10px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded">
                            Class {item.grade}
                          </span>
                        )}
                        {item.board && (
                          <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded line-clamp-1 max-w-[120px]">
                            {item.board}
                          </span>
                        )}
                      </div>
                   </div>
                   <h3 className="font-bold text-gray-900 text-base">{item.title}</h3>
                   <p className="text-xs text-gray-500 mt-1 font-bold uppercase">{item.subject || 'General'} {item.noteType ? `• ${item.noteType}` : ''}</p>
                   <p className="text-xs text-gray-400 mt-2 line-clamp-2">{item.description}</p>
                   {item.fileUrl && (
                     <a href={item.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 mt-3">
                       <span>View / Read Link</span>
                       <ExternalLink size={12} />
                     </a>
                   )}
                </div>
             )}

             {activeTab === 'PAPERS' && (
                <div>
                   <div className="flex items-start justify-between mb-2">
                      <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-bold"><Clock size={20}/></div>
                      <span className="text-[10px] font-black text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">{item.year}</span>
                   </div>
                   <h3 className="font-bold text-gray-900">{item.title}</h3>
                   <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-[10px] font-bold bg-gray-50 border border-gray-200 px-2 py-1 rounded text-gray-600">{item.board}</span>
                      <span className="text-[10px] font-bold bg-gray-50 border border-gray-200 px-2 py-1 rounded text-gray-600">{item.level ? `Class ${item.level}` : 'General'}</span>
                   </div>
                   {item.fileUrl && (
                     <a href={item.fileUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 mt-3">
                       <span>View PDF</span>
                       <ExternalLink size={12} />
                     </a>
                   )}
                </div>
             )}

             {/* Bottom Card Footer with Quick Edit button for convenience */}
             <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center text-xs">
               <span className="text-gray-400 font-mono text-[10px]">ID: {String(item.id).substring(0, 10)}...</span>
               <button 
                 onClick={() => handleOpenEditModal(item)}
                 className="inline-flex items-center gap-1 text-indigo-600 font-bold hover:text-indigo-800"
               >
                 <Edit2 size={12}/> Edit
               </button>
             </div>
          </div>
        ))}
      </div>

      {/* Pagination Controls */}
      {pageSize !== 'all' && totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
          <span className="text-xs font-bold text-gray-500">
            Page <span className="text-indigo-600 font-black">{currentPage}</span> of <span className="font-bold text-gray-800">{totalPages}</span>
          </span>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
                currentPage === 1 
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50' 
                  : 'border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
              }`}
            >
              <ChevronLeft size={16} />
              <span className="hidden sm:inline">Prev</span>
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter(p => p === 1 || p === totalPages || (p >= currentPage - 2 && p <= currentPage + 2))
              .map((pageNum, idx, arr) => {
                const prev = arr[idx - 1];
                const showEllipsis = prev && pageNum - prev > 1;
                return (
                  <React.Fragment key={pageNum}>
                    {showEllipsis && <span className="px-1 text-gray-400">...</span>}
                    <button
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-8 h-8 rounded-xl text-xs font-black transition-all ${
                        currentPage === pageNum 
                          ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200 scale-105' 
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {pageNum}
                    </button>
                  </React.Fragment>
                );
              })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className={`p-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1 ${
                currentPage === totalPages 
                  ? 'border-gray-200 text-gray-300 cursor-not-allowed bg-gray-50' 
                  : 'border-gray-200 text-gray-700 hover:bg-gray-100 hover:border-gray-300'
              }`}
            >
              <span className="hidden sm:inline">Next</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

      {totalFilteredCount === 0 && (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 text-gray-400">
          <p className="font-bold text-gray-600">No items found matching your filters.</p>
        </div>
      )}

      {/* ─── BULK IMPORT MODAL ──────────────────────────────────────────────── */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gradient-to-r from-emerald-50 to-white">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <FileSpreadsheet size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-base text-gray-900">Import {activeTab === 'BOOKS' ? 'Textbooks' : activeTab === 'NOTES' ? 'Study Notes' : activeTab === 'LESSON_PLANS' ? 'Lesson Plans' : activeTab === 'PAPERS' ? 'Past Papers' : 'Blog Posts'}</h3>
                  <p className="text-xs text-gray-500">Upload CSV or Excel (.xlsx / .xls)</p>
                </div>
              </div>
              <button onClick={() => { setIsImportModalOpen(false); setImportReport(null); }} className="text-gray-400 hover:text-gray-600"><X size={20}/></button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5">
              {/* Step 1: Download Template */}
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-gray-800">1. Download sample Excel template</p>
                  <p className="text-xs text-gray-500 mt-0.5">Use our standard format with pre-filled columns</p>
                </div>
                <button 
                  onClick={handleDownloadTemplate} 
                  className="bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-xs font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-1.5 shadow-sm"
                >
                  <Download size={14} /> Download (.xlsx)
                </button>
              </div>

              {/* Step 2: Upload Dropzone */}
              <div 
                onClick={() => fileInputRef.current?.click()} 
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 hover:bg-emerald-50/70 rounded-2xl p-8 text-center cursor-pointer transition-all"
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  accept=".xlsx, .xls, .csv" 
                  className="hidden" 
                  onChange={handleImportFile} 
                />
                <div className="w-12 h-12 bg-white text-emerald-600 rounded-2xl mx-auto flex items-center justify-center shadow-sm mb-3">
                  <Upload size={24} />
                </div>
                <p className="font-bold text-sm text-gray-800">
                  {isImporting ? 'Processing & uploading data to database...' : 'Click to select Excel (.xlsx / .xls) or CSV file'}
                </p>
                <p className="text-xs text-gray-500 mt-1">Supports bulk upload of unlimited rows at once</p>
              </div>

              {/* Import Feedback / Missing Class Report */}
              {importReport && (
                <div className="space-y-3 pt-2">
                  <div className={`p-4 rounded-xl border ${importReport.failed === 0 ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-amber-50 border-amber-200 text-amber-900'}`}>
                    <div className="flex items-center gap-2 font-bold text-sm">
                      {importReport.failed === 0 ? <CheckCircle size={18} className="text-emerald-600" /> : <AlertTriangle size={18} className="text-amber-600" />}
                      Import Result: {importReport.success} of {importReport.total} items added successfully
                    </div>
                  </div>

                  {/* Missing Classes Notice */}
                  {importReport.missingClasses.length > 0 && (
                    <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-900 space-y-1">
                      <div className="flex items-center gap-2 font-bold text-xs uppercase tracking-wide text-orange-700">
                        <AlertTriangle size={15} /> Class / Grade Notice:
                      </div>
                      <p className="text-xs">
                        The following classes from your file were added but are not yet registered in your master Class list:
                      </p>
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {importReport.missingClasses.map((cls, idx) => (
                          <span key={idx} className="bg-white border border-orange-300 text-orange-800 text-[11px] font-bold px-2 py-0.5 rounded">
                            {cls}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Errors List */}
                  {importReport.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 space-y-1">
                      <p className="font-bold">Errors encountered:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        {importReport.errors.map((err, idx) => <li key={idx}>{err}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button 
                onClick={() => { setIsImportModalOpen(false); setImportReport(null); }} 
                className="px-5 py-2 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── ADD / EDIT SINGLE ITEM MODAL ──────────────────────────────────── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-lg">
                   {editingItem ? 'Edit' : 'Add New'} {activeTab === 'BLOG' ? 'Post' : activeTab === 'NOTES' ? 'Note' : activeTab === 'LESSON_PLANS' ? 'Lesson Plan' : activeTab === 'BOOKS' ? 'Book' : 'Paper'}
                 </h3>
                 <button onClick={() => { setIsModalOpen(false); setEditingItem(null); }}><X size={20}/></button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-4">
                 {activeTab === 'BLOG' && (
                    <>
                       <input type="text" placeholder="Title" className="w-full p-3 border rounded-xl font-bold" value={blogForm.title} onChange={e => setBlogForm({...blogForm, title: e.target.value})} />
                       <div className="grid grid-cols-2 gap-4">
                          <input type="text" placeholder="Category" className="w-full p-3 border rounded-xl" value={blogForm.category} onChange={e => setBlogForm({...blogForm, category: e.target.value})} />
                          <input type="text" placeholder="Author Name" className="w-full p-3 border rounded-xl" value={blogForm.author} onChange={e => setBlogForm({...blogForm, author: e.target.value})} />
                       </div>
                       <textarea placeholder="Short Excerpt" className="w-full p-3 border rounded-xl h-20" value={blogForm.excerpt} onChange={e => setBlogForm({...blogForm, excerpt: e.target.value})} />
                        
                        <div className="space-y-1">
                          <div className="flex justify-between items-center">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Full Content (HTML & Math Allowed)</label>
                            <div className="flex gap-1 text-[10px] font-bold text-indigo-600">
                              <span className="px-2 py-0.5 bg-indigo-50 rounded cursor-pointer hover:bg-indigo-100" onClick={() => setBlogForm(p => ({ ...p, content: p.content + '<h2>Subheading</h2>\n<p>Your paragraph text...</p>\n' }))}>+ Section</span>
                              <span className="px-2 py-0.5 bg-indigo-50 rounded cursor-pointer hover:bg-indigo-100" onClick={() => setBlogForm(p => ({ ...p, content: p.content + '<img src="https://..." alt="Diagram" class="rounded-2xl my-6 w-full shadow-md" />\n' }))}>+ Image Tag</span>
                              <span className="px-2 py-0.5 bg-indigo-50 rounded cursor-pointer hover:bg-indigo-100" onClick={() => setBlogForm(p => ({ ...p, content: p.content + '<ul class="list-disc list-inside space-y-1 my-4">\n  <li>Point 1</li>\n  <li>Point 2</li>\n</ul>\n' }))}>+ List</span>
                            </div>
                          </div>
                          <textarea placeholder="<h2>Section Title</h2><p>Article content here...</p>" className="w-full p-3 border rounded-xl h-44 font-mono text-xs leading-relaxed" value={blogForm.content} onChange={e => setBlogForm({...blogForm, content: e.target.value})} />
                        </div>

                        <div className="space-y-2">
                           <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-400 transition-colors" onClick={() => document.getElementById('blog-img')?.click()}>
                              <p className="text-sm font-medium text-gray-600">{blogForm.image ? `Cover Image: ${blogForm.image.substring(0, 35)}...` : '📁 Click to Upload Cover Image'}</p>
                              <input id="blog-img" type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
                           </div>
                           <div className="flex items-center gap-2">
                             <span className="text-xs text-gray-400 font-bold uppercase">OR</span>
                             <input type="url" placeholder="Paste Image URL (https://images.unsplash.com/...)" className="w-full p-2.5 border rounded-xl text-xs font-mono" value={blogForm.image} onChange={e => setBlogForm({...blogForm, image: e.target.value})} />
                           </div>
                        </div>
                    </>
                 )}

                 {activeTab === 'BOOKS' && (
                    <>
                       <input 
                         type="text" 
                         placeholder="Book Title (e.g. Class 9 Physics Punjab Textbook)" 
                         className="w-full p-3 border rounded-xl font-bold text-gray-900" 
                         value={bookForm.title} 
                         onChange={e => setBookForm({...bookForm, title: e.target.value})} 
                       />

                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                             <label className="text-[10px] font-bold text-gray-400 uppercase">Board / Syllabus</label>
                             <select 
                               className="w-full p-3 border rounded-xl bg-white font-medium text-sm"
                               value={bookForm.board}
                               onChange={e => setBookForm({...bookForm, board: e.target.value})}
                             >
                               <option value="">Select Board / Syllabus...</option>
                               {curriculum.syllabuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                             </select>
                             <input type="text" placeholder="Or type Board manually" className="w-full p-2 border rounded-lg text-xs mt-1" value={bookForm.board} onChange={e => setBookForm({...bookForm, board: e.target.value})} />
                          </div>

                          <div className="space-y-1">
                             <label className="text-[10px] font-bold text-gray-400 uppercase">Grade / Class (Optional)</label>
                             <select 
                               className="w-full p-3 border rounded-xl bg-white font-medium text-sm"
                               value={bookForm.grade}
                               onChange={e => setBookForm({...bookForm, grade: e.target.value})}
                             >
                               <option value="">Select Grade / Class...</option>
                               {curriculum.classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                             </select>
                             <input type="text" placeholder="Or type Grade manually (e.g. 9, 10, 11)" className="w-full p-2 border rounded-lg text-xs mt-1" value={bookForm.grade} onChange={e => setBookForm({...bookForm, grade: e.target.value})} />
                          </div>
                       </div>

                       <input 
                         type="text" 
                         placeholder="Subject (e.g. Physics, Mathematics, Biology)" 
                         className="w-full p-3 border rounded-xl" 
                         value={bookForm.subject} 
                         onChange={e => setBookForm({...bookForm, subject: e.target.value})} 
                       />

                       <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Book PDF Link / Google Drive View URL</label>
                          <input 
                            type="url" 
                            placeholder="https://drive.google.com/file/d/.../preview OR direct PDF link" 
                            className="w-full p-3 border rounded-xl font-mono text-xs" 
                            value={bookForm.fileUrl} 
                            onChange={e => setBookForm({...bookForm, fileUrl: e.target.value})} 
                          />
                          <div className="flex items-center gap-2">
                             <span className="text-xs text-gray-400 font-bold uppercase">OR Upload PDF</span>
                             <input type="file" accept=".pdf" className="text-xs text-gray-500" onChange={(e) => handleFileUpload(e, 'file')} />
                          </div>
                       </div>

                       <textarea 
                         placeholder="Book Description & details..." 
                         className="w-full p-3 border rounded-xl h-24 text-sm" 
                         value={bookForm.description} 
                         onChange={e => setBookForm({...bookForm, description: e.target.value})} 
                       />
                    </>
                 )}

                 {(activeTab === 'NOTES' || activeTab === 'LESSON_PLANS') && (
                    <>
                       <input type="text" placeholder="Title" className="w-full p-3 border rounded-xl font-bold" value={noteForm.title} onChange={e => setNoteForm({...noteForm, title: e.target.value})} />
                       
                       <div className="grid grid-cols-2 gap-4">
                          <input type="text" placeholder="Subject" className="w-full p-3 border rounded-xl" value={noteForm.subject} onChange={e => setNoteForm({...noteForm, subject: e.target.value})} />
                          <input type="text" placeholder="Grade/Class (e.g. 9, 10, 11)" className="w-full p-3 border rounded-xl" value={noteForm.grade} onChange={e => setNoteForm({...noteForm, grade: e.target.value})} />
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <input type="text" placeholder="Board / Syllabus" className="w-full p-3 border rounded-xl" value={noteForm.board} onChange={e => setNoteForm({...noteForm, board: e.target.value})} />
                          <input type="text" placeholder="Note Type (e.g. Book Notes, Solved Exercise)" className="w-full p-3 border rounded-xl" value={noteForm.noteType} onChange={e => setNoteForm({...noteForm, noteType: e.target.value})} />
                       </div>

                       <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase">PDF / Document Link</label>
                          <input type="url" placeholder="https://drive.google.com/.../preview or PDF URL" className="w-full p-3 border rounded-xl text-xs font-mono" value={noteForm.fileUrl} onChange={e => setNoteForm({...noteForm, fileUrl: e.target.value})} />
                          <div className="flex items-center gap-2">
                             <span className="text-xs text-gray-400 font-bold uppercase">OR</span>
                             <input type="file" accept=".pdf,.doc,.docx" className="text-xs text-gray-500" onChange={(e) => handleFileUpload(e, 'file')} />
                          </div>
                       </div>

                       <textarea placeholder="Description" className="w-full p-3 border rounded-xl h-24 text-sm" value={noteForm.description} onChange={e => setNoteForm({...noteForm, description: e.target.value})} />
                    </>
                 )}

                 {activeTab === 'PAPERS' && (
                    <>
                       <input type="text" placeholder="Paper Title (e.g. Physics 9th 2024 Group 1)" className="w-full p-3 border rounded-xl font-bold" value={paperForm.title} onChange={e => setPaperForm({...paperForm, title: e.target.value})} />
                       <div className="grid grid-cols-2 gap-4">
                          <input type="text" placeholder="Subject" className="w-full p-3 border rounded-xl" value={paperForm.subject} onChange={e => setPaperForm({...paperForm, subject: e.target.value})} />
                          <input type="number" placeholder="Year" className="w-full p-3 border rounded-xl" value={paperForm.year} onChange={e => setPaperForm({...paperForm, year: parseInt(e.target.value) || 2024})} />
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <input type="text" placeholder="Board (e.g. BISE Lahore)" className="w-full p-3 border rounded-xl" value={paperForm.board} onChange={e => setPaperForm({...paperForm, board: e.target.value})} />
                          <input type="text" placeholder="Class / Level (e.g. 9, 10)" className="w-full p-3 border rounded-xl" value={paperForm.level} onChange={e => setPaperForm({...paperForm, level: e.target.value})} />
                       </div>
                       <div className="space-y-2">
                          <label className="text-xs font-bold text-gray-500 uppercase">Past Paper PDF Link</label>
                          <input type="url" placeholder="https://drive.google.com/.../preview or PDF URL" className="w-full p-3 border rounded-xl text-xs font-mono" value={paperForm.fileUrl} onChange={e => setPaperForm({...paperForm, fileUrl: e.target.value})} />
                          <div className="flex items-center gap-2">
                             <span className="text-xs text-gray-400 font-bold uppercase">OR</span>
                             <input type="file" accept=".pdf" className="text-xs text-gray-500" onChange={(e) => handleFileUpload(e, 'file')} />
                          </div>
                       </div>
                    </>
                 )}
              </div>

              <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                 <button onClick={() => { setIsModalOpen(false); setEditingItem(null); }} className="px-4 py-2 border rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-100">Cancel</button>
                 <button onClick={handleSave} className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700">
                   {editingItem ? 'Update Changes' : 'Save'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ContentManager;
