import { create } from 'zustand';
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

interface RecordState {
  records: Record[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  fetchRecords: () => Promise<void>;
  clearRecords: () => void;
}

export const useRecordStore = create<RecordState>((set, get) => ({
  records: [],
  isLoading: false,
  error: null,
  
  fetchRecords: async () => {
    const userId = useAuthStore.getState().userId;
    
    if (!userId) {
      console.log('[RecordStore] 사용자가 로그인하지 않았습니다.');
      set({ records: [], error: '로그인이 필요합니다.' });
      return;
    }
    
    set({ isLoading: true, error: null });
    
    try {
      console.log('[RecordStore] records 가져오기 시작, userId:', userId);
      
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
      
      console.log('[RecordStore] records 가져오기 성공, 개수:', data?.length || 0);
      set({ 
        records: data || [], 
        error: null,
        isLoading: false,
      });
    } catch (error: any) {
      console.error('[RecordStore] records 가져오기 오류:', error);
      set({ 
        records: [], 
        error: error.message || '알 수 없는 오류가 발생했습니다.',
        isLoading: false,
      });
    }
  },
  
  clearRecords: () => {
    set({ records: [], error: null });
  },
}));

