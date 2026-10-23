import React, { useState, useMemo, useRef } from 'react';
import {
  BookOpen,
  CheckCircle2,
  UserX,
  Search,
  Plus,
  Upload,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { Table } from '@/components/ui/heroui-table';
import { deleteSubjectMasterRecord, updateSubjectMasterRecord } from '../api';
import type { SubjectMasterRecord, SubjectTypeOption } from '../types';
import { SubjectFormModal } from './SubjectFormModal';
import { BulkSubjectUploadModal } from './BulkSubjectUploadModal';
import { MemberActionsMenu } from '@/features/shared';

interface SubjectMasterViewProps {
  subjects: SubjectMasterRecord[];
  onSubjectsChange: (subjects: SubjectMasterRecord[]) => void;
  types: SubjectTypeOption[];
  onTypesChange: (types: SubjectTypeOption[]) => void;
  showToast: (msg: string) => void;
}

export const SubjectMasterView: React.FC<SubjectMasterViewProps> = ({
  subjects,
  onSubjectsChange,
  types,
  onTypesChange,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | SubjectMasterRecord['status']>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [editingSubject, setEditingSubject] = useState<SubjectMasterRecord | null>(null);
  const [viewingSubject, setViewingSubject] = useState<SubjectMasterRecord | null>(null);

  const activeCount = useMemo(() => subjects.filter((s) => s.status === 'Active').length, [subjects]);
  const inactiveCount = useMemo(() => subjects.filter((s) => s.status === 'Inactive').length, [subjects]);

  const filteredSubjects = useMemo(() => {
    return subjects.filter((s) => {
      const q = searchQuery.toLowerCase();
      const matchSearch = s.code.toLowerCase().includes(q) || s.name.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || s.status === statusFilter;
      const matchType = typeFilter === 'all' || s.type === typeFilter;
      return matchSearch && matchStatus && matchType;
    });
  }, [subjects, searchQuery, statusFilter, typeFilter]);

  const handleDelete = async (id: string, code: string) => {
    if (!window.confirm(`Delete subject "${code}" from Subject Master?`)) return;
    try {
      await deleteSubjectMasterRecord(id);
      onSubjectsChange(subjects.filter((s) => s.id !== id));
      showToast(`Subject ${code} removed.`);
    } catch {
      showToast('Unable to delete subject. It may be allocated to existing sections.');
    }
  };

  const handleStatusToggle = async (subject: SubjectMasterRecord) => {
    const status = subject.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const updated = await updateSubjectMasterRecord(subject.id, {
        code: subject.code,
        name: subject.name,
        type: subject.type,
        status,
        description: subject.description,
      });
      onSubjectsChange(subjects.map((item) => item.id === updated.id ? updated : item));
      showToast(`Subject ${updated.code} marked ${updated.status.toLowerCase()}.`);
    } catch (error) {
      showToast(error instanceof Error ? error.message : `Unable to mark subject ${status.toLowerCase()}.`);
    }
  };

  return (
    <div className="space-y-5 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Subject Master
        </h1>
      </div>

      {/* Summary Cards */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`w-48 sm:w-52 px-3.5 py-2.5 rounded-xl border text-left flex items-center gap-3 transition-all shadow-2xs ${statusFilter === 'all'
              ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900 dark:ring-zinc-100'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
        >
          <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-2xs">
            <BookOpen className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 leading-tight">
              Total Subjects
            </p>
            <p className="text-2xl font-extrabold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight mt-0.5">
              {String(subjects.length).padStart(2, '0')}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Active')}
          className={`w-48 sm:w-52 px-3.5 py-2.5 rounded-xl border text-left flex items-center gap-3 transition-all shadow-2xs ${statusFilter === 'Active'
              ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900 dark:ring-zinc-100'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
        >
          <div className="w-9 h-9 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 flex items-center justify-center shrink-0">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 leading-tight">
              Active Subjects
            </p>
            <p className="text-2xl font-extrabold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight mt-0.5">
              {String(activeCount).padStart(2, '0')}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Inactive')}
          className={`w-48 sm:w-52 px-3.5 py-2.5 rounded-xl border text-left flex items-center gap-3 transition-all shadow-2xs ${statusFilter === 'Inactive'
              ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900 dark:ring-zinc-100'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
            }`}
        >
          <div className="w-9 h-9 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 flex items-center justify-center shrink-0">
            <UserX className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 leading-tight">
              Inactive Subjects
            </p>
            <p className="text-2xl font-extrabold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight mt-0.5">
              {String(inactiveCount).padStart(2, '0')}
            </p>
          </div>
        </button>
      </div>

      {/* Search and Action Toolbar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
        <div className="relative w-full sm:w-72 md:w-80">
          <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="search"
            placeholder="Search subjects..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <div className="relative" ref={filterRef}>
            <button
              type="button"
              onClick={() => setIsFilterOpen((o) => !o)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${isFilterOpen || statusFilter !== 'all' || typeFilter !== 'all'
                  ? 'bg-zinc-100 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700'
                  : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-2xs'
                }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filter
            </button>
            {isFilterOpen && (
              <div className="absolute right-0 top-full z-40 mt-2 w-64 rounded-xl border border-zinc-200 bg-white p-4 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                      Status
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                    >
                      <option value="all">All statuses</option>
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-zinc-600 dark:text-zinc-300 mb-1">
                      Type
                    </label>
                    <select
                      value={typeFilter}
                      onChange={(e) => setTypeFilter(e.target.value as any)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                    >
                      <option value="all">All types</option>
                      {types.map((type) => (
                        <option key={type.id} value={type.name}>{type.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={() => setIsBulkOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            Bulk Upload
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingSubject(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Subject
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="space-y-2">
        {filteredSubjects.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              No subjects found
            </p>
            <p className="text-xs text-zinc-500">
              {searchQuery || statusFilter !== 'all' || typeFilter !== 'all'
                ? 'No subjects match your search or filter.'
                : 'Create your first subject to start building your academic catalog.'}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
            <Table>
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header>
                    <Table.Column className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                      Subject Code
                    </Table.Column>
                    <Table.Column className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                      Subject Title
                    </Table.Column>
                    <Table.Column className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                      Type
                    </Table.Column>
                    <Table.Column className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                      Status
                    </Table.Column>
                    <Table.Column className="px-4 py-3 text-right text-xs font-semibold text-zinc-500">
                      Actions
                    </Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {filteredSubjects.map((sub) => (
                      <Table.Row key={sub.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <Table.Cell className="px-4 py-3 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {sub.code}
                        </Table.Cell>
                        <Table.Cell className="px-4 py-3 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                          {sub.name}
                        </Table.Cell>
                        <Table.Cell className="px-4 py-3 text-xs">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${sub.type === 'Core'
                              ? 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                              : sub.type === 'Elective'
                                ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300'
                                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                            }`}>
                            {sub.type}
                          </span>
                        </Table.Cell>
                        <Table.Cell className="px-4 py-3 text-xs">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${sub.status === 'Active'
                              ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}>
                            {sub.status}
                          </span>
                        </Table.Cell>
                        <Table.Cell className="w-32">
                          <div className="flex justify-end">
                            <MemberActionsMenu
                              viewActionLabel="View"
                              onView={() => setViewingSubject(sub)}
                              onEdit={() => {
                                setEditingSubject(sub);
                                setIsFormOpen(true);
                              }}
                              onDelete={() => void handleDelete(sub.id, sub.code)}
                              onStatusToggle={() => void handleStatusToggle(sub)}
                              statusActionLabel={sub.status === 'Active' ? 'Inactive' : 'Active'}
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
        )}
      </div>

      <SubjectFormModal
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingSubject(null);
        }}
        existingSubjects={subjects}
        types={types}
        subject={editingSubject}
        onTypesChange={(nextTypes) => {
          if (typeFilter !== 'all') {
            const previousType = types.find((item) => item.name === typeFilter);
            const updatedType = previousType && nextTypes.find((item) => item.id === previousType.id);
            if (updatedType) setTypeFilter(updatedType.name);
            else if (previousType) setTypeFilter('all');
          }
          onTypesChange(nextTypes);
        }}
        onSuccess={(saved) => {
          if (editingSubject) {
            onSubjectsChange(subjects.map((subject) => subject.id === saved.id ? saved : subject));
            showToast(`Subject ${saved.code} updated successfully.`);
          } else {
            onSubjectsChange([saved, ...subjects]);
            showToast(`Subject ${saved.code} added successfully.`);
          }
        }}
      />

      {viewingSubject && (
        <div
          className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setViewingSubject(null);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="subject-details-title"
            className="w-full max-w-md space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <div className="flex items-start justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
              <div>
                <h2 id="subject-details-title" className="text-sm font-bold">Subject Details</h2>
                <p className="mt-0.5 text-[11px] text-zinc-500">{viewingSubject.code}</p>
              </div>
              <button
                type="button"
                aria-label="Close subject details"
                onClick={() => setViewingSubject(null)}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <dt className="font-semibold text-zinc-500">Subject Name</dt>
                <dd className="mt-1 font-medium">{viewingSubject.name}</dd>
              </div>
              <div>
                <dt className="font-semibold text-zinc-500">Type</dt>
                <dd className="mt-1">{viewingSubject.type}</dd>
              </div>
              <div>
                <dt className="font-semibold text-zinc-500">Status</dt>
                <dd className="mt-1">{viewingSubject.status}</dd>
              </div>
            </dl>
            <div className="flex justify-end border-t border-zinc-100 pt-3 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setViewingSubject(null)}
                className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <BulkSubjectUploadModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        types={types}
        onSuccess={(created) => {
          onSubjectsChange([...created, ...subjects]);
          showToast(`Successfully uploaded ${created.length} subjects.`);
        }}
      />
    </div>
  );
};
