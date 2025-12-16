import { create } from 'zustand';
import { useEffect } from 'react';
import { useOnboardingStore } from './onboardingStore';

interface InitStore {
  isInitialized: boolean;
  initialize: () => Promise<void>;
}

export const useInitStore = create<InitStore>((set, get) => ({
  isInitialized: false,

  initialize: async () => {
    if (get().isInitialized) {
      return;
    }

    try {
      // 온보딩 상태 확인
      const { checkOnboardingStatus } = useOnboardingStore.getState();
      await checkOnboardingStatus();


      set({ isInitialized: true });
    } catch (error) {
      console.error('앱 초기화 중 오류 발생:', error);
    }
  },
}));

// 자동 초기화를 위한 커스텀 훅
export const useInitStoreEffect = () => {
  const initialize = useInitStore((state) => state.initialize);

  useEffect(() => {
    initialize();
  }, []);
};

