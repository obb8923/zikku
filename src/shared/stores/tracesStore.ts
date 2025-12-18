import { create } from 'zustand';
import { nanoid } from 'nanoid/non-secure';
import { supabase } from '@libs/supabase/supabase';
import { saveTraces, loadTraces } from '@services/traceStorageService';
import type { Trace } from '@types/trace';
import { useAuthStore } from './authStore';

interface TracesState {
  items: Trace[];
  pendingQueue: Trace[];
  lastSyncAt: string | null;
  isSyncing: boolean;
  error: string | null;
  addLocalTrace: (latitude: number, longitude: number, recordedAt?: Date) => Promise<void>;
  loadInitialTraces: () => Promise<void>;
  flushPendingToRemote: () => Promise<void>;
  reset: () => Promise<void>;
}

export const useTracesStore = create<TracesState>((set, get) => ({
  items: [],
  pendingQueue: [],
  lastSyncAt: null,
  isSyncing: false,
  error: null,

  addLocalTrace: async (latitude, longitude, recordedAt = new Date()) => {
    const userId = useAuthStore.getState().userId;
    if (!userId) {
      if (__DEV__) {
        console.log('[TracesStore] userId 없음, trace 저장 스킵');
      }
      return;
    }

    const trace: Trace = {
      user_id: userId,
      latitude,
      longitude,
      recorded_at: recordedAt.toISOString(),
      localId: nanoid(),
    };

    const nextItems = [...get().items, trace];
    const nextPending = [...get().pendingQueue, trace];

    set({
      items: nextItems,
      pendingQueue: nextPending,
    });

    // 로컬 저장 (전체 리스트 저장, 5초 주기 호출이므로 비용이 크지 않다고 가정)
    try {
      await saveTraces(nextItems);
    } catch (error) {
      if (__DEV__) {
        console.error('[TracesStore] saveTraces 에러', error);
      }
    }
  },

  loadInitialTraces: async () => {
    try {
      const traces = await loadTraces();
      set({
        items: traces,
        // 앱 재시작 시 아직 서버에 안 올라갔을 수도 있으니 모두 pendingQueue에 넣어둔다
        pendingQueue: traces,
      });
    } catch (error) {
      if (__DEV__) {
        console.error('[TracesStore] loadInitialTraces 에러', error);
      }
      set({ error: 'failed_to_load_traces' });
    }
  },

  flushPendingToRemote: async () => {
    const { pendingQueue, isSyncing } = get();
    const userId = useAuthStore.getState().userId;

    if (isSyncing || pendingQueue.length === 0 || !userId) {
      return;
    }

    set({ isSyncing: true, error: null });
    try {
      const payload = pendingQueue.map((t) => ({
        user_id: userId,
        latitude: t.latitude,
        longitude: t.longitude,
        recorded_at: t.recorded_at,
      }));

      const { error } = await supabase.from('traces').insert(payload);
      if (error) {
        throw error;
      }

      const remaining = get().items.filter(
        (item) => !pendingQueue.some((p) => p.localId && p.localId === item.localId),
      );

      set({
        pendingQueue: [],
        items: remaining,
        lastSyncAt: new Date().toISOString(),
      });

      await saveTraces(remaining);
    } catch (error) {
      if (__DEV__) {
        console.error('[TracesStore] flushPendingToRemote 에러', error);
      }
      set({ error: 'failed_to_sync_traces' });
    } finally {
      set({ isSyncing: false });
    }
  },

  reset: async () => {
    set({
      items: [],
      pendingQueue: [],
      lastSyncAt: null,
      isSyncing: false,
      error: null,
    });
    try {
      const { clearTraces } = await import('@services/traceStorageService');
      await clearTraces();
    } catch (error) {
      if (__DEV__) {
        console.error('[TracesStore] reset clearTraces 에러', error);
      }
    }
  },
}));


