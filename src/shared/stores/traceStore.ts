import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@libs/supabase/supabase';
import { useAuthStore } from './authStore';
import { useLocationStore } from './locationStore';

export interface Trace {
  id?: string;
  // 로컬에서는 user_id가 없을 수도 있으므로 optional
  user_id?: string;
  latitude: number;
  longitude: number;
  recorded_at: string; // ISO 8601 format
}

interface TraceState {
  traces: Trace[];
  isTracking: boolean;
  lastSyncTime: number | null;      // 마지막 Supabase 동기화 시각(시간 기준)
  lastSyncedAt: string | null;      // 마지막으로 Supabase에 저장한 trace의 recorded_at
  trackingIntervalId: ReturnType<typeof setInterval> | null;
  syncIntervalId: ReturnType<typeof setInterval> | null;
  
  // Actions
  startTracking: () => void;
  stopTracking: () => void;
  addTrace: (trace: Trace) => void;
  syncToSupabase: () => Promise<void>;
  filterTodayTraces: () => Trace[];
  loadTracesFromStorage: () => Promise<void>;
  saveTracesToStorage: () => Promise<void>;
  loadSyncStateFromStorage: () => Promise<void>;
  saveSyncStateToStorage: () => Promise<void>;
  clearOldTraces: () => void;
}

const STORAGE_KEY = '@zikku_traces_today';
const SYNC_STATE_STORAGE_KEY = '@zikku_traces_sync_state';
const TRACKING_INTERVAL = 5000; // 5초
const SYNC_INTERVAL = 5 * 60 * 1000; // 5분
const MIN_MOVE_METERS = 1; // 이 거리 이상 움직였을 때만 기록

interface SyncState {
  lastSyncTime: number | null;
  lastSyncedAt: string | null;
}

// 오늘 날짜인지 확인하는 헬퍼 함수
const isToday = (dateString: string): boolean => {
  const traceDate = new Date(dateString);
  const today = new Date();
  
  return (
    traceDate.getFullYear() === today.getFullYear() &&
    traceDate.getMonth() === today.getMonth() &&
    traceDate.getDate() === today.getDate()
  );
};

// 날짜가 바뀌었는지 확인하는 헬퍼 함수
const isDateChanged = (lastSyncTime: number | null): boolean => {
  if (!lastSyncTime) return false;
  
  const lastSyncDate = new Date(lastSyncTime);
  const today = new Date();
  
  return (
    lastSyncDate.getFullYear() !== today.getFullYear() ||
    lastSyncDate.getMonth() !== today.getMonth() ||
    lastSyncDate.getDate() !== today.getDate()
  );
};

// 두 좌표 사이의 거리(m) 계산 (Haversine 공식)
const toRad = (deg: number) => (deg * Math.PI) / 180;

const getDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number => {
  const R = 6371000; // 지구 반지름 (m)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const useTraceStore = create<TraceState>((set, get) => ({
  traces: [],
  isTracking: false,
  lastSyncTime: null,
  lastSyncedAt: null,
  trackingIntervalId: null,
  syncIntervalId: null,

  filterTodayTraces: () => {
    const { traces } = get();
    return traces.filter(trace => isToday(trace.recorded_at));
  },

  clearOldTraces: () => {
    const todayTraces = get().filterTodayTraces();
    set({ traces: todayTraces });
  },

  addTrace: (trace: Trace) => {
    // 오늘 날짜인지 확인
    if (!isToday(trace.recorded_at)) {
      return;
    }

    set((state) => {
      const newTraces = [...state.traces, trace];
      // 오늘 데이터만 유지
      const todayTraces = newTraces.filter(t => isToday(t.recorded_at));
      
      // AsyncStorage에 비동기로 저장
      get().saveTracesToStorage();
      
      return { traces: todayTraces };
    });
  },

  saveTracesToStorage: async () => {
    try {
      const todayTraces = get().filterTodayTraces();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(todayTraces));
    } catch (error) {
       
    }
  },

  loadTracesFromStorage: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const traces: Trace[] = JSON.parse(stored);
        // 오늘 데이터만 로드
        const todayTraces = traces.filter(trace => isToday(trace.recorded_at));
        set({ traces: todayTraces });
      }
    } catch (error) {
       
    }
  },

  saveSyncStateToStorage: async () => {
    try {
      const { lastSyncTime, lastSyncedAt } = get();
      const syncState: SyncState = {
        lastSyncTime,
        lastSyncedAt,
      };
      await AsyncStorage.setItem(SYNC_STATE_STORAGE_KEY, JSON.stringify(syncState));
    } catch (error) {
       
    }
  },

  loadSyncStateFromStorage: async () => {
    try {
      const stored = await AsyncStorage.getItem(SYNC_STATE_STORAGE_KEY);
      if (stored) {
        const syncState: SyncState = JSON.parse(stored);
        
        // 날짜가 바뀌었으면 동기화 상태 초기화
        if (syncState.lastSyncTime && isDateChanged(syncState.lastSyncTime)) {
          set({
            lastSyncTime: null,
            lastSyncedAt: null,
          });
          await AsyncStorage.removeItem(SYNC_STATE_STORAGE_KEY);
        } else {
          set({
            lastSyncTime: syncState.lastSyncTime,
            lastSyncedAt: syncState.lastSyncedAt,
          });
        }
      }
    } catch (error) {
      
    }
  },

  syncToSupabase: async () => {
    const { traces, filterTodayTraces, lastSyncedAt } = get();
    const userId = useAuthStore.getState().userId;
    
    if (!userId) {
      return;
    }

    // 오늘 데이터 중 아직 Supabase에 저장하지 않은 것만 동기화
    const todayTraces = filterTodayTraces();

    // 마지막으로 저장한 recorded_at 이후의 것만 선택
    const tracesToUpload =
      lastSyncedAt
        ? todayTraces.filter(
            (t) => new Date(t.recorded_at) > new Date(lastSyncedAt),
          )
        : todayTraces;
    
    if (tracesToUpload.length === 0) {
      return;
    }

    // Supabase에 저장할 데이터 준비 (id 제외)
    const tracesToSync = tracesToUpload.map(({ id, ...trace }) => ({
      ...trace,
      user_id: userId,
    }));

    try {
      const { data, error } = await supabase
        .from('traces')
        .insert(tracesToSync)
        .select();

      if (error) {
        return;
      }

      // 이번에 업로드한 trace 중 가장 최신 recorded_at을 기록
      const latestUploaded =
        tracesToUpload.reduce((latest, cur) =>
          new Date(cur.recorded_at) > new Date(latest.recorded_at)
            ? cur
            : latest,
        tracesToUpload[0]);

      const syncTime = Date.now();
      set({
        lastSyncTime: syncTime,
        lastSyncedAt: latestUploaded.recorded_at,
      });
      
      // 동기화 상태를 AsyncStorage에 저장
      await get().saveSyncStateToStorage();
      
      // 날짜가 바뀌었는지 확인하고 오래된 데이터 제거
      const { lastSyncTime: prevSyncTime } = get();
      if (prevSyncTime && isDateChanged(prevSyncTime)) {
        get().clearOldTraces();
      }
    } catch (error) {
       
    }
  },

  startTracking: () => {
    // TODO: 다음 업데이트에서 trace 기능 활성화 예정
    // trace 로직 일시 중지
    return;
    
    /* 주석 처리된 trace 로직 - 다음 업데이트에서 활성화 예정
    const { isTracking, trackingIntervalId, syncIntervalId } = get();

    if (isTracking) {
      return;
    }

    // 기존 interval 정리
    if (trackingIntervalId) {
      clearInterval(trackingIntervalId);
    }
    if (syncIntervalId) {
      clearInterval(syncIntervalId);
    }

    // 저장된 traces와 동기화 상태 로드 (비동기로 실행하되 완료 후 동기화)
    (async () => {
      await get().loadTracesFromStorage();
      await get().loadSyncStateFromStorage();
      // 오래된 데이터 제거 (오늘 데이터만 유지)
      get().clearOldTraces();
      // 초기화 완료 후 즉시 동기화 시도 (이전에 저장된 데이터가 있을 수 있음)
      await get().syncToSupabase();
    })();

    // 위치 추적 시작 (지속적으로 위치 업데이트)
    useLocationStore.getState().startWatchingLocation();

    // 5초마다 위치 저장
    const trackingId = setInterval(() => {
      // 현재 위치를 locationStore에서 가져옴 (watchPosition으로 지속적으로 업데이트됨)
      const latitude = useLocationStore.getState().latitude;
      const longitude = useLocationStore.getState().longitude;

      if (latitude !== null && longitude !== null) {
        const { traces } = get();
        const last = traces.length > 0 ? traces[traces.length - 1] : null;

        // 마지막 위치와의 거리가 너무 짧으면 기록하지 않음 (정지/미세한 흔들림 필터링)
        if (last) {
          const distance = getDistanceMeters(
            last.latitude,
            last.longitude,
            latitude,
            longitude,
          );

          if (distance < MIN_MOVE_METERS) {
            return;
          }
        }

        const trace: Trace = {
          // user_id는 동기화 시점에 auth 상태로 설정하므로 여기서는 optional
          latitude,
          longitude,
          recorded_at: new Date().toISOString(),
        };
        get().addTrace(trace);
      }
    }, TRACKING_INTERVAL);

    // 5분마다 Supabase 동기화
    const syncId = setInterval(() => {
      get().syncToSupabase();
    }, SYNC_INTERVAL);

    set({
      isTracking: true,
      trackingIntervalId: trackingId,
      syncIntervalId: syncId,
    });

    // 초기화 함수에서 동기화를 실행하므로 여기서는 호출하지 않음
    */
  },

  stopTracking: () => {
    const { trackingIntervalId, syncIntervalId, isTracking } = get();
    
    if (!isTracking) {
      return;
    }

    if (trackingIntervalId) {
      clearInterval(trackingIntervalId);
    }
    if (syncIntervalId) {
      clearInterval(syncIntervalId);
    }

    // 중지 전 마지막 동기화
    get().syncToSupabase();

    // 위치 추적 중지
    useLocationStore.getState().stopWatchingLocation();

    set({
      isTracking: false,
      trackingIntervalId: null,
      syncIntervalId: null,
    });
  },
}));

