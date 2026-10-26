import type { InstitutionType, StaffInput, StaffRecord } from '../types';
import api from '@/lib/api';
import axios from 'axios';

// ── Shared response wrapper ───────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
}

// ── List params & paginated response ─────────────────────────────────────────
export interface StaffListParams {
  institution?: InstitutionType;
  page?: number;
  limit?: number;
  search?: string;
}

export interface StaffListResponse {
  staff: StaffRecord[];
  total: number;
  page: number;
  limit: number;
}

// ── Active staff (paginated) ──────────────────────────────────────────────────
export async function getStaff(params: StaffListParams): Promise<StaffListResponse> {
  const response = await api.get<ApiResponse<StaffRecord[]> & {
    total: number; page: number; limit: number;
  }>('/staff', { params });
  return {
    staff: response.data.data,
    total: response.data.total,
    page:  response.data.page,
    limit: response.data.limit,
  };
}

/** Convenience: fetch ALL staff for a given institution (no pagination). */
export async function getAllStaff(institution: InstitutionType): Promise<StaffRecord[]> {
  const response = await getStaff({ institution, limit: 200 });
  return response.staff;
}

// ── Create one ───────────────────────────────────────────────────────────────
export async function createStaff(staff: StaffInput): Promise<StaffRecord> {
  const response = await api.post<ApiResponse<StaffRecord>>('/staff', staff);
  return response.data.data;
}

// ── Bulk create ──────────────────────────────────────────────────────────────
export async function createStaffBulk(staffList: StaffInput[]): Promise<StaffRecord[]> {
  const response = await api.post<ApiResponse<StaffRecord[]>>('/staff/bulk', { staffList });
  return response.data.data;
}

// ── Update one ───────────────────────────────────────────────────────────────
export async function updateStaff(id: string, staff: StaffInput): Promise<StaffRecord> {
  const response = await api.put<ApiResponse<StaffRecord>>(
    `/staff/${encodeURIComponent(id)}`,
    staff,
  );
  return response.data.data;
}

// ── Soft-delete (moves to recycle bin) ───────────────────────────────────────
export async function deleteStaff(id: string): Promise<void> {
  await api.delete(`/staff/${encodeURIComponent(id)}`);
}

// ── Recycle bin: list archived ────────────────────────────────────────────────
export async function getArchivedStaff(institution?: InstitutionType): Promise<StaffRecord[]> {
  const response = await api.get<ApiResponse<StaffRecord[]>>('/staff/archived', {
    params: institution ? { institution } : undefined,
  });
  return response.data.data;
}

// ── Recycle bin: restore ──────────────────────────────────────────────────────
export async function restoreStaff(id: string): Promise<StaffRecord> {
  const response = await api.post<ApiResponse<StaffRecord>>(
    `/staff/${encodeURIComponent(id)}/restore`,
  );
  return response.data.data;
}

// ── Recycle bin: permanent delete ─────────────────────────────────────────────
export async function purgeStaff(id: string): Promise<void> {
  await api.delete(`/staff/${encodeURIComponent(id)}/purge`);
}

export async function getStaffRoles(institution: InstitutionType): Promise<string[] | null> {
  const response = await api.get<ApiResponse<string[] | null>>('/staff/roles', {
    params: { institution },
  });
  return response.data.data;
}

export async function saveStaffRoles(
  institution: InstitutionType,
  roles: string[],
): Promise<string[]> {
  const response = await api.put<ApiResponse<string[]>>('/staff/roles', {
    institution,
    roles,
  });
  return response.data.data;
}

export async function getStaffSkills(institution: InstitutionType): Promise<string[] | null> {
  const response = await api.get<ApiResponse<string[] | null>>('/staff/skills', {
    params: { institution },
  });
  return response.data.data;
}

export async function saveStaffSkills(
  institution: InstitutionType,
  skills: string[],
): Promise<string[]> {
  const response = await api.put<ApiResponse<string[]>>('/staff/skills', {
    institution,
    skills,
  });
  return response.data.data;
}

// ── Error extractor ──────────────────────────────────────────────────────────
export function getStaffApiError(error: unknown): string {
  if (axios.isAxiosError<{ message?: string; details?: Array<{ message: string }> }>(error)) {
    const response = error.response?.data;
    return (
      response?.details?.[0]?.message ||
      response?.message ||
      'Staff request failed. Check the API and try again.'
    );
  }
  return 'Staff request failed. Check the API and try again.';
}
