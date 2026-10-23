import axios from 'axios';
import api from '@/lib/api';
import type { InstitutionType } from '@/features/shared';

export interface Department {
  id: string;
  institution: InstitutionType;
  name: string;
}

interface ApiResponse<T> {
  data: T;
}

export async function getDepartments(institution: InstitutionType): Promise<Department[]> {
  const response = await api.get<ApiResponse<Department[]>>('/departments', { params: { institution } });
  return response.data.data;
}

export async function createDepartment(institution: InstitutionType, name: string): Promise<Department> {
  const response = await api.post<ApiResponse<Department>>('/departments', { institution, name });
  return response.data.data;
}

export async function updateDepartment(id: string, name: string): Promise<Department> {
  const response = await api.put<ApiResponse<Department>>(`/departments/${encodeURIComponent(id)}`, { name });
  return response.data.data;
}

export async function deleteDepartment(id: string): Promise<void> {
  await api.delete(`/departments/${encodeURIComponent(id)}`);
}

export function getDepartmentApiError(error: unknown): string {
  if (axios.isAxiosError<{ message?: string; details?: Array<{ message: string }> }>(error)) {
    const response = error.response?.data;
    return response?.details?.[0]?.message || response?.message || 'Department request failed. Check the API and try again.';
  }
  return 'Department request failed. Check the API and try again.';
}
