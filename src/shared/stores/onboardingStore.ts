import { create } from 'zustand';
import { AsyncStorageService } from '@services/asyncStorageService';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';

interface OnboardingStore {
  isOnboardingCompleted: boolean;
  isLoading: boolean;
  checkOnboardingStatus: () => Promise<void>;
  completeOnboarding: () => Promise<void>;
}

export const useOnboardingStore = create<OnboardingStore>((set) => ({
  isOnboardingCompleted: false,
  isLoading: true,

  checkOnboardingStatus: async () => {
    try {
      const completed = await AsyncStorageService.getItem(
        STORAGE_KEYS.ONBOARDING_COMPLETED,
      );
      set({
        isOnboardingCompleted: completed === 'true',
        isLoading: false,
      });
    } catch (error) {
      console.error('온보딩 상태 확인 중 오류 발생:', error);
      set({
        isOnboardingCompleted: false,
        isLoading: false,
      });
    }
  },

  completeOnboarding: async () => {
    try {
      await AsyncStorageService.setItem(
        STORAGE_KEYS.ONBOARDING_COMPLETED,
        'true',
      );
      set({ isOnboardingCompleted: true });
    } catch (error) {
      console.error('온보딩 완료 처리 중 오류 발생:', error);
    }
  },
}));

