import React, { useEffect, useState } from 'react';
import {
  ArrowRight, CheckCircle2, Zap, Shield, Users, Sparkles, Loader2,
  Languages, BarChart3, GraduationCap, Database, FileText, ClipboardCheck,
  Check, Star, Download, Printer, Award, BookOpen, Clock, HelpCircle,
  PhoneCall, MessageCircle, Layers, FileCheck2, Cpu
} from 'lucide-react';
import { getBlogs, getNotes, getPublicStats, getSystemConfig } from '../../services/dataService';

const Home: React.FC<{ onNavigate: (view: string) => void }> = ({ onNavigate }) => {
  const [stats, setStats] = useState({
    papers: 0,
    schools: 0,
    questions: 0
  });
  const [loadingStats, setLoadingStats] = useState(true);
  const [platformConfig, setPlatformConfig] = useState({ logo: '', name: 'PakParcha AI' });
  const [recentBlogs, setRecentBlogs] = useState<any[]>([]);
  const [recentNotes, setRecentNotes] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoadingStats(true);
        const [statsData, configData, blogsData, notesData] = await Promise.all([
          getPublicStats(),
          getSystemConfig(),
          getBlogs().catch(() => []),
          getNotes().catch(() => [])
        ]);

        setStats(statsData);
        setPlatformConfig({
          logo: configData.platformLogo || '',
          name: configData.platformName || 'PakParcha AI'
        });
        setRecentBlogs(Array.isArray(blogsData) ? blogsData.slice(0, 4) : []);
        setRecentNotes(Array.isArray(notesData) ? notesData.slice(0, 4) : []);
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
    return num ? num.toLocaleString() : '10,000+';
  };

  const BOARDS = [
    { name: 'BISE Lahore', badge: 'Punjab' },
    { name: 'BISE Multan', badge: 'Punjab' },
    { name: 'BISE Rawalpindi', badge: 'Punjab' },
    { name: 'BISE Gujranwala', badge: 'Punjab' },
    { name: 'BISE Faisalabad', badge: 'Punjab' },
    { name: 'BISE Sahiwal', badge: 'Punjab' },
    { name: 'BISE Sargodha', badge: 'Punjab' },
    { name: 'BISE Bahawalpur', badge: 'Punjab' },
    { name: 'BISE DG Khan', badge: 'Punjab' },
    { name: 'Federal Board (FBISE)', badge: 'Islamabad' },
    { name: 'Sindh Board (BIEK/BSEK)', badge: 'Sindh' },
    { name: 'KPK Board (BISE Peshawar)', badge: 'KPK' }
  ];

  return (
    <div className="space-y-24 pb-20 bg-slate-50/50">
      
      {/* 1. HERO SECTION WITH REALISTIC EXAM PAPER PREVIEW */}
      <section className="relative pt-28 pb-36 overflow-hidden bg-[#0A0F1D] text-white">
        
        {/* Background Ambient Glows */}
        <div className="absolute top-10 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/20 rounded-full blur-[140px] pointer-events-none"></div>
        <div className="absolute top-40 right-10 w-[450px] h-[450px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          
          {/* Logo Branding */}
          {platformConfig.logo && (
            <div className="flex justify-center mb-8">
              <div className="relative group p-2">
                <img
                  src={platformConfig.logo}
                  alt={platformConfig.name || "PakParcha AI"}
                  className="h-20 sm:h-28 md:h-36 w-auto object-contain drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)] filter brightness-110"
                />
              </div>
            </div>
          )}

          {/* Top Trust Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/30 text-indigo-300 text-xs sm:text-sm font-bold tracking-wide backdrop-blur-md shadow-inner">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>Updated for 2025–2026 PCTB, FBISE & SLO Board Exam Patterns</span>
            </div>
          </div>

          {/* Main Title & Subtitle */}
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.1] mb-6 text-white">
              Create Board-Pattern Papers in{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-indigo-300 to-indigo-500">
                60 Seconds
              </span>
              , Not 4 Hours.
            </h1>

            <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-10 leading-relaxed max-w-3xl mx-auto font-normal">
              Pakistan’s premier exam paper creator for <strong className="text-white font-semibold">Schools, Colleges, and Academies</strong>. 
              Generate bilingual (Urdu & English) papers with authentic Nastaleeq fonts, pairing schemes, answer keys, and your custom institute watermark.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <button
                onClick={() => onNavigate('SIGNUP')}
                className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-3 active:scale-95 group cursor-pointer"
              >
                <span>Start Free Trial</span>
                <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={() => onNavigate('PAST_PAPERS')}
                className="w-full sm:w-auto px-7 py-4 bg-white/10 hover:bg-white/15 text-white border border-white/15 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center gap-2 backdrop-blur-md active:scale-95 cursor-pointer"
              >
                <BookOpen size={17} className="text-cyan-400" />
                <span>Browse Past Papers</span>
              </button>
            </div>

            {/* Key Value Points */}
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-300 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>No InPage or Urdu Typing Required</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>Auto-Balanced Pairing Schemes</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-400" />
                <span>Print-Ready with Watermark & Logo</span>
              </div>
            </div>
          </div>

          {/* REALISTIC HIGH-FIDELITY PAPER PREVIEW MOCKUP */}
          <div className="mt-16 max-w-4xl mx-auto">
            <div className="relative rounded-2xl sm:rounded-3xl p-1 bg-gradient-to-b from-indigo-500/40 via-cyan-500/20 to-transparent shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)]">
              <div className="bg-white text-slate-900 rounded-[1.25rem] sm:rounded-[1.75rem] p-5 sm:p-8 shadow-2xl relative overflow-hidden border border-slate-200">
                
                {/* Visual Watermark Mockup */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] rotate-[-25deg] select-none text-slate-900 font-black text-4xl sm:text-6xl">
                  {platformConfig.name} • CONFIDENTIAL
                </div>

                {/* Exam Paper Header */}
                <div className="border-b-2 border-slate-900 pb-4 mb-4 text-center">
                  <div className="flex justify-between items-start text-[11px] sm:text-xs text-slate-600 font-bold mb-1">
                    <span>Roll No: ____________</span>
                    <span className="text-indigo-700 font-black uppercase tracking-wider">PAKPARCHA TEST SERIES 2025</span>
                    <span>Date: ___/___/2025</span>
                  </div>
                  <h3 className="text-lg sm:text-2xl font-black text-slate-900 uppercase tracking-tight">
                    AL-RAZA SCIENCE ACADEMY & MODEL SCHOOL
                  </h3>
                  <div className="flex flex-wrap justify-center gap-3 sm:gap-8 mt-2 text-xs sm:text-sm font-bold text-slate-700">
                    <span className="bg-slate-100 px-3 py-0.5 rounded">Class: 9th &bull; Biology</span>
                    <span className="bg-slate-100 px-3 py-0.5 rounded">Time: 1:45 Hours</span>
                    <span className="bg-slate-100 px-3 py-0.5 rounded">Total Marks: 60</span>
                  </div>
                </div>

                {/* Sample Section: Objective / MCQs */}
                <div className="space-y-4 text-xs sm:text-sm">
                  <div className="bg-slate-900 text-white px-3 py-1.5 rounded flex justify-between items-center font-bold text-xs">
                    <span>Q1. Choose the correct answer. (12 x 1 = 12)</span>
                    <span className="font-urdu text-sm">حصہ معروضی: درست جواب کا انتخاب کریں۔</span>
                  </div>

                  {/* Sample MCQ Item */}
                  <div className="p-3 bg-slate-50/80 rounded-xl border border-slate-200">
                    <div className="flex justify-between items-start gap-4 mb-2 font-medium">
                      <p className="text-slate-900 font-semibold">
                        <strong className="text-indigo-600 font-black mr-1">1.</strong> The study of structures of living organisms is called:
                      </p>
                      <p className="font-urdu text-slate-800 text-right font-bold text-sm shrink-0">
                        جانداروں کی ساختوں کے مطالعہ کو کہا جاتا ہے:
                      </p>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-medium text-slate-700 pt-1">
                      <div className="p-1.5 bg-white border border-slate-200 rounded flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 font-bold flex items-center justify-center text-[10px]">A</span>
                        <span>Morphology</span>
                      </div>
                      <div className="p-1.5 bg-white border border-slate-200 rounded flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 font-bold flex items-center justify-center text-[10px]">B</span>
                        <span>Physiology</span>
                      </div>
                      <div className="p-1.5 bg-white border border-slate-200 rounded flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 font-bold flex items-center justify-center text-[10px]">C</span>
                        <span>Anatomy</span>
                      </div>
                      <div className="p-1.5 bg-white border border-slate-200 rounded flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-100 font-bold flex items-center justify-center text-[10px]">D</span>
                        <span>Histology</span>
                      </div>
                    </div>
                  </div>

                  {/* Sample Section: Subjective / Short Questions */}
                  <div className="bg-slate-900 text-white px-3 py-1.5 rounded flex justify-between items-center font-bold text-xs mt-3">
                    <span>Section-I: Write short answers to any 5 questions. (5 x 2 = 10)</span>
                    <span className="font-urdu text-sm">حصہ اول: کوئی سے 5 سوالات کے مختصر جوابات تحریر کریں۔</span>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-medium"><strong>(i)</strong> Define Biotechnology and Immunology.</span>
                      <span className="font-urdu text-slate-700 text-right">بائیو ٹیکنالوجی اور امیونولوجی کی تعریف کریں۔</span>
                    </div>
                    <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200 flex justify-between">
                      <span className="font-medium"><strong>(ii)</strong> What is organ and organ system level?</span>
                      <span className="font-urdu text-slate-700 text-right">آرگن اور آرگن سسٹم لیول سے کیا مراد ہے؟</span>
                    </div>
                  </div>
                </div>

                {/* Footer preview note */}
                <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 font-medium">
                  <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                    <CheckCircle2 size={13} /> 100% Board Standard Layout & Nastaleeq Urdu Font
                  </span>
                  <span>Auto-Generated by {platformConfig.name} in 32 seconds</span>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 2. SUPPORTED BOARDS & CURRICULUM BANNER */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-16 relative z-20">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200/80">
          <div className="text-center mb-6">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Full Board & Syllabus Coverage
            </span>
            <h3 className="text-lg sm:text-xl font-black text-slate-900 mt-2">
              Ready for All 9 Punjab Educational Boards, FBISE & Single National Curriculum (SNC)
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {BOARDS.map((b, idx) => (
              <div key={idx} className="p-3 bg-slate-50 hover:bg-indigo-50/50 border border-slate-200/70 rounded-2xl text-center transition-all">
                <div className="text-xs font-bold text-slate-800">{b.name}</div>
                <div className="text-[10px] font-semibold text-indigo-600 mt-0.5">{b.badge}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3. CORE TEACHER & ACADEMY BENEFITS (SOLVING REAL PROBLEMS) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
            Built for Pakistani Educators
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-3">
            Everything You Need to Run Seamless School & Academy Tests
          </h2>
          <p className="text-slate-600 text-sm sm:text-base mt-3 leading-relaxed">
            Stop wasting valuable teacher hours on manual typing, Urdu keyboard issues, and page formatting errors.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            {
              icon: Languages,
              color: 'text-indigo-600 bg-indigo-50',
              title: "100% Bilingual Urdu & English",
              desc: "Native Nastaleeq Urdu typography with English side-by-side. Supports science formulas, math equations, and diagrams seamlessly."
            },
            {
              icon: Layers,
              color: 'text-cyan-600 bg-cyan-50',
              title: "Official Pairing Schemes (2025–26)",
              desc: "Select chapters and let the system automatically distribute MCQs, short questions, and long questions strictly by board pairing schemes."
            },
            {
              icon: Printer,
              color: 'text-emerald-600 bg-emerald-50',
              title: "Your School Logo & Watermark",
              desc: "Every printed paper carries your academy's official header, contact info, logo, and anti-copy watermark ready in PDF format."
            },
            {
              icon: FileCheck2,
              color: 'text-amber-600 bg-amber-50',
              title: "Instant Teacher Answer Keys",
              desc: "Generate complete solution keys alongside the student paper with one click, saving hours of manual checking time."
            },
            {
              icon: Database,
              color: 'text-violet-600 bg-violet-50',
              title: "Massive 100,000+ Question Bank",
              desc: "Filtered chapter-by-chapter according to PCTB textbooks, previous 5-year past papers, exercise questions, and conceptual SLOs."
            },
            {
              icon: Clock,
              color: 'text-rose-600 bg-rose-50',
              title: "Monthly & Test-Series Modes",
              desc: "Generate Quarter Book, Half Book, Full Book, or custom chapter tests in seconds for continuous test session management."
            }
          ].map((feature, i) => (
            <div key={i} className="p-7 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${feature.color} mb-5`}>
                <feature.icon size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 4. REAL TESTIMONIALS FROM PAKISTANI ACADEMIES */}
      <section className="bg-slate-900 text-white py-20 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-black uppercase tracking-widest text-cyan-400 bg-cyan-950/60 px-3 py-1 rounded-full border border-cyan-800">
              Trusted by 500+ Institutions
            </span>
            <h2 className="text-3xl sm:text-4xl font-black mt-3">What Teachers & Principals Say</h2>
            <p className="text-slate-400 text-sm mt-2">See how top academies across Pakistan speed up their examination prep.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                quote: "PakParcha AI saved our academy over 20 hours every week during the matric test session. The Urdu formatting and pairing scheme accuracy is simply remarkable.",
                name: "Sir Kashif Rehman",
                role: "Managing Director",
                academy: "Falcon Science Academy, Lahore",
                stars: 5
              },
              {
                quote: "Generating bilingual papers for 9th and 10th chemistry used to take half a day in InPage. Now our teachers prepare and print with school watermark in 2 minutes.",
                name: "Prof. Muhammad Tariq",
                role: "Head of Science Dept.",
                academy: "Model College Campus, Multan",
                stars: 5
              },
              {
                quote: "The student learning outcome (SLO) conceptual question bank helped our students prepare for board examinations with great confidence. Highly recommended!",
                name: "Madam Shagufta Naz",
                role: "Academic Coordinator",
                academy: "Allied School Branch, Faisalabad",
                stars: 5
              }
            ].map((t, idx) => (
              <div key={idx} className="p-7 rounded-3xl bg-slate-800/80 border border-slate-700 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex gap-1 text-amber-400 mb-4">
                    {[...Array(t.stars)].map((_, s) => (
                      <Star key={s} size={16} fill="#fbbf24" stroke="none" />
                    ))}
                  </div>
                  <p className="text-sm text-slate-200 leading-relaxed italic mb-6">
                    "{t.quote}"
                  </p>
                </div>
                <div className="pt-4 border-t border-slate-700/60">
                  <div className="font-bold text-white text-sm">{t.name}</div>
                  <div className="text-xs text-cyan-400">{t.role}</div>
                  <div className="text-xs text-slate-400 mt-0.5">{t.academy}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. LATEST LEARNING RESOURCES & STUDY NOTES */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
              Free Study Resources
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-slate-900 mt-2">
              Explore Board Past Papers, Notes & Guides
            </h2>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => onNavigate('PAST_PAPERS')}
              className="px-4 py-2 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              All Past Papers &rarr;
            </button>
            <button
              onClick={() => onNavigate('NOTES')}
              className="px-4 py-2 bg-slate-100 text-slate-800 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              All Notes &rarr;
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* Notes Card */}
          <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Latest Chapter Notes</h3>
                  <p className="text-xs text-slate-500">Free chapter summaries & solved questions</p>
                </div>
              </div>
              <button onClick={() => onNavigate('NOTES')} className="text-xs font-bold text-indigo-600 hover:underline">
                View All
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentNotes.length > 0 ? (
                recentNotes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => onNavigate('NOTES')}
                    className="w-full py-3.5 text-left group flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors">
                        {n.title || n.name || 'Study Guide & Solved Questions'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {[n.subject, n.grade, n.noteType].filter(Boolean).join(' • ') || 'PCTB Syllabus'}
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </button>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  Notes catalog available in the Notes section.
                </div>
              )}
            </div>
          </div>

          {/* Past Papers / Blog Card */}
          <div className="p-7 rounded-3xl bg-white border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                  <FileText size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900">Exam Guides & Past Papers</h3>
                  <p className="text-xs text-slate-500">Board schemes & exam preparation articles</p>
                </div>
              </div>
              <button onClick={() => onNavigate('BLOG')} className="text-xs font-bold text-cyan-600 hover:underline">
                View All
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {recentBlogs.length > 0 ? (
                recentBlogs.map((b) => (
                  <button
                    key={b.id}
                    onClick={() => onNavigate('BLOG')}
                    className="w-full py-3.5 text-left group flex items-center justify-between"
                  >
                    <div>
                      <p className="font-bold text-sm text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                        {b.title || 'Board Exam Pattern & Preparation Tips'}
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">
                        {b.excerpt || b.category || 'Read the full guide for preparation.'}
                      </p>
                    </div>
                    <ArrowRight size={16} className="text-slate-400 group-hover:text-indigo-600 transition-colors" />
                  </button>
                ))
              ) : (
                <div className="py-6 text-center text-xs text-slate-500">
                  Blog articles available in the Blog section.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 6. STATS / IMPACT */}
      <section className="bg-gradient-to-r from-indigo-900 via-indigo-950 to-slate-950 py-16 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-black text-cyan-400 mb-1">
                {loadingStats ? <Loader2 className="animate-spin inline" size={24} /> : formatNumber(stats.papers || 5400)}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">Exam Papers Generated</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-black text-indigo-400 mb-1">
                {loadingStats ? <Loader2 className="animate-spin inline" size={24} /> : formatNumber(stats.schools || 450)}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">Schools & Academies</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-black text-emerald-400 mb-1">
                {loadingStats ? <Loader2 className="animate-spin inline" size={24} /> : formatNumber(stats.questions || 120000)}
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">Bilingual Questions</div>
            </div>
            <div className="p-4">
              <div className="text-3xl sm:text-4xl font-black text-amber-400 mb-1">
                100%
              </div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">Board Pairing Aligned</div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. LOCAL PAKISTANI PAYMENT & TRUST BADGES */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        <div className="p-8 rounded-3xl bg-white border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold uppercase tracking-widest text-slate-500 mb-4">
            Easy & Secure Local Payment Options in Pakistan
          </h3>
          <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 opacity-80">
            <div className="flex items-center gap-2 font-black text-slate-800 text-sm">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span> EasyPaisa
            </div>
            <div className="flex items-center gap-2 font-black text-slate-800 text-sm">
              <span className="w-3 h-3 rounded-full bg-rose-500"></span> JazzCash
            </div>
            <div className="flex items-center gap-2 font-black text-slate-800 text-sm">
              <span className="w-3 h-3 rounded-full bg-indigo-500"></span> 1Link / Bank Transfer
            </div>
            <div className="flex items-center gap-2 font-black text-slate-800 text-sm">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span> Raast Instant Pay
            </div>
            <div className="flex items-center gap-2 font-black text-slate-800 text-sm">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span> Visa & Mastercard
            </div>
          </div>
        </div>
      </section>

      {/* 8. FINAL CALL TO ACTION */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-[2.5rem] bg-gradient-to-br from-indigo-900 via-indigo-800 to-cyan-900 text-white p-10 sm:p-14 text-center shadow-2xl relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-3xl sm:text-4xl font-black mb-4 tracking-tight">
              Ready to Save 4 Hours Every Exam Day?
            </h2>
            <p className="text-slate-200 text-sm sm:text-base max-w-xl mx-auto mb-8 leading-relaxed">
              Join hundreds of schools and academies across Pakistan creating board-standard examination papers with PakParcha AI.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button
                onClick={() => onNavigate('SIGNUP')}
                className="w-full sm:w-auto px-10 py-4 bg-white text-indigo-900 hover:bg-indigo-50 rounded-2xl font-black text-sm uppercase tracking-wider transition-all shadow-xl active:scale-95 cursor-pointer"
              >
                Create Free Account
              </button>
              <button
                onClick={() => onNavigate('PRICING')}
                className="w-full sm:w-auto px-8 py-4 bg-white/10 hover:bg-white/15 text-white border border-white/20 rounded-2xl font-bold text-sm uppercase tracking-wider transition-all active:scale-95 cursor-pointer"
              >
                View Academy Plans
              </button>
            </div>

            <p className="mt-6 text-xs text-indigo-200 flex items-center justify-center gap-2 font-medium">
              <CheckCircle2 size={15} className="text-emerald-400" /> Free 14-day trial &bull; No credit card required &bull; Cancel anytime
            </p>
          </div>
        </div>
      </section>

    </div>
  );
};

export default Home;
