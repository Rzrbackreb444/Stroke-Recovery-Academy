import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from '../constants/api';

export interface ApiError {
  message: string;
  status: number;
  capped?: boolean;
  requireAuth?: boolean;
}

const SESSION_COOKIE_KEY = 'sra:session';

export async function apiFetch<T = unknown>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const sessionCookie = await AsyncStorage.getItem(SESSION_COOKIE_KEY);

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (sessionCookie) {
    headers['Cookie'] = sessionCookie;
  }

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  const setCookie = response.headers.get('set-cookie');
  if (setCookie) {
    await AsyncStorage.setItem(SESSION_COOKIE_KEY, setCookie);
  }

  if (!response.ok) {
    const body = await response.json().catch(() => ({ message: 'Request failed' }));
    const err: ApiError = {
      message: body.message || 'Request failed',
      status: response.status,
      capped: body.capped,
      requireAuth: body.requireAuth,
    };
    throw err;
  }

  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}

export async function clearSession(): Promise<void> {
  await AsyncStorage.removeItem(SESSION_COOKIE_KEY);
}
