import api from '@/lib/api';
import type {
  DepartmentTimetableItem,
  TimetableConfig,
  TimetableOptionsResponse,
} from '../types/timetable.types';

interface ApiResponse<T> {
  data: T;
}

export async function getDepartmentTimetables(
  institution?: string
): Promise<DepartmentTimetableItem[]> {
  const response = await api.get<ApiResponse<DepartmentTimetableItem[]>>(
    '/timetable/departments',
    { params: { institution } }
  );
  return response.data.data;
}

export async function getTimetableOptions(
  academicConfigId?: string,
  sectionName?: string,
  institution?: string
): Promise<TimetableOptionsResponse> {
  const response = await api.get<ApiResponse<TimetableOptionsResponse>>(
    '/timetable/options',
    {
      params: { academicConfigId, sectionName, institution },
    }
  );
  return response.data.data;
}

export async function getTimetableById(id: string): Promise<TimetableConfig> {
  const response = await api.get<ApiResponse<TimetableConfig>>(
    `/timetable/config/${encodeURIComponent(id)}`
  );
  return response.data.data;
}

export async function getTimetableByAcademicConfigId(
  academicConfigId: string
): Promise<TimetableConfig | null> {
  try {
    const response = await api.get<ApiResponse<TimetableConfig>>(
      `/timetable/config/academic/${encodeURIComponent(academicConfigId)}`
    );
    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 404) return null;
    throw error;
  }
}

export async function saveTimetableConfig(
  payload: Partial<TimetableConfig> & {
    academicConfigurationId: string;
    departmentName: string;
    subCategory: string;
  }
): Promise<TimetableConfig> {
  const response = await api.post<ApiResponse<TimetableConfig>>(
    '/timetable/config',
    payload
  );
  return response.data.data;
}

export async function deleteTimetableConfig(id: string): Promise<void> {
  await api.delete(`/timetable/config/${encodeURIComponent(id)}`);
}
