import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QueuedRequest {
  id: string;
  path: string;
  method: string;
  body: unknown;
  timestamp: number;
}

const QUEUE_KEY = 'sra:offline_queue';

export async function enqueue(req: Omit<QueuedRequest, 'id' | 'timestamp'>): Promise<void> {
  const queue = await getQueue();
  queue.push({
    ...req,
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
  });
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export async function getQueue(): Promise<QueuedRequest[]> {
  const raw = await AsyncStorage.getItem(QUEUE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as QueuedRequest[];
  } catch {
    return [];
  }
}

export async function clearQueue(): Promise<void> {
  await AsyncStorage.removeItem(QUEUE_KEY);
}

export async function removeFromQueue(id: string): Promise<void> {
  const queue = await getQueue();
  const next = queue.filter((q) => q.id !== id);
  await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(next));
}
