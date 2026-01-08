
import React, { useState, useEffect } from 'react';
import { apiRequest, ENDPOINTS } from '../services/service';
import { SystemConfig } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Save, Trash2, Settings as SettingsIcon, RotateCcw, ShieldAlert, Key, Zap, Wallet, ChevronLeft, ChevronRight } from 'lucide-react';

// PRODUCTION MODE FLAG
const IS_PRODUCTION = false;

const Settings: React.FC = () => {
  const [settings, setSettings] = useState<SystemConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, string>>({}); 
  
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // New Setting State
  const [newKey, setNewKey] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newValue, setNewValue] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  // Push Money State
  const [pushAmount, setPushAmount] = useState('');
  const [isPushing, setIsPushing] = useState(false);

  const { showToast } = useToast();
  const { t, isRTL } = useLanguage();

  const loadData = async (page = 1) => {
    setIsLoading(true);
    try {
      // Standardize pagination params
      const params = { 
        page: page.toString(),
        per_page: '20' // Higher limit for settings to see more at once
      };
      const res = await apiRequest(ENDPOINTS.SETTINGS, 'GET', undefined, params);
      
      let data: SystemConfig[] = [];
      
      if (res.data && Array.isArray(res.data)) {
          data = res.data;
          if (res.meta) {
              setCurrentPage(res.meta.current_page);
              setTotalPages(res.meta.last_page);
          }
      } else if (Array.isArray(res)) {
          data = res;
          setCurrentPage(1);
          setTotalPages(1);
      } else {
          data = [];
      }

      setSettings(data);
      setEdits({});
    } catch (e) {
      showToast('Failed to load system settings', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleValueChange = (id: string, value: string, key?: string) => {
    setEdits(prev => {
        const newEdits = { ...prev, [id]: value };
        
        // Requirement: When total-riget is changed, available-riget matches it immediately
        if (key === 'total-riget') {
            const availableSetting = settings.find(s => s.key === 'avalible-riget');
            if (availableSetting) {
                newEdits[availableSetting.id] = value;
            }
        }
        return newEdits;
    });
  };

  const handleUndo = (id: string) => {
    const newEdits = { ...edits };
    delete newEdits[id];
    
    // If undoing total-riget, also undo avalible-riget
    const item = settings.find(s => s.id === id);
    if (item?.key === 'total-riget') {
        const availableSetting = settings.find(s => s.key === 'avalible-riget');
        if (availableSetting) {
            delete newEdits[availableSetting.id];
        }
    }
    
    setEdits(newEdits);
  };

  const handleDelete = async (id: string, key: string) => {
    if (IS_PRODUCTION) {
        showToast(t('prod_mode_warning'), 'error');
        return;
    }
    if (window.confirm(`${t('delete_confirm')} "${key}"?`)) {
      try {
        await apiRequest(`${ENDPOINTS.SETTINGS}/${id}`, 'DELETE');
        setSettings(prev => prev.filter(item => item.id !== id));
        if (edits[id]) handleUndo(id);
        showToast(t('setting_deleted'), 'success');
        loadData(currentPage);
      } catch (e) {
        showToast(t('failed_delete_setting'), 'error');
      }
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newValue.trim()) {
      showToast(t('key_value_required'), 'error');
      return;
    }

    if (settings.some(s => s.key === newKey.trim())) {
      showToast(t('duplicate_key'), 'error');
      return;
    }

    try {
      setIsAdding(true);
      const payload = {
        key: newKey.trim(),
        label: newLabel.trim(),
        value: newValue.trim(),
        description: newDesc.trim()
      };
      await apiRequest(ENDPOINTS.SETTINGS, 'POST', payload);
      
      setNewKey('');
      setNewLabel('');
      setNewValue('');
      setNewDesc('');
      showToast(t('setting_added'), 'success');
      loadData(currentPage);
    } catch (e) {
      showToast(t('failed_add_setting'), 'error');
    } finally {
      setIsAdding(false);
    }
  };

  const handleSaveChanges = async () => {
    const idsToUpdate = Object.keys(edits);
    if (idsToUpdate.length === 0) return;

    try {
      setIsLoading(true);
      const promises = idsToUpdate.map(id => 
        apiRequest(`${ENDPOINTS.SETTINGS}/${id}`, 'PATCH', { value: edits[id] })
      );
      await Promise.all(promises);
      showToast(`${t('settings_updated')}: ${idsToUpdate.length}`, 'success');
      await loadData(currentPage);
    } catch (e) {
      showToast(t('update_failed'), 'error');
      setIsLoading(false);
    }
  };

  const handlePushMoney = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!pushAmount || isNaN(Number(pushAmount)) || Number(pushAmount) <= 0) {
          showToast('Please enter a valid amount greater than 0', 'error');
          return;
      }

      const confirmMsg = t('distribute_confirm').replace('{amount}', pushAmount);
      if (!window.confirm(confirmMsg)) return;

      try {
          setIsPushing(true);
          const res = await apiRequest(ENDPOINTS.AUTH.PUSH_MONEY, 'POST', { amount: pushAmount });
          const detailMsg = `${res.message}. Distributed: ${res.total_amount} to ${res.users_count} users.`;
          showToast(detailMsg, 'success');
          setPushAmount('');
          loadData(currentPage);
      } catch (e: any) {
          showToast(e.message || 'Push money failed', 'error');
      } finally {
          setIsPushing(false);
      }
  };

  const hasChanges = Object.keys(edits).length > 0;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-24">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="text-primary" /> {t('system_config')}
          </h2>
          <p className="text-gray-500 dark:text-slate-400 mt-1">
             {t('dashboard')} / {t('settings')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50">
              <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                 <Key size={18} className="text-gray-400" />
                 {t('system_config')}
              </h3>
            </div>

            {isLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
                <p className="text-gray-500 dark:text-slate-400">{t('loading')}</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-slate-700/50">
                {settings.length === 0 ? (
                    <div className="p-8 text-center text-gray-500 dark:text-slate-400">
                        {t('no_records')}
                    </div>
                ) : settings.map((item) => {
                  const currentValue = edits[item.id] !== undefined ? edits[item.id] : item.value;
                  const isModified = edits[item.id] !== undefined && edits[item.id] !== item.value;
                  const label = item.label || (t(item.key as any) !== item.key ? t(item.key as any) : item.key);
                  
                  // Requirement: Admin cannot manually edit avalible-riget
                  const isReadOnly = item.key === 'avalible-riget';

                  return (
                    <div key={item.id} className={`group p-5 transition-all duration-200 ${isModified ? 'bg-indigo-50/40 dark:bg-indigo-900/10' : 'hover:bg-gray-50/80 dark:hover:bg-slate-700/30'}`}>
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div className="space-y-0.5">
                                <label className="text-sm font-bold text-gray-800 dark:text-white">{label}</label>
                                <span className="text-[10px] font-mono text-gray-400 dark:text-slate-500 block uppercase tracking-wider">{item.key}</span>
                            </div>
                            {!IS_PRODUCTION && !isReadOnly && (
                                <button
                                    onClick={() => handleDelete(item.id, item.key)}
                                    className="text-gray-300 hover:text-red-500 dark:text-slate-600 dark:hover:text-red-400 p-1 rounded transition-all opacity-0 group-hover:opacity-100"
                                >
                                    <Trash2 size={14} />
                                </button>
                            )}
                        </div>
                        <div className="relative">
                            <input
                                type="text"
                                value={currentValue}
                                readOnly={isReadOnly}
                                onChange={(e) => handleValueChange(item.id, e.target.value, item.key)}
                                className={`w-full p-2.5 rounded-lg border text-sm outline-none transition-all ${
                                    isReadOnly 
                                    ? 'bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-gray-400 border-gray-200 dark:border-slate-700 cursor-not-allowed' 
                                    : isModified 
                                        ? 'bg-white dark:bg-slate-900 border-primary ring-2 ring-primary/10 shadow-inner text-gray-900 dark:text-white' 
                                        : 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-600 focus:border-primary/50 text-gray-900 dark:text-white'
                                }`}
                            />
                            {isModified && !isReadOnly && (
                                <button 
                                    onClick={() => handleUndo(item.id)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-primary transition-colors"
                                >
                                    <RotateCcw size={14} />
                                </button>
                            )}
                        </div>
                        {item.description && <p className="text-[11px] text-gray-400 dark:text-slate-500">{item.description}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {totalPages > 1 && (
                <div className="bg-gray-50 dark:bg-slate-900/50 border-t border-gray-100 dark:border-slate-700 p-3 flex items-center justify-center gap-4">
                    <button onClick={() => loadData(currentPage - 1)} disabled={currentPage === 1} className="p-1.5 rounded-full hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50">
                        {isRTL ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                    <span className="text-xs font-medium text-gray-500">{currentPage} / {totalPages}</span>
                    <button onClick={() => loadData(currentPage + 1)} disabled={currentPage === totalPages} className="p-1.5 rounded-full hover:bg-white dark:hover:bg-slate-800 disabled:opacity-50">
                        {isRTL ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                    </button>
                </div>
            )}
          </div>

          {!IS_PRODUCTION && (
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
              <h3 className="font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2 text-sm">
                <Plus size={18} className="text-primary" /> {t('add_setting')}
              </h3>
              <form onSubmit={handleAdd} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                    <input type="text" className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-sm outline-none" value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder={t('label')} />
                    <input type="text" className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-sm outline-none" value={newKey} onChange={e => setNewKey(e.target.value)} placeholder={t('key')} />
                </div>
                <div className="flex gap-2">
                    <input type="text" className="flex-1 p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-sm outline-none" value={newValue} onChange={e => setNewValue(e.target.value)} placeholder={t('value')} />
                    <button type="submit" disabled={isAdding} className="bg-gray-900 dark:bg-slate-700 text-white px-6 rounded-lg text-sm font-bold disabled:opacity-50">
                        {isAdding ? '...' : t('add_setting')}
                    </button>
                </div>
              </form>
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <div className="p-5 border-b border-gray-100 dark:border-slate-700 bg-indigo-50/50 dark:bg-indigo-900/10">
              <h3 className="font-bold text-indigo-900 dark:text-indigo-300 flex items-center gap-2">
                 <Zap size={18} className="text-primary fill-current" />
                 {t('push_money')}
              </h3>
            </div>
            <div className="p-6">
              <p className="text-xs text-gray-500 dark:text-slate-400 mb-6 leading-relaxed">
                {t('push_money_desc')}
              </p>
              
              <form onSubmit={handlePushMoney} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-2">{t('distribution_amount')}</label>
                  <div className="relative">
                    <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input 
                      type="number" 
                      step="0.01"
                      min="0.01"
                      value={pushAmount}
                      onChange={e => setPushAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-lg font-mono font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                      required
                    />
                  </div>
                </div>

                <button 
                  type="submit"
                  disabled={isPushing || !pushAmount}
                  className="w-full py-3.5 bg-primary hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50 hover:scale-[1.02] active:scale-95"
                >
                  {isPushing ? (
                    <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full"></div>
                  ) : (
                    <>
                      <Zap size={18} />
                      {t('distribute')}
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-xl p-5 space-y-3">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-400 font-bold">
               <ShieldAlert size={18} />
               <h4 className="text-sm">{t('push_money_warning1')}</h4>
            </div>
            <p className="text-xs text-amber-700 dark:text-amber-500 leading-relaxed">
              {t('push_money_warning2')}
            </p>
          </div>
        </div>
      </div>

      {hasChanges && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 bg-gray-900 dark:bg-slate-800 text-white px-6 py-4 rounded-xl shadow-2xl flex items-center gap-6 z-50 animate-in slide-in-from-bottom-4 border border-gray-800 dark:border-slate-600">
          <div className="flex items-center gap-3">
             <div className="relative">
               <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full animate-pulse"></span>
               <SettingsIcon size={20} className="text-gray-300" />
             </div>
             <div className="text-sm">
               <span className="font-bold text-white">{Object.keys(edits).length}</span> {t('modified')}
             </div>
          </div>
          <div className="h-8 w-px bg-gray-700"></div>
          <div className="flex gap-3">
            <button onClick={() => setEdits({})} className="text-gray-400 hover:text-white text-sm font-medium transition-colors">{t('cancel')}</button>
            <button onClick={handleSaveChanges} disabled={isLoading} className="bg-primary hover:bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-bold shadow-lg shadow-indigo-500/30 transition-all flex items-center gap-2">
              {isLoading ? '...' : (
                <>
                  <Save size={16} /> {t('save_changes')}
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
