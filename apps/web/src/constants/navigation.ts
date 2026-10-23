import {
  Home,
  GraduationCap,
  Briefcase,
  Sliders,
  ShieldAlert,
} from 'lucide-react';
import { NavItemRoleConfig } from '@/types/auth';

export const ALL_NAV_ITEMS: NavItemRoleConfig[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: Home,
    allowedRoles: ['admin', 'superadmin'],
    description: 'Operational overview, stats, and real-time metrics',
  },
  {
    id: 'student-management',
    label: 'Student Management',
    icon: GraduationCap,
    allowedRoles: ['admin', 'superadmin'],
    description: 'Manage student records, onboarding, and attendance-ready profiles',
  },
  {
    id: 'staff-management',
    label: 'Staff Management',
    icon: Briefcase,
    allowedRoles: ['admin', 'superadmin'],
    description: 'Manage staff records, onboarding, and teaching profiles',
  },
  {
    id: 'settings',
    label: 'Setting',
    icon: Sliders,
    allowedRoles: ['admin', 'superadmin'],
    description: 'Preferences, role switcher, and portal configuration',
  },
  {
    id: 'superadmin-root',
    label: 'Superadmin Root',
    icon: ShieldAlert,
    allowedRoles: ['superadmin'],
    description: 'Master platform governance, API secrets, and emergency lockdown',
    badge: 'Root',
  },
];
