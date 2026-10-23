import { useCallback, useEffect, useRef, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useInstitution } from '@/context/InstitutionContext';
import {
  createDepartment,
  deleteDepartment,
  Department,
  getDepartmentApiError,
  getDepartments,
  updateDepartment,
} from '@/features/departments/api';

export interface UseDepartmentsReturn {
  // list state
  departmentOptions: Department[];
  departmentsLoading: boolean;
  departmentError: string;

  // dropdown UI state
  departmentMenuOpen: boolean;
  departmentSearch: string;
  setDepartmentSearch: (v: string) => void;
  openDepartmentMenu: () => void;
  closeDepartmentMenu: () => void;
  toggleDepartmentMenu: () => void;
  filteredDepartmentOptions: Department[];

  // manager modal state
  isDepartmentManagerOpen: boolean;
  openDepartmentManager: () => void;
  closeDepartmentManager: () => void;

  // inline form state inside manager
  isDepartmentFormOpen: boolean;
  departmentNameInput: string;
  departmentSaving: boolean;
  editingDepartment: Department | null;
  setDepartmentNameInput: (v: string) => void;
  openAddDepartmentForm: () => void;
  openEditDepartmentForm: (dept: Department) => void;
  closeDepartmentForm: () => void;

  // CRUD handlers
  handleSaveDepartment: (e: React.FormEvent) => Promise<void>;
  handleDeleteDepartment: (dept: Department) => Promise<void>;

  // click-outside refs
  departmentDropdownRef: React.RefObject<HTMLDivElement | null>;
}

export function useDepartments(initialDepartment?: string): UseDepartmentsReturn & {
  selectedDepartment: string;
  setSelectedDepartment: (v: string) => void;
} {
  const { institutionType } = useInstitution();
  const { user } = useAuth();
  const departmentOwnerKey = user ? `${user.id}:${institutionType}` : '';

  const [departmentOptions, setDepartmentOptions] = useState<Department[]>([]);
  const [departmentOptionsOwnerKey, setDepartmentOptionsOwnerKey] = useState('');
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentError, setDepartmentError] = useState('');

  const [departmentMenuOpen, setDepartmentMenuOpen] = useState(false);
  const [departmentSearch, setDepartmentSearch] = useState('');
  const [isDepartmentManagerOpen, setIsDepartmentManagerOpen] = useState(false);
  const [isDepartmentFormOpen, setIsDepartmentFormOpen] = useState(false);
  const [departmentNameInput, setDepartmentNameInput] = useState('');
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [departmentSaving, setDepartmentSaving] = useState(false);

  const [selectedDepartment, setSelectedDepartment] = useState(initialDepartment ?? '');

  const departmentDropdownRef = useRef<HTMLDivElement | null>(null);

  // Resolve options only when the owner key matches (prevents stale data from another user/institution)
  const currentDepartmentOptions =
    departmentOptionsOwnerKey === departmentOwnerKey ? departmentOptions : [];

  // Load departments whenever the user/institution context changes
  useEffect(() => {
    let active = true;
    setDepartmentOptions([]);
    setDepartmentOptionsOwnerKey('');
    setSelectedDepartment(initialDepartment ?? '');
    setDepartmentsLoading(true);
    setDepartmentError('');
    setDepartmentMenuOpen(false);
    setIsDepartmentManagerOpen(false);
    setIsDepartmentFormOpen(false);
    setEditingDepartment(null);

    if (!user) {
      setDepartmentError('Sign in to load departments.');
      setDepartmentsLoading(false);
      return () => { active = false; };
    }

    getDepartments(institutionType)
      .then((nextOptions) => {
        if (!active) return;
        setDepartmentOptions(nextOptions);
        setDepartmentOptionsOwnerKey(departmentOwnerKey);
        setSelectedDepartment(initialDepartment ?? '');
      })
      .catch((error) => {
        if (!active) return;
        setDepartmentError(getDepartmentApiError(error));
      })
      .finally(() => {
        if (active) setDepartmentsLoading(false);
      });

    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentOwnerKey, institutionType, user]);

  const openDepartmentMenu = useCallback(() => {
    setDepartmentSearch('');
    setDepartmentMenuOpen(true);
  }, []);
  const closeDepartmentMenu = useCallback(() => setDepartmentMenuOpen(false), []);
  const toggleDepartmentMenu = useCallback(() => {
    setDepartmentSearch('');
    setDepartmentMenuOpen((prev) => !prev);
  }, []);

  const openDepartmentManager = useCallback(() => {
    setDepartmentMenuOpen(false);
    setDepartmentError('');
    setIsDepartmentFormOpen(false);
    setEditingDepartment(null);
    setDepartmentNameInput('');
    setIsDepartmentManagerOpen(true);
  }, []);
  const closeDepartmentManager = useCallback(() => setIsDepartmentManagerOpen(false), []);

  const openAddDepartmentForm = useCallback(() => {
    setDepartmentError('');
    setDepartmentNameInput('');
    setEditingDepartment(null);
    setIsDepartmentFormOpen((prev) => !prev);
  }, []);

  const openEditDepartmentForm = useCallback((dept: Department) => {
    setDepartmentError('');
    setDepartmentNameInput(dept.name);
    setEditingDepartment(dept);
    setIsDepartmentFormOpen(true);
  }, []);

  const closeDepartmentForm = useCallback(() => {
    setIsDepartmentFormOpen(false);
    setEditingDepartment(null);
    setDepartmentNameInput('');
    setDepartmentError('');
  }, []);

  const handleSaveDepartment = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const newName = departmentNameInput.trim();
    if (!newName) {
      setDepartmentError('Department name is required.');
      return;
    }
    if (!user) {
      setDepartmentError('Sign in to manage departments.');
      return;
    }
    const duplicate = currentDepartmentOptions.some(
      (option) =>
        option.name.toLowerCase() === newName.toLowerCase() &&
        option.id !== editingDepartment?.id,
    );
    if (duplicate) {
      setDepartmentError('A department with this name already exists.');
      return;
    }

    setDepartmentSaving(true);
    setDepartmentError('');
    try {
      const savedDepartment = editingDepartment
        ? await updateDepartment(editingDepartment.id, newName)
        : await createDepartment(institutionType, newName);

      setDepartmentOptions((current) =>
        editingDepartment
          ? current.map((opt) => (opt.id === savedDepartment.id ? savedDepartment : opt))
          : [...current, savedDepartment],
      );
      setDepartmentOptionsOwnerKey(departmentOwnerKey);
      setSelectedDepartment(savedDepartment.name);
      setDepartmentNameInput('');
      setEditingDepartment(null);
      setIsDepartmentFormOpen(false);
    } catch (error) {
      setDepartmentError(getDepartmentApiError(error));
    } finally {
      setDepartmentSaving(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [departmentNameInput, user, currentDepartmentOptions, editingDepartment, institutionType, departmentOwnerKey]);

  const handleDeleteDepartment = useCallback(async (dept: Department) => {
    if (!window.confirm(`Remove "${dept.name}" from the department list?`)) return;
    setDepartmentSaving(true);
    setDepartmentError('');
    try {
      await deleteDepartment(dept.id);
      setDepartmentOptions((current) => current.filter((opt) => opt.id !== dept.id));
      setSelectedDepartment((current) => (current === dept.name ? '' : current));
      if (editingDepartment?.id === dept.id) {
        setEditingDepartment(null);
        setDepartmentNameInput('');
        setIsDepartmentFormOpen(false);
      }
    } catch (error) {
      setDepartmentError(getDepartmentApiError(error));
    } finally {
      setDepartmentSaving(false);
    }
  }, [editingDepartment]);

  const filteredDepartmentOptions = currentDepartmentOptions.filter((opt) =>
    opt.name.toLowerCase().includes(departmentSearch.trim().toLowerCase()),
  );

  return {
    departmentOptions: currentDepartmentOptions,
    departmentsLoading,
    departmentError,
    departmentMenuOpen,
    departmentSearch,
    setDepartmentSearch,
    openDepartmentMenu,
    closeDepartmentMenu,
    toggleDepartmentMenu,
    filteredDepartmentOptions,
    isDepartmentManagerOpen,
    openDepartmentManager,
    closeDepartmentManager,
    isDepartmentFormOpen,
    departmentNameInput,
    departmentSaving,
    editingDepartment,
    setDepartmentNameInput,
    openAddDepartmentForm,
    openEditDepartmentForm,
    closeDepartmentForm,
    handleSaveDepartment,
    handleDeleteDepartment,
    departmentDropdownRef,
    selectedDepartment,
    setSelectedDepartment,
  };
}
