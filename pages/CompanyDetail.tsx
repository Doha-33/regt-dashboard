
import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest, ENDPOINTS } from '../services/service';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Company, UserAd, ColumnDef } from '../types';
import { ArrowLeft, Save, Trash2, Megaphone, Building2, Plus, X } from 'lucide-react';
import DynamicTable from '../components/DynamicTable';

const CompanyDetail: React.FC = () => {
    const { id } = useParams();
    const isNew = !id || id === 'new';
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { t, isRTL } = useLanguage();

    const [company, setCompany] = useState<Partial<Company>>({
        name: '',
        type: 'ads',
        amount: 0,
        url: '',
        status: 'active',
        description: ''
    });

    // Dynamic URLs state
    const [urls, setUrls] = useState<string[]>(['']);
    const [isLoading, setIsLoading] = useState(false);
    
    // Ads Table State
    const [ads, setAds] = useState<UserAd[]>([]);
    const [loadingAds, setLoadingAds] = useState(false);

    useEffect(() => {
        if (!isNew && id) {
            fetchCompany(id);
        }
    }, [id, isNew]);

    const fetchCompany = async (companyId: string) => {
        setIsLoading(true);
        try {
            const res = await apiRequest(`${ENDPOINTS.COMPANIES}/${companyId}`, 'GET');
            if (res.data) {
                const fetchedCompany = res.data;
                setCompany(fetchedCompany);
                
                // Handle parsing URLs from JSON string or single string
                try {
                    const parsedUrls = JSON.parse(fetchedCompany.url);
                    if (Array.isArray(parsedUrls)) {
                        setUrls(parsedUrls.length > 0 ? parsedUrls : ['']);
                    } else {
                        setUrls([fetchedCompany.url || '']);
                    }
                } catch (e) {
                    // Not valid JSON, treat as normal string
                    setUrls([fetchedCompany.url || '']);
                }
                
                fetchCompanyAds(fetchedCompany.id);
            }
        } catch (e) {
            showToast('Failed to load company details', 'error');
            navigate('/companies');
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCompanyAds = async (companyId: number | string) => {
        setLoadingAds(true);
        try {
            const res = await apiRequest(ENDPOINTS.USER_ADS, 'GET', undefined, { company_id: companyId.toString() });
            const allAds = res.data || (Array.isArray(res) ? res : []);
            setAds(allAds);
        } catch (e) {
            console.error("Failed to load ads", e);
        } finally {
            setLoadingAds(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setCompany(prev => ({ ...prev, [name]: value }));
    };

    const handleUrlChange = (index: number, value: string) => {
        const newUrls = [...urls];
        newUrls[index] = value;
        setUrls(newUrls);
    };

    const addUrlField = () => {
        setUrls([...urls, '']);
    };

    const removeUrlField = (index: number) => {
        if (urls.length === 1) {
            setUrls(['']);
            return;
        }
        const newUrls = urls.filter((_, i) => i !== index);
        setUrls(newUrls);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Filter out empty URLs and prepare payload
            const filteredUrls = urls.filter(u => u.trim() !== '');
            const urlJson = JSON.stringify(filteredUrls);
            
            const payload = {
                ...company,
                url: urlJson
            };

            if (isNew) {
                await apiRequest(ENDPOINTS.COMPANIES, 'POST', payload);
                showToast(t('company_created'), 'success');
                navigate('/companies');
            } else {
                await apiRequest(`${ENDPOINTS.COMPANIES}/${id}`, 'PATCH', payload);
                showToast(t('company_updated'), 'success');
            }
        } catch (e) {
            showToast(t('op_failed'), 'error');
        }
    };

    const handleDelete = async () => {
        if (window.confirm(t('delete_company_confirm'))) {
            try {
                await apiRequest(`${ENDPOINTS.COMPANIES}/${id}`, 'DELETE');
                showToast(t('op_failed'), 'success');
                navigate('/companies');
            } catch (e) {
                showToast(t('op_failed'), 'error');
            }
        }
    };

    const adColumns: ColumnDef<UserAd>[] = useMemo(() => [
        { key: 'id', header: 'ID', type: 'text' },
        { key: 'amount', header: t('amount'), type: 'currency' },
        { key: 'status', header: t('status'), type: 'badge' },
        { key: 'created_at', header: t('registered'), type: 'date' },
    ], [t]);

    if (isLoading) return <div className="p-8 text-center">{t('loading')}</div>;

    const companyType = company.type?.toLowerCase();

    return (
        <div className="space-y-8 max-w-6xl mx-auto pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/companies')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                        <ArrowLeft size={20} className={isRTL ? 'rotate-180' : ''} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {isNew ? t('add_company') : `${t('edit_company')}: ${company.name}`}
                        </h1>
                        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{t('companies_desc')}</p>
                    </div>
                </div>
                {!isNew && (
                    <button 
                        onClick={handleDelete}
                        className="flex items-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/30 px-4 py-2 rounded-lg transition-colors"
                    >
                        <Trash2 size={18} /> {t('delete_user')}
                    </button>
                )}
            </div>

            {/* Form Section */}
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex items-center gap-2">
                    <Building2 size={18} className="text-primary" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t('company_name')}</h3>
                </div>
                <div className="p-6">
                    <form onSubmit={handleSubmit}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('company_name')}</label>
                                <input 
                                    name="name"
                                    value={company.name || ''}
                                    onChange={handleChange}
                                    required
                                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('company_type')}</label>
                                <select
                                    name="type"
                                    value={company.type || 'ads'}
                                    onChange={handleChange}
                                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                >
                                    <option value="ads">{t("ads")}</option>
                                    <option value="tasks">{t("tasks")}</option>
                                    <option value="survey">{t("survey")}</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('status')}</label>
                                <select
                                    name="status"
                                    value={company.status || 'active'}
                                    onChange={handleChange}
                                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                >
                                    <option value="active">{t("Active")}</option>
                                    <option value="inactive">{t("Inactive")}</option>
                                </select>
                            </div>

                            {/* Conditional Rendering based on Type */}
                            {companyType === 'ads' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t("Amount")}</label>
                                        <input 
                                            name="amount"
                                            type="number"
                                            value={company.amount || 0}
                                            onChange={handleChange}
                                            className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                    <div className="md:col-span-2 space-y-3">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300">{t('url')}</label>
                                        <div className="space-y-3">
                                            {urls.map((u, index) => (
                                                <div key={index} className="flex gap-2 animate-in slide-in-from-left-2 duration-200">
                                                    <div className="relative flex-1">
                                                        <input 
                                                            type="text"
                                                            value={u}
                                                            onChange={(e) => handleUrlChange(index, e.target.value)}
                                                            placeholder="https://example.com"
                                                            className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                                        />
                                                    </div>
                                                    <button 
                                                        type="button"
                                                        onClick={() => removeUrlField(index)}
                                                        className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors border border-gray-200 dark:border-slate-700"
                                                    >
                                                        <X size={18} />
                                                    </button>
                                                    {index === urls.length - 1 && (
                                                        <button 
                                                            type="button"
                                                            onClick={addUrlField}
                                                            className="p-2.5 bg-primary text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                                                        >
                                                            <Plus size={18} />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </>
                            )}

                            {companyType === 'tasks' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Reward Amount</label>
                                        <input 
                                            name="amount"
                                            type="number"
                                            value={company.amount || 0}
                                            onChange={handleChange}
                                            className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('description_label')}</label>
                                        <textarea
                                            name="description"
                                            rows={3}
                                            value={company.description || ''}
                                            onChange={handleChange}
                                            className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none resize-none transition-all"
                                        />
                                    </div>
                                </>
                            )}

                             {companyType === 'survey' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t("AvgReward")}</label>
                                        <input 
                                            name="amount"
                                            type="number"
                                            value={company.amount || 0}
                                            onChange={handleChange}
                                            className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t("Provider")}</label>
                                        <input 
                                            name="api_key"
                                            value={(company as any).api_key || ''} 
                                            onChange={handleChange}
                                            className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all"
                                        />
                                    </div>
                                </>
                            )}

                        </div>

                        <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-700">
                            <button 
                                type="submit"
                                className="bg-primary hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2"
                            >
                                <Save size={18} /> {t('save_changes')}
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* Operations/Ads Section */}
            {!isNew && (
                <div className="space-y-4">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Megaphone className="text-primary" /> {t('ads')}
                    </h2>
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                        <DynamicTable 
                            data={ads} 
                            columns={adColumns} 
                            isLoading={loadingAds} 
                            paginationMode="client" 
                            itemsPerPage={5}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default CompanyDetail;
