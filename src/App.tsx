
import React, { useState, useEffect, Suspense } from 'react';
import Sidebar from './components/Sidebar';
import Login from './components/Login';
import StudentLogin from './components/Student/StudentLogin';
import { User, UserRole, SystemConfig, School } from './types';

import { Menu } from 'lucide-react';
import { initializeDB, getSystemConfig, getSchoolById, getCurrentUser } from './services/dataService';
import { lazyWithRetry } from './utils/lazyWithRetry';

// Public Components
import PublicLayout from './components/Public/PublicLayout';
import Home from './components/Public/Home';
import SignUp from './components/SignUp';

const SchoolAdminDashboard = lazyWithRetry(() => import('./components/School/SchoolAdminDashboard'));
const GeneratePaper = lazyWithRetry(() => import('./components/GeneratePaper'));
const SchoolManager = lazyWithRetry(() => import('./components/SuperAdmin/SchoolManager'));
const SchemeManager = lazyWithRetry(() => import('./components/SuperAdmin/SchemeManager'));
const GlobalQuestionBank = lazyWithRetry(() => import('./components/SuperAdmin/GlobalQuestionBank'));
const SuperAdminDashboard = lazyWithRetry(() => import('./components/SuperAdmin/SuperAdminDashboard'));
const CurriculumManager = lazyWithRetry(() => import('./components/SuperAdmin/CurriculumManager'));
const SystemUsers = lazyWithRetry(() => import('./components/SuperAdmin/SystemUsers'));
const RevenueAnalytics = lazyWithRetry(() => import('./components/SuperAdmin/RevenueAnalytics'));
const PlanManager = lazyWithRetry(() => import('./components/SuperAdmin/PlanManager'));
const SavedPapers = lazyWithRetry(() => import('./components/School/SavedPapers'));
const StaffManager = lazyWithRetry(() => import('./components/School/StaffManager'));
const AnalyticsDashboard = lazyWithRetry(() => import('./components/School/Analytics'));
const SubscriptionManager = lazyWithRetry(() => import('./components/School/Subscription'));
const TeacherDashboard = lazyWithRetry(() => import('./components/Teacher/TeacherDashboard'));
const ActivityLogView = lazyWithRetry(() => import('./components/ActivityLogView'));
const Settings = lazyWithRetry(() => import('./components/Settings'));
const Support = lazyWithRetry(() => import('./components/Support'));
const ContentManager = lazyWithRetry(() => import('./components/SuperAdmin/ContentManager'));
const ContactQueries = lazyWithRetry(() => import('./components/SuperAdmin/ContactQueries'));
const StudentManager = lazyWithRetry(() => import('./components/School/StudentManager'));
const ExamGrading = lazyWithRetry(() => import('./components/Teacher/ExamGrading'));
const StudentDashboard = lazyWithRetry(() => import('./components/Student/StudentDashboard'));
const ResultCenter = lazyWithRetry(() => import('./components/School/ResultCenter'));
const About = lazyWithRetry(() => import('./components/Public/About'));
const Contact = lazyWithRetry(() => import('./components/Public/Contact'));
const Notes = lazyWithRetry(() => import('./components/Public/Notes'));
const PastPapers = lazyWithRetry(() => import('./components/Public/PastPapers'));
const Quiz = lazyWithRetry(() => import('./components/Public/Quiz'));
const Blog = lazyWithRetry(() => import('./components/Public/Blog'));
const Pricing = lazyWithRetry(() => import('./components/Public/Pricing'));
const LessonPlans = lazyWithRetry(() => import('./components/Public/LessonPlans'));
const Books = lazyWithRetry(() => import('./components/Public/Books'));
const PrivacyPolicy = lazyWithRetry(() => import('./components/Public/PrivacyPolicy'));
const TermsOfService = lazyWithRetry(() => import('./components/Public/TermsOfService'));
const Disclaimer = lazyWithRetry(() => import('./components/Public/Disclaimer'));
const RefundPolicy = lazyWithRetry(() => import('./components/Public/RefundPolicy'));

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
        const publicRoutes = ['PRICING', 'ABOUT', 'CONTACT', 'NOTES', 'LESSON_PLANS', 'BOOKS', 'PAST_PAPERS', 'QUIZ', 'BLOG', 'LOGIN', 'STUDENT_LOGIN', 'SIGNUP', 'PRIVACY', 'TERMS', 'DISCLAIMER', 'REFUND'];
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
    platformLogo: '/logo.webp'
  });

  // Dynamic SEO Meta & Title Manager for Google Indexing
  useEffect(() => {
    if (!user) {
      const seoMap: Record<string, { title: string; desc: string }> = {
        HOME: {
          title: 'PakParcha AI – Exam Paper Generator, Notes, Past Papers & Online Tests (New Syllabus 2026)',
          desc: "PakParcha AI is Pakistan's #1 exam paper generator and study portal. Download Class 9, 10, 11, 12 Notes PDF, Solved Past Papers, Pairing Schemes, and Online Tests."
        },
        NOTES: {
          title: 'Class 9, 10, 11, 12 Notes PDF – All Subjects Solved (New Syllabus 2026) | PakParcha AI',
          desc: 'Download free Class 9, 10, 11, and 12 chapter-wise solved notes, numericals, short questions, and MCQs in PDF for Punjab & Federal Board (FBISE).'
        },
        PAST_PAPERS: {
          title: 'Past Papers PDF Download – Punjab Board & Federal Board FBISE | PakParcha AI',
          desc: 'Download 5-year solved past papers for Class 9, 10, 11, and 12 in PDF. Includes all Punjab boards (BISE Lahore, Rawalpindi, Gujranwala) and FBISE.'
        },
        BOOKS: {
          title: 'Textbooks PDF Download – Punjab Curriculum & National Book Foundation | PakParcha AI',
          desc: 'Free PDF download of government textbooks for Class 9, 10, 11, and 12 according to the Single National Curriculum (SNC).'
        },
        QUIZ: {
          title: 'Online Test Preparation & Chapter-Wise MCQs Practice | PakParcha AI',
          desc: 'Take instant online tests and MCQs self-assessment quizzes for matric and intermediate board exam preparation with live scorecards.'
        },
        LESSON_PLANS: {
          title: 'Lesson Plans & Academic Scheme of Work for Teachers | PakParcha AI',
          desc: 'Download structured lesson plans, student activity sheets, and curriculum distribution guides for schools and teachers.'
        },
        PRICING: {
          title: 'Pricing Plans & Institute Subscriptions | PakParcha AI',
          desc: 'Affordable subscription packages for schools, colleges, and academies to generate unlimited custom bilingual exam papers.'
        },
        BLOG: {
          title: 'Educational Blog, Board Exam Tips & Pairing Schemes 2026 | PakParcha AI',
          desc: 'Latest educational updates, board pairing schemes 2026, date sheets, exam preparation tips, and study guides for students.'
        },
        ABOUT: {
          title: 'About PakParcha AI – Leading Automated Exam Platform in Pakistan',
          desc: 'Learn how PakParcha AI is revolutionizing education and exam preparation across Pakistani schools and academies.'
        },
        CONTACT: {
          title: 'Contact Us & Customer Support | PakParcha AI',
          desc: 'Get in touch with PakParcha AI customer support team for inquiries, school onboardings, and platform guidance.'
        },
        PRIVACY: {
          title: 'Privacy Policy | PakParcha AI',
          desc: 'Privacy policy and user data protection details of PakParcha AI.'
        },
        TERMS: {
          title: 'Terms of Service | PakParcha AI',
          desc: 'Terms and conditions for using PakParcha AI exam generation and educational resources.'
        },
        DISCLAIMER: {
          title: 'Disclaimer & Fair Use Notice | PakParcha AI',
          desc: 'Legal disclaimer and educational fair use guidelines for PakParcha AI.'
        },
        REFUND: {
          title: 'Refund Policy | PakParcha AI',
          desc: 'Refund and cancellation policy for PakParcha AI subscriptions.'
        }
      };

      const currentSeo = seoMap[publicView] || seoMap.HOME;
      document.title = currentSeo.title;
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc) {
        metaDesc.setAttribute('content', currentSeo.desc);
      }
    } else {
      document.title = `${activeView.charAt(0).toUpperCase() + activeView.slice(1)} – ${systemConfig.platformName}`;
    }
  }, [publicView, activeView, user, systemConfig.platformName]);

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
        {publicView === 'ABOUT' && <About appName={systemConfig.platformName || 'PakParcha'} videoUrl={systemConfig.aboutVideoUrl} />}
        {publicView === 'CONTACT' && <Contact />}
        {publicView === 'NOTES' && <Notes />}
        {publicView === 'LESSON_PLANS' && <LessonPlans />}
        {publicView === 'BOOKS' && <Books />}
        {publicView === 'PAST_PAPERS' && <PastPapers />}
        {publicView === 'QUIZ' && <Quiz />}
        {publicView === 'BLOG' && <Blog />}
        {publicView === 'PRIVACY' && <PrivacyPolicy appName={systemConfig.platformName || 'PakParcha'} />}
        {publicView === 'TERMS' && <TermsOfService appName={systemConfig.platformName || 'PakParcha'} />}
        {publicView === 'DISCLAIMER' && <Disclaimer appName={systemConfig.platformName || 'PakParcha'} />}
        {publicView === 'REFUND' && <RefundPolicy appName={systemConfig.platformName || 'PakParcha'} />}
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
