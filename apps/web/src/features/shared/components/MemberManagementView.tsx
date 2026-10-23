import React, { Suspense, lazy, useState, useMemo, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Users,
  GraduationCap,
  Briefcase,
  Search,
  UserPlus,
  Upload,
  CheckCircle2,
  X,
  ChevronDown,
  UserCheck,
  UserX,
  FileSpreadsheet,
  Building2,
  Calendar,
  RotateCcw,
} from 'lucide-react';
import { StudentRecord, StudentInput, StaffRecord, StaffInput } from '../types/common.types';
import { useInstitution } from '@/context/InstitutionContext';
import {
  createStudent,
  createStudents,
  deleteStudent,
  getAllStudents,
  getArchivedStudents,
  getStudentApiError,
  purgeStudent,
  restoreStudent,
  updateStudent,
} from '@/features/students/api';
import {
  createStaff,
  createStaffBulk,
  deleteStaff,
  getAllStaff,
  getArchivedStaff,
  getStaffApiError,
  purgeStaff,
  restoreStaff,
  updateStaff,
} from '@/features/staff/api';
import { Table } from '@/components/ui/heroui-table';
import { DockMorph } from '@/components/ui/dock-morph';
import { MemberManagementToolbar } from './MemberManagementToolbar';

const AddStudent = lazy(() => import('@/features/students/StudentForm/AddStudent').then((module) => ({ default: module.AddStudent })));
const EditStudent = lazy(() => import('@/features/students/StudentForm/EditStudent').then((module) => ({ default: module.EditStudent })));
const ViewStudent = lazy(() => import('@/features/students/ViewStudent/ViewStudent').then((module) => ({ default: module.ViewStudent })));
const DeleteStudent = lazy(() => import('@/features/students/DeleteStudent/DeleteStudent').then((module) => ({ default: module.DeleteStudent })));

const AddStaff = lazy(() => import('@/features/staff/StaffForm/AddStaff').then((module) => ({ default: module.AddStaff })));
const EditStaff = lazy(() => import('@/features/staff/StaffForm/EditStaff').then((module) => ({ default: module.EditStaff })));
const ViewStaff = lazy(() => import('@/features/staff/ViewStaff/ViewStaff').then((module) => ({ default: module.ViewStaff })));
const DeleteStaff = lazy(() => import('@/features/staff/DeleteStaff/DeleteStaff').then((module) => ({ default: module.DeleteStaff })));

interface MemberActionsMenuProps {
  onEdit: () => void;
  onView: () => void;
  onDelete: () => void;
}

const MemberActionsMenu: React.FC<MemberActionsMenuProps> = ({ onEdit, onView, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, right: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!isOpen || !triggerRef.current) return;
    const bounds = triggerRef.current.getBoundingClientRect();
    setPosition({ top: bounds.bottom + 4, right: window.innerWidth - bounds.right });
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (!triggerRef.current?.contains(target) && !menuRef.current?.contains(target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };
    const closeOnScroll = () => setIsOpen(false);
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('scroll', closeOnScroll, true);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('scroll', closeOnScroll, true);
    };
  }, [isOpen]);

  const runAction = (action: () => void) => {
    setIsOpen(false);
    action();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        className="inline-flex items-center gap-1 rounded-md px-2 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Actions
        <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              ref={menuRef}
              role="menu"
              initial={{ opacity: 0, y: -4, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -3, scale: 0.98 }}
              transition={{ duration: 0.14, ease: 'easeOut' }}
              style={{ top: position.top, right: position.right }}
              className="fixed z-[100] w-36 overflow-hidden rounded-lg border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => runAction(onEdit)}
                className="flex w-full items-center px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                Edit
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => runAction(onView)}
                className="flex w-full items-center px-3 py-2 text-left text-xs text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800"
              >
                View Details
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => runAction(onDelete)}
                className="flex w-full items-center px-3 py-2 text-left text-xs text-red-600 hover:bg-zinc-100 dark:text-red-400 dark:hover:bg-zinc-800"
              >
                Delete
              </button>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
};

export type MemberManagementType = 'students' | 'staff';

interface MemberManagementViewProps {
  managementType: MemberManagementType;
}

export const MemberManagementView: React.FC<MemberManagementViewProps> = ({ managementType }) => {
  const { institutionType, config } = useInstitution();

  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [studentsLoading, setStudentsLoading] = useState(true);
  const [studentError, setStudentError] = useState('');
  const [staffList, setStaffList] = useState<StaffRecord[]>([]);
  const [staffLoading, setStaffLoading] = useState(true);
  const [staffError, setStaffError] = useState('');
  const [recycledStudents, setRecycledStudents] = useState<StudentRecord[]>([]);
  const [recycledStaff, setRecycledStaff] = useState<StaffRecord[]>([]);

  const loadStudents = async () => {
    if (managementType !== 'students') return;
    setStudentsLoading(true);
    setStudentError('');
    try {
      setStudents(await getAllStudents(institutionType));
    } catch (error) {
      setStudentError(getStudentApiError(error));
    } finally {
      setStudentsLoading(false);
    }
    try {
      setRecycledStudents(await getArchivedStudents(institutionType));
    } catch (error) {
      setStudentError(getStudentApiError(error));
    }
  };

  useEffect(() => {
    let active = true;
    setStudentsLoading(true);
    setStudentError('');
    if (managementType !== 'students') {
      setStudents([]);
      setStudentsLoading(false);
      return () => {
        active = false;
      };
    }
    getAllStudents(institutionType)
      .then((records) => {
        if (active) setStudents(records);
      })
      .catch((error) => {
        if (active) setStudentError(getStudentApiError(error));
      })
      .finally(() => {
        if (active) setStudentsLoading(false);
      });
    return () => {
      active = false;
    };
  }, [institutionType, managementType]);

  const loadStaff = async () => {
    if (managementType !== 'staff') return;
    setStaffLoading(true);
    setStaffError('');
    try {
      setStaffList(await getAllStaff(institutionType));
    } catch (error) {
      setStaffError(getStaffApiError(error));
    } finally {
      setStaffLoading(false);
    }
    try {
      setRecycledStaff(await getArchivedStaff(institutionType));
    } catch (error) {
      setStaffError(getStaffApiError(error));
    }
  };

  useEffect(() => {
    let active = true;
    setStaffLoading(true);
    setStaffError('');
    if (managementType !== 'staff') {
      setStaffList([]);
      setStaffLoading(false);
      return () => {
        active = false;
      };
    }

    getAllStaff(institutionType)
      .then((records) => {
        if (active) setStaffList(records);
      })
      .catch((error) => {
        if (active) setStaffError(getStaffApiError(error));
      })
      .finally(() => {
        if (active) setStaffLoading(false);
      });

    getArchivedStaff(institutionType)
      .then((records) => {
        if (active) setRecycledStaff(records);
      })
      .catch((error) => {
        if (active) setStaffError(getStaffApiError(error));
      });

    return () => {
      active = false;
    };
  }, [institutionType, managementType]);

  useEffect(() => {
    let active = true;
    if (managementType !== 'students') {
      setRecycledStudents([]);
      return () => {
        active = false;
      };
    }

    getArchivedStudents(institutionType)
      .then((records) => {
        if (active) setRecycledStudents(records);
      })
      .catch((error) => {
        if (active) setStudentError(getStudentApiError(error));
      });
    return () => {
      active = false;
    };
  }, [institutionType, managementType]);

  // Modal controls
  const [studentModalMode, setStudentModalMode] = useState<'single' | 'bulk'>('single');
  const [staffModalMode, setStaffModalMode] = useState<'single' | 'bulk'>('single');

  const [selectedStudentForView, setSelectedStudentForView] = useState<StudentRecord | null>(null);
  const [selectedStaffForView, setSelectedStaffForView] = useState<StaffRecord | null>(null);
  const [studentPendingDelete, setStudentPendingDelete] = useState<StudentRecord | null>(null);
  const [studentDeleteError, setStudentDeleteError] = useState('');
  const [isDeletingStudent, setIsDeletingStudent] = useState(false);

  const [staffPendingDelete, setStaffPendingDelete] = useState<StaffRecord | null>(null);
  const [staffDeleteError, setStaffDeleteError] = useState('');
  const [isDeletingStaff, setIsDeletingStaff] = useState(false);

  const [editingStudent, setEditingStudent] = useState<StudentRecord | undefined>();
  const [editingStaff, setEditingStaff] = useState<StaffRecord | undefined>();


  // Compute stat card metrics
  const totalStudents = students.length;
  const activeStudents = useMemo(() => students.filter((s) => s.status === 'Active').length, [students]);
  const inactiveStudents = useMemo(() => students.filter((s) => s.status === 'Inactive').length, [students]);

  const totalStaff = staffList.length;
  const activeStaff = useMemo(() => staffList.filter((s) => s.status === 'Active').length, [staffList]);
  const inactiveStaff = totalStaff - activeStaff;

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [memberTypeFilter, setMemberTypeFilter] = useState<'all' | 'students' | 'staff'>(managementType);
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 8;

  // Unified Member model for table
  interface UnifiedMember {
    id: string;
    type: 'Student' | 'Staff';
    code: string;
    name: string;
    department: string;
    roleOrYear: string;
    email?: string;
    mobile?: string;
    status: string;
    bloodGroup?: string;
    photoUrl?: string;
    rawStudent?: StudentRecord;
    rawStaff?: StaffRecord;
  }

  const allMembers = useMemo<UnifiedMember[]>(() => {
    const studentItems: UnifiedMember[] = students.map((s) => ({
      id: s.id,
      type: 'Student',
      code: s.admissionId || s.studentId,
      name: s.studentName,
      department: s.department,
      roleOrYear: s.academicYear,
      mobile: s.studentMobile || s.parentMobile,
      status: s.status,
      bloodGroup: s.bloodGroup,
      photoUrl: s.photoUrl,
      rawStudent: s,
    }));

    const staffItems: UnifiedMember[] = staffList.map((st) => ({
      id: st.id,
      type: 'Staff',
      code: st.staffId,
      name: st.name,
      department: st.department,
      roleOrYear: st.role,
      email: st.email,
      mobile: st.mobile,
      status: st.status,
      bloodGroup: st.bloodGroup,
      photoUrl: st.photoUrl,
      rawStaff: st,
    }));

    return [...studentItems, ...staffItems];
  }, [students, staffList]);

  // Filtered members list
  const filteredMembers = useMemo(() => {
    return allMembers.filter((item) => {
      // Member type filter
      if (memberTypeFilter === 'students' && item.type !== 'Student') return false;
      if (memberTypeFilter === 'staff' && item.type !== 'Staff') return false;

      // Status filter
      if (statusFilter === 'active' && item.status !== 'Active') return false;
      if (statusFilter === 'inactive') {
        if (managementType === 'students' && item.status !== 'Inactive') return false;
        if (managementType === 'staff' && item.status === 'Active') return false;
      }

      // Search query
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.department.toLowerCase().includes(q) ||
        item.roleOrYear.toLowerCase().includes(q) ||
        (item.email && item.email.toLowerCase().includes(q)) ||
        (item.mobile && item.mobile.includes(q))
      );
    });
  }, [allMembers, memberTypeFilter, statusFilter, searchQuery]);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, memberTypeFilter, statusFilter]);

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));
  const paginatedMembers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredMembers.slice(start, start + PAGE_SIZE);
  }, [filteredMembers, currentPage, PAGE_SIZE]);

  // Actions
  const handleAddStudent = async (newStudent: StudentInput) => {
    const savedStudent = await createStudent(newStudent);
    setStudents((prev) => [savedStudent, ...prev]);
    return savedStudent;
  };

  const handleUpdateStudent = async (studentInput: StudentInput) => {
    if (!editingStudent) throw new Error('No student is selected for editing.');
    const savedStudent = await updateStudent(editingStudent.id, studentInput);
    setStudents((prev) => prev.map((student) => student.id === savedStudent.id ? savedStudent : student));
    setEditingStudent(undefined);
    return savedStudent;
  };

  const handleAddBulkStudents = async (bulk: StudentInput[]) => {
    const savedStudents = await createStudents(bulk);
    setStudents((prev) => [...savedStudents, ...prev]);
    return savedStudents;
  };

  const handleAddStaff = async (newStaff: StaffInput): Promise<StaffRecord> => {
    const saved = await createStaff(newStaff);
    setStaffList((prev) => [saved, ...prev]);
    return saved;
  };

  const handleUpdateStaff = async (staffInput: StaffInput): Promise<StaffRecord> => {
    if (!editingStaff) throw new Error('No staff is selected for editing.');
    const saved = await updateStaff(editingStaff.id, staffInput);
    setStaffList((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
    setEditingStaff(undefined);
    return saved;
  };

  const handleAddBulkStaff = async (bulk: StaffInput[]): Promise<StaffRecord[]> => {
    const savedList = await createStaffBulk(bulk);
    setStaffList((prev) => [...savedList, ...prev]);
    return savedList;
  };

  const handleDeleteMember = async (item: UnifiedMember) => {
    if (item.type === 'Student' && item.rawStudent) {
      setStudentPendingDelete(item.rawStudent);
      setStudentDeleteError('');
      setPanelViewMode('student-delete');
      return;
    }
    if (item.type === 'Staff' && item.rawStaff) {
      setStaffPendingDelete(item.rawStaff);
      setStaffDeleteError('');
      setPanelViewMode('staff-delete');
      return;
    }
  };

  const confirmDeleteStudent = async () => {
    if (!studentPendingDelete || isDeletingStudent) return;
    const record = studentPendingDelete;
    setIsDeletingStudent(true);
    try {
      await deleteStudent(record.id);
      setStudents((prev) => prev.filter((student) => student.id !== record.id));
      setRecycledStudents((prev) => [record, ...prev]);
      setStudentPendingDelete(null);
      setStudentDeleteError('');
      setPanelViewMode('table');
    } catch (error) {
      setStudentDeleteError(getStudentApiError(error));
    } finally {
      setIsDeletingStudent(false);
    }
  };

  const confirmDeleteStaff = async () => {
    if (!staffPendingDelete || isDeletingStaff) return;
    const record = staffPendingDelete;
    setIsDeletingStaff(true);
    try {
      await deleteStaff(record.id);
      setStaffList((prev) => prev.filter((s) => s.id !== record.id));
      setRecycledStaff((prev) => [record, ...prev]);
      setStaffPendingDelete(null);
      setStaffDeleteError('');
      setPanelViewMode('table');
    } catch (error) {
      setStaffDeleteError(getStaffApiError(error));
    } finally {
      setIsDeletingStaff(false);
    }
  };

  const cancelDeleteStaff = () => {
    setStaffPendingDelete(null);
    setStaffDeleteError('');
    setPanelViewMode('table');
  };

  const handleRestoreStudent = async (id: string) => {
    try {
      const restored = await restoreStudent(id);
      setRecycledStudents((prev) => prev.filter((s) => s.id !== id));
      setStudents((prev) => [restored, ...prev]);
    } catch (error) {
      setStudentError(getStudentApiError(error));
    }
  };

  const handleRestoreStaff = async (id: string) => {
    try {
      const restored = await restoreStaff(id);
      setRecycledStaff((prev) => prev.filter((s) => s.id !== id));
      setStaffList((prev) => [restored, ...prev]);
    } catch (error) {
      setStaffError(getStaffApiError(error));
    }
  };

  const handleRestoreAll = async () => {
    if (managementType === 'students') {
      await Promise.all(recycledStudents.map((student) => handleRestoreStudent(student.id)));
    } else {
      await Promise.all(recycledStaff.map((staff) => handleRestoreStaff(staff.id)));
    }
  };

  const handleClearRecycleBin = async () => {
    if (managementType === 'students') {
      const outcomes = await Promise.allSettled(recycledStudents.map((student) => purgeStudent(student.id)));
      const purgedIds = new Set(
        outcomes.flatMap((outcome, index) => outcome.status === 'fulfilled' ? [recycledStudents[index].id] : [])
      );
      setRecycledStudents((previous) => previous.filter((student) => !purgedIds.has(student.id)));
      if (outcomes.some((outcome) => outcome.status === 'rejected')) {
        setStudentError('Some student records could not be permanently deleted. Retry after checking the recycle bin.');
      }
    } else {
      const outcomes = await Promise.allSettled(recycledStaff.map((staff) => purgeStaff(staff.id)));
      const purgedIds = new Set(
        outcomes.flatMap((outcome, index) => outcome.status === 'fulfilled' ? [recycledStaff[index].id] : [])
      );
      setRecycledStaff((previous) => previous.filter((staff) => !purgedIds.has(staff.id)));
      if (outcomes.some((outcome) => outcome.status === 'rejected')) {
        setStaffError('Some staff records could not be permanently deleted. Retry after checking the recycle bin.');
      }
    }
  };

  const [panelViewMode, setPanelViewMode] = useState<
    'table' | 'student-onboard' | 'staff-onboard' | 'student-view' | 'staff-view' | 'student-delete' | 'staff-delete'
  >('table');

  const editMember = (item: UnifiedMember) => {
    setSelectedStudentForView(null);
    setSelectedStaffForView(null);
    if (item.rawStudent) {
      setEditingStudent(item.rawStudent);
      setStudentModalMode('single');
      setPanelViewMode('student-onboard');
    } else if (item.rawStaff) {
      setEditingStaff(item.rawStaff);
      setStaffModalMode('single');
      setPanelViewMode('staff-onboard');
    }
  };

  const closeOnboarding = () => {
    setEditingStudent(undefined);
    setEditingStaff(undefined);
    setPanelViewMode('table');
  };

  const viewMember = (item: UnifiedMember) => {
    setSelectedStudentForView(item.rawStudent || null);
    setSelectedStaffForView(item.rawStaff || null);
    setPanelViewMode(item.rawStudent ? 'student-view' : 'staff-view');
  };

  const closeMemberView = () => {
    setSelectedStudentForView(null);
    setSelectedStaffForView(null);
    setPanelViewMode('table');
  };

  const cancelDeleteStudent = () => {
    setStudentPendingDelete(null);
    setStudentDeleteError('');
    setPanelViewMode('table');
  };

  const openStudentOnboard = (mode: 'single' | 'bulk') => {
    setStudentModalMode(mode);
    setPanelViewMode('student-onboard');
  };

  const openStaffOnboard = (mode: 'single' | 'bulk') => {
    setStaffModalMode(mode);
    setPanelViewMode('staff-onboard');
  };

  const existingAdmissionIds = useMemo(() => students.map((s) => s.admissionId), [students]);
  const existingStaffIds = useMemo(() => staffList.map((s) => s.staffId), [staffList]);
  const recordsLoading = managementType === 'students' ? studentsLoading : staffLoading;
  const recordsError = managementType === 'students' ? studentError : staffError;
  const retryRecords = managementType === 'students' ? loadStudents : loadStaff;

  // Handle stat card filter clicks
  const handleStatCardClick = (status: 'all' | 'active' | 'inactive') => {
    setMemberTypeFilter(managementType);
    setStatusFilter(status);
  };

  const isFilterActive = statusFilter !== 'all' || searchQuery.trim() !== '';

  const resetAllFilters = () => {
    setMemberTypeFilter(managementType);
    setStatusFilter('all');
    setSearchQuery('');
  };

  useEffect(() => {
    setMemberTypeFilter(managementType);
    setStatusFilter('all');
    setSearchQuery('');
    setCurrentPage(1);
    setPanelViewMode('table');
  }, [managementType]);

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-7 bg-white dark:bg-zinc-950 min-h-screen text-zinc-900 dark:text-zinc-100">



      {panelViewMode === 'table' && (
        <>
          {/* ─── OVERALL MEMBERS STAT BUTTONS (Compact Button Format & Reduced Size) ─── */}
          <div className="-mx-4 space-y-2 px-2 md:-mx-8">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                {managementType === 'students' ? 'Student Management' : 'Staff Management'}
              </span>
              <MemberManagementToolbar
                managementType={managementType}
                onOpenStudentOnboard={openStudentOnboard}
                onOpenStaffOnboard={openStaffOnboard}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                memberTypeFilter={memberTypeFilter}
                onMemberTypeFilterChange={setMemberTypeFilter}
                statusFilter={statusFilter}
                onStatusFilterChange={setStatusFilter}
                onResetFilters={resetAllFilters}
                isFilterActive={isFilterActive}
                recycledStudents={recycledStudents}
                recycledStaff={recycledStaff}
                onRestoreStudent={handleRestoreStudent}
                onRestoreStaff={handleRestoreStaff}
                onRestoreAll={handleRestoreAll}
                onClearRecycleBin={handleClearRecycleBin}
              />
            </div>

            {/* Compact Button Group (All 7 in single row without wrapping) */}
            <div className="flex w-full min-w-0 items-center justify-between gap-2 overflow-x-auto no-scrollbar pb-1 [&>button]:h-10 [&>button]:shrink-0 [&>button]:items-center [&>button]:justify-start [&>button]:gap-1.5 [&>button]:rounded-lg [&>button]:px-2.5 [&>button]:py-2 [&>button]:text-[11px] [&>button>svg]:h-3.5 [&>button>svg]:w-3.5">

              {/* 2. Total Students */}
              {managementType === 'students' && (
                <>
              <button
                type="button"
                onClick={() => handleStatCardClick('all')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-2xs shrink-0 whitespace-nowrap ${memberTypeFilter === 'students' && statusFilter === 'all'
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                    : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
              >
                <GraduationCap className="w-3.5 h-3.5 shrink-0" />
                <span>Total Students</span>
                <span className={`inline-flex h-5 min-w-[20px] items-center justify-center whitespace-nowrap rounded px-1 font-bold font-mono text-[10px] leading-none ${memberTypeFilter === 'students' && statusFilter === 'all'
                    ? 'bg-zinc-500 text-white dark:bg-zinc-400 dark:text-zinc-900'
                    : 'bg-zinc-300 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100'
                  }`}>
                  {totalStudents}
                </span>
              </button>

              {/* 3. Active Students */}
              <button
                type="button"
                onClick={() => handleStatCardClick('active')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-2xs shrink-0 whitespace-nowrap ${memberTypeFilter === 'students' && statusFilter === 'active'
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                    : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Active Students</span>
                <span className={`inline-flex h-5 min-w-[20px] items-center justify-center whitespace-nowrap rounded px-1 font-bold font-mono text-[10px] leading-none ${memberTypeFilter === 'students' && statusFilter === 'active'
                    ? 'bg-zinc-500 text-white dark:bg-zinc-400 dark:text-zinc-900'
                    : 'bg-zinc-300 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100'
                  }`}>
                  {activeStudents}
                </span>
              </button>

              {/* 4. Inactive Students */}
              <button
                type="button"
                onClick={() => handleStatCardClick('inactive')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-2xs shrink-0 whitespace-nowrap ${memberTypeFilter === 'students' && statusFilter === 'inactive'
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                    : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
              >
                <UserX className="w-3.5 h-3.5 shrink-0" />
                <span>Inactive Students</span>
                <span className={`inline-flex h-5 min-w-[20px] items-center justify-center whitespace-nowrap rounded px-1 font-bold font-mono text-[10px] leading-none ${memberTypeFilter === 'students' && statusFilter === 'inactive'
                    ? 'bg-zinc-500 text-white dark:bg-zinc-400 dark:text-zinc-900'
                    : 'bg-zinc-300 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100'
                  }`}>
                  {inactiveStudents}
                </span>
              </button>
                </>
              )}

              {/* 5. Total Staff */}
              {managementType === 'staff' && (
                <>
              <button
                type="button"
                onClick={() => handleStatCardClick('all')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-2xs shrink-0 whitespace-nowrap ${memberTypeFilter === 'staff' && statusFilter === 'all'
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                    : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
              >
                <Briefcase className="w-3.5 h-3.5 shrink-0" />
                <span>Total Staff</span>
                <span className={`inline-flex h-5 min-w-[20px] items-center justify-center whitespace-nowrap rounded px-1 font-bold font-mono text-[10px] leading-none ${memberTypeFilter === 'staff' && statusFilter === 'all'
                    ? 'bg-zinc-500 text-white dark:bg-zinc-400 dark:text-zinc-900'
                    : 'bg-zinc-300 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100'
                  }`}>
                  {totalStaff}
                </span>
              </button>

              {/* 6. Active Staff */}
              <button
                type="button"
                onClick={() => handleStatCardClick('active')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-2xs shrink-0 whitespace-nowrap ${memberTypeFilter === 'staff' && statusFilter === 'active'
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                    : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
              >
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Active Staff</span>
                <span className={`inline-flex h-5 min-w-[20px] items-center justify-center whitespace-nowrap rounded px-1 font-bold font-mono text-[10px] leading-none ${memberTypeFilter === 'staff' && statusFilter === 'active'
                    ? 'bg-zinc-500 text-white dark:bg-zinc-400 dark:text-zinc-900'
                    : 'bg-zinc-300 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100'
                  }`}>
                  {activeStaff}
                </span>
              </button>

              {/* 7. Inactive Staff (Now positioned right next to Active Staff in the same line) */}
              <button
                type="button"
                onClick={() => handleStatCardClick('inactive')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all shadow-2xs shrink-0 whitespace-nowrap ${memberTypeFilter === 'staff' && statusFilter === 'inactive'
                    ? 'bg-zinc-900 text-white border-zinc-900 dark:bg-zinc-100 dark:text-zinc-900 dark:border-zinc-100'
                    : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  }`}
              >
                <UserX className="w-3.5 h-3.5 shrink-0" />
                <span>Inactive Staff</span>
                <span className={`inline-flex h-5 min-w-[20px] items-center justify-center whitespace-nowrap rounded px-1 font-bold font-mono text-[10px] leading-none ${memberTypeFilter === 'staff' && statusFilter === 'inactive'
                    ? 'bg-zinc-500 text-white dark:bg-zinc-400 dark:text-zinc-900'
                    : 'bg-zinc-300 text-zinc-900 dark:bg-zinc-700 dark:text-zinc-100'
                  }`}>
                  {inactiveStaff}
                </span>
              </button>
                </>
              )}

            </div>
          </div>

          {/* ─── ERROR ALERT (Monochrome) ─────────────────────────────────── */}
          {recordsError && (
            <div role="alert" className="flex items-center justify-between gap-3 rounded-xl border border-zinc-400 bg-zinc-100 px-4 py-3 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100">
            <span>{recordsError}</span>
            <button onClick={retryRecords} disabled={recordsLoading} className="font-semibold underline disabled:opacity-50">
                Retry
              </button>
            </div>
          )}
        </>
      )}

      {/* ─── DYNAMIC IN-PAGE SECTION: ONBOARDING FORM OR MEMBERS TABLE ─── */}
      {panelViewMode === 'student-onboard' ? (
        <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading student form...</div>}>
          {editingStudent ? (
            <EditStudent
              isOpen
              inline
              onClose={closeOnboarding}
              onSaveStudent={async (student) => {
                const saved = await handleUpdateStudent(student);
                setPanelViewMode('table');
                return saved;
              }}
              onSaveBulkStudents={handleAddBulkStudents}
              existingAdmissionIds={existingAdmissionIds}
              student={editingStudent}
            />
          ) : (
            <AddStudent
              isOpen
              inline
              onClose={closeOnboarding}
              onSaveStudent={async (student) => {
                const saved = await handleAddStudent(student);
                setPanelViewMode('table');
                return saved;
              }}
              onSaveBulkStudents={async (bulk) => {
                const saved = await handleAddBulkStudents(bulk);
                setPanelViewMode('table');
                return saved;
              }}
              existingAdmissionIds={existingAdmissionIds}
              initialMode={studentModalMode}
            />
          )}
        </Suspense>
      ) : panelViewMode === 'staff-onboard' ? (
        <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading staff form...</div>}>
          {editingStaff ? (
            <EditStaff
              isOpen
              inline
              onClose={closeOnboarding}
              onSaveStaff={async (staffInput) => {
                const saved = await handleUpdateStaff(staffInput);
                setPanelViewMode('table');
                return saved;
              }}
              onSaveBulkStaff={handleAddBulkStaff}
              existingStaffIds={existingStaffIds.filter((id) => id !== editingStaff.staffId)}
              staff={editingStaff}
            />
          ) : (
            <AddStaff
              isOpen
              inline
              onClose={closeOnboarding}
              onSaveStaff={async (staffInput) => {
                const saved = await handleAddStaff(staffInput);
                setPanelViewMode('table');
                return saved;
              }}
              onSaveBulkStaff={async (bulk) => {
                const saved = await handleAddBulkStaff(bulk);
                setPanelViewMode('table');
                return saved;
              }}
              existingStaffIds={existingStaffIds}
              initialMode={staffModalMode}
            />
          )}
        </Suspense>
      ) : panelViewMode === 'student-view' && selectedStudentForView ? (
        <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading student details...</div>}>
          <ViewStudent student={selectedStudentForView} onClose={closeMemberView} />
        </Suspense>
      ) : panelViewMode === 'staff-view' && selectedStaffForView ? (
        <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading staff profile...</div>}>
          <ViewStaff staff={selectedStaffForView} onClose={closeMemberView} />
        </Suspense>
      ) : panelViewMode === 'student-delete' && studentPendingDelete ? (
        <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading delete confirmation...</div>}>
          <DeleteStudent
            student={studentPendingDelete}
            error={studentDeleteError}
            isDeleting={isDeletingStudent}
            onCancel={cancelDeleteStudent}
            onConfirm={() => void confirmDeleteStudent()}
          />
        </Suspense>
      ) : panelViewMode === 'staff-delete' && staffPendingDelete ? (
        <Suspense fallback={<div className="p-6 text-sm text-zinc-500">Loading delete confirmation...</div>}>
          <DeleteStaff
            staff={staffPendingDelete}
            error={staffDeleteError}
            isDeleting={isDeletingStaff}
            onCancel={cancelDeleteStaff}
            onConfirm={() => void confirmDeleteStaff()}
          />
        </Suspense>
      ) : (
        <>
          {/* ─── ACTIVE TABLE FILTER STATUS ─── */}
          <div className="pt-2 flex items-center justify-between relative z-30">
            <div>
              {/* Active search / filter badge */}
              {(isFilterActive || searchQuery) && (
                <span className="text-[11px] text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2.5 py-1 rounded-md font-medium">
                  {filteredMembers.length} records shown
                </span>
              )}
            </div>
          </div>

          {/* ─── BELOW TABLE: ALL MEMBERS UNIFIED TABLE ───────────────────── */}
          <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden shadow-2xs">



            {recordsLoading ? (
              <div className="p-12 text-center text-sm text-zinc-500">
                Loading {managementType === 'students' ? 'students' : 'staff'}...
              </div>
            ) : paginatedMembers.length === 0 ? (
              <div className="p-12 text-center space-y-2">
                <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">
                  No {managementType === 'students' ? 'student' : 'staff'} records found
                </p>
                <p className="text-xs text-zinc-500 max-w-sm mx-auto">
                  No matching {managementType === 'students' ? 'students' : 'staff members'} found. Adjust your search keywords or clear your active filters.
                </p>
                {isFilterActive && (
                  <button
                    type="button"
                    onClick={resetAllFilters}
                    className="mt-2 inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-zinc-100 hover:bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                  >
                    Clear all filters
                  </button>
                )}
              </div>
            ) : (
              <Table>
                <Table.ScrollContainer>
                  <Table.Content aria-label={`${managementType} table`} className="min-w-[800px]">
                    <Table.Header>
                      <Table.Column isRowHeader>{managementType === 'students' ? 'Student Details' : 'Staff Details'}</Table.Column>
                      <Table.Column>{config.classFieldLabel || 'Department'}</Table.Column>
                      <Table.Column>{managementType === 'students' ? 'Academic Year' : 'Designation / Role'}</Table.Column>
                      <Table.Column>Contact</Table.Column>
                      <Table.Column>Blood Group</Table.Column>
                      <Table.Column>Status</Table.Column>
                      <Table.Column className="text-right">Actions</Table.Column>
                    </Table.Header>
                    <Table.Body>
                      {paginatedMembers.map((item) => (
                        <Table.Row key={`${item.type}-${item.id}`} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-850/60">

                          {/* Member Details */}
                          <Table.Cell>
                            <div className="flex items-center gap-3">
                              {item.photoUrl ? (
                                <img
                                  src={item.photoUrl}
                                  alt={item.name}
                                  className="w-8 h-8 rounded-full object-cover border border-zinc-200 dark:border-zinc-700 shadow-2xs shrink-0"
                                />
                              ) : (
                                <div className="w-8 h-8 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center font-bold text-xs text-zinc-700 dark:text-zinc-300 shrink-0">
                                  {item.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                              <div>
                                <p className="font-semibold text-sm text-zinc-900 dark:text-zinc-100">
                                  {item.name}
                                </p>
                                <p className="text-xs text-zinc-500 font-mono">
                                  {item.code}
                                </p>
                              </div>
                            </div>
                          </Table.Cell>

                          {/* Department / Program */}
                          <Table.Cell>
                            <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                              {item.department || 'General'}
                            </span>
                          </Table.Cell>

                          {/* Designation / Academic Year */}
                          <Table.Cell>
                            <span className="text-xs text-zinc-600 dark:text-zinc-400">
                              {item.roleOrYear}
                            </span>
                          </Table.Cell>

                          {/* Contact */}
                          <Table.Cell>
                            <div className="text-xs space-y-0.5">
                              {item.mobile && <p className="font-mono text-zinc-800 dark:text-zinc-200">{item.mobile}</p>}
                              {item.email && <p className="text-[11px] text-zinc-500">{item.email}</p>}
                              {!item.mobile && !item.email && <span className="text-zinc-400 text-xs">N/A</span>}
                            </div>
                          </Table.Cell>

                          {/* Blood Group */}
                          <Table.Cell>
                            {item.bloodGroup ? (
                              <span className="inline-flex px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 font-semibold">
                                {item.bloodGroup}
                              </span>
                            ) : (
                              <span className="text-zinc-400 text-xs">-</span>
                            )}
                          </Table.Cell>

                          {/* Status Badge (Pure White/Black/Gray) */}
                          <Table.Cell>
                            {item.status === 'Active' ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900">
                                <CheckCircle2 className="w-3 h-3" /> Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                                {item.status}
                              </span>
                            )}
                          </Table.Cell>

                          {/* Actions */}
                          <Table.Cell className="text-right">
                            <div className="flex justify-end">
                              <MemberActionsMenu
                                onEdit={() => editMember(item)}
                                onView={() => viewMember(item)}
                                onDelete={() => void handleDeleteMember(item)}
                              />
                            </div>
                          </Table.Cell>

                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Content>
                </Table.ScrollContainer>
              </Table>
            )}

            {/* Pagination Bar */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 text-xs">
                <span className="text-zinc-500">
                  Showing {(currentPage - 1) * PAGE_SIZE + 1} to {Math.min(currentPage * PAGE_SIZE, filteredMembers.length)} of {filteredMembers.length} records
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    Previous
                  </button>
                  <span className="text-zinc-700 dark:text-zinc-300 font-medium">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="px-3 py-1.5 rounded-lg border border-zinc-300 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}

          </div>
        </>
      )}

    </div>
  );
};
