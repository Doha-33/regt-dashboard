
import { ColumnDef, User, Withdrawal, AuditLog, Company, Notification } from '../types';

export const USER_COLUMNS: ColumnDef<User>[] = [
  { key: 'name', header: 'Name', type: 'text' },
  { key: 'email', header: 'Email', type: 'text' },
  { key: 'tier', header: 'Tier', type: 'badge' },
  { key: 'balance', header: 'Balance', type: 'currency' },
  { key: 'status', header: 'Status', type: 'badge' },
  { key: 'country', header: 'Country', type: 'text' },
  { key: 'created_at', header: 'Registered', type: 'date' },
];

export const WITHDRAWAL_COLUMNS: ColumnDef<Withdrawal>[] = [
  { key: 'username', header: 'User', type: 'text' },
  { key: 'amount', header: 'Amount', type: 'currency' },
  { key: 'method', header: 'Method', type: 'badge' },
  { key: 'status', header: 'Status', type: 'badge' },
  { key: 'created_at', header: 'Requested', type: 'date' },
];

export const AUDIT_COLUMNS: ColumnDef<AuditLog>[] = [
  { key: 'action', header: 'Action', type: 'badge' },
  { key: 'admin_id', header: 'Admin', type: 'text' },
  { key: 'entity_id', header: 'Target ID', type: 'text' },
  { key: 'timestamp', header: 'Time', type: 'date' },
];

export const COMPANY_COLUMNS: ColumnDef<Company>[] = [
  { key: 'name', header: 'Company Name', type: 'text' },
  { key: 'type', header: 'Type', type: 'text' },
  { key: 'amount', header: 'Amount/Cost', type: 'currency' },
  { key: 'url', header: 'URL', type: 'text' },
  { key: 'status', header: 'Status', type: 'badge' },
];

export const NOTIFICATION_COLUMNS: ColumnDef<Notification>[] = [
  { key: 'username', header: 'User', type: 'text' },
  { key: 'title', header: 'Title', type: 'text' },
  { key: 'message', header: 'Message', type: 'text' },
  { key: 'is_read', header: 'Read', type: 'badge' },
  { key: 'created_at', header: 'Date', type: 'date' },
];
