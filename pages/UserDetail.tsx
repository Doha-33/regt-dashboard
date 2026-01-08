import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { apiRequest, ENDPOINTS } from "../services/service";
import { useToast } from "../contexts/ToastContext";
import { useLanguage } from "../contexts/LanguageContext";
import { User, Withdrawal, ColumnDef } from "../types";
import {
  ArrowLeft,
  Save,
  Trash2,
  CreditCard,
  User as UserIcon,
  Lock,
  Hash,
  Image as ImageIcon,
} from "lucide-react";
import DynamicTable from "../components/DynamicTable";
import { COUNTRIES } from "../config/countries";

const UserDetail: React.FC = () => {
  const { id } = useParams();
  const isNew = !id || id === "new";
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t, isRTL } = useLanguage();

  const [user, setUser] = useState<Partial<User>>({
    name: "",
    email: "",
    phone: "",
    country: "",
    age: "",
    gender: "",
    balance: 0,
    affiliate_balance: 0,
    status: "active",
    wallet: "",
    bank_name: "",
    iban: "",
    address: "",
    password: "",
    affiliate_code: "",
    profile_image: null,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [modifiedData, setModifiedData] = useState<Partial<User>>({});
  const [transactions, setTransactions] = useState<Withdrawal[]>([]);
  const [loadingTx, setLoadingTx] = useState(false);

  useEffect(() => {
    if (!isNew && id) {
      fetchUser(id);
    }
  }, [id, isNew]);

  const fetchUser = async (userId: string) => {
    setIsLoading(true);
    try {
      const res = await apiRequest(`${ENDPOINTS.USERS}/${userId}`, "GET");
      if (res.data) {
        setUser(res.data);
        setModifiedData({});
        fetchTransactions(res.data.id);
      }
    } catch (e) {
      showToast("Failed to load user details", "error");
      navigate("/users");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTransactions = async (userId: number | string) => {
    setLoadingTx(true);
    try {
      const res = await apiRequest(ENDPOINTS.WITHDRAWALS, "GET", undefined, {
        user_id: userId.toString(),
      });
      const allTx = res.data || (Array.isArray(res) ? res : []);
      setTransactions(allTx);
    } catch (e) {
      console.error("Failed to load transactions", e);
    } finally {
      setLoadingTx(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value, type } = e.target;

    if (type === "number" && Number(value) < 0) {
      return;
    }

    setUser((prev) => ({ ...prev, [name]: value }));
    setModifiedData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isNew) {
        await apiRequest(ENDPOINTS.USERS, "POST", user);
        showToast(t("user_created"), "success");
        navigate("/users");
      } else {
        if (Object.keys(modifiedData).length === 0) {
          showToast("No changes to save", "success");
          return;
        }
        await apiRequest(`${ENDPOINTS.USERS}/${id}`, "PATCH", modifiedData);
        showToast(t("user_updated"), "success");
        setModifiedData({});
      }
    } catch (e: any) {
      showToast(e.message || t("op_failed"), "error");
    }
  };

  const handleDelete = async () => {
    if (window.confirm(t("delete_confirm"))) {
      try {
        await apiRequest(`${ENDPOINTS.USERS}/${id}`, "DELETE");
        showToast(t("user_deleted"), "success");
        navigate("/users");
      } catch (e) {
        showToast(t("op_failed"), "error");
      }
    }
  };

  const getAvatarUrl = () => {
    if (user.profile_image) return user.profile_image;
    if (user.gender === "female") return "./girl.avif";
    return "./man.jpg";
  };

  const txColumns: ColumnDef<Withdrawal>[] = useMemo(
    () => [
      { key: "transaction_id", header: t("transaction_id"), type: "text" },
      { key: "amount", header: t("amount"), type: "currency" },
      { key: "method", header: t("method"), type: "badge" },
      { key: "status", header: t("status"), type: "badge" },
      { key: "created_at", header: t("requested"), type: "date" },
    ],
    [t]
  );

  if (isLoading) return <div className="p-8 text-center">{t("loading")}</div>;

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/users")}
            className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft size={20} className={isRTL ? "rotate-180" : ""} />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl border-2 border-primary/20 bg-gray-50 overflow-hidden shadow-sm">
              <img
                src={getAvatarUrl()}
                alt=""
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {isNew ? t("add_new_user") : `${t("edit_user")}: ${user.name}`}
              </h1>
              <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">
                {t("user_management")}
              </p>
            </div>
          </div>
        </div>
        {!isNew && (
          <div className="flex gap-2">
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 px-4 py-2 rounded-lg transition-colors"
            >
              <Trash2 size={18} /> {t("delete_user")}
            </button>
          </div>
        )}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-gray-100 dark:border-slate-700 bg-gray-50/50 dark:bg-slate-900/50 flex items-center gap-2">
          <UserIcon size={18} className="text-primary" />
          <h3 className="font-semibold text-gray-900 dark:text-white">
            {t("personal_info")}
          </h3>
        </div>
        <div className="p-6">
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {t("full_name")}
                </label>
                <input
                  name="name"
                  value={user.name || ""}
                  onChange={handleChange}
                  required
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {t("email")}
                </label>
                <input
                  name="email"
                  type="email"
                  value={user.email || ""}
                  onChange={handleChange}
                  readOnly={!isNew}
                  required
                  className={`w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 outline-none transition-all ${
                    !isNew
                      ? "bg-gray-100 dark:bg-slate-800 text-gray-500 cursor-not-allowed"
                      : "bg-white dark:bg-slate-900"
                  }`}
                />
              </div>

              {isNew && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                    <Lock size={14} className="text-gray-400" /> {t("password")}
                  </label>
                  <input
                    name="password"
                    type="password"
                    value={user.password || ""}
                    onChange={handleChange}
                    required={isNew}
                    placeholder="••••••••"
                    className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none transition-all"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2 flex items-center gap-1">
                  <Hash size={14} className="text-gray-400" />{" "}
                  {t("affiliate_code")}
                </label>
                <input
                  name="affiliate_code"
                  value={user.affiliate_code || ""}
                  disabled
                  className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-800 text-gray-500 cursor-not-allowed outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {t("phone")}
                </label>
                <input
                  name="phone"
                  value={user.phone || ""}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {t("Age")}
                </label>
                <input
                  name="age"
                  type="number"
                  min="0"
                  value={user.age || ""}
                  onChange={handleChange}
                  placeholder="e.g. 25"
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {t("Gender")}
                </label>
                <select
                  name="gender"
                  value={user.gender || ""}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 outline-none transition-all"
                >
                  <option value="">{t("SelectGender")}</option>
                  <option value="male">{t("Male")}</option>
                  <option value="female">{t("Female")}</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {t("country")}
                </label>
                <select
                  name="country"
                  value={user.country || ""}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 outline-none transition-all"
                >
                  <option value="">{t("SelectCountry")}</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country}>
                      {country}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {t("address")}
                </label>
                <input
                  name="address"
                  value={user.address || ""}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {t("balance")}
                </label>
                <input
                  name="balance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={user.balance || 0}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {t("affiliate_balance")}
                </label>
                <input
                  name="affiliate_balance"
                  type="number"
                  min="0"
                  step="0.01"
                  value={user.affiliate_balance || 0}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 focus:ring-2 focus:ring-primary/20 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {t("wallet")}
                </label>
                <input
                  name="wallet"
                  value={user.wallet || ""}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {t("bank_name")}
                </label>
                <input
                  name="bank_name"
                  value={user.bank_name || ""}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">
                  {t("iban")}
                </label>
                <input
                  name="iban"
                  value={user.iban || ""}
                  onChange={handleChange}
                  className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 outline-none"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-gray-100 dark:border-slate-700">
              <button
                type="submit"
                className="bg-primary hover:bg-indigo-700 text-white font-medium py-2.5 px-6 rounded-lg shadow-sm transition-colors flex items-center gap-2"
              >
                <Save size={18} /> {t("save_changes")}
              </button>
            </div>
          </form>
        </div>
      </div>

      {!isNew && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="text-primary" /> {t("financial_data")}
          </h2>
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 overflow-hidden">
            <DynamicTable
              data={transactions}
              columns={txColumns}
              isLoading={loadingTx}
              paginationMode="client"
              itemsPerPage={5}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default UserDetail;
