
import React, { useState, useEffect } from 'react';
import { MOCK_SCHOOLS, MOCK_USERS } from '../constants';
import { UserRole, SchoolBranding, SystemConfig, User, NotificationConfig } from '../types';
import { getSystemConfig, updateSystemConfig, updateUser, updateSchool, getUsers, getSchoolById, getCurrentUser } from '../services/dataService';
import { 
  Building2, 
  Palette, 
  Lock, 
  Bell, 
  Save, 
  Upload, 
  Eye, 
  EyeOff,
  User as UserIcon,
  Shield,
  Check,
  Type,
  Languages,
  Camera,
  Mail,
  Briefcase,
  CheckCircle2,
  Globe,
  Image as ImageIcon,
  DollarSign,
  Coins,
  ChevronDown,
  ToggleLeft,
  ToggleRight,
  ShieldCheck,
  Smartphone,
  Phone,
  MapPin
} from 'lucide-react';

interface SettingsProps {
  userRole: UserRole;
  onConfigUpdate?: () => void;
  onUserUpdate?: (user: User) => void;
}

const THEMES = [
  { id: 'indigo', name: 'Midnight Indigo', primary: '#4f46e5', secondary: '#4338ca', light: '#eef2ff' },
  { id: 'emerald', name: 'Emerald Forest', primary: '#10b981', secondary: '#059669', light: '#ecfdf5' },
  { id: 'violet', name: 'Royal Violet', primary: '#8b5cf6', secondary: '#7c3aed', light: '#f5f3ff' },
  { id: 'rose', name: 'Ruby Rose', primary: '#f43f5e', secondary: '#e11d48', light: '#fff1f2' },
  { id: 'amber', name: 'Golden Amber', primary: '#f59e0b', secondary: '#d97706', light: '#fffbeb' },
  { id: 'slate', name: 'Modern Slate', primary: '#475569', secondary: '#334155', light: '#f8fafc' },
];

const ENGLISH_FONTS = [
  { id: "'Inter', sans-serif", name: 'Inter (Default)' },
  { id: "'Poppins', sans-serif", name: 'Poppins' },
  { id: "'Montserrat', sans-serif", name: 'Montserrat' },
  { id: "'Roboto', sans-serif", name: 'Roboto' },
  { id: "'Lato', sans-serif", name: 'Lato' },
  { id: "'Open Sans', sans-serif", name: 'Open Sans' },
  { id: "'Playfair Display', serif", name: 'Playfair Display' },
  { id: "'Merriweather', serif", name: 'Merriweather' },
  { id: "'Oswald', sans-serif", name: 'Oswald' },
];

const URDU_FONTS = [
  { id: "'Noto Nastaliq Urdu', serif", name: 'Noto Nastaliq (Classical)' },
  { id: "'Noto Sans Arabic', sans-serif", name: 'Noto Sans (Modern)' },
  { id: "'Reem Kufi', sans-serif", name: 'Reem Kufi (Stylized)' },
];

const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'PKR', symbol: 'Rs.', name: 'Pakistani Rupee' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'AED', symbol: 'DH', name: 'UAE Dirham' },
];

const Settings: React.FC<SettingsProps> = ({ userRole, onConfigUpdate, onUserUpdate }) => {
  const [activeTab, setActiveTab] = useState('');
  
  // Initialize with null/empty to avoid flash of mock data
  const [schoolData, setSchoolData] = useState<any>(null);
  const [systemConfig, setSystemConfigState] = useState<SystemConfig>({ 
    currencyCode: 'USD', 
    currencySymbol: '$', 
    platformName: '' 
  });
  
  // Empty initial state to prevent flash of mock user
  const [adminProfile, setAdminProfile] = useState<Partial<User>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '' });

  // Notifications State
  const [notifications, setNotifications] = useState<NotificationConfig>({
    emailAlerts: true,
    systemUpdates: true,
    marketingMessages: false,
    securityAlerts: true
  });

  // Security State
  const [twoFactor, setTwoFactor] = useState(false);

  const [branding, setBranding] = useState<SchoolBranding>({
    themeColor: '#4f46e5',
    secondaryColor: '#4338ca',
    lightColor: '#eef2ff',
    appFont: "'Inter', sans-serif",
    paperEnglishFont: "'Inter', sans-serif",
    paperUrduFont: "'Noto Nastaliq Urdu', serif"
  });

  const applyBrandingToDOM = (b: SchoolBranding) => {
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', b.themeColor);
    root.style.setProperty('--brand-secondary', b.secondaryColor);
    root.style.setProperty('--brand-light', b.lightColor);
    root.style.setProperty('--app-font', b.appFont);
  };

  useEffect(() => {
    applyBrandingToDOM(branding);
  }, [branding]);

  useEffect(() => {
    const loadConfig = async () => {
        // Load System Settings
        const config = await getSystemConfig();
        setSystemConfigState(config);
        if (userRole === UserRole.SUPER_ADMIN && config.branding) {
            setBranding(config.branding);
        }

        // Load Current User Profile
        try {
            const currentUser = await getCurrentUser();
            if (currentUser) {
                setAdminProfile(currentUser);
                if (currentUser.notificationConfig) setNotifications(currentUser.notificationConfig);
                if (currentUser.securityConfig) setTwoFactor(currentUser.securityConfig.twoFactorEnabled);

                // Load School if applicable
                if (currentUser.schoolId && userRole !== UserRole.SUPER_ADMIN) {
                    const school = await getSchoolById(currentUser.schoolId);
                    setSchoolData(school);
                    if (school.branding) setBranding(school.branding);
                }
            }
        } catch (e) {
            console.error("Failed to load user profile", e);
        }
    };
    loadConfig();
  }, [userRole]);

  const allTabs = [
    { 
        id: 'profile', 
        label: 'My Profile', 
        icon: UserIcon, 
        allowedRoles: [UserRole.TEACHER, UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN] 
    },
    { 
        id: 'organization', 
        label: userRole === UserRole.SUPER_ADMIN ? 'Platform Identity' : 'School Profile', 
        icon: userRole === UserRole.SUPER_ADMIN ? Globe : Building2, 
        allowedRoles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN] 
    },
    { id: 'branding', label: 'Branding & Theme', icon: Palette, allowedRoles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN] },
    { id: 'security', label: 'Security', icon: Lock, allowedRoles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER] },
    { id: 'notifications', label: 'Notifications', icon: Bell, allowedRoles: [UserRole.SUPER_ADMIN, UserRole.SCHOOL_ADMIN, UserRole.TEACHER] },
  ];

  const tabs = allTabs.filter(tab => tab.allowedRoles.includes(userRole));

  useEffect(() => {
    if (tabs.length > 0 && !activeTab) {
      setActiveTab(tabs[0].id);
    }
  }, [tabs, activeTab]);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>, target: 'SCHOOL' | 'PLATFORM') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (target === 'SCHOOL' && schoolData) setSchoolData({ ...schoolData, logo: reader.result as string });
        else if (target === 'PLATFORM') setSystemConfigState({ ...systemConfig, platformLogo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAdminProfile({ ...adminProfile, avatar: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCommitUpdates = async () => {
    try {
        // 1. Update Platform (Super Admin)
        if (userRole === UserRole.SUPER_ADMIN) {
            await updateSystemConfig({
                ...systemConfig,
                branding: branding
            });
            // TRIGGER GLOBAL REFRESH
            onConfigUpdate?.();
        } 
        
        // 2. Update School (School Admin)
        if (userRole === UserRole.SCHOOL_ADMIN && schoolData) {
            await updateSchool({
                ...schoolData,
                branding: branding
            });
        }

        // 3. Update User Profile & Preferences (All Users)
        if (adminProfile.id) {
            const updates: any = {
                name: adminProfile.name,
                email: adminProfile.email,
                avatar: adminProfile.avatar,
                notificationConfig: notifications,
                securityConfig: { ...adminProfile.securityConfig, twoFactorEnabled: twoFactor }
            };
            if (passwordForm.new) {
                updates.password = passwordForm.new; // Handled by backend hashing
            }
            // Need cast as we loaded Partial<User> initially
            const updatedUser = await updateUser({
                ...adminProfile,
                ...updates
            } as User);
            
            // TRIGGER USER STATE REFRESH IN APP
            onUserUpdate?.(updatedUser);
        }

        alert("Settings updated successfully!");
        setPasswordForm({ current: '', new: '' });
    } catch (e) {
        alert("Failed to update settings.");
    }
  };

  const Toggle = ({ enabled, onChange }: { enabled: boolean, onChange: (v: boolean) => void }) => (
      <button onClick={() => onChange(!enabled)} className={`text-2xl transition-colors ${enabled ? 'text-indigo-600' : 'text-slate-300'}`}>
          {enabled ? <ToggleRight size={40} /> : <ToggleLeft size={40} />}
      </button>
  );

  if (!adminProfile.id) return null; // Wait for load

  return (
    <div className="p-6 md:p-10 max-w-6xl mx-auto">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2 text-lg">
          {userRole === UserRole.SUPER_ADMIN ? 'Manage platform core and global preferences' : 
           userRole === UserRole.SCHOOL_ADMIN ? 'Manage institutional profile and staff preferences' :
           'Manage your personal account settings'}
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="w-full md:w-72 flex flex-col gap-2 shrink-0">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-5 py-4 rounded-lg text-base font-medium transition-colors ${
                activeTab === tab.id
                  ? 'bg-brand-light text-brand shadow-sm border border-brand/20'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900 hover:shadow-sm border border-transparent'
              }`}
            >
              <tab.icon size={20} className={activeTab === tab.id ? 'text-brand' : ''} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm p-8">
          
          {activeTab === 'profile' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-4">
                 <UserIcon size={20} className="text-brand" /> Personal Information
              </h3>
              <div className="flex flex-col md:flex-row gap-10 items-start">
                 <div className="relative group cursor-pointer" onClick={() => document.getElementById('avatar-upload')?.click()}>
                    <div className="w-32 h-32 rounded-3xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden shadow-sm transition-all group-hover:border-brand/40">
                       {adminProfile.avatar ? (
                          <img src={adminProfile.avatar} alt="Profile" className="w-full h-full object-cover" />
                       ) : (
                          <UserIcon size={48} className="text-gray-300" />
                       )}
                    </div>
                    <div className="absolute -bottom-3 -right-3 p-3 bg-brand text-white rounded-xl shadow-xl hover-bg-brand-secondary transition-all">
                       <Camera size={20} />
                    </div>
                    <input id="avatar-upload" type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                 </div>

                 <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 w-full">
                    <div className="md:col-span-2">
                       <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Full Name</label>
                       <input 
                          type="text" 
                          value={adminProfile.name || ''}
                          onChange={(e) => setAdminProfile({...adminProfile, name: e.target.value})}
                          className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-gray-700" 
                       />
                    </div>
                    <div>
                       <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Professional Email</label>
                       <div className="relative">
                          <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input 
                             type="email" 
                             value={adminProfile.email || ''}
                             onChange={(e) => setAdminProfile({...adminProfile, email: e.target.value})}
                             className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none font-bold text-gray-700" 
                          />
                       </div>
                    </div>
                    <div>
                       <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">System Designation</label>
                       <div className="relative">
                          <Briefcase size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                          <input 
                             type="text" 
                             readOnly
                             value={userRole.replace('_', ' ')}
                             className="w-full pl-12 pr-5 py-3.5 bg-gray-100 border border-gray-200 rounded-2xl outline-none font-bold text-gray-500 capitalize" 
                          />
                       </div>
                    </div>
                 </div>
              </div>
            </div>
          )}

          {activeTab === 'organization' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
               {/* SUPER ADMIN: PLATFORM CONFIGURATION */}
               {userRole === UserRole.SUPER_ADMIN && (
                  <>
                     <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-4">
                        <Globe size={20} className="text-brand" /> Platform Identity
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Platform Name</label>
                           <input 
                              type="text" 
                              value={systemConfig.platformName || ''}
                              onChange={(e) => setSystemConfigState({...systemConfig, platformName: e.target.value})}
                              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-gray-700"
                              placeholder="ExamForge AI"
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Global Currency</label>
                           <select 
                              value={systemConfig.currencyCode || 'USD'}
                              onChange={(e) => {
                                 const curr = CURRENCIES.find(c => c.code === e.target.value);
                                 setSystemConfigState({...systemConfig, currencyCode: e.target.value, currencySymbol: curr?.symbol || '$'});
                              }}
                              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-gray-700"
                           >
                              {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.name} ({c.symbol})</option>)}
                           </select>
                        </div>
                        
                        <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Support Email</label>
                           <div className="relative">
                              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input 
                                 type="email" 
                                 value={systemConfig.platformEmail || ''}
                                 onChange={(e) => setSystemConfigState({...systemConfig, platformEmail: e.target.value})}
                                 className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-gray-700"
                                 placeholder="support@example.com"
                              />
                           </div>
                        </div>
                        <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Support Phone</label>
                           <div className="relative">
                              <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input 
                                 type="text" 
                                 value={systemConfig.platformContact || ''}
                                 onChange={(e) => setSystemConfigState({...systemConfig, platformContact: e.target.value})}
                                 className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-gray-700"
                                 placeholder="+1 (555) 000-0000"
                              />
                           </div>
                        </div>
                        
                        <div className="md:col-span-2">
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">HQ Address</label>
                           <div className="relative">
                              <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                              <input 
                                 type="text" 
                                 value={systemConfig.platformAddress || ''}
                                 onChange={(e) => setSystemConfigState({...systemConfig, platformAddress: e.target.value})}
                                 className="w-full pl-12 pr-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-gray-700"
                                 placeholder="123 Tech Park, Innovation City"
                              />
                           </div>
                        </div>

                        <div className="md:col-span-2">
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">System Logo</label>
                           <div className="flex items-center gap-6 p-4 border border-gray-200 rounded-2xl bg-gray-50/50">
                              <div className="w-20 h-20 bg-white rounded-xl border border-gray-200 flex items-center justify-center p-2">
                                 {systemConfig.platformLogo ? <img src={systemConfig.platformLogo} className="w-full h-full object-contain" /> : <Building2 className="text-gray-300" />}
                              </div>
                              <div>
                                 <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'PLATFORM')} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-brand-light file:text-brand hover:file:bg-brand/20 cursor-pointer" />
                                 <p className="text-[10px] text-gray-400 mt-2">Recommended: PNG or SVG, 512x512px</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </>
               )}

               {/* SCHOOL ADMIN: SCHOOL PROFILE */}
               {userRole === UserRole.SCHOOL_ADMIN && schoolData && (
                  <>
                     <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-4">
                        <Building2 size={20} className="text-brand" /> Institution Profile
                     </h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="md:col-span-2">
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Official School Name</label>
                           <input 
                              type="text" 
                              value={schoolData.name || ''}
                              onChange={(e) => setSchoolData({...schoolData, name: e.target.value})}
                              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-gray-700" 
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Principal / Head</label>
                           <input 
                              type="text" 
                              value={schoolData.principalName || ''}
                              onChange={(e) => setSchoolData({...schoolData, principalName: e.target.value})}
                              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-gray-700" 
                           />
                        </div>
                        <div>
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Contact Email</label>
                           <input 
                              type="email" 
                              value={schoolData.contactEmail || ''}
                              onChange={(e) => setSchoolData({...schoolData, contactEmail: e.target.value})}
                              className="w-full px-5 py-3.5 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-brand/5 focus:border-brand outline-none transition-all font-bold text-gray-700" 
                           />
                        </div>
                        <div className="md:col-span-2">
                           <label className="block text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-3">Institution Logo</label>
                           <div className="flex items-center gap-6 p-4 border border-gray-200 rounded-2xl bg-gray-50/50">
                              <div className="w-20 h-20 bg-white rounded-xl border border-gray-200 flex items-center justify-center p-2">
                                 {schoolData.logo ? <img src={schoolData.logo} className="w-full h-full object-contain" /> : <Building2 className="text-gray-300" />}
                              </div>
                              <div>
                                 <input type="file" accept="image/*" onChange={(e) => handleLogoUpload(e, 'SCHOOL')} className="block w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-brand-light file:text-brand hover:file:bg-brand/20 cursor-pointer" />
                                 <p className="text-[10px] text-gray-400 mt-2">Recommended: PNG or SVG, 512x512px. Used on exam headers.</p>
                              </div>
                           </div>
                        </div>
                     </div>
                  </>
               )}
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-4">
                 <Lock size={20} className="text-brand" /> Access Credentials & Security
              </h3>
              <div className="space-y-8 max-w-lg">
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-3xl space-y-6">
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={16}/> Password Management</h4>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Password</label>
                      <input 
                        type="password"
                        value={passwordForm.current}
                        onChange={(e) => setPasswordForm({...passwordForm, current: e.target.value})}
                        className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" 
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New System Password</label>
                      <div className="relative">
                        <input 
                          type={showPassword ? 'text' : 'password'}
                          value={passwordForm.new}
                          onChange={(e) => setPasswordForm({...passwordForm, new: e.target.value})}
                          className="w-full h-12 px-4 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold" 
                        />
                        <button 
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                      </div>
                    </div>
                </div>

                <div className="p-6 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-between">
                    <div>
                        <h4 className="text-sm font-bold text-indigo-900 flex items-center gap-2"><Smartphone size={16}/> Two-Factor Authentication</h4>
                        <p className="text-xs text-indigo-600 mt-1">Secure your account with 2FA codes via email.</p>
                    </div>
                    <Toggle enabled={twoFactor} onChange={setTwoFactor} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-4 duration-300">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-4">
                    <Bell size={20} className="text-brand" /> Notification Preferences
                </h3>
                <div className="space-y-4">
                    {[
                        { key: 'emailAlerts', label: 'Email Alerts', desc: 'Receive important updates via email.' },
                        { key: 'systemUpdates', label: 'System Broadcasts', desc: 'Get notified about platform maintenance and features.' },
                        { key: 'securityAlerts', label: 'Security Alerts', desc: 'Immediate notification of login attempts and password changes.' },
                        { key: 'marketingMessages', label: 'Product News', desc: 'Receive newsletters and promotional content.' },
                    ].map(setting => (
                        <div key={setting.key} className="flex items-center justify-between p-5 border border-slate-100 rounded-2xl hover:bg-slate-50 transition-colors">
                            <div>
                                <h4 className="font-bold text-slate-800 text-sm">{setting.label}</h4>
                                <p className="text-xs text-slate-500 mt-0.5">{setting.desc}</p>
                            </div>
                            <Toggle 
                                enabled={(notifications as any)[setting.key]} 
                                onChange={(val) => setNotifications({...notifications, [setting.key]: val})} 
                            />
                        </div>
                    ))}
                </div>
            </div>
          )}

          {activeTab === 'branding' && (
            <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2 border-b pb-4">
                 <Palette size={20} className="text-brand" /> Theme & Experience
              </h3>
              
              <div>
                <label className="block text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Dashboard Visual Palette</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-5">
                  {THEMES.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => setBranding({...branding, themeColor: t.primary, secondaryColor: t.secondary, lightColor: t.light})}
                      className={`p-5 rounded-[2rem] border-2 transition-all text-left flex flex-col gap-4 hover:shadow-xl ${
                        branding.themeColor === t.primary ? 'border-brand bg-brand-light ring-4 ring-brand/5 shadow-lg' : 'border-slate-100 bg-slate-50/30'
                      }`}
                    >
                      <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-xl shadow-sm" style={{ backgroundColor: t.primary }}></div>
                        <div className="w-8 h-8 rounded-xl shadow-sm" style={{ backgroundColor: t.secondary }}></div>
                      </div>
                      <div className="flex items-center justify-between">
                         <span className={`text-[10px] font-black uppercase tracking-[0.15em] ${branding.themeColor === t.primary ? 'text-brand' : 'text-slate-500'}`}>
                           {t.name}
                         </span>
                         {branding.themeColor === t.primary && <CheckCircle2 size={16} className="text-brand" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-slate-100 pt-10">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Type size={20} className="text-brand" /> Interface Typography
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-3 custom-scrollbar border rounded-[2rem] p-4 bg-slate-50/30">
                    {ENGLISH_FONTS.map(f => (
                      <button
                        key={f.id}
                        onClick={() => setBranding({...branding, appFont: f.id})}
                        style={{ fontFamily: f.id }}
                        className={`w-full text-left p-4 rounded-2xl transition-all flex justify-between items-center ${branding.appFont === f.id ? 'bg-white shadow-md border border-brand/5 text-brand font-black' : 'hover:bg-white text-slate-600 font-medium'}`}
                      >
                        {f.name}
                        {branding.appFont === f.id && <Check size={16} />}
                      </button>
                    ))}
                  </div>
                  <div className="p-10 bg-brand-light rounded-[3rem] border border-brand/5 h-full flex flex-col justify-center shadow-inner">
                     <p className="text-[11px] font-black text-brand uppercase tracking-[0.3em] mb-6">Live Dashboard Preview</p>
                     <h4 style={{ fontFamily: branding.appFont }} className="text-3xl font-black text-slate-800 leading-tight">
                       Empowering institutions with AI precision.
                     </h4>
                     <p style={{ fontFamily: branding.appFont }} className="mt-4 text-slate-500 text-base font-medium leading-relaxed">
                       The quick brown fox jumps over the lazy dog. Review the weight and clarity of this typeface.
                     </p>
                  </div>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-10">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Languages size={20} className="text-brand" /> Examination Paper Defaults
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-8">
                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">English Script</label>
                      <select 
                        value={branding.paperEnglishFont}
                        onChange={(e) => setBranding({...branding, paperEnglishFont: e.target.value})}
                        className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-brand/5 font-bold text-slate-700 cursor-pointer"
                      >
                        {ENGLISH_FONTS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Urdu Script (Nastaliq/Arabic)</label>
                      <select 
                        value={branding.paperUrduFont}
                        onChange={(e) => setBranding({...branding, paperUrduFont: e.target.value})}
                        className="w-full h-14 px-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-brand/5 font-bold text-slate-700 cursor-pointer"
                      >
                        {URDU_FONTS.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="bg-slate-900 text-white rounded-[3rem] p-10 flex flex-col justify-center shadow-2xl relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl"></div>
                     <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-6">Paper Rendering Simulation</p>
                     <h4 style={{ fontFamily: branding.paperEnglishFont }} className="text-2xl font-black tracking-tight">Chemistry Unit Assessment 2024</h4>
                     <p style={{ fontFamily: branding.paperUrduFont }} className="mt-8 text-4xl font-urdu text-right leading-[2.5]" dir="rtl">
                       یہ آپ کے امتحانی پرچے کا خوبصورت اردو متن ہے۔
                     </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end">
            <button 
               onClick={handleCommitUpdates}
               className="flex items-center gap-3 px-10 py-4 bg-brand text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-brand-secondary shadow-[0_20px_50px_rgba(79,70,229,0.3)] transition-all transform hover:scale-105 active:scale-95"
            >
              <Save size={22} />
              Commit Updates
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
