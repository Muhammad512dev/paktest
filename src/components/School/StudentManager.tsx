import React, { useState, useEffect, useRef } from 'react';
import { getStudents, addStudent, updateStudent, addStudentsBulk, deleteStudent, getClasses, getSyllabuses, getSubjects, getPlans, getSchoolById } from '../../services/dataService';
import { Student, ClassLevel, User, Syllabus, Subject } from '../../types';
import { Search, Plus, Mail, BookOpen, X, Trash2, Edit2, User as UserIcon, GraduationCap, Download, Upload, FileSpreadsheet, AlertCircle, CheckCircle, Lock, Database, Users } from 'lucide-react';
import * as XLSX from 'xlsx';

interface StudentManagerProps {
  user?: User;
}

const StudentManager: React.FC<StudentManagerProps> = ({ user }) => {
  const [isOnlineTestEnabled, setIsOnlineTestEnabled] = useState<boolean | null>(null);
  const planHasOnlineTest = (features: any) =>
    Array.isArray(features) && features.some((f: any) => {
      const s = String(f || '').toLowerCase();
      return s.includes('online') && (s.includes('test') || s.includes('exam'));
    });
  const [students, setStudents] = useState<Student[]>([]);
  const [syllabuses, setSyllabuses] = useState<Syllabus[]>([]);
  const [allClasses, setAllClasses] = useState<ClassLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, pages: 0 });
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(Date.now());
  const [allowedModules, setAllowedModules] = useState<string[]>([]);
  const [school, setSchool] = useState<any>(null);

  // Filter States
  const [filterSyllabus, setFilterSyllabus] = useState<string>('ALL');
  const [filterClass, setFilterClass] = useState<string>('ALL');

  // Selection States for Modal
  const [selectedSyllabusId, setSelectedSyllabusId] = useState<string>('');
  const [filteredClasses, setFilteredClasses] = useState<ClassLevel[]>([]);

  const [editingStudent, setEditingStudent] = useState<Partial<Student & { password?: string }>>({
    name: '',
    email: '',
    rollNo: '',
    classId: '',
    assignedSubjects: [],
    password: ''
  });

  const loadStaticData = async () => {
    setLoading(true);
    try {
      // Package gate: Online Test controls student management & import
      if (user?.schoolId) {
        const [school, plans] = await Promise.all([getSchoolById(user.schoolId), getPlans()]);
        const plan = plans.find((p: any) => p.name === school?.subscriptionPlan);
        const enabled = planHasOnlineTest(plan?.features);
        setIsOnlineTestEnabled(!!enabled);
        if (!enabled) {
          setLoading(false);
          return;
        }
      } else {
        setIsOnlineTestEnabled(true);
      }

      const [classList, syllabusList, subjectList] = await Promise.all([
        getClasses(),
        getSyllabuses(),
        getSubjects()
      ]);
      setAllClasses(classList);
      setSyllabuses(syllabusList);
      setSubjects(subjectList);
    } catch (err) {
      console.error("Failed to load student data", err);
    } finally {
      setLoading(false);
    }
  };

  const loadStudents = async () => {
    setLoading(true);
    try {
      const params: any = { 
        page, 
        pageSize, 
        q: debouncedSearch || undefined 
      };
      
      if (filterClass !== 'ALL') params.classId = filterClass;
      else if (filterSyllabus !== 'ALL') params.syllabusId = filterSyllabus;
      
      const resp = await getStudents(params);
      setStudents(resp.data || []);
      setPagination(resp.pagination || { page, pageSize, total: 0, pages: 0 });
    } catch (err) {
      console.error("Failed to load students", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaticData();
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedSearch(searchTerm.trim());
      setPage(1);
    }, 250);
    return () => window.clearTimeout(t);
  }, [searchTerm]);

  useEffect(() => {
    loadStudents();
  }, [page, pageSize, debouncedSearch, filterClass, filterSyllabus]);

  if (isOnlineTestEnabled === false) {
    return (
      <div className="p-6 md:p-10 max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl border border-gray-200 shadow-xl overflow-hidden">
          <div className="p-10 bg-gray-50 border-b border-gray-200 text-center">
            <AlertCircle className="mx-auto text-amber-500 mb-4" size={48} />
            <h2 className="text-2xl font-black text-gray-900">Student Management Restricted</h2>
            <p className="text-gray-600 mt-2 text-sm leading-relaxed max-w-xl mx-auto">
              Your current package does not include the <strong>Online Test</strong> feature. Student import, student accounts, and online testing are disabled.
            </p>
          </div>
          <div className="p-8 text-center">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Next Step</p>
            <p className="text-sm text-gray-700 font-medium">Please upgrade your package to enable Online Testing and Student Management.</p>
          </div>
        </div>
      </div>
    );
  }

  // Update filtered classes when syllabus changes
  useEffect(() => {
    if (selectedSyllabusId) {
      const filtered = allClasses.filter(c => c.syllabusId === selectedSyllabusId);
      setFilteredClasses(filtered);
      // Reset class selection if not in filtered list
      if (!filtered.find(c => c.id === editingStudent.classId)) {
        setEditingStudent(prev => ({ ...prev, classId: filtered[0]?.id || '' }));
      }
    } else {
      setFilteredClasses([]);
    }
  }, [selectedSyllabusId, allClasses]);

  const handleOpenModal = (student?: Student) => {
    if (student) {
      setEditingStudent({
        ...student,
        rollNo: student.rollNo || '',
        assignedSubjects: student.assignedSubjects || [],
        password: ''
      });
      setSelectedSyllabusId(student.classLevel?.syllabusId || '');
    } else {
      setEditingStudent({
        name: '',
        email: '',
        rollNo: '',
        classId: '',
        assignedSubjects: [],
        password: ''
      });
      setSelectedSyllabusId(syllabuses[0]?.id || '');
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Create a clean object to avoid circular structures (React Fiber nodes etc)
      const studentData = {
        id: editingStudent.id,
        name: editingStudent.name,
        email: editingStudent.email,
        rollNo: editingStudent.rollNo,
        classId: editingStudent.classId,
        assignedSubjects: editingStudent.assignedSubjects,
        password: editingStudent.password
      };

      if (editingStudent.id) {
        await updateStudent(studentData);
      } else {
        await addStudent(studentData);
      }
      await loadStudents();
      setIsModalOpen(false);
    } catch (err: any) {
      console.error("Error saving student:", err);
      alert(`Error saving student: ${err.message || "Unknown error"}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this student?")) {
      await deleteStudent(id);
      await loadStudents();
    }
  };

  // --- EXCEL LOGIC ---
  const handleExport = () => {
    const data = students.map(s => ({
      Name: s.name,
      Email: s.email,
      Syllabus: syllabuses.find(sys => sys.id === s.classLevel?.syllabusId)?.name,
      Class: s.classLevel?.name,
      Subjects: (s.assignedSubjects || []).join(', '),
      CreatedAt: new Date(s.createdAt).toLocaleDateString()
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");
    XLSX.writeFile(wb, "Student_List.xlsx");
  };

  const handleDownloadTemplate = () => {
    const template = [
      { Name: "John Doe", Email: "john@example.com", RollNumber: "101", Class: "Class 9", Syllabus: "Federal Board", Subjects: "Physics, Math, Chemistry" }
    ];
    // Add instructions sheet with Class IDs
    const ws = XLSX.utils.json_to_sheet(template);
    const wsClasses = XLSX.utils.json_to_sheet(allClasses.map(c => ({
      ID: c.id,
      ClassName: c.name,
      Syllabus: syllabuses.find(s => s.id === c.syllabusId)?.name
    })));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Data");
    XLSX.utils.book_append_sheet(wb, wsClasses, "Class_ID_Reference");
    XLSX.writeFile(wb, "Student_Import_Template.xlsx");
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data: any[] = XLSX.utils.sheet_to_json(ws);

        const studentsToImport = data.map(row => {
          const classObj = allClasses.find(c => c.name === row.Class && syllabuses.find(sys => sys.id === c.syllabusId)?.name === row.Syllabus);
          return {
            name: row.Name,
            email: row.Email,
            rollNo: row.RollNumber?.toString(),
            classId: classObj?.id || '',
            assignedSubjects: row.Subjects ? row.Subjects.split(',').map((s: string) => s.trim()) : []
          };
        }).filter(s => s.name && s.email && s.classId);

        if (studentsToImport.length > 0) {
          await addStudentsBulk(studentsToImport);
          alert(`Successfully imported ${studentsToImport.length} students!`);
          setPage(1);
          await loadStudents();
        } else {
          alert("No valid student data found in the file.");
        }
      } catch (err) {
        alert("Failed to parse Excel file. Please ensure you use the template.");
      }
      setFileInputKey(Date.now()); // Reset input
    };
    reader.readAsBinaryString(file);
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header with Glassmorphism */}
      <div className="bg-white/40 backdrop-blur-md rounded-3xl p-8 border border-white/20 shadow-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Student Command Center</h1>
          <p className="text-slate-500 font-medium mt-1">Enroll, track and manage your student database with ease.</p>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={handleExport}
            className="px-5 py-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-50 transition-all flex items-center gap-2 shadow-sm"
          >
            <Download size={18} />
            Export
          </button>
          <div className="relative">
            <button
              onClick={() => document.getElementById('excel-import')?.click()}
              className="px-5 py-2.5 bg-indigo-50 border border-indigo-100 text-indigo-600 rounded-2xl font-bold text-sm hover:bg-indigo-100 transition-all flex items-center gap-2 shadow-sm"
            >
              <Upload size={18} />
              Import Excel
            </button>
            <input
              key={fileInputKey}
              id="excel-import"
              type="file"
              accept=".xlsx, .xls"
              className="hidden"
              onChange={handleImport}
            />
          </div>
          <button
            onClick={() => handleOpenModal()}
            className="px-6 py-2.5 bg-slate-900 text-white rounded-2xl font-bold text-sm hover:bg-slate-800 transition-all flex items-center gap-2 shadow-xl shadow-slate-900/20"
          >
            <Plus size={18} />
            New Student
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><Users size={24} /></div>
            <span className="text-2xl font-black text-slate-900">{pagination.total}</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Enrolled</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><BookOpen size={24} /></div>
            <span className="text-2xl font-black text-slate-900">{syllabuses.length}</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Active Boards/Syllabuses</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><GraduationCap size={24} /></div>
            <span className="text-2xl font-black text-slate-900">{allClasses.length}</span>
          </div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Configured Classes</p>
        </div>
      </div>

      {/* Main Table Container */}
      <div className="bg-white rounded-[2rem] border border-slate-100 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="Find student by name, email or roll number..."
              className="w-full pl-12 pr-6 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap gap-3 w-full md:w-auto">
            <select 
              className="px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-xs"
              value={filterSyllabus}
              onChange={(e) => { setFilterSyllabus(e.target.value); setFilterClass('ALL'); }}
            >
              <option value="ALL">All Boards</option>
              {syllabuses.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <select 
              className="px-4 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-xs disabled:opacity-50"
              value={filterClass}
              disabled={filterSyllabus === 'ALL'}
              onChange={(e) => setFilterClass(e.target.value)}
            >
              <option value="ALL">All Classes</option>
              {allClasses.filter(c => c.syllabusId === filterSyllabus).map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <button 
              onClick={() => loadStudents()}
              className="p-3 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
              title="Refresh Records"
            >
              <Database size={18} />
            </button>
          </div>

          <button
            onClick={handleDownloadTemplate}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1.5 px-4 py-2 hover:bg-indigo-50 rounded-xl transition-all"
          >
            <FileSpreadsheet size={16} />
            Get Import Template
          </button>
        </div>

        {loading ? (
          <div className="flex flex-col justify-center items-center py-32 space-y-4">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px]">Synchronizing Records...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-widest border-b border-slate-100">
                  <th className="px-8 py-5">Profile & Contact</th>
                  <th className="px-8 py-5">Roll No</th>
                  <th className="px-8 py-5">Board/Syllabus</th>
                  <th className="px-8 py-5">Academic Class</th>
                  <th className="px-8 py-5 text-right">Operation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(student => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-lg border border-indigo-100 shadow-sm">
                          {student.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{student.name}</p>
                          <p className="text-xs text-slate-400 font-medium flex items-center gap-1">
                            <Mail size={12} /> {student.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black">
                        {student.rollNo || 'UNSET'}
                      </span>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-slate-700">
                        {syllabuses.find(s => s.id === student.classLevel?.syllabusId)?.name || 'N/A'}
                      </p>
                    </td>
                    <td className="px-8 py-5">
                      <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold">
                        {student.classLevel?.name || 'Pending'}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all duration-200">
                        <button onClick={() => handleOpenModal(student)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-colors">
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(student.id)} className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {students.length === 0 && (
              <div className="text-center py-32">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100">
                  <Search className="text-slate-300" size={32} />
                </div>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No records matching your search</p>
              </div>
            )}

            {pagination.pages > 1 && (
              <div className="px-8 py-4 border-t border-slate-100 bg-white flex items-center justify-between">
                <div className="text-xs font-bold text-slate-500">
                  Page {pagination.page} of {pagination.pages} · {pagination.total} students
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={pagination.page <= 1 || loading}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs disabled:opacity-50 hover:bg-slate-50"
                  >
                    Prev
                  </button>
                  <button
                    type="button"
                    onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                    disabled={pagination.page >= pagination.pages || loading}
                    className="px-4 py-2 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs disabled:opacity-50 hover:bg-slate-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modern Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20 animate-in zoom-in-95 duration-200">
            <div className="px-10 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h3 className="font-black text-xl text-slate-900 tracking-tight">{editingStudent.id ? 'Refine Profile' : 'Student Enrollment'}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-0.5">Official Academic Records</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-900 transition-all shadow-sm">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Full Identity Name</label>
                  <input
                    required
                    type="text"
                    value={editingStudent.name}
                    onChange={e => setEditingStudent({ ...editingStudent, name: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                    placeholder="e.g. Alexander Pierce"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Official Email Address</label>
                  <input
                    required
                    type="email"
                    value={editingStudent.email}
                    onChange={e => setEditingStudent({ ...editingStudent, email: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                    placeholder="alexander@school.edu"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Unique Roll Number</label>
                  <input
                    type="text"
                    value={editingStudent.rollNo}
                    onChange={e => setEditingStudent({ ...editingStudent, rollNo: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                    placeholder="e.g. 2024-001"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Academic Board/Syllabus</label>
                  <select
                    required
                    value={selectedSyllabusId}
                    onChange={e => setSelectedSyllabusId(e.target.value)}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 appearance-none"
                  >
                    <option value="">Select Board...</option>
                    {syllabuses.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Designated Academic Class</label>
                  <select
                    required
                    disabled={!selectedSyllabusId}
                    value={editingStudent.classId}
                    onChange={e => setEditingStudent({ ...editingStudent, classId: e.target.value })}
                    className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700 appearance-none disabled:opacity-50"
                  >
                    <option value="">Select Class...</option>
                    {filteredClasses.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>

                {editingStudent.classId && (
                  <div className="col-span-2 space-y-4">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-2">
                      <BookOpen size={14} /> Subject Entitlements
                    </label>
                    <div className="grid grid-cols-2 gap-3 p-6 bg-slate-50 border border-slate-200 rounded-3xl max-h-48 overflow-y-auto custom-scrollbar">
                      {subjects.filter(s => s.classId === editingStudent.classId).map(sub => (
                        <label key={sub.id} className="flex items-center gap-3 p-3 bg-white border border-slate-100 rounded-xl cursor-pointer hover:border-indigo-500 transition-all group">
                          <input
                            type="checkbox"
                            checked={editingStudent.assignedSubjects?.includes(sub.name)}
                            onChange={(e) => {
                              const current = editingStudent.assignedSubjects || [];
                              const updated = e.target.checked
                                ? [...current, sub.name]
                                : current.filter(s => s !== sub.name);
                              setEditingStudent({ ...editingStudent, assignedSubjects: updated });
                            }}
                            className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                          />
                          <span className="text-xs font-bold text-slate-700 group-hover:text-indigo-600">{sub.name}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
                {!editingStudent.id && (
                  <div className="col-span-2">
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Portal Access Password</label>
                    <input
                      required
                      type="password"
                      value={editingStudent.password}
                      onChange={e => setEditingStudent({ ...editingStudent, password: e.target.value })}
                      className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-slate-700"
                      placeholder="••••••••"
                    />
                    <p className="text-[10px] text-slate-400 font-bold mt-2 ml-1">* Defaults to 'student123' if left blank</p>
                  </div>
                )}
              </div>

              <div className="pt-8 flex justify-end gap-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-8 py-4 text-xs font-black text-slate-400 hover:text-slate-900 transition-all uppercase tracking-widest">Discard</button>
                <button type="submit" className="px-10 py-4 bg-slate-900 text-white rounded-[1.25rem] font-black uppercase tracking-[0.2em] text-xs hover:bg-slate-800 shadow-xl shadow-slate-900/20 active:scale-[0.98] transition-all">
                  {editingStudent.id ? 'Save Changes' : 'Confirm Enrollment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentManager;
