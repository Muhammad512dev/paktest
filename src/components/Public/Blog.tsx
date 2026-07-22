import React, { useState, useEffect } from 'react';
import { Search, Calendar, Clock, User, ArrowRight, Tag, ChevronLeft, Share2, Bookmark, Facebook, Twitter, Linkedin, ChevronRight as ChevronRightIcon, Sparkles as SparklesIcon } from 'lucide-react';
import { getBlogs } from '../../services/dataService';

const Blog: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [blogPosts, setBlogPosts] = useState<any[]>([]);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);

  useEffect(() => {
    const fetchBlogs = async () => {
      const posts = await getBlogs();
      setBlogPosts(posts);
    };
    fetchBlogs();
  }, []);

  const filteredPosts = blogPosts.filter(post => 
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Logic: Isolate featured post only on Page 1 AND when no search term is active.
  const showFeatured = currentPage === 1 && !searchTerm && filteredPosts.length > 0;
  
  // If showing featured, remove it from the grid list logic for page 1
  let postsToPaginate = filteredPosts;
  let featuredPost: any = null;

  if (showFeatured) {
      featuredPost = filteredPosts.find(p => p.featured) || filteredPosts[0];
      postsToPaginate = filteredPosts.filter(p => p.id !== featuredPost?.id);
  }

  // Pagination Slice
  const totalPages = Math.ceil(postsToPaginate.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const gridPosts = postsToPaginate.slice(indexOfFirstItem, indexOfLastItem);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, itemsPerPage]);

  const openPost = (id: string) => {
    setSelectedPostId(id);
    window.scrollTo(0, 0);
  };

  const closePost = () => {
    setSelectedPostId(null);
    window.scrollTo(0, 0);
  };

  const selectedPost = blogPosts.find(p => p.id === selectedPostId);

  if (selectedPost) {
    const relatedPosts = blogPosts.filter(p => p.id !== selectedPost.id && p.category === selectedPost.category).slice(0, 3);
    
    return (
      <div className="bg-white min-h-screen pb-20">
        <div className="sticky top-20 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
           <div className="max-w-7xl mx-auto px-6 lg:px-8 py-4 flex items-center justify-between">
              <button onClick={closePost} className="flex items-center gap-2 text-sm font-bold text-slate-600 hover:text-indigo-600 transition-colors">
                 <ChevronLeft size={18} /> Back to Blog
              </button>
              <div className="flex gap-4">
                 <button className="text-slate-400 hover:text-indigo-600 transition-colors"><Bookmark size={20} /></button>
                 <button className="text-slate-400 hover:text-indigo-600 transition-colors"><Share2 size={20} /></button>
              </div>
           </div>
        </div>

        <article className="max-w-7xl mx-auto px-6 lg:px-8 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
           <div className="lg:col-span-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider mb-6">
                 <Tag size={12} /> {selectedPost.category}
              </span>
              <h1 className="text-3xl md:text-5xl font-black text-slate-900 leading-tight mb-8">
                 {selectedPost.title}
              </h1>
              
              <div className="flex items-center gap-4 mb-8 pb-8 border-b border-slate-100">
                 <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 overflow-hidden">
                    <User size={24} />
                 </div>
                 <div>
                    <p className="font-bold text-slate-900 text-sm">{selectedPost.author}</p>
                    <p className="text-xs text-slate-500">{selectedPost.role} • {new Date(selectedPost.date).toLocaleDateString()}</p>
                 </div>
                 <div className="ml-auto flex items-center gap-2 text-xs font-bold text-slate-400">
                    <Clock size={14} /> {selectedPost.readTime}
                 </div>
              </div>

              {selectedPost.image && (
                <div className="rounded-[2rem] overflow-hidden mb-12 shadow-lg">
                   <img src={selectedPost.image} alt={selectedPost.title} className="w-full h-auto object-cover" />
                </div>
              )}

              <div 
                className="prose prose-lg prose-indigo max-w-none text-slate-600 leading-relaxed font-medium"
                dangerouslySetInnerHTML={{ __html: selectedPost.content || '' }} 
              />
           </div>

           <aside className="lg:col-span-4 space-y-10">
              <div>
                 <h3 className="font-bold text-slate-900 text-lg mb-6">Related Articles</h3>
                 <div className="space-y-6">
                    {relatedPosts.length > 0 ? relatedPosts.map(post => (
                       <div key={post.id} onClick={() => openPost(post.id)} className="group cursor-pointer flex gap-4 items-start">
                          {post.image && (
                            <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                               <img src={post.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                            </div>
                          )}
                          <div>
                             <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wide">{post.category}</span>
                             <h4 className="font-bold text-slate-900 text-sm mt-1 leading-snug group-hover:text-indigo-600 transition-colors">{post.title}</h4>
                             <p className="text-xs text-slate-400 mt-2">{new Date(post.date).toLocaleDateString()}</p>
                          </div>
                       </div>
                    )) : (
                       <p className="text-sm text-slate-400 italic">No related articles found.</p>
                    )}
                 </div>
              </div>
           </aside>
        </article>
      </div>
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-[#0F172A] py-20 px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-[120px] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto relative z-10 text-center">
          <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight">Educational Insights</h1>
          <div className="relative max-w-xl mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="Search articles..." 
              className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white/10 border border-white/10 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 backdrop-blur-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16">
        
        {/* Pagination Controls Top */}
        <div className="flex justify-end mb-8">
           <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Posts per page:</span>
              <select 
                 value={itemsPerPage}
                 onChange={(e) => setItemsPerPage(Number(e.target.value))}
                 className="px-3 py-2 border border-slate-200 rounded-lg bg-white text-xs font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
              >
                 <option value={20}>20</option>
                 <option value={40}>40</option>
                 <option value={50}>50</option>
              </select>
           </div>
        </div>

        {featuredPost && (
          <div className="mb-16 animate-in fade-in slide-in-from-bottom-4">
            <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Sparkles className="text-amber-500" size={16} /> Featured Article
            </h2>
            <div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center group cursor-pointer"
              onClick={() => openPost(featuredPost.id)}
            >
              {featuredPost.image && (
                <div className="relative overflow-hidden rounded-[2rem] shadow-xl">
                  <div className="absolute inset-0 bg-indigo-900/20 group-hover:bg-transparent transition-all z-10"></div>
                  <img src={featuredPost.image} className="w-full h-[400px] object-cover transform group-hover:scale-105 transition-transform duration-700" />
                </div>
              )}
              <div className="space-y-6">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-xs font-bold uppercase tracking-wider">
                  <Tag size={12} /> {featuredPost.category}
                </span>
                <h3 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight group-hover:text-indigo-600 transition-colors">
                  {featuredPost.title}
                </h3>
                <p className="text-lg text-slate-600 leading-relaxed">{featuredPost.excerpt}</p>
                <div className="flex items-center gap-6 text-sm text-slate-500 border-t border-slate-100 pt-6">
                  <span className="font-bold text-slate-700">{featuredPost.author}</span>
                  <span>{new Date(featuredPost.date).toLocaleDateString()}</span>
                  <span>{featuredPost.readTime}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {gridPosts.map(post => (
            <div 
              key={post.id} 
              onClick={() => openPost(post.id)}
              className="group bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col overflow-hidden cursor-pointer"
            >
              {post.image && (
                <div className="h-56 overflow-hidden relative">
                  <div className="absolute top-4 left-4 z-10">
                     <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur text-slate-900 text-[10px] font-bold uppercase tracking-wider shadow-sm">
                      {post.category}
                    </span>
                  </div>
                  <img src={post.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
              )}
              <div className="p-8 flex flex-col flex-1">
                <div className="flex-1 space-y-4">
                  <h3 className="text-xl font-bold text-slate-900 leading-snug group-hover:text-indigo-600 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-sm text-slate-500 leading-relaxed line-clamp-3">{post.excerpt}</p>
                </div>
                <div className="mt-6 pt-6 border-t border-slate-50 flex items-center justify-between">
                   <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                      <div className="w-6 h-6 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
                        {post.author ? post.author.charAt(0) : 'A'}
                      </div>
                      {post.author}
                   </div>
                   <ArrowRight size={16} className="text-slate-300 group-hover:text-indigo-600 transition-colors" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination Controls Bottom */}
        {postsToPaginate.length > 0 && (
            <div className="flex flex-col sm:flex-row justify-between items-center mt-16 gap-4 border-t border-slate-100 pt-8">
               <div className="text-sm text-slate-500 font-medium">
                  Page <span className="font-bold text-slate-900">{currentPage}</span> of <span className="font-bold text-slate-900">{totalPages || 1}</span>
               </div>
               
               <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                     <ChevronLeft size={20} />
                  </button>
                  
                  <div className="flex gap-1">
                     {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                           key={i}
                           onClick={() => setCurrentPage(i + 1)}
                           className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-slate-600 hover:bg-slate-50 border border-slate-200'}`}
                        >
                           {i + 1}
                        </button>
                     ))}
                  </div>

                  <button 
                    onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-3 border border-slate-200 rounded-xl text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                     <ChevronRightIcon size={20} />
                  </button>
               </div>
            </div>
        )}
      </div>
    </div>
  );
};

const Sparkles = ({ className, size }: { className?: string, size?: number }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/>
  </svg>
);

export default Blog;