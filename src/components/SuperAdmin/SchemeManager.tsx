import React, { useState, useEffect, useMemo } from 'react';
import {
  Plus, Trash2, Save, Globe, School, BookOpen, ChevronDown, ChevronUp,
  Layers, Hash, CheckCircle2, Edit3, X, AlertCircle, GraduationCap, Settings2, Copy
} from 'lucide-react';
import { UserRole, User, PairingScheme, SchemeSectionDef, SchemePart, SchemeChapterRule } from '../../types';
import { getSyllabuses, getClasses, getSubjects, getChapters, getSchemes, createScheme, updateScheme, deleteScheme } from '../../services/dataService';

interface SchemeManagerProps {
  user: User;
}

const QUESTION_TYPES = ['MCQ', 'Short Answer', 'Long Answer', 'Fill in the Blanks', 'True/False', 'Match Columns'];

const emptySection = (idx: number): SchemeSectionDef => ({
  id: `sec_${Date.now()}_${idx}`,
  type: 'MCQ',
  title: `Q-${idx + 1}`,
  totalCount: 10,
  selectCount: 10,
  marksPerQuestion: 1,
  hasParts: false,
  parts: [],
  chapterDistribution: []
});

const emptyPart = (label: string): SchemePart => ({
  label,
  chapter: '',
  count: 1,
  marks: 4,
  instruction: ''
});

const emptyRule = (): SchemeChapterRule => ({
  chapters: [],
  count: 1
});

const PART_LABELS = ['a', 'b', 'c', 'd', 'e'];

export default function SchemeManager({ user }: SchemeManagerProps) {
  const [syllabuses, setSyllabuses] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [chapters, setChapters] = useState<any[]>([]);
  const [schemes, setSchemes] = useState<PairingScheme[]>([]);
  const [loading, setLoading] = useState(true);

  const [filterSyllabus, setFilterSyllabus] = useState('');
  const [filterClass, setFilterClass] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  const [editingScheme, setEditingScheme] = useState<Partial<PairingScheme> | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const isSuperAdmin = user.role === UserRole.SUPER_ADMIN;

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const results = await Promise.allSettled([
          getSyllabuses().catch(() => []),
          getClasses().catch(() => []),
          getSubjects().catch(() => []),
          getChapters().catch(() => []),
          getSchemes({ includeGlobal: true }).catch(() => [])
        ]);
        setSyllabuses(results[0].status === 'fulfilled' ? (results[0].value || []) : []);
        setClasses(results[1].status === 'fulfilled' ? (results[1].value || []) : []);
        setSubjects(results[2].status === 'fulfilled' ? (results[2].value || []) : []);
        setChapters(results[3].status === 'fulfilled' ? (results[3].value || []) : []);
        setSchemes(results[4].status === 'fulfilled' ? (results[4].value || []) : []);
      } catch (e) {
        console.error('Failed to load schemes/curriculum:', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredClasses = useMemo(() => classes.filter(c => !filterSyllabus || c.syllabusId === filterSyllabus), [classes, filterSyllabus]);
  const filteredSubjects = useMemo(() => subjects.filter(s => !filterClass || s.classId === filterClass), [subjects, filterClass]);

  const editorChapters = useMemo(() =>
    chapters.filter(c => editingScheme?.subjectId && c.subjectId === editingScheme.subjectId),
    [chapters, editingScheme?.subjectId]);

  const visibleSchemes = useMemo(() => schemes.filter(s => {
    if (filterSyllabus && s.syllabusId !== filterSyllabus) return false;
    if (filterClass && s.classId !== filterClass) return false;
    if (filterSubject && s.subjectId !== filterSubject) return false;
    return true;
  }), [schemes, filterSyllabus, filterClass, filterSubject]);

  const startNew = () => {
    setEditingScheme({
      name: '', syllabusId: filterSyllabus || '', classId: filterClass || '',
      subjectId: filterSubject || '', totalMarks: 75, durationMin: 150,
      structure: [emptySection(0)], isGlobal: isSuperAdmin, createdBy: user.id,
    });
    setExpandedSection(null);
  };

  const startEdit = (scheme: PairingScheme) => { setEditingScheme(JSON.parse(JSON.stringify(scheme))); setExpandedSection(null); };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this pairing scheme?')) return;
    await deleteScheme(id);
    setSchemes(prev => prev.filter(s => s.id !== id));
  };

  const handleSave = async () => {
    if (!editingScheme?.name || !editingScheme.syllabusId || !editingScheme.classId || !editingScheme.subjectId) {
      alert('Please fill in Scheme Name, Board, Class, and Subject.'); return;
    }
    setIsSaving(true);
    try {
      const payload = { name: editingScheme.name!, syllabusId: editingScheme.syllabusId!, classId: editingScheme.classId!, subjectId: editingScheme.subjectId!, totalMarks: editingScheme.totalMarks || 0, durationMin: editingScheme.durationMin || 180, structure: editingScheme.structure || [], isGlobal: editingScheme.isGlobal || false, createdBy: user.id };
      let saved: PairingScheme;
      if (editingScheme.id) { saved = await updateScheme(editingScheme.id, payload); setSchemes(prev => prev.map(s => s.id === saved.id ? saved : s)); }
      else { saved = await createScheme(payload); setSchemes(prev => [saved, ...prev]); }
      setEditingScheme(null);
    } catch (e: any) { alert(e.message || 'Failed to save scheme'); }
    finally { setIsSaving(false); }
  };

  const updateSection = (idx: number, updates: Partial<SchemeSectionDef>) => {
    setEditingScheme(prev => { const s = [...(prev?.structure || [])]; s[idx] = { ...s[idx], ...updates }; return { ...prev, structure: s }; });
  };
  const addSection = () => {
    setEditingScheme(prev => { const s = [...(prev?.structure || [])]; const n = emptySection(s.length); setExpandedSection(n.id); return { ...prev, structure: [...s, n] }; });
  };
  const removeSection = (idx: number) => {
    setEditingScheme(prev => { const s = [...(prev?.structure || [])]; s.splice(idx, 1); return { ...prev, structure: s }; });
  };
  const addPart = (idx: number) => {
    const sec = editingScheme?.structure?.[idx]; if (!sec) return;
    const nextLabel = PART_LABELS[(sec.parts || []).length] || String.fromCharCode(97 + (sec.parts || []).length);
    updateSection(idx, { parts: [...(sec.parts || []), emptyPart(nextLabel)] });
  };
  const updatePart = (si: number, pi: number, u: Partial<SchemePart>) => {
    const p = [...(editingScheme?.structure?.[si]?.parts || [])]; p[pi] = { ...p[pi], ...u }; updateSection(si, { parts: p });
  };
  const removePart = (si: number, pi: number) => {
    const p = [...(editingScheme?.structure?.[si]?.parts || [])]; p.splice(pi, 1); updateSection(si, { parts: p });
  };
  const addChapterRule = (si: number) => updateSection(si, { chapterDistribution: [...(editingScheme?.structure?.[si]?.chapterDistribution || []), emptyRule()] });
  const updateChapterRule = (si: number, ri: number, u: Partial<SchemeChapterRule>) => {
    const d = [...(editingScheme?.structure?.[si]?.chapterDistribution || [])]; d[ri] = { ...d[ri], ...u }; updateSection(si, { chapterDistribution: d });
  };
  const removeChapterRule = (si: number, ri: number) => {
    const d = [...(editingScheme?.structure?.[si]?.chapterDistribution || [])]; d.splice(ri, 1); updateSection(si, { chapterDistribution: d });
  };

  const totalSchemeMarks = useMemo(() => (editingScheme?.structure || []).reduce((acc, sec) => {
    if (sec.hasParts) return acc + (sec.parts || []).reduce((a, p) => a + p.marks, 0);
    return acc + sec.selectCount * sec.marksPerQuestion;
  }, 0), [editingScheme?.structure]);

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"/></div>;

  if (editingScheme) return (
    <div className="fixed inset-0 z-50 bg-gray-50 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black text-gray-900">{editingScheme.id ? 'Edit Pairing Scheme' : 'New Pairing Scheme'}</h1>
            <p className="text-sm text-gray-500 mt-1">Define chapter-level question distribution and section structure</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => setEditingScheme(null)} className="px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-100 transition-all">Cancel</button>
            <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-indigo-200 transition-all">
              <Save size={16}/>{isSaving ? 'Saving...' : 'Save Scheme'}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-8 mb-6">
          <h3 className="text-xs font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Settings2 size={16}/> Scheme Info</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Scheme Name</label>
              <input value={editingScheme.name || ''} onChange={e => setEditingScheme(p => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Math 10th Punjab Board 2025" className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Board / Syllabus</label>
              <select value={editingScheme.syllabusId || ''} onChange={e => setEditingScheme(p => ({ ...p, syllabusId: e.target.value, classId: '', subjectId: '' }))}
                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="">Select Board...</option>
                {syllabuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Grade / Class</label>
              <select value={editingScheme.classId || ''} onChange={e => setEditingScheme(p => ({ ...p, classId: e.target.value, subjectId: '' }))} disabled={!editingScheme.syllabusId}
                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
                <option value="">Select Grade...</option>
                {classes.filter(c => c.syllabusId === editingScheme.syllabusId).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Subject</label>
              <select value={editingScheme.subjectId || ''} onChange={e => setEditingScheme(p => ({ ...p, subjectId: e.target.value }))} disabled={!editingScheme.classId}
                className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
                <option value="">Select Subject...</option>
                {subjects.filter(s => s.classId === editingScheme.classId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Marks</label>
                <input type="number" value={editingScheme.totalMarks || ''} onChange={e => setEditingScheme(p => ({ ...p, totalMarks: Number(e.target.value) }))}
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"/>
              </div>
              <div>
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Duration (min)</label>
                <input type="number" value={editingScheme.durationMin || ''} onChange={e => setEditingScheme(p => ({ ...p, durationMin: Number(e.target.value) }))}
                  className="w-full h-12 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"/>
              </div>
            </div>
            {isSuperAdmin && (
              <div className="md:col-span-2 flex items-center gap-4 p-4 bg-amber-50 border border-amber-200 rounded-2xl">
                <Globe size={20} className="text-amber-600 shrink-0"/>
                <div className="flex-1">
                  <p className="font-bold text-sm text-amber-900">Global Board Scheme</p>
                  <p className="text-xs text-amber-700">Visible to all schools as an official board template</p>
                </div>
                <button onClick={() => setEditingScheme(p => ({ ...p, isGlobal: !p?.isGlobal }))}
                  className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${editingScheme.isGlobal ? 'bg-amber-500' : 'bg-gray-200'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${editingScheme.isGlobal ? 'right-1' : 'left-1'}`}/>
                </button>
              </div>
            )}
          </div>
          <div className="mt-6 p-3 bg-indigo-50 rounded-xl flex gap-6 text-sm font-bold text-indigo-900">
            <span>Sections: {(editingScheme.structure || []).length}</span>
            <span>Calculated Marks: {totalSchemeMarks}</span>
            <span className={totalSchemeMarks !== (editingScheme.totalMarks || 0) ? 'text-red-600' : 'text-emerald-600'}>
              {totalSchemeMarks !== (editingScheme.totalMarks || 0) ? `⚠ Mismatch (set ${editingScheme.totalMarks})` : '✓ Marks match'}
            </span>
          </div>
        </div>

        <div className="space-y-4">
          {(editingScheme.structure || []).map((sec, idx) => {
            const isExpanded = expandedSection === sec.id;
            const sectionMarks = sec.hasParts ? (sec.parts || []).reduce((a, p) => a + p.marks, 0) : sec.selectCount * sec.marksPerQuestion;
            return (
              <div key={sec.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="flex items-center gap-4 p-6 cursor-pointer" onClick={() => setExpandedSection(isExpanded ? null : sec.id)}>
                  <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-black text-sm shrink-0">{idx + 1}</div>
                  <div className="flex-1">
                    <input value={sec.title} onChange={e => { e.stopPropagation(); updateSection(idx, { title: e.target.value }); }} onClick={e => e.stopPropagation()}
                      className="font-black text-gray-900 bg-transparent outline-none border-b border-transparent focus:border-indigo-300 text-sm"/>
                    <div className="flex flex-wrap gap-2 mt-1">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-50 px-2 py-0.5 rounded">{sec.type}</span>
                      {sec.hasParts ? <span className="text-[10px] font-bold text-violet-600 bg-violet-50 px-2 py-0.5 rounded">{(sec.parts||[]).length} Parts • {sectionMarks} marks</span>
                        : <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded">Attempt {sec.selectCount}/{sec.totalCount} • {sectionMarks} marks</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={e => { e.stopPropagation(); removeSection(idx); }} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                    {isExpanded ? <ChevronUp size={18} className="text-gray-400"/> : <ChevronDown size={18} className="text-gray-400"/>}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-6 border-t border-gray-50 pt-6 space-y-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Question Type</label>
                        <select value={sec.type} onChange={e => updateSection(idx, { type: e.target.value, hasParts: false, parts: [], chapterDistribution: [] })}
                          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500">
                          {QUESTION_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Marks/Q</label>
                        <input type="number" min={1} value={sec.marksPerQuestion} onChange={e => updateSection(idx, { marksPerQuestion: Number(e.target.value) })}
                          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"/>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Total Qs</label>
                        <input type="number" min={1} value={sec.totalCount} onChange={e => updateSection(idx, { totalCount: Number(e.target.value) })}
                          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"/>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Attempt Qs</label>
                        <input type="number" min={1} value={sec.selectCount} onChange={e => updateSection(idx, { selectCount: Number(e.target.value) })}
                          className="w-full h-10 px-3 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"/>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 p-4 bg-violet-50 border border-violet-100 rounded-2xl">
                      <Layers size={18} className="text-violet-600 shrink-0"/>
                      <div className="flex-1">
                        <p className="font-bold text-sm text-violet-900">Long Question Parts (a), (b), (c)...</p>
                        <p className="text-xs text-violet-600">Define sub-parts with individual chapter sources and marks</p>
                      </div>
                      <button onClick={() => updateSection(idx, { hasParts: !sec.hasParts, parts: !sec.hasParts ? [emptyPart('a'), emptyPart('b')] : [] })}
                        className={`w-12 h-6 rounded-full relative transition-colors shrink-0 ${sec.hasParts ? 'bg-violet-600' : 'bg-gray-200'}`}>
                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${sec.hasParts ? 'right-1' : 'left-1'}`}/>
                      </button>
                    </div>

                    {sec.hasParts && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Parts</h4>
                          <button onClick={() => addPart(idx)} className="px-3 py-1.5 bg-violet-50 text-violet-700 rounded-lg text-xs font-black hover:bg-violet-100 flex items-center gap-1"><Plus size={12}/>Add Part</button>
                        </div>
                        {(sec.parts || []).map((part, pIdx) => (
                          <div key={pIdx} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
                            <div className="flex items-end gap-2">
                              <div className="w-9 h-9 bg-violet-600 text-white rounded-lg flex items-center justify-center font-black text-sm shrink-0">({part.label})</div>
                            </div>
                            <div>
                              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Source Chapter</label>
                              <select value={part.chapter || ''} onChange={e => updatePart(idx, pIdx, { chapter: e.target.value })}
                                className="w-full h-9 px-2 bg-white border border-gray-200 rounded-lg font-bold text-xs outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="">Any...</option>
                                {editorChapters.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Marks</label>
                              <input type="number" min={1} value={part.marks} onChange={e => updatePart(idx, pIdx, { marks: Number(e.target.value) })}
                                className="w-full h-9 px-2 bg-white border border-gray-200 rounded-lg font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500"/>
                            </div>
                            <div className="flex items-end gap-2">
                              <div className="flex-1">
                                <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Instruction</label>
                                <input value={part.instruction || ''} onChange={e => updatePart(idx, pIdx, { instruction: e.target.value })}
                                  placeholder="Optional..." className="w-full h-9 px-2 bg-white border border-gray-200 rounded-lg text-xs outline-none focus:ring-2 focus:ring-indigo-500"/>
                              </div>
                              <button onClick={() => removePart(idx, pIdx)} className="h-9 px-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {!sec.hasParts && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-black text-gray-500 uppercase tracking-widest">Chapter Distribution Rules</h4>
                          <button onClick={() => addChapterRule(idx)} className="px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-lg text-xs font-black hover:bg-indigo-100 flex items-center gap-1"><Plus size={12}/>Add Rule</button>
                        </div>
                        {(sec.chapterDistribution || []).length === 0 && <p className="text-xs text-gray-400 italic">No rules — questions pulled randomly from all chapters.</p>}
                        {(sec.chapterDistribution || []).map((rule, rIdx) => (
                          <div key={rIdx} className="p-3 bg-gray-50 rounded-xl border border-gray-100 flex gap-3 items-start">
                            <div className="flex-1">
                              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Select Chapters</label>
                              <div className="flex flex-wrap gap-1.5">
                                {editorChapters.map(ch => (
                                  <button key={ch.id} type="button" onClick={() => {
                                    const cur = rule.chapters.includes(ch.name);
                                    updateChapterRule(idx, rIdx, { chapters: cur ? rule.chapters.filter(c => c !== ch.name) : [...rule.chapters, ch.name] });
                                  }} className={`text-[9px] px-2 py-1 rounded-md border font-black transition-all ${rule.chapters.includes(ch.name) ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-200 hover:border-indigo-300'}`}>
                                    {ch.name}
                                  </button>
                                ))}
                                {editorChapters.length === 0 && <p className="text-xs text-gray-400 italic">Select a subject first</p>}
                              </div>
                            </div>
                            <div className="shrink-0">
                              <label className="block text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Count</label>
                              <input type="number" min={1} value={rule.count} onChange={e => updateChapterRule(idx, rIdx, { count: Number(e.target.value) })}
                                className="w-16 h-8 px-2 text-center bg-white border border-gray-200 rounded-lg font-bold text-sm outline-none"/>
                            </div>
                            <button type="button" onClick={() => removeChapterRule(idx, rIdx)} className="mt-4 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14}/></button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
          <button onClick={addSection} className="w-full py-4 border-2 border-dashed border-gray-200 rounded-3xl text-sm font-bold text-gray-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all flex items-center justify-center gap-2">
            <Plus size={18}/> Add Section
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-4 md:p-10 max-w-6xl">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Pairing Schemes</h2>
          <p className="text-gray-500 mt-1 text-sm">Board-level and personal question distribution templates</p>
        </div>
        <button onClick={startNew} className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all">
          <Plus size={18}/> New Scheme
        </button>
      </div>

      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
        <select value={filterSyllabus} onChange={e => { setFilterSyllabus(e.target.value); setFilterClass(''); setFilterSubject(''); }}
          className="h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">All Boards</option>
          {syllabuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <select value={filterClass} onChange={e => { setFilterClass(e.target.value); setFilterSubject(''); }} disabled={!filterSyllabus}
          className="h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
          <option value="">All Grades</option>
          {filteredClasses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} disabled={!filterClass}
          className="h-11 px-4 bg-gray-50 border border-gray-200 rounded-xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
          <option value="">All Subjects</option>
          {filteredSubjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
      </div>

      {visibleSchemes.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-gray-100">
          <BookOpen size={40} className="mx-auto text-gray-200 mb-4"/>
          <p className="font-bold text-gray-400 uppercase tracking-widest text-sm">No schemes found</p>
          <p className="text-xs text-gray-400 mt-1">Create your first pairing scheme to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {visibleSchemes.map(scheme => {
            const sub = syllabuses.find(s => s.id === scheme.syllabusId);
            const cls = classes.find(c => c.id === scheme.classId);
            const subj = subjects.find(s => s.id === scheme.subjectId);
            const canEdit = isSuperAdmin || (!scheme.isGlobal && scheme.schoolId === user.schoolId);
            return (
              <div key={scheme.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition-all p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {scheme.isGlobal
                        ? <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-widest"><Globe size={10}/> Board</span>
                        : <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-[9px] font-black uppercase tracking-widest"><School size={10}/> Custom</span>}
                    </div>
                    <h3 className="font-black text-gray-900 text-lg leading-tight">{scheme.name}</h3>
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-2">
                      <span>{sub?.name || '—'}</span><span>•</span>
                      <span className="flex items-center gap-1"><GraduationCap size={11}/>{cls?.name || '—'}</span>
                      <span>•</span><span>{subj?.name || '—'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex gap-3 text-xs font-bold text-gray-500 mb-5">
                  <span className="flex items-center gap-1"><Hash size={11}/>{scheme.totalMarks} marks</span>
                  <span>•</span><span>{scheme.durationMin} min</span>
                  <span>•</span><span className="flex items-center gap-1"><Layers size={11}/>{(scheme.structure as SchemeSectionDef[]).length} sections</span>
                </div>
                <div className="flex gap-2">
                  {canEdit && <button onClick={() => startEdit(scheme)} className="flex-1 py-2.5 bg-gray-50 hover:bg-indigo-50 text-gray-600 hover:text-indigo-600 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5"><Edit3 size={13}/> Edit</button>}
                  {canEdit && <button onClick={() => handleDelete(scheme.id)} className="py-2.5 px-4 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl text-xs font-black transition-all"><Trash2 size={13}/></button>}
                  {!canEdit && <span className="flex-1 py-2.5 text-center text-xs font-bold text-gray-300">Read Only</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
