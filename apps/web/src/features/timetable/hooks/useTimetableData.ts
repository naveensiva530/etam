import { useState, useEffect, useCallback } from 'react';
import type {
  DepartmentTimetableItem,
  TimetableConfig,
  TeachingStaffOption,
  SubjectOption,
} from '../types/timetable.types';
import * as timetableApi from '../api/timetable.api';
import { useInstitution } from '@/context/InstitutionContext';

export function useTimetableData() {
  const { institutionType } = useInstitution();
  const [departments, setDepartments] = useState<DepartmentTimetableItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Options
  const [teachingStaff, setTeachingStaff] = useState<TeachingStaffOption[]>([]);
  const [availableSubjects, setAvailableSubjects] = useState<SubjectOption[]>([]);

  // Fetch departments list
  const loadDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await timetableApi.getDepartmentTimetables(institutionType);
      setDepartments(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to load departments');
    } finally {
      setLoading(false);
    }
  }, [institutionType]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  // Load options for a specific department
  const loadOptionsForDepartment = useCallback(
    async (academicConfigId: string, sectionName?: string) => {
      try {
        const data = await timetableApi.getTimetableOptions(
          academicConfigId,
          sectionName,
          institutionType
        );
        setTeachingStaff(data.teachingStaff || []);

        // Combine allocated subjects with master subjects (deduplicating by name)
        const subjectMap = new Map<string, SubjectOption>();
        (data.allocatedSubjects || []).forEach((s) => subjectMap.set(s.name, s));
        (data.masterSubjects || []).forEach((s) => {
          if (!subjectMap.has(s.name)) subjectMap.set(s.name, s);
        });
        setAvailableSubjects(Array.from(subjectMap.values()));
      } catch (err: any) {
        console.error('Failed to load timetable options:', err);
      }
    },
    [institutionType]
  );

  // Load complete timetable for a department
  const loadTimetableForDepartment = useCallback(
    async (dept: DepartmentTimetableItem): Promise<TimetableConfig | null> => {
      try {
        if (dept.timetableId) {
          return await timetableApi.getTimetableById(dept.timetableId);
        }
        return await timetableApi.getTimetableByAcademicConfigId(dept.id);
      } catch (err) {
        console.error('Failed to load timetable for department:', err);
        return null;
      }
    },
    []
  );

  // Save timetable
  const saveTimetable = useCallback(
    async (
      payload: Partial<TimetableConfig> & {
        academicConfigurationId: string;
        departmentName: string;
        subCategory: string;
      }
    ) => {
      setSaving(true);
      setError(null);
      try {
        const saved = await timetableApi.saveTimetableConfig({
          ...payload,
          institution: institutionType,
        } as any);

        // Update departments state locally so status updates immediately to 'Created'
        setDepartments((prev) =>
          prev.map((d) =>
            d.id === payload.academicConfigurationId
              ? { ...d, status: 'Created', timetableId: saved.id || d.timetableId }
              : d
          )
        );

        return saved;
      } catch (err: any) {
        const msg = err?.response?.data?.message || err?.message || 'Failed to save timetable';
        setError(msg);
        throw new Error(msg);
      } finally {
        setSaving(false);
      }
    },
    [institutionType]
  );

  return {
    departments,
    loading,
    saving,
    error,
    teachingStaff,
    availableSubjects,
    loadDepartments,
    loadOptionsForDepartment,
    loadTimetableForDepartment,
    saveTimetable,
  };
}
