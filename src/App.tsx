
import React, { useState, useEffect, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import StudentLogin from './components/Student/StudentLogin';
import { User, UserRole, SystemConfig, School } from './types';

import { Menu } from 'lucide-react';
import { initializeDB, getSystemConfig, getSchoolById, getCurrentUser } from './services/dataService';

// Public Components
import PublicLayout from './components/Public/PublicLayout';
import Home from './components/Public/Home';
import SignUp from './components/SignUp';

const SchoolAdminDashboard = lazy(() => import('./components/School/SchoolAdminDashboard'));
const GeneratePaper = lazy(() => import('./components/GeneratePaper'));
const SchoolManager = lazy(() => import('./components/SuperAdmin/SchoolManager'));
const SchemeManager = lazy(() => import('./components/SuperAdmin/SchemeManager'));
const GlobalQuestionBank = lazy(() => import('./components/SuperAdmin/GlobalQuestionBank'));
const SuperAdminDashboard = lazy(() => import('./components/SuperAdmin/SuperAdminDashboard'));
const CurriculumManager = lazy(() => import('./components/SuperAdmin/CurriculumManager'));
const SystemUsers = lazy(() => import('./components/SuperAdmin/SystemUsers'));
const RevenueAnalytics = lazy(() => import('./components/SuperAdmin/RevenueAnalytics'));
const PlanManager = lazy(() => import('./components/SuperAdmin/PlanManager'));
const SavedPapers = lazy(() => import('./components/School/SavedPapers'));
const StaffManager = lazy(() => import('./components/School/StaffManager'));
const AnalyticsDashboard = lazy(() => import('./components/School/Analytics'));
const SubscriptionManager = lazy(() => import('./components/School/Subscription'));
const TeacherDashboard = lazy(() => import('./components/Teacher/TeacherDashboard'));
const ActivityLogView = lazy(() => import('./components/ActivityLogView'));
const Settings = lazy(() => import('./components/Settings'));
const Support = lazy(() => import('./components/Support'));
const ContentManager = lazy(() => import('./components/SuperAdmin/ContentManager'));
const ContactQueries = lazy(() => import('./components/SuperAdmin/ContactQueries'));
const StudentManager = lazy(() => import('./components/School/StudentManager'));
const ExamGrading = lazy(() => import('./components/Teacher/ExamGrading'));
const StudentDashboard = lazy(() => import('./components/Student/StudentDashboard'));
const ResultCenter = lazy(() => import('./components/School/ResultCenter'));
const About = lazy(() => import('./components/Public/About'));
const Contact = lazy(() => import('./components/Public/Contact'));
const Notes = lazy(() => import('./components/Public/Notes'));
const PastPapers = lazy(() => import('./components/Public/PastPapers'));
const Quiz = lazy(() => import('./components/Public/Quiz'));
const Blog = lazy(() => import('./components/Public/Blog'));
const Pricing = lazy(() => import('./components/Public/Pricing'));
const LessonPlans = lazy(() => import('./components/Public/LessonPlans'));

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [activeView, setActiveView] = useState('dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentSchool, setCurrentSchool] = useState<School | null>(null);
  
  // Public Route State
  const [publicView, setPublicView] = useState('HOME');

  // URL Routing Sync: Read initial URL and handle Back/Forward buttons
  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname;
      if (path === '/' || path === '') {
        setPublicView('HOME');
      } else {
        const parts = path.substring(1).split('/');
        const route = parts[0].toUpperCase();
        const publicRoutes = ['PRICING', 'ABOUT', 'CONTACT', 'NOTES', 'LESSON_PLANS', 'PAST_PAPERS', 'QUIZ', 'BLOG', 'LOGIN', 'STUDENT_LOGIN', 'SIGNUP'];
        if (publicRoutes.includes(route)) {
          setPublicView(route);
        } else {
          setActiveView(parts[0].toLowerCase());
        }
      }
    };

    handleUrlChange();
    window.addEventListener('popstate', handleUrlChange);
    return () => window.removeEventListener('popstate', handleUrlChange);
  }, []);

  // URL Routing Sync: Push publicView changes to URL
  useEffect(() => {
    if (!user) {
      const currentPrimaryPath = window.location.pathname.split('/')[1]?.toUpperCase();
      if (currentPrimaryPath === publicView) {
        // Do not force overwrite if we are already on the correct route (handles nested routes like /blog/slug)
        return;
      }
      const path = publicView === 'HOME' ? '/' : `/${publicView.toLowerCase()}`;
      if (window.location.pathname !== path) {
        window.history.pushState(null, '', path);
      }
    }
  }, [publicView, user]);

  // URL Routing Sync: Push activeView changes to URL
  useEffect(() => {
    if (user) {
      const path = `/${activeView.toLowerCase()}`;
      if (window.location.pathname !== path) {
        window.history.pushState(null, '', path);
      }
    }
  }, [activeView, user]);

  // Global System Configuration State
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    currencyCode: 'USD',
    currencySymbol: '$',
    platformName: 'PakParcha AI',
    platformLogo: ''
  });

  useEffect(() => {
    initializeDB();
    loadSystemConfig();

    // Check user session & 10-minute expiration
    const token = localStorage.getItem('token');
    const loginTimeStr = localStorage.getItem('login_timestamp');

    if (token) {
      const now = Date.now();
      const loginTime = loginTimeStr ? parseInt(loginTimeStr, 10) : 0;
      const TEN_MINUTES_MS = 10 * 60 * 1000;

      // If token expired (more than 10 minutes since login)
      if (!loginTime || now - loginTime > TEN_MINUTES_MS) {
        localStorage.removeItem('token');
        localStorage.removeItem('login_timestamp');
        setUser(null);
        setPublicView('HOME');
      } else {
        // Restore user session
        getCurrentUser().then((usr: User | null) => {
          if (usr) {
            setUser(usr);
          } else {
            localStorage.removeItem('token');
            localStorage.removeItem('login_timestamp');
          }
        }).catch(() => {
          localStorage.removeItem('token');
          localStorage.removeItem('login_timestamp');
        });
      }
    }

    // Apply cached theme immediately to avoid flash on reload
    const cached = localStorage.getItem('school_branding');
    if (cached) {
      try {
        const b = JSON.parse(cached);
        const root = document.documentElement;
        if (b.themeColor) root.style.setProperty('--brand-primary', b.themeColor);
        if (b.secondaryColor) root.style.setProperty('--brand-secondary', b.secondaryColor);
        if (b.lightColor) root.style.setProperty('--brand-light', b.lightColor);
        if (b.appFont) root.style.setProperty('--app-font', b.appFont);
      } catch (_) {}
    }
    // Restore dark/light app mode
    const savedMode = localStorage.getItem('app_mode');
    if (savedMode === 'dark') {
      document.body.style.backgroundColor = '#0a0f1e';
      document.body.style.color = '#ffffff';
      document.documentElement.style.setProperty('--app-bg', '#0a0f1e');
      document.documentElement.style.setProperty('--app-surface', 'rgba(255,255,255,0.04)');
      document.documentElement.style.setProperty('--app-text', '#ffffff');
      document.documentElement.style.setProperty('--app-text-muted', 'rgba(255,255,255,0.5)');
      document.documentElement.style.setProperty('--app-border', 'rgba(255,255,255,0.08)');
    }
  }, []);

  // Effect to load School details when a School Admin or Teacher logs in
  useEffect(() => {
    const fetchSchool = async () => {
        if (user && user.schoolId && user.role !== UserRole.SUPER_ADMIN) {
            try {
                const schoolData = await getSchoolById(user.schoolId);
                setCurrentSchool(schoolData);
                
                // Apply School Branding if available and cache it
                if (schoolData?.branding) {
                    const b = schoolData.branding;
                    const root = document.documentElement;
                    root.style.setProperty('--brand-primary', b.themeColor);
                    root.style.setProperty('--brand-secondary', b.secondaryColor);
                    root.style.setProperty('--brand-light', b.lightColor);
                    root.style.setProperty('--app-font', b.appFont);
                    // Cache so next login applies theme instantly
                    localStorage.setItem('school_branding', JSON.stringify(b));
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

  const handleStaffLogin = (loggedInUser: User) => {
    // A new session must always start on its role's dashboard
    localStorage.setItem('login_timestamp', Date.now().toString());
    setActiveView('dashboard');
    setIsFullScreen(false);
    setSidebarOpen(false);
    setUser(loggedInUser);
  };

  // --- PUBLIC ROUTING LOGIC ---
  if (!user) {
    if (publicView === 'LOGIN') {
      return <Login onLogin={handleStaffLogin} systemConfig={systemConfig} onNavigate={setPublicView} />;
    }
    if (publicView === 'STUDENT_LOGIN') {
      return <StudentLogin onLogin={(studentData: any) => {
        localStorage.setItem('login_timestamp', Date.now().toString());
        // Normalize student data into User shape for Sidebar/App compatibility
        const normalizedUser: User = {
          id: studentData.id,
          name: studentData.name,
          email: studentData.email,
          role: UserRole.STUDENT,
          schoolId: studentData.schoolId,
          avatar: '', // Students have no avatar — Sidebar will show initials
          assignedSubjects: studentData.assignedSubjects || [],
          assignedClasses: studentData.classId ? [studentData.classId] : [],
        };
        // Attach extra student-specific data for StudentDashboard
        (normalizedUser as any).classLevel = studentData.classLevel;
        (normalizedUser as any).rollNo = studentData.rollNo;
        (normalizedUser as any).classId = studentData.classId;
        setUser(normalizedUser);
      }} onSwitchToAdmin={() => setPublicView('LOGIN')} onBack={() => setPublicView('HOME')} />;
    }

    if (publicView === 'SIGNUP') {
      return <SignUp onLogin={(u) => { localStorage.setItem('login_timestamp', Date.now().toString()); setUser(u); }} onNavigate={setPublicView} />;
    }

    return (
      <PublicLayout 
        currentView={publicView} 
        onNavigate={setPublicView} 
        systemName={systemConfig.platformName || 'PakParcha'}
        logoUrl={systemConfig.platformLogo}
      >
        {publicView === 'HOME' && <Home onNavigate={setPublicView} />}
        {publicView === 'PRICING' && <Pricing onNavigate={setPublicView} />}
        {publicView === 'ABOUT' && <About appName={systemConfig.platformName || 'PakParcha'} />}
        {publicView === 'CONTACT' && <Contact />}
        {publicView === 'NOTES' && <Notes />}
        {publicView === 'LESSON_PLANS' && <LessonPlans />}
        {publicView === 'PAST_PAPERS' && <PastPapers />}
        {publicView === 'QUIZ' && <Quiz />}
        {publicView === 'BLOG' && <Blog />}
      </PublicLayout>
    );
  }

  // --- PROTECTED/INTERNAL ROUTING LOGIC ---
  const isOwner = user.role === UserRole.SUPER_ADMIN;
  const isTeacher = user.role === UserRole.TEACHER;
  const isStudent = user.role === UserRole.STUDENT;



  const renderContent = () => {
    if (isOwner) {
      switch (activeView) {
        case 'dashboard': return <SuperAdminDashboard />;
        case 'generate': return <GeneratePaper onBack={() => { setActiveView('dashboard'); setIsFullScreen(false); }} user={user} onEditorEnter={() => setIsFullScreen(true)} onEditorExit={() => setIsFullScreen(false)} />;
        case 'schemes': return <SchemeManager user={user} />;
        case 'schools': return <SchoolManager />;
        case 'curriculum': return <CurriculumManager />;
        case 'questions': return <GlobalQuestionBank />;
        case 'users': return <SystemUsers />;
        case 'revenue': return <RevenueAnalytics />;
        case 'plans': return <PlanManager />;
        case 'activity': return <ActivityLogView user={user} />;
        case 'settings': return <Settings userRole={user.role} onConfigUpdate={loadSystemConfig} onUserUpdate={setUser} />;
        case 'support': return <Support />;
        case 'content': return <ContentManager />;
        case 'inquiries': return <ContactQueries />; // Added Route
        default: return <div className="p-12 text-center text-gray-500">Coming Soon</div>;
      }
    }

    if (isTeacher) {
      switch (activeView) {
        case 'dashboard': return <TeacherDashboard onNavigate={setActiveView} user={user} />;
        case 'generate': return <GeneratePaper onBack={() => { setActiveView('dashboard'); setIsFullScreen(false); }} user={user} onEditorEnter={() => setIsFullScreen(true)} onEditorExit={() => setIsFullScreen(false)} />;
        case 'grading': return <ExamGrading user={user} />;
        case 'results': return <ResultCenter user={user} />;
        case 'saved': return <SavedPapers user={user} />;

        case 'settings': return <Settings userRole={user.role} onConfigUpdate={loadSystemConfig} onUserUpdate={setUser} />;
        case 'support': return <Support />;
        default: return <div className="p-12 text-center text-gray-500">Access Denied</div>;
      }
    }


    if (isStudent) {
      switch (activeView) {
        case 'dashboard': return <StudentDashboard user={user} />;
        case 'exams': return <StudentDashboard user={user} initialTab="TESTS" />;
        case 'results': return <StudentDashboard user={user} initialTab="RESULTS" />;
        case 'support': return <Support />;
        case 'settings': return <StudentDashboard user={user} initialTab="SETTINGS" />;
        default: return <StudentDashboard user={user} />;
      }
    }

    switch (activeView) {
      case 'dashboard': return <SchoolAdminDashboard onNavigate={setActiveView} user={user} />;
      case 'generate': return <GeneratePaper onBack={() => { setActiveView('dashboard'); setIsFullScreen(false); }} user={user} onEditorEnter={() => setIsFullScreen(true)} onEditorExit={() => setIsFullScreen(false)} />;
      case 'saved': return <SavedPapers user={user} />;
      case 'staff': return <StaffManager user={user} />;
      case 'students': return <StudentManager user={user} />;
      case 'grading': return <ExamGrading user={user} />;
      case 'results': return <ResultCenter user={user} />;
      case 'analytics': return <AnalyticsDashboard user={user} />;

      case 'billing': return <SubscriptionManager user={user} />;
      case 'inquiries': return <ContactQueries />; // Added Route
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
            onLogout={() => { 
              setUser(null); 
              setPublicView('LOGIN'); 
              localStorage.removeItem('school_branding');
              localStorage.removeItem('token');
            }}
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
             <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600" aria-label="Open Sidebar Menu">
                <Menu size={24} />
             </button>
             <span className="font-bold text-gray-900">{systemConfig.platformName}</span>
             <div className="w-8" />
          </div>
        )}

        <div className="flex-1 overflow-auto print:overflow-visible print:h-auto">
          <Suspense fallback={<div className="flex h-full items-center justify-center text-sm font-semibold text-slate-500">Loading workspace…</div>}>
            {renderContent()}
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default App;
