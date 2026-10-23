import React from 'react';
import { ShieldAlert, Key, Database, RefreshCw, AlertTriangle, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const SuperadminGovernanceView: React.FC = () => {
  const { isSuperAdmin } = useAuth();

  if (!isSuperAdmin) {
    return (
      <div className="p-8 max-w-2xl mx-auto my-12 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto text-gray-700 dark:text-gray-300">
          <Lock className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
          Superadmin Authorization Required
        </h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          Root governance is restricted to an authorized platform account.
        </p>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div className="pb-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <ShieldAlert className="w-4 h-4" /> Root Governance Zone
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100 mt-1">
          Master Platform Governance
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Superadmin-exclusive controls: API secrets rotation, database schemas, and global tenant rules.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Root API Secret Keys</h3>
              <p className="text-xs text-gray-500">Key rotation & webhook signing secrets</p>
            </div>
          </div>
          <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-800 font-mono text-xs text-gray-600 dark:text-gray-400 flex items-center justify-between">
            <span>sk_live_994829...f91a</span>
            <button className="text-gray-900 dark:text-gray-100 font-sans font-medium text-xs hover:underline">
              Rotate Key
            </button>
          </div>
        </div>

        <div className="p-5 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Database Schema Migration</h3>
              <p className="text-xs text-gray-500">Run safe schema updates across clusters</p>
            </div>
          </div>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-gray-500">Latest revision: v2.4.1 (Clean)</span>
            <button className="px-3 py-1.5 rounded-lg border border-gray-200 dark:border-gray-800 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-800">
              Check Migrations
            </button>
          </div>
        </div>
      </div>

      <div className="p-6 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 space-y-4">
        <div className="flex items-center gap-2 text-xs font-semibold text-gray-700 dark:text-gray-300">
          <AlertTriangle className="w-4 h-4" /> Danger Zone Actions
        </div>
        <p className="text-xs text-gray-500">
          These actions affect the global platform runtime and can cause immediate service disruption.
        </p>
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-800">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">Emergency Maintenance Lock</p>
            <p className="text-xs text-gray-400">Lock out all non-admin access and freeze API requests.</p>
          </div>
          <button className="px-3.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-850">
            Activate Lockdown
          </button>
        </div>
      </div>
    </div>
  );
};
