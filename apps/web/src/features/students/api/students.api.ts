import type { InstitutionType, StudentInput, StudentRecord } from '../types';
import api from '@/lib/api';
import axios from 'axios';

// ── Shared response wrapper ───────────────────────────────────────────────────
export interface ApiResponse<T> {
  data: T;
}

// ── List params & paginated response ─────────────────────────────────────────
export interface StudentsListParams {
  institution?: InstitutionType;
  page?: number;
  limit?: number;
  search?: string;
}

export interface StudentsListResponse {
  students: StudentRecord[];
  total: number;
  page: number;
  limit: number;
}

// ── Active students (paginated) ───────────────────────────────────────────────
export async function getStudents(params: StudentsListParams): Promise<StudentsListResponse> {
  const response = await api.get<ApiResponse<StudentRecord[]> & {
    total: number; page: number; limit: number;
  }>('/students', { params });
  return {
    students: response.data.data,
    total:    response.data.total,
    page:     response.data.page,
    limit:    response.data.limit,
  };
}

/** Fetch all pages for screens that currently filter and paginate locally. */
export async function getAllStudents(institution: InstitutionType): Promise<StudentRecord[]> {
  const pageSize = 200;
  const students: StudentRecord[] = [];
  let page = 1;

  while (true) {
    const response = await getStudents({ institution, page, limit: pageSize });
    students.push(...response.students);
    if (students.length >= response.total || response.students.length === 0) return students;
    page += 1;
  }
}

// ── Create one ───────────────────────────────────────────────────────────────
export async function createStudent(student: StudentInput): Promise<StudentRecord> {
  const response = await api.post<ApiResponse<StudentRecord>>('/students', student);
  return response.data.data;
}

// ── Bulk create ──────────────────────────────────────────────────────────────
export async function createStudents(students: StudentInput[]): Promise<StudentRecord[]> {
  const response = await api.post<ApiResponse<StudentRecord[]>>('/students/bulk', { students });
  return response.data.data;
}

// ── Update one ───────────────────────────────────────────────────────────────
export async function updateStudent(id: string, student: StudentInput): Promise<StudentRecord> {
  const response = await api.put<ApiResponse<StudentRecord>>(
    `/students/${encodeURIComponent(id)}`,
    student,
  );
  return response.data.data;
}

// ── Soft-delete (moves to recycle bin) ───────────────────────────────────────
export async function deleteStudent(id: string): Promise<void> {
  await api.delete(`/students/${encodeURIComponent(id)}`);
}

// ── Recycle bin: list archived ────────────────────────────────────────────────
export async function getArchivedStudents(institution?: InstitutionType): Promise<StudentRecord[]> {
  const pageSize = 200;
  const students: StudentRecord[] = [];
  let page = 1;

  while (true) {
    const response = await api.get<ApiResponse<StudentRecord[]> & {
      total: number; page: number; limit: number;
    }>('/students/archived', {
      params: { ...(institution ? { institution } : {}), page, limit: pageSize },
    });
    students.push(...response.data.data);
    if (students.length >= response.data.total || response.data.data.length === 0) return students;
    page += 1;
  }
}

// ── Recycle bin: restore ──────────────────────────────────────────────────────
export async function restoreStudent(id: string): Promise<StudentRecord> {
  const response = await api.post<ApiResponse<StudentRecord>>(
    `/students/${encodeURIComponent(id)}/restore`,
  );
  return response.data.data;
}

// ── Recycle bin: permanent delete ─────────────────────────────────────────────
export async function purgeStudent(id: string): Promise<void> {
  await api.delete(`/students/${encodeURIComponent(id)}/purge`);
}

// ── Error extractor ──────────────────────────────────────────────────────────
export function getStudentApiError(error: unknown): string {
  if (axios.isAxiosError<{ message?: string; details?: Array<{ message: string }> }>(error)) {
    const response = error.response?.data;
    return (
      response?.details?.[0]?.message ||
      response?.message ||
      'Student request failed. Check the API and try again.'
    );
  }
  return 'Student request failed. Check the API and try again.';
}
