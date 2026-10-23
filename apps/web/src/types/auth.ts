export type UserRole = 'superadmin' | 'admin' | 'staff' | 'student';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  role: UserRole;
  department?: string;
}

export interface NavItemRoleConfig {
  id: string;
  label: string;
  icon: any;
  allowedRoles: UserRole[];
  description?: string;
  badge?: string;
}
