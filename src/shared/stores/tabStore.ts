import { create } from 'zustand';
import { TAB_NAME } from '@constants/TAB_NAV_OPTIONS';
// 탭 이름 타입 정의
export type TabName = typeof TAB_NAME[keyof typeof TAB_NAME];

// 탭 스토어 인터페이스
interface TabStore {
  // 현재 활성화된 탭
  activeTab: TabName;
  // 탭바 표시 여부
  isTabBarVisible: boolean;
  // 특정 화면으로 이동 의도 (예: 구독)
  pendingSubscriptionNav: boolean;
  // 탭 이동
  setActiveTab: (tab: TabName) => void;
  // 탭바 표시
  showTabBar: () => void;
  // 탭바 숨김
  hideTabBar: () => void;
  // 구독 화면 이동 플래그 설정/해제
  setPendingSubscriptionNav: (value: boolean) => void;
}

// Zustand 스토어 생성
export const useTabStore = create<TabStore>((set) => ({
  // 초기 상태
  activeTab: TAB_NAME.MAP,
  isTabBarVisible: false,
  pendingSubscriptionNav: false,

  // 탭 이동
  setActiveTab: (tab: TabName) => {
    set({ activeTab: tab });
  },

  // 탭바 표시
  showTabBar: () => {
    set({ isTabBarVisible: true });
  },

  // 탭바 숨김
  hideTabBar: () => {
    set({ isTabBarVisible: false });
  },

  setPendingSubscriptionNav: (value: boolean) => {
    set({ pendingSubscriptionNav: value });
  },

}));

// 편의성 훅들
export const useActiveTab = () => useTabStore(state => state.activeTab);
export const useSetActiveTab = () => useTabStore(state => state.setActiveTab);
export const useIsTabBarVisible = () => useTabStore(state => state.isTabBarVisible);
export const useShowTabBar = () => useTabStore(state => state.showTabBar);
export const useHideTabBar = () => useTabStore(state => state.hideTabBar);
export const usePendingSubscriptionNav = () => useTabStore(state => state.pendingSubscriptionNav);
export const useSetPendingSubscriptionNav = () => useTabStore(state => state.setPendingSubscriptionNav);