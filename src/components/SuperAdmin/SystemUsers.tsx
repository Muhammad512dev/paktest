
import React, { useState, useEffect } from 'react';
import { getUsers, addUser, updateUser, deleteUser, getSchools, getSyllabuses } from '../../services/dataService';
import { User, UserRole, School, Syllabus } from '../../types';
import { 
  Search, 
  Shield, 
  UserCheck, 
  GraduationCap, 
  Plus, 
  X, 
  Mail, 
  Lock, 
  User as UserIcon, 
  Building2, 
  MoreHorizontal,
  BookOpen,
  Check,
  Trash2,
  Edit2
} from 'lucide-react';

const SystemUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [syllabuses, setSyllabuses] = useState<Syllabus[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    const loadAllData = async () => {
      const [usersData, schoolsData, syllabusesData] = await Promise.all([
        getUsers(),
        getSchools(),
        getSyllabuses()
      ]);
      setUsers(usersData);
      setSchools(schoolsData);
      setSyllabuses(syllabusesData);
    };
    loadAllData();
  }, []);

  // Modal State
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    id: '',
    name: '',
    email: '',
    role: UserRole.SCHOOL_ADMIN,
    password: 'password',
    schoolId: '',
    assignedSyllabuses: [] as string[]
  });

  const filteredUsers = users.filter(u => 
    (roleFilter === 'All' || u.role === roleFilter) &&
    (u.name.toLowerCase().includes(searchTerm.toLowerCase()) || u.email.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getRoleIcon = (role: UserRole) => {
    switch(role) {
        case UserRole.SUPER_ADMIN: return <Shield size={18} className="text-purple-600" />;
        case UserRole.SCHOOL_ADMIN: return <UserCheck size={18} className="text-blue-600" />;
        case UserRole.TEACHER: return <GraduationCap size={18} className="text-emerald-600" />;
    }
  };

  const getSchoolName = (id?: string) => {
    if (!id) return null;
    return schools.find(s => s.id === id)?.name || 'Unknown School';
  };

  const handleToggleSyllabus = (id: string) => {
    setNewUser(prev => {
        const current = prev.assignedSyllabuses || [];
        if (current.includes(id)) {
            return { ...prev, assignedSyllabuses: current.filter(item => item !== id) };
        } else {
            return { ...prev, assignedSyllabuses: [...current, id] };
        }
    });
  };

  const resetForm = () => {
    setIsEditing(false);
    setNewUser({ 
      id: '',
      name: '', 
      email: '', 
      role: UserRole.SCHOOL_ADMIN, 
      password: 'password', 
      schoolId: '',
      assignedSyllabuses: []
    });
  };

  const handleEditClick = (user: User) => {
    setNewUser({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      password: '', // Empty means do not change unless user types
      schoolId: user.schoolId || '',
      assignedSyllabuses: user.assignedSyllabuses || []
    });
    setIsEditing(true);
    setIsAddUserOpen(true);
  };

  const handleDeleteUser = async (id: string) => {
    if (window.confirm("Permanently delete this user account?")) {
      await deleteUser(id);
      const usersData = await getUsers();
      setUsers(usersData);
    }
  };

  const handleSaveUser = async () => {
    if (!newUser.name || !newUser.email) return;

    if (newUser.role !== UserRole.SUPER_ADMIN && !newUser.schoolId) {
        alert("Please select a school for this user.");
        return;
    }

    // Explicitly include password in the payload
    const userData: any = {
        id: newUser.id || `usr_${Date.now()}`,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        password: newUser.password, 
        schoolId: newUser.role === UserRole.SUPER_ADMIN ? undefined : newUser.schoolId,
        assignedSyllabuses: newUser.assignedSyllabuses || [],
        lastLogin: newUser.id ? users.find(u => u.id === newUser.id)?.lastLogin : 'Never',
        avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(newUser.name)}&background=random`,
    };

    try {
        if (isEditing) {
          await updateUser(userData);
        } else {
          await addUser(userData);
        }
        
        const usersData = await getUsers();
        setUsers(usersData);
        setIsAddUserOpen(false);
        resetForm();
    } catch (e) {
        console.error("Save failed", e);
        alert("Failed to save user. Check console for details.");
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Users</h1>
          <p className="text-gray-600 mt-2 text-lg">Manage global user accounts, permissions, and platform admins.</p>
        </div>
        <button 
          onClick={() => { resetForm(); setIsAddUserOpen(true); }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm text-sm"
        >
          <Plus size={20} />
          Create User
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-200 flex gap-4 bg-gray-50/50">
            <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input 
                   type="text" 
                   placeholder="Search users by name or email..." 
                   className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg outline-none focus:border-indigo-500 text-sm"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>
            <select 
               className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm outline-none bg-white"
               value={roleFilter}
               onChange={(e) => setRoleFilter(e.target.value)}
            >
                <option value="All">All Roles</option>
                <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                <option value={UserRole.SCHOOL_ADMIN}>School Admin</option>
                <option value={UserRole.TEACHER}>Teacher</option>
            </select>
        </div>

        <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider">
                    <tr>
                        <th className="px-6 py-4">User Details</th>
                        <th className="px-6 py-4">Role & Permissions</th>
                        <th className="px-6 py-4">Assigned School</th>
                        <th className="px-6 py-4">Curriculum Access</th>
                        <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredUsers.map(user => (
                        <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-4">
                                    <img src={user.avatar} className="w-10 h-10 rounded-full border border-gray-200" alt="" />
                                    <div>
                                        <div className="font-semibold text-gray-900 text-sm">{user.name}</div>
                                        <div className="text-xs text-gray-500">{user.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2 text-sm text-gray-700">
                                    {getRoleIcon(user.role)}
                                    <span className="capitalize font-medium">{user.role.replace('_', ' ').toLowerCase()}</span>
                                </div>
                            </td>
                            <td className="px-6 py-4">
                                {user.schoolId ? (
                                    <div className="flex items-center gap-2">
                                        <Building2 size={16} className="text-gray-400" />
                                        <span className="text-sm text-gray-700 font-medium">
                                            {getSchoolName(user.schoolId)}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-xs text-purple-600 font-bold bg-purple-50 px-2 py-1 rounded border border-purple-100 uppercase tracking-tight">Platform Global</span>
                                )}
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex flex-wrap gap-1 max-w-[200px]">
                                    {user.assignedSyllabuses && user.assignedSyllabuses.length > 0 ? (
                                        user.assignedSyllabuses.map(sid => (
                                            <span key={sid} className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 font-bold">
                                                {syllabuses.find(s => s.id === sid)?.name || sid}
                                            </span>
                                        ))
                                    ) : (
                                        <span className="text-xs text-gray-400 italic">No Restrictions</span>
                                    )}
                                </div>
                            </td>
                            <td className="px-6 py-4 text-right">
                              <div className="flex justify-end items-center gap-2">
                                <button onClick={() => handleEditClick(user)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit User">
                                    <Edit2 size={16} />
                                </button>
                                <button onClick={() => handleDeleteUser(user.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete User">
                                    <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>

      {/* CREATE/EDIT USER MODAL */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
           <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg flex flex-col overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-lg text-gray-900">{isEditing ? 'Update User Account' : 'Create New User'}</h3>
                 <button onClick={() => setIsAddUserOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-200 transition-colors">
                    <X size={20} />
                 </button>
              </div>
              
              <div className="p-6 space-y-5 overflow-y-auto max-h-[75vh]">
                 <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Full Name</label>
                        <div className="relative">
                            <UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="text" 
                                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                placeholder="e.g. Sarah Connor"
                                value={newUser.name}
                                onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1.5">Email Address</label>
                        <div className="relative">
                            <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input 
                                type="email" 
                                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                placeholder="user@examforge.com"
                                value={newUser.email}
                                onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">System Role</label>
                            <select 
                                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                                value={newUser.role}
                                onChange={(e) => setNewUser({...newUser, role: e.target.value as UserRole})}
                            >
                                <option value={UserRole.SCHOOL_ADMIN}>School Admin</option>
                                <option value={UserRole.TEACHER}>Teacher</option>
                                <option value={UserRole.SUPER_ADMIN}>Super Admin</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">{isEditing ? 'New Password (Optional)' : 'Initial Password'}</label>
                            <div className="relative">
                                <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input 
                                    type="password" 
                                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                                    placeholder="••••••••"
                                    value={newUser.password}
                                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                                />
                            </div>
                        </div>
                    </div>

                    {newUser.role !== UserRole.SUPER_ADMIN && (
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-1.5">Assign School</label>
                            <div className="relative">
                                <Building2 size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <select 
                                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 text-sm bg-white"
                                    value={newUser.schoolId}
                                    onChange={(e) => setNewUser({...newUser, schoolId: e.target.value})}
                                >
                                    <option value="">Select a School</option>
                                    {schools.map(school => (
                                        <option key={school.id} value={school.id}>{school.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">Curriculum Assignment (Assigned Syllabuses)</label>
                        <div className="border border-gray-200 rounded-lg p-3 grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                            {syllabuses.map(s => (
                                <label key={s.id} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer group">
                                    <div 
                                        onClick={() => handleToggleSyllabus(s.id)}
                                        className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                            (newUser.assignedSyllabuses || []).includes(s.id) 
                                            ? 'bg-indigo-600 border-indigo-600 text-white' 
                                            : 'border-gray-300 bg-white group-hover:border-indigo-400'
                                        }`}
                                    >
                                        {(newUser.assignedSyllabuses || []).includes(s.id) && <Check size={12} />}
                                    </div>
                                    <span className="text-sm text-gray-700">{s.name}</span>
                                </label>
                            ))}
                        </div>
                        <p className="text-[10px] text-gray-500 mt-2 italic">If none selected, user will have access to all global curriculum resources by default.</p>
                    </div>
                 </div>
              </div>

              <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                 <button 
                    onClick={() => setIsAddUserOpen(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                 >
                    Cancel
                 </button>
                 <button 
                    onClick={handleSaveUser}
                    className="px-6 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 shadow-sm transition-colors"
                 >
                    {isEditing ? 'Save Changes' : 'Create Account'}
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default SystemUsers;
