import 'react-native-url-polyfill/auto'; // URL polyfill 필요
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@env';


if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  throw new Error('Supabase URL 또는 Anon Key가 설정되지 않았습니다.');
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage, // 세션 유지용 세션 데이터를 저장할 저장소 지정, React Native 환경에서는 AsyncStorage 사용
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,// React Native에서는 일반적으로 false로 설정합니다.
  },
}); 
