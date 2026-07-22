
import React, { useState, useEffect, useMemo } from 'react';
import { getActivityLogs, getActivityLogsBySchool } from '../services/dataService';
import { ActivityLog, User, UserRole } from '../types';
import { 
  History, 
  Search, 
  Filter, 
  FileText, 
  User as UserIcon, 
  Building2, 
  Shield, 
  CreditCard, 
  Database,
  Clock
} from 'lucide-react';

interface ActivityLogViewProps {
  user: User;
}

const ActivityLogView: React.FC<ActivityLogViewProps> = ({ user }) => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('All');

  useEffect(() => {
    /* Fixed: Use async function to await Promise results before setting state */
    const loadLogs = async () => {
      // SECURITY: Ensure non-super-admins only see their school's logs
      if (user.role === UserRole.SUPER_ADMIN) {
        const data = await getActivityLogs();
        setLogs(data);
      } else {
        const data = await getActivityLogsBySchool(user.schoolId || '');
        setLogs(data);
      }
    };
    loadLogs();
  }, [user]);

  const filteredLogs = useMemo(() => {
    return logs.filter(log => 
      (typeFilter === 'All' || log.type === typeFilter) &&
      (log.action.toLowerCase().includes(searchTerm.toLowerCase()) || log.userName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [logs, searchTerm, typeFilter]);

  const getTypeIcon = (type: ActivityLog['type']) => {
    switch (type) {
      case 'PAPER': return <FileText size={16} className="text-blue-500" />;
      case 'USER': return <UserIcon size={16} className="text-emerald-500" />;
      case 'SCHOOL': return <Building2 size={16} className="text-purple-500" />;
      case 'BILLING': return <CreditCard size={16} className="text-amber-500" />;
      case 'CURRICULUM': return <Database size={16} className="text-indigo-500" />;
      case 'SYSTEM': return <Shield size={16} className="text-gray-500" />;
      default: return <Clock size={16} className="text-gray-400" />;
    }
  };

  const getTimeAgo = (timestamp: string) => {
    const seconds = Math.floor((new Date().getTime() - new Date(timestamp).getTime()) / 1000);
    if (seconds < 60) return 'Just now';
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className="p-8 max-w-7xl mx-auto h-full flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
          <History className="text-indigo-600" size={28} />
          {user.role === UserRole.SUPER_ADMIN ? 'Global Activity Audit' : 'Institutional Activity Log'}
        </h1>
        <p className="text-gray-500 mt-1">Real-time tracking of events for {user.role === UserRole.SUPER_ADMIN ? 'all connected tenants' : 'your institution'}</p>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="p-4 border-b border-gray-200 flex flex-col md:flex-row gap-4 bg-gray-50/50">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text" 
              placeholder="Search by action or user..." 
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <select 
              className="px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-indigo-500"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              <option value="PAPER">Exams & Papers</option>
              <option value="USER">User Management</option>
              {user.role === UserRole.SUPER_ADMIN && <option value="SCHOOL">School Onboarding</option>}
              <option value="BILLING">Billing & Plans</option>
              <option value="CURRICULUM">Curriculum Updates</option>
              <option value="SYSTEM">System Events</option>
            </select>
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          <table className="w-full text-left whitespace-nowrap">
            <thead className="bg-gray-50 text-[10px] font-bold text-gray-500 uppercase tracking-widest sticky top-0 z-10 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4">Event Type</th>
                <th className="px-6 py-4">Actor</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Details</th>
                <th className="px-6 py-4 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-indigo-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-white border border-gray-200 rounded-lg group-hover:border-indigo-200 transition-colors">
                        {getTypeIcon(log.type)}
                      </div>
                      <span className="text-[10px] font-bold text-gray-400 group-hover:text-indigo-600 uppercase tracking-tight">{log.type}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-xs uppercase">
                        {log.userName.charAt(0)}
                      </div>
                      <span className="text-sm font-semibold text-gray-900">{log.userName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-700 font-medium">{log.action}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-gray-500 italic">{log.details || 'No additional data'}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-bold text-gray-900">{getTimeAgo(log.timestamp)}</span>
                      <span className="text-[10px] text-gray-400">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-gray-400 italic">
                    No activity logs found for the selected criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex justify-between items-center text-xs text-gray-500">
          <span>Displaying {filteredLogs.length} verified events</span>
          <button className="text-indigo-600 font-bold hover:underline">Download Audit CSV</button>
        </div>
      </div>
    </div>
  );
};

export default ActivityLogView;
