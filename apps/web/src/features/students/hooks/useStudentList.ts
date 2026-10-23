import { useState, useEffect, useMemo, useCallback } from 'react';
import type { InstitutionType, StudentRecord, StudentInput } from '../types';
import {
  getAllStudents,
  getArchivedStudents,
  createStudent,
  createStudents,
  updateStudent,
  deleteStudent,
  restoreStudent,
  purgeStudent,
  getStudentApiError,
} from '../api';

export interface UseStudentListOptions {
  institutionType: InstitutionType;
  pageSize?: number;
}

export function useStudentList({ institutionType, pageSize = 8 }: UseStudentListOptions) {
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [recycledStudents, setRecycledStudents] = useState<StudentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  // Load students & recycle bin
  const refresh = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [activeList, archivedList] = await Promise.all([
        getAllStudents(institutionType),
        getArchivedStudents(institutionType),
      ]);
      setStudents(activeList);
      setRecycledStudents(archivedList);
    } catch (err) {
      setError(getStudentApiError(err));
    } finally {
      setLoading(false);
    }
  }, [institutionType]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');

    Promise.all([
      getAllStudents(institutionType),
      getArchivedStudents(institutionType),
    ])
      .then(([activeList, archivedList]) => {
        if (!active) return;
        setStudents(activeList);
        setRecycledStudents(archivedList);
      })
      .catch((err) => {
        if (!active) return;
        setError(getStudentApiError(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [institutionType]);

  // Mutations
  const handleAddStudent = async (input: StudentInput): Promise<StudentRecord> => {
    const saved = await createStudent(input);
    setStudents((prev) => [saved, ...prev]);
    return saved;
  };

  const handleUpdateStudent = async (id: string, input: StudentInput): Promise<StudentRecord> => {
    const saved = await updateStudent(id, input);
    setStudents((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
    return saved;
  };

  const handleBulkAdd = async (list: StudentInput[]): Promise<StudentRecord[]> => {
    const saved = await createStudents(list);
    setStudents((prev) => [...saved, ...prev]);
    return saved;
  };

  const handleDelete = async (id: string): Promise<void> => {
    await deleteStudent(id);
    const deleted = students.find((s) => s.id === id);
    setStudents((prev) => prev.filter((s) => s.id !== id));
    if (deleted) {
      setRecycledStudents((prev) => [{ ...deleted, status: 'Archived' }, ...prev]);
    }
  };

  const handleRestore = async (id: string): Promise<StudentRecord> => {
    const restored = await restoreStudent(id);
    setRecycledStudents((prev) => prev.filter((s) => s.id !== id));
    setStudents((prev) => [restored, ...prev]);
    return restored;
  };

  const handlePurge = async (id: string): Promise<void> => {
    await purgeStudent(id);
    setRecycledStudents((prev) => prev.filter((s) => s.id !== id));
  };

  // Stats
  const totalStudents = students.length;
  const activeStudents = useMemo(() => students.filter((s) => s.status === 'Active').length, [students]);
  const inactiveStudents = totalStudents - activeStudents;

  // Filtered
  const filteredStudents = useMemo(() => {
    return students.filter((item) => {
      if (statusFilter === 'active' && item.status !== 'Active') return false;
      if (statusFilter === 'inactive' && item.status === 'Active') return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.studentName.toLowerCase().includes(q) ||
        (item.admissionId && item.admissionId.toLowerCase().includes(q)) ||
        (item.studentId && item.studentId.toLowerCase().includes(q)) ||
        item.department.toLowerCase().includes(q) ||
        item.academicYear.toLowerCase().includes(q) ||
        (item.studentMobile && item.studentMobile.includes(q)) ||
        (item.parentMobile && item.parentMobile.includes(q))
      );
    });
  }, [students, statusFilter, searchQuery]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredStudents.slice(start, start + pageSize);
  }, [filteredStudents, currentPage, pageSize]);

  return {
    students,
    recycledStudents,
    filteredStudents,
    paginatedStudents,
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
    totalStudents,
    activeStudents,
    inactiveStudents,
    // Mutations
    addStudent: handleAddStudent,
    updateStudent: handleUpdateStudent,
    bulkAddStudents: handleBulkAdd,
    deleteStudent: handleDelete,
    restoreStudent: handleRestore,
    purgeStudent: handlePurge,
  };
}
