
import React, { useState, useEffect, lazy, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import StudentLogin from './components/Student/StudentLogin';
import { User, UserRole, SystemConfig, School } from './types';

import { Menu } from 'lucide-react';
import { initializeDB, getSystemConfig, getSchoolById } from './services/dataService';

// Public Components
import PublicLayout from './components/Public/PublicLayout';
import Home from './components/Public/Home';
import SignUp from './components/SignUp';

const SchoolAdminDashboard = lazy(() => import('./components/School/SchoolAdminDashboard'));
const GeneratePaper = lazy(() => import('./components/GeneratePaper'));
const SchoolManager = lazy(() => import('./components/SuperAdmin/SchoolManager'));
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
    // A new session must always start on its role's dashboard, rather than
    // reopening whichever internal view was active before logout.
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
      return <SignUp onLogin={setUser} onNavigate={setPublicView} />;
    }

    return (
      <PublicLayout 
        currentView={publicView} 
        onNavigate={setPublicView} 
        systemName={systemConfig.platformName || 'ExamForge'}
        logoUrl={systemConfig.platformLogo}
      >
        {publicView === 'HOME' && <Home onNavigate={setPublicView} />}
        {publicView === 'PRICING' && <Pricing onNavigate={setPublicView} />}
        {publicView === 'ABOUT' && <About appName={systemConfig.platformName || 'ExamForge'} />}
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
  const isStudent = user.role === UserRole.STUDENT;



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
             <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-gray-600">
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
