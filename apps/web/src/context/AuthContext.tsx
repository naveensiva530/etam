import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { User, UserRole } from '@/types/auth';
import { AUTH_SESSION_STORAGE_KEY } from '@/lib/api';
import { AuthSession, login as loginRequest, register as registerRequest } from '@/features/auth/authApi';

interface AuthContextType {
  role: UserRole;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  canAccess: (allowedRoles: UserRole[]) => boolean;
}

const VALID_ROLES = new Set<UserRole>(['superadmin', 'admin', 'staff', 'student']);

const readSavedSession = (): AuthSession | null => {
  const saved = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
  if (!saved) return null;

  try {
    const parsed: any = JSON.parse(saved);
    if (
      parsed &&
      typeof parsed.token === 'string' &&
      parsed.user &&
      typeof parsed.user.id === 'string' &&
      typeof parsed.user.email === 'string'
    ) {
      const userRole: UserRole = VALID_ROLES.has(parsed.user.role) ? parsed.user.role : 'admin';
      return {
        token: parsed.token,
        user: {
          id: parsed.user.id,
          email: parsed.user.email,
          name: parsed.user.name || parsed.user.email,
          avatar: parsed.user.avatar || '',
          role: userRole,
        },
      };
    }
  } catch {
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  }
  localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
  return null;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(readSavedSession);

  const saveSession = useCallback((nextSession: AuthSession) => {
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify(nextSession));
    setSession(nextSession);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    saveSession(await loginRequest(email, password));
  }, [saveSession]);

  const register = useCallback(async (email: string, password: string) => {
    saveSession(await registerRequest(email, password));
  }, [saveSession]);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    setSession(null);
  }, []);

  useEffect(() => {
    window.addEventListener('e-tam:unauthorized', logout);
    return () => window.removeEventListener('e-tam:unauthorized', logout);
  }, [logout]);

  const userRole: UserRole = session?.user?.role ?? 'admin';

  const value = useMemo<AuthContextType>(() => ({
    role: userRole,
    user: session?.user ?? null,
    login,
    register,
    logout,
    isAdmin: userRole === 'admin' || userRole === 'superadmin',
    isSuperAdmin: userRole === 'superadmin',
    canAccess: (allowedRoles) => Boolean(session) && allowedRoles.includes(userRole),
  }), [session, userRole, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
