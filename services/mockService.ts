
import { AdminUser, User, ColumnDef, FieldDef } from '../types';
import { USER_COLUMNS } from '../config/columns';
import { mockDb } from './mockDb';

export const getAdminColumns = (): ColumnDef<AdminUser>[] => [
  { key: 'name', header: 'Name', type: 'text' },
  { key: 'email', header: 'Email', type: 'text' },
  { key: 'role', header: 'Role', type: 'badge' },
  { key: 'status', header: 'Status', type: 'badge' },
  { key: 'last_login', header: 'Last Login', type: 'date' },
];

export const getAdminFields = (): FieldDef[] => [
  { name: 'name', label: 'Full Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'role', label: 'Role', type: 'select', options: ['admin', 'superadmin', 'editor'], required: true },
  { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive'], required: true },
];

export const getUserColumns = (): ColumnDef<User>[] => USER_COLUMNS;

export const getUserFields = (): FieldDef[] => [
  { name: 'name', label: 'Full Name', type: 'text', required: true },
  { name: 'email', label: 'Email', type: 'email', required: true },
  { name: 'phone', label: 'Phone', type: 'text', required: false },
  { name: 'role', label: 'Role', type: 'select', options: ['user', 'admin'], required: true },
  { name: 'status', label: 'Status', type: 'select', options: ['active', 'inactive', 'suspended'], required: true },
  { name: 'tier', label: 'Tier', type: 'select', options: ['Bronze', 'Silver', 'Gold', 'Diamond'], required: true },
  { name: 'country', label: 'Country', type: 'text', required: true },
];

export const MockApi = {
  fetchAdmins: async (): Promise<AdminUser[]> => {
    // Mock admin data
    return [
      { id: '1', name: 'Super Admin', email: 'admin@riget.com', role: 'superadmin', status: 'active', last_login: new Date().toISOString() },
      { id: '2', name: 'John Doe', email: 'john@riget.com', role: 'admin', status: 'active', last_login: new Date(Date.now() - 86400000).toISOString() },
      { id: '3', name: 'Jane Smith', email: 'jane@riget.com', role: 'editor', status: 'inactive', last_login: new Date(Date.now() - 172800000).toISOString() },
    ];
  },
  fetchUsers: async (): Promise<User[]> => {
    return [...mockDb.users];
  }
};