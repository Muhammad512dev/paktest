
import React, { useState, useEffect, useMemo } from 'react';
import { DollarSign, TrendingUp, CreditCard, ArrowUpRight, ArrowDownRight, Calendar, Plus, X, Search, Filter, FileText } from 'lucide-react';
import { getSystemConfig, getTransactions, addTransaction, getSchools } from '../../services/dataService';
import { Transaction, School } from '../../types';

const RevenueAnalytics: React.FC = () => {
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [schools, setSchools] = useState<School[]>([]);
  const [selectedInvoiceTx, setSelectedInvoiceTx] = useState<Transaction | null>(null);
  
  // Filter State
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTx, setNewTx] = useState<Partial<Transaction>>({
      schoolId: '',
      amount: 0,
      status: 'Completed',
      type: 'Subscription',
      invoiceId: `INV-${new Date().getFullYear()}-${Math.floor(Math.random()*1000)}`
  });

  const loadData = async () => {
    const [config, txs, schoolList] = await Promise.all([
        getSystemConfig(),
        getTransactions(),
        getSchools()
    ]);
    setCurrencySymbol(config.currencySymbol);
    setTransactions(txs);
    setSchools(schoolList);
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransactions = useMemo(() => {
      return transactions.filter(t => {
          const matchSearch = t.schoolName.toLowerCase().includes(searchTerm.toLowerCase()) || t.invoiceId.toLowerCase().includes(searchTerm.toLowerCase());
          
          let matchDate = true;
          if (dateRange.start) {
              matchDate = matchDate && new Date(t.date) >= new Date(dateRange.start);
          }
          if (dateRange.end) {
              matchDate = matchDate && new Date(t.date) <= new Date(dateRange.end);
          }
          
          return matchSearch && matchDate;
      });
  }, [transactions, searchTerm, dateRange]);

  const totalRevenue = useMemo(() => filteredTransactions.reduce((acc, curr) => acc + curr.amount, 0), [filteredTransactions]);

  const handleAddTransaction = async () => {
      if (!newTx.schoolId || !newTx.amount) return;
      
      const school = schools.find(s => s.id === newTx.schoolId);
      const txData: Partial<Transaction> = {
          ...newTx,
          schoolName: school?.name || 'Unknown',
          currency: currencySymbol,
          date: new Date().toISOString()
      };
      
      await addTransaction(txData);
      await loadData();
      setIsAddModalOpen(false);
      setNewTx({
        schoolId: '',
        amount: 0,
        status: 'Completed',
        type: 'Subscription',
        invoiceId: `INV-${new Date().getFullYear()}-${Math.floor(Math.random()*1000)}`
      });
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 border-b border-gray-200 pb-6">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Revenue Analytics</h1>
            <p className="text-gray-500 mt-1">Financial performance and subscription metrics</p>
        </div>
        <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all flex items-center gap-2 shadow-lg shadow-indigo-100"
        >
            <Plus size={18} /> Record Transaction
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-green-50 text-green-600 rounded-lg"><DollarSign size={24} /></div>
               <span className="text-xs font-bold bg-green-50 text-green-700 px-2 py-1 rounded flex items-center gap-1"><ArrowUpRight size={12} /> +12.5%</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{currencySymbol}{totalRevenue.toLocaleString()}</h3>
            <p className="text-sm text-gray-500">Period Revenue</p>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-blue-50 text-blue-600 rounded-lg"><CreditCard size={24} /></div>
               <span className="text-xs font-bold bg-green-50 text-green-700 px-2 py-1 rounded flex items-center gap-1"><ArrowUpRight size={12} /> +5.2%</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{filteredTransactions.length}</h3>
            <p className="text-sm text-gray-500">Total Transactions</p>
         </div>
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <div className="flex justify-between items-start mb-4">
               <div className="p-3 bg-purple-50 text-purple-600 rounded-lg"><TrendingUp size={24} /></div>
               <span className="text-xs font-bold bg-red-50 text-red-700 px-2 py-1 rounded flex items-center gap-1"><ArrowDownRight size={12} /> 1.2%</span>
            </div>
            <h3 className="text-3xl font-bold text-gray-900">{currencySymbol}{filteredTransactions.length > 0 ? Math.round(totalRevenue / filteredTransactions.length) : 0}</h3>
            <p className="text-sm text-gray-500">Avg. Transaction Value</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
         {/* Main Chart Placeholder */}
         <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-gray-900">Revenue Growth Trend</h3>
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                    <Calendar size={14} className="text-gray-400" />
                    <span className="text-xs font-bold text-gray-600">Last 12 Months</span>
                </div>
            </div>
            <div className="h-64 flex items-end justify-between gap-2 px-4 flex-1">
               {[45, 52, 49, 60, 72, 68, 80, 85, 82, 90, 95, 100].map((h, i) => (
                  <div key={i} className="w-full flex flex-col gap-2 items-center group cursor-default">
                     <div className="w-full bg-green-50 rounded-t h-full flex items-end relative overflow-hidden transition-all group-hover:bg-green-100">
                        <div style={{ height: `${h}%` }} className="w-full bg-green-500 rounded-t transition-all duration-500 group-hover:bg-green-600 shadow-lg"></div>
                     </div>
                     <span className="text-[10px] text-gray-400 font-bold">{['J','F','M','A','M','J','J','A','S','O','N','D'][i]}</span>
                  </div>
               ))}
            </div>
         </div>

         {/* Filter Panel */}
         <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm space-y-6 h-fit">
            <h3 className="font-bold text-gray-900 flex items-center gap-2"><Filter size={18} className="text-indigo-500"/> Filters</h3>
            
            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Search Invoice / School</label>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input 
                            type="text" 
                            className="w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                            placeholder="Type to search..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Date Range</label>
                    <div className="grid grid-cols-2 gap-2">
                        <input 
                            type="date" 
                            className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs"
                            value={dateRange.start}
                            onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                        />
                        <input 
                            type="date" 
                            className="w-full px-2 py-2 border border-gray-200 rounded-lg text-xs"
                            value={dateRange.end}
                            onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                        />
                    </div>
                </div>
            </div>
         </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
         <div className="p-6 border-b border-gray-200 bg-gray-50/50">
            <h3 className="font-bold text-gray-900">Transaction History</h3>
         </div>
         <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap">
                <thead className="bg-gray-50 text-xs font-bold text-gray-500 uppercase tracking-widest border-b border-gray-200">
                    <tr>
                        <th className="px-6 py-4">Invoice ID</th>
                        <th className="px-6 py-4">School</th>
                        <th className="px-6 py-4">Type</th>
                        <th className="px-6 py-4">Date</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4 text-right">Amount</th>
                        <th className="px-6 py-4 text-right">Invoice</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                            <td className="px-6 py-4 text-sm font-medium text-indigo-600">{tx.invoiceId}</td>
                            <td className="px-6 py-4 text-sm font-bold text-gray-900">{tx.schoolName}</td>
                            <td className="px-6 py-4 text-xs font-medium text-gray-500">{tx.type}</td>
                            <td className="px-6 py-4 text-xs text-gray-500">{new Date(tx.date).toLocaleDateString()}</td>
                            <td className="px-6 py-4">
                                <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                                    tx.status === 'Completed' ? 'bg-green-50 text-green-700' : 
                                    tx.status === 'Pending' ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                                }`}>
                                    {tx.status}
                                </span>
                            </td>
                            <td className="px-6 py-4 text-right font-bold text-gray-900">
                                {currencySymbol}{tx.amount.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button
                                  onClick={() => setSelectedInvoiceTx(tx)}
                                  className="px-3 py-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 font-bold text-xs rounded-lg transition-all flex items-center gap-1.5 ml-auto"
                                >
                                  <FileText size={14} /> View Invoice
                                </button>
                            </td>
                        </tr>
                    ))}
                    {filteredTransactions.length === 0 && (
                        <tr>
                            <td colSpan={7} className="px-6 py-12 text-center text-gray-400 italic">No transactions found matching criteria.</td>
                        </tr>
                    )}
                </tbody>
            </table>
         </div>
      </div>

      {/* Invoice View Modal */}
      {selectedInvoiceTx && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold text-lg">
                  E
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-lg">Official Tax Invoice</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{selectedInvoiceTx.invoiceId}</p>
                </div>
              </div>
              <button onClick={() => setSelectedInvoiceTx(null)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 space-y-6 overflow-y-auto">
              <div className="flex justify-between items-start border-b border-slate-100 pb-6">
                <div>
                  <h4 className="font-black text-slate-900 text-xl tracking-tight">ExamForge AI Platform</h4>
                  <p className="text-xs text-slate-500 mt-1">Enterprise Subscription Billing</p>
                  <p className="text-xs text-slate-500">billing@examforge.com</p>
                </div>
                <div className="text-right">
                  <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-black uppercase rounded-full border border-emerald-200">
                    {selectedInvoiceTx.status}
                  </span>
                  <p className="text-xs text-slate-400 mt-2 font-bold uppercase">Date: {new Date(selectedInvoiceTx.date).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Billed To Institution</span>
                <div className="font-bold text-slate-900 text-base">{selectedInvoiceTx.schoolName}</div>
              </div>

              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    <th className="py-2">Description</th>
                    <th className="py-2">Type</th>
                    <th className="py-2 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  <tr>
                    <td className="py-3 font-semibold text-slate-800">Platform License Package</td>
                    <td className="py-3 text-slate-500">{selectedInvoiceTx.type}</td>
                    <td className="py-3 text-right font-bold text-slate-900">{currencySymbol}{selectedInvoiceTx.amount.toLocaleString()}</td>
                  </tr>
                </tbody>
              </table>

              <div className="border-t border-slate-200 pt-4 flex justify-between items-center font-black text-lg text-slate-900">
                <span>Total Paid:</span>
                <span className="text-indigo-600">{currencySymbol}{selectedInvoiceTx.amount.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
              <button
                onClick={() => setSelectedInvoiceTx(null)}
                className="px-6 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-200 rounded-xl"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-8 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-lg flex items-center gap-2"
              >
                <FileText size={16} /> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual Transaction Modal */}
      {isAddModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                      <h3 className="font-bold text-lg text-gray-900">Record New Transaction</h3>
                      <button onClick={() => setIsAddModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Select Institution</label>
                          <select 
                              className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                              value={newTx.schoolId}
                              onChange={(e) => setNewTx({...newTx, schoolId: e.target.value})}
                          >
                              <option value="">Choose School...</option>
                              {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Amount ({currencySymbol})</label>
                              <input 
                                  type="number" 
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                                  value={newTx.amount}
                                  onChange={(e) => setNewTx({...newTx, amount: parseFloat(e.target.value) || 0})}
                              />
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Invoice ID</label>
                              <input 
                                  type="text" 
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                  value={newTx.invoiceId}
                                  onChange={(e) => setNewTx({...newTx, invoiceId: e.target.value})}
                              />
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Transaction Type</label>
                              <select 
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                  value={newTx.type}
                                  onChange={(e) => setNewTx({...newTx, type: e.target.value as any})}
                              >
                                  <option value="Subscription">Subscription</option>
                                  <option value="Add-on">Add-on Service</option>
                                  <option value="Service">Consulting/Training</option>
                              </select>
                          </div>
                          <div>
                              <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Payment Status</label>
                              <select 
                                  className="w-full px-4 py-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                                  value={newTx.status}
                                  onChange={(e) => setNewTx({...newTx, status: e.target.value as any})}
                              >
                                  <option value="Completed">Completed</option>
                                  <option value="Pending">Pending</option>
                                  <option value="Failed">Failed</option>
                              </select>
                          </div>
                      </div>
                  </div>

                  <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                      <button onClick={() => setIsAddModalOpen(false)} className="px-6 py-2.5 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl">Cancel</button>
                      <button 
                          onClick={handleAddTransaction} 
                          disabled={!newTx.schoolId || !newTx.amount}
                          className="px-8 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg disabled:opacity-50"
                      >
                          Save Record
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default RevenueAnalytics;
