import { useState, useEffect } from 'react';
import { Platform } from 'react-native';
import { useOnboardingStore } from './onboardingStore';
import { useRecordStore } from './recordStore';
import { useAuthStore } from './authStore';
import { SUPABASE_WEB_CLIENT_KEY } from '@env';

export const useAppInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<Error | null>(null);

  const { checkOnboardingStatus, isOnboardingCompleted } = useOnboardingStore();
  const checkLoginStatus = useAuthStore(state => state.checkLoginStatus);
  const loadRecordsFromStorage = useRecordStore(state => state.loadRecordsFromStorage);
  const fetchRecords = useRecordStore(state => state.fetchRecords);

  useEffect(() => {
    let isMounted = true;

    const initializeApp = async () => {
      // 0. Google Sign-In 설정 (Android에서만)
      if (Platform.OS !== 'ios') {
        try {
          const { GoogleSignin } = await import('@react-native-google-signin/google-signin');
          GoogleSignin.configure({
            webClientId: SUPABASE_WEB_CLIENT_KEY,
            scopes: ['profile', 'email'],
          });
        } catch (error) {
        }
      }
      try {
        // 1. 온보딩 상태 확인
        if (isMounted) {
          try {
            await checkOnboardingStatus();
          } catch (error) {
          }
        }

        // 2. 로그인 상태 확인 (프로필도 함께 가져옴)
        if (isMounted) {
          try {
            await checkLoginStatus();
          } catch (error) {
             
          }
        }

        // 3. 로컬 스토리지에서 records 불러오기
        if (isMounted) {
          try {
            await loadRecordsFromStorage();
          } catch (error) {
             
          }
        }

        // 4. DB에서 records 가져오기 (로그인된 경우에만)
        if (isMounted) {
          try {
            const userId = useAuthStore.getState().userId;
            if (userId) {
              // 비동기로 실행하되 초기화를 막지 않음
              fetchRecords().catch(() => {});
            }
          } catch (error) {
          }
        }

        if (isMounted) {
          setIsInitialized(true);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        if (isMounted) {
          setInitializationError(err);
          setIsInitialized(true); // 에러가 있어도 초기화 완료로 표시하여 UI가 렌더링될 수 있도록
        }
      }
    };

    // 초기화를 다음 틱으로 지연시켜 네이티브 모듈이 준비될 시간을 제공
    const timeoutId = setTimeout(() => {
      initializeApp();
    }, 0);

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [checkOnboardingStatus, checkLoginStatus, loadRecordsFromStorage, fetchRecords]);


  return {
    isInitialized,
    isOnboardingCompleted,
    initializationError,
  };
};
