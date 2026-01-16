
import React, { useState, useEffect } from 'react';
import { getStaff, addStaff, updateStaff, deleteStaff, getSchoolById, getPlans } from '../../services/dataService';
import { Staff, User } from '../../types';
import { SUBJECTS } from '../../constants';
import { Search, Plus, Mail, Shield, BookOpen, X, Check, Trash2, Edit2, User as UserIcon, Lock } from 'lucide-react';

interface StaffManagerProps {
  user?: User; // Optional to support direct usage
}

const StaffManager: React.FC<StaffManagerProps> = ({ user }) => {
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [staffLimit, setStaffLimit] = useState<number>(100);
  const [canAddStaff, setCanAddStaff] = useState(true);
  
  const loadStaffData = async () => {
    setLoading(true);
    try {
      // 1. Load Staff
      const list = await getStaff();
      setStaffList(list.map(s => ({
          ...s,
          subjects: s.subjects || []
      })));

      // 2. Check Subscription Limits
      if (user?.schoolId) {
          const schoolData = await getSchoolById(user.schoolId);
          const plans = await getPlans();
          const currentPlan = plans.find(p => p.name === schoolData.subscriptionPlan);
          
          if (currentPlan) {
              const limit = currentPlan.limits.staff;
              setStaffLimit(limit);
              setCanAddStaff(list.length < limit);
          }
      }
    } catch (err) {
      console.error("Failed to load staff", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaffData();
  }, [user?.schoolId]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Partial<Staff & { password?: string }>>({
    name: '',
    email: '',
    role: 'TEACHER' as any, // Default correctly
    subjects: [],
    status: 'Active',
    avatar: '',
    password: ''
  });

  const filteredStaff = staffList.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleOpenModal = (staff?: Staff) => {
    if (staff) {
      setEditingStaff({ ...staff, password: '' });
    } else {
      setEditingStaff({
        name: '',
        email: '',
        role: 'TEACHER' as any,
        subjects: [],
        status: 'Active',
        avatar: '',
        password: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff.name || !editingStaff.email) return;

    try {
      if (editingStaff.id) {
        await updateStaff(editingStaff as any); // Cast to any to send password if changed
      } else {
        const newStaff: any = { // Cast to any to include password
          id: crypto.randomUUID(),
          name: editingStaff.name || 'New User',
          email: editingStaff.email || '',
          role: editingStaff.role as any,
          subjects: editingStaff.subjects || [],
          status: editingStaff.status as any,
          lastActive: 'Just Added',
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(editingStaff.name || '')}&background=random`,
          password: editingStaff.password // Explicitly add password
        };
        await addStaff(newStaff);
      }
      await loadStaffData();
      setIsModalOpen(false);
    } catch (err) {
      alert("Error saving staff member.");
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to remove this staff member?")) {
      await deleteStaff(id);
      await loadStaffData();
    }
  };

  const toggleSubject = (subjectName: string) => {
    const currentSubjects = editingStaff.subjects || [];
    if (currentSubjects.includes(subjectName)) {
      setEditingStaff({ ...editingStaff, subjects: currentSubjects.filter(s => s !== subjectName) });
    } else {
      setEditingStaff({ ...editingStaff, subjects: [...currentSubjects, subjectName] });
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 md:mb-8 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-900">Staff & Teachers</h1>
          <p className="text-gray-500 mt-1 text-sm md:text-base">Manage teacher accounts and permissions ({staffList.length}/{staffLimit})</p>
        </div>
        <button 
          onClick={() => canAddStaff && handleOpenModal()}
          disabled={!canAddStaff}
          title={!canAddStaff ? "Staff limit reached for current plan" : "Add Staff"}
          className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm w-full md:w-auto justify-center ${
              canAddStaff 
              ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
              : 'bg-gray-400 text-white cursor-not-allowed'
          }`}
        >
          {canAddStaff ? <Plus size={18} /> : <Lock size={18}/>}
          {canAddStaff ? 'Add Staff' : 'Limit Reached'}
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden h-full flex flex-col">
        <div className="p-4 border-b border-gray-200 flex gap-4 bg-gray-50/50">
           <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
             <input 
                type="text"
                placeholder="Search by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center p-20">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-6 bg-gray-50 overflow-y-auto">
             {filteredStaff.map(staff => (
                <div key={staff.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all relative group">
                   <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                      <button onClick={() => handleOpenModal(staff)} className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded">
                         <Edit2 size={16} />
                      </button>
                      <button onClick={() => handleDelete(staff.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                         <Trash2 size={16} />
                      </button>
                   </div>

                   <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-4">
                         <img src={staff.avatar} alt={staff.name} className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                         <div className="overflow-hidden">
                            <h3 className="font-bold text-gray-900 truncate pr-6">{staff.name}</h3>
                            <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5 truncate">
                               <Mail size={12} className="shrink-0" /> {staff.email}
                            </div>
                         </div>
                      </div>
                   </div>
                   
                   <div className="space-y-3">
                      <div className="flex justify-between text-sm py-2 border-t border-b border-gray-100">
                         <div className="flex items-center gap-2 text-gray-600">
                            <Shield size={16} className="text-indigo-500" />
                            <span className="font-medium uppercase text-xs">{staff.role.replace('_', ' ')}</span>
                         </div>
                         <div className={`px-2 py-0.5 rounded text-xs font-medium ${staff.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                            {staff.status}
                         </div>
                      </div>
                      
                      <div>
                         <p className="text-xs text-gray-500 uppercase font-bold mb-2 flex items-center gap-1">
                            <BookOpen size={12} /> Assigned Subjects
                         </p>
                         <div className="flex flex-wrap gap-1">
                            {staff.subjects && staff.subjects.length > 0 ? (
                               staff.subjects.map(sub => (
                                  <span key={sub} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded border border-gray-200">
                                     {sub}
                                  </span>
                               ))
                            ) : (
                               <span className="text-xs text-gray-400 italic">No subjects assigned</span>
                            )}
                         </div>
                      </div>
                   </div>
                </div>
             ))}
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                 <h3 className="font-bold text-lg text-gray-900">{editingStaff.id ? 'Edit Staff Member' : 'Add New Staff'}</h3>
                 <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-1 rounded-lg">
                    <X size={20} />
                 </button>
              </div>
              
              <form onSubmit={handleSave} className="p-6 overflow-y-auto space-y-6">
                 <div className="flex flex-col items-center mb-2">
                    <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-200 mb-2 border-2 border-dashed border-indigo-200">
                       {editingStaff.name ? (
                         <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(editingStaff.name)}&background=random`} alt="preview" className="w-full h-full rounded-full" />
                       ) : (
                         <UserIcon size={32} />
                       )}
                    </div>
                 </div>

                 <div className="space-y-4">
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Full Name</label>
                    <input 
                        required
                        type="text" 
                        value={editingStaff.name}
                        onChange={e => setEditingStaff({...editingStaff, name: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        placeholder="e.g. John Doe"
                    />
                    
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Email Address</label>
                    <input 
                        required
                        type="email" 
                        value={editingStaff.email}
                        onChange={e => setEditingStaff({...editingStaff, email: e.target.value})}
                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        placeholder="john@school.edu"
                    />

                    {!editingStaff.id && (
                      <>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Password</label>
                        <input 
                            required
                            type="password" 
                            value={editingStaff.password}
                            onChange={e => setEditingStaff({...editingStaff, password: e.target.value})}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                            placeholder="••••••••"
                        />
                      </>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Role</label>
                        <select 
                            value={editingStaff.role}
                            onChange={e => setEditingStaff({...editingStaff, role: e.target.value as any})}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                            <option value="TEACHER">Teacher</option>
                            <option value="SCHOOL_ADMIN">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Status</label>
                        <select 
                            value={editingStaff.status}
                            onChange={e => setEditingStaff({...editingStaff, status: e.target.value as any})}
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                        >
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                       <p className="text-xs font-bold text-gray-500 uppercase">Assigned Subjects</p>
                       <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-gray-100 p-2 rounded-lg">
                          {Array.from(new Set(SUBJECTS.map(s => s.name))).map(subjectName => (
                             <button
                                key={subjectName}
                                type="button"
                                onClick={() => toggleSubject(subjectName)}
                                className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                   editingStaff.subjects?.includes(subjectName)
                                   ? 'bg-indigo-600 border-indigo-600 text-white shadow-sm'
                                   : 'bg-white border-gray-200 text-gray-600 hover:border-indigo-300'
                                }`}
                             >
                                {subjectName}
                             </button>
                          ))}
                       </div>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-gray-200 flex justify-end gap-3">
                    <button type="button" onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl">Cancel</button>
                    <button type="submit" className="px-10 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg">Save Staff Member</button>
                 </div>
              </form>
           </div>
        </div>
      )}
    </div>
  );
};

export default StaffManager;
