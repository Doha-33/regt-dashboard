
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';
import { apiRequest, ENDPOINTS } from '../services/service';
import { Save, Lock, RefreshCcw, Send, CheckCircle2 } from 'lucide-react';

const Profile: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const { t } = useLanguage();
  
  const [profile, setProfile] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isResendingOtp, setIsResendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    bank_name: '',
    iban: '',
    wallet: ''
  });

  // Password States
  const [passwords, setPasswords] = useState({
    otp: '',
    password: '',
    password_confirmation: ''
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const res = await apiRequest(ENDPOINTS.AUTH.ME);
      const data = res.data?.user || res.user;
      if (data) {
        setProfile(data);
        setFormData({
          name: data.name || '',
          phone: data.phone || '',
          address: data.address || '',
          bank_name: data.bank_name || '',
          iban: data.iban || '',
          wallet: data.wallet || ''
        });
        // Update local auth context with fresh data
        login(data, localStorage.getItem('token') || undefined);
      }
    } catch (e) {
      showToast('Failed to load profile data', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswords(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await apiRequest(ENDPOINTS.AUTH.UPDATE_PROFILE, 'POST', formData);
      showToast('Profile updated successfully', 'success');
      fetchProfile(); // Refresh
    } catch (e: any) {
      showToast(e.message || 'Failed to update profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendOtp = async () => {
    if (!profile?.email) return;
    setIsResendingOtp(true);
    try {
        await apiRequest(ENDPOINTS.AUTH.RESEND_OTP, 'POST', { email: profile.email });
        showToast('OTP sent successfully to your email', 'success');
        setOtpSent(true);
    } catch (e: any) {
        showToast(e.message || 'Failed to send OTP', 'error');
    } finally {
        setIsResendingOtp(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpSent) return showToast('Please request an OTP first', 'error');
    if (passwords.password !== passwords.password_confirmation) {
      return showToast('Passwords do not match', 'error');
    }
    if (passwords.otp.length < 4) {
      return showToast('Please enter a valid OTP', 'error');
    }
    
    setIsSaving(true);
    try {
      // payload: email, otp, password, password_confirmation
      await apiRequest(ENDPOINTS.AUTH.CHANGE_PASSWORD, 'POST', {
          email: profile.email,
          ...passwords
      });
      showToast('Password changed successfully', 'success');
      setPasswords({ otp: '', password: '', password_confirmation: '' });
      setOtpSent(false);
    } catch (e: any) {
      showToast(e.message || 'Failed to change password', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-12 text-center text-gray-500">{t('loading')}</div>;

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{t('my_profile')}</h2>
          <p className="text-gray-500 dark:text-slate-400 mt-1">{t('profile_desc')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Overview & Security Form */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6 text-center">
            <div className="h-24 w-24 rounded-full bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold mx-auto mb-4 border-2 border-primary/20">
                {profile?.name?.charAt(0).toUpperCase()}
            </div>
            <h3 className="text-xl font-bold dark:text-white">{profile?.name}</h3>
            <p className="text-gray-500 text-sm mb-4">{profile?.email}</p>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-slate-700">
                <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase font-bold">{t('balance')}</p>
                    <p className="text-lg font-mono font-bold text-emerald-600">{Number(profile?.balance || 0).toFixed(5)}</p>
                </div>
                <div className="text-center">
                    <p className="text-xs text-gray-500 uppercase font-bold">Team</p>
                    <p className="text-lg font-mono font-bold text-blue-600">{profile?.count_team || profile?.team_size || 0}</p>
                </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-6">
            <h4 className="font-bold mb-4 flex items-center gap-2"><Lock size={18} className="text-primary" /> {t('security')}</h4>
            
            <div className="space-y-4">
               {!otpSent ? (
                  <button 
                    onClick={handleSendOtp}
                    disabled={isResendingOtp}
                    className="w-full py-2.5 bg-primary/10 text-primary rounded-lg font-bold hover:bg-primary/20 transition-all border border-primary/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isResendingOtp ? <RefreshCcw size={16} className="animate-spin" /> : <Send size={16} />}
                    {t('send_otp_to_email')}
                  </button>
               ) : (
                  <div className="bg-emerald-50 dark:bg-emerald-900/10 p-3 rounded-lg border border-emerald-100 dark:border-emerald-800/30 flex items-center gap-2 mb-2">
                     <CheckCircle2 size={16} className="text-emerald-600" />
                     <span className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">OTP sent to your email</span>
                  </div>
               )}

               <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase block mb-1">{t('enter_otp_received')}</label>
                    <input 
                      type="text" 
                      name="otp" 
                      value={passwords.otp} 
                      onChange={handlePasswordInputChange} 
                      placeholder="000000"
                      disabled={!otpSent}
                      className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50 font-mono text-center tracking-widest" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase block mb-1">{t('new_password')}</label>
                    <input 
                      type="password" 
                      name="password" 
                      value={passwords.password} 
                      onChange={handlePasswordInputChange} 
                      disabled={!otpSent}
                      className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50" 
                      required 
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 dark:text-slate-400 uppercase block mb-1">{t('confirm_new_password')}</label>
                    <input 
                      type="password" 
                      name="password_confirmation" 
                      value={passwords.password_confirmation} 
                      onChange={handlePasswordInputChange} 
                      disabled={!otpSent}
                      className="w-full p-2.5 rounded-lg border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-primary/20 transition-all disabled:opacity-50" 
                      required 
                    />
                  </div>
                  <button 
                    type="submit" 
                    disabled={isSaving || !otpSent}
                    className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                      {isSaving ? <RefreshCcw size={16} className="animate-spin" /> : <Lock size={16} />}
                      {isSaving ? t('loading') : t('change_password')}
                  </button>
                  
                  {otpSent && (
                    <button 
                      type="button" 
                      onClick={() => setOtpSent(false)} 
                      className="w-full text-xs text-gray-400 hover:text-primary transition-colors text-center"
                    >
                       Resend Code?
                    </button>
                  )}
               </form>
            </div>
          </div>
        </div>

        {/* Right Column: Personal Information */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8">
            <h4 className="text-xl font-bold mb-8 flex items-center gap-2"><Save size={20} className="text-primary" /> {t('personal_info')}</h4>
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">{t('full_name')}</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleInputChange} 
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">{t('phone')}</label>
                  <input 
                    type="text" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleInputChange} 
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">{t('address')}</label>
                  <input 
                    type="text" 
                    name="address" 
                    value={formData.address} 
                    onChange={handleInputChange} 
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                  />
                </div>
                
                <div className="md:col-span-2 pt-4">
                    <h5 className="font-bold text-gray-400 uppercase text-xs tracking-widest mb-4">{t('financial_details')}</h5>
                    <div className="h-px bg-gray-100 dark:bg-slate-700 w-full"></div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">{t('bank_name')}</label>
                  <input 
                    type="text" 
                    name="bank_name" 
                    value={formData.bank_name} 
                    onChange={handleInputChange} 
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">{t('iban')}</label>
                  <input 
                    type="text" 
                    name="iban" 
                    value={formData.iban} 
                    onChange={handleInputChange} 
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-mono focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 dark:text-slate-300 mb-2">{t('wallet')}</label>
                  <input 
                    type="text" 
                    name="wallet" 
                    value={formData.wallet} 
                    onChange={handleInputChange} 
                    className="w-full p-3 rounded-xl border border-gray-200 dark:border-slate-700 bg-gray-50 dark:bg-slate-900 font-mono text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/20 outline-none transition-all" 
                    placeholder="Enter wallet address..."
                  />
                </div>
              </div>

              <div className="flex justify-end pt-6">
                <button 
                  type="submit" 
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-primary text-white px-8 py-3.5 rounded-xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                >
                   {isSaving ? <RefreshCcw className="animate-spin" size={20} /> : <Save size={20} />}
                   {t('save_changes')}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
