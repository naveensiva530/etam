import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useInstitution } from '@/context/InstitutionContext';
import { getStaffApiError, getStaffRoles, saveStaffRoles } from '@/features/staff/api';
import { DEFAULT_STAFF_ROLES } from './useStaffForm';

export interface UseStaffRolesReturn {
  roles: string[];
  loading: boolean;
  saving: boolean;
  error: string;
  isManagerOpen: boolean;
  roleNameInput: string;
  setRoleNameInput: (value: string) => void;
  openManager: () => void;
  closeManager: () => void;
  addRole: () => Promise<boolean>;
  removeRole: (role: string) => Promise<boolean>;
}

export function useStaffRoles(): UseStaffRolesReturn {
  const { institutionType } = useInstitution();
  const { user } = useAuth();
  const ownerKey = user ? `${user.id}:${institutionType}` : '';
  const defaultRoles = DEFAULT_STAFF_ROLES[institutionType] || DEFAULT_STAFF_ROLES.School;

  const [roles, setRoles] = useState<string[]>([]);
  const [loadedOwnerKey, setLoadedOwnerKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [roleNameInput, setRoleNameInput] = useState('');

  const currentRoles = loadedOwnerKey === ownerKey ? roles : [];

  useEffect(() => {
    let active = true;
    setRoles([]);
    setLoadedOwnerKey('');
    setLoading(true);
    setError('');
    setIsManagerOpen(false);

    if (!user) {
      setError('Sign in to load staff roles.');
      setLoading(false);
      return () => {
        active = false;
      };
    }

    getStaffRoles(institutionType)
      .then((savedRoles) => {
        if (!active) return;
        setRoles(savedRoles ?? defaultRoles);
        setLoadedOwnerKey(ownerKey);
      })
      .catch((loadError) => {
        if (active) setError(getStaffApiError(loadError));
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [defaultRoles, institutionType, ownerKey, user]);

  const openManager = useCallback(() => {
    setRoleNameInput('');
    setError('');
    setIsManagerOpen(true);
  }, []);

  const closeManager = useCallback(() => {
    setIsManagerOpen(false);
    setRoleNameInput('');
    setError('');
  }, []);

  const addRole = useCallback(async (): Promise<boolean> => {
    const newRole = roleNameInput.trim();
    if (!newRole) {
      setError('Role name is required.');
      return false;
    }
    if (!user) {
      setError('Sign in to manage staff roles.');
      return false;
    }
    if (currentRoles.some((role) => role.toLowerCase() === newRole.toLowerCase())) {
      setError('A role with this name already exists.');
      return false;
    }

    const nextRoles = [...currentRoles, newRole];
    setSaving(true);
    setError('');
    try {
      const savedRoles = await saveStaffRoles(institutionType, nextRoles);
      setRoles(savedRoles);
      setLoadedOwnerKey(ownerKey);
      setRoleNameInput('');
      return true;
    } catch (saveError) {
      setError(getStaffApiError(saveError));
      return false;
    } finally {
      setSaving(false);
    }
  }, [currentRoles, institutionType, ownerKey, roleNameInput, user]);

  const removeRole = useCallback(async (roleToRemove: string): Promise<boolean> => {
    if (!user) {
      setError('Sign in to manage staff roles.');
      return false;
    }
    const nextRoles = currentRoles.filter((role) => role !== roleToRemove);
    setSaving(true);
    setError('');
    try {
      const savedRoles = await saveStaffRoles(institutionType, nextRoles);
      setRoles(savedRoles);
      setLoadedOwnerKey(ownerKey);
      return true;
    } catch (saveError) {
      setError(getStaffApiError(saveError));
      return false;
    } finally {
      setSaving(false);
    }
  }, [currentRoles, institutionType, ownerKey, user]);

  return {
    roles: currentRoles,
    loading,
    saving,
    error,
    isManagerOpen,
    roleNameInput,
    setRoleNameInput,
    openManager,
    closeManager,
    addRole,
    removeRole,
  };
}
