
import React, { useState, useEffect } from 'react';
import { getPlans, addPlan, updatePlan, deletePlan, getSystemConfig } from '../../services/dataService';
import { SubscriptionPlan } from '../../types';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit2, 
  X, 
  Check, 
  DollarSign, 
  Users, 
  FileText, 
  HardDrive,
  CheckCircle2,
  AlertCircle,
  Cpu
} from 'lucide-react';

const PlanManager: React.FC = () => {
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<SubscriptionPlan | null>(null);
  const [currencySymbol, setCurrencySymbol] = useState('$');
  const ONLINE_TEST_FEATURE = 'Online Test';
  
  // Form State
  const [formData, setFormData] = useState<Partial<SubscriptionPlan>>({
    name: '',
    price: 0,
    currencySymbol: '$',
    features: [],
    limits: { papers: 100, staff: 5, storageGB: 1, aiRequestsPerDay: 5 }
  });
  const [newFeature, setNewFeature] = useState('');

  useEffect(() => {
    /* Fixed: Use async function to await Promise results before setting state */
    const loadPlans = async () => {
      const data = await getPlans();
      setPlans(data);
      const config = await getSystemConfig();
      setCurrencySymbol(config.currencySymbol);
    };
    loadPlans();
  }, []);

  const handleOpenModal = (plan?: SubscriptionPlan) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({ ...plan });
    } else {
      setEditingPlan(null);
      setFormData({
        name: '',
        price: 0,
        currencySymbol: currencySymbol,
        features: ['AI Question Generator', 'PDF Export'],
        limits: { papers: 100, staff: 5, storageGB: 1, aiRequestsPerDay: 5 }
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name) return;

    if (editingPlan) {
      await updatePlan({ ...editingPlan, ...formData } as SubscriptionPlan);
    } else {
      await addPlan({
        ...formData,
        id: `plan_${Date.now()}`
      } as SubscriptionPlan);
    }

    /* Fixed: Await data refresh to avoid Promise assignment error */
    const data = await getPlans();
    setPlans(data);
    setIsModalOpen(false);
  };

  const handleAddFeature = () => {
    if (!newFeature) return;
    setFormData(prev => ({
      ...prev,
      features: [...(prev.features || []), newFeature]
    }));
    setNewFeature('');
  };

  const handleRemoveFeature = (idx: number) => {
    setFormData(prev => ({
      ...prev,
      features: prev.features?.filter((_, i) => i !== idx)
    }));
  };

  const hasOnlineTestFeature = (features?: string[]) =>
    Array.isArray(features) && features.some(f => {
      const s = String(f || '').toLowerCase();
      return s.includes('online') && (s.includes('test') || s.includes('exam'));
    });

  const toggleOnlineTestFeature = () => {
    setFormData(prev => {
      const features = [...(prev.features || [])];
      if (hasOnlineTestFeature(features)) {
        return { ...prev, features: features.filter(f => {
          const s = String(f || '').toLowerCase();
          return !(s.includes('online') && (s.includes('test') || s.includes('exam')));
        }) };
      }
      return { ...prev, features: [...features, ONLINE_TEST_FEATURE] };
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Delete this plan?')) {
      await deletePlan(id);
      /* Fixed: Await data refresh to avoid Promise assignment error */
      const data = await getPlans();
      setPlans(data);
    }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
          <p className="text-gray-500 mt-1">Manage pricing tiers, limits, and platform features</p>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
        >
          <Plus size={18} />
          Create New Plan
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {plans.map(plan => (
          <div key={plan.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col relative group">
            <div className="p-6 border-b border-gray-100 bg-gray-50/50">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <CreditCard size={24} />
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(plan)} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-gray-200 transition-all">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => handleDelete(plan.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-white rounded-lg shadow-sm border border-transparent hover:border-gray-200 transition-all">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-2 flex items-baseline gap-1">
                <span className="text-3xl font-extrabold text-gray-900">{currencySymbol}{plan.price}</span>
                <span className="text-sm text-gray-500 font-medium">/ month</span>
              </div>
            </div>

            <div className="p-6 flex-1 space-y-6">
              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Resource Limits</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <FileText size={16} className="text-gray-400" />
                    <span>{plan.limits.papers >= 9999 ? 'Unlimited' : plan.limits.papers} Papers / mo</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Users size={16} className="text-gray-400" />
                    <span>{plan.limits.staff >= 999 ? 'Unlimited' : plan.limits.staff} Staff Accounts</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <HardDrive size={16} className="text-gray-400" />
                    <span>{plan.limits.storageGB} GB Storage</span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <Cpu size={16} className="text-gray-400" />
                    <span>{plan.limits.aiRequestsPerDay || 5} AI Requests / day</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Included Features</h4>
                <ul className="space-y-2">
                  {plan.features.map((feat, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                      <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg">
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Plan Name</label>
                  <input 
                    type="text" 
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Professional"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Currency</label>
                    <input 
                      type="text" 
                      value={formData.currencySymbol}
                      onChange={e => setFormData({...formData, currencySymbol: e.target.value})}
                      placeholder="$"
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all text-center"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">Price</label>
                    <input 
                      type="number" 
                      value={formData.price}
                      onChange={e => setFormData({...formData, price: parseFloat(e.target.value) || 0})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-200">
                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <AlertCircle size={16} className="text-indigo-600" /> Usage Limits
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Papers / Mo</label>
                    <input 
                      type="number" 
                      value={formData.limits?.papers}
                      onChange={e => setFormData({...formData, limits: { ...formData.limits!, papers: parseInt(e.target.value) || 0 }})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Staff Slots</label>
                    <input 
                      type="number" 
                      value={formData.limits?.staff}
                      onChange={e => setFormData({...formData, limits: { ...formData.limits!, staff: parseInt(e.target.value) || 0 }})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">Storage (GB)</label>
                    <input 
                      type="number" 
                      value={formData.limits?.storageGB}
                      onChange={e => setFormData({...formData, limits: { ...formData.limits!, storageGB: parseInt(e.target.value) || 0 }})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1.5">AI Req / Day</label>
                    <input 
                      type="number" 
                      value={formData.limits?.aiRequestsPerDay || 5}
                      onChange={e => setFormData({...formData, limits: { ...formData.limits!, aiRequestsPerDay: parseInt(e.target.value) || 0 }})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Features</label>
                <div className="mb-4 p-4 rounded-2xl border border-indigo-100 bg-indigo-50/40">
                  <label className="flex items-start gap-3 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasOnlineTestFeature(formData.features)}
                      onChange={toggleOnlineTestFeature}
                      className="mt-1 h-4 w-4"
                    />
                    <div>
                      <p className="text-sm font-black text-indigo-700">Enable Online Test</p>
                      <p className="text-xs text-indigo-700/80 font-medium leading-relaxed">
                        Controls Student Import/Management, Student Account Creation, Student Login, and the Online Testing module for schools on this package.
                      </p>
                    </div>
                  </label>
                </div>
                <div className="flex gap-2 mb-3">
                  <input 
                    type="text" 
                    value={newFeature}
                    onChange={e => setNewFeature(e.target.value)}
                    placeholder="Add a feature..."
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500"
                    onKeyPress={e => e.key === 'Enter' && handleAddFeature()}
                  />
                  <button onClick={handleAddFeature} className="bg-gray-100 text-gray-700 px-4 rounded-xl font-bold hover:bg-gray-200 transition-colors">
                    Add
                  </button>
                </div>
                <div className="space-y-2">
                  {formData.features?.map((feat, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-xl group/feat">
                      <div className="flex items-center gap-3">
                        <Check size={16} className="text-green-500" />
                        <span className="text-sm text-gray-700">{feat}</span>
                      </div>
                      <button onClick={() => handleRemoveFeature(i)} className="text-gray-400 hover:text-red-500 opacity-0 group-hover/feat:opacity-100 transition-opacity">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
              <button onClick={() => setIsModalOpen(false)} className="px-5 py-2 text-sm font-bold text-gray-500 hover:bg-gray-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} className="px-8 py-2 bg-indigo-600 text-white text-sm font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlanManager;
