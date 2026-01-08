import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DynamicTable from '../components/DynamicTable';
import { apiRequest, ENDPOINTS } from '../services/service';
import { ColumnDef, UserAd, User, Company } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Eye } from 'lucide-react';

const Ads: React.FC = () => {
  const [data, setData] = useState<UserAd[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination & Search State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  // Mappings
  const [users, setUsers] = useState<User[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);

  const { showToast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  // Load Mapping Data
  useEffect(() => {
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
            console.error('Failed to load dependencies', e);
        }
    };
    loadDependencies();
  }, []);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
          page: page.toString(),
          limit: limit.toString(),
          per_page: limit.toString()
      };
      
      // Add search term to API request
      if (searchTerm) {
          params.search = searchTerm;
      }

      const res = await apiRequest(ENDPOINTS.USER_ADS, 'GET', undefined, params);
      
      if (res.data) {
          const adsData = Array.isArray(res.data) ? res.data : (res.data.data || []);
          setData(adsData);
          if (res.meta) {
              setTotalItems(res.meta.total);
          } else {
              setTotalItems(adsData.length);
          }
      } else {
          setData([]);
          setTotalItems(0);
      }
    } catch (e) {
      showToast(t('failed_load_ads'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchTerm, showToast, t]);

  useEffect(() => { loadData(); }, [loadData]);

  const handlePageChange = (newPage: number) => setPage(newPage);
  const handleLimitChange = (newLimit: number) => { setLimit(newLimit); setPage(1); };
  
  const handleSearch = (query: string) => {
      setSearchTerm(query);
      setPage(1); // Reset to first page on search
  };

  const handleView = (item: UserAd) => {
      navigate(`/ads/${item.id}`, { state: { adData: item } });
  };

  const columns: ColumnDef<UserAd>[] = useMemo(() => [
    { key: 'id', header: 'ID', type: 'text' },
    { 
        key: 'user_id', 
        header: t('name'), 
        type: 'text',
        render: (val, item) => {
            if (item.username) return item.username;
            // eslint-disable-next-line eqeqeq
            const user = users.find(u => u.id == val);
            return user ? (
               <div className="flex flex-col">
                  <span className="font-medium text-gray-900 dark:text-white">{user.name}</span>
                  <span className="text-[10px] text-gray-400">{user.email}</span>
               </div>
            ) : <span className="text-gray-400 font-mono text-xs">ID: {val}</span>;
        }
    },
    { 
        key: 'company_id', 
        header: t('company_name'), 
        type: 'text',
        render: (val, item) => {
            if (item.company_name) return item.company_name;
            // eslint-disable-next-line eqeqeq
            const company = companies.find(c => c.id == val);
            return company ? <span className="font-medium text-gray-700 dark:text-slate-300">{company.name}</span> : <span className="text-gray-400">ID: {val}</span>;
        }
    },
    { key: 'type', header: t('company_type'), type: 'badge' },
    { key: 'amount', header: t('amount'), type: 'currency' },
    { key: 'status', header: t('status'), type: 'badge' },
    { key: 'created_at', header: t('registered'), type: 'date' },
    {
        key: 'id',
        header: t('actions'),
        render: (_, item) => (
            <div className="flex justify-end gap-2">
                <button
                    onClick={() => handleView(item)}
                    className="p-1.5 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition-colors"
                    title={t('view_details')}
                >
                    <Eye size={18} />
                </button>
            </div>
        )
    }
  ], [t, users, companies]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('ads')}</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-1">{t('ads_desc')}</p>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <DynamicTable
          data={data}
          columns={columns}
          isLoading={isLoading}
          onSearch={handleSearch}
          paginationMode="server"
          totalItems={totalItems}
          currentPage={page}
          itemsPerPage={limit}
          onPageChange={handlePageChange}
          onLimitChange={handleLimitChange}
        />
      </div>
    </div>
  );
};

export default Ads;