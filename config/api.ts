
export const BASE_URL = 'https://api.regtai.com';

export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/api/admin/v1/login',
    OTP: '/api/admin/v1/otp',
    ME: '/api/v1/auth/me',
    UPDATE_PROFILE: '/api/v1/auth/update-profile',
    CHANGE_PASSWORD: '/api/v1/auth/rest-password',
    
    // New Auth/OTP Routes
    VERIFY_EMAIL: '/api/v1/auth/verify-email',
    RESEND_OTP: '/api/v1/auth/resend-otp',
    FORGOT_PASSWORD: '/api/v1/auth/forget-password',
    RESET_PASSWORD: '/api/v1/auth/rest-password',
    // Added missing PUSH_MONEY endpoint
    PUSH_MONEY: '/api/admin/v1/push-mony',
  },
  USERS: '/api/admin/v1/users',
  WITHDRAWALS: '/api/admin/v1/withdraws',
  STATS: '/api/admin/v1/dashboard',
  AUDIT: '/api/admin/v1/audit',
  SETTINGS: '/api/admin/v1/settings',
  COMPANIES: '/api/admin/v1/companies',
  NOTIFICATIONS: '/api/admin/v1/notifications',
  MY_AFFILIATE: '/api/admin/v1/my-affiliate',
  ALL_EMAILS: '/api/admin/v1/all-emails',
  USER_ADS: '/api/admin/v1/user_with_ads',
};
