import React, { useEffect, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell,
} from "recharts";
import {
  Users,
  Activity,
  CreditCard,
  Coins,
  Wallet,
  TrendingUp,
  ArrowUpRight,
  Building2,
  ArrowRight,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "../contexts/ThemeContext";
import { useLanguage } from "../contexts/LanguageContext";
import { apiRequest, ENDPOINTS } from "../services/service";
import { Withdrawal } from "../types";

// Custom Tooltip for Charts
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white dark:bg-slate-800 p-3 border border-gray-100 dark:border-slate-700 rounded-lg shadow-xl text-sm">
        <p className="font-semibold text-gray-900 dark:text-white mb-1">
          {label}
        </p>
        {payload.map((entry: any, index: number) => (
          <p
            key={index}
            style={{ color: entry.color }}
            className="flex items-center gap-2"
          >
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: entry.color }}
            ></span>
            <span className="font-medium capitalize">{entry.name}:</span>
            <span className="font-mono font-bold">
              {entry.name === "Revenue" || entry.name === "Volume" ? "$" : ""}
              {Number(entry.value).toLocaleString()}
            </span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { theme } = useTheme();
  const { t, isRTL, language } = useLanguage();

  // New States for additional data
  const [recentWithdrawals, setRecentWithdrawals] = useState<Withdrawal[]>([]);
  const [totalCompanies, setTotalCompanies] = useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [dashboardRes, settingsRes, withdrawalsRes, companiesRes] =
          await Promise.all([
            apiRequest(ENDPOINTS.STATS),
            apiRequest(ENDPOINTS.SETTINGS),
            apiRequest(ENDPOINTS.WITHDRAWALS),
            apiRequest(ENDPOINTS.COMPANIES),
          ]);

        const dashData = dashboardRes.data || dashboardRes;
        const settingsData = settingsRes.data || [];

        // Extract Riget Supply info from Settings
        const totalRigetStr =
          settingsData.find((s: any) => s.key === "total-riget")?.value || "0";
        const availableRigetStr =
          settingsData.find((s: any) => s.key === "avalible-riget")?.value ||
          "0";

        const totalRiget = parseFloat(totalRigetStr);
        const remainingRiget = parseFloat(availableRigetStr);
        const distributedRiget = totalRiget - remainingRiget;

        setStats({
          total_users: dashData.total_users || 0,
          active_users:
            dashData.total_user_active || dashData.active_users || 0, // Mapped active users correctly
          total_revenue: dashData.total_revenue || 0,
          total_money_users: dashData.total_money_users || 0, // New field for total user balance
          pending_withdrawals: dashData.pending_withdrawals || 0,
          confirmed_withdraw: dashData.confirmed_withdraw || 0, // New field for confirmed withdrawals
          riget_supply: {
            total: totalRiget,
            remaining: remainingRiget,
            distributed: distributedRiget,
          },
          withdrawal_breakdown: dashData.withdrawal_breakdown || {
            methods: {},
            statuses: {},
          },
          company_revenues: (dashData.company_revenues || []).map((c: any) => ({
            name: c.name,
            Revenue: parseFloat(c.amount || "0"),
          })),
        });

        // Set Recent Withdrawals (Take top 5)
        const withdrawals = withdrawalsRes.data || [];
        setRecentWithdrawals(withdrawals.slice(0, 5));

        // Set Total Companies
        const companies = companiesRes.data || [];
        setTotalCompanies(companies.length);
      } catch (error) {
        console.error("Failed to load dashboard data", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-3">
          <div className="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            {t("loading")}
          </p>
        </div>
      </div>
    );

  if (!stats)
    return (
      <div className="p-8 text-center text-red-500">Failed to load data.</div>
    );

  // --- Prepare Chart Data ---

  const withdrawalMethodData = [
    {
      name: t("method_bank"),
      Count: stats.withdrawal_breakdown?.methods?.bank?.count || 0,
      Volume: stats.withdrawal_breakdown?.methods?.bank?.volume || 0,
    },
    {
      name: t("method_crypto"),
      Count: stats.withdrawal_breakdown?.methods?.bank_dollar?.count || 0,
      Volume: stats.withdrawal_breakdown?.methods?.bank_dollar?.volume || 0,
    },
    {
      name: t("method_wallet"),
      Count: stats.withdrawal_breakdown?.methods?.wallet?.count || 0,
      Volume: stats.withdrawal_breakdown?.methods?.wallet?.volume || 0,
    },
  ];

  const companyRevenueData = stats.company_revenues;

  // Supply Calculations for Progress Bar
  const supplyPercent =
    stats.riget_supply.total > 0
      ? (stats.riget_supply.remaining / stats.riget_supply.total) * 100
      : 0;

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
      case "confirmed":
      case "completed":
        return "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 dark:text-emerald-400";
      case "rejected":
      case "failed":
      case "reject":
        return "text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-400";
      default:
        return "text-amber-600 bg-amber-50 dark:bg-amber-900/20 dark:text-amber-400";
    }
  };

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {t("dashboard")}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t("welcome_back")}
          </p>
        </div>
      </div>

      {/* 1. Riget Supply Hero Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 dark:from-slate-800 dark:via-indigo-900 dark:to-slate-950 text-white shadow-xl border border-indigo-500/20">
        {/* Background Decorative Elements */}
        <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
          <Coins size={300} strokeWidth={1} />
        </div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 p-6 sm:p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm border border-white/10">
                <Coins size={28} className="text-indigo-300" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">
                  {t("riget_supply_title")}
                </h3>
                <p className="text-indigo-300/80 text-sm">
                  {t("token_distribution")}
                </p>
              </div>
            </div>
            <div className="flex gap-2 text-sm bg-black/20 p-1.5 rounded-lg border border-white/5">
              <span className="px-3 py-1 rounded-md bg-white/10 text-white font-medium">
                {t("total_cap")}
              </span>
              <span className="px-3 py-1 text-indigo-200 font-mono">
                {stats.riget_supply.total.toLocaleString()} RGT
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-end">
            <div className="space-y-4">
              <div className="flex justify-between items-end text-sm font-medium">
                <span className="text-indigo-200">{t("remaining_supply")}</span>
                <span className="text-white text-3xl font-bold font-mono tracking-tight">
                  {stats.riget_supply.remaining.toLocaleString()}{" "}
                  <span className="text-lg text-indigo-400 font-sans">RGT</span>
                </span>
              </div>

              {/* Progress Bar */}
              <div className="relative h-4 bg-gray-900/50 rounded-full overflow-hidden border border-white/5 backdrop-blur-sm">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(99,102,241,0.5)]"
                  style={{ width: `${supplyPercent}%` }}
                >
                  <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]"></div>
                </div>
              </div>

              <div className="flex justify-between text-xs font-medium text-indigo-300/70">
                <span>0%</span>
                <span>
                  {supplyPercent.toFixed(5)}% {t("available")}
                </span>
                <span>100%</span>
              </div>
            </div>

            <div className="bg-white/5 rounded-xl p-5 border border-white/10 backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp size={18} className="text-emerald-400" />
                <span className="text-indigo-200 text-sm font-medium">
                  {t("distributed_supply")}
                </span>
              </div>
              <div className="text-2xl font-bold text-white font-mono mb-1">
                {stats.riget_supply.distributed.toLocaleString()} RGT
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid - Compact Version */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-primary/30 dark:hover:border-primary/40 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Users size={18} />
            </div>
            <span className="text-xs font-medium text-green-600 dark:text-green-400 flex items-center gap-0.5">
              <ArrowUpRight size={10} /> +2.5%
            </span>
          </div>
          <p className="text-xl text-gray-500 dark:text-slate-400 mb-1">
            {t("total_users")}
          </p>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {stats.total_users.toLocaleString()}
          </h3>
        </div>

        {/* Active Users */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-emerald-300 dark:hover:border-emerald-500/40 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
              <Activity size={18} />
            </div>
          </div>
          <p className="text-xl text-gray-500 dark:text-slate-400 mb-1">
            {t("active_users")}
          </p>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {stats.active_users.toLocaleString()}
          </h3>
        </div>

        {/* Total Companies */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-purple-300 dark:hover:border-purple-500/40 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <Building2 size={18} />
            </div>
          </div>
          <p className="text-xl text-gray-500 dark:text-slate-400 mb-1">
            {t("total_companies")}
          </p>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {totalCompanies}
          </h3>
        </div>

        {/* Total Money Users */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-cyan-300 dark:hover:border-cyan-500/40 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400">
              <Wallet size={18} />
            </div>
          </div>
          <p className="text-xl text-gray-500 dark:text-slate-400 mb-1">
            {t("total_money_users")}
          </p>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {Number(stats.total_money_users).toLocaleString()} RGT
          </h3>
        </div>

        {/* Total Revenue */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-amber-300 dark:hover:border-amber-500/40 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              <DollarSign size={18} />
            </div>
          </div>
          <p className="text-xl text-gray-500 dark:text-slate-400 mb-1">
            {t("total_revenue")}
          </p>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {stats.total_revenue.toLocaleString()}
          </h3>
        </div>

        {/* Pending Withdrawals */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-rose-300 dark:hover:border-rose-500/40 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
              <CreditCard size={18} />
            </div>
            {stats.pending_withdrawals > 0 && (
              <span className="text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/40 px-2 py-0.5 rounded-full">
                {t("action_needed")}
              </span>
            )}
          </div>
          <p className="text-xl text-gray-500 dark:text-slate-400 mb-1">
            {t("pending_withdrawals")}
          </p>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {stats.pending_withdrawals}
          </h3>
        </div>

        {/* Confirmed Withdrawals */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-gray-100 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-500/40 transition-all group">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
              <CheckCircle size={18} />
            </div>
          </div>
          <p className="text-xl text-gray-500 dark:text-slate-400 mb-1">
            {t("confirmed_withdrawals")}
          </p>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            {Number(stats.confirmed_withdraw).toLocaleString()} Riget
          </h3>
        </div>
      </div>

      {/* 3. Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Withdrawal Volume Chart (Bar) */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t("withdrawal_stats")}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {t("volume_by_method")}
              </p>
            </div>
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <Wallet
                size={18}
                className="text-indigo-600 dark:text-indigo-400"
              />
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={withdrawalMethodData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  vertical={false}
                  stroke={theme === "dark" ? "#334155" : "#f1f5f9"}
                />
                <XAxis
                  dataKey="name"
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: theme === "dark" ? "#94a3b8" : "#64748b",
                    fontSize: 12,
                  }}
                  dy={10}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{
                    fill: theme === "dark" ? "#94a3b8" : "#64748b",
                    fontSize: 12,
                  }}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  content={<CustomTooltip />}
                  cursor={{ fill: theme === "dark" ? "#1e293b" : "#f8fafc" }}
                />
                <Bar
                  dataKey="Volume"
                  fill="url(#colorBar)"
                  radius={[6, 6, 0, 0]}
                  barSize={50}
                >
                  {withdrawalMethodData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={
                        index === 0
                          ? "#6366f1"
                          : index === 1
                          ? "#10b981"
                          : "#f59e0b"
                      }
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Withdrawals (Replaces Pie Chart) */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {t("recent_withdrawals")}
              </h3>
              <p className="text-xs text-gray-500 dark:text-slate-400">
                {t("last_5_transactions")}
              </p>
            </div>
            <Link
              to="/withdrawals"
              className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
            >
              {t("view_all")}{" "}
              <ArrowRight size={12} className={isRTL ? "rotate-180" : ""} />
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto custom-scrollbar">
            {recentWithdrawals.length === 0 ? (
              <div className="h-full flex items-center justify-center text-gray-400 text-sm">
                {t("no_withdrawals_found")}
              </div>
            ) : (
              <div className="space-y-4">
                {recentWithdrawals.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors border border-transparent hover:border-gray-100 dark:hover:border-slate-700"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${
                          item.method === "bank"
                            ? "bg-indigo-500"
                            : item.method === "bank_dollar"
                            ? "bg-emerald-500"
                            : "bg-amber-500"
                        }`}
                      >
                        {item.username?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate max-w-[100px]">
                          {item.username || t("unknown_user")}
                        </p>
                        <p className="text-[10px] text-gray-500 dark:text-slate-400">
                          {new Date(item.created_at).toLocaleDateString(
                            language
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-white font-mono">
                        ${Number(item.amount).toFixed(5)}
                      </p>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(
                          item.status
                        )}`}
                      >
                        {t(
                          item.status === "confirmed"
                            ? "status_confirmed"
                            : item.status === "pending"
                            ? "status_pending"
                            : "status_rejected"
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 4. Company Revenues Chart (Area) */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">
              {t("company_revenues")}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              {t("performance_overview")}
            </p>
          </div>
          <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
            <TrendingUp
              size={18}
              className="text-purple-600 dark:text-purple-400"
            />
          </div>
        </div>
        <div className="h-[350px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={companyRevenueData}
              margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke={theme === "dark" ? "#334155" : "#f1f5f9"}
              />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: theme === "dark" ? "#94a3b8" : "#64748b",
                  fontSize: 12,
                }}
                dy={10}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{
                  fill: theme === "dark" ? "#94a3b8" : "#64748b",
                  fontSize: 12,
                }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="Revenue"
                stroke="#8b5cf6"
                strokeWidth={3}
                fillOpacity={1}
                fill="url(#colorRev)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
