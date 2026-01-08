

import React from 'react';

export interface User {
  id: number | string;
  name: string;
  email: string;
  email_verified_at?: string | null;
  password?: string;
  phone: string | null;
  role: string;
  status?: 'active' | 'inactive' | 'suspended'; // active = >1 view/day logic handled in backend
  last_login_at?: string | null;
  balance: number | string;
  affiliate_balance?: number | string;
  affiliate_code: string;
  referred_by?: string | null;
  otp?: string;
  is_verified?: number; // 0 = Frozen, 1 = Active
  remember_token?: string | null;
  profile_image?: string | null;
  address?: string | null;
  created_at: string;
  updated_at?: string;
  
  // Specific Regt Requirements
  age?: number | string;
  gender?: 'male' | 'female' | string;
  referrals_count?: number; // New key from backend
  team_size?: number; // Legacy/Fallback
  tier?: 'Bronze' | 'Silver' | 'Gold' | 'Diamond'; 
  
  // Banking
  country?: string;
  iban?: string;
  bank_name?: string;
  swift_code?: string;
  wallet_address?: string; // USDT
  wallet?: string;
  wallet_provider?: string;
}

export interface UserEmail {
  id: number | string;
  email: string;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'active' | 'inactive';
  last_login: string;
}

export interface Withdrawal {
  id: number | string;
  transaction_id?: string;
  user_id: number | string;
  username: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  amount: string | number;
  // Updated method type to include crypto and usdt for better platform compatibility
  method: 'bank' | 'bank_dollar' | 'wallet' | 'games' | 'crypto' | 'usdt'; 
  status: string; // 'pending' | 'confirmed' | 'rejected'
  type_withdraw: string; // 'affiliate' | 'profit_ads'
  note?: string | null; // Admin reason
  address?: string | null;
  wallet_address?: string | null;
  bank_name?: string | null;
  iban?: string | null;
  swift_code?: string | null;
  software?: string;
  country?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AuditLog {
  id: string;
  admin_id: string;
  action: string;
  entity_id: string;
  details: string;
  timestamp: string;
}

export interface Company {
  id: string | number;
  name: string;
  logo: string | null;
  type: string;
  status: 'active' | 'inactive';
  description: string | null;
  amount: string | number;
  url: string; // Admin dashboard link
  api_key?: string; // Extra info for admin
  created_at: string;
  updated_at?: string;
}

export interface Notification {
  id: string | number;
  user_id: string | number;
  username: string;
  title: string;
  message: string;
  is_read: number; 
  created_at: string;
  updated_at?: string;
}

export interface SystemConfig {
  id: string;
  key: string;
  label?: string;
  value: string;
  description?: string;
  updated_at: string;
}

export interface AdHistory {
  id: string | number;
  ad_id?: string | number;
  title?: string;
  type?: string;
  amount?: string | number;
  status?: string;
  created_at: string;
  [key: string]: any;
}

export interface UserAd {
  id: string | number;
  user_id: string | number;
  company_id: string | number;
  username?: string;
  company_name?: string;
  title?: string;
  description?: string;
  url?: string;
  type?: 'tasks' | 'survey'| 'ads';
  amount?: string | number;
  status?: string;
  views?: number;
  max_views?: number;
  created_at: string;
  [key: string]: any;
}

export interface ColumnDef<T> {
  key: keyof T | string;
  header: string;
  type?: 'text' | 'badge' | 'currency' | 'date';
  render?: (value: any, item: T) => React.ReactNode;
}

export interface FieldDef {
  name: string;
  label: string;
  type: 'text' | 'email' | 'select' | 'date' | 'number' | 'textarea';
  required?: boolean;
  options?: (string | { label: string; value: string | number })[];
  placeholder?: string;
}

export interface ChartData {
  name: string;
  value: number;
  uv?: number;
}
