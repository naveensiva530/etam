import React from 'react';
import { 
  Users, 
  Activity, 
  ShieldCheck, 
  HardDrive, 
  ArrowUpRight, 
  ArrowDownRight,
  UserPlus,
  FileSpreadsheet,
  RefreshCw,
  AlertCircle
} from 'lucide-react';

export const AdminDashboardView: React.FC = () => {
  const stats = [
    {
      title: 'Total Managed Users',
      value: '1,428',
      change: '+12.4%',
      isPositive: true,
      icon: Users,
    },
    {
      title: 'System Health',
      value: '99.98%',
      change: 'Normal',
      isPositive: true,
      icon: ShieldCheck,
    },
    {
      title: 'Active Operations',
      value: '482',
      change: '+5.2%',
      isPositive: true,
      icon: Activity,
    },
    {
      title: 'Storage Utilization',
      value: '64.2%',
      change: '-1.1%',
      isPositive: true,
      icon: HardDrive,
    },
  ];

  const recentLogs = [
    { id: 1, action: 'User role updated to Manager', target: 'sarah.c@company.com', time: '4 mins ago', admin: 'Admin' },
    { id: 2, action: 'Project permissions modified', target: 'Project E-tam Alpha', time: '18 mins ago', admin: 'Admin' },
    { id: 3, action: 'Exported quarterly activity ledger', target: 'System', time: '1 hour ago', admin: 'Admin' },
    { id: 4, action: 'New team member invited', target: 'dev.kumar@company.com', time: '3 hours ago', admin: 'Admin' },
  ];

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-6 bg-white dark:bg-zinc-950 min-h-screen text-zinc-900 dark:text-zinc-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
              Admin Control Center
            </h1>
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">
              Full Admin Mode
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Real-time management dashboard with operational access across all modules.
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button className="inline-flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-semibold rounded-lg bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300 transition-colors">
            <UserPlus className="w-3.5 h-3.5" />
            Invite User
          </button>
          <button className="inline-flex items-center gap-1.5 px-2.5 py-2 text-[11px] font-semibold rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Report
          </button>
        </div>
      </div>

      <section className="space-y-2">
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
          Dashboard Statistics
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-2">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="min-w-0 flex items-center gap-2.5 px-3 py-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
            >
              <div className="w-8 h-8 shrink-0 flex items-center justify-center rounded-lg bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200">
                <Icon className="w-4 h-4" />
              </div>
              <div className="min-w-0 flex-1 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{stat.title}</p>
                  <p className="text-base font-bold tracking-tight text-zinc-900 dark:text-zinc-100">{stat.value}</p>
                </div>
                <span
                  className={`shrink-0 inline-flex items-center text-[10px] font-semibold ${
                    stat.isPositive ? 'text-zinc-700 dark:text-zinc-300' : 'text-zinc-500'
                  }`}
                >
                  {stat.isPositive ? <ArrowUpRight className="w-3 h-3 mr-0.5" /> : <ArrowDownRight className="w-3 h-3 mr-0.5" />}
                  {stat.change}
                </span>
              </div>
            </div>
          );
        })}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="lg:col-span-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              Recent Administrative Actions
            </h2>
            <button className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 flex items-center gap-1 font-medium">
              <RefreshCw className="w-3 h-3" /> Refresh
            </button>
          </div>
          <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {recentLogs.map((log) => (
              <div key={log.id} className="py-2.5 flex items-center justify-between gap-3 text-sm">
                <div>
                  <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200">{log.action}</p>
                  <p className="text-[11px] text-zinc-400 dark:text-zinc-500">{log.target}</p>
                </div>
                <div className="text-right">
                  <span className="text-[11px] text-zinc-500">{log.time}</span>
                  <p className="text-[10px] font-medium text-zinc-400">by {log.admin}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Operational Status
          </h2>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">API Gateway</span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">24ms</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Auth Service</span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">Active</span>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 rounded-full bg-zinc-900 dark:bg-zinc-100" />
                <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Background Jobs</span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">0 pending</span>
            </div>
          </div>

          <div>
            <div className="p-3 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/40 text-[11px] text-zinc-600 dark:text-zinc-400 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-zinc-700 dark:text-zinc-300 shrink-0 mt-0.5" />
              <span>Full Admin privileges are active. You have complete operational access to users, content, projects, and logs.</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};
