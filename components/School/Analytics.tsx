
import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, FileText, PieChart, RefreshCw, CalendarRange } from 'lucide-react';
import { getPapersBySchool, getStaff, getSchoolById } from '../../services/dataService';
import { SavedPaper, Staff, School, User } from '../../types';

interface AnalyticsDashboardProps {
  user: User;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ user }) => {
  const [loading, setLoading] = useState(true);
  const [papers, setPapers] = useState<SavedPaper[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [school, setSchool] = useState<School | null>(null);

  // Computed Metrics
  const [subjectData, setSubjectData] = useState<{subject: string, val: number, color: string}[]>([]);
  const [monthlyData, setMonthlyData] = useState<{month: string, val: number}[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({ current: 0, trend: 0 });
  
  const loadAnalytics = async () => {
    setLoading(true);
    try {
        // Use the passed user prop to get the school ID
        const schoolId = user.schoolId || 's1'; 

        const [papersList, staffList, schoolData] = await Promise.all([
            getPapersBySchool(schoolId),
            getStaff(),
            getSchoolById(schoolId)
        ]);

        setPapers(papersList);
        setStaff(staffList);
        setSchool(schoolData);

        // Process Monthly Stats (Current vs Last Month)
        const now = new Date();
        const currentMonthIdx = now.getMonth();
        const currentYear = now.getFullYear();
        
        const prevDate = new Date();
        prevDate.setMonth(currentMonthIdx - 1);
        
        let thisMonthCount = 0;
        let prevMonthCount = 0;

        papersList.forEach(p => {
            if (p.dateCreated) {
                const d = new Date(p.dateCreated);
                if (d.getMonth() === currentMonthIdx && d.getFullYear() === currentYear) {
                    thisMonthCount++;
                }
                if (d.getMonth() === prevDate.getMonth() && d.getFullYear() === prevDate.getFullYear()) {
                    prevMonthCount++;
                }
            }
        });

        let trend = 0;
        if (prevMonthCount > 0) {
            trend = Math.round(((thisMonthCount - prevMonthCount) / prevMonthCount) * 100);
        } else if (thisMonthCount > 0) {
            trend = 100;
        } else if (prevMonthCount > 0) {
            trend = -100;
        }
        setMonthlyStats({ current: thisMonthCount, trend });

        // Process Subject Distribution
        const subjects: Record<string, number> = {};
        papersList.forEach(p => {
            subjects[p.subject] = (subjects[p.subject] || 0) + 1;
        });
        const totalPapers = papersList.length || 1;
        const subjectChartData = Object.keys(subjects).map((subj, idx) => ({
            subject: subj,
            val: Math.round((subjects[subj] / totalPapers) * 100),
            color: ['bg-blue-500', 'bg-indigo-500', 'bg-purple-500', 'bg-pink-500', 'bg-amber-500'][idx % 5]
        }));
        setSubjectData(subjectChartData);

        // Process Monthly Trends (Last 6 Months)
        const last6Months = Array.from({length: 6}, (_, i) => {
            const d = new Date();
            d.setMonth(d.getMonth() - (5 - i));
            return d.toLocaleString('default', { month: 'short' });
        });
        
        // Mocking trend data based on papers timestamps if available
        const monthlyCounts: Record<string, number> = {};
        papersList.forEach(p => {
            if(p.dateCreated) {
                const d = new Date(p.dateCreated);
                const m = d.toLocaleString('default', { month: 'short' });
                monthlyCounts[m] = (monthlyCounts[m] || 0) + 1;
            }
        });

        const monthChartData = last6Months.map(m => ({
            month: m,
            val: monthlyCounts[m] || 0
        }));
        // Normalizing for chart height (percentage relative to max)
        const maxVal = Math.max(...monthChartData.map(d => d.val)) || 1;
        const normalizedMonthData = monthChartData.map(d => ({
            month: d.month,
            val: Math.round((d.val / maxVal) * 100)
        }));
        setMonthlyData(normalizedMonthData);

    } catch (e) {
        console.error("Analytics load error", e);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, [user.schoolId]);

  if (loading) {
      return <div className="p-20 text-center flex items-center justify-center h-full"><RefreshCw className="animate-spin text-indigo-500 mr-2"/> Loading Analytics...</div>;
  }

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto">
      <div className="mb-8 flex justify-between items-end">
        <div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900">Performance Analytics</h1>
            <p className="text-gray-500 mt-1 text-sm md:text-base">Real-time insights for {school?.name || 'Institution'}</p>
        </div>
        <button onClick={loadAnalytics} className="text-indigo-600 text-sm font-bold flex items-center gap-2 hover:bg-indigo-50 px-3 py-2 rounded-lg transition-colors"><RefreshCw size={14}/> Refresh</button>
      </div>

      {/* Top Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                  <FileText size={24} />
               </div>
               <span className="text-green-600 text-xs font-bold bg-green-50 px-2 py-1 rounded">Live Data</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{papers.length}</h3>
            <p className="text-sm text-gray-500">Total Papers Generated</p>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-purple-50 text-purple-600 rounded-lg">
                  <Users size={24} />
               </div>
               <span className="text-gray-500 text-xs font-bold bg-gray-100 px-2 py-1 rounded">Registered</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{staff.length}</h3>
            <p className="text-sm text-gray-500">Active Teachers</p>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                  <CalendarRange size={24} />
               </div>
               <span className={`text-xs font-bold px-2 py-1 rounded ${monthlyStats.trend >= 0 ? 'text-green-600 bg-green-50' : 'text-red-600 bg-red-50'}`}>
                  {monthlyStats.trend >= 0 ? '+' : ''}{monthlyStats.trend}%
               </span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{monthlyStats.current}</h3>
            <p className="text-sm text-gray-500">Papers (This Month)</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
         {/* Monthly Generation Chart */}
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
               <BarChart3 size={20} className="text-gray-400" /> Papers Generated (Last 6 Months)
            </h3>
            {monthlyData.length > 0 ? (
                <div className="h-64 flex items-end justify-between gap-2 md:gap-4 px-2">
                {monthlyData.map((d, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center gap-2 group">
                        <div className="w-full bg-indigo-50 rounded-t-lg relative h-full flex items-end overflow-hidden group-hover:bg-indigo-100 transition-colors">
                            <div style={{ height: `${d.val || 5}%` }} className="w-full bg-indigo-600 rounded-t-lg transition-all duration-500 min-h-[4px]"></div>
                        </div>
                        <span className="text-[10px] md:text-xs text-gray-500 font-medium uppercase">{d.month}</span>
                    </div>
                ))}
                </div>
            ) : (
                <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No historical data available</div>
            )}
         </div>

         {/* Subject Distribution */}
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="font-bold text-gray-900 mb-6 flex items-center gap-2">
               <PieChart size={20} className="text-gray-400" /> Subject Distribution
            </h3>
            {subjectData.length > 0 ? (
                <div className="space-y-4">
                {subjectData.map((item) => (
                    <div key={item.subject}>
                        <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-700">{item.subject}</span>
                            <span className="text-gray-500">{item.val}%</span>
                        </div>
                        <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div style={{ width: `${item.val}%` }} className={`h-full ${item.color} rounded-full`}></div>
                        </div>
                    </div>
                ))}
                </div>
            ) : (
                <div className="h-64 flex items-center justify-center text-gray-400 text-sm">No papers generated yet</div>
            )}
            
            <div className="mt-8 p-4 bg-gray-50 rounded-lg border border-gray-200">
               <h4 className="text-sm font-bold text-gray-800 mb-2">AI Insights</h4>
               <p className="text-xs text-gray-600 leading-relaxed">
                  Based on your current generation patterns, {subjectData[0]?.subject || 'Mathematics'} is the most active department. Consider balancing the load across other subjects for uniform assessment.
               </p>
            </div>
         </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
