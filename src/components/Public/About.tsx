import React, { useState } from 'react';
import { Target, Eye, Award, Linkedin, Instagram, Phone, Users, ShieldCheck, Languages, BarChart3, CheckCircle2, Play, Sparkles, BookOpen, Layers, Printer, FileText } from 'lucide-react';

interface AboutProps {
  appName: string;
  videoUrl?: string;
}

const getYouTubeEmbedUrl = (url?: string): string | null => {
  if (!url) return null;
  const cleanUrl = url.trim();
  if (!cleanUrl) return null;

  if (cleanUrl.includes('youtube.com/embed/')) return cleanUrl;

  const watchMatch = cleanUrl.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (watchMatch && watchMatch[1]) {
    return `https://www.youtube.com/embed/${watchMatch[1]}?autoplay=1&rel=0`;
  }

  const shortMatch = cleanUrl.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
  if (shortMatch && shortMatch[1]) {
    return `https://www.youtube.com/embed/${shortMatch[1]}?autoplay=1&rel=0`;
  }

  const shortsMatch = cleanUrl.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
  if (shortsMatch && shortsMatch[1]) {
    return `https://www.youtube.com/embed/${shortsMatch[1]}?autoplay=1&rel=0`;
  }

  return cleanUrl;
};

const About: React.FC<AboutProps> = ({ appName, videoUrl }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const embedUrl = getYouTubeEmbedUrl(videoUrl);

  return (
    <div className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#0B192C] border border-amber-500/30 text-amber-300 text-xs font-bold uppercase tracking-widest mb-4 shadow-sm">
          <Sparkles size={14} className="text-amber-400" /> Academic Assessment Infrastructure
        </div>
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 dark:text-white mb-6 tracking-tight">
          Empowering Pakistani <span className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 bg-clip-text text-transparent">Education</span>
        </h1>
        <p className="text-slate-600 dark:text-slate-300 max-w-3xl mx-auto text-base sm:text-lg leading-relaxed font-medium">
          {appName} was engineered to eliminate the hours spent wrestling with manual InPage typing, missing Nastaleeq fonts, and disorganized paper formatting for matric and intermediate board exams.
        </p>
      </div>

      {/* Video Walkthrough Section */}
      <section className="mb-20 sm:mb-24">
        <div className="bg-slate-900 rounded-[2rem] sm:rounded-[2.5rem] p-6 sm:p-10 md:p-12 shadow-2xl border border-slate-800 text-white relative overflow-hidden">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none" />
          <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

          <div className="max-w-3xl mx-auto text-center mb-8 relative z-10">
            <span className="text-xs font-black uppercase tracking-[0.25em] text-indigo-400">Institutional Demonstration</span>
            <h2 className="mt-2 text-2xl sm:text-4xl font-black tracking-tight text-white font-serif">See {appName} In Action</h2>
            <p className="mt-3 text-slate-300 text-xs sm:text-sm md:text-base leading-relaxed">
              Watch how teachers generate bilingual exam papers with Urdu Nastaleeq typography, official pairing schemes, answer keys, and institutional watermarks in under 60 seconds.
            </p>
          </div>

          <div className="relative z-10 max-w-4xl mx-auto rounded-2xl overflow-hidden shadow-2xl border border-slate-700 bg-slate-950 aspect-video group">
            {embedUrl ? (
              isPlaying ? (
                <iframe
                  src={embedUrl}
                  title={`${appName} Platform Walkthrough`}
                  className="w-full h-full border-0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                />
              ) : (
                <div 
                  onClick={() => setIsPlaying(true)}
                  className="relative w-full h-full cursor-pointer flex items-center justify-center bg-slate-950 group"
                >
                  <img 
                    src="/blog-exam-guide.jpg" 
                    alt="Platform Video Preview" 
                    className="w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity duration-500 scale-100 group-hover:scale-105 transition-transform"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-transparent to-transparent" />
                  
                  <div className="relative flex flex-col items-center gap-4 text-center p-6">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-xl shadow-indigo-600/40 group-hover:scale-110 transition-all duration-300 ring-8 ring-indigo-500/20">
                      <Play size={32} className="ml-1 fill-white" />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-black text-white">Click to Watch Platform Tour</h3>
                      <p className="text-xs text-indigo-300 mt-1 font-semibold">Complete Paper Generator & Question Bank Demo</p>
                    </div>
                  </div>
                </div>
              )
            ) : (
              <div className="relative w-full h-full flex flex-col items-center justify-center bg-slate-950 p-8 text-center">
                <img 
                  src="/blog-exam-guide.jpg" 
                  alt="Platform Walkthrough" 
                  className="absolute inset-0 w-full h-full object-cover opacity-25"
                />
                <div className="relative z-10 max-w-md">
                  <div className="w-16 h-16 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 mx-auto flex items-center justify-center mb-4 shadow-inner">
                    <Play size={28} className="ml-1" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Video Demonstration Guide</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mb-4">
                    Explore our step-by-step guides and test paper creation workflow directly on the live platform.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* The Story & Real Problem We Solve */}
      <section className="mb-20 sm:mb-24 grid lg:grid-cols-2 gap-8 sm:gap-10 items-center">
        <div className="rounded-[2rem] sm:rounded-[2.5rem] bg-slate-900 p-6 sm:p-10 md:p-12 text-white relative overflow-hidden shadow-2xl border border-slate-800">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-indigo-500/10 blur-3xl" />
          <div className="relative z-10">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-400">Our Motivation</span>
            <h2 className="mt-4 text-2xl sm:text-3xl font-black tracking-tight leading-tight font-serif text-white">
              Ending the 4-Hour Struggle of Manual InPage & Word Paper Typing.
            </h2>
            <p className="mt-4 leading-relaxed text-slate-300 text-sm sm:text-base font-normal">
              In Pakistan, preparing bilingual examination papers traditionally meant wrestling with Urdu InPage, missing Nastaleeq fonts, corrupted tables, and manual math equation formatting.
            </p>
            <p className="mt-3 leading-relaxed text-slate-300 text-sm sm:text-base font-normal">
              {appName} was engineered specifically to automate this entire workflow, giving teachers access to over 100,000+ verified textbook questions matching Punjab Boards (PCTB) and Federal Board (FBISE) standards.
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <span className="text-xs font-black uppercase tracking-widest text-indigo-700 bg-indigo-50 px-3.5 py-1 rounded-full border border-indigo-200/80">
              Verified Capabilities
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 mt-3 tracking-tight">
              Everything Your Academy Needs for Exam Excellence
            </h2>
          </div>
          <ul className="space-y-3.5">
            {[
              '100% Bilingual Urdu & English with authentic Jameel Noori Nastaleeq fonts.',
              'Official 2025–2026 Board Pairing Schemes auto-balanced in 1 click.',
              'PCTB, FBISE, KPK, and Single National Curriculum (SNC) chapter coverage.',
              'Instant Teacher Answer Keys & OMR Bubble Sheets generated automatically.',
              'Institutional Branding: School logo, custom header, and anti-copy watermark on every PDF.'
            ].map((item, idx) => (
              <li key={idx} className="flex gap-3 text-sm font-semibold text-slate-700">
                <CheckCircle2 size={20} className="shrink-0 text-indigo-600 mt-0.5" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Core Values */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-20 sm:mb-24">
        <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-md">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-indigo-100">
            <Target size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Our Mission</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            To give every Pakistani educator and school director the tools to conduct high-quality, board-standard testing without administrative overhead.
          </p>
        </div>
        
        <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-md">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-indigo-100">
            <BookOpen size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Curriculum Accuracy</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Every question, MCQ, and numerical problem is continuously audited against official textbooks and recent board past papers.
          </p>
        </div>

        <div className="p-8 bg-white rounded-3xl border border-slate-200 shadow-md">
          <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-5 shadow-sm border border-indigo-100">
            <Award size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-900 mb-2">Teacher-Centric Support</h3>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
            Local Pakistani customer support via WhatsApp and dedicated staff training for schools across all 9 Punjab boards.
          </p>
        </div>
      </div>

      {/* Founder / Team Profile Section */}
      <div className="bg-slate-900 text-white rounded-[2rem] sm:rounded-[3rem] p-6 sm:p-10 md:p-12 text-center relative overflow-hidden shadow-2xl border border-slate-800">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 flex flex-col items-center max-w-2xl mx-auto">
          <h2 className="text-xs font-bold uppercase tracking-[0.2em] text-indigo-400 mb-6">Built in Pakistan, for Pakistani Education</h2>
          
          <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-indigo-500/40 mb-5 overflow-hidden bg-slate-800 shadow-2xl">
            <img 
              src="https://ui-avatars.com/api/?name=Muhammad+Raza&background=0f172a&size=256&bold=true&color=6366f1" 
              alt="Muhammad Raza" 
              className="w-full h-full object-cover" 
            />
          </div>

          <h4 className="text-2xl sm:text-3xl font-black mb-1 tracking-tight font-serif text-white">Muhammad Raza</h4>
          <p className="text-sm text-indigo-400 font-bold mb-5">Founder & Lead Software Engineer</p>

          <p className="text-slate-300 leading-relaxed mb-8 text-sm sm:text-base font-normal">
            "We built {appName} with the belief that technology should empower educators, not complicate their lives. Our platform is dedicated to helping schools and tuition academies across Pakistan raise the standard of academic assessment while saving valuable teaching hours."
          </p>

          <div className="flex items-center justify-center gap-4">
            <a 
              href="https://wa.me/923000000000" 
              target="_blank" 
              rel="noopener noreferrer"
              className="px-6 py-3.5 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-2xl text-xs sm:text-sm flex items-center gap-2 shadow-lg transition-all active:scale-95"
            >
              <Phone size={16} />
              <span>Contact via WhatsApp Helpline</span>
            </a>
          </div>
        </div>
      </div>

    </div>
  );
};

export default About;
