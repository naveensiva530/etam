import React, { createContext, useContext, useState, useEffect } from 'react';
import { InstitutionType } from '@/features/shared';
import { useAuth } from './AuthContext';

interface InstitutionConfig {
  type: InstitutionType;
  name: string;
  editionTitle: string;
  classFieldLabel: string;
  studentIdLabel: string;
  staffLabel: string;
  classesList: string[];
  departmentsList: string[];
}

interface InstitutionContextType {
  institutionType: InstitutionType;
  institutionName: string;
  config: InstitutionConfig;
  setInstitutionType: (type: InstitutionType) => void;
  setInstitutionName: (name: string) => void;
}

const INSTITUTION_CONFIGS: Record<InstitutionType, Omit<InstitutionConfig, 'name'>> = {
  School: {
    type: 'School',
    editionTitle: 'School Management Edition',
    classFieldLabel: 'Class & Section',
    studentIdLabel: 'Student Roll Number',
    staffLabel: 'Teaching Faculty & Staff',
    classesList: [
      'Class 1 - Section A',
      'Class 2 - Section A',
      'Class 3 - Section A',
      'Class 4 - Section A',
      'Class 5 - Section A',
      'Class 6 - Section A',
      'Class 7 - Section A',
      'Class 8 - Section A',
      'Class 9 - Section A',
      'Class 10 - Section A',
      'Class 11 - Science',
      'Class 11 - Commerce',
      'Class 12 - Science',
      'Class 12 - Commerce',
    ],
    departmentsList: [
      'Primary Education',
      'Mathematics & Science',
      'Social Studies & Humanities',
      'Languages & Literature',
      'Physical Education & Sports',
      'School Administration',
    ],
  },
  College: {
    type: 'College',
    editionTitle: 'College & University ERP',
    classFieldLabel: 'Department & Degree Program',
    studentIdLabel: 'University Register / Roll Number',
    staffLabel: 'Professors & Department Faculty',
    classesList: [
      'B.Tech - Computer Science & Engg',
      'B.Tech - Information Technology',
      'B.Tech - Electronics & Comm Engg',
      'B.Tech - Mechanical Engineering',
      'B.Sc - Data Science & AI',
      'B.Com - Professional Accounting',
      'BBA - Business Administration',
      'M.Tech - Cloud & Cyber Security',
      'MBA - Global Management',
    ],
    departmentsList: [
      'Department of Computer Science',
      'Department of Electrical & Electronics',
      'Department of Mechanical Sciences',
      'Department of Business Studies',
      'Faculty of Science & Humanities',
      'Dean of Academic Affairs',
    ],
  },
  Training: {
    type: 'Training',
    editionTitle: 'Training Institute Academy ERP',
    classFieldLabel: 'Course & Cohort Batch',
    studentIdLabel: 'Enrollment / Trainee ID',
    staffLabel: 'Technical Instructors & Mentors',
    classesList: [
      'Full Stack Web Development (Batch 26)',
      'AI & Machine Learning Bootcamp (Cohort 4)',
      'Cloud DevOps & Kubernetes Specialization',
      'UI/UX Product Design Intensive',
      'Cybersecurity & Ethical Hacking Program',
      'Data Analytics & PowerBI Certification',
    ],
    departmentsList: [
      'Software Engineering Lab',
      'Cloud & Infrastructure Track',
      'Data Science & AI Hub',
      'Design & Digital Products',
      'Placement & Student Success',
      'Academy Operations',
    ],
  },
};

const DEFAULT_NAMES: Record<InstitutionType, string> = {
  School: 'St. Xavier International School',
  College: 'Apex Institute of Technology & Science',
  Training: 'E-tam Digital Training Academy',
};

const InstitutionContext = createContext<InstitutionContextType | undefined>(undefined);

export const InstitutionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const accountId = user?.id ?? 'anonymous';
  const typeStorageKey = `e_tam_software_edition_${encodeURIComponent(accountId)}`;
  const nameStorageKey = `e_tam_institution_name_${encodeURIComponent(accountId)}`;
  const [institutionType, setInstitutionTypeState] = useState<InstitutionType>(() => {
    const saved = localStorage.getItem(typeStorageKey) as InstitutionType | null;
    return saved && ['School', 'College', 'Training'].includes(saved) ? saved : 'School';
  });

  const [institutionName, setInstitutionNameState] = useState<string>(() => {
    const savedType = localStorage.getItem(typeStorageKey) as InstitutionType | null;
    const validType = savedType && ['School', 'College', 'Training'].includes(savedType) ? savedType : 'School';
    const savedName = localStorage.getItem(nameStorageKey);
    return savedName || DEFAULT_NAMES[validType];
  });

  useEffect(() => {
    const savedType = localStorage.getItem(typeStorageKey) as InstitutionType | null;
    const nextType = savedType && ['School', 'College', 'Training'].includes(savedType) ? savedType : 'School';
    setInstitutionTypeState(nextType);
    setInstitutionNameState(localStorage.getItem(nameStorageKey) || DEFAULT_NAMES[nextType]);
  }, [typeStorageKey, nameStorageKey]);

  const setInstitutionType = (type: InstitutionType) => {
    setInstitutionTypeState(type);
    localStorage.setItem(typeStorageKey, type);
    const newDefaultName = DEFAULT_NAMES[type];
    setInstitutionNameState(newDefaultName);
    localStorage.setItem(nameStorageKey, newDefaultName);
  };

  const setInstitutionName = (name: string) => {
    setInstitutionNameState(name);
    localStorage.setItem(nameStorageKey, name);
  };

  const currentConfig: InstitutionConfig = {
    ...INSTITUTION_CONFIGS[institutionType],
    name: institutionName,
  };

  return (
    <InstitutionContext.Provider
      value={{
        institutionType,
        institutionName,
        config: currentConfig,
        setInstitutionType,
        setInstitutionName,
      }}
    >
      {children}
    </InstitutionContext.Provider>
  );
};

export const useInstitution = (): InstitutionContextType => {
  const context = useContext(InstitutionContext);
  if (!context) {
    throw new Error('useInstitution must be used within an InstitutionProvider');
  }
  return context;
};
