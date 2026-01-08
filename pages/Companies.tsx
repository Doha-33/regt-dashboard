import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import DynamicTable from '../components/DynamicTable';
import { apiRequest, ENDPOINTS } from '../services/service';
import { Company, ColumnDef } from '../types';
import { COMPANY_COLUMNS } from '../config/columns';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Plus, Edit2, Trash2 } from 'lucide-react';

const Companies: React.FC = () => {
  const [data, setData] = useState<Company[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Pagination & Search State
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');

  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t } = useLanguage();

  // Load Data
  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const params: any = {
          page: page.toString(),
          limit: limit.toString(),
          per_page: limit.toString()
      };
      if (searchTerm) {
          params.search = searchTerm;
      }
      const res = await apiRequest(ENDPOINTS.COMPANIES, 'GET', undefined, params);
      
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
    } catch(e) {
      showToast(t('failed_load_companies'), 'error');
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, searchTerm, showToast, t]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSearch = (query: string) => {
    setSearchTerm(query);
    setPage(1);
  };

  const handleAdd = () => {
    navigate('/companies/new');
  };

  const handleEdit = (item: Company) => {
    navigate(`/companies/${item.id}`);
  };

  const handleDelete = async (item: Company) => {
     if(window.confirm(t('delete_company_confirm'))) {
        try {
            await apiRequest(`${ENDPOINTS.COMPANIES}/${item.id}`, 'DELETE');
            showToast('Deleted', 'success');
            loadData();
        } catch(e) {
            showToast('Failed', 'error');
        }
     }
  };

  const handlePageChange = (newPage: number) => setPage(newPage);
  const handleLimitChange = (newLimit: number) => { setLimit(newLimit); setPage(1); };

  const columns = useMemo(() => {
    const cols = COMPANY_COLUMNS.map(col => ({
        ...col,
        header: t(col.key as any) || col.header
    }));

    // Override name render to make it clickable
    const nameCol = cols.find(c => c.key === 'name');
    if (nameCol) {
        nameCol.render = (val, item) => (
            <span 
                onClick={() => handleEdit(item)} 
                className="font-medium text-gray-900 dark:text-white hover:text-primary cursor-pointer transition-colors"
            >
                {String(val)}
            </span>
        );
    }
    return cols;
  }, [t]);

  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('companies')}</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-1">{t('companies_desc')}</p>
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center gap-2 bg-primary hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          {t('add_company')}
        </button>
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <DynamicTable
            data={data}
            columns={columns}
            onEdit={handleEdit}
            onDelete={handleDelete}
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

export default Companies;