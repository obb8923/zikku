import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { fetchRecords as fetchRecordsFromService } from '@libs/supabase/recordService';
import { useAuthStore } from './authStore';

export interface Record {
  id: string;
  user_id: string;
  image_path: string;
  latitude: number;
  longitude: number;
  memo?: string | null;
  category?: string | null;
  is_favorite?: boolean | null;
  created_at: string;
}

const STORAGE_KEY = '@zikku_records';

interface RecordState {
  records: Record[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchRecords: () => Promise<void>;
  addRecord: (record: Record) => void;
  updateRecord: (recordId: string, record: Record) => void;
  removeRecord: (recordId: string) => void;
  loadRecordsFromStorage: () => Promise<void>;
  saveRecordsToStorage: () => Promise<void>;
  clearRecords: () => void;
}

export const useRecordStore = create<RecordState>((set, get) => ({
  records: [],
  isLoading: false,
  error: null,
  
  // DB에서 records 가져와서 로컬 스토리지에도 저장
  fetchRecords: async () => {
    const userId = useAuthStore.getState().userId;
    
    if (!userId) {
      set({ records: [], error: '로그인이 필요합니다.' });
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      const records = await fetchRecordsFromService(userId);
      
      if (__DEV__) {
        console.log(`기록를 가져왔을때 가져온 기록 개수: ${records.length}, 내용:`, records);
      }
      
      // 상태 업데이트
      set({ 
        records, 
        error: null,
        isLoading: false,
      });
      
      // 로컬 스토리지에 저장
      await get().saveRecordsToStorage();
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류가 발생했습니다.';
      set({ 
        records: [], 
        error: errorMessage,
        isLoading: false,
      });
    }
  },
  
  // 로컬에 record 추가
  addRecord: (record: Record) => {
    set((state) => {
      const newRecords = [record, ...state.records];
      // 로컬 스토리지에 비동기로 저장
      get().saveRecordsToStorage();
      return { records: newRecords };
    });
  },
  
  // 로컬에 record 업데이트
  updateRecord: (recordId: string, updatedRecord: Record) => {
    set((state) => {
      const newRecords = state.records.map((r) =>
        r.id === recordId ? updatedRecord : r
      );
      // 로컬 스토리지에 비동기로 저장
      get().saveRecordsToStorage();
      return { records: newRecords };
    });
  },
  
  // 로컬에서 record 제거
  removeRecord: (recordId: string) => {
    set((state) => {
      const newRecords = state.records.filter((r) => r.id !== recordId);
      // 로컬 스토리지에 비동기로 저장
      get().saveRecordsToStorage();
      return { records: newRecords };
    });
  },
  
  // 로컬 스토리지에서 records 불러오기
  loadRecordsFromStorage: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const records = JSON.parse(stored) as Record[];
        set({ records });
      } else {
        set({ records: [] });
      }
    } catch (error) {
      set({ records: [] });
    }
  },
  
  // 로컬 스토리지에 records 저장
  saveRecordsToStorage: async () => {
    try {
      const { records } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
    } catch (error) {
      if (__DEV__) {
        console.error('로컬 스토리지에 records 저장 실패:', error);
      }
    }
  },
  
  clearRecords: () => {
    set({ records: [], error: null });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },
}));

