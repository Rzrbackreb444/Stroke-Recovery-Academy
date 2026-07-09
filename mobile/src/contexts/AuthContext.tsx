import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch, clearSession } from '../lib/apiFetch';
import { Endpoints } from '../constants/api';

export interface AuthUser {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  role: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await apiFetch<AuthUser | null>(Endpoints.authUser);
      setUser(data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const signIn = useCallback(async (email: string, password: string) => {
    await apiFetch(Endpoints.authLogin, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await refresh();
  }, [refresh]);

  const register = useCallback(async (
    email: string,
    password: string,
    firstName: string,
    lastName: string,
  ) => {
    await apiFetch(Endpoints.authRegister, {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
    await refresh();
  }, [refresh]);

  const signOut = useCallback(async () => {
    try {
      await apiFetch(Endpoints.authLogout, { method: 'POST' });
    } catch { }
    await clearSession();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, signIn, register, signOut, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
