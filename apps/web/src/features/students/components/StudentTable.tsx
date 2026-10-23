import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { Table } from '@/components/ui/heroui-table';
import type { StudentRecord } from '../types';
import { MemberActionsMenu } from '@/features/shared';

export interface StudentTableProps {
  students: StudentRecord[];
  loading: boolean;
  classFieldLabel?: string;
  onEdit: (student: StudentRecord) => void;
  onView: (student: StudentRecord) => void;
  onDelete: (student: StudentRecord) => void;
  isFilterActive?: boolean;
  onResetFilters?: () => void;
}

export const StudentTable: React.FC<StudentTableProps> = ({
  students,
  loading,
  classFieldLabel = 'Department',
  onEdit,
  onView,
  onDelete,
  isFilterActive,
  onResetFilters,
}) => {
  if (loading) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center text-sm text-zinc-500">
        Loading students...
      </div>
    );
  }

  if (students.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center space-y-2">
        <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
          No student records found
        </p>
        <p className="text-xs text-zinc-500 max-w-sm mx-auto">
          No matching students found. Adjust your search keywords or clear your active filters.
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
        <Table.Content aria-label="Student records table" className="min-w-[800px]">
          <Table.Header>
              <Table.Column isRowHeader>Student Details</Table.Column>
              <Table.Column>{classFieldLabel}</Table.Column>
              <Table.Column>Academic Year</Table.Column>
              <Table.Column>Contact</Table.Column>
              <Table.Column>Blood Group</Table.Column>
              <Table.Column>Status</Table.Column>
              <Table.Column className="text-right">Actions</Table.Column>
            </Table.Header>
            <Table.Body>
              {students.map((student) => (
                <Table.Row key={student.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-850/60">
                  {/* Student Details */}
                  <Table.Cell>
                    <div className="flex items-center gap-3">
                      {student.photoUrl ? (
                        <img
                          src={student.photoUrl}
                          alt={student.studentName}
                          className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shadow-2xs shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300 shrink-0">
                          {student.studentName.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                          {student.studentName}
                        </p>
                        <p className="text-xs text-zinc-500 font-mono">
                          {student.admissionId || student.studentId}
                        </p>
                      </div>
                    </div>
                  </Table.Cell>

                  {/* Department */}
                  <Table.Cell>
                    <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                      {student.department || 'General'}
                    </span>
                  </Table.Cell>

                  {/* Academic Year */}
                  <Table.Cell>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      {student.academicYear}
                    </span>
                  </Table.Cell>

                  {/* Contact */}
                  <Table.Cell>
                    <div className="text-xs space-y-0.5">
                      {student.studentMobile && (
                        <p className="font-mono text-zinc-800 dark:text-zinc-200">
                          {student.studentMobile}
                        </p>
                      )}
                      {student.parentMobile && !student.studentMobile && (
                        <p className="font-mono text-zinc-800 dark:text-zinc-200">
                          {student.parentMobile}
                        </p>
                      )}
                      {!student.studentMobile && !student.parentMobile && (
                        <span className="text-zinc-400 text-xs">N/A</span>
                      )}
                    </div>
                  </Table.Cell>

                  {/* Blood Group */}
                  <Table.Cell>
                    {student.bloodGroup ? (
                      <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-semibold">
                        {student.bloodGroup}
                      </span>
                    ) : (
                      <span className="text-zinc-400 text-xs">-</span>
                    )}
                  </Table.Cell>

                  {/* Status Badge */}
                  <Table.Cell>
                    {student.status === 'Active' ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                        <CheckCircle2 className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                        {student.status}
                      </span>
                    )}
                  </Table.Cell>

                  {/* Actions */}
                  <Table.Cell className="w-32">
                    <div className="flex justify-end">
                      <MemberActionsMenu
                        onEdit={() => onEdit(student)}
                        onView={() => onView(student)}
                        onDelete={() => onDelete(student)}
                      />
                    </div>
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
