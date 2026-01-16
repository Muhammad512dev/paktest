import React, { useState, useEffect } from 'react';
import { getSchools, addSchool, updateSchool, deleteSchool, getPlans, getSyllabuses, getSystemConfig, uploadFile } from '../../services/dataService';
import { Search, Plus, MoreHorizontal, CheckCircle, XCircle, Building2, MapPin, Mail, Phone, X, Upload, Image as ImageIcon, Calendar, CreditCard, Clock, Lock, Tag, Check, DollarSign, Percent, Trash2, Edit2 } from 'lucide-react';
import { School, SubscriptionPlan, Syllabus } from '../../types';

const SchoolManager: React.FC = () => {
  const [schools, setSchools] = useState<School[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [syllabuses, setSyllabuses] = useState<Syllabus[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  
  /* Unified async data loading on mount */
  const loadAllData = async () => {
    const [schoolsData, plansData, syllabusesData, configData] = await Promise.all([
      getSchools(),
      getPlans(),
      getSyllabuses(),
      getSystemConfig()
    ]);
    setSchools(schoolsData);
    setPlans(plansData);
    setSyllabuses(syllabusesData);
    setCurrencySymbol(configData.currencySymbol);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  // School Form State
  const [newSchool, setNewSchool] = useState<Partial<School & { adminPassword?: string }>>({
    name: '',
    address: '',
    principalName: '',
    contactEmail: '',
    contactPhone: '',
    subscriptionPlan: '',
    status: 'Active',
    adminPassword: 'password', // Default for demo
    discount: 0,
    totalPaid: 0,
    assignedSyllabuses: [],
    subscriptionStartDate: new Date().toISOString().split('T')[0],
    validTill: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);

  // Improved helper to safely format date for input from any source
  const formatDateForInput = (dateValue?: string | Date) => {
    if (!dateValue) return '';
    try {
      const d = new Date(dateValue);
      // Check if valid date
      if (isNaN(d.getTime())) return '';
      return d.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const handleSaveSchool = async () => {
    if (!newSchool.name || !newSchool.contactEmail || !newSchool.subscriptionPlan) {
      alert("Missing required fields: Name, Email, and Subscription Plan.");
      return;
    }

    let logoUrl = newSchool.logo || ''; 
    if (logoFile) {
        try {
            logoUrl = await uploadFile(logoFile);
        } catch (e) {
            console.error("Failed to process logo", e);
            alert("Failed to upload logo image.");
            return;
        }
    }

    const school: School = {
        id: newSchool.id || `sch_${Date.now()}`,
        name: newSchool.name || '',
        address: newSchool.address || '',
        principalName: newSchool.principalName || '',
        contactEmail: newSchool.contactEmail || '',
        contactPhone: newSchool.contactPhone || '',
        subscriptionPlan: newSchool.subscriptionPlan || 'Starter',
        status: newSchool.status as any,
        logo: logoUrl,
        discount: newSchool.discount || 0,
        totalPaid: newSchool.totalPaid || 0,
        assignedSyllabuses: newSchool.assignedSyllabuses || [],
        subscriptionStartDate: newSchool.subscriptionStartDate || new Date().toISOString().split('T')[0],
        validTill: newSchool.validTill || '',
        stats: newSchool.stats || { papersCount: 0, teachersCount: 1, studentCount: 0 },
        branding: newSchool.branding
    };

    if (isEditing) {
      await updateSchool(school);
    } else {
      await addSchool(school);
    }
    
    await loadAllData();
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setIsEditing(false);
    setNewSchool({
        name: '',
        address: '',
        principalName: '',
        contactEmail: '',
        contactPhone: '',
        subscriptionPlan: '',
        status: 'Active',
        adminPassword: 'password',
        discount: 0,
        totalPaid: 0,
        assignedSyllabuses: [],
        subscriptionStartDate: new Date().toISOString().split('T')[0],
        validTill: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    });
    setLogoFile(null);
  };

  const handleEditClick = (school: School) => {
    setNewSchool({ 
        ...school, 
        adminPassword: '••••••••',
        subscriptionStartDate: formatDateForInput(school.subscriptionStartDate),
        validTill: formatDateForInput(school.validTill)
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleDeleteSchool = async (id: string) => {
    if (window.confirm("Permanently delete this institution? This action cannot be undone.")) {
      await deleteSchool(id);
      await loadAllData();
    }
  };

  const toggleSyllabus = (id: string) => {
    const current = newSchool.assignedSyllabuses || [];
    if (current.includes(id)) {
        setNewSchool({...newSchool, assignedSyllabuses: current.filter(s => s !== id)});
    } else {
        setNewSchool({...newSchool, assignedSyllabuses: [...current, id]});
    }
  };

  const filteredSchools = schools.filter(s => 
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-gray-200 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Schools & Institutions</h1>
          <p className="text-sm text-gray-500 mt-1">Manage tenant lifecycle, subscriptions, and platform access</p>
        </div>
        <button 
          onClick={() => {
              resetForm();
              setIsModalOpen(true);
          }}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-lg shadow-indigo-100"
        >
          <Plus size={18} />
          Onboard School
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 flex gap-4 bg-gray-50/50">
           <div className="relative flex-1 max-w-md">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
             <input 
                type="text"
                placeholder="Search by school name or email..."
                className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-500 text-[10px] font-bold uppercase tracking-widest border-b border-gray-200">
                <tr>
                    <th className="px-6 py-4">Institution Name</th>
                    <th className="px-6 py-4">Contact Detail</th>
                    <th className="px-6 py-4">Active Plan</th>
                    <th className="px-6 py-4">Subscription Period</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
                {filteredSchools.map((school) => (
                    <tr key={school.id} className="hover:bg-gray-50/80 transition-colors group">
                        <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded bg-white border border-gray-200 object-contain flex items-center justify-center overflow-hidden">
                                {school.logo ? (
                                    <img src={school.logo} alt={school.name} className="w-full h-full object-contain" />
                                ) : (
                                    <Building2 size={16} className="text-gray-400" />
                                )}
                            </div>
                            <div>
                                <div className="font-semibold text-sm text-gray-900">{school.name}</div>
                                <div className="text-[10px] text-gray-400 truncate max-w-[200px] flex items-center gap-1 uppercase font-bold">
                                    <MapPin size={10} /> {school.address}
                                </div>
                            </div>
                        </div>
                        </td>
                        <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">{school.principalName}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                            <Mail size={10} /> {school.contactEmail}
                        </div>
                        </td>
                        <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide border bg-white text-indigo-700 border-indigo-200`}>
                            {school.subscriptionPlan}
                        </span>
                        </td>
                        <td className="px-6 py-4">
                           <div className="flex flex-col text-xs">
                              <div className="flex items-center gap-1.5 text-gray-900 font-medium">
                                 <Calendar size={12} className="text-gray-400" /> {formatDateForInput(school.subscriptionStartDate) || 'N/A'}
                              </div>
                              <div className="flex items-center gap-1.5 text-gray-400 mt-1">
                                 <Clock size={12} /> {formatDateForInput(school.validTill)}
                              </div>
                           </div>
                        </td>
                        <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                            {school.status === 'Active' ? <CheckCircle size={14} className="text-green-500" /> : <XCircle size={14} className="text-red-500" />}
                            <span className={`text-xs font-medium ${school.status === 'Active' ? 'text-green-700' : 'text-red-700'}`}>{school.status}</span>
                        </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex justify-end items-center gap-2">
                            <button onClick={() => handleEditClick(school)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all" title="Edit School">
                                <Edit2 size={16} />
                            </button>
                            <button onClick={() => handleDeleteSchool(school.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="Delete School">
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

      {/* Onboard/Edit School Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="px-8 py-5 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                    <div>
                       <h3 className="font-bold text-xl text-gray-900">{isEditing ? 'Update Institution' : 'Onboard New Institution'}</h3>
                       <p className="text-xs text-gray-500 mt-0.5 uppercase font-bold tracking-widest">{isEditing ? 'Update core parameters' : 'Multi-Tenant Provisioning'}</p>
                    </div>
                    <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-8 overflow-y-auto space-y-8 custom-scrollbar">
                    {/* Basic Info */}
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] mb-4">Core Identity</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div className="md:col-span-2">
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">School Name</label>
                             <input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50" placeholder="e.g. Beacon International Academy" value={newSchool.name} onChange={(e) => setNewSchool({...newSchool, name: e.target.value})} />
                          </div>
                          <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Principal / Admin Name</label>
                             <input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50" placeholder="e.g. Dr. Emily Carter" value={newSchool.principalName} onChange={(e) => setNewSchool({...newSchool, principalName: e.target.value})} />
                          </div>
                          <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Address</label>
                             <input type="text" className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50" placeholder="Location..." value={newSchool.address} onChange={(e) => setNewSchool({...newSchool, address: e.target.value})} />
                          </div>
                       </div>
                    </div>

                    <div className="h-px bg-gray-100"></div>

                    {/* Logo & Contact */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] mb-4">Branding</h4>
                          <div className="flex items-center gap-5 p-4 border border-gray-200 rounded-2xl bg-gray-50/30">
                             <div className="w-16 h-16 rounded-xl bg-white border border-gray-200 flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
                                {logoFile ? <img src={URL.createObjectURL(logoFile)} alt="Preview" className="w-full h-full object-contain" /> : (newSchool.logo ? <img src={newSchool.logo} alt="Current Logo" className="w-full h-full object-contain" /> : <ImageIcon size={24} className="text-gray-300" />)}
                             </div>
                             <div className="flex-1">
                                <input type="file" accept="image/*" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} className="block w-full text-[10px] text-slate-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-[10px] file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer" />
                             </div>
                          </div>
                       </div>
                       <div className="space-y-4">
                          <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] mb-4">Credentials</h4>
                          <div className="space-y-4">
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Admin Email</label>
                                <div className="relative">
                                   <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                   <input type="email" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50" placeholder="admin@school.edu" value={newSchool.contactEmail} onChange={(e) => setNewSchool({...newSchool, contactEmail: e.target.value})} />
                                </div>
                             </div>
                             {!isEditing && (
                               <div>
                                  <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Admin Password</label>
                                  <div className="relative">
                                     <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                     <input type="password" disabled={isEditing} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50 disabled:opacity-50" placeholder="••••••••" value={newSchool.adminPassword} onChange={(e) => setNewSchool({...newSchool, adminPassword: e.target.value})} />
                                  </div>
                               </div>
                             )}
                             <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Contact Phone</label>
                                <div className="relative">
                                   <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                   <input type="text" className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50" placeholder="+1 (555) 000-0000" value={newSchool.contactPhone} onChange={(e) => setNewSchool({...newSchool, contactPhone: e.target.value})} />
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="h-px bg-gray-100"></div>

                    {/* Financials & Billing */}
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] mb-4">Financials & Billing</h4>
                       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Applied Discount (%)</label>
                             <div className="relative">
                                <Percent size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="number" className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50" placeholder="0" value={newSchool.discount} onChange={(e) => setNewSchool({...newSchool, discount: parseFloat(e.target.value) || 0})} />
                             </div>
                          </div>
                          <div>
                             <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Total Amount Paid</label>
                             <div className="relative">
                                <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                <input type="number" className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500 bg-gray-50/50" placeholder="0.00" value={newSchool.totalPaid} onChange={(e) => setNewSchool({...newSchool, totalPaid: parseFloat(e.target.value) || 0})} />
                             </div>
                          </div>
                       </div>
                    </div>

                    <div className="h-px bg-gray-100"></div>

                    {/* Curriculum Assignment */}
                    <div className="space-y-4">
                       <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em] mb-4">Curriculum Entitlements</h4>
                       <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/30 max-h-48 overflow-y-auto custom-scrollbar">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                             {syllabuses.map(s => (
                                <label key={s.id} className="flex items-center gap-3 p-2.5 hover:bg-white rounded-xl cursor-pointer transition-all border border-transparent hover:border-gray-100 group">
                                   <div 
                                      onClick={() => toggleSyllabus(s.id)}
                                      className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                                         newSchool.assignedSyllabuses?.includes(s.id) 
                                         ? 'bg-indigo-600 border-indigo-600 text-white' 
                                         : 'border-gray-300 bg-white group-hover:border-indigo-400'
                                      }`}
                                   >
                                      {newSchool.assignedSyllabuses?.includes(s.id) && <Check size={12} strokeWidth={4} />}
                                   </div>
                                   <span className="text-xs font-bold text-gray-700">{s.name}</span>
                                </label>
                             ))}
                          </div>
                       </div>
                    </div>

                    <div className="h-px bg-gray-100"></div>

                    {/* Subscription Settings */}
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                           <h4 className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.2em]">Service Contract</h4>
                           <select className="px-3 py-1 border border-gray-300 rounded-lg text-xs font-bold bg-white" value={newSchool.status} onChange={(e) => setNewSchool({...newSchool, status: e.target.value as any})}>
                               <option value="Active">Status: Active</option>
                               <option value="Trial">Status: Trial</option>
                               <option value="Suspended">Status: Suspended</option>
                           </select>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                               <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Start Date</label>
                               <div className="relative">
                                  <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input 
                                    type="date" 
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50/50" 
                                    value={formatDateForInput(newSchool.subscriptionStartDate)} 
                                    onChange={(e) => setNewSchool({...newSchool, subscriptionStartDate: e.target.value})} 
                                  />
                               </div>
                            </div>
                            <div>
                               <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Expiry Date</label>
                               <div className="relative">
                                  <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                  <input 
                                    type="date" 
                                    className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50/50" 
                                    value={formatDateForInput(newSchool.validTill)} 
                                    onChange={(e) => setNewSchool({...newSchool, validTill: e.target.value})} 
                                  />
                               </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-gray-500 uppercase mb-3">Choose Provisioned Plan</label>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                                {plans.map(plan => (
                                    <div 
                                        key={plan.id}
                                        onClick={() => setNewSchool({...newSchool, subscriptionPlan: plan.name})}
                                        className={`cursor-pointer rounded-2xl border p-4 transition-all relative overflow-hidden group ${
                                            newSchool.subscriptionPlan === plan.name 
                                            ? 'border-indigo-600 bg-indigo-50 ring-2 ring-indigo-600 ring-offset-2' 
                                            : 'border-gray-200 bg-white hover:border-indigo-300'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-2">
                                           <div className={`p-1.5 rounded-lg ${newSchool.subscriptionPlan === plan.name ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                              <CreditCard size={14} />
                                           </div>
                                           <span className="text-[10px] font-bold text-gray-400 group-hover:text-indigo-600 transition-colors uppercase">{currencySymbol}{plan.price}</span>
                                        </div>
                                        <div className="font-extrabold text-sm text-gray-900 group-hover:text-indigo-700 transition-colors">{plan.name}</div>
                                        <div className="text-[10px] text-gray-500 mt-1">Up to {plan.limits.papers} Papers</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                    <button onClick={() => setIsModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-all">Cancel</button>
                    <button 
                       onClick={handleSaveSchool} 
                       disabled={!newSchool.name || !newSchool.subscriptionPlan}
                       className="px-10 py-2.5 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isEditing ? 'Save Changes' : 'Provision School'}
                    </button>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default SchoolManager;