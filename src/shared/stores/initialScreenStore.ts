import { create } from 'zustand';

// 초기 화면 스토어 인터페이스
interface InitialScreenStore {
  // 초기 화면 시작 여부 (앱 종료 전까지 유지)
  hasStarted: boolean;
  // 초기 화면 시작 상태 설정
  setHasStarted: (value: boolean) => void;
}

// Zustand 스토어 생성
export const useInitialScreenStore = create<InitialScreenStore>((set) => ({
  // 초기 상태
  hasStarted: false,

  // 초기 화면 시작 상태 설정
  setHasStarted: (value: boolean) => {
    set({ hasStarted: value });
  },
}));

// 편의성 훅들
export const useHasStarted = () => useInitialScreenStore(state => state.hasStarted);
export const useSetHasStarted = () => useInitialScreenStore(state => state.setHasStarted);

