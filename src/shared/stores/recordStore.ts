import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@libs/supabase/supabase';
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
    console.log('[RecordStore] fetchRecords 호출됨');
    const userId = useAuthStore.getState().userId;
    console.log('[RecordStore] 현재 userId:', userId);
    
    if (!userId) {
      console.log('[RecordStore] 사용자가 로그인하지 않았습니다. fetchRecords 중단');
      set({ records: [], error: '로그인이 필요합니다.' });
      return;
    }
    
    console.log('[RecordStore] 로그인 상태 확인됨, DB에서 records 가져오기 시작');
    set({ isLoading: true, error: null });
    
    try {
      console.log('[RecordStore] Supabase 쿼리 시작, userId:', userId);
      
      const { data, error } = await supabase
        .from('records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('[RecordStore] records 가져오기 실패:', error);
        set({ 
          records: [], 
          error: error.message,
          isLoading: false,
        });
        return;
      }
      
      const records = data || [];
      console.log('[RecordStore] DB에서 records 가져오기 성공, 개수:', records.length);
      
      // 가져온 records 상세 로깅
      if (records.length > 0) {
        console.log('[RecordStore] 가져온 records 상세:');
        records.forEach((record, index) => {
          console.log(`[RecordStore] [${index + 1}/${records.length}]`, {
            id: record.id,
            user_id: record.user_id,
            image_path: record.image_path,
            latitude: record.latitude,
            longitude: record.longitude,
            category: record.category,
            memo: record.memo ? `${record.memo.substring(0, 20)}...` : null,
            created_at: record.created_at,
          });
        });
      } else {
        console.log('[RecordStore] 가져온 records 없음');
      }
      
      // 상태 업데이트
      set({ 
        records, 
        error: null,
        isLoading: false,
      });
      
      // 로컬 스토리지에 저장
      await get().saveRecordsToStorage();
    } catch (error: any) {
      console.error('[RecordStore] records 가져오기 오류:', error);
      set({ 
        records: [], 
        error: error.message || '알 수 없는 오류가 발생했습니다.',
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
    console.log('[RecordStore] 로컬에 record 추가:', {
      id: record.id,
      user_id: record.user_id,
      image_path: record.image_path,
      latitude: record.latitude,
      longitude: record.longitude,
      category: record.category,
      memo: record.memo ? `${record.memo.substring(0, 20)}...` : null,
      created_at: record.created_at,
    });
  },
  
  // 로컬 스토리지에서 records 불러오기
  loadRecordsFromStorage: async () => {
    try {
      console.log('[RecordStore] 로컬 스토리지에서 records 불러오기 시작');
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const records = JSON.parse(stored) as Record[];
        console.log('[RecordStore] 로컬 스토리지에서 records 불러오기 성공, 개수:', records.length);
        
        // 가져온 records 상세 로깅
        if (records.length > 0) {
          console.log('[RecordStore] 로컬 스토리지에서 가져온 records 상세:');
          records.forEach((record, index) => {
            console.log(`[RecordStore] [${index + 1}/${records.length}]`, {
              id: record.id,
              user_id: record.user_id,
              image_path: record.image_path,
              latitude: record.latitude,
              longitude: record.longitude,
              category: record.category,
              memo: record.memo ? `${record.memo.substring(0, 20)}...` : null,
              created_at: record.created_at,
            });
          });
        } else {
          console.log('[RecordStore] 로컬 스토리지에 records 없음 (빈 배열)');
        }
        
        set({ records });
      } else {
        console.log('[RecordStore] 로컬 스토리지에 records 없음 (저장된 데이터 없음)');
        set({ records: [] });
      }
    } catch (error) {
      console.error('[RecordStore] 로컬 스토리지에서 records 불러오기 실패:', error);
      set({ records: [] });
    }
  },
  
  // 로컬 스토리지에 records 저장
  saveRecordsToStorage: async () => {
    try {
      const { records } = get();
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(records));
      console.log('[RecordStore] 로컬 스토리지에 records 저장 완료, 개수:', records.length);
    } catch (error) {
      console.error('[RecordStore] 로컬 스토리지에 records 저장 실패:', error);
    }
  },
  
  clearRecords: () => {
    set({ records: [], error: null });
    AsyncStorage.removeItem(STORAGE_KEY).catch(console.error);
  },
}));

