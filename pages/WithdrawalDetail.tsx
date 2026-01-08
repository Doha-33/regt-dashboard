

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { apiRequest, ENDPOINTS } from '../services/service';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Withdrawal } from '../types';
import { ArrowLeft, CheckCircle, XCircle, Save, Clock, CreditCard, Building, User, FileText, Edit2, Wallet, Gamepad2, Globe } from 'lucide-react';

const WithdrawalDetail: React.FC = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showToast } = useToast();
    const { t, isRTL } = useLanguage();

    const [data, setData] = useState<Withdrawal | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Action State
    const [actionNote, setActionNote] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);

    // Edit State
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Withdrawal>>({});

    useEffect(() => {
        if (id) fetchData(id);
    }, [id]);

    const fetchData = async (wId: string) => {
        setIsLoading(true);
        try {
            const res = await apiRequest(`${ENDPOINTS.WITHDRAWALS}/${wId}`, 'GET');
            const item = Array.isArray(res.data) ? res.data.find((w: any) => String(w.id) === wId) : res.data;

            if (item) {
                setData(item);
                setEditForm(item);
                setActionNote(item.note || '');
            } else {
                throw new Error("Withdrawal not found");
            }
        } catch (e) {
            showToast('Failed to load withdrawal details', 'error');
            navigate('/withdrawals');
        } finally {
            setIsLoading(false);
        }
    };

    const handleAction = async (status: 'confirmed' | 'reject') => {
        if (!data) return;

        if ((status === 'reject' || status === 'confirmed') && !actionNote.trim() && !data.note) {
            if (status === 'reject' && !actionNote.trim()) {
                showToast(t('provide_reason'), 'error');
                return;
            }
        }

        setIsProcessing(true);
        try {
            await apiRequest(`${ENDPOINTS.WITHDRAWALS}/${data.id}`, 'PATCH', {
                status: status,
                note: actionNote
            });
            showToast(t('status_updated'), 'success');
            fetchData(data.id.toString());
        } catch (e) {
            showToast(t('error_updating_status'), 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!data) return;
        setIsProcessing(true);
        try {
            await apiRequest(`${ENDPOINTS.WITHDRAWALS}/${data.id}`, 'PATCH', editForm);
            showToast(t('withdrawal_updated'), 'success');
            setIsEditing(false);
            fetchData(data.id.toString());
        } catch (e) {
            showToast(t('failed_update_withdrawal'), 'error');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditForm(prev => ({ ...prev, [name]: value }));
    };

    // Helper to check if a value is valid for display
    const isValid = (value: string | number | null | undefined): boolean => {
        if (value === null || value === undefined) return false;
        const strVal = String(value).trim();
        return strVal !== '' && strVal.toLowerCase() !== 'null' && strVal.toLowerCase() !== 'undefined';
    };

    // Helper to render a data row only if value exists (Strict Check)
    const renderDataRow = (label: string, value: string | number | null | undefined, isMono = false) => {
        if (!isValid(value)) return null;

        return (
            <div className="pb-3 border-b border-gray-50 dark:border-slate-700/50 last:border-0 last:pb-0">
                <label className="text-xs text-gray-500 dark:text-slate-400 uppercase font-bold block mb-1">{label}</label>
                <div className={`text-base text-gray-900 dark:text-white ${isMono ? 'font-mono bg-gray-50 dark:bg-slate-900/50 p-2 rounded border border-gray-100 dark:border-slate-700' : 'font-medium'}`}>
                    {value}
                </div>
            </div>
        );
    };

    if (isLoading) return <div className="p-12 text-center text-gray-500">{t('loading')}</div>;
    if (!data) return <div className="p-12 text-center text-red-500">{t("Withdrawalnotfound")}</div>;

    const isPending = data.status === 'pending';
    const isRejected = data.status === 'rejected' || data.status === 'reject';

    // Categorize Methods
    // Fix: cast to string to avoid TS error comparing union types with unrelated strings
    const method = (data.method as string)?.toLowerCase();
    const isBank = method === 'bank' || method === 'bank_dollar';
    const isWallet = method === 'wallet' || method === 'crypto' || method === 'usdt';
    const isGames = method === 'games';

    const getStatusLabel = (status: string) => {
        if (status === 'reject' || status === 'rejected') return t('status_rejected');
        return t(`status_${status}` as any) || status;
    };

    // Icon based on method
    const MethodIcon = isBank ? Building : isGames ? Gamepad2 : isWallet ? Wallet : Globe;

    return (
        <div className="max-w-4xl mx-auto space-y-6 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/withdrawals')} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors">
                        <ArrowLeft size={20} className={isRTL ? 'rotate-180' : ''} />
                    </button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t('transaction_details')}</h1>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide 
                                ${data.status === 'confirmed' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                                    isRejected ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' :
                                        'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'}`}>
                                {getStatusLabel(data.status)}
                            </span>
                        </div>
                        <p className="text-gray-500 dark:text-slate-400 text-sm mt-1">ID: #{data.id}</p>
                    </div>
                </div>
                {isPending && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/30 px-4 py-2 rounded-lg transition-colors font-medium"
                    >
                        <Edit2 size={16} /> {t('edit_user')}
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Main Info Card */}
                <div className="md:col-span-2 space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                        <div className="flex items-center gap-2 mb-6 pb-4 border-b border-gray-100 dark:border-slate-700">
                            <MethodIcon className="text-primary" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('financial_data')}</h3>
                        </div>

                        {isEditing ? (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('amount')}</label>
                                        <input name="amount" value={editForm.amount} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-transparent text-gray-900 dark:text-white" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('method')}</label>
                                        <select name="method" value={editForm.method} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-transparent text-gray-900 dark:text-white">
                                            <option value="bank">{t("BankTransfer")}</option>
                                            <option value="bank_dollar">{t("BankDollar")}</option>
                                            <option value="wallet">{t("Wallet")}</option>
                                            <option value="games">{t("Games")}</option>
                                        </select>
                                    </div>

                                    {(editForm.method === 'bank' || editForm.method === 'bank_dollar') && (
                                        <>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('bank_name')}</label>
                                                <input name="bank_name" value={editForm.bank_name || ''} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-transparent text-gray-900 dark:text-white" />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('country')}</label>
                                                <input name="country" value={editForm.country || ''} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-transparent text-gray-900 dark:text-white" />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('iban')}</label>
                                                <input name="iban" value={editForm.iban || ''} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-transparent text-gray-900 dark:text-white font-mono" />
                                            </div>
                                            <div className="sm:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{t('software')}</label>
                                                <input name="software" value={editForm.software || ''} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-transparent text-gray-900 dark:text-white" />
                                            </div>
                                        </>
                                    )}

                                    {(editForm.method === 'wallet' || editForm.method === 'crypto' || editForm.method === 'games') && (
                                        <div className="sm:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-1">{editForm.method === 'games' ? 'Player ID / Account' : t('wallet_address')}</label>
                                            <input name="address" value={editForm.address || ''} onChange={handleChange} className="w-full p-2.5 rounded-lg border border-gray-300 dark:border-slate-600 bg-transparent text-gray-900 dark:text-white font-mono" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 justify-end pt-4">
                                    <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-gray-600 dark:text-slate-300 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg">{t('cancel')}</button>
                                    <button onClick={handleSaveEdit} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-indigo-700 flex items-center gap-2">
                                        <Save size={16} /> {t('save_changes')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Common Data */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 dark:bg-slate-900/30 p-4 rounded-xl">
                                        <label className="text-xs text-gray-500 dark:text-slate-400 uppercase font-bold block mb-1">{t('amount')}</label>
                                        <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">{Number(data.amount).toFixed(5)}</p>
                                    </div>
                                    <div className="bg-gray-50 dark:bg-slate-900/30 p-4 rounded-xl">
                                        <label className="text-xs text-gray-500 dark:text-slate-400 uppercase font-bold block mb-1">{t('method')}</label>
                                        <p className="text-lg font-medium text-gray-900 dark:text-white capitalize flex items-center gap-2">
                                            <MethodIcon size={20} className="text-gray-400" />
                                            <span>{t(data.method as any)}</span>

                                        </p>
                                    </div>
                                </div>

                                <div className="border-t border-gray-100 dark:border-slate-700 pt-4 space-y-4">
                                    {/* Bank Data */}
                                    {isBank && (
                                        <>
                                            {renderDataRow(t('bank_name'), data.bank_name)}
                                            {renderDataRow(t('country'), data.country)}
                                            {renderDataRow(t('iban'), data.iban, true)}
                                            {renderDataRow(t('software'), data.software || data.swift_code, true)}
                                        </>
                                    )}

                                    {/* Wallet Data */}
                                    {isWallet && (
                                        <>
                                            {renderDataRow(t('wallet_address'), data.address || data.wallet_address, true)}
                                            {/* Sometimes network is passed in bank_name or software, check for loose mapping */}
                                            {renderDataRow('Network', data.bank_name || data.software)}
                                        </>
                                    )}

                                    {/* Games Data */}
                                    {isGames && (
                                        <>
                                            {renderDataRow('Player ID / Account', data.address || data.wallet_address, true)}
                                            {renderDataRow('Game Name', data.bank_name || data.software)}
                                        </>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Action Card */}
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-gray-100 dark:border-slate-700">
                            <FileText className="text-primary" />
                            <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('reason_notes')} & {t('actions')}</h3>
                        </div>

                        {isPending ? (
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">{t('reason_notes')}</label>
                                    <textarea
                                        value={actionNote}
                                        onChange={(e) => setActionNote(e.target.value)}
                                        className="w-full p-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/50 outline-none resize-none"
                                        style={{ minHeight: '100px', maxHeight: '300px' }}
                                        rows={4}
                                        placeholder={t('add_note')}
                                    />
                                </div>
                                <div className="flex gap-4 pt-2">
                                    <button
                                        onClick={() => handleAction('confirmed')}
                                        disabled={isProcessing}
                                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-bold shadow-sm transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                                    >
                                        <CheckCircle size={20} /> {t('approve')}
                                    </button>
                                    <button
                                        onClick={() => handleAction('reject')}
                                        disabled={isProcessing}
                                        className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg font-bold shadow-sm transition-all flex justify-center items-center gap-2 disabled:opacity-70"
                                    >
                                        <XCircle size={20} /> {t('reject')}
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="text-xs text-gray-500 dark:text-slate-400 uppercase font-semibold block mb-2">{t('reason_notes')}</label>
                                <div className="p-4 bg-gray-50 dark:bg-slate-900/50 rounded-lg border border-gray-100 dark:border-slate-700 text-gray-700 dark:text-slate-300 overflow-y-auto max-h-[200px] whitespace-pre-wrap break-words">
                                    {data.note || 'No notes provided.'}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Info (User & History) */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <User className="text-gray-400" />
                            <h4 className="font-bold text-gray-900 dark:text-white">{t('user_management')}</h4>
                        </div>
                        <div className="space-y-3">
                            {isValid(data.username) && (
                                <div>
                                    <label className="text-xs text-gray-500 block">{t('name')}</label>
                                    <p className="font-medium dark:text-white cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/users/${data.user_id}`)}>
                                        {data.username} <span className="text-xs text-gray-400">(#{data.user_id})</span>
                                    </p>
                                </div>
                            )}
                            
                            {isValid(data.email) && (
                                <div>
                                    <label className="text-xs text-gray-500 block">{t('email')}</label>
                                    <p className="font-medium dark:text-white truncate">{data.email}</p>
                                </div>
                            )}
                            
                            {isValid(data.phone) && (
                                <div>
                                    <label className="text-xs text-gray-500 block">{t('phone')}</label>
                                    <p className="font-medium dark:text-white">{data.phone}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <Clock className="text-gray-400" />
                            <h4 className="font-bold text-gray-900 dark:text-white">{t('history')}</h4>
                        </div>
                        <div className="space-y-3">
                            {isValid(data.created_at) && (
                                <div>
                                    <label className="text-xs text-gray-500 block">{t('requested')}</label>
                                    <p className="font-medium dark:text-white text-sm">
                                        {new Date(data.created_at).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                            )}
                            {isValid(data.updated_at) && (
                                <div>
                                    <label className="text-xs text-gray-500 block">{t("LastUpdated")}</label>
                                    <p className="font-medium dark:text-white text-sm">
                                        {new Date(data.updated_at as string).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WithdrawalDetail;