import { AsyncStorageService } from './asyncStorageService';
import type { Trace } from '@types/trace';

const TRACE_STORAGE_KEY = 'traces_v1';

export async function saveTraces(traces: Trace[]): Promise<void> {
  await AsyncStorageService.setJSONItem<Trace[]>(TRACE_STORAGE_KEY, traces);
}

export async function loadTraces(): Promise<Trace[]> {
  const data = await AsyncStorageService.getJSONItem<Trace[]>(TRACE_STORAGE_KEY);
  return data ?? [];
}

export async function clearTraces(): Promise<void> {
  await AsyncStorageService.removeItem(TRACE_STORAGE_KEY);
}


