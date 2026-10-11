import { createContext, useContext, useState, type ReactNode } from 'react';
import { api, setAccessToken, getAccessToken } from '../lib/api.ts';
import type { AuthResponse, AuthUser } from '../lib/types.ts';

interface AuthContextValue {
  user: AuthUser | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORED_USER_KEY = 'authUser';

function loadStoredUser(): AuthUser | null {
  const raw = localStorage.getItem(STORED_USER_KEY);
  return raw ? (JSON.parse(raw) as AuthUser) : null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => (getAccessToken() ? loadStoredUser() : null));

  function applyAuthResponse(response: AuthResponse) {
    setAccessToken(response.accessToken);
    localStorage.setItem(STORED_USER_KEY, JSON.stringify(response.user));
    setUser(response.user);
  }

  async function login(email: string, password: string) {
    const response = await api.post<AuthResponse>('/auth/login', { email, password });
    applyAuthResponse(response);
  }

  async function register(email: string, password: string) {
    const response = await api.post<AuthResponse>('/auth/register', { email, password });
    applyAuthResponse(response);
  }

  function logout() {
    setAccessToken(null);
    localStorage.removeItem(STORED_USER_KEY);
    setUser(null);
  }

  return <AuthContext.Provider value={{ user, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
