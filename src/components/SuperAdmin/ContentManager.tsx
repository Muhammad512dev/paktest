import React, { useState, useEffect, useMemo } from 'react';
import { 
  getBlogs, addBlog, deleteBlog,
  getNotes, addNote, deleteNote,
  getPastPapers, addPastPaper, deletePastPaper, uploadFile,
  getPublicCurriculum
} from '../../services/dataService';
import { Plus, Trash2, X, FileText, Upload, BookOpen, Clock, Calendar, CheckSquare, Image as ImageIcon } from 'lucide-react';
import { Syllabus, ClassLevel } from '../../types';

const ContentManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'BLOG' | 'NOTES' | 'LESSON_PLANS' | 'PAPERS'>('BLOG');
  const [items, setItems] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [curriculum, setCurriculum] = useState<{ syllabuses: Syllabus[]; classes: ClassLevel[] }>({ syllabuses: [], classes: [] });
  
  // Forms State
  const [blogForm, setBlogForm] = useState({ title: '', excerpt: '', content: '', category: 'EdTech', author: '', image: '' });
  const [noteForm, setNoteForm] = useState({ title: '', subject: '', grade: '', board: '', noteType: '', resource: '', book: '', author: '', fileUrl: '', description: '' });
  const [paperForm, setPaperForm] = useState({ title: '', year: new Date().getFullYear(), board: '', level: '', subject: '', resource: '', fileUrl: '' });

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
    else if (activeTab === 'PAPERS') data = (await getPastPapers({ pageSize: 1000 })).data;
    setItems(data);
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const handleSave = async () => {
    if (activeTab === 'BLOG') {
       if (!blogForm.title) return;
       await addBlog({ ...blogForm, date: new Date(), readTime: '5 min read' });
       setBlogForm({ title: '', excerpt: '', content: '', category: 'EdTech', author: '', image: '' });
    } else if (activeTab === 'NOTES' || activeTab === 'LESSON_PLANS') {
       if (!noteForm.title) return;
       await addNote({
         ...noteForm,
         noteType: activeTab === 'LESSON_PLANS' ? 'Lesson Plan' : (noteForm.noteType || 'Book Notes')
       });
       setNoteForm({ title: '', subject: '', grade: '', board: '', noteType: '', resource: '', book: '', author: '', fileUrl: '', description: '' });
    } else {
       if (!paperForm.title) return;
       const { resource, ...cleanPaperData } = paperForm;
       await addPastPaper({ ...cleanPaperData, year: parseInt(paperForm.year as any) });
       setPaperForm({ title: '', year: new Date().getFullYear(), board: '', level: '', subject: '', resource: '', fileUrl: '' });
    }
    setIsModalOpen(false);
    loadData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this item?")) return;
    if (activeTab === 'BLOG') await deleteBlog(id);
    else if (activeTab === 'NOTES' || activeTab === 'LESSON_PLANS') await deleteNote(id);
    else await deletePastPaper(id);
    loadData();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'image' | 'file') => {
    if (e.target.files && e.target.files[0]) {
      try {
        const url = await uploadFile(e.target.files[0]);
        if (activeTab === 'BLOG') setBlogForm({ ...blogForm, image: url });
        else if (activeTab === 'NOTES' || activeTab === 'LESSON_PLANS') setNoteForm({ ...noteForm, fileUrl: url });
        else setPaperForm({ ...paperForm, fileUrl: url });
      } catch (err) {
        alert("File upload failed");
      }
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Content CMS</h1>
          <p className="text-sm text-gray-500 mt-1">Manage public-facing resources</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-indigo-700 flex items-center gap-2">
          <Plus size={18} /> Add {activeTab === 'BLOG' ? 'Post' : activeTab === 'NOTES' ? 'Note' : activeTab === 'LESSON_PLANS' ? 'Lesson Plan' : 'Paper'}
        </button>
      </div>

      <div className="flex gap-4 border-b border-gray-200 mb-6">
        {['BLOG', 'NOTES', 'LESSON_PLANS', 'PAPERS'].map(tab => (
          <button 
            key={tab} 
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-3 text-sm font-bold border-b-2 transition-all ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            {tab === 'BLOG' ? 'Blog Posts' : tab === 'NOTES' ? 'Study Notes' : tab === 'LESSON_PLANS' ? 'Lesson Plans' : 'Past Papers'}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item: any) => (
          <div key={item.id} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all relative group">
             <button onClick={() => handleDelete(item.id)} className="absolute top-4 right-4 p-2 bg-white text-red-500 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50"><Trash2 size={16}/></button>
             
             {activeTab === 'BLOG' && (
                <>
                   {item.image && <img src={item.image} className="w-full h-40 object-cover rounded-xl mb-4" />}
                   <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded uppercase">{item.category}</span>
                   <h3 className="font-bold text-lg mt-2 line-clamp-2">{item.title}</h3>
                   <p className="text-xs text-gray-500 mt-1 line-clamp-2">{item.excerpt}</p>
                   <div className="flex items-center gap-2 mt-4 text-xs text-gray-400 font-medium">
                      <span>{item.author}</span> • <span>{new Date(item.date).toLocaleDateString()}</span>
                   </div>
                </>
             )}

             {(activeTab === 'NOTES' || activeTab === 'LESSON_PLANS') && (
                <>
                   <div className="flex items-start justify-between mb-2">
                      <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-lg flex items-center justify-center"><FileText size={20}/></div>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{item.grade}</span>
                   </div>
                   <h3 className="font-bold text-gray-900">{item.title}</h3>
                   <p className="text-xs text-gray-500 mt-1 font-bold uppercase">{item.subject}</p>
                   <p className="text-xs text-gray-400 mt-3 line-clamp-2">{item.description}</p>
                </>
             )}

             {activeTab === 'PAPERS' && (
                <>
                   <div className="flex items-start justify-between mb-2">
                      <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-lg flex items-center justify-center"><Clock size={20}/></div>
                      <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">{item.year}</span>
                   </div>
                   <h3 className="font-bold text-gray-900">{item.title}</h3>
                   <div className="flex flex-wrap gap-2 mt-3">
                      <span className="text-[10px] font-bold bg-gray-50 border border-gray-200 px-2 py-1 rounded text-gray-600">{item.board}</span>
                      <span className="text-[10px] font-bold bg-gray-50 border border-gray-200 px-2 py-1 rounded text-gray-600">{item.level}</span>
                   </div>
                </>
             )}
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-lg">Add New {activeTab === 'BLOG' ? 'Post' : activeTab === 'NOTES' ? 'Note' : 'Paper'}</h3>
                 <button onClick={() => setIsModalOpen(false)}><X size={20}/></button>
              </div>
              
              <div className="p-6 overflow-y-auto space-y-4">
                 {activeTab === 'BLOG' && (
                    <>
                       <input type="text" placeholder="Title" className="w-full p-3 border rounded-xl" value={blogForm.title} onChange={e => setBlogForm({...blogForm, title: e.target.value})} />
                       <div className="grid grid-cols-2 gap-4">
                          <input type="text" placeholder="Category" className="w-full p-3 border rounded-xl" value={blogForm.category} onChange={e => setBlogForm({...blogForm, category: e.target.value})} />
                          <input type="text" placeholder="Author Name" className="w-full p-3 border rounded-xl" value={blogForm.author} onChange={e => setBlogForm({...blogForm, author: e.target.value})} />
                       </div>
                       <textarea placeholder="Short Excerpt" className="w-full p-3 border rounded-xl h-20" value={blogForm.excerpt} onChange={e => setBlogForm({...blogForm, excerpt: e.target.value})} />
                       <textarea placeholder="Full Content (HTML allowed)" className="w-full p-3 border rounded-xl h-40 font-mono text-sm" value={blogForm.content} onChange={e => setBlogForm({...blogForm, content: e.target.value})} />
                       <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center cursor-pointer" onClick={() => document.getElementById('blog-img')?.click()}>
                          <p className="text-sm text-gray-500">{blogForm.image ? 'Image Selected' : 'Click to Upload Cover Image'}</p>
                          <input id="blog-img" type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'image')} />
                       </div>
                    </>
                 )}

                 {(activeTab === 'NOTES' || activeTab === 'LESSON_PLANS') && (
                    <>
                       <input 
                         type="text" 
                         placeholder={activeTab === 'LESSON_PLANS' ? "Lesson Plan Title (e.g. Class 10 Math Chapter 1 Lesson Plan)" : "Note Title (e.g. Class 10 Physics Chapter 1 Notes)"} 
                         className="w-full p-3 border rounded-xl font-bold text-gray-900" 
                         value={noteForm.title} 
                         onChange={e => setNoteForm({...noteForm, title: e.target.value})} 
                       />

                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Board / Syllabus</label>
                            <select 
                              className="w-full p-3 border rounded-xl bg-white font-medium text-sm"
                              value={noteForm.board}
                              onChange={e => setNoteForm({...noteForm, board: e.target.value})}
                            >
                              <option value="">Select Board / Syllabus...</option>
                              {curriculum.syllabuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                            <input type="text" placeholder="Or type Board manually" className="w-full p-2 border rounded-lg text-xs mt-1" value={noteForm.board} onChange={e => setNoteForm({...noteForm, board: e.target.value})} />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Resource Type</label>
                            <input 
                              type="text" 
                              placeholder="Type (e.g. Book Notes, ECAT, NTS)" 
                              className="w-full p-3 border rounded-xl" 
                              value={activeTab === 'LESSON_PLANS' ? 'Lesson Plan' : noteForm.noteType} 
                              onChange={e => setNoteForm({...noteForm, noteType: e.target.value})} 
                              disabled={activeTab === 'LESSON_PLANS'} 
                            />
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Grade / Class</label>
                            <select 
                              className="w-full p-3 border rounded-xl bg-white font-medium text-sm"
                              value={noteForm.grade}
                              onChange={e => setNoteForm({...noteForm, grade: e.target.value})}
                            >
                              <option value="">Select Grade / Class...</option>
                              {curriculum.classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                            <input type="text" placeholder="Or type Grade manually" className="w-full p-2 border rounded-lg text-xs mt-1" value={noteForm.grade} onChange={e => setNoteForm({...noteForm, grade: e.target.value})} />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Subject</label>
                            <input type="text" placeholder="Subject (e.g. Mathematics)" className="w-full p-3 border rounded-xl" value={noteForm.subject} onChange={e => setNoteForm({...noteForm, subject: e.target.value})} />
                          </div>
                       </div>

                       <div className="grid grid-cols-2 gap-4">
                          <input type="text" placeholder="Book / Textbook Name (optional)" className="w-full p-3 border rounded-xl" value={noteForm.book} onChange={e => setNoteForm({...noteForm, book: e.target.value})} />
                          <input type="text" placeholder="Author / Publisher (e.g. Punjab Textbook Board)" className="w-full p-3 border rounded-xl" value={noteForm.author} onChange={e => setNoteForm({...noteForm, author: e.target.value})} />
                       </div>

                       <input type="text" placeholder="Resources / Sources (comma-separated, e.g. KIPS, PGC, Star)" className="w-full p-3 border rounded-xl" value={noteForm.resource} onChange={e => setNoteForm({...noteForm, resource: e.target.value})} />
                       
                       <textarea placeholder="Detailed Description / Summary of the content..." className="w-full p-3 border rounded-xl h-24" value={noteForm.description} onChange={e => setNoteForm({...noteForm, description: e.target.value})} />
                       
                       {/* File Upload Zone */}
                       <div className="space-y-3 pt-2">
                         <label className="text-[10px] font-bold text-gray-400 uppercase">Upload PDF / Document File or Provide Drive Link</label>
                         <div className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 rounded-xl p-5 text-center cursor-pointer hover:border-indigo-400 transition-colors" onClick={() => document.getElementById('note-file')?.click()}>
                            <p className="text-sm font-bold text-indigo-700">{noteForm.fileUrl ? `Selected File / Link: ${noteForm.fileUrl.substring(0, 45)}...` : '📄 Click to Upload PDF / Word File'}</p>
                            <p className="text-xs text-slate-400 mt-1">Supports PDF, DOC, DOCX up to 10MB</p>
                            <input id="note-file" type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="text-xs text-gray-400 font-bold uppercase">OR</span>
                           <input type="url" placeholder="Paste Google Drive / External File URL (https://drive.google.com/...)" className="w-full p-3 border rounded-xl text-sm font-mono" value={noteForm.fileUrl} onChange={e => setNoteForm({...noteForm, fileUrl: e.target.value})} />
                         </div>
                       </div>
                    </>
                 )}

                 {activeTab === 'PAPERS' && (
                    <>
                       <input type="text" placeholder="Paper Title" className="w-full p-3 border rounded-xl" value={paperForm.title} onChange={e => setPaperForm({...paperForm, title: e.target.value})} />
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Board / Syllabus</label>
                            <select 
                              className="w-full p-3 border rounded-xl bg-white font-medium text-sm"
                              value={paperForm.board}
                              onChange={e => setPaperForm({...paperForm, board: e.target.value})}
                            >
                              <option value="">Select Board / Syllabus...</option>
                              {curriculum.syllabuses.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                            </select>
                            <input type="text" placeholder="Or type Board manually" className="w-full p-2 border rounded-lg text-xs mt-1" value={paperForm.board} onChange={e => setPaperForm({...paperForm, board: e.target.value})} />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Year</label>
                            <input type="number" placeholder="Year" className="w-full p-3 border rounded-xl" value={paperForm.year} onChange={e => setPaperForm({...paperForm, year: parseInt(e.target.value)})} />
                          </div>
                       </div>
                       <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Level / Grade</label>
                            <select 
                              className="w-full p-3 border rounded-xl bg-white font-medium text-sm"
                              value={paperForm.level}
                              onChange={e => setPaperForm({...paperForm, level: e.target.value})}
                            >
                              <option value="">Select Level / Grade...</option>
                              {curriculum.classes.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                            <input type="text" placeholder="Or type Level manually" className="w-full p-2 border rounded-lg text-xs mt-1" value={paperForm.level} onChange={e => setPaperForm({...paperForm, level: e.target.value})} />
                          </div>

                          <div className="space-y-1">
                            <label className="text-[10px] font-bold text-gray-400 uppercase">Subject</label>
                            <input type="text" placeholder="Subject" className="w-full p-3 border rounded-xl" value={paperForm.subject} onChange={e => setPaperForm({...paperForm, subject: e.target.value})} />
                          </div>
                       </div>
                       
                       <div className="space-y-3">
                         <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center cursor-pointer hover:border-indigo-400 transition-colors" onClick={() => document.getElementById('paper-file')?.click()}>
                            <p className="text-sm font-bold text-gray-600">{paperForm.fileUrl ? `Selected File / Link: ${paperForm.fileUrl.substring(0, 40)}...` : '📄 Click to Upload Past Paper PDF'}</p>
                            <input id="paper-file" type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'file')} />
                         </div>
                         <div className="flex items-center gap-2">
                           <span className="text-xs text-gray-400 font-bold uppercase">OR</span>
                           <input type="url" placeholder="Paste Google Drive / External PDF Link (https://drive.google.com/...)" className="w-full p-3 border rounded-xl text-sm font-mono" value={paperForm.fileUrl} onChange={e => setPaperForm({...paperForm, fileUrl: e.target.value})} />
                         </div>
                       </div>
                    </>
                 )}
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
                 <button onClick={() => setIsModalOpen(false)} className="px-6 py-2 text-gray-500 font-bold hover:bg-gray-200 rounded-lg">Cancel</button>
                 <button onClick={handleSave} className="px-8 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 shadow-lg">Save to Library</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ContentManager;
