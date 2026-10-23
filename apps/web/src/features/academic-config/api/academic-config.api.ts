import api from '@/lib/api';
import type {
  AcademicConfigItem,
  CreateAcademicConfigDto,
  UpdateAcademicConfigDto,
  SubjectMasterRecord,
  SubjectTypeOption,
  CreateSubjectMasterDto,
  AcademicConfigAllocations,
} from '../types';

export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface AcademicSectionItem {
  id: string;
  name: string;
  classCount: number;
}

export async function getAcademicSections(): Promise<AcademicSectionItem[]> {
  const response = await api.get<ApiResponse<AcademicSectionItem[]>>('/academic-configurations/sections');
  return response.data.data;
}

export async function createAcademicSection(name: string): Promise<AcademicSectionItem> {
  const response = await api.post<ApiResponse<AcademicSectionItem>>(
    '/academic-configurations/sections',
    { name },
  );
  return response.data.data;
}

export async function renameAcademicSection(id: string, name: string): Promise<AcademicSectionItem> {
  const response = await api.put<ApiResponse<AcademicSectionItem>>(
    `/academic-configurations/sections/${encodeURIComponent(id)}`,
    { name },
  );
  return response.data.data;
}

export async function deleteAcademicSection(id: string): Promise<void> {
  await api.delete(`/academic-configurations/sections/${encodeURIComponent(id)}`);
}

export async function getSubjectTypes(): Promise<SubjectTypeOption[]> {
  const response = await api.get<ApiResponse<SubjectTypeOption[]>>('/academic-configurations/subject-types');
  return response.data.data;
}

export async function createSubjectType(name: string): Promise<SubjectTypeOption> {
  const response = await api.post<ApiResponse<SubjectTypeOption>>(
    '/academic-configurations/subject-types',
    { name },
  );
  return response.data.data;
}

export async function renameSubjectType(id: string, name: string): Promise<SubjectTypeOption> {
  const response = await api.put<ApiResponse<SubjectTypeOption>>(
    `/academic-configurations/subject-types/${encodeURIComponent(id)}`,
    { name },
  );
  return response.data.data;
}

export async function deleteSubjectType(id: string): Promise<void> {
  await api.delete(`/academic-configurations/subject-types/${encodeURIComponent(id)}`);
}

export async function getAcademicConfigurations(): Promise<AcademicConfigItem[]> {
  const response = await api.get<ApiResponse<AcademicConfigItem[]>>('/academic-configurations');
  return response.data.data;
}

export async function createAcademicConfiguration(
  dto: CreateAcademicConfigDto
): Promise<AcademicConfigItem> {
  const response = await api.post<ApiResponse<AcademicConfigItem>>('/academic-configurations', dto);
  return response.data.data;
}

export async function updateAcademicConfiguration(
  id: string,
  dto: UpdateAcademicConfigDto
): Promise<AcademicConfigItem> {
  const response = await api.put<ApiResponse<AcademicConfigItem>>(
    `/academic-configurations/${encodeURIComponent(id)}`,
    dto
  );
  return response.data.data;
}

export async function updateAcademicConfigurationSections(
  id: string,
  expectedSections: string[],
  sections: string[],
): Promise<AcademicConfigItem> {
  const response = await api.put<ApiResponse<AcademicConfigItem>>(
    `/academic-configurations/${encodeURIComponent(id)}/sections`,
    { expectedSections, sections },
  );
  return response.data.data;
}

export async function deleteAcademicConfiguration(id: string): Promise<boolean> {
  await api.delete(`/academic-configurations/${encodeURIComponent(id)}`);
  return true;
}

export async function getSubjectMasterList(): Promise<SubjectMasterRecord[]> {
  const response = await api.get<ApiResponse<SubjectMasterRecord[]>>('/academic-configurations/subjects');
  return response.data.data;
}

export async function createSubjectMasterRecord(
  dto: CreateSubjectMasterDto
): Promise<SubjectMasterRecord> {
  const response = await api.post<ApiResponse<SubjectMasterRecord>>(
    '/academic-configurations/subjects',
    dto
  );
  return response.data.data;
}

export async function updateSubjectMasterRecord(
  id: string,
  dto: CreateSubjectMasterDto,
): Promise<SubjectMasterRecord> {
  const response = await api.put<ApiResponse<SubjectMasterRecord>>(
    `/academic-configurations/subjects/${encodeURIComponent(id)}`,
    dto,
  );
  return response.data.data;
}

export async function createSubjectMasterRecords(
  subjects: CreateSubjectMasterDto[]
): Promise<SubjectMasterRecord[]> {
  const response = await api.post<ApiResponse<SubjectMasterRecord[]>>(
    '/academic-configurations/subjects/bulk',
    { subjects }
  );
  return response.data.data;
}

export async function deleteSubjectMasterRecord(id: string): Promise<void> {
  await api.delete(`/academic-configurations/subjects/${encodeURIComponent(id)}`);
}

export async function getAcademicConfigAllocations(
  configId: string
): Promise<AcademicConfigAllocations> {
  const response = await api.get<ApiResponse<AcademicConfigAllocations>>(
    `/academic-configurations/${encodeURIComponent(configId)}/allocations`
  );
  return response.data.data;
}

export async function saveAcademicConfigAllocations(
  configId: string,
  allocations: AcademicConfigAllocations
): Promise<AcademicConfigAllocations> {
  const response = await api.put<ApiResponse<AcademicConfigAllocations>>(
    `/academic-configurations/${encodeURIComponent(configId)}/allocations`,
    allocations
  );
  return response.data.data;
}
