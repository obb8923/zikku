import { create } from 'zustand';
import { AsyncStorageService } from '@services/asyncStorageService';
import { STORAGE_KEYS } from '@constants/STORAGE_KEYS';
import { SubscriptionInfo } from '@shared-types/subscriptionType';
import { getAvailablePurchasesAndVerify } from '@services/iapService';

interface SubscriptionStore {
  subscriptionInfo: SubscriptionInfo;
  isLoading: boolean;
  loadSubscriptionStatus: () => Promise<void>;
  updateSubscriptionInfo: (info: SubscriptionInfo) => Promise<void>;
  refreshSubscriptionStatus: () => Promise<void>;
}

const defaultSubscriptionInfo: SubscriptionInfo = {
  isSubscribed: false,
  subscriptionExpiryDate: null,
  autoRenewStatus: false,
  productId: null,
  status: 'none',
};

export const useSubscriptionStore = create<SubscriptionStore>((set, get) => ({
  subscriptionInfo: defaultSubscriptionInfo,
  isLoading: false,

  /**
   * AsyncStorage에서 구독 상태 로드 (캐시)
   * 
   * 중요: AsyncStorage는 캐시로만 사용합니다.
   * 실제 구독 상태는 스토어에서 직접 받은 구매 정보를 기반으로 확인합니다.
   * 이 함수는 앱 시작 시 빠른 로딩을 위해 캐시된 정보를 불러옵니다.
   */
  loadSubscriptionStatus: async () => {
    try {
      set({ isLoading: true });
      // 캐시에서 구독 상태 로드
      const cachedInfo = await AsyncStorageService.getJSONItem<SubscriptionInfo>(
        STORAGE_KEYS.SUBSCRIPTION_STATUS,
      );

      if (cachedInfo) {
        // 캐시된 정보가 있으면 임시로 사용 (빠른 UI 표시)
        set({ subscriptionInfo: cachedInfo });
      } else {
        // 캐시가 없으면 기본값 사용
        set({ subscriptionInfo: defaultSubscriptionInfo });
      }
      
      // 실제 구독 상태는 refreshSubscriptionStatus()에서 서버 검증을 통해 확인됨
    } catch (error) {
      console.error('구독 상태 캐시 로드 실패:', error);
      set({ subscriptionInfo: defaultSubscriptionInfo });
    } finally {
      set({ isLoading: false });
    }
  },

  /**
   * 구독 정보 업데이트 및 AsyncStorage에 캐싱
   * 
   * 중요: AsyncStorage는 캐시로만 사용합니다.
   * 실제 구독 상태는 스토어에서 직접 받은 구매 정보를 기반으로 확인합니다.
   * 이 함수는 스토어에서 받은 구매 정보를 기반으로 확인한 구독 정보를 캐시에 저장합니다.
   */
  updateSubscriptionInfo: async (info: SubscriptionInfo) => {
    try {
      set({ subscriptionInfo: info });
      // 서버에서 검증된 구독 정보를 캐시에 저장 (앱 재시작 시 빠른 로딩)
      await AsyncStorageService.setJSONItem<SubscriptionInfo>(
        STORAGE_KEYS.SUBSCRIPTION_STATUS,
        info,
      );
    } catch (error) {
      console.error('구독 정보 캐시 업데이트 실패:', error);
    }
  },

  /**
   * 영수증 재검증 및 상태 갱신
   */
  refreshSubscriptionStatus: async () => {
    try {
      set({ isLoading: true });
      // getAvailablePurchases 호출 및 재검증
      // Nitro Modules 에러가 발생해도 앱이 계속 실행되도록 처리
      await getAvailablePurchasesAndVerify();
      // 상태는 getAvailablePurchasesAndVerify 내부에서 자동으로 업데이트됨
    } catch (error) {
      // 에러는 getAvailablePurchasesAndVerify 내부에서 처리되므로 조용히 실패 처리
      if (__DEV__) {
        console.warn('구독 상태 재검증 실패:', error);
      }
    } finally {
      set({ isLoading: false });
    }
  },
}));

