import { useState, useEffect, useMemo, useCallback } from 'react';
import type { InstitutionType, StaffRecord, StaffInput } from '../types';
import {
  getAllStaff,
  getArchivedStaff,
  createStaff,
  createStaffBulk,
  updateStaff,
  deleteStaff,
  restoreStaff,
  purgeStaff,
  getStaffApiError,
} from '../api';

export interface UseStaffListOptions {
  institutionType: InstitutionType;
  pageSize?: number;
}

export function useStaffList({ institutionType, pageSize = 8 }: UseStaffListOptions) {
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [recycledStaff, setRecycledStaff] = useState<StaffRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Load staff & recycle bin
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [activeList, archivedList] = await Promise.all([
        getAllStaff(institutionType),
        getArchivedStaff(institutionType),
      ]);
      setStaffList(activeList);
      setRecycledStaff(archivedList);
    } catch (err) {
      setError(getStaffApiError(err));
    } finally {
      setLoading(false);
    }
  }, [institutionType]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      getAllStaff(institutionType),
      getArchivedStaff(institutionType),
    ])
      .then(([activeList, archivedList]) => {
        if (!active) return;
        setStaffList(activeList);
        setRecycledStaff(archivedList);
      })
      .catch((err) => {
        if (!active) return;
        setError(getStaffApiError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [institutionType]);

  // Mutations
  const handleAddStaff = async (input: StaffInput): Promise<StaffRecord> => {
    const saved = await createStaff(input);
    setStaffList((prev) => [saved, ...prev]);
    return saved;
  };

  const handleUpdateStaff = async (id: string, input: StaffInput): Promise<StaffRecord> => {
    const saved = await updateStaff(id, input);
    setStaffList((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
    return saved;
  };

  const handleBulkAdd = async (list: StaffInput[]): Promise<StaffRecord[]> => {
    const saved = await createStaffBulk(list);
    setStaffList((prev) => [...saved, ...prev]);
    return saved;
  };

  const handleDelete = async (id: string): Promise<void> => {
    await deleteStaff(id);
    const deleted = staffList.find((s) => s.id === id);
    setStaffList((prev) => prev.filter((s) => s.id !== id));
    if (deleted) {
      setRecycledStaff((prev) => [{ ...deleted, status: 'Archived' }, ...prev]);
    }
  };

  const handleRestore = async (id: string): Promise<StaffRecord> => {
    const restored = await restoreStaff(id);
    setRecycledStaff((prev) => prev.filter((s) => s.id !== id));
    setStaffList((prev) => [restored, ...prev]);
    return restored;
  };

  const handlePurge = async (id: string): Promise<void> => {
    await purgeStaff(id);
    setRecycledStaff((prev) => prev.filter((s) => s.id !== id));
  };

  // Stats
  const totalStaff = staffList.length;
  const activeStaff = useMemo(() => staffList.filter((s) => s.status === 'Active').length, [staffList]);
  const inactiveStaff = totalStaff - activeStaff;

  // Filtered
  const filteredStaff = useMemo(() => {
    return staffList.filter((item) => {
      if (statusFilter === 'active' && item.status !== 'Active') return false;
      if (statusFilter === 'inactive' && item.status === 'Active') return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        item.staffId.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        item.role.toLowerCase().includes(q) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.mobile && item.mobile.includes(q))
      );
    });
  }, [staffList, statusFilter, searchQuery]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / pageSize));
  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStaff.slice(start, start + pageSize);
  }, [filteredStaff, currentPage, pageSize]);

  return {
    staffList,
    recycledStaff,
    filteredStaff,
    paginatedStaff,
    loading,
    error,
    refresh,
    // Filters & Pagination
    searchQuery,
    setSearchQuery,
    statusFilter,
    setStatusFilter,
    currentPage,
    setCurrentPage,
    totalPages,
    pageSize,
    // Stats
    totalStaff,
    activeStaff,
    inactiveStaff,
    // Mutations
    addStaff: handleAddStaff,
    updateStaff: handleUpdateStaff,
    bulkAddStaff: handleBulkAdd,
    deleteStaff: handleDelete,
    restoreStaff: handleRestore,
    purgeStaff: handlePurge,
  };
}
