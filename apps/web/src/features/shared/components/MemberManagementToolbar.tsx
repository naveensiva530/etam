import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Search,
  SlidersHorizontal,
  Trash2,
  GraduationCap,
  Briefcase,
  Upload,
  UserPlus,
  RotateCcw,
  Check,
  ChevronRight,
  ArrowLeft,
  X,
  FileSpreadsheet,
  Users,
  Sparkles,
  Settings,
  BookOpen,
  Layers,
} from 'lucide-react';
import { StudentRecord, StaffRecord } from '../types/common.types';
import { useOptionalTabs } from '@/components/ui/sidebar-with-chrome-like-tabs';

interface MemberManagementToolbarProps {
  managementType?: 'students' | 'staff';
  onOpenAcademicConfig?: () => void;
  // Onboard triggers
  onOpenStudentOnboard: (mode: 'single' | 'bulk') => void;
  onOpenStaffOnboard: (mode: 'single' | 'bulk') => void;

  // Search state
  searchQuery: string;
  onSearchChange: (query: string) => void;

  // Filter state
  memberTypeFilter: 'all' | 'students' | 'staff';
  onMemberTypeFilterChange: (type: 'all' | 'students' | 'staff') => void;
  statusFilter: 'all' | 'active' | 'inactive';
  onStatusFilterChange: (status: 'all' | 'active' | 'inactive') => void;
  onResetFilters: () => void;
  isFilterActive: boolean;

  // Recycle Bin state & actions
  recycledStudents: StudentRecord[];
  recycledStaff: StaffRecord[];
  onRestoreStudent: (id: string) => void;
  onRestoreStaff: (id: string) => void;
  onRestoreAll: () => void;
  onClearRecycleBin: () => void;
}

export const MemberManagementToolbar: React.FC<MemberManagementToolbarProps> = ({
  managementType,
  onOpenStudentOnboard,
  onOpenStaffOnboard,
  searchQuery,
  onSearchChange,
  memberTypeFilter,
  onMemberTypeFilterChange,
  statusFilter,
  onStatusFilterChange,
  onResetFilters,
  isFilterActive,
  recycledStudents,
  recycledStaff,
  onRestoreStudent,
  onRestoreStaff,
  onRestoreAll,
  onClearRecycleBin,
  onOpenAcademicConfig,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const tabs = useOptionalTabs();

  // Active dock view: 'none' | 'plus' | 'bulk' | 'filter' | 'recycle' | 'settings'
  const [activeMenu, setActiveMenu] = useState<'none' | 'plus' | 'bulk' | 'filter' | 'recycle' | 'settings'>('none');

  // Plus button nested view: 'root' | 'student' | 'staff'
  const [plusSubView, setPlusSubView] = useState<'root' | 'student' | 'staff'>('root');

  // Recycle button nested view: 'root' | 'student' | 'staff' | 'both'
  const [recycleSubView, setRecycleSubView] = useState<'root' | 'student' | 'staff' | 'both'>('root');

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setActiveMenu('none');
        setPlusSubView('root');
        setRecycleSubView('root');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMenu = (menu: 'plus' | 'bulk' | 'filter' | 'recycle' | 'settings') => {
    if (activeMenu === menu) {
      setActiveMenu('none');
      setPlusSubView('root');
      setRecycleSubView('root');
    } else {
      setActiveMenu(menu);
      setPlusSubView('root');
      setRecycleSubView('root');
    }
  };

  const totalRecycled = managementType === 'students'
    ? recycledStudents.length
    : managementType === 'staff'
      ? recycledStaff.length
      : recycledStudents.length + recycledStaff.length;

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
      {/* ─── SEARCH INPUT ON LEFT ─── */}
      <div className="relative w-full sm:w-72 md:w-80">
        <Search className="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="search"
          placeholder="Search..."
          aria-label={managementType === 'students' ? 'Search students' : managementType === 'staff' ? 'Search staff' : 'Search members'}
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-zinc-400 shadow-2xs transition-colors"
        />
      </div>

      {/* ─── ACTION BUTTONS ON RIGHT ─── */}
      <div ref={containerRef} className="relative flex items-center justify-end gap-2 flex-wrap">
        <motion.button
          type="button"
          title="Settings & Configuration"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => toggleMenu('settings')}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
            activeMenu === 'settings'
              ? 'bg-zinc-100 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-2xs'
          }`}
        >
          <Settings className="w-3.5 h-3.5" />
          Setting
        </motion.button>

        <motion.button
          type="button"
          title="Filter Records"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => toggleMenu('filter')}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
            activeMenu === 'filter' || isFilterActive
              ? 'bg-zinc-100 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-2xs'
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          Filter
        </motion.button>

        <motion.button
          type="button"
          title="Bulk Upload"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            if (managementType === 'students') {
              onOpenStudentOnboard('bulk');
              setActiveMenu('none');
            } else if (managementType === 'staff') {
              onOpenStaffOnboard('bulk');
              setActiveMenu('none');
            }
            else toggleMenu('bulk');
          }}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors ${
            activeMenu === 'bulk'
              ? 'bg-zinc-100 text-zinc-900 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-100 dark:border-zinc-700'
              : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 shadow-2xs'
          }`}
        >
          <Upload className="w-3.5 h-3.5" />
          Bulk Upload
        </motion.button>

        <motion.button
          type="button"
          title="Create New"
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => {
            if (managementType === 'students') {
              onOpenStudentOnboard('single');
              setActiveMenu('none');
            } else if (managementType === 'staff') {
              onOpenStaffOnboard('single');
              setActiveMenu('none');
            }
            else toggleMenu('plus');
          }}
          className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-colors ${
            activeMenu === 'plus'
              ? 'bg-zinc-950 text-white dark:bg-zinc-100 dark:text-zinc-950'
              : 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 shadow-2xs'
          }`}
        >
          <Plus className="w-3.5 h-3.5" />
          Create
        </motion.button>

        {/* ─── ANIMATED FLOATING SUBMENU (Solid background, NO shadow) ─── */}
        <AnimatePresence mode="wait">
          {activeMenu !== 'none' && (
            <motion.div
              key={activeMenu}
              initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.96 }}
            transition={{
              type: 'spring',
              stiffness: 420,
              damping: 28,
            }}
            className="absolute top-full mt-2.5 right-0 z-50 origin-top-right"
          >
            <div className="w-80 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5 text-zinc-900 dark:text-zinc-100">
              
              {/* ─── 1. PLUS MENU: Onboard (Student / Staff -> Single / Bulk) ─── */}
              {activeMenu === 'plus' && (
                <div>
                  <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-100 dark:border-zinc-800/80">
                    {plusSubView === 'root' ? (
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="uppercase tracking-wider text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                          Member Onboarding
                        </span>
                      </div>
                    ) : (
                      <motion.button
                        type="button"
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setPlusSubView('root')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back to Roles
                      </motion.button>
                    )}
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setActiveMenu('none')}
                      className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>

                  <AnimatePresence mode="wait">
                    {/* Level 1: Role Selection */}
                    {plusSubView === 'root' && (
                      <motion.div
                        key="role-root"
                        initial={{ opacity: 0, x: 8, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, x: -8, filter: 'blur(4px)' }}
                        transition={{ duration: 0.16 }}
                        className="space-y-1.5 pt-0.5"
                      >
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.01, x: 2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            onOpenStudentOnboard('single');
                            setActiveMenu('none');
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-zinc-200/80 dark:hover:border-zinc-800 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-all text-left group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 group-hover:bg-zinc-950 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950 transition-colors">
                              <GraduationCap className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Student Onboard</p>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Single student admission form</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-transform" />
                        </motion.button>

                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.01, x: 2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            onOpenStaffOnboard('single');
                            setActiveMenu('none');
                          }}
                          className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-zinc-200/80 dark:hover:border-zinc-800 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-all text-left group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 group-hover:bg-zinc-950 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950 transition-colors">
                              <Briefcase className="w-4 h-4" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Staff Onboard</p>
                              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Single staff profile</p>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-transform" />
                        </motion.button>
                      </motion.div>
                    )}

                    {/* Level 2: Student Options */}
                    {plusSubView === 'student' && (
                      <motion.div
                        key="student-options"
                        initial={{ opacity: 0, x: 8, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, x: -8, filter: 'blur(4px)' }}
                        transition={{ duration: 0.16 }}
                        className="space-y-1.5 pt-0.5"
                      >
                        <p className="text-[11px] font-semibold text-zinc-400 px-1 pb-0.5">Select Enrollment Method:</p>
                        
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.01, x: 2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            onOpenStudentOnboard('single');
                            setActiveMenu('none');
                          }}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-all text-left group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 group-hover:bg-zinc-950 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950 transition-colors">
                            <UserPlus className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Single Student Form</p>
                            <p className="text-[11px] text-zinc-500">Manual admission details entry</p>
                          </div>
                        </motion.button>

                      </motion.div>
                    )}

                    {/* Level 2: Staff Options */}
                    {plusSubView === 'staff' && (
                      <motion.div
                        key="staff-options"
                        initial={{ opacity: 0, x: 8, filter: 'blur(4px)' }}
                        animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
                        exit={{ opacity: 0, x: -8, filter: 'blur(4px)' }}
                        transition={{ duration: 0.16 }}
                        className="space-y-1.5 pt-0.5"
                      >
                        <p className="text-[11px] font-semibold text-zinc-400 px-1 pb-0.5">Select Recruitment Method:</p>
                        
                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.01, x: 2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            onOpenStaffOnboard('single');
                            setActiveMenu('none');
                          }}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-all text-left group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 group-hover:bg-zinc-950 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950 transition-colors">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Single Staff Profile</p>
                            <p className="text-[11px] text-zinc-500">Add individual professor / staff</p>
                          </div>
                        </motion.button>

                        <motion.button
                          type="button"
                          whileHover={{ scale: 1.01, x: 2 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => {
                            onOpenStaffOnboard('bulk');
                            setActiveMenu('none');
                          }}
                          className="w-full flex items-center gap-3 p-2.5 rounded-xl border border-zinc-200/60 dark:border-zinc-800 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-all text-left group"
                        >
                          <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 group-hover:bg-zinc-950 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950 transition-colors">
                            <Upload className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Bulk Staff CSV Upload</p>
                            <p className="text-[11px] text-zinc-500">Import faculty roster with roles</p>
                          </div>
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {activeMenu === 'bulk' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="uppercase tracking-wider text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                      Bulk Upload
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveMenu('none')}
                      aria-label="Close bulk upload menu"
                      className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenStudentOnboard('bulk');
                      setActiveMenu('none');
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <GraduationCap className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-semibold">Student Bulk Upload</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onOpenStaffOnboard('bulk');
                      setActiveMenu('none');
                    }}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl text-left hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                  >
                    <span className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center">
                      <Briefcase className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-semibold">Staff Bulk Upload</span>
                  </button>
                </div>
              )}

              {/* ─── 2. FILTER MENU ─── */}
              {activeMenu === 'filter' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <span className="uppercase tracking-wider text-[11px] font-bold text-zinc-500">Filter Records</span>
                    {isFilterActive && (
                      <button
                        type="button"
                        onClick={onResetFilters}
                        className="text-[11px] text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 underline flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Reset
                      </button>
                    )}
                  </div>

                  {/* Filter by Type */}
                  {!managementType && (
                    <div className="space-y-1.5">
                      <p className="text-[11px] font-semibold text-zinc-500">Member Type:</p>
                      <div className="grid grid-cols-3 gap-1.5 text-xs">
                        {(['all', 'students', 'staff'] as const).map((t) => (
                          <button
                            key={t}
                            type="button"
                            onClick={() => onMemberTypeFilterChange(t)}
                            className={`py-1.5 px-2 rounded-xl text-center font-medium capitalize transition-all ${
                              memberTypeFilter === t
                                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-2xs'
                                : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                            }`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Filter by Status */}
                  <div className="space-y-1.5">
                    <p className="text-[11px] font-semibold text-zinc-500">Status:</p>
                    <div className="grid grid-cols-3 gap-1.5 text-xs">
                      {(['all', 'active', 'inactive'] as const).map((s) => (
                        <button
                          key={s}
                          type="button"
                          onClick={() => onStatusFilterChange(s)}
                          className={`py-1.5 px-2 rounded-xl text-center font-medium capitalize transition-all ${
                            statusFilter === s
                              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 font-semibold shadow-2xs'
                              : 'bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800/60 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ─── 3. RECYCLE MENU ─── */}
              {activeMenu === 'recycle' && (
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    {recycleSubView === 'root' ? (
                      <span className="uppercase tracking-wider text-[11px] font-bold text-zinc-500">Recycle Bin</span>
                    ) : (
                      <motion.button
                        type="button"
                        whileHover={{ x: -2 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setRecycleSubView('root')}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white"
                      >
                        <ArrowLeft className="w-3.5 h-3.5" /> Back
                      </motion.button>
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveMenu('none')}
                      className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Level 1: Choose Recycle Bin category */}
                  {recycleSubView === 'root' && !managementType && (
                    <div className="space-y-1.5 pt-0.5">
                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setRecycleSubView('student')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-zinc-200/80 dark:hover:border-zinc-800 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:bg-zinc-950 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950 transition-colors">
                            <GraduationCap className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Student Recycle</p>
                            <p className="text-[11px] text-zinc-500">
                              {recycledStudents.length} student{recycledStudents.length === 1 ? '' : 's'} in bin
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setRecycleSubView('staff')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-zinc-200/80 dark:hover:border-zinc-800 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:bg-zinc-950 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950 transition-colors">
                            <Briefcase className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Staff Recycle</p>
                            <p className="text-[11px] text-zinc-500">
                              {recycledStaff.length} staff member{recycledStaff.length === 1 ? '' : 's'} in bin
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                      </motion.button>

                      <motion.button
                        type="button"
                        whileHover={{ scale: 1.01, x: 2 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setRecycleSubView('both')}
                        className="w-full flex items-center justify-between p-2.5 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-all text-left group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-700 dark:text-zinc-300 group-hover:bg-zinc-950 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950 transition-colors">
                            <Users className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Both (All Recycle)</p>
                            <p className="text-[11px] text-zinc-500">
                              {totalRecycled} total member{totalRecycled === 1 ? '' : 's'} in bin
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
                      </motion.button>
                    </div>
                  )}

                  {/* Level 2: Student Recycle list / actions */}
                  {recycleSubView === 'student' && (
                    <div className="space-y-2 pt-0.5 max-h-56 overflow-y-auto no-scrollbar">
                      {recycledStudents.length > 0 && (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => { onRestoreAll(); setActiveMenu('none'); }} className="flex-1 rounded-lg bg-zinc-900 px-2 py-1.5 text-[11px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">Restore all</button>
                          <button type="button" onClick={() => { if (confirm('Permanently clear all student records from the recycle bin?')) { onClearRecycleBin(); setActiveMenu('none'); } }} className="rounded-lg border border-zinc-200 px-2 py-1.5 text-[11px] font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">Empty bin</button>
                        </div>
                      )}
                      {recycledStudents.length === 0 ? (
                        <p className="text-xs text-zinc-500 p-4 text-center">No student records in recycle bin.</p>
                      ) : (
                        recycledStudents.map((s) => (
                          <div
                            key={s.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 text-xs border border-zinc-100 dark:border-zinc-800"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{s.studentName}</p>
                              <p className="text-[10px] text-zinc-400 font-mono">{s.admissionId}</p>
                            </div>
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onRestoreStudent(s.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shrink-0"
                            >
                              Restore
                            </motion.button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Level 2: Staff Recycle list / actions */}
                  {recycleSubView === 'staff' && (
                    <div className="space-y-2 pt-0.5 max-h-56 overflow-y-auto no-scrollbar">
                      {recycledStaff.length > 0 && (
                        <div className="flex gap-2">
                          <button type="button" onClick={() => { onRestoreAll(); setActiveMenu('none'); }} className="flex-1 rounded-lg bg-zinc-900 px-2 py-1.5 text-[11px] font-semibold text-white dark:bg-zinc-100 dark:text-zinc-900">Restore all</button>
                          <button type="button" onClick={() => { if (confirm('Permanently clear all staff records from the recycle bin?')) { onClearRecycleBin(); setActiveMenu('none'); } }} className="rounded-lg border border-zinc-200 px-2 py-1.5 text-[11px] font-semibold text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">Empty bin</button>
                        </div>
                      )}
                      {recycledStaff.length === 0 ? (
                        <p className="text-xs text-zinc-500 p-4 text-center">No staff records in recycle bin.</p>
                      ) : (
                        recycledStaff.map((st) => (
                          <div
                            key={st.id}
                            className="flex items-center justify-between p-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/60 text-xs border border-zinc-100 dark:border-zinc-800"
                          >
                            <div className="min-w-0 pr-2">
                              <p className="font-semibold text-zinc-900 dark:text-zinc-100 truncate">{st.name}</p>
                              <p className="text-[10px] text-zinc-400 font-mono">{st.staffId}</p>
                            </div>
                            <motion.button
                              type="button"
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => onRestoreStaff(st.id)}
                              className="px-2.5 py-1 text-[11px] font-semibold rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shrink-0"
                            >
                              Restore
                            </motion.button>
                          </div>
                        ))
                      )}
                    </div>
                  )}

                  {/* Level 2: Both Recycle list / actions */}
                  {recycleSubView === 'both' && (
                    <div className="space-y-2.5 pt-0.5">
                      <div className="p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 text-xs space-y-1 border border-zinc-100 dark:border-zinc-800">
                        <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                          {totalRecycled} deleted records available
                        </p>
                        <p className="text-[11px] text-zinc-500">
                          {recycledStudents.length} Students • {recycledStaff.length} Staff
                        </p>
                      </div>

                      {totalRecycled > 0 && (
                        <div className="flex items-center gap-2 pt-1">
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              onRestoreAll();
                              setActiveMenu('none');
                            }}
                            className="flex-1 py-1.5 px-3 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-2xs"
                          >
                            Restore All
                          </motion.button>
                          <motion.button
                            type="button"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.97 }}
                            onClick={() => {
                              if (confirm('Permanently clear all items from recycle bin?')) {
                                onClearRecycleBin();
                                setActiveMenu('none');
                              }
                            }}
                            className="py-1.5 px-3 text-xs font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                          >
                            Empty Bin
                          </motion.button>
                        </div>
                      )}
                    </div>
                  )}

                </div>
              )}

              {/* ─── 4. SETTINGS MENU ─── */}
              {activeMenu === 'settings' && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5">
                      <Settings className="w-3.5 h-3.5 text-zinc-400" />
                      <span className="uppercase tracking-wider text-[11px] font-bold text-zinc-500 dark:text-zinc-400">
                        Settings &amp; Configuration
                      </span>
                    </div>
                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => setActiveMenu('none')}
                      className="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </motion.button>
                  </div>

                  <motion.button
                    type="button"
                    whileHover={{ scale: 1.01, x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActiveMenu('none');
                      if (onOpenAcademicConfig) {
                        onOpenAcademicConfig();
                      } else if (tabs) {
                        tabs.setActiveNav('settings');
                      }
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-zinc-200/80 dark:hover:border-zinc-800 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 group-hover:bg-zinc-950 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950 transition-colors">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          Academic &amp; Subject Configuration
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-transform" />
                  </motion.button>

                  <motion.button
                    type="button"
                    whileHover={{ x: 2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setActiveMenu('none');
                      if (tabs) {
                        tabs.setActiveNav('subject-master');
                      }
                    }}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-transparent hover:border-zinc-200/80 dark:hover:border-zinc-800 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 transition-all text-left group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-800 dark:text-zinc-200 group-hover:bg-zinc-950 group-hover:text-white dark:group-hover:bg-zinc-100 dark:group-hover:text-zinc-950 transition-colors">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                          Subject Master
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 dark:group-hover:text-zinc-100 group-hover:translate-x-0.5 transition-transform" />
                  </motion.button>
                </div>
              )}

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      </div>
    </div>
  );
};
