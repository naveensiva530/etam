import axios from 'axios';

export const AUTH_SESSION_STORAGE_KEY = 'e_tam_auth_session';

const api = axios.create({
  baseURL: '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((request) => {
  const savedSession = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (savedSession) {
    try {
      const session: unknown = JSON.parse(savedSession);
      if (
        typeof session === 'object' &&
        session !== null &&
        'token' in session &&
        typeof session.token === 'string'
      ) {
        request.headers.set('Authorization', `Bearer ${session.token}`);
      }
    } catch {
      localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    }
  }
  return request;
});

api.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    if (
      axios.isAxiosError(error) &&
      error.response?.status === 401 &&
      localStorage.getItem(AUTH_SESSION_STORAGE_KEY)
    ) {
      window.dispatchEvent(new Event('e-tam:unauthorized'));
    }
    return Promise.reject(error);
  },
);

export default api;
