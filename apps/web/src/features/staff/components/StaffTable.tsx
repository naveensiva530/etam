import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Table } from '@/components/ui/heroui-table';
import type { StaffRecord } from '../types';
import { MemberActionsMenu } from '@/features/shared';

export interface StaffTableProps {
  staffList: StaffRecord[];
  loading: boolean;
  onEdit: (staff: StaffRecord) => void;
  onView: (staff: StaffRecord) => void;
  onDelete: (staff: StaffRecord) => void;
  isFilterActive?: boolean;
  onResetFilters?: () => void;
}

export const StaffTable: React.FC<StaffTableProps> = ({
  staffList,
  loading,
  onEdit,
  onView,
  onDelete,
  isFilterActive,
  onResetFilters,
}) => {
  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center text-sm text-zinc-500">
        Loading staff...
      </div>
    );
  }

  if (staffList.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center space-y-2">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          No staff records found
        </p>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          No matching staff members found. Adjust your search keywords or clear your active filters.
        </p>
        {isFilterActive && onResetFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
          >
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
      <Table>
        <Table.ScrollContainer>
          <Table.Content aria-label="Staff records table" className="min-w-[800px]">
            <Table.Header>
              <Table.Column isRowHeader>Staff Details</Table.Column>
              <Table.Column>Department</Table.Column>
              <Table.Column>Designation / Role</Table.Column>
              <Table.Column>Contact</Table.Column>
              <Table.Column>Blood Group</Table.Column>
              <Table.Column>Status</Table.Column>
              <Table.Column className="text-right">Actions</Table.Column>
            </Table.Header>
            <Table.Body>
              {staffList.map((staff) => (
                <Table.Row key={staff.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-850/60">
                  {/* Staff Details */}
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      {staff.photoUrl ? (
                        <img
                          src={staff.photoUrl}
                          alt={staff.name}
                          className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300 shrink-0">
                          {staff.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                          {staff.name}
                        </p>
                        <p className="text-xs text-zinc-500 font-mono">
                          {staff.staffId}
                        </p>
                      </div>
                    </div>
                  </Table.Cell>

                  {/* Department */}
                  <Table.Cell>
                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      {staff.department || 'General'}
                    </span>
                  </Table.Cell>

                  {/* Role */}
                  <Table.Cell>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      {staff.role}
                    </span>
                  </Table.Cell>

                  {/* Contact */}
                  <Table.Cell>
                    <div className="text-xs space-y-0.5">
                      {staff.mobile && (
                        <p className="font-mono text-zinc-800 dark:text-zinc-200">
                          {staff.mobile}
                        </p>
                      )}
                      {staff.email && (
                        <p className="text-[11px] text-zinc-500">
                          {staff.email}
                        </p>
                      )}
                      {!staff.mobile && !staff.email && (
                        <span className="text-zinc-400 text-xs">N/A</span>
                      )}
                    </div>
                  </Table.Cell>

                  {/* Blood Group */}
                  <Table.Cell>
                    {staff.bloodGroup ? (
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-semibold">
                        {staff.bloodGroup}
                      </span>
                    ) : (
                      <span className="text-zinc-400 text-xs">-</span>
                    )}
                  </Table.Cell>

                  {/* Status Badge */}
                  <Table.Cell>
                    {staff.status === 'Active' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                        {staff.status}
                      </span>
                    )}
                  </Table.Cell>

                  {/* Actions */}
                  <Table.Cell className="text-right">
                    <MemberActionsMenu
                      onEdit={() => onEdit(staff)}
                      onView={() => onView(staff)}
                      onDelete={() => onDelete(staff)}
                    />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
      </Table>
    </div>
  );
};
