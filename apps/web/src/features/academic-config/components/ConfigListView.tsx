import React, { useState, useMemo } from 'react';
import {
  BookmarkPlus,
  GraduationCap,
  UserX,
  Search,
  Settings,
  SlidersHorizontal,
  Plus,
  Upload,
  BookOpen,
} from 'lucide-react';
import { Table } from '@/components/ui/heroui-table';
import { MemberActionsMenu } from '@/features/shared';
import type { AcademicConfigItem } from '../types';
import { BulkConfigUploadModal } from './BulkConfigUploadModal';
import { CreateAcademicConfigModal } from './CreateAcademicConfigModal';
import { createAcademicConfiguration, updateAcademicConfiguration, deleteAcademicConfiguration } from '../api';

interface ConfigListViewProps {
  configs: AcademicConfigItem[];
  onConfigsChange: (configs: AcademicConfigItem[]) => void;
  onSelectConfig: (config: AcademicConfigItem) => void;
  onOpenMasterView: () => void;
  showToast: (msg: string) => void;
}

export const ConfigListView: React.FC<ConfigListViewProps> = ({
  configs,
  onConfigsChange,
  onSelectConfig,
  onOpenMasterView,
  showToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Active' | 'Inactive'>('all');
  const [academicYearFilter, setAcademicYearFilter] = useState('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingConfigId, setEditingConfigId] = useState<string | null>(null);

  const [formYear, setFormYear] = useState('');
  const [formClass, setFormClass] = useState('');
  const [formSubCategory, setFormSubCategory] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Inactive'>('Active');
  const [validationErrors, setValidationErrors] = useState<{
    academicYear?: string;
    className?: string;
    status?: string;
  }>({});

  const academicYearOptions = useMemo(() => {
    return Array.from(new Set(configs.map((c) => c.academicYear))).sort().reverse();
  }, [configs]);

  const activeConfigsCount = useMemo(() => configs.filter((c) => c.status === 'Active').length, [configs]);
  const inactiveConfigsCount = useMemo(() => configs.filter((c) => c.status === 'Inactive').length, [configs]);

  const filteredConfigs = useMemo(() => {
    return configs.filter((c) => {
      const q = searchQuery.toLowerCase();
      const matchSearch =
        c.className.toLowerCase().includes(q) ||
        (c.subCategory && c.subCategory.toLowerCase().includes(q)) ||
        c.academicYear.toLowerCase().includes(q);
      const matchStatus = statusFilter === 'all' || c.status === statusFilter;
      const matchYear = academicYearFilter === 'all' || c.academicYear === academicYearFilter;
      return matchSearch && matchStatus && matchYear;
    });
  }, [configs, searchQuery, statusFilter, academicYearFilter]);

  const openCreateModal = () => {
    setEditingConfigId(null);
    setFormYear(academicYearOptions[0] || '2026-2027');
    setFormClass('');
    setFormSubCategory('');
    setFormStatus('Active');
    setValidationErrors({});
    setIsCreateModalOpen(true);
  };

  const openEditModal = (cfg: AcademicConfigItem) => {
    setEditingConfigId(cfg.id);
    setFormYear(cfg.academicYear);
    setFormClass(cfg.className);
    setFormSubCategory(cfg.subCategory || '');
    setFormStatus(cfg.status);
    setValidationErrors({});
    setIsCreateModalOpen(true);
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors: typeof validationErrors = {};
    if (!formYear.trim()) errors.academicYear = 'Academic Year is required';
    if (!formClass.trim()) errors.className = 'Class / Department name is required';

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    try {
      if (editingConfigId) {
        const updated = await updateAcademicConfiguration(editingConfigId, {
          academicYear: formYear.trim(),
          className: formClass.trim(),
          subCategory: formSubCategory.trim() || undefined,
          status: formStatus,
        });
        onConfigsChange(configs.map((c) => (c.id === editingConfigId ? updated : c)));
        showToast('Configuration updated.');
      } else {
        const created = await createAcademicConfiguration({
          academicYear: formYear.trim(),
          className: formClass.trim(),
          subCategory: formSubCategory.trim() || undefined,
          status: formStatus,
          sections: [],
        });
        onConfigsChange([created, ...configs]);
        showToast('Configuration created.');
      }
      setIsCreateModalOpen(false);
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Unable to save configuration.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete configuration for "${name}"?`)) return;
    try {
      await deleteAcademicConfiguration(id);
      onConfigsChange(configs.filter((c) => c.id !== id));
      showToast('Configuration removed.');
    } catch {
      showToast('Unable to delete configuration. It may contain students or subject allocations.');
    }
  };

  const toggleStatus = async (cfg: AcademicConfigItem) => {
    const nextStatus = cfg.status === 'Active' ? 'Inactive' : 'Active';
    try {
      const updated = await updateAcademicConfiguration(cfg.id, { status: nextStatus });
      onConfigsChange(configs.map((c) => (c.id === cfg.id ? updated : c)));
      showToast(`Configuration marked as ${nextStatus}.`);
    } catch {
      showToast('Unable to update configuration status.');
    }
  };

  return (
    <div className="space-y-5 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Academic Configuration
        </h1>
      </div>

      {/* Summary Stat Cards */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => setStatusFilter('all')}
          className={`w-48 sm:w-52 px-3.5 py-2.5 rounded-xl border text-left flex items-center gap-3 transition-all shadow-2xs ${
            statusFilter === 'all'
              ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900 dark:ring-zinc-100'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-2xs">
            <BookmarkPlus className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 leading-tight">
              Total Configs
            </p>
            <p className="text-2xl font-extrabold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight mt-0.5">
              {String(configs.length).padStart(2, '0')}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Active')}
          className={`w-48 sm:w-52 px-3.5 py-2.5 rounded-xl border text-left flex items-center gap-3 transition-all shadow-2xs ${
            statusFilter === 'Active'
              ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900 dark:ring-zinc-100'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-zinc-100 text-zinc-900 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700 flex items-center justify-center shrink-0">
            <GraduationCap className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 leading-tight">
              Active Configurations
            </p>
            <p className="text-2xl font-extrabold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight mt-0.5">
              {String(activeConfigsCount).padStart(2, '0')}
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('Inactive')}
          className={`w-48 sm:w-52 px-3.5 py-2.5 rounded-xl border text-left flex items-center gap-3 transition-all shadow-2xs ${
            statusFilter === 'Inactive'
              ? 'bg-zinc-100 dark:bg-zinc-900 border-zinc-900 dark:border-zinc-100 ring-1 ring-zinc-900 dark:ring-zinc-100'
              : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-zinc-100 text-zinc-700 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-700 flex items-center justify-center shrink-0">
            <UserX className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 leading-tight">
              Inactive Configurations
            </p>
            <p className="text-2xl font-extrabold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight mt-0.5">
              {String(inactiveConfigsCount).padStart(2, '0')}
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
            placeholder="Search configurations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 shadow-2xs"
          />
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={onOpenMasterView}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-2xs"
          >
            <Settings className="w-3.5 h-3.5" />
            Subject Master
          </button>

          <div className="relative">
            <button
              type="button"
              onClick={() => setIsFilterOpen((o) => !o)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                isFilterOpen || statusFilter !== 'all' || academicYearFilter !== 'all'
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
                      Academic Year
                    </label>
                    <select
                      value={academicYearFilter}
                      onChange={(e) => setAcademicYearFilter(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-2.5 py-2 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                    >
                      <option value="all">All years</option>
                      {academicYearOptions.map((year) => (
                        <option key={year} value={year}>{year}</option>
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
            onClick={openCreateModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-2xs"
          >
            <Plus className="w-3.5 h-3.5" />
            Add Configuration
          </button>
        </div>
      </div>

      {/* Active filters summary */}
      {(statusFilter !== 'all' || academicYearFilter !== 'all' || searchQuery) && (
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span>Active filters applied.</span>
          <button
            type="button"
            onClick={() => {
              setStatusFilter('all');
              setAcademicYearFilter('all');
              setSearchQuery('');
            }}
            className="font-semibold text-zinc-800 underline dark:text-zinc-200"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* Table */}
      <div className="space-y-2">
        {filteredConfigs.length === 0 ? (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-12 text-center space-y-2">
            <BookOpen className="w-8 h-8 text-zinc-400 mx-auto" />
            <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
              No configurations found
            </p>
            <p className="text-xs text-zinc-500">
              {searchQuery || statusFilter !== 'all' || academicYearFilter !== 'all'
                ? 'No configurations match your search or filter.'
                : 'Create your first academic configuration or use bulk upload.'}
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
            <Table>
              <Table.ScrollContainer>
                <Table.Content>
                  <Table.Header>
                      <Table.Column className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                        Academic Year
                      </Table.Column>
                      <Table.Column className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                        Class / Department
                      </Table.Column>
                      <Table.Column className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                        Sub Category
                      </Table.Column>
                      <Table.Column className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                        Sections
                      </Table.Column>
                      <Table.Column className="px-4 py-3 text-left text-xs font-semibold text-zinc-500">
                        Status
                      </Table.Column>
                      <Table.Column className="px-4 py-3 text-right text-xs font-semibold text-zinc-500">
                        Actions
                      </Table.Column>
                  </Table.Header>
                  <Table.Body>
                    {filteredConfigs.map((cfg) => (
                      <Table.Row key={cfg.id} className="border-b border-zinc-100 dark:border-zinc-800 hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                        <Table.Cell className="px-4 py-3 text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100">
                          {cfg.academicYear}
                        </Table.Cell>
                        <Table.Cell className="px-4 py-3 text-xs font-medium text-zinc-800 dark:text-zinc-200">
                          {cfg.className}
                        </Table.Cell>
                        <Table.Cell className="px-4 py-3 text-xs text-zinc-600 dark:text-zinc-400">
                          {cfg.subCategory || 'General'}
                        </Table.Cell>
                        <Table.Cell className="px-4 py-3 text-xs">
                          {cfg.sections && cfg.sections.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {cfg.sections.map((sec) => (
                                <span
                                  key={sec}
                                  className="inline-flex items-center px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono font-medium text-zinc-700 dark:text-zinc-300"
                                >
                                  {sec}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <span className="text-zinc-400 text-xs italic">No sections</span>
                          )}
                        </Table.Cell>
                        <Table.Cell className="px-4 py-3 text-xs">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium ${
                              cfg.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                                : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                            }`}
                          >
                            {cfg.status}
                          </span>
                        </Table.Cell>
                        <Table.Cell className="px-4 py-3 text-right">
                          <MemberActionsMenu
                            onView={() => onSelectConfig(cfg)}
                            viewActionLabel="Assign Section"
                            onEdit={() => openEditModal(cfg)}
                            onDelete={() => handleDelete(cfg.id, cfg.className)}
                            onStatusToggle={() => void toggleStatus(cfg)}
                            statusActionLabel={cfg.status === 'Active' ? 'Deactivate' : 'Activate'}
                          />
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

      <CreateAcademicConfigModal
        isOpen={isCreateModalOpen}
        mode={editingConfigId ? 'edit' : 'create'}
        academicYear={formYear}
        className={formClass}
        subCategory={formSubCategory}
        status={formStatus}
        errors={validationErrors}
        onAcademicYearChange={setFormYear}
        onClassNameChange={setFormClass}
        onSubCategoryChange={setFormSubCategory}
        onStatusChange={setFormStatus}
        onSubmit={handleSaveConfig}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <BulkConfigUploadModal
        isOpen={isBulkOpen}
        onClose={() => setIsBulkOpen(false)}
        existingConfigs={configs}
        onSuccess={(created) => {
          onConfigsChange([...created, ...configs]);
          showToast(`Successfully uploaded ${created.length} configurations.`);
        }}
      />
    </div>
  );
};
