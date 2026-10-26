import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  ArrowLeft,
  Upload,
  Users,
  UserCheck,
  UserX,
  ChevronRight,
  X,
  CheckCircle2,
  Settings,
  ChevronDown,
  Plus,
  Search,
  Trash2,
  Pencil,
} from 'lucide-react';
import { Table } from '@/components/ui/heroui-table';
import { useInstitution } from '@/context/InstitutionContext';
import { useTabs } from '@/components/ui/sidebar-with-chrome-like-tabs';
import { getAllStudents } from '@/features/students/api';
import type { StudentRecord } from '@/features/shared';
import {
  getAcademicSections,
  createAcademicSection,
  deleteAcademicSection,
  renameAcademicSection,
  getAcademicConfigurations,
  getAcademicConfigAllocations,
  saveAcademicConfigAllocations,
  updateAcademicConfigurationSections,
} from '../api';
import type { AcademicSectionItem } from '../api';
import type {
  AcademicConfigItem,
  AcademicConfigAllocations,
  SectionSubject,
  SubjectMasterRecord,
} from '../types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (typeof error === 'object' && error !== null && 'response' in error) {
    const r = (error as any).response;
    if (r?.data?.message && typeof r.data.message === 'string') return r.data.message;
  }
  return error instanceof Error && error.message ? error.message : fallback;
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface AllocationViewProps {
  selectedConfig: AcademicConfigItem;
  subjectMaster: SubjectMasterRecord[];
  configs: AcademicConfigItem[];
  setConfigs: React.Dispatch<React.SetStateAction<AcademicConfigItem[]>>;
  isAllocationOnly: boolean;
  onBack: () => void;
  showToast: (msg: string) => void;
}

// ── Component ─────────────────────────────────────────────────────────────────

export const AllocationView: React.FC<AllocationViewProps> = ({
  selectedConfig: initialConfig,
  subjectMaster,
  configs,
  setConfigs,
  isAllocationOnly,
  onBack,
  showToast,
}) => {
  const { institutionType } = useInstitution();
  const { addTab } = useTabs();

  // ── Local config state (so rename/delete sections refreshes it) ──
  const [selectedConfig, setSelectedConfig] = useState<AcademicConfigItem>(initialConfig);
  useEffect(() => { setSelectedConfig(initialConfig); }, [initialConfig.id]);

  // ── Sections ──
  const [sectionCatalog, setSectionCatalog] = useState<AcademicSectionItem[]>([]);
  const [selectedClassSections, setSelectedClassSections] = useState<string[]>(initialConfig.sections);
  const [isSectionDropdownOpen, setIsSectionDropdownOpen] = useState(false);
  const [sectionSearchQuery, setSectionSearchQuery] = useState('');
  const sectionDropdownRef = useRef<HTMLDivElement>(null);
  const [isSectionManagerOpen, setIsSectionManagerOpen] = useState(false);
  const [isAddingSection, setIsAddingSection] = useState(false);
  const [newSectionName, setNewSectionName] = useState('');
  const [editingSectionName, setEditingSectionName] = useState<string | null>(null);
  const [sectionEditValue, setSectionEditValue] = useState('');
  const [isSavingSections, setIsSavingSections] = useState(false);

  // ── Students ──
  const [allStudents, setAllStudents] = useState<StudentRecord[]>([]);
  const [studentsLoaded, setStudentsLoaded] = useState(false);

  // ── Allocations ──
  const [sectionSubjectsMap, setSectionSubjectsMap] = useState<Record<string, SectionSubject[]>>({});
  const [studentSectionMap, setStudentSectionMap] = useState<Record<string, string>>({});
  const [allocationsLoadedFor, setAllocationsLoadedFor] = useState<string | null>(null);

  // ── Subject allocation tab ──
  const [activeAllocTab, setActiveAllocTab] = useState<'sections' | 'subjects'>(
    isAllocationOnly ? 'subjects' : 'sections',
  );
  const [expandedSubjectSection, setExpandedSubjectSection] = useState<string | null>(
    isAllocationOnly ? selectedConfig.sections[0] ?? null : null,
  );
  const [selectedSectionForSubject, setSelectedSectionForSubject] = useState(
    selectedConfig.sections[0] || '',
  );

  // ── Subject assignment forms ──
  const [isSingleSubjectFormOpen, setIsSingleSubjectFormOpen] = useState(false);
  const [subTargetSection, setSubTargetSection] = useState<string>('all');
  const [selectedMasterSubjectId, setSelectedMasterSubjectId] = useState('');
  const [subError, setSubError] = useState('');

  // ── Bulk subject assignment form ──
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const [bulkTargetSection, setBulkTargetSection] = useState<string>('all');
  const [bulkSubjectSearch, setBulkSubjectSearch] = useState('');
  const [selectedMasterSubjectIds, setSelectedMasterSubjectIds] = useState<string[]>([]);
  const [bulkUploadError, setBulkUploadError] = useState('');

  // ── Effects ───────────────────────────────────────────────────────────────

  // Close section dropdown on outside click
  useEffect(() => {
    if (!isSectionDropdownOpen) return;
    const close = (e: MouseEvent) => {
      if (!sectionDropdownRef.current?.contains(e.target as Node)) setIsSectionDropdownOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [isSectionDropdownOpen]);

  // Sync sections when config changes
  useEffect(() => {
    setSelectedClassSections(selectedConfig.sections);
  }, [selectedConfig.id]);

  // Load section catalog
  useEffect(() => {
    let mounted = true;
    getAcademicSections()
      .then((sections) => { if (mounted) setSectionCatalog(sections); })
      .catch((err: unknown) => { if (mounted) showToast(getErrorMessage(err, 'Unable to load sections.')); });
    return () => { mounted = false; };
  }, [configs.length]);

  // Load students
  useEffect(() => {
    let mounted = true;
    getAllStudents(institutionType)
      .then((res) => { if (mounted) { setAllStudents(res); setStudentsLoaded(true); } })
      .catch((err: unknown) => { if (mounted) { setAllStudents([]); setStudentsLoaded(true); showToast(err instanceof Error ? err.message : 'Unable to load students.'); } });
    return () => { mounted = false; };
  }, [institutionType]);

  // Load allocations
  useEffect(() => {
    if (!studentsLoaded) return;
    let mounted = true;
    setAllocationsLoadedFor(null);
    setSectionSubjectsMap({});
    setStudentSectionMap({});
    getAcademicConfigAllocations(selectedConfig.id)
      .then(async (allocations) => {
        if (!mounted) return;
        let persisted = allocations;
        const migrationMarker = `e_tam_allocations_migrated_${selectedConfig.id}`;
        if (
          !Object.keys(allocations.sectionSubjects).length &&
          !Object.keys(allocations.studentSections).length &&
          localStorage.getItem(migrationMarker) !== 'true'
        ) {
          // Legacy localStorage migration
          const legacyConfigVal = localStorage.getItem('e_tam_academic_configs');
          const legacySubjectsVal = localStorage.getItem('e_tam_section_subjects');
          const legacyStudentsVal = localStorage.getItem('e_tam_student_sections');
          if (legacyConfigVal && legacySubjectsVal && legacyStudentsVal) {
            try {
              const legacyConfigs: unknown = JSON.parse(legacyConfigVal);
              const legacySubjectMap: unknown = JSON.parse(legacySubjectsVal);
              const legacyStudentMap: unknown = JSON.parse(legacyStudentsVal);
              if (Array.isArray(legacyConfigs) && typeof legacySubjectMap === 'object' && legacySubjectMap !== null) {
                const legacyConfig = (legacyConfigs as any[]).find(
                  (item) => item?.academicYear === selectedConfig.academicYear && item?.className === selectedConfig.className,
                );
                const legacyId = legacyConfig?.id;
                if (typeof legacyId === 'string') {
                  const prefix = `${legacyId}_`;
                  const validSections = new Set(selectedConfig.sections);
                  const sectionSubjects: Record<string, SectionSubject[]> = {};
                  Object.entries(legacySubjectMap as Record<string, unknown>).forEach(([key, value]) => {
                    const sectionName = key.startsWith(prefix) ? key.slice(prefix.length) : '';
                    if (!validSections.has(sectionName) || !Array.isArray(value)) return;
                    const migrated = value.filter((s): s is SectionSubject =>
                      typeof s === 'object' && s !== null && typeof (s as any).id === 'string' &&
                      (s as any).id.startsWith('secsub-') && typeof (s as any).code === 'string' && typeof (s as any).name === 'string'
                    );
                    if (migrated.length) sectionSubjects[`${selectedConfig.id}_${sectionName}`] = migrated;
                  });
                  const eligibleIds = new Set(currentConfigStudents.map((s) => s.id));
                  const studentSections: Record<string, string> = {};
                  if (typeof legacyStudentMap === 'object' && legacyStudentMap !== null) {
                    Object.entries(legacyStudentMap as Record<string, unknown>).forEach(([sid, section]) => {
                      if (eligibleIds.has(sid) && typeof section === 'string' && validSections.has(section)) {
                        studentSections[sid] = section;
                      }
                    });
                  }
                  if (Object.keys(sectionSubjects).length || Object.keys(studentSections).length) {
                    persisted = await saveAcademicConfigAllocations(selectedConfig.id, { sectionSubjects, studentSections });
                  }
                }
              }
            } catch {
              // Migration failed silently
            }
          }
          localStorage.setItem(migrationMarker, 'true');
        }
        if (!mounted) return;
        setSectionSubjectsMap(persisted.sectionSubjects);
        setStudentSectionMap(persisted.studentSections);
        setAllocationsLoadedFor(selectedConfig.id);
      })
      .catch((err: unknown) => { if (mounted) showToast(getErrorMessage(err, 'Unable to load allocation data.')); });
    return () => { mounted = false; };
  }, [selectedConfig.id, studentsLoaded]);

  // ── Derived / Memos ───────────────────────────────────────────────────────

  const currentConfigStudents = useMemo(() => {
    return allStudents.filter((s) => {
      const matchYear = s.academicYear === selectedConfig.academicYear;
      const matchClass =
        s.department.toLowerCase().includes(selectedConfig.className.toLowerCase()) ||
        selectedConfig.className.toLowerCase().includes(s.department.toLowerCase());
      return matchYear && matchClass;
    });
  }, [allStudents, selectedConfig]);

  const allocatedCount = useMemo(
    () => currentConfigStudents.filter((s) => Boolean(studentSectionMap[s.id])).length,
    [currentConfigStudents, studentSectionMap],
  );
  const unallocatedCount = currentConfigStudents.length - allocatedCount;

  const currentSectionKey = `${selectedConfig.id}_${selectedSectionForSubject}`;
  const currentSectionSubjects = useMemo(
    () => sectionSubjectsMap[currentSectionKey] || [],
    [sectionSubjectsMap, currentSectionKey],
  );

  // ── Helpers ───────────────────────────────────────────────────────────────

  const persistAllocations = async (
    nextSectionSubjects: Record<string, SectionSubject[]>,
    nextStudentSections: Record<string, string>,
  ) => {
    if (allocationsLoadedFor !== selectedConfig.id) {
      throw new Error('Allocation data has not finished loading. Please try again.');
    }
    const sectionPrefix = `${selectedConfig.id}_`;
    const sectionSubjects = Object.fromEntries(
      Object.entries(nextSectionSubjects).filter(([key]) => key.startsWith(sectionPrefix)),
    );
    const allocations: AcademicConfigAllocations = { sectionSubjects, studentSections: nextStudentSections };
    const saved = await saveAcademicConfigAllocations(selectedConfig.id, allocations);
    setSectionSubjectsMap(saved.sectionSubjects);
    setStudentSectionMap(saved.studentSections);
  };

  const persistSectionChanges = async (sections: string[]) => {
    setIsSavingSections(true);
    try {
      const updatedConfig = await updateAcademicConfigurationSections(
        selectedConfig.id,
        selectedConfig.sections,
        sections,
      );
      setSelectedConfig(updatedConfig);
      setConfigs((current) => current.map((c) => (c.id === updatedConfig.id ? updatedConfig : c)));
      setSelectedClassSections(updatedConfig.sections);
      void getAcademicSections()
        .then(setSectionCatalog)
        .catch((err: unknown) => showToast(getErrorMessage(err, 'Unable to refresh section counts.')));
      const removed = selectedConfig.sections.filter((s) => !sections.includes(s));
      if (removed.length > 0) {
        setStudentSectionMap((current) =>
          Object.fromEntries(Object.entries(current).filter(([, section]) => !removed.includes(section))),
        );
        setSectionSubjectsMap((current) => {
          const next = { ...current };
          removed.forEach((s) => delete next[`${updatedConfig.id}_${s}`]);
          return next;
        });
        if (removed.includes(selectedSectionForSubject)) setSelectedSectionForSubject(sections[0] || '');
      }
      return updatedConfig;
    } finally {
      setIsSavingSections(false);
    }
  };

  // ── Section handlers ──────────────────────────────────────────────────────

  const handleAddSection = async () => {
    if (isSavingSections) return;
    const name = newSectionName.trim();
    if (!name) { showToast('Enter a section name.'); return; }
    if (name.length > 100) { showToast('Section name must be 100 characters or fewer.'); return; }
    if (sectionCatalog.some((s) => s.name.toLowerCase() === name.toLowerCase())) {
      showToast('A section with this name already exists for this account.'); return;
    }
    if (sectionCatalog.length >= 100) { showToast('This account can have a maximum of 100 sections.'); return; }
    setIsSavingSections(true);
    try {
      const created = await createAcademicSection(name);
      setSectionCatalog((cur) => [...cur, created].sort((a, b) => a.name.localeCompare(b.name)));
      setNewSectionName('');
      setIsAddingSection(false);
      showToast(`Section "${name}" added.`);
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to add section.'));
    } finally {
      setIsSavingSections(false);
    }
  };

  const handleRenameSection = async (sectionId: string) => {
    if (isSavingSections) return;
    const section = sectionCatalog.find((s) => s.id === sectionId);
    if (!section) return;
    const newName = sectionEditValue.trim();
    if (!newName) { showToast('Enter a section name.'); return; }
    if (sectionCatalog.some((s) => s.id !== section.id && s.name.toLowerCase() === newName.toLowerCase())) {
      showToast('A section with this name already exists for this account.'); return;
    }
    if (section.name === newName) { setEditingSectionName(null); return; }
    setIsSavingSections(true);
    try {
      const renamed = await renameAcademicSection(section.id, newName);
      const [updatedConfigs, updatedSections] = await Promise.all([getAcademicConfigurations(), getAcademicSections()]);
      setConfigs(updatedConfigs);
      setSectionCatalog(updatedSections);
      setSelectedClassSections((cur) => cur.map((n) => (n === section.name ? renamed.name : n)));
      setSelectedSectionForSubject((cur) => (cur === section.name ? renamed.name : cur));
      const updatedConfig = updatedConfigs.find((c) => c.id === selectedConfig.id);
      if (updatedConfig) {
        const allocations = await getAcademicConfigAllocations(updatedConfig.id);
        setSelectedConfig(updatedConfig);
        setStudentSectionMap(allocations.studentSections);
        setSectionSubjectsMap(allocations.sectionSubjects);
      }
      setEditingSectionName(null);
      showToast(`Section renamed to "${newName}".`);
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to rename section.'));
    } finally {
      setIsSavingSections(false);
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (isSavingSections) return;
    const section = sectionCatalog.find((s) => s.id === sectionId);
    if (!section) return;
    const detail = section.classCount > 0
      ? ` It is assigned to ${section.classCount} class(es), and related student/subject allocations will also be removed.`
      : '';
    if (!window.confirm(`Delete section "${section.name}" from this account?${detail}`)) return;
    setIsSavingSections(true);
    try {
      await deleteAcademicSection(section.id);
      const [updatedConfigs, updatedSections] = await Promise.all([getAcademicConfigurations(), getAcademicSections()]);
      setConfigs(updatedConfigs);
      setSectionCatalog(updatedSections);
      setSelectedClassSections((cur) => cur.filter((n) => n !== section.name));
      const updatedConfig = updatedConfigs.find((c) => c.id === selectedConfig.id);
      if (updatedConfig) {
        const allocations = await getAcademicConfigAllocations(updatedConfig.id);
        setSelectedConfig(updatedConfig);
        setStudentSectionMap(allocations.studentSections);
        setSectionSubjectsMap(allocations.sectionSubjects);
      }
      if (selectedSectionForSubject === section.name) setSelectedSectionForSubject(updatedConfig?.sections[0] || '');
      showToast(`Section "${section.name}" deleted from this account.`);
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to delete section.'));
    } finally {
      setIsSavingSections(false);
    }
  };

  // ── Assign sections to class ──────────────────────────────────────────────

  const handleAssignSectionsToClass = async () => {
    const availableSectionNames = new Set(sectionCatalog.map((s) => s.name));
    const sections = selectedClassSections.filter((s) => availableSectionNames.has(s));
    const removed = selectedConfig.sections.filter((s) => !sections.includes(s));
    const assignedStudents = currentConfigStudents.filter((s) => removed.includes(studentSectionMap[s.id])).length;
    const assignedSubjects = removed.reduce(
      (count, s) => count + (sectionSubjectsMap[`${selectedConfig.id}_${s}`]?.length || 0), 0,
    );
    if (removed.length > 0) {
      const warning = [
        assignedStudents ? `${assignedStudents} student assignment(s)` : '',
        assignedSubjects ? `${assignedSubjects} subject allocation(s)` : '',
      ].filter(Boolean);
      const detail = warning.length ? ` This also removes ${warning.join(' and ')}.` : '';
      if (!window.confirm(`Remove ${removed.length} section(s) from this class?${detail}`)) return;
    }
    try {
      await persistSectionChanges(sections);
      if (sections[0]) setSelectedSectionForSubject(sections[0]);
      showToast(`Assigned ${sections.length} section${sections.length === 1 ? '' : 's'} to ${selectedConfig.className}.`);
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to assign sections to this class.'));
    }
  };

  // ── Subject allocation handlers ───────────────────────────────────────────

  const getAvailableMasterSubjects = (targetSections: string[]) => subjectMaster
    .filter((subject) =>
      subject.status === 'Active' &&
      targetSections.every((section) =>
        !(sectionSubjectsMap[`${selectedConfig.id}_${section}`] || [])
          .some((allocated) => allocated.code.toUpperCase() === subject.code.toUpperCase()),
      ),
    )
    .sort((left, right) => left.name.localeCompare(right.name));

  const handleAddSubjectToSection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedConfig.sections.length === 0) { setSubError('Add a section to this configuration before allocating subjects.'); return; }
    const subject = subjectMaster.find((item) => item.id === selectedMasterSubjectId && item.status === 'Active');
    if (!subject) { setSubError('Select an active subject from Subject Master.'); return; }
    const newSubject: SectionSubject = {
      id: `secsub-${Date.now()}`,
      code: subject.code,
      name: subject.name,
      type: subject.type,
    };
    const updatedMap = { ...sectionSubjectsMap };
    const targetSections = subTargetSection === 'all' ? selectedConfig.sections : [subTargetSection];
    if (targetSections.some((section) =>
      (sectionSubjectsMap[`${selectedConfig.id}_${section}`] || [])
        .some((allocated) => allocated.code.toUpperCase() === subject.code.toUpperCase()),
    )) {
      setSubError('This subject is already allocated to one of the selected sections.');
      return;
    }
    targetSections.forEach((sec) => {
      const key = `${selectedConfig.id}_${sec}`;
      updatedMap[key] = [newSubject, ...(updatedMap[key] || [])];
    });
    try {
      await persistAllocations(updatedMap, studentSectionMap);
    } catch (err) {
      setSubError(getErrorMessage(err, 'Unable to save subject allocation.')); return;
    }
    setIsSingleSubjectFormOpen(false);
    setSelectedMasterSubjectId('');
    setSubError('');
    showToast(subTargetSection === 'all' ? `Subject allocated to all ${targetSections.length} sections!` : `Subject allocated to ${subTargetSection}!`);
  };

  const handleBulkUploadSubjects = async () => {
    if (selectedConfig.sections.length === 0) { setBulkUploadError('Add a section to this configuration before allocating subjects.'); return; }
    const targetSections = bulkTargetSection === 'all' ? selectedConfig.sections : [bulkTargetSection];
    const selectedSubjects = subjectMaster.filter(
      (subject) => subject.status === 'Active' && selectedMasterSubjectIds.includes(subject.id),
    );
    if (selectedSubjects.length === 0) { setBulkUploadError('Select at least one active subject from Subject Master.'); return; }
    const newSubjects: SectionSubject[] = selectedSubjects.map((subject) => ({
      id: `secsub-${Date.now()}-${subject.id}`,
      code: subject.code,
      name: subject.name,
      type: subject.type,
    }));
    const updatedMap = { ...sectionSubjectsMap };
    targetSections.forEach((sec) => {
      const key = `${selectedConfig.id}_${sec}`;
      const alreadyAllocated = new Set(
        (updatedMap[key] || []).map((subject) => subject.code.toUpperCase()),
      );
      updatedMap[key] = [
        ...newSubjects.filter((subject) => !alreadyAllocated.has(subject.code.toUpperCase())),
        ...(updatedMap[key] || []),
      ];
    });
    try {
      await persistAllocations(updatedMap, studentSectionMap);
    } catch (err) {
      setBulkUploadError(getErrorMessage(err, 'Unable to save subject allocations.')); return;
    }
    setIsBulkUploadOpen(false);
    setSelectedMasterSubjectIds([]);
    setBulkSubjectSearch('');
    setBulkUploadError('');
    showToast(bulkTargetSection === 'all' ? `Bulk uploaded ${newSubjects.length} subjects to all sections!` : `Bulk uploaded ${newSubjects.length} subjects to ${bulkTargetSection}!`);
  };

  const handleDeleteSubjectFromSection = async (subId: string, sectionKey: string) => {
    const existing = sectionSubjectsMap[sectionKey] || [];
    const updatedMap = { ...sectionSubjectsMap, [sectionKey]: existing.filter((s) => s.id !== subId) };
    try {
      await persistAllocations(updatedMap, studentSectionMap);
      showToast('Subject removed from section.');
    } catch (err) {
      showToast(getErrorMessage(err, 'Unable to remove subject from section.'));
    }
  };

  const singleTargetSections = subTargetSection === 'all' ? selectedConfig.sections : [subTargetSection];
  const singleAvailableSubjects = getAvailableMasterSubjects(singleTargetSections);
  const bulkTargetSections = bulkTargetSection === 'all' ? selectedConfig.sections : [bulkTargetSection];
  const bulkAvailableSubjects = getAvailableMasterSubjects(bulkTargetSections);
  const filteredBulkSubjects = bulkAvailableSubjects.filter((subject) =>
    `${subject.code} ${subject.name} ${subject.type}`
      .toLowerCase()
      .includes(bulkSubjectSearch.trim().toLowerCase()),
  );

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5 font-sans">
      {/* ── Top navigation ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-xs font-semibold text-zinc-800 dark:text-zinc-200 shadow-2xs transition-colors self-start sm:self-auto"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Configurations
        </button>
        {!isAllocationOnly && (
          <button
            type="button"
            onClick={() => {
              sessionStorage.setItem('e_tam_pending_subject_config', JSON.stringify(selectedConfig));
              addTab('subject-allocation');
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 shadow-sm transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Subject Allocation
          </button>
        )}
      </div>

      {/* ── Stat Cards ── */}
      {!isAllocationOnly && (
        <div className="flex flex-wrap items-center gap-3">
          {/* Enrolled */}
          <div className="w-48 sm:w-52 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 flex items-center justify-center shrink-0 shadow-2xs">
              <Users className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 leading-tight">Enrolled Students</p>
              <p className="text-2xl font-extrabold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight mt-0.5">
                {String(currentConfigStudents.length).padStart(2, '0')}
              </p>
            </div>
          </div>
          {/* Allocated */}
          <div className="w-48 sm:w-52 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0">
              <UserCheck className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 leading-tight">Section Allocated</p>
              <p className="text-2xl font-extrabold font-mono tracking-tight text-emerald-700 dark:text-emerald-300 leading-tight mt-0.5">
                {String(allocatedCount).padStart(2, '0')}
              </p>
            </div>
          </div>
          {/* Unallocated */}
          <div className="w-48 sm:w-52 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800 flex items-center justify-center shrink-0">
              <UserX className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 leading-tight">Unallocated</p>
              <p className="text-2xl font-extrabold font-mono tracking-tight text-amber-700 dark:text-amber-300 leading-tight mt-0.5">
                {String(unallocatedCount).padStart(2, '0')}
              </p>
            </div>
          </div>
          {/* Section Subjects */}
          <div className="w-52 sm:w-56 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center gap-3 shadow-2xs">
            <div className="w-9 h-9 rounded-lg bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200 flex items-center justify-center shrink-0">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
            <div className="min-w-0">
              <p className="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 leading-tight">Section Subjects</p>
              <p className="text-2xl font-extrabold font-mono tracking-tight text-zinc-900 dark:text-zinc-100 leading-tight mt-0.5">
                {String(currentSectionSubjects.length).padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Section Assignment Form ── */}
      {!isAllocationOnly && (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (selectedClassSections.length === 0) { showToast('Select at least one section for this class.'); return; }
            void handleAssignSectionsToClass();
          }}
          className="p-5 space-y-4"
        >
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Academic Year</label>
              <input type="text" readOnly value={selectedConfig.academicYear}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-mono font-semibold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Class / Course / Dept</label>
              <input type="text" readOnly value={selectedConfig.className}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <input type="text" readOnly value={selectedConfig.status}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100 font-semibold" />
            </div>

            {/* Section multi-select */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                Sections <span className="text-red-500 font-bold">*</span>
              </label>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="relative" ref={sectionDropdownRef}>
                  <button
                    type="button"
                    aria-haspopup="true"
                    aria-expanded={isSectionDropdownOpen}
                    onClick={() => { setSectionSearchQuery(''); setIsSectionDropdownOpen((o) => !o); }}
                    className="flex w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-gray-900 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-100 dark:focus:ring-gray-100"
                  >
                    <span className={selectedClassSections.length > 0 ? '' : 'text-gray-500'}>
                      {selectedClassSections.length > 0
                        ? `${selectedClassSections.length} section${selectedClassSections.length === 1 ? '' : 's'} selected`
                        : 'Choose Sections'}
                    </span>
                    <ChevronDown className={`h-4 w-4 text-gray-500 transition-transform ${isSectionDropdownOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {isSectionDropdownOpen && (
                    <div className="absolute left-0 right-0 top-full z-40 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                      <div className="border-b border-gray-100 p-2 dark:border-gray-800">
                        <div className="relative">
                          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
                          <input
                            type="search" autoFocus aria-label="Search sections" placeholder="Search..."
                            value={sectionSearchQuery} onChange={(e) => setSectionSearchQuery(e.target.value)}
                            className="w-full rounded-md border border-gray-200 bg-white py-1.5 pl-8 pr-2 text-xs text-gray-900 outline-none focus:border-gray-400 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-100"
                          />
                        </div>
                      </div>
                      <div className="max-h-48 overflow-y-auto py-1" aria-label="Sections">
                        {sectionCatalog
                          .filter((s) => s.name.toLowerCase().includes(sectionSearchQuery.trim().toLowerCase()))
                          .map((section) => (
                            <label key={section.id} className="flex w-full cursor-pointer items-center justify-between px-3 py-2 text-xs text-gray-800 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-gray-800">
                              <span className="flex min-w-0 items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={selectedClassSections.includes(section.name)}
                                  onChange={(e) => setSelectedClassSections((cur) => e.target.checked ? [...cur, section.name] : cur.filter((item) => item !== section.name))}
                                  className="h-3.5 w-3.5 accent-zinc-900"
                                />
                                <span className="truncate">{section.name}</span>
                              </span>
                              <span className="text-[10px] text-gray-400">{section.classCount} {section.classCount === 1 ? 'class' : 'classes'}</span>
                            </label>
                          ))}
                        {sectionCatalog.filter((s) => s.name.toLowerCase().includes(sectionSearchQuery.trim().toLowerCase())).length === 0 && (
                          <p className="px-3 py-3 text-xs text-gray-500">
                            {sectionCatalog.length === 0 ? 'No sections added for this account.' : 'No matching sections.'}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => { setIsSectionDropdownOpen(false); setIsAddingSection(false); setNewSectionName(''); setEditingSectionName(null); setIsSectionManagerOpen(true); }}
                        className="flex w-full items-center justify-center gap-1.5 border-t border-gray-200 bg-gray-50 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
                      >
                        <Settings className="h-3.5 w-3.5" /> Manage Sections
                      </button>
                    </div>
                  )}
                </div>
                <div className="min-h-10 rounded-lg border border-dashed border-gray-200 p-2 dark:border-gray-700">
                  {selectedClassSections.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {selectedClassSections.map((sectionName) => (
                        <span key={sectionName} className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-50 py-1 pl-2.5 pr-1 text-xs text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200">
                          {sectionName}
                          <button type="button" aria-label={`Remove ${sectionName}`} onClick={() => setSelectedClassSections((cur) => cur.filter((item) => item !== sectionName))} className="rounded-full p-0.5 text-zinc-500 hover:bg-zinc-200 hover:text-zinc-900 dark:hover:bg-zinc-700 dark:hover:text-zinc-100">
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  ) : (
                    <p className="px-1 py-1.5 text-xs text-gray-500">Selected sections will appear here.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 border-t border-gray-200 pt-4 dark:border-gray-800">
            <button type="button" onClick={onBack}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={selectedClassSections.length === 0 || isSavingSections}
              className="px-5 py-2 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800 dark:bg-gray-100 dark:text-gray-900 dark:hover:bg-gray-200 shadow-sm transition-colors disabled:opacity-50">
              Assign Selected Sections
            </button>
          </div>
        </form>
      )}

      {/* ── Subject Curriculum Allocation ── */}
      {activeAllocTab === 'subjects' && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
            <div>
              <p className="text-xs font-bold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">Subject Allocation</p>
              <p className="text-[11px] text-zinc-500 mt-0.5">Select a section below to allocate subjects, or use overall options to apply to all sections at once.</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button type="button" disabled={selectedConfig.sections.length === 0}
                onClick={() => { setSubTargetSection('all'); setSelectedSectionForSubject('all'); setSelectedMasterSubjectId(''); setSubError(''); setIsSingleSubjectFormOpen(true); setIsBulkUploadOpen(false); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-white dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 disabled:opacity-50 disabled:cursor-not-allowed">
                <Plus className="w-3.5 h-3.5" /> Subject Assign
              </button>
              <button type="button" disabled={selectedConfig.sections.length === 0}
                onClick={() => { setBulkTargetSection('all'); setSelectedSectionForSubject('all'); setSelectedMasterSubjectIds([]); setBulkSubjectSearch(''); setBulkUploadError(''); setIsBulkUploadOpen(true); setIsSingleSubjectFormOpen(false); }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed">
                <Upload className="w-3.5 h-3.5" /> Bulk Upload
              </button>
            </div>
          </div>

          {selectedConfig.sections.length === 0 && (
            <div className="rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-6 text-center">
              <p className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">No sections added</p>
              <p className="mt-1 text-xs text-zinc-500">Add sections to this configuration before allocating students or subjects.</p>
            </div>
          )}

          {/* Single Subject Form */}
          <AnimatePresence>
            {isSingleSubjectFormOpen && (
              <div
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) setIsSingleSubjectFormOpen(false);
                }}
              >
                <motion.form
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 10 }}
                  onSubmit={handleAddSubjectToSection}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="assign-subject-title"
                  className="w-full max-w-md space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                    <div>
                      <h4 id="assign-subject-title" className="text-sm font-bold">Subject Assign</h4>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        {selectedSectionForSubject === 'all'
                          ? 'Assign to all sections'
                          : `Assign to ${selectedConfig.className} – ${selectedSectionForSubject}`}
                      </p>
                    </div>
                    <button type="button" aria-label="Close subject assignment" onClick={() => setIsSingleSubjectFormOpen(false)}>
                      <X className="h-4 w-4 text-zinc-400" />
                    </button>
                  </div>
                  <div>
                    <label htmlFor="single-subject-select" className="mb-1 block text-xs font-semibold">
                      Subject <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="single-subject-select"
                      required
                      value={selectedMasterSubjectId}
                      onChange={(event) => setSelectedMasterSubjectId(event.target.value)}
                      className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-xs dark:border-zinc-700 dark:bg-zinc-950"
                    >
                      <option value="">
                        {subjectMaster.some((subject) => subject.status === 'Active')
                          ? 'Choose an active Subject Master entry'
                          : 'No active subjects in Subject Master'}
                      </option>
                      {singleAvailableSubjects.map((subject) => (
                        <option key={subject.id} value={subject.id}>
                          {subject.code} — {subject.name} ({subject.type})
                        </option>
                      ))}
                    </select>
                    {singleAvailableSubjects.length === 0 && (
                      <p className="mt-1.5 text-[11px] text-zinc-500">
                        No active Subject Master subjects are available for the selected section(s).
                      </p>
                    )}
                  </div>
                  {subError && <p role="alert" className="text-xs text-rose-500">{subError}</p>}
                  <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <button type="button" onClick={() => setIsSingleSubjectFormOpen(false)} className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold dark:border-zinc-700">
                      Cancel
                    </button>
                    <button type="submit" disabled={singleAvailableSubjects.length === 0} className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
                      Assign Subject
                    </button>
                  </div>
                </motion.form>
              </div>
            )}
          </AnimatePresence>

          {/* Bulk Subject Assignment Form */}
          <AnimatePresence>
            {isBulkUploadOpen && (
              <div
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
                onMouseDown={(event) => {
                  if (event.target === event.currentTarget) setIsBulkUploadOpen(false);
                }}
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.96, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96, y: 10 }}
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="bulk-assign-subject-title"
                  className="w-full max-w-md space-y-4 rounded-2xl border border-zinc-200 bg-white p-5 text-zinc-900 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
                >
                  <div className="flex items-center justify-between border-b border-zinc-100 pb-3 dark:border-zinc-800">
                    <div>
                      <h4 id="bulk-assign-subject-title" className="text-sm font-bold">Bulk Upload</h4>
                      <p className="mt-0.5 text-[11px] text-zinc-500">
                        {selectedSectionForSubject === 'all'
                          ? 'Assign subjects to all sections'
                          : `Assign subjects to ${selectedConfig.className} – ${selectedSectionForSubject}`}
                      </p>
                    </div>
                    <button type="button" aria-label="Close bulk subject assignment" onClick={() => setIsBulkUploadOpen(false)}>
                      <X className="h-4 w-4 text-zinc-400" />
                    </button>
                  </div>
                  <div>
                    <label htmlFor="bulk-subject-search" className="mb-1 block text-xs font-semibold">
                      Subjects <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-zinc-400" />
                      <input
                        id="bulk-subject-search"
                        type="search"
                        aria-label="Search subjects"
                        placeholder="Search subjects..."
                        value={bulkSubjectSearch}
                        onChange={(event) => setBulkSubjectSearch(event.target.value)}
                        className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-xs outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950"
                      />
                    </div>
                    <div className="mt-2 max-h-52 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-700">
                      {filteredBulkSubjects.length > 0 ? filteredBulkSubjects.map((subject) => (
                        <label key={subject.id} className="flex cursor-pointer items-center gap-2 border-b border-zinc-100 px-3 py-2 text-xs last:border-b-0 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-800">
                          <input
                            type="checkbox"
                            checked={selectedMasterSubjectIds.includes(subject.id)}
                            onChange={(event) => setSelectedMasterSubjectIds((current) =>
                              event.target.checked
                                ? [...current, subject.id]
                                : current.filter((id) => id !== subject.id),
                            )}
                            className="h-3.5 w-3.5 accent-zinc-900"
                          />
                          <span className="font-mono font-semibold">{subject.code}</span>
                          <span className="min-w-0 flex-1 truncate">{subject.name}</span>
                          <span className="text-zinc-500">{subject.type}</span>
                        </label>
                      )) : (
                        <p className="px-3 py-3 text-xs text-zinc-500">
                          {subjectMaster.some((subject) => subject.status === 'Active')
                            ? 'No available subjects match this search.'
                            : 'No active subjects in Subject Master.'}
                        </p>
                      )}
                    </div>
                    <p className="mt-1.5 text-[11px] text-zinc-500">
                      {selectedMasterSubjectIds.length} selected
                    </p>
                  </div>
                  {bulkUploadError && <p role="alert" className="text-xs text-rose-500">{bulkUploadError}</p>}
                  <div className="flex justify-end gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
                    <button type="button" onClick={() => setIsBulkUploadOpen(false)} className="rounded-xl border border-zinc-200 px-3 py-2 text-xs font-semibold dark:border-zinc-700">
                      Cancel
                    </button>
                    <button type="button" onClick={handleBulkUploadSubjects} disabled={selectedMasterSubjectIds.length === 0} className="rounded-xl bg-zinc-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
                      Assign Selected
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Section Cards */}
          <div className="space-y-4">
            {selectedConfig.sections.map((sec) => {
              const secKey = `${selectedConfig.id}_${sec}`;
              const secSubjects = sectionSubjectsMap[secKey] || [];
              const sectionLabel = `${selectedConfig.className} – ${sec}`;
              const isExpanded = expandedSubjectSection === sec;
              return (
                <motion.div key={sec} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
                  <div className="flex flex-col gap-3 px-5 py-3.5 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/80 sm:flex-row sm:items-center sm:justify-between">
                    <button type="button" aria-expanded={isExpanded}
                      onClick={() => { setExpandedSubjectSection(isExpanded ? null : sec); setSelectedSectionForSubject(sec); setBulkTargetSection(sec); }}
                      className="flex min-w-0 items-center gap-2.5 text-left">
                      <span className="w-7 h-7 rounded-lg bg-zinc-900 dark:bg-zinc-100 flex items-center justify-center shrink-0">
                        <BookOpen className="w-3.5 h-3.5 text-white dark:text-zinc-900" />
                      </span>
                      <span className="min-w-0">
                        <span className="block text-xs font-bold text-zinc-900 dark:text-zinc-100">{sectionLabel}</span>
                        <span className="block text-[10px] text-zinc-500">{secSubjects.length} subject{secSubjects.length !== 1 ? 's' : ''} allocated</span>
                      </span>
                      <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                    </button>
                    {isExpanded && (
                      <div className="flex items-center gap-2">
                        <button type="button" onClick={() => { setSubTargetSection(sec); setSelectedSectionForSubject(sec); setSelectedMasterSubjectId(''); setSubError(''); setIsSingleSubjectFormOpen(true); setIsBulkUploadOpen(false); }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors">
                        <Plus className="w-3 h-3" /> Subject Assign
                        </button>
                        <button type="button" onClick={() => { setBulkTargetSection(sec); setSelectedSectionForSubject(sec); setSelectedMasterSubjectIds([]); setBulkSubjectSearch(''); setBulkUploadError(''); setIsBulkUploadOpen(true); setIsSingleSubjectFormOpen(false); }}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-[11px] font-semibold rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition-opacity shadow-2xs">
                          <Upload className="w-3 h-3" /> Bulk Upload
                        </button>
                      </div>
                    )}
                  </div>
                  {isExpanded && (secSubjects.length === 0 ? (
                    <div className="py-8 text-center text-xs text-zinc-400">
                      No subjects allocated yet. Use <span className="font-semibold text-zinc-600 dark:text-zinc-300">Add Subject</span> or <span className="font-semibold text-zinc-600 dark:text-zinc-300">Bulk Upload</span> above.
                    </div>
                  ) : (
                    <Table>
                      <Table.ScrollContainer>
                        <Table.Content aria-label={`Subjects for ${sectionLabel}`} className="min-w-[520px]">
                          <Table.Header>
                            <Table.Column isRowHeader>Subject Code &amp; Name</Table.Column>
                            <Table.Column>Type</Table.Column>
                            <Table.Column className="text-right">Action</Table.Column>
                          </Table.Header>
                          <Table.Body>
                            {secSubjects.map((sub) => (
                              <Table.Row key={sub.id} className="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40">
                                <Table.Cell>
                                  <div className="flex items-center gap-2.5">
                                    <span className="px-2 py-0.5 rounded-md bg-zinc-100 dark:bg-zinc-800 font-mono text-[10px] font-bold text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700">{sub.code}</span>
                                    <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">{sub.name}</span>
                                  </div>
                                </Table.Cell>
                                <Table.Cell>
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${sub.type === 'Core' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : sub.type === 'Elective' ? 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300' : 'bg-zinc-200 text-zinc-800 dark:bg-zinc-700 dark:text-zinc-200'}`}>{sub.type}</span>
                                </Table.Cell>
                                <Table.Cell className="text-right">
                                  <button type="button" onClick={() => void handleDeleteSubjectFromSection(sub.id, secKey)}
                                    className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors">
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Content>
                      </Table.ScrollContainer>
                    </Table>
                  ))}
                </motion.div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Section Manager Modal ── */}
      {isSectionManagerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4"
          onMouseDown={(e) => { if (e.target === e.currentTarget && !isSavingSections) setIsSectionManagerOpen(false); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="manage-sections-title"
            className="max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-zinc-200 bg-white p-5 shadow-2xl dark:border-zinc-700 dark:bg-zinc-900">
            <header className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 id="manage-sections-title" className="text-base font-bold text-zinc-900 dark:text-zinc-100">Manage Sections</h2>
                <p className="mt-1 text-xs text-zinc-500">Sections added here are available to all classes in this account.</p>
              </div>
              <button type="button" aria-label="Close Manage Sections" disabled={isSavingSections} onClick={() => setIsSectionManagerOpen(false)}
                className="rounded-lg p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
                <X className="h-4 w-4" />
              </button>
            </header>

            {!isAddingSection && (
              <div className="mb-4 flex justify-end">
                <button type="button" disabled={isSavingSections} onClick={() => setIsAddingSection(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
                  <Plus className="h-3.5 w-3.5" /> Add Section
                </button>
              </div>
            )}

            {isAddingSection && (
              <form className="mb-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
                onSubmit={(e) => { e.preventDefault(); void handleAddSection(); }}>
                <label htmlFor="new-academic-section" className="mb-1.5 block text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Section Name <span className="text-red-500">*</span>
                </label>
                <input id="new-academic-section" autoFocus maxLength={100} value={newSectionName}
                  onChange={(e) => setNewSectionName(e.target.value)} placeholder="Enter one section name"
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-400 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                <p className="mt-1.5 text-[11px] text-zinc-500">Add one section at a time. You can select multiple sections for this class from the Section dropdown.</p>
                <div className="mt-3 flex justify-end gap-2">
                  <button type="button" disabled={isSavingSections} onClick={() => { setIsAddingSection(false); setNewSectionName(''); }}
                    className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSavingSections || !newSectionName.trim()}
                    className="rounded-lg bg-zinc-900 px-4 py-2 text-xs font-semibold text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900">
                    {isSavingSections ? 'Saving...' : 'Add'}
                  </button>
                </div>
              </form>
            )}

            <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center border-b border-zinc-200 bg-zinc-50 px-3 py-2 text-xs font-semibold text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                <span>Section Name</span><span className="pr-2">Actions</span>
              </div>
              {sectionCatalog.length === 0 ? (
                <p className="px-3 py-8 text-center text-xs text-zinc-500">No sections have been added for this account.</p>
              ) : (
                <ul className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {sectionCatalog.map((section) => {
                    const isEditing = editingSectionName === section.id;
                    return (
                      <li key={section.id} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3 py-2.5">
                        {isEditing ? (
                          <input autoFocus maxLength={100} aria-label={`Rename ${section.name}`} value={sectionEditValue}
                            onChange={(e) => setSectionEditValue(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); void handleRenameSection(section.id); } if (e.key === 'Escape') setEditingSectionName(null); }}
                            className="min-w-0 rounded-md border border-zinc-300 bg-white px-2.5 py-1.5 text-xs text-zinc-900 outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100" />
                        ) : (
                          <div className="min-w-0">
                            <span className="block truncate text-xs font-medium text-zinc-800 dark:text-zinc-200">{section.name}</span>
                            {section.classCount > 0 && <span className="mt-0.5 block text-[10px] text-zinc-500">Used in {section.classCount} class{section.classCount === 1 ? '' : 'es'}</span>}
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          {isEditing ? (
                            <>
                              <button type="button" disabled={isSavingSections || !sectionEditValue.trim()} onClick={() => void handleRenameSection(section.id)}
                                className="rounded-md px-2 py-1 text-[11px] font-semibold text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-200 dark:hover:bg-zinc-800">
                                Save
                              </button>
                              <button type="button" disabled={isSavingSections} onClick={() => setEditingSectionName(null)}
                                className="rounded-md px-2 py-1 text-[11px] text-zinc-500 hover:bg-zinc-100 disabled:opacity-50 dark:hover:bg-zinc-800">
                                Cancel
                              </button>
                            </>
                          ) : (
                            <>
                              <button type="button" aria-label={`Edit ${section.name}`} disabled={isSavingSections}
                                onClick={() => { setEditingSectionName(section.id); setSectionEditValue(section.name); }}
                                className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 disabled:opacity-50 dark:hover:bg-zinc-800 dark:hover:text-zinc-100">
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button type="button" aria-label={`Delete ${section.name}`} disabled={isSavingSections}
                                onClick={() => void handleDeleteSection(section.id)}
                                className="rounded-md p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:hover:bg-red-950/30 dark:hover:text-red-400">
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
};
