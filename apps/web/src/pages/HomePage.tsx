import * as React from 'react';
import { SidebarWithTabs, NavItem } from '@/components/ui/sidebar-with-chrome-like-tabs';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/context/AuthContext';
import { useInstitution } from '@/context/InstitutionContext';
import { ALL_NAV_ITEMS } from '@/constants/navigation';

import { AdminDashboardView } from '@/features/dashboard/AdminDashboardView';
import { GraduationCap, LogOut, Shield, Layers, Loader2, Calendar } from 'lucide-react';

const StudentManagementPage = React.lazy(() =>
  import('@/features/students/StudentManagementPage').then((m) => ({ default: m.StudentManagementPage }))
);
const StaffManagementPage = React.lazy(() =>
  import('@/features/staff/StaffManagementPage').then((m) => ({ default: m.StaffManagementPage }))
);
const AcademicConfigPage = React.lazy(() =>
  import('@/features/academic-config').then((m) => ({ default: m.AcademicConfigPage }))
);
const SuperadminGovernanceView = React.lazy(() =>
  import('@/features/governance/SuperadminGovernanceView').then((m) => ({ default: m.SuperadminGovernanceView }))
);
const TimetablePage = React.lazy(() =>
  import('@/features/timetable').then((m) => ({ default: m.TimetablePage }))
);

const ViewLoader = () => (
  <div className="flex h-96 w-full items-center justify-center">
    <div className="flex flex-col items-center gap-2 text-zinc-400">
      <Loader2 className="h-6 w-6 animate-spin text-zinc-600 dark:text-zinc-300" />
      <span className="text-xs font-medium">Loading view...</span>
    </div>
  </div>
);

export default function HomePage() {
  const { role, user, logout, canAccess } = useAuth();
  const { institutionType, institutionName } = useInstitution();

  if (!user) return null;

  const accessibleNavConfigs = React.useMemo(() => {
    return ALL_NAV_ITEMS.filter((item) => canAccess(item.allowedRoles));
  }, [canAccess]);

  const navItems: NavItem[] = React.useMemo(() => {
    return [
      ...accessibleNavConfigs.map((item) => ({
        id: item.id,
        label: item.label,
        icon: item.icon,
      })),
      ...(accessibleNavConfigs.some((item) => item.id === 'settings')
        ? [
            {
              id: 'timetable-config',
              label: 'Time table Configuration',
              icon: Calendar,
              hiddenFromSidebar: true,
            },
            {
              id: 'subject-allocation',
              label: 'Subject Allocation',
              icon: GraduationCap,
              hiddenFromSidebar: true,
            },
            {
              id: 'subject-master',
              label: 'Subject Master',
              icon: Layers,
              hiddenFromSidebar: true,
            },
          ]
        : []),
    ];
  }, [accessibleNavConfigs]);

  const renderContent = (navId: string) => {
    return (
      <React.Suspense fallback={<ViewLoader />}>
        {(() => {
          switch (navId) {
            case 'dashboard':
              return <AdminDashboardView />;
            case 'student-management':
              return <StudentManagementPage />;
            case 'staff-management':
              return <StaffManagementPage />;
            case 'timetable-config':
              return <TimetablePage />;
            case 'settings':
            case 'academic-config':
              return <AcademicConfigPage initialView="list" />;
            case 'subject-allocation':
              return <AcademicConfigPage initialView="allocation" />;
            case 'subject-master':
              return <AcademicConfigPage initialView="master" />;
            case 'superadmin-root':
              return <SuperadminGovernanceView />;
            default:
              return <AdminDashboardView />;
          }
        })()}
      </React.Suspense>
    );
  };

  return (
    <SidebarWithTabs
      companyName={institutionName || 'E-tam Portal'}
      navItems={navItems}
      renderContent={renderContent}
      defaultNavId="dashboard"
      footer={
        <div className="flex flex-col gap-2 p-2 rounded-xl bg-gray-100 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700/60 w-full transition-all">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 border border-gray-300 dark:border-gray-600">
              <AvatarImage
                src={user.avatar}
                alt={user.name}
                className="object-cover"
              />
              <AvatarFallback className="text-xs font-bold uppercase">
                {user.email.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5">
                <p className="text-xs font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {user.name}
                </p>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-flex items-center gap-1 rounded bg-gray-200 px-1.5 py-0.2 text-[10px] font-bold uppercase tracking-wider text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  <Shield className="h-2.5 w-2.5" /> {role.toUpperCase()}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700 truncate">
                  {institutionType}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={logout}
            className="mt-1 flex w-full items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2 py-1.5 text-[11px] font-medium text-gray-700 shadow-2xs transition-colors hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-850"
          >
            <LogOut className="h-3 w-3 text-gray-400" />
            Sign out
          </button>
        </div>
      }
    />
  );
}
