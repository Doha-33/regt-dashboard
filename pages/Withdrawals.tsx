

import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest, ENDPOINTS } from '../services/service';
import { Withdrawal, ColumnDef } from '../types';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Eye, Edit2, ArrowRight } from 'lucide-react';
import DynamicTable from '../components/DynamicTable';

const Withdrawals = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter & Search State
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'reject'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Pagination State (Server Side)
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);

  const { showToast } = useToast();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const params: any = {
          page: page.toString(),
          limit: limit.toString()
      };
      if (searchQuery) params.search = searchQuery;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await apiRequest(ENDPOINTS.WITHDRAWALS, 'GET', undefined, params);
      
      if (res.data) {
        if (Array.isArray(res.data)) {
            setWithdrawals(res.data);
            if (res.meta) {
                setTotalItems(res.meta.total);
            } else {
                setTotalItems(res.data.length);
            }
        } else {
            setWithdrawals([]);
            setTotalItems(0);
        }
      }
    } catch (e) {
      console.error(e);
      showToast('Failed to load withdrawals', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
      const timer = setTimeout(() => {
        fetchData();
      }, 500);
      return () => clearTimeout(timer);
  }, [page, limit, statusFilter, searchQuery]);

  // Actions
  const handleViewDetails = (item: Withdrawal) => {
    navigate(`/withdrawals/${item.id}`);
  };

  const handlePageChange = (newPage: number) => setPage(newPage);
  const handleLimitChange = (newLimit: number) => { setLimit(newLimit); setPage(1); };
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setPage(1);
  };

  const columns: ColumnDef<Withdrawal>[] = useMemo(() => [
    { key: 'transaction_id', header: t('transaction_id'), type: 'text' },
    { 
        key: 'username', 
        header: t('name'), 
        type: 'text',
        render: (val, item) => (
            <div className="flex flex-col cursor-pointer" onClick={() => handleViewDetails(item)}>
                <span className="font-medium text-gray-900 dark:text-white hover:text-primary transition-colors">{String(val)}</span>
            </div>
        )
    },
    { key: 'amount', header: t('amount'), type: 'currency' },
    { key: 'method', header: t('method'), type: 'badge' },
    { key: 'status', header: t('status'), type: 'badge' },
    { key: 'created_at', header: t('requested'), type: 'date' },
    {
        key: 'id',
        header: t('actions'),
        render: (_, row) => (
            <div className="flex justify-end gap-2 items-center">
                <button
                    onClick={() => handleViewDetails(row)}
                    className="flex items-center gap-1 text-sm text-primary hover:text-indigo-700 font-medium px-3 py-1.5 rounded-lg hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-colors"
                >
                    {t('view_details')} <ArrowRight size={14} />
                </button>
            </div>
        )
    }
  ], [t]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('withdrawals')}</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-1">{t('dashboard')} / {t('withdrawals')}</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-end sm:items-center gap-4 border-b border-gray-200 dark:border-slate-700 pb-2">
        <div className="flex gap-2 overflow-x-auto">
          {['all', 'pending', 'confirmed', 'reject'].map((f) => (
            <button
              key={f}
              onClick={() => { setStatusFilter(f as any); setPage(1); }}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors border-b-2 whitespace-nowrap capitalize ${statusFilter === f
                ? 'border-primary text-primary bg-indigo-50/50 dark:bg-indigo-900/10'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
            >
              {t(f === 'all' ? 'all' : f === 'pending' ? 'w_review' : f === 'confirmed' ? 'w_completed' : 'w_reject')}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <DynamicTable
            data={withdrawals}
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

export default Withdrawals;