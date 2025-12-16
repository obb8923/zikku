import { useState, useEffect } from 'react';
import { useOnboardingStore } from './onboardingStore';
/**
 * 앱 초기화 로직을 관리하는 훅
 * - 언어 설정 로드
 * - 온보딩 상태 확인
 * 
 * 참고: 각 화면에서 필요할 때 추가 초기화 수행
 */
export const useAppInitialization = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [initializationError, setInitializationError] = useState<Error | null>(null);

  const { checkOnboardingStatus, isOnboardingCompleted } = useOnboardingStore();

  useEffect(() => {
    let isMounted = true;

    const initializeApp = async () => {
      try {
        // 1. 온보딩 상태 확인
        if (isMounted) {
          try {
            await checkOnboardingStatus();
            if (__DEV__) console.log('[useAppInitialization] Onboarding status checked');
          } catch (error) {
            if (__DEV__) console.error('[useAppInitialization] Error checking onboarding:', error);
            // 온보딩 상태 확인 실패는 치명적이지 않으므로 계속 진행
          }
        }

        if (isMounted) {
          setIsInitialized(true);
        }
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        if (__DEV__) console.error('[useAppInitialization] Initialization error:', err);
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
  }, [checkOnboardingStatus]);

  return {
    isInitialized,
    isOnboardingCompleted,
    initializationError,
  };
};
