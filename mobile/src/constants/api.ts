import { Platform } from 'react-native';

const getBaseUrl = (): string => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:5000';
  }

  return 'http://localhost:5000';
};

export const API_BASE = getBaseUrl();

export const Endpoints = {
  authUser: '/api/auth/user',
  authLogin: '/api/auth/login',
  authRegister: '/api/auth/register',
  authLogout: '/api/auth/logout',

  dashboard: '/api/recovery/dashboard',
  checkinToday: '/api/recovery/checkin/today',
  checkinCreate: '/api/recovery/checkin',
  checkinPatch: '/api/recovery/checkin',
  progressArc: '/api/recovery/progress-arc',
  streak: '/api/recovery/streak',

  habits: '/api/recovery/habits',
  habitLog: (id: number) => `/api/recovery/habits/${id}/log`,

  coachChat: '/api/coach/chat',

  pod: '/api/user/pod',
  pods: '/api/pods',
  podActivity: (id: number) => `/api/pods/${id}/activity`,
  podJoin: (id: number) => `/api/pods/${id}/join`,

  pushToken: '/api/mobile/push-token',
} as const;
