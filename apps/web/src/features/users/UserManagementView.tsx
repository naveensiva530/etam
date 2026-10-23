import React, { useState } from 'react';
import { 
  Search, 
  UserPlus, 
  MoreHorizontal, 
  Shield, 
  Filter, 
  Mail,
  CheckCircle2,
  Clock,
  Ban
} from 'lucide-react';
import { Table } from '@/components/ui/heroui-table';
interface ManagedUser {
  id: string;
  name: string;
  email: string;
  role: 'Superadmin' | 'Admin' | 'Developer' | 'Editor' | 'Viewer';
  status: 'Active' | 'Pending' | 'Suspended';
  department: string;
  lastActive: string;
}

const mockUsers: ManagedUser[] = [
  { id: '1', name: 'Arunachalam', email: 'arun@e-tam.internal', role: 'Superadmin', status: 'Active', department: 'Engineering', lastActive: 'Just now' },
  { id: '2', name: 'Priya Sharma', email: 'priya.s@e-tam.internal', role: 'Admin', status: 'Active', department: 'Operations', lastActive: '5m ago' },
  { id: '3', name: 'David Miller', email: 'david.m@e-tam.internal', role: 'Admin', status: 'Active', department: 'Product', lastActive: '1h ago' },
  { id: '4', name: 'Kavitha Rao', email: 'kavitha.r@e-tam.internal', role: 'Developer', status: 'Active', department: 'Engineering', lastActive: '3h ago' },
  { id: '5', name: 'Marcus Vance', email: 'marcus.v@e-tam.internal', role: 'Editor', status: 'Pending', department: 'Design', lastActive: 'Never' },
  { id: '6', name: 'Elena Rostova', email: 'elena.r@e-tam.internal', role: 'Viewer', status: 'Suspended', department: 'Legal', lastActive: '4d ago' },
];

export const UserManagementView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState('All');

  const filteredUsers = mockUsers.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'All' || u.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200 dark:border-gray-800">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-gray-100">
            User Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Complete administrative directory of internal accounts, credentials, and access roles.
          </p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 transition-colors shadow-sm self-start md:self-auto">
          <UserPlus className="w-4 h-4" />
          Create Account
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:focus:ring-gray-100"
          />
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          <Filter className="w-4 h-4 text-gray-400" />
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 px-3 py-2 focus:outline-none"
          >
            <option value="All">All Roles</option>
            <option value="Superadmin">Superadmin</option>
            <option value="Admin">Admin</option>
            <option value="Developer">Developer</option>
            <option value="Editor">Editor</option>
            <option value="Viewer">Viewer</option>
          </select>
        </div>
      </div>

      <div className="w-full">
        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-500">
            No users found matching filter.
          </div>
        ) : (
          <Table>
            <Table.ScrollContainer>
              <Table.Content aria-label="Internal users table" className="min-w-[650px]">
                <Table.Header>
                  <Table.Column isRowHeader>User</Table.Column>
                  <Table.Column>Role</Table.Column>
                  <Table.Column>Department</Table.Column>
                  <Table.Column>Status</Table.Column>
                  <Table.Column>Last Active</Table.Column>
                  <Table.Column>Actions</Table.Column>
                </Table.Header>
                <Table.Body>
                  {filteredUsers.map((user) => (
                    <Table.Row key={user.id}>
                      <Table.Cell>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center font-semibold text-xs text-gray-700 dark:text-gray-300">
                            {user.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">{user.name}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {user.email}
                            </p>
                          </div>
                        </div>
                      </Table.Cell>
                      <Table.Cell>
                        <span className="inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200">
                          <Shield className="w-3 h-3 text-gray-400" />
                          {user.role}
                        </span>
                      </Table.Cell>
                      <Table.Cell>{user.department}</Table.Cell>
                      <Table.Cell>
                        {user.status === 'Active' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Active
                          </span>
                        )}
                        {user.status === 'Pending' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                            <Clock className="w-3.5 h-3.5" /> Pending
                          </span>
                        )}
                        {user.status === 'Suspended' && (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400">
                            <Ban className="w-3.5 h-3.5" /> Suspended
                          </span>
                        )}
                      </Table.Cell>
                      <Table.Cell className="text-xs text-gray-500">{user.lastActive}</Table.Cell>
                      <Table.Cell>
                        <button className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200">
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Content>
            </Table.ScrollContainer>
          </Table>
        )}
      </div>
    </div>
  );
};
