import React, { useState, useEffect, useMemo, useCallback } from 'react';
import DynamicTable from '../components/DynamicTable';
import { apiRequest, ENDPOINTS } from '../services/service';
import { Notification, ColumnDef, UserEmail } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Send, Users, User, Search, Check } from 'lucide-react';

const Notifications: React.FC = () => {
  const [data, setData] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { showToast } = useToast();
  const { t } = useLanguage();

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetType, setTargetType] = useState<'all' | 'selected' | 'single'>('all');
  
  const [userEmails, setUserEmails] = useState<UserEmail[]>([]);
  const [isLoadingEmails, setIsLoadingEmails] = useState(false);
  const [emailSearch, setEmailSearch] = useState('');
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  const columns: ColumnDef<Notification>[] = useMemo(() => [
      {key:"id", header: "ID", type: "text"},  
      { key: 'username', header: t('name'), type: 'text' },
      { key: 'title', header: t('title'), type: 'text' },
      { key: 'message', header: t('message'), type: 'text' },
      { 
          key: 'is_read', 
          header: t('status'), 
          type: 'text',
          render: (val) => (
             <span className={`px-2 py-1 rounded text-xs font-semibold ${val === 1 ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                 {val === 1 ? t('read') : t('unread')}
             </span>
          ) 
      },
      { key: 'created_at', header: t('sent_at'), type: 'date' },
  ], [t]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
          page: page.toString(),
          per_page: limit.toString(),
          limit: limit.toString()
      };
      if (searchTerm) params.search = searchTerm;
      
      const res = await apiRequest(ENDPOINTS.NOTIFICATIONS, 'GET', undefined, params);
      
      if (res.data) {
          setData(Array.isArray(res.data) ? res.data : []);
          if (res.meta) {
              setTotalItems(res.meta.total);
          } else {
              setTotalItems(Array.isArray(res.data) ? res.data.length : 0);
          }
      } else {
          setData([]);
          setTotalItems(0);
      }
    } catch (e) {
      console.error("Failed to load notifications", e);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchTerm]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = (query: string) => {
      setSearchTerm(query);
      setPage(1);
  };

  const handlePageChange = (newPage: number) => setPage(newPage);
  const handleLimitChange = (newLimit: number) => { setLimit(newLimit); setPage(1); };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if(!title || !message) return showToast(t('required_fields'), 'error');
    if ((targetType === 'single' || targetType === 'selected') && selectedEmails.length === 0) {
        return showToast('Please select at least one email', 'error');
    }
    try {
        const payload = {
            title,
            message,
            target_type: targetType,
            emails: targetType === 'all' ? [] : selectedEmails
        };
        await apiRequest(ENDPOINTS.NOTIFICATIONS, 'POST', payload);
        showToast(t('success_sent'), 'success');
        setTitle(''); setMessage(''); setTargetType('all'); setSelectedEmails([]);
        setPage(1); loadData();
    } catch(e) {
        showToast(t('failed_sent'), 'error');
    }
  };

  useEffect(() => {
    if ((targetType === 'single' || targetType === 'selected') && userEmails.length === 0) {
        const fetchEmails = async () => {
            setIsLoadingEmails(true);
            try {
                const res = await apiRequest(ENDPOINTS.ALL_EMAILS);
                if (Array.isArray(res)) setUserEmails(res);
                else if (res.data && Array.isArray(res.data)) setUserEmails(res.data);
            } catch (e) { showToast('Failed to load email list', 'error'); } finally { setIsLoadingEmails(false); }
        };
        fetchEmails();
    }
    setSelectedEmails([]);
    setEmailSearch('');
  }, [targetType, userEmails.length, showToast]);

  const toggleEmailSelection = (email: string) => {
      if (targetType === 'single') setSelectedEmails([email]);
      else setSelectedEmails(prev => prev.includes(email) ? prev.filter(e => e !== email) : [...prev, email]);
  };

  const filteredEmails = userEmails.filter(u => u.email.toLowerCase().includes(emailSearch.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Send size={20} className="text-primary" /> {t('send_push')}</h3>
                <form onSubmit={handleSend} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('title')}</label>
                        <input type="text" className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-primary" value={title} onChange={e => setTitle(e.target.value)} placeholder={t('promo_alert')} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('message')}</label>
                        <textarea rows={3} className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-primary resize-none" value={message} onChange={e => setMessage(e.target.value)} placeholder={t('enter_body')} />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('target_audience')}</label>
                        <div className="grid grid-cols-3 gap-2">
                            <button type="button" onClick={() => setTargetType('all')} className={`p-2 rounded-lg text-sm font-medium border flex flex-col items-center gap-1 ${targetType === 'all' ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 text-gray-500'}`}><Users size={16} /> {t('all_users')}</button>
                             <button type="button" onClick={() => setTargetType('single')} className={`p-2 rounded-lg text-sm font-medium border flex flex-col items-center gap-1 ${targetType === 'single' ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 text-gray-500'}`}><User size={16} /> {t('single_user')}</button>
                             <button type="button" onClick={() => setTargetType('selected')} className={`p-2 rounded-lg text-sm font-medium border flex flex-col items-center gap-1 ${targetType === 'selected' ? 'bg-primary/10 border-primary text-primary' : 'border-gray-200 text-gray-500'}`}><Users size={16} /> {t('selected_users')}</button>
                        </div>
                    </div>
                    {(targetType === 'single' || targetType === 'selected') && (
                        <div className="border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden">
                             <div className="bg-gray-50 dark:bg-slate-900/50 p-2 border-b border-gray-200">
                                <div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} /><input type="text" value={emailSearch} onChange={e => setEmailSearch(e.target.value)} placeholder={t('search_emails')} className="w-full pl-8 pr-3 py-1.5 text-sm rounded-md border border-gray-300 dark:bg-slate-800 outline-none" /></div>
                             </div>
                             <div className="max-h-60 overflow-y-auto p-1">
                                {isLoadingEmails ? <div className="p-4 text-center text-sm">{t('loading')}</div> : filteredEmails.length === 0 ? <div className="p-4 text-center text-sm">{t('no_emails_found')}</div> : (
                                    <div className="space-y-0.5">{filteredEmails.map(u => {
                                            const isSelected = selectedEmails.includes(u.email);
                                            return (<label key={u.id} className={`flex items-center gap-3 p-2 rounded cursor-pointer ${isSelected ? 'bg-indigo-50 dark:bg-indigo-900/20' : 'hover:bg-gray-50'}`}>
                                                    <div className={`w-4 h-4 rounded border flex items-center justify-center ${isSelected ? 'bg-primary border-primary text-white' : 'border-gray-300'} ${targetType === 'single' ? 'rounded-full' : 'rounded'}`}>{isSelected && <Check size={10} />}</div>
                                                    <input type={targetType === 'single' ? 'radio' : 'checkbox'} checked={isSelected} onChange={() => toggleEmailSelection(u.email)} className="hidden" />
                                                    <span className="text-sm text-gray-700 dark:text-slate-300 break-all">{u.email}</span>
                                                </label>);
                                        })}</div>
                                )}
                             </div>
                        </div>
                    )}
                    <button type="submit" className="w-full py-2.5 bg-primary text-white rounded-lg font-medium shadow-sm hover:bg-indigo-700">{t('send_btn')}</button>
                </form>
            </div>
        </div>
        <div className="lg:col-span-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{t('history')}</h2>
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <DynamicTable data={data} columns={columns} isLoading={isLoading} onSearch={handleSearch} paginationMode="server" totalItems={totalItems} currentPage={page} itemsPerPage={limit} onPageChange={handlePageChange} onLimitChange={handleLimitChange} />
            </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;