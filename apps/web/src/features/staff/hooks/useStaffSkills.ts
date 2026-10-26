import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useInstitution } from '@/context/InstitutionContext';
import { getStaffApiError, getStaffSkills, saveStaffSkills } from '@/features/staff/api';

export const DEFAULT_STAFF_SKILLS: Record<string, string[]> = {
  School: ['Mathematics', 'Tamil', 'English', 'Science', 'Social Studies', 'Physical Education'],
  College: ['Data Structures', 'AI/ML', 'Programming', 'Mathematics', 'Database Systems'],
  Training: ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'Node.js', 'Docker'],
};

export function useStaffSkills() {
  const { institutionType } = useInstitution();
  const { user } = useAuth();
  const ownerKey = user ? `${user.id}:${institutionType}` : '';
  const defaults = DEFAULT_STAFF_SKILLS[institutionType] ?? DEFAULT_STAFF_SKILLS.School;

  const [skills, setSkills] = useState<string[]>([]);
  const [loadedOwnerKey, setLoadedOwnerKey] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [skillNameInput, setSkillNameInput] = useState('');

  const currentSkills = loadedOwnerKey === ownerKey ? skills : [];

  useEffect(() => {
    let active = true;
    setSkills([]);
    setLoadedOwnerKey('');
    setLoading(true);
    setError('');
    setIsManagerOpen(false);

    if (!user) {
      setError('Sign in to load staff skills.');
      setLoading(false);
      return () => {
        active = false;
      };
    }

    getStaffSkills(institutionType)
      .then((savedSkills) => {
        if (!active) return;
        setSkills(savedSkills ?? defaults);
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
  }, [defaults, institutionType, ownerKey, user]);

  const persistSkills = useCallback(async (nextSkills: string[]) => {
    if (!user) {
      setError('Sign in to manage staff skills.');
      return false;
    }

    setSaving(true);
    setError('');
    try {
      const savedSkills = await saveStaffSkills(institutionType, nextSkills);
      setSkills(savedSkills);
      setLoadedOwnerKey(ownerKey);
      return true;
    } catch (saveError) {
      setError(getStaffApiError(saveError));
      return false;
    } finally {
      setSaving(false);
    }
  }, [institutionType, ownerKey, user]);

  const addSkill = useCallback(async () => {
    const newSkill = skillNameInput.trim();
    if (!newSkill) {
      setError('Skill name is required.');
      return;
    }
    if (currentSkills.some((skill) => skill.toLowerCase() === newSkill.toLowerCase())) {
      setError('A skill with this name already exists.');
      return;
    }
    if (await persistSkills([...currentSkills, newSkill])) setSkillNameInput('');
  }, [currentSkills, persistSkills, skillNameInput]);

  const removeSkill = useCallback(async (skillToRemove: string) => {
    return persistSkills(currentSkills.filter((skill) => skill !== skillToRemove));
  }, [currentSkills, persistSkills]);

  const renameSkill = useCallback(async (currentSkill: string, newSkillValue: string) => {
    const newSkill = newSkillValue.trim();
    if (!newSkill) {
      setError('Skill name is required.');
      return false;
    }
    if (currentSkills.some((skill) => skill !== currentSkill && skill.toLowerCase() === newSkill.toLowerCase())) {
      setError('A skill with this name already exists.');
      return false;
    }
    if (newSkill === currentSkill) return true;
    return persistSkills(currentSkills.map((skill) => skill === currentSkill ? newSkill : skill));
  }, [currentSkills, persistSkills]);

  const openManager = useCallback(() => {
    setSkillNameInput('');
    setError('');
    setIsManagerOpen(true);
  }, []);

  const closeManager = useCallback(() => {
    setIsManagerOpen(false);
    setSkillNameInput('');
    setError('');
  }, []);

  return {
    skills: currentSkills,
    loading,
    saving,
    error,
    isManagerOpen,
    skillNameInput,
    setSkillNameInput,
    openManager,
    closeManager,
    addSkill,
    removeSkill,
    renameSkill,
  };
}
