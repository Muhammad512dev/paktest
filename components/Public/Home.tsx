
import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Zap, Shield, Users, Sparkles, Loader2 } from 'lucide-react';
import { getPublicStats, getSystemConfig } from '../../services/dataService';
import homeVideo from './home.mp4';

const Home: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    papers: 0,
    schools: 0,
    questions: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [platformConfig, setPlatformConfig] = useState({ logo: '', name: 'Exam Solution AI' });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const [statsData, configData] = await Promise.all([
            getPublicStats(),
            getSystemConfig()
        ]);
        
        setStats(statsData);

        setPlatformConfig({ 
            logo: configData.platformLogo || '', 
            name: configData.platformName || 'Exam Solution AI' 
        });
      } catch (e) {
        console.error("Failed to load home data", e);
        setStats({ papers: 0, schools: 0, questions: 0 });
      } finally {
        setLoadingStats(false);
      }
    };
    fetchStats();
  }, []);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M+';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k+';
    return num.toLocaleString(); // Exact number if small, otherwise formatted
  };

  return (
    <div className="space-y-24 pb-20">
      {/* Hero Section */}
      <section className="relative pt-32 pb-40 overflow-hidden bg-[#0F172A] text-white">
        
        {/* Background Video */}
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[#0F172A]/80 z-10"></div> {/* Dark Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A] via-transparent to-transparent z-10"></div> {/* Bottom Fade */}
          <video 
            autoPlay 
            loop 
            muted 
            playsInline 
            className="w-full h-full object-cover scale-105 opacity-120"
          >
            <source src={homeVideo} type="video/mp4" />
          </video>
        </div>

        {/* Decorative Elements */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 z-10 pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-purple-500/20 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 z-10 pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-20 text-center">
          {platformConfig.logo && (
            <div className="flex justify-center mb-8">
  <div
    className="
      w-24 h-24
      rounded-full
      bg-white/10 backdrop-blur-md
      border border-white/10
      shadow-2xl
      flex items-center justify-center
      overflow-hidden
      transition-all duration-300
      hover:scale-110
      hover:shadow-indigo-500/40
      hover:ring-2 hover:ring-indigo-400/40
    "
  >
    <img
      src={platformConfig.logo}
      alt="Platform Logo"
      className="w-full h-full object-cover"
    />
  </div>
</div>

          )}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-xs font-bold uppercase tracking-widest mb-8 animate-in fade-in slide-in-from-bottom-4 backdrop-blur-md">
            <Sparkles size={14} className="text-yellow-400" /> New: AI Auto-Grading Beta
          </div>
          <h1 className="text-5xl md:text-7xl font-black tracking-tight mb-8 leading-tight drop-shadow-2xl">
            Create Exams in <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Seconds</span>,<br /> Not Hours.
          </h1>
          <p className="text-lg text-slate-300 mb-12 max-w-2xl mx-auto leading-relaxed font-medium drop-shadow-md">
            {platformConfig.name} is the world's most advanced AI-powered assessment platform for schools and educators. Generate bilingual papers, manage curriculum, and track performance effortlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => onNavigate('SIGNUP')}
              className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-900/50 flex items-center justify-center gap-3 active:scale-95"
            >
              Start Free Trial <ArrowRight size={18} />
            </button>
            <button 
              onClick={() => onNavigate('ABOUT')}
              className="px-8 py-4 bg-white/5 text-white border border-white/10 rounded-2xl font-bold text-sm uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center backdrop-blur-sm active:scale-95"
            >
              Learn More
            </button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-black text-slate-900 mb-4">Why Top Schools Choose Us</h2>
          <p className="text-slate-500 max-w-xl mx-auto">Streamline your entire examination lifecycle with our comprehensive suite of tools designed for modern education.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { icon: Zap, title: "AI-Powered Generation", desc: "Create balanced papers instantly with our fine-tuned language models. Supports Bloom's taxonomy automatically." },
            { icon: Shield, title: "Enterprise Security", desc: "Role-based access control, encrypted data storage, and complete audit logs for administration." },
            { icon: Users, title: "Collaborative Workflow", desc: "Staff management, subject delegation, and multi-user editing for seamless department coordination." }
          ].map((feature, i) => (
            <div key={i} className="p-8 rounded-[2rem] bg-white border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all group">
              <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                <feature.icon size={28} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">{feature.title}</h3>
              <p className="text-sm text-slate-500 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-indigo-900 py-20 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
        <div className="max-w-7xl mx-auto px-6 lg:px-8 relative z-10">
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center divide-x divide-white/10">
            {[
              { val: stats.papers, label: "Papers Generated" },
              { val: stats.schools, label: "Partner Schools" },
              { val: stats.questions, label: "Questions Banked" },
              { val: "99.9%", label: "Uptime SLA", isString: true }
            ].map((stat, i) => (
              <div key={i} className="px-4">
                <div className="text-4xl md:text-5xl font-black mb-2 transition-all duration-1000 flex items-center justify-center">
                    {loadingStats && !stat.isString ? (
                        <Loader2 className="animate-spin text-white/50" size={32} />
                    ) : (
                        stat.isString ? stat.val : formatNumber(stat.val as number)
                    )}
                    
                </div>
                <div className="text-xs font-bold uppercase tracking-widest text-indigo-300">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Teaser */}
      {/* Pricing Teaser with Background Video */}
<section className="relative max-w-5xl mx-auto px-6 lg:px-8 overflow-hidden rounded-[3rem]">
  
  {/* Background Video */}
  <div className="absolute inset-0 z-0">
    <video
      autoPlay
      loop
      muted
      playsInline
      className="w-full h-full object-cover scale-105"
    >
      <source src={homeVideo} type="video/mp4" />
    </video>

    {/* Dark Overlay */}
    <div className="absolute inset-0 bg-slate-900/80"></div>

    {/* Gradient for text readability */}
    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
  </div>

  {/* Content */}
  <div className="relative z-10 p-12 text-center text-white">
    <h2 className="text-3xl md:text-4xl font-black mb-6">
      Ready to transform your assessment process?
    </h2>

    <p className="text-slate-300 mb-10 max-w-xl mx-auto">
      Join thousands of educators saving 10+ hours per week.
      Start your free trial today, no credit card required.
    </p>

    <button
      onClick={() => onNavigate('SIGNUP')}
      className="px-10 py-4 bg-white text-slate-900 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-indigo-50 transition-all transform hover:scale-105"
    >
      Get Started for Free
    </button>

    <p className="mt-6 text-[10px] uppercase tracking-widest text-slate-400 font-bold flex items-center justify-center gap-2">
      <CheckCircle2 size={14} className="text-emerald-500" /> 14-Day Free Trial
      <span className="mx-2">•</span>
      <CheckCircle2 size={14} className="text-emerald-500" /> Cancel Anytime
    </p>
  </div>
</section>

    </div>
  );
};

export default Home;
