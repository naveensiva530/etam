import React, { useState, useMemo } from 'react';
import { Search, Users, ChevronDown, ChevronUp } from 'lucide-react';
import { Table } from '@/components/ui/heroui-table';
import type { DepartmentTimetableItem } from '../types/timetable.types';

interface TimetableDepartmentListProps {
  departments: DepartmentTimetableItem[];
  loading: boolean;
  onSelectDepartment: (dept: DepartmentTimetableItem) => void;
}

export const TimetableDepartmentList: React.FC<TimetableDepartmentListProps> = ({
  departments,
  loading,
  onSelectDepartment,
}) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<'departmentId' | 'departmentName' | 'status'>('departmentId');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filteredDepartments = useMemo(() => {
    return departments
      .filter((dept) => {
        const query = search.toLowerCase();
        return (
          dept.departmentName.toLowerCase().includes(query) ||
          dept.departmentId.toLowerCase().includes(query) ||
          dept.status.toLowerCase().includes(query)
        );
      })
      .sort((a, b) => {
        let valA = a[sortField];
        let valB = b[sortField];
        const res = valA.localeCompare(valB);
        return sortOrder === 'asc' ? res : -res;
      });
  }, [departments, search, sortField, sortOrder]);

  const handleSort = (field: 'departmentId' | 'departmentName' | 'status') => {
    if (sortField === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredDepartments.map((d) => d.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
        Time table Configuration
      </h1>

      {/* KPI Cards */}
      <div className="flex flex-wrap gap-4">
        <div className="w-48 sm:w-52 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-3 shadow-2xs">
          <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-2xs">
            <Users className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 leading-tight">Total Active Classes</p>
            <p className="text-2xl font-extrabold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight mt-0.5">
              {String(departments.length).padStart(2, '0')}
            </p>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative w-full sm:w-72 md:w-80">
        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search..."
          aria-label="Search timetable departments"
          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 shadow-2xs transition-colors"
        />
      </div>

      {/* Department Table */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">
        <Table>
          <Table.ScrollContainer>
            <Table.Content aria-label="Timetable departments" className="min-w-[800px]">
              <Table.Header>
                <Table.Column className="w-12 text-center">
                  <input
                    type="checkbox"
                    checked={
                      filteredDepartments.length > 0 &&
                      selectedIds.length === filteredDepartments.length
                    }
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                  />
                </Table.Column>
                <Table.Column>
                  <button type="button" onClick={() => handleSort('departmentId')} className="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-200">
                  <div className="flex items-center gap-1.5">
                    <span>Class ID</span>
                    {sortField === 'departmentId' &&
                      (sortOrder === 'asc' ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ))}
                  </div>
                  </button>
                </Table.Column>
                <Table.Column>
                  <button type="button" onClick={() => handleSort('departmentName')} className="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-200">
                    <span>Class Name</span>
                    {sortField === 'departmentName' &&
                      (sortOrder === 'asc' ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ))}
                  </button>
                </Table.Column>
                <Table.Column>
                  <button type="button" onClick={() => handleSort('status')} className="inline-flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-zinc-200">
                    <span>Status</span>
                    {sortField === 'status' &&
                      (sortOrder === 'asc' ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      ))}
                  </button>
                </Table.Column>
              </Table.Header>
              <Table.Body>
              {loading ? (
                <Table.Row>
                  <Table.Cell colSpan={4} className="py-8 text-center text-zinc-400">
                    Loading departments...
                  </Table.Cell>
                </Table.Row>
              ) : filteredDepartments.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={4} className="py-8 text-center text-zinc-400">
                    No departments found.
                  </Table.Cell>
                </Table.Row>
              ) : (
                filteredDepartments.map((dept) => {
                  const isCreated = dept.status === 'Created';
                  const isChecked = selectedIds.includes(dept.id);
                  return (
                    <Table.Row
                      key={dept.id}
                      onClick={() => onSelectDepartment(dept)}
                      className="cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40 transition-colors"
                    >
                      <Table.Cell
                        className="text-center"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSelect(dept.id)}
                          className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                        />
                      </Table.Cell>
                      <Table.Cell>
                        {dept.departmentId}
                      </Table.Cell>
                      <Table.Cell>
                        {dept.departmentName}
                      </Table.Cell>
                      <Table.Cell>
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-2 h-2 rounded-full ${
                              isCreated ? 'bg-emerald-500' : 'bg-red-500'
                            }`}
                          />
                          <span
                            className={`text-xs font-medium ${
                              isCreated
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-red-500 dark:text-red-400'
                            }`}
                          >
                            {dept.status}
                          </span>
                        </div>
                      </Table.Cell>
                    </Table.Row>
                  );
                })
              )}
              </Table.Body>
            </Table.Content>
          </Table.ScrollContainer>
        </Table>
      </div>
    </div>
  );
};
