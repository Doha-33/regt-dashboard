import React, { useState, useEffect, useRef } from "react";
import { ColumnDef } from "../types";
import {
  ArrowUpDown,
  Edit2,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";
import { useLanguage } from "../contexts/LanguageContext";

interface DynamicTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  onEdit?: (item: T) => void;
  onDelete?: (item: T) => void;
  isLoading?: boolean;
  onSearch?: (query: string) => void;
  // Server-side pagination props
  paginationMode?: "client" | "server";
  totalItems?: number;
  currentPage?: number;
  itemsPerPage?: number;
  onPageChange?: (page: number) => void;
  onLimitChange?: (limit: number) => void;
}

const DynamicTable = <T extends { id: string | number }>({
  data,
  columns,
  onEdit,
  onDelete,
  isLoading,
  onSearch,
  paginationMode = "client",
  totalItems = 0,
  currentPage: serverPage = 1,
  itemsPerPage: serverLimit = 10,
  onPageChange,
  onLimitChange,
}: DynamicTableProps<T>) => {
  const [filter, setFilter] = useState("");
  const [sortKey, setSortKey] = useState<keyof T | string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Client-side Pagination State (only used if paginationMode === 'client')
  const [clientPage, setClientPage] = useState(1);
  const [clientLimit, setClientLimit] = useState(10);

  const { t, isRTL, language } = useLanguage();

  // Determine effective values based on mode
  const currentPage = paginationMode === "server" ? serverPage : clientPage;
  const itemsPerPage = paginationMode === "server" ? serverLimit : clientLimit;

  // Use ref to track onSearch to avoid effect re-triggering when onSearch reference changes (e.g. during render)
  const onSearchRef = useRef(onSearch);
  const isFirstRender = useRef(true);

  useEffect(() => {
    onSearchRef.current = onSearch;
  }, [onSearch]);

  // Debounce for server-side search
  useEffect(() => {
    // Skip the first render to avoid double-fetching if the parent already fetches on mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    if (onSearchRef.current) {
      const timer = setTimeout(() => {
        onSearchRef.current?.(filter);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [filter]);

  // Reset page when filter changes (Client side logic)
  useEffect(() => {
    if (paginationMode === "client") {
      setClientPage(1);
    }
  }, [filter, paginationMode]);

  // Filtering
  // If paginationMode is server, we assume data passed is already filtered/paginated by parent
  const processedData =
    paginationMode === "server"
      ? data
      : data.filter((item) =>
          Object.values(item as any).some((val) =>
            String(val).toLowerCase().includes(filter.toLowerCase())
          )
        );

  // Sorting
  // In server mode, we currently only sort the current page data client-side for UI feedback
  const sortedData = [...processedData].sort((a, b) => {
    if (!sortKey) return 0;
    const aVal = (a as any)[sortKey];
    const bVal = (b as any)[sortKey];

    if (aVal < bVal) return sortDir === "asc" ? -1 : 1;
    if (aVal > bVal) return sortDir === "asc" ? 1 : -1;
    return 0;
  });

  // Pagination Logic
  const totalResults =
    paginationMode === "server" ? totalItems : sortedData.length;
  const totalPages = Math.ceil(totalResults / itemsPerPage);

  // For client mode, slice the data. For server mode, use as is (API returns page chunk).
  const displayData =
    paginationMode === "server"
      ? sortedData
      : sortedData.slice(
          (currentPage - 1) * itemsPerPage,
          (currentPage - 1) * itemsPerPage + itemsPerPage
        );

  const handleSort = (key: keyof T | string) => {
    if (sortKey === key) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    if (paginationMode === "server" && onPageChange) {
      onPageChange(newPage);
    } else {
      setClientPage(newPage);
    }
  };

  const handleLimitChange = (newLimit: number) => {
    if (paginationMode === "server" && onLimitChange) {
      onLimitChange(newLimit);
    } else {
      setClientLimit(newLimit);
      setClientPage(1);
    }
  };

  const renderCell = (item: T, column: ColumnDef<T>) => {
    const value = (item as any)[column.key];
    if (column.render) {
      return column.render(value, item);
    }

    if (column.type === "currency") {
      return (
        <span className="font-mono font-medium text-slate-700 dark:text-slate-200">
          {Number(value).toFixed(5)} RGT
        </span>
      );
    }

    if (column.type === "date") {
      try {
        const date = new Date(String(value));
        const formatted = new Intl.DateTimeFormat(language, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        }).format(date);
        return (
          <span className="text-slate-500 dark:text-slate-400 text-xs font-mono">
            {formatted}
          </span>
        );
      } catch (e) {
        return (
          <span className="text-slate-600 dark:text-slate-400 text-sm">
            {String(value)}
          </span>
        );
      }
    }

    if (
      column.type === "badge" ||
      column.key === "status" ||
      column.key === "tier" ||
      column.key === "target_type" ||
      column.key === "type_withdraw"
    ) {
      const valStr = String(value).toLowerCase();
      let badgeClass =
        "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-300";

      // Status colors
      if (
        [
          "active",
          "completed",
          "approved",
          "confirmed",
          "sent",
          "read",
          "verified",
        ].includes(valStr)
      )
        badgeClass =
          "bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800";
      if (
        [
          "inactive",
          "rejected",
          "reject",
          "suspended",
          "error",
          "failed",
          "unread",
          "frozen",
        ].includes(valStr)
      )
        badgeClass =
          "bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-900/20 dark:text-rose-400 dark:border-rose-800";
      if (
        ["pending", "review", "draft", "scheduled", "processing"].includes(
          valStr
        )
      )
        badgeClass =
          "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-800";
      if (["new"].includes(valStr))
        badgeClass =
          "bg-sky-50 text-sky-700 border border-sky-200 dark:bg-sky-900/20 dark:text-sky-400 dark:border-sky-800";

      // Translate value
      const translationKey = `status_${valStr}` as any;
      const translatedValue =
        t(translationKey) !== `status_${valStr}`
          ? t(translationKey)
          : t(valStr as any) !== valStr
          ? t(valStr as any)
          : valStr;

      return (
        <span
          className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold capitalize shadow-sm ${badgeClass}`}
        >
          {translatedValue}
        </span>
      );
    }

    return (
      <span className="text-slate-700 dark:text-slate-300 text-sm font-medium">
        {String(value)}
      </span>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Table Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
        <div className="relative max-w-md w-full">
          <Search
            className={`absolute top-1/2 -translate-y-1/2 text-slate-400 ${
              isRTL ? "right-3" : "left-3"
            }`}
            size={18}
          />
          <input
            type="text"
            placeholder={
              onSearch ? t("search_server") : t("search_placeholder")
            }
            className={`w-full py-2.5 rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-primary/50 focus:border-primary text-sm transition-all outline-none placeholder:text-slate-400 ${
              isRTL ? "pr-10 pl-4" : "pl-10 pr-4"
            }`}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700">
          <span className="font-medium text-slate-900 dark:text-white">
            {totalResults}
          </span>{" "}
          {t("total_results")}
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50">
                {columns.map((col, index) => (
                  <th
                    key={`${String(col.key)}-${index}`}
                    className="px-6 py-4 text-left text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors select-none group"
                    onClick={() => handleSort(col.key)}
                  >
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      {col.header}
                      <span
                        className={`transition-opacity duration-200 ${
                          sortKey === col.key
                            ? "opacity-100"
                            : "opacity-0 group-hover:opacity-50"
                        }`}
                      >
                        <ArrowUpDown
                          size={14}
                          className={
                            sortKey === col.key
                              ? "text-primary"
                              : "text-slate-400"
                          }
                        />
                      </span>
                    </div>
                  </th>
                ))}
                {(onEdit || onDelete) && (
                  <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider whitespace-nowrap">
                    {t("actions")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-100 dark:divide-slate-700/50">
              {isLoading ? (
                <tr>
                  <td
                    colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                    className="px-6 py-20 text-center"
                  >
                    <div className="flex flex-col justify-center items-center gap-3">
                      <div className="animate-spin h-8 w-8 border-3 border-primary border-t-transparent rounded-full"></div>
                      <span className="text-slate-500 dark:text-slate-400 text-sm animate-pulse">
                        {t("loading_data")}
                      </span>
                    </div>
                  </td>
                </tr>
              ) : displayData.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length + (onEdit || onDelete ? 1 : 0)}
                    className="px-6 py-16 text-center text-slate-500 dark:text-slate-400"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <div className="p-3 bg-slate-100 dark:bg-slate-700 rounded-full">
                        <Search size={24} className="text-slate-400" />
                      </div>
                      <p>{t("no_records")}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                displayData.map((item, idx) => (
                  <tr
                    key={item.id}
                    className="group hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors duration-150 ease-in-out"
                  >
                    {columns.map((col, colIndex) => (
                      <td
                        key={`${item.id}-${String(col.key)}-${colIndex}`}
                        className="px-6 py-4 whitespace-nowrap"
                      >
                        {renderCell(item, col)}
                      </td>
                    ))}

                    {(onEdit || onDelete) && (
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end gap-2">
                          {onEdit && (
                            <button
                              onClick={() => onEdit(item)}
                              className="text-indigo-600 dark:text-indigo-400 hover:text-white dark:hover:text-white p-2 hover:bg-indigo-600 dark:hover:bg-indigo-600 rounded-lg transition-all shadow-sm hover:shadow"
                              title={t("edit_user")}
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {onDelete && (
                            <button
                              onClick={() => onDelete(item)}
                              className="text-red-600 dark:text-red-400 hover:text-white dark:hover:text-white p-2 hover:bg-red-600 dark:hover:bg-red-600 rounded-lg transition-all shadow-sm hover:shadow"
                              title={t("delete_user")}
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {!isLoading && totalResults > 0 && (
          <div className="bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 dark:text-slate-400 mx-2">
                {t("page")}{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {currentPage}
                </span>{" "}
                {t("of")}{" "}
                <span className="font-semibold text-slate-900 dark:text-white">
                  {totalPages}
                </span>
              </span>

              <div className="flex rounded-lg shadow-sm dir-ltr">
                <button
                  onClick={() => handlePageChange(1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-l-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRTL ? (
                    <ChevronsRight size={16} />
                  ) : (
                    <ChevronsLeft size={16} />
                  )}
                </button>
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 bg-white dark:bg-slate-800 border-t border-b border-l border-slate-300 dark:border-slate-600 dark:border-l-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRTL ? (
                    <ChevronRight size={16} />
                  ) : (
                    <ChevronLeft size={16} />
                  )}
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 bg-white dark:bg-slate-800 border-t border-b border-r border-slate-300 dark:border-slate-600 dark:border-r-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRTL ? (
                    <ChevronLeft size={16} />
                  ) : (
                    <ChevronRight size={16} />
                  )}
                </button>
                <button
                  onClick={() => handlePageChange(totalPages)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-r-lg bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isRTL ? (
                    <ChevronsLeft size={16} />
                  ) : (
                    <ChevronsRight size={16} />
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DynamicTable;
