import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiFetch } from '../lib/apiFetch';
import { enqueue, getQueue, removeFromQueue } from '../lib/offlineQueue';
import { Endpoints } from '../constants/api';

const DASHBOARD_CACHE_KEY = 'sra:dashboard_cache';

interface OfflineContextValue {
  isOnline: boolean;
  cachedDashboard: unknown | null;
  setCachedDashboard: (data: unknown) => void;
  queueCheckin: (body: unknown) => Promise<void>;
  flushQueue: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextValue | null>(null);

export function OfflineProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [cachedDashboard, setCachedDashboardState] = useState<unknown | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(DASHBOARD_CACHE_KEY).then((raw) => {
      if (raw) {
        try { setCachedDashboardState(JSON.parse(raw)); } catch { }
      }
    });
  }, []);

  useEffect(() => {
    const unsub = NetInfo.addEventListener((state) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setIsOnline(online);
    });
    return unsub;
  }, []);

  const setCachedDashboard = useCallback((data: unknown) => {
    setCachedDashboardState(data);
    AsyncStorage.setItem(DASHBOARD_CACHE_KEY, JSON.stringify(data)).catch(() => { });
  }, []);

  const queueCheckin = useCallback(async (body: unknown) => {
    await enqueue({
      path: Endpoints.checkinCreate,
      method: 'POST',
      body,
    });
  }, []);

  const flushQueue = useCallback(async () => {
    if (!isOnline) return;
    const queue = await getQueue();
    for (const item of queue) {
      try {
        await apiFetch(item.path, {
          method: item.method,
          body: JSON.stringify(item.body),
        });
        await removeFromQueue(item.id);
      } catch {
        break;
      }
    }
  }, [isOnline]);

  useEffect(() => {
    if (isOnline) flushQueue();
  }, [isOnline, flushQueue]);

  return (
    <OfflineContext.Provider value={{
      isOnline,
      cachedDashboard,
      setCachedDashboard,
      queueCheckin,
      flushQueue,
    }}>
      {children}
    </OfflineContext.Provider>
  );
}

export function useOffline(): OfflineContextValue {
  const ctx = useContext(OfflineContext);
  if (!ctx) throw new Error('useOffline must be used inside OfflineProvider');
  return ctx;
}
