import React from 'react';
import { Activity, ShieldCheck, UserCheck, Key, AlertTriangle, Download } from 'lucide-react';

export const ActivityLogsView: React.FC = () => {
  const logs = [
    { id: 'log-1', event: 'Admin Session Initiated', actor: 'Admin Operations', ip: '192.168.1.104', timestamp: '2026-10-15 13:42:01', level: 'INFO', icon: ShieldCheck },
    { id: 'log-2', event: 'User Account Created (david.m)', actor: 'Admin Operations', ip: '192.168.1.104', timestamp: '2026-10-15 12:15:30', level: 'INFO', icon: UserCheck },
    { id: 'log-3', event: 'API Key Generated for Webhook Engine', actor: 'Super Administrator', ip: '10.0.4.12', timestamp: '2026-10-15 10:04:19', level: 'WARN', icon: Key },
    { id: 'log-4', event: 'Rate Limit Warning on /v1/auth/tokens', actor: 'System Gateway', ip: '172.16.0.8', timestamp: '2026-10-14 23:51:12', level: 'WARN', icon: AlertTriangle },
    { id: 'log-5', event: 'Database Snapshot Export Completed', actor: 'System Worker', ip: 'internal', timestamp: '2026-10-14 18:00:00', level: 'INFO', icon: ShieldCheck },
  ];

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            Audit & Activity Logs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Immutable system audit logs tracking authentication, permission updates, and data mutations.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors shadow-sm self-start sm:self-auto">
          <Download className="w-4 h-4" />
          Export JSON
        </button>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden shadow-sm">
        <div className="divide-y divide-gray-100 dark:divide-gray-800">
          {logs.map((log) => {
            const Icon = log.icon;
            return (
              <div key={log.id} className="p-4 flex items-center justify-between gap-4 hover:bg-gray-50/50 dark:hover:bg-gray-800/20 transition-colors text-sm">
                <div className="flex items-center gap-3.5">
                  <div className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-gray-100">{log.event}</p>
                    <p className="text-xs text-gray-400 font-mono">Actor: {log.actor} • IP: {log.ip}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                    log.level === 'WARN' 
                      ? 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200' 
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                  }`}>
                    {log.level}
                  </span>
                  <p className="text-xs text-gray-400 font-mono mt-1">{log.timestamp}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
