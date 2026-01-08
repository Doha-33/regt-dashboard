
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { apiRequest, ENDPOINTS } from '../services/service';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { User, Company, UserAd } from '../types';
import { ArrowLeft, Megaphone, User as UserIcon, Building } from 'lucide-react';

const AdDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { showToast } = useToast();
    const { t, isRTL } = useLanguage();

    const [formData, setFormData] = useState<Partial<UserAd>>({
        user_id: '',
        company_id: '',
        type: 'ads',
        amount: 0,
        status: 'pending'
    });
    
    // Dependencies
    const [users, setUsers] = useState<User[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        loadDependencies();
        if (id && id !== 'new') {
            // Check if data was passed via navigation state to avoid API call
            const stateAd = location.state?.adData;
            if (stateAd) {
                setFormData(stateAd);
            } else {
                fetchAd(id);
            }
        }
    }, [id]);

    const loadDependencies = async () => {
        try {
            const params = { limit: '10000', per_page: '10000' };
            const [usersRes, companiesRes] = await Promise.all([
                apiRequest(ENDPOINTS.USERS, 'GET', undefined, params),
                apiRequest(ENDPOINTS.COMPANIES, 'GET', undefined, params)
            ]);
            
            let usersData: User[] = [];
            if (Array.isArray(usersRes)) usersData = usersRes;
            else if (usersRes.data && Array.isArray(usersRes.data)) usersData = usersRes.data;
            else if (usersRes.data?.data) usersData = usersRes.data.data;

            let companiesData: Company[] = [];
            if (Array.isArray(companiesRes)) companiesData = companiesRes;
            else if (companiesRes.data && Array.isArray(companiesRes.data)) companiesData = companiesRes.data;
            else if (companiesRes.data?.data) companiesData = companiesRes.data.data;

            setUsers(usersData);
            setCompanies(companiesData);
        } catch (e) {
            console.error('Failed to load form dependencies', e);
        }
    };

    const fetchAd = async (adId: string) => {
        setIsLoading(true);
        try {
            const res = await apiRequest(`${ENDPOINTS.USER_ADS}/${adId}`, 'GET');
            if (res.data) {
                setFormData(res.data);
            }
        } catch (e) {
            console.error(e);
            showToast(t('failed_load_ads'), 'error');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) return <div className="p-8 text-center">{t('loading')}</div>;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
             {/* Header */}
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/ads')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                        <ArrowLeft size={20} className={isRTL ? 'rotate-180' : ''} />
                    </button>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                            {`${t('AdInformation')} #${id}`}
                        </h1>
                        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">{t('ads_desc')}</p>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
                <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex items-center gap-2">
                    <Megaphone size={18} className="text-primary" />
                    <h3 className="font-semibold text-gray-900 dark:text-white">{t("AdInformation")}</h3>
                </div>
                
                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('name')} ({t("User")})</label>
                            <div className="relative">
                            <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                name="user_id"
                                value={formData.user_id}
                                disabled
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none appearance-none"
                            >
                                <option value="">{t("SelectUser")}</option>
                                {users.map(u => (
                                    <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                ))}
                            </select>
                            </div>
                    </div>

                    <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('company_name')}</label>
                            <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                name="company_id"
                                value={formData.company_id}
                                disabled
                                className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none appearance-none"
                            >
                                <option value="">{t("SelectCompany")}</option>
                                {companies.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                            </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('company_type')}</label>
                        <select
                            name="type"
                            value={formData.type}
                            disabled
                            className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none appearance-none"
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
                            value={formData.status}
                            disabled
                            className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none appearance-none"
                        >
                            <option value="pending">{t("Pending")}</option>
                            <option value="active">{t("Active")}</option>
                            <option value="inactive">{t("Inactive")}</option>
                            <option value="completed">{t("Completed")}</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('amount')}</label>
                        <input
                            type="number"
                            name="amount"
                            value={formData.amount}
                            readOnly
                            className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-100 dark:bg-slate-900 text-gray-500 dark:text-gray-400 cursor-not-allowed outline-none"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdDetail;
