
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import DynamicTable from '../components/DynamicTable';
import { apiRequest, ENDPOINTS } from '../services/service';
import { User, ColumnDef } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, SortAsc, SortDesc, Ban, CheckCircle, Circle, Edit2, Network, X, Shield, ArrowUpLeft, ChevronRight, ArrowLeft } from 'lucide-react';

type FilterType = 'all' | 'active' | 'inactive' | 'frozen';
type SortOrder = 'newest' | 'oldest';

const Users: React.FC = () => {
  const [data, setData] = useState<User[]>([]);
  const [currentFilter, setCurrentFilter] = useState<FilterType>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  // Server Side Pagination State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Affiliate Modal State
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
  const [selectedNetworkUser, setSelectedNetworkUser] = useState<User | null>(null);
  const [networkData, setNetworkData] = useState<User[]>([]);
  const [isLoadingNetwork, setIsLoadingNetwork] = useState(false);
  // Navigation stack for modal drill-down
  const [networkHistory, setNetworkHistory] = useState<User[]>([]);

  // Search
  const [searchTermState, setSearchTermState] = useState('');

  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t, isRTL } = useLanguage();

  // Updated Tier Calculation Helper based on referrals_count:
  // 0 - 10: Bronze, 11 - 20: Silver, 21 - 30: Gold, 31+: Diamond
  const calculateTier = (count: number = 0) => {
      if (count >= 31) return 'Diamond';
      if (count >= 21) return 'Gold';
      if (count >= 11) return 'Silver';
      return 'Bronze';
  };

  const loadData = useCallback(async (searchTerm?: string) => {
    setIsLoading(true);
    try {
      const params: any = { 
          page: page.toString(), 
          limit: limit.toString() 
      };
      if (searchTerm) params.search = searchTerm;
      
      const res = await apiRequest(ENDPOINTS.USERS, 'GET', undefined, params);

      if (res && res.data) {
        if (Array.isArray(res.data)) {
            setData(res.data);
            if (res.meta) {
                setTotalItems(res.meta.total);
            } else {
                setTotalItems(res.data.length);
            }
        } else {
             setData(Array.isArray(res) ? res : []);
             setTotalItems(Array.isArray(res) ? res.length : 0);
        }
      } else {
        setData([]);
        setTotalItems(0);
      }
    } catch (e) {
      console.error(e);
      showToast(t('failed_load_users'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [showToast, page, limit, t]);

  useEffect(() => { loadData(searchTermState); }, [loadData, searchTermState]);

  const fetchNetwork = async (user: User) => {
      setIsLoadingNetwork(true);
      setNetworkData([]);
      try {
          const res = await apiRequest(ENDPOINTS.MY_AFFILIATE, 'GET', undefined, { affiliate_code: user.affiliate_code });
          if (res.data) {
              setNetworkData(res.data);
          } else if (Array.isArray(res)) {
              setNetworkData(res);
          }
      } catch (e) {
          showToast('Failed to load network', 'error');
      } finally {
          setIsLoadingNetwork(false);
      }
  };

  const openNetworkModal = async (user: User) => {
      setNetworkHistory([]); 
      setSelectedNetworkUser(user);
      setIsNetworkModalOpen(true);
      fetchNetwork(user);
  };

  const handleModalDrillDown = (user: User) => {
      if (selectedNetworkUser) {
          setNetworkHistory(prev => [...prev, selectedNetworkUser]);
      }
      setSelectedNetworkUser(user);
      fetchNetwork(user);
  };

  const handleModalBack = () => {
      if (networkHistory.length > 0) {
          const previousUser = networkHistory[networkHistory.length - 1];
          setSelectedNetworkUser(previousUser);
          setNetworkHistory(prev => prev.slice(0, -1));
          fetchNetwork(previousUser);
      }
  };

  const closeNetworkModal = () => {
      setIsNetworkModalOpen(false);
      setSelectedNetworkUser(null);
      setNetworkData([]);
      setNetworkHistory([]);
  };

  const isUserActive = (user: User): boolean => {
      if (!user.last_login_at) return false;
      const lastLogin = new Date(user.last_login_at);
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return lastLogin > thirtyDaysAgo;
  };

  const filteredData = useMemo(() => {
    let result = [...data];
    if (currentFilter === 'active') {
      result = result.filter(u => isUserActive(u));
    } else if (currentFilter === 'inactive') {
      result = result.filter(u => !isUserActive(u));
    } else if (currentFilter === 'frozen') {
      result = result.filter(u => u.is_verified === 0);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
    });
    return result;
  }, [data, currentFilter, sortOrder]);

  const handleSearch = useCallback((query: string) => {
    setPage(1);
    setSearchTermState(query);
  }, []);

  const handleClearSearch = () => {
      setSearchTermState('');
      setPage(1);
  };

  const handlePageChange = (newPage: number) => setPage(newPage);
  const handleLimitChange = (newLimit: number) => { setLimit(newLimit); setPage(1); };

  const handleEdit = (item: User) => {
    navigate(`/users/${item.id}`);
  };

  const handleAdd = () => {
    navigate('/users/new');
  };

  const handleFilterByParent = (code: string) => {
      setSearchTermState(code);
      setPage(1);
      showToast(`Filtering by code: ${code}`, 'success');
  };

  const toggleFreeze = async (user: User) => {
    const isFrozen = user.is_verified === 0;
    const msg = isFrozen ? t('unfreeze') : t('freeze');
    
    if (window.confirm(`${t('freeze_confirm')} ${user.name}?`)) {
         try {
            await apiRequest(`${ENDPOINTS.USERS}/${user.id}`, 'PATCH', { 
                is_verified: isFrozen ? 1 : 0
            });
            showToast(`${msg} ${t('success_sent')}`, 'success');
            loadData(searchTermState);
         } catch(e) {
            showToast(t('op_failed'), 'error');
         }
    }
  };

  const columns: ColumnDef<User>[] = useMemo(() => [
    { key: 'id', header: 'ID', type: 'text' },
    {
      key: 'name',
      header: t('name'),
      type: 'text',
      render: (val, item) => (
          <div className="flex flex-col cursor-pointer" onClick={() => handleEdit(item)}>
            <span className="font-medium text-gray-900 dark:text-white hover:text-primary transition-colors">
              {String(val)}
            </span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Circle size={8} className={`fill-current ${isUserActive(item) ? 'text-emerald-500' : 'text-gray-300'}`} />
              <span className="text-[10px] text-gray-500 capitalize">
                {isUserActive(item) ? t('status_active') : t('status_inactive')}
              </span>
            </div>
          </div>
      )
    },
    { 
        key: 'tier', 
        header: t('tier'), 
        type: 'badge',
        render: (_, item) => {
            // Priority: referrals_count, then fallback to team_size
            const count = item.referrals_count ?? item.team_size ?? 0;
            const calculatedTier = calculateTier(count);

            let color = 'bg-gray-100 text-gray-600 border-gray-200';
            const tierVal = String(calculatedTier);
            
            if (tierVal === 'Diamond') color = 'bg-cyan-50 text-cyan-700 border-cyan-200';
            if (tierVal === 'Gold') color = 'bg-amber-50 text-amber-700 border-amber-200';
            if (tierVal === 'Silver') color = 'bg-slate-100 text-slate-600 border-slate-300';
            if (tierVal === 'Bronze') color = 'bg-orange-50 text-orange-800 border-orange-200';
            
            return (
                <span className={`px-2 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 w-fit ${color}`}>
                    <Shield size={12} className="fill-current opacity-50" />
                    {t(tierVal as any)}
                </span>
            );
        }
    },
    { 
        key: 'affiliate_code', 
        header: t('affiliate_code'), 
        type: 'text',
        render: (val, item) => (
            <button 
                onClick={(e) => { e.stopPropagation(); openNetworkModal(item); }}
                className="flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-2 py-1.5 rounded-md font-mono text-xs hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors group border border-blue-100 dark:border-blue-900/30"
                title={t('view_network')}
            >
                <Network size={12} className="text-blue-500" />
                <span className="font-semibold">{String(val || '-')}</span>
            </button>
        )
    },
    { 
        key: 'referred_by', 
        header: t('coming_affiliate'), 
        type: 'text',
        render: (val, item) => val ? (
            <button 
                onClick={(e) => { e.stopPropagation(); handleFilterByParent(String(val)); }}
                className="flex items-center gap-1 bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 px-2 py-1.5 rounded-md font-mono text-xs hover:bg-gray-100 dark:hover:bg-slate-700 transition-colors group border border-gray-200 dark:border-slate-700"
                title="Filter by this parent code"
            >
                <ArrowUpLeft size={12} className="text-gray-400" />
                <span>{String(val)}</span>
            </button>
        ) : <span className="text-gray-300 dark:text-slate-600">-</span>
    },
    { key: 'email', header: t('email'), type: 'text' },
    { 
        key: 'balance', 
        header: t('balance'),
        render: (val) => <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{Number(val || 0).toFixed(5)} RGT</span>
    },
    { key: 'created_at', header: t('registered'), type: 'date' },
    {
      key: 'actions_col', 
      header: t('actions'),
      type: 'text',
      render: (_, item) => (
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => openNetworkModal(item)}
              className="text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 p-1.5 rounded-lg transition-colors"
              title={t('view_network')}
            >
              <Network size={16} />
            </button>
            <button
              onClick={() => handleEdit(item)}
              className="text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 p-1.5 rounded-lg transition-colors"
              title={t('edit_user')}
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => toggleFreeze(item)}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-semibold transition-colors border ${item.is_verified === 0 
                  ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400' 
                  : 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400'}`}
              title={item.is_verified === 0 ? t('unfreeze') : t('freeze')}
            >
               {item.is_verified === 0 ? <CheckCircle size={14} /> : <Ban size={14} />}
               <span className="hidden sm:inline">{item.is_verified === 0 ? t('unfreeze') : t('freeze')}</span>
            </button>
          </div>
      )
    }
  ], [data, t, searchTermState]);

  const networkColumns: ColumnDef<User>[] = useMemo(() => [
      { key: 'id', header: 'ID', type: 'text' },
      { key: 'name', header: t('name'), type: 'text' },
      { 
          key: 'affiliate_code', 
          header: t('affiliate_code'), 
          type: 'text',
          render: (val, item) => (
              <button 
                  onClick={(e) => { e.stopPropagation(); handleModalDrillDown(item); }}
                  className="flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 font-mono text-xs font-medium hover:underline"
                  title="View Network"
              >
                  {val} <ChevronRight size={10} />
              </button>
          )
      },
      { 
          key: 'tier', 
          header: t('tier'), 
          type: 'badge',
          render: (_, item) => {
              const count = item.referrals_count ?? item.team_size ?? 0;
              const calculatedTier = calculateTier(count);
              return (
                <span className="bg-gray-100 text-gray-600 border-gray-200 dark:bg-slate-700 dark:text-slate-300 dark:border-slate-600 px-2 py-1 rounded-lg text-xs font-bold border flex items-center gap-1 w-fit">
                    <Shield size={12} className="fill-current opacity-50" />
                    {t(calculatedTier as any)}
                </span>
              )
          } 
      },
      { key: 'created_at', header: t('registered'), type: 'date' },
      { 
          key: 'balance', 
          header: t('balance'),
          render: (val) => <span className="text-xs font-mono">{Number(val || 0).toFixed(5)}</span>
      }
  ], [t]);

  return (
    <div className="space-y-6 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-3">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('user_management')}</h2>
              {searchTermState && (
                  <button 
                    onClick={handleClearSearch}
                    className="flex items-center gap-1 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 px-3 py-1 rounded-lg text-sm font-medium transition-colors"
                    title={t('view_all')}
                  >
                      <ArrowLeft size={14} className={isRTL ? 'rotate-180' : ''} />
                      {t('view_all')}
                  </button>
              )}
          </div>
          <p className="text-gray-500 dark:text-slate-400 mt-1">{t('dashboard')} / {t('users')}</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-primary hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          {t('add_new_user')}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 border-b border-gray-200 dark:border-slate-700 pb-2">
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'active', 'inactive', 'frozen'].map((f) => (
            <button
              key={f}
              onClick={() => setCurrentFilter(f as FilterType)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap capitalize ${currentFilter === f
                ? 'border-primary text-primary bg-indigo-50/50 dark:bg-indigo-900/10'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
              {t(f === 'active' ? 'status_active' : f === 'inactive' ? 'status_inactive' : f === 'frozen' ? 'frozen_users' : 'all')}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500 dark:text-slate-400">{t('sort_by')}:</span>
          <div className="relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as SortOrder)}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-sm text-gray-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
            >
              <option value="newest">{t('sort_newest')}</option>
              <option value="oldest">{t('sort_oldest')}</option>
            </select>
            <div className={`absolute top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 ${document.dir === 'rtl' ? 'left-2' : 'right-2'}`}>
               {sortOrder === 'newest' ? <SortDesc size={14} /> : <SortAsc size={14} />}
            </div>
          </div>
        </div>
      </div>

      <DynamicTable
        data={filteredData}
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

      {isNetworkModalOpen && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
              <div className="bg-white dark:bg-slate-800 w-full max-w-4xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-6 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50 rounded-t-2xl">
                      <div>
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              {networkHistory.length > 0 && (
                                  <button onClick={handleModalBack} className="mr-2 p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors">
                                      <ArrowUpLeft size={20} className="text-gray-600 dark:text-gray-300" />
                                  </button>
                              )}
                              <Network className="text-primary" /> 
                              {t('affiliate_network')}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">
                              Network for: <span className="font-semibold text-gray-900 dark:text-white">{selectedNetworkUser?.name}</span>
                              <span className="mx-2 text-gray-300">|</span>
                              Code: <span className="font-mono bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 px-1.5 py-0.5 rounded">{selectedNetworkUser?.affiliate_code}</span>
                          </p>
                      </div>
                      <button onClick={closeNetworkModal} className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 transition-colors p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-full">
                          <X size={24} />
                      </button>
                  </div>
                  
                  <div className="flex-1 overflow-auto p-0">
                      <DynamicTable 
                          data={networkData}
                          columns={networkColumns}
                          isLoading={isLoadingNetwork}
                          paginationMode="client"
                          itemsPerPage={10}
                      />
                  </div>
                  
                  <div className="p-4 border-t border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 rounded-b-2xl flex justify-end">
                      <button onClick={closeNetworkModal} className="px-6 py-2 bg-white dark:bg-slate-700 border border-gray-300 dark:border-slate-600 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-slate-600 transition-colors">
                          {t('close')}
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Users;
