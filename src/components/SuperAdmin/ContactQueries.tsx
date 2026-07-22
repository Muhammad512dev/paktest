
import React, { useEffect, useState } from 'react';
import { getContactQueries } from '../../services/dataService';
import { Mail, Clock, Search, MessageSquare, User, Calendar } from 'lucide-react';

const ContactQueries: React.FC = () => {
  const [queries, setQueries] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const data = await getContactQueries();
      setQueries(data);
      setIsLoading(false);
    };
    load();
  }, []);

  const filteredQueries = queries.filter(q => 
    q.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    q.message.toLowerCase().includes(searchTerm.toLowerCase()) ||
    q.firstName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
             <MessageSquare className="text-indigo-600" size={32} />
             Public Inquiries
          </h1>
          <p className="text-gray-500 mt-2 text-lg">Manage messages submitted via the public contact form.</p>
        </div>
        <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Search messages..." 
                className="pl-10 pr-4 py-2.5 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 w-64 bg-white shadow-sm"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {isLoading ? (
         <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent"></div>
         </div>
      ) : filteredQueries.length === 0 ? (
         <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
            <Mail size={64} className="mb-4 opacity-20" />
            <p className="text-lg font-medium">No inquiries found.</p>
         </div>
      ) : (
         <div className="grid grid-cols-1 gap-4 overflow-y-auto pb-8">
            {filteredQueries.map((query) => (
               <div key={query.id} className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
                  <div className="flex justify-between items-start mb-4">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg">
                           {query.firstName.charAt(0)}
                        </div>
                        <div>
                           <h3 className="font-bold text-gray-900 text-lg">{query.firstName} {query.lastName}</h3>
                           <p className="text-sm text-indigo-600 font-medium flex items-center gap-1.5">
                              <Mail size={12} /> {query.email}
                           </p>
                        </div>
                     </div>
                     <div className="flex items-center gap-2 text-xs font-bold text-gray-400 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-100">
                        <Calendar size={14} />
                        {new Date(query.createdAt).toLocaleDateString()} 
                        <span className="text-gray-300">|</span> 
                        <Clock size={14} />
                        {new Date(query.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                     </div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl text-gray-700 leading-relaxed text-sm border border-gray-100 relative">
                     <div className="absolute -top-2 left-6 w-4 h-4 bg-gray-50 border-t border-l border-gray-100 transform rotate-45"></div>
                     {query.message}
                  </div>
               </div>
            ))}
         </div>
      )}
    </div>
  );
};

export default ContactQueries;
