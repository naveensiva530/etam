import axios from 'axios';
import api from '@/lib/api';
import type { User } from '@/types/auth';

export interface AuthSession {
  token: string;
  user: User;
}

interface ApiAuthSession {
  data: {
    token: string;
    user: {
      id: string;
      email: string;
      role: 'admin';
    };
  };
}

const toAuthSession = (response: ApiAuthSession): AuthSession => ({
  token: response.data.token,
  user: {
    id: response.data.user.id,
    email: response.data.user.email,
    name: response.data.user.email,
    avatar: '',
    role: response.data.user.role,
  },
});

export async function login(email: string, password: string): Promise<AuthSession> {
  const response = await api.post<ApiAuthSession>('/auth/login', { email, password });
  return toAuthSession(response.data);
}

export async function register(email: string, password: string): Promise<AuthSession> {
  const response = await api.post<ApiAuthSession>('/auth/register', { email, password });
  return toAuthSession(response.data);
}

export function getAuthApiError(error: unknown): string {
  if (axios.isAxiosError<{ message?: string; details?: Array<{ message: string }> }>(error)) {
    const response = error.response?.data;
    return response?.details?.[0]?.message || response?.message || 'Unable to sign in. Please try again.';
  }
  return 'Unable to sign in. Please try again.';
}
