
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import SchoolAdminDashboard from './components/School/SchoolAdminDashboard';
import GeneratePaper from './components/GeneratePaper';
import SchoolManager from './components/SuperAdmin/SchoolManager';
import GlobalQuestionBank from './components/SuperAdmin/GlobalQuestionBank';
import SuperAdminDashboard from './components/SuperAdmin/SuperAdminDashboard';
import CurriculumManager from './components/SuperAdmin/CurriculumManager';
import SystemUsers from './components/SuperAdmin/SystemUsers';
import RevenueAnalytics from './components/SuperAdmin/RevenueAnalytics';
import PlanManager from './components/SuperAdmin/PlanManager';
import SavedPapers from './components/School/SavedPapers';
import StaffManager from './components/School/StaffManager';
import AnalyticsDashboard from './components/School/Analytics';
import SubscriptionManager from './components/School/Subscription';
import TeacherDashboard from './components/Teacher/TeacherDashboard';
import ActivityLogView from './components/ActivityLogView';
import Settings from './components/Settings';
import Support from './components/Support';
import { User, UserRole, SystemConfig, School } from './types';
import { Menu } from 'lucide-react';
import { initializeDB, getSystemConfig, getSchoolById } from './services/dataService';

// Public Components
import PublicLayout from './components/Public/PublicLayout';
import Home from './components/Public/Home';
import About from './components/Public/About';
import Contact from './components/Public/Contact';
import Notes from './components/Public/Notes';
import PastPapers from './components/Public/PastPapers';
import Quiz from './components/Public/Quiz';
import Blog from './components/Public/Blog';
import SignUp from './components/SignUp';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  
  // Public Route State
  const [publicView, setPublicView] = useState('HOME');

  // Global System Configuration State
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    currencyCode: 'USD',
    currencySymbol: '$',
    platformName: 'ExamForge AI',
    platformLogo: ''
  });

  useEffect(() => {
    initializeDB();
    loadSystemConfig();
  }, []);

  // Effect to load School details when a School Admin or Teacher logs in
  useEffect(() => {
    const fetchSchool = async () => {
        if (user && user.schoolId && user.role !== UserRole.SUPER_ADMIN) {
            try {
                const schoolData = await getSchoolById(user.schoolId);
                setCurrentSchool(schoolData);
                
                // Apply School Branding if available
                if (schoolData?.branding) {
                    const b = schoolData.branding;
                    const root = document.documentElement;
                    root.style.setProperty('--brand-primary', b.themeColor);
                    root.style.setProperty('--brand-secondary', b.secondaryColor);
                    root.style.setProperty('--brand-light', b.lightColor);
                    root.style.setProperty('--app-font', b.appFont);
                }
            } catch (e) {
                console.error("Failed to load school context");
            }
        } else {
            setCurrentSchool(null);
        }
    };
    fetchSchool();
  }, [user]);

  const loadSystemConfig = async () => {
    try {
      const config = await getSystemConfig();
      setSystemConfig(config);
      // Apply global branding colors if present and user is not school-bound yet
      if (config.branding && !currentSchool) {
        const root = document.documentElement;
        root.style.setProperty('--brand-primary', config.branding.themeColor);
        root.style.setProperty('--brand-secondary', config.branding.secondaryColor);
        root.style.setProperty('--brand-light', config.branding.lightColor);
        root.style.setProperty('--app-font', config.branding.appFont);
      }
    } catch (e) {
      console.error("Failed to load system config");
    }
  };

  // --- PUBLIC ROUTING LOGIC ---
  if (!user) {
    if (publicView === 'LOGIN') {
      return <Login onLogin={setUser} systemConfig={systemConfig} onNavigate={setPublicView} />;
    }
    if (publicView === 'SIGNUP') {
      return <SignUp onLogin={setUser} onNavigate={setPublicView} />;
    }

    return (
      <PublicLayout 
        currentView={publicView} 
        onNavigate={setPublicView} 
        systemName={systemConfig.platformName || 'ExamForge'}
      >
        {publicView === 'HOME' && <Home onNavigate={setPublicView} />}
        {publicView === 'ABOUT' && <About />}
        {publicView === 'CONTACT' && <Contact />}
        {publicView === 'NOTES' && <Notes />}
        {publicView === 'PAST_PAPERS' && <PastPapers />}
        {publicView === 'QUIZ' && <Quiz />}
        {publicView === 'BLOG' && <Blog />}
      </PublicLayout>
    );
  }

  // --- PROTECTED/INTERNAL ROUTING LOGIC ---
  const isOwner = user.role === UserRole.SUPER_ADMIN;
  const isTeacher = user.role === UserRole.TEACHER;

  const renderContent = () => {
    if (isOwner) {
      switch (activeView) {
        case 'dashboard': return <SuperAdminDashboard />;
        case 'generate': return <GeneratePaper onBack={() => { setActiveView('dashboard'); setIsFullScreen(false); }} user={user} onEditorEnter={() => setIsFullScreen(true)} onEditorExit={() => setIsFullScreen(false)} />;
        case 'schools': return <SchoolManager />;
        case 'curriculum': return <CurriculumManager />;
        case 'questions': return <GlobalQuestionBank />;
        case 'users': return <SystemUsers />;
        case 'revenue': return <RevenueAnalytics />;
        case 'plans': return <PlanManager />;
        case 'activity': return <ActivityLogView user={user} />;
        case 'settings': return <Settings userRole={user.role} onConfigUpdate={loadSystemConfig} onUserUpdate={setUser} />;
        case 'support': return <Support />;
        default: return <div className="p-12 text-center text-gray-500">Coming Soon</div>;
      }
    }

    if (isTeacher) {
      switch (activeView) {
        case 'dashboard': return <TeacherDashboard onNavigate={setActiveView} user={user} />;
        case 'generate': return <GeneratePaper onBack={() => { setActiveView('dashboard'); setIsFullScreen(false); }} user={user} onEditorEnter={() => setIsFullScreen(true)} onEditorExit={() => setIsFullScreen(false)} />;
        case 'saved': return <SavedPapers user={user} />;
        case 'settings': return <Settings userRole={user.role} onConfigUpdate={loadSystemConfig} onUserUpdate={setUser} />;
        case 'support': return <Support />;
        default: return <div className="p-12 text-center text-gray-500">Access Denied</div>;
      }
    }

    switch (activeView) {
      case 'dashboard': return <SchoolAdminDashboard onNavigate={setActiveView} user={user} />;
      case 'generate': return <GeneratePaper onBack={() => { setActiveView('dashboard'); setIsFullScreen(false); }} user={user} onEditorEnter={() => setIsFullScreen(true)} onEditorExit={() => setIsFullScreen(false)} />;
      case 'saved': return <SavedPapers user={user} />;
      case 'staff': return <StaffManager user={user} />;
      case 'analytics': return <AnalyticsDashboard user={user} />;
      case 'billing': return <SubscriptionManager user={user} />;
      case 'activity': return <ActivityLogView user={user} />;
      case 'settings': return <Settings userRole={user.role} onConfigUpdate={loadSystemConfig} onUserUpdate={setUser} />;
      case 'support': return <Support />;
      default: return <div className="p-12 text-center text-gray-500">Coming Soon</div>;
    }
  };

  const showSidebar = !isFullScreen;

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden font-sans print:h-auto print:overflow-visible">
      {showSidebar && (
        <div className="print:hidden h-full">
          <Sidebar 
            user={user} 
            activeView={activeView} 
            onNavigate={setActiveView} 
            onLogout={() => { setUser(null); setPublicView('LOGIN'); }}
            isOpen={isSidebarOpen}
            onClose={() => setSidebarOpen(false)}
            systemConfig={systemConfig}
            school={currentSchool}
          />
        </div>
      )}
      
      {isSidebarOpen && showSidebar && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden print:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <main className={`flex-1 flex flex-col overflow-hidden relative print:overflow-visible print:h-auto print:block ${isFullScreen ? 'z-[100]' : ''}`}>
        {!isFullScreen && (
          <div className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200 shrink-0 print:hidden">
             <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600">
                <Menu size={24} />
             </button>
             <span className="font-bold text-gray-900">{systemConfig.platformName}</span>
             <div className="w-8" />
          </div>
        )}

        <div className="flex-1 overflow-auto print:overflow-visible print:h-auto">
          {renderContent()}
        </div>
      </main>
    </div>
  );
};

export default App;
