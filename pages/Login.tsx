
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { apiRequest, ENDPOINTS } from '../services/service';
import { ShieldCheck, Mail, Lock, ArrowRight, ChevronLeft, RefreshCw, Smartphone, MailCheck } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { useLanguage } from '../contexts/LanguageContext';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [tempAuth, setTempAuth] = useState<{user: any, token: any} | null>(null);
  
  const { login } = useAuth();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { t, isRTL } = useLanguage();

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Step 1: Normal Login
      const res = await apiRequest(ENDPOINTS.AUTH.LOGIN, 'POST', { email, password });
      
      const userData = res.data?.user;
      if (userData) {
          const token = userData.token || res.data.token || res.token;
          setTempAuth({ user: userData, token });
          
          // Request OTP to be sent via email
          try {
              await apiRequest(ENDPOINTS.AUTH.RESEND_OTP, 'POST', { email });
          } catch (otpErr) {
              console.warn("OTP Send failed but proceeding to input step", otpErr);
          }
          
          setStep(2);
      } else {
          throw new Error('Invalid response structure');
      }
    } catch (err: any) {
      showToast(err.message || 'Login failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length !== 6) {
         showToast('Invalid OTP Code. Must be 6 digits.', 'error');
         return;
    }

    setLoading(true);
    try {
        // Step 2: Verify Email OTP
        await apiRequest(ENDPOINTS.AUTH.VERIFY_EMAIL, 'POST', { email, otp });

        if (tempAuth) {
            login(tempAuth.user, tempAuth.token);
            showToast('Login successful', 'success');
            navigate('/');
        }
    } catch (err: any) {
        showToast(err.message || 'Invalid code', 'error');
    } finally {
        setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resending) return;
    setResending(true);
    try {
        await apiRequest(ENDPOINTS.AUTH.RESEND_OTP, 'POST', { email });
        showToast('A new code has been sent to your email.', 'success');
    } catch (err: any) {
        showToast(err.message || 'Failed to resend code', 'error');
    } finally {
        setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200/50 dark:border-slate-700/50">
        <div className="bg-gradient-to-r from-primary to-indigo-600 p-8 text-center relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10">
            <div className="absolute top-4 left-4 w-16 h-16 rounded-full bg-white"></div>
            <div className="absolute bottom-4 right-4 w-20 h-20 rounded-full bg-white"></div>
          </div>
          <div className="relative">
            <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-white/10 mb-4 backdrop-blur-sm border border-white/20">
              <ShieldCheck size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white tracking-tight">Regt Admin</h2>
            <p className="text-indigo-100/90 mt-2 text-sm font-medium">
              {step === 1 ? t('login_step1') : t('login_step2')}
            </p>
          </div>
        </div>

        <div className="p-8">
          {step === 1 ? (
            <form onSubmit={handleCredentialsSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  {t('email')}
                </label>
                <div className="relative">
                  <Mail className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} size={18} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                    placeholder={t('email_placeholder')}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-slate-300 mb-2">
                  {t('password')}
                </label>
                <div className="relative">
                  <Lock className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} size={18} />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`w-full py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none transition-all ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                    placeholder={t('password_placeholder')}
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white font-semibold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-[0.99]"
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>{t('loading')}</span>
                  </div>
                ) : (
                  <>
                    {t('login_step1')} 
                    <ArrowRight size={18} className={isRTL ? 'rotate-180' : ''} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              
              <div className="flex flex-col items-center justify-center space-y-4">
                 <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-full text-primary">
                    <MailCheck size={48} />
                 </div>
                 
                 <div className="text-center space-y-2">
                     <h3 className="text-lg font-bold text-gray-900 dark:text-white">{t('scan_qr')}</h3>
                     <p className="text-sm text-gray-500 dark:text-slate-400 leading-relaxed max-w-[280px] mx-auto">
                        {t('enter_code_below')}
                     </p>
                 </div>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div>
                  <div className="relative max-w-[240px] mx-auto">
                    <Smartphone className={`absolute top-1/2 -translate-y-1/2 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} size={18} />
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '');
                          if (val.length <= 6) setOtp(val);
                      }}
                      className={`w-full py-3 rounded-lg border border-gray-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none tracking-[0.5em] text-center text-xl font-mono ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'}`}
                      placeholder={t('otp_placeholder')}
                      maxLength={6}
                      required
                      autoFocus
                    />
                  </div>
                </div>
                
                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-primary to-indigo-600 hover:from-primary/90 hover:to-indigo-600/90 text-white font-semibold py-3.5 rounded-lg transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl active:scale-[0.99] disabled:opacity-70"
                >
                  {loading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      <span>{t('loading')}</span>
                    </div>
                  ) : (
                    <>
                      {t('verify_login')} 
                      <ArrowRight size={18} className={isRTL ? 'rotate-180' : ''} />
                    </>
                  )}
                </button>

                <div className="flex flex-col gap-3">
                    <button 
                      type="button"
                      disabled={resending}
                      onClick={handleResendOtp}
                      className="text-primary hover:text-indigo-700 text-sm font-bold flex items-center justify-center gap-2 transition-colors disabled:opacity-50"
                    >
                      {resending ? <RefreshCw className="animate-spin" size={16} /> : <RefreshCw size={16} />}
                      {t('show_qr_code')}
                    </button>
                    
                    <button 
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-full text-gray-500 hover:text-gray-700 dark:text-slate-400 dark:hover:text-slate-200 text-sm font-medium flex items-center justify-center gap-2 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-slate-900/50 transition-colors"
                    >
                      <ChevronLeft size={16} className={isRTL ? 'rotate-180' : ''} /> 
                      {t('back_to_login')}
                    </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
