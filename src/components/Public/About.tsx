
import React from 'react';
import { Target, Eye, Award, Linkedin, Instagram, Phone, Users, ShieldCheck, Languages, BarChart3, CheckCircle2 } from 'lucide-react';

const About: React.FC<{ appName: string }> = ({ appName }) => {
  return (
    <div className="py-20 max-w-7xl mx-auto px-6 lg:px-8">
      {/* Page Header */}
      <div className="text-center mb-20">
        <h1 className="text-4xl font-black text-slate-900 mb-6">About {appName}</h1>
        <p className="text-slate-500 max-w-2xl mx-auto text-lg leading-relaxed">
          We are on a mission to modernize education through intelligent technology, developed with passion and precision.
        </p>
      </div>

      {/* Platform Story */}
      <section className="mb-24 grid lg:grid-cols-2 gap-10 items-center">
        <div className="rounded-[2rem] bg-slate-900 p-9 md:p-12 text-white relative overflow-hidden">
          <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-indigo-500/20 blur-3xl" />
          <div className="relative">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-indigo-300">Built for modern institutions</span>
            <h2 className="mt-4 text-3xl font-black tracking-tight">Assessment should support learning—not add more administration.</h2>
            <p className="mt-5 leading-relaxed text-slate-300">{appName} brings paper creation, secure role-based access, student assessment, result management, and performance insights into one connected workspace.</p>
          </div>
        </div>
        <div className="space-y-5">
          <h2 className="text-3xl font-black text-slate-900">How {appName} helps</h2>
          <p className="text-slate-500 leading-relaxed">Schools can move from scattered documents and manual processes to a clear, repeatable exam workflow. Teachers spend less time formatting papers, while leaders gain a better view of academic activity.</p>
          <ul className="space-y-3">
            {[
              'Create exam papers from an organized question bank.',
              'Prepare English, Urdu, and bilingual assessments.',
              'Give staff and students the right level of access.',
              'Print professional papers and review results in one place.'
            ].map((item) => <li key={item} className="flex gap-3 text-sm font-medium text-slate-700"><CheckCircle2 size={19} className="shrink-0 text-emerald-500" />{item}</li>)}
          </ul>
        </div>
      </section>

      {/* Values Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-24">
        <div className="p-8 bg-indigo-50 rounded-[2rem] border border-indigo-100">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-indigo-600 mb-6 shadow-sm">
            <Target size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Our Mission</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            To empower educators with tools that eliminate administrative burden, allowing them to focus on what matters most: teaching and student growth.
          </p>
        </div>
        
        <div className="p-8 bg-purple-50 rounded-[2rem] border border-purple-100">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-purple-600 mb-6 shadow-sm">
            <Eye size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Our Vision</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            A world where quality assessment is accessible, fair, and data-driven, bridging the gap between traditional methods and future needs.
          </p>
        </div>

        <div className="p-8 bg-emerald-50 rounded-[2rem] border border-emerald-100">
          <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-emerald-600 mb-6 shadow-sm">
            <Award size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-900 mb-3">Our Values</h3>
          <p className="text-sm text-slate-600 leading-relaxed">
            Integrity, Innovation, and Inclusivity drive every feature we build and every decision we make in this platform.
          </p>
        </div>
      </div>

      {/* What We Build */}
      <section className="mb-24">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl font-black text-slate-900">Designed around real academic work</h2>
          <p className="mt-4 text-slate-500">Every part of {appName} is intended to make assessments clearer, faster, and easier to manage.</p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Users, title: 'Role-based Workspaces', text: 'Separate experiences for admins, teachers, and students.' },
            { icon: Languages, title: 'Bilingual Support', text: 'Flexible English, Urdu, and bilingual paper creation.' },
            { icon: BarChart3, title: 'Useful Insights', text: 'Results and activity information that help academic teams act.' },
            { icon: ShieldCheck, title: 'Responsible Access', text: 'Structured permissions and activity tracking for institutions.' }
          ].map((item) => (
            <article key={item.title} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
              <item.icon size={24} className="text-indigo-600 mb-4" />
              <h3 className="font-bold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.text}</p>
            </article>
          ))}
        </div>
      </section>

      {/* Developer Profile Section */}
      <div className="bg-slate-900 text-white rounded-[3rem] p-12 text-center relative overflow-hidden shadow-2xl">
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-purple-500/20 rounded-full blur-[100px] pointer-events-none translate-y-1/2 -translate-x-1/2"></div>

        <div className="relative z-10 flex flex-col items-center">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-indigo-400 mb-10">Meet the Developer</h2>
            
            {/* Profile Image Container */}
            <div className="w-48 h-48 rounded-full border-4 border-white/10 mb-8 overflow-hidden bg-slate-800 shadow-2xl relative group">
                {/* Placeholder Image - Replace src with your actual photo URL */}
                <img 
                    src="https://ui-avatars.com/api/?name=Muhammad+Raza&background=random&size=256&bold=true&color=fff" 
                    alt="Muhammad Raza" 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                />
            </div>

            <h4 className="text-4xl font-black mb-2 tracking-tight">Muhammad Raza</h4>
            <p className="text-lg text-slate-400 font-medium mb-8">Founder & Lead Engineer</p>

            <p className="max-w-2xl text-slate-300 leading-relaxed mb-10 text-lg">
                Sole developer and architect of {appName}. Dedicated to building robust educational technologies that simplify complex academic workflows. 
                Passionate about full-stack development and AI integration.
            </p>

            <div className="flex items-center justify-center gap-6">
                <a 
                    href="https://linkedin.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-4 bg-white/5 rounded-full text-white hover:bg-[#0077b5] hover:scale-110 transition-all duration-300 backdrop-blur-sm border border-white/10"
                    title="Connect on LinkedIn"
                >
                    <Linkedin size={24} />
                </a>
                <a 
                    href="https://instagram.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-4 bg-white/5 rounded-full text-white hover:bg-gradient-to-tr hover:from-[#fd5949] hover:to-[#d6249f] hover:scale-110 transition-all duration-300 backdrop-blur-sm border border-white/10"
                    title="Follow on Instagram"
                >
                    <Instagram size={24} />
                </a>
                <a 
                    href="https://wa.me/923001234567" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="p-4 bg-white/5 rounded-full text-white hover:bg-[#25D366] hover:scale-110 transition-all duration-300 backdrop-blur-sm border border-white/10"
                    title="Contact via WhatsApp"
                >
                    <Phone size={24} />
                </a>
            </div>
        </div>
      </div>
    </div>
  );
};

export default About;
