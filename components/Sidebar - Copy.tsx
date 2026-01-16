
import React, { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  FilePlus, 
  FolderOpen, 
  Users, 
  CreditCard, 
  Settings, 
  LogOut, 
  Building2, 
  Database, 
  BarChart3,
  HelpCircle,
  X,
  BookOpen,
  Zap,
  History,
  Lock
} from 'lucide-react';
import { User, UserRole, SystemConfig, School } from '../types';
import { getPlans } from '../services/dataService';

interface SidebarProps {
  user: User;
  activeView: string;
  onNavigate: (view: string) => void;
  onLogout: () => void;
  isOpen: boolean;
  onClose: () => void;
  systemConfig: SystemConfig;
  school?: School | null; // Added School prop
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ElementType;
  restricted?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeView, onNavigate, onLogout, isOpen, onClose, systemConfig, school }) => {
  const isOwner = user.role === UserRole.SUPER_ADMIN;
  const isTeacher = user.role === UserRole.TEACHER;
  const [isGenerationLocked, setIsGenerationLocked] = useState(false);

  // Check subscription status to lock/unlock Generate feature
  useEffect(() => {
    const checkLimits = async () => {
      if (isOwner || !school) {
        setIsGenerationLocked(false);
        return;
      }

      try {
        const plans = await getPlans();
        const currentPlan = plans.find(p => p.name === school.subscriptionPlan);
        
        // 1. Expiry Check
        const isExpired = new Date(school.validTill) < new Date();
        
        // 2. Usage Limit Check
        const limit = currentPlan?.limits.papers || 0;
        const used = school.stats?.papersCount || 0;
        const isLimitReached = used >= limit;

        setIsGenerationLocked(isExpired || isLimitReached);
      } catch (e) {
        console.error("Failed to validate subscription limits in sidebar", e);
      }
    };
    checkLimits();
  }, [school, isOwner]);

  const schoolMenu: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'generate', label: 'Generate Paper', icon: FilePlus, restricted: true },
    { id: 'saved', label: 'Saved Papers', icon: FolderOpen },
    { id: 'staff', label: 'Staff & Teachers', icon: Users },
    { id: 'analytics', label: 'Performance', icon: BarChart3 },
    { id: 'billing', label: 'Subscription', icon: CreditCard },
    { id: 'activity', label: 'Activity Log', icon: History },
  ];

  const ownerMenu: MenuItem[] = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'generate', label: 'Generate Paper', icon: FilePlus },
    { id: 'schools', label: 'Schools', icon: Building2 },
    { id: 'curriculum', label: 'Curriculum', icon: BookOpen },
    { id: 'questions', label: 'Question Bank', icon: Database },
    { id: 'users', label: 'System Users', icon: Users },
    { id: 'plans', label: 'Plans & Pricing', icon: Zap },
    { id: 'revenue', label: 'Revenue', icon: BarChart3 },
    { id: 'activity', label: 'System Audit', icon: History },
  ];

  const teacherMenu: MenuItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'generate', label: 'Generate Paper', icon: FilePlus, restricted: true },
    { id: 'saved', label: 'My Papers', icon: FolderOpen },
    // Removed Activity Log for Teachers
  ];

  let menuItems: MenuItem[];
  if (isOwner) menuItems = ownerMenu;
  else if (isTeacher) menuItems = teacherMenu;
  else menuItems = schoolMenu;

  // Determine Logo and Title based on Role
  const displayLogo = (!isOwner && school?.logo) ? school.logo : systemConfig.platformLogo;
  const displayTitle = (!isOwner && school?.name) ? school.name : systemConfig.platformName;

  return (
    <div className={`fixed inset-y-0 left-0 z-50 w-72 bg-[#0F172A] flex flex-col h-full text-slate-300 border-r border-slate-800 transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 shadow-xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      {/* Header */}
      <div className="h-24 flex flex-col justify-center px-6 border-b border-slate-800 bg-slate-900/50 shrink-0 relative">
        <div className="flex items-center gap-3 text-white overflow-hidden">
          {displayLogo ? (
             <div className="w-10 h-10 rounded-xl bg-white p-1 flex items-center justify-center overflow-hidden shrink-0">
                <img src={displayLogo} alt="Logo" className="w-full h-full object-contain" />
             </div>
          ) : (
             <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-900/50 shrink-0">
               <LayoutDashboard size={20} />
             </div>
          )}
          <div className="flex flex-col overflow-hidden">
             <span className="font-bold text-sm tracking-tight truncate leading-tight">{displayTitle}</span>
             {!isOwner && <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest truncate">Academic Portal</span>}
             {isOwner && <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest truncate">Super Admin</span>}
          </div>
        </div>
        <button onClick={onClose} className="md:hidden absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors">
          <X size={20} />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto custom-scrollbar">
        <div className="px-3 mb-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
          {isOwner ? 'Administration' : 'Main Menu'}
        </div>
        
        {menuItems.map((item) => {
          const isLocked = item.restricted && isGenerationLocked;
          
          return (
            <button
              key={item.id}
              disabled={isLocked}
              onClick={() => {
                if (!isLocked) {
                  onNavigate(item.id);
                  onClose();
                }
              }}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 group ${
                isLocked 
                  ? 'opacity-50 cursor-not-allowed hover:bg-transparent'
                  : activeView === item.id 
                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 shadow-sm' 
                    : 'hover:bg-slate-800/50 hover:text-white border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                {isLocked ? <Lock size={20} className="text-slate-500" /> : <item.icon size={20} className={activeView === item.id ? 'text-indigo-400' : 'text-slate-400 group-hover:text-white transition-colors'} />}
                <span className="font-medium text-sm">{item.label}</span>
              </div>
              {isLocked && <span className="text-[9px] font-bold bg-slate-800 px-1.5 py-0.5 rounded text-slate-500 uppercase">Locked</span>}
            </button>
          );
        })}

        <div className="px-3 mt-8 mb-3 text-xs font-bold text-slate-500 uppercase tracking-widest">
          System
        </div>
        <button 
          onClick={() => { onNavigate('settings'); onClose(); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${activeView === 'settings' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'}`}
        >
          <Settings size={20} className="text-slate-400 group-hover:text-white transition-colors" />
          <span className="font-medium text-sm">Settings</span>
        </button>
        <button 
          onClick={() => { onNavigate('support'); onClose(); }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 group ${activeView === 'support' ? 'bg-slate-800 text-white' : 'hover:bg-slate-800/50 hover:text-white'}`}
        >
          <HelpCircle size={20} className="text-slate-400 group-hover:text-white transition-colors" />
          <span className="font-medium text-sm">Support</span>
        </button>
      </nav>

      {/* User Profile Footer */}
      <div className="p-4 border-t border-slate-800 bg-slate-900 shrink-0">
        <div className="flex items-center gap-3 mb-4 px-1">
          <img 
            src={user.avatar} 
            alt={user.name} 
            className="w-10 h-10 rounded-full border-2 border-slate-700 object-cover"
          />
          <div className="flex-1 overflow-hidden">
            <h4 className="text-sm font-semibold text-white truncate">{user.name}</h4>
            <p className="text-xs text-slate-500 truncate capitalize">
              {user.role.replace('_', ' ').toLowerCase()}
            </p>
          </div>
        </div>
        <button 
          onClick={onLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-slate-800 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 border border-slate-700 transition-all text-sm font-medium text-slate-300"
        >
          <LogOut size={16} />
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
