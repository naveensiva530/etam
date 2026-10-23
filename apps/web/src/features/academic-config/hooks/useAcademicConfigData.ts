import { useEffect, useState } from 'react';
import {
  createAcademicSection,
  createAcademicConfiguration,
  createSubjectMasterRecords,
  getAcademicConfigurations,
  getAcademicSections,
  getSubjectMasterList,
  getSubjectTypes,
} from '../api';
import type {
  AcademicConfigItem,
  SubjectMasterRecord,
  SubjectTypeOption,
} from '../types';

const readLegacyRecords = (key: string): Record<string, unknown>[] => {
  const raw = localStorage.getItem(key);
  if (!raw) return [];
  const parsed: unknown = JSON.parse(raw);
  if (!Array.isArray(parsed) || parsed.some((item) => typeof item !== 'object' || item === null)) {
    throw new Error(`Saved ${key} data is invalid and could not be migrated.`);
  }
  return parsed as Record<string, unknown>[];
};

const isSubjectType = (value: unknown): value is SubjectMasterRecord['type'] =>
  typeof value === 'string' && value.trim().length > 0 && value.trim().length <= 50;

const isAcademicStatus = (value: unknown): value is SubjectMasterRecord['status'] =>
  value === 'Active' || value === 'Inactive';

const getLegacySections = (value: unknown): string[] | undefined => {
  if (!Array.isArray(value)) return undefined;
  const seenSections = new Set<string>();
  const sections = value
    .filter((section): section is string => typeof section === 'string')
    .map((section) => section.trim())
    .filter((section) => {
      const normalized = section.toLowerCase();
      if (!section || seenSections.has(normalized)) return false;
      seenSections.add(normalized);
      return true;
    });
  const legacyDefaults = new Set(sections.map((section) => section.trim().toLowerCase()));
  if (
    sections.length === 2 &&
    legacyDefaults.size === 2 &&
    legacyDefaults.has('section a') &&
    legacyDefaults.has('section b')
  ) {
    return [];
  }
  return sections;
};

export const useAcademicConfigData = () => {
  const [configs, setConfigs] = useState<AcademicConfigItem[]>([]);
  const [subjects, setSubjects] = useState<SubjectMasterRecord[]>([]);
  const [subjectTypes, setSubjectTypes] = useState<SubjectTypeOption[]>([]);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let mounted = true;
    const load = async () => {
      const migrationErrors: string[] = [];
      let academicConfigs = await getAcademicConfigurations();
      let subjectMaster = await getSubjectMasterList();
      let types = await getSubjectTypes();

      try {
        if (localStorage.getItem('e_tam_academic_config_migrated') !== 'true') {
          const legacyConfigs = readLegacyRecords('e_tam_academic_configs');
          const knownDemoConfigIds = new Set(['cfg-1', 'cfg-2', 'cfg-3', 'cfg-4']);
          const sectionCatalog = await getAcademicSections();
          const knownSections = new Set(sectionCatalog.map((section) => section.name.toLowerCase()));
          for (const legacy of legacyConfigs) {
            const id = typeof legacy.id === 'string' ? legacy.id : '';
            const academicYear = typeof legacy.academicYear === 'string' ? legacy.academicYear.trim() : '';
            const className = typeof legacy.className === 'string' ? legacy.className.trim() : '';
            if (knownDemoConfigIds.has(id) || !academicYear || !className) continue;
            const legacySections = getLegacySections(legacy.sections) ?? [];
            for (const sectionName of legacySections) {
              const normalizedName = sectionName.toLowerCase();
              if (knownSections.has(normalizedName)) continue;
              const createdSection = await createAcademicSection(sectionName);
              knownSections.add(createdSection.name.toLowerCase());
            }
            const alreadyExists = academicConfigs.some((item) =>
              item.academicYear.toLowerCase() === academicYear.toLowerCase() &&
              item.className.toLowerCase() === className.toLowerCase()
            );
            if (alreadyExists) continue;
            try {
              const created = await createAcademicConfiguration({
                academicYear,
                className,
                subCategory: typeof legacy.subCategory === 'string' ? legacy.subCategory : 'General',
                status: isAcademicStatus(legacy.status) ? legacy.status : 'Active',
                sections: legacySections,
              });
              academicConfigs = [created, ...academicConfigs];
            } catch (error) {
              migrationErrors.push(error instanceof Error ? error.message : `Could not migrate ${className}.`);
            }
          }
          if (migrationErrors.length === 0) {
            localStorage.setItem('e_tam_academic_config_migrated', 'true');
          }
        }
      } catch (error) {
        migrationErrors.push(error instanceof Error ? error.message : 'Could not read saved configurations.');
      }

      try {
        if (localStorage.getItem('e_tam_subject_master_migrated') !== 'true') {
          const legacySubjects = readLegacyRecords('e_tam_subject_master');
          const knownDemoSubjectIds = new Set(['master-1', 'master-2', 'master-3', 'master-4', 'master-5', 'master-6']);
          const knownCodes = new Set(subjectMaster.map((item) => item.code.toUpperCase()));
          const additions = legacySubjects.flatMap((legacy) => {
            const id = typeof legacy.id === 'string' ? legacy.id : '';
            const code = typeof legacy.code === 'string' ? legacy.code.trim().toUpperCase() : '';
            const name = typeof legacy.name === 'string' ? legacy.name.trim() : '';
            if (
              knownDemoSubjectIds.has(id) || !code || !name || knownCodes.has(code) ||
              !isSubjectType(legacy.type) || !isAcademicStatus(legacy.status)
            ) return [];
            knownCodes.add(code);
            return [{
              code,
              name,
              type: legacy.type,
              status: legacy.status,
              description: typeof legacy.description === 'string' ? legacy.description : undefined,
            }];
          });
          if (additions.length) {
            subjectMaster = [...await createSubjectMasterRecords(additions), ...subjectMaster];
          }
          if (migrationErrors.length === 0) {
            localStorage.setItem('e_tam_subject_master_migrated', 'true');
          }
        }
      } catch (error) {
        migrationErrors.push(error instanceof Error ? error.message : 'Could not migrate saved subjects.');
      }

      const [latestConfigs, latestSubjects, latestTypes] = await Promise.all([
        getAcademicConfigurations(),
        getSubjectMasterList(),
        getSubjectTypes(),
      ]);
      academicConfigs = latestConfigs;
      subjectMaster = latestSubjects;
      types = latestTypes;
      if (migrationErrors.length) {
        throw new Error(`Some previously saved browser data was not imported: ${migrationErrors.join(' ')}`);
      }
      if (!mounted) return;
      setConfigs(academicConfigs);
      setSubjects(subjectMaster);
      setSubjectTypes(types);
      localStorage.setItem(
        'e_tam_academic_years',
        JSON.stringify(Array.from(new Set(academicConfigs.map((item) => item.academicYear)))),
      );
    };

    load().catch((error: unknown) => {
      if (!mounted) return;
      setLoadError(error instanceof Error ? error.message : 'Unable to load academic configuration data.');
      Promise.all([getAcademicConfigurations(), getSubjectMasterList(), getSubjectTypes()])
        .then(([academicConfigs, subjectMaster, types]) => {
          if (!mounted) return;
          setConfigs(academicConfigs);
          setSubjects(subjectMaster);
          setSubjectTypes(types);
        })
        .catch(() => {
          if (mounted) setLoadError((current) => `${current} Current database data could not be loaded either.`);
        });
    });

    return () => {
      mounted = false;
    };
  }, []);

  return {
    configs,
    setConfigs,
    subjects,
    setSubjects,
    subjectTypes,
    setSubjectTypes,
    loadError,
  };
};
