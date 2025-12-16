import { useCallback } from 'react';
import ReactNativeHapticFeedback from 'react-native-haptic-feedback';

// 햅틱 옵션 설정
const hapticOptions = {
  enableVibrateFallback: true, // ios에서 햅틱이 지원되지 않을 때 진동으로 대체
  ignoreAndroidSystemSettings: true, // Android에서 햅틱이 지원되지 않을 때 진동으로 대체
};

// 햅틱 피드백을 사용하는 공유 훅 - 다양한 햅틱 피드백 타입을 편리하게 사용할 수 있도록 제공
export const useHaptic = () => {
  // 가벼운 햅틱 피드백 - Dot 탭, 버튼 클릭, 가벼운 상호작용
  const light = useCallback(() => {
    ReactNativeHapticFeedback.trigger('impactLight', hapticOptions);
  }, []);

  // 중간 햅틱 피드백 - 중요한 액션, 메뉴 선택, 중간 정도의 피드백이 필요한 상황
  const medium = useCallback(() => {
    ReactNativeHapticFeedback.trigger('impactMedium', hapticOptions);
  }, []);

  // 강한 햅틱 피드백 - 중요한 알림, 강한 피드백이 필요한 상황
  const heavy = useCallback(() => {
    ReactNativeHapticFeedback.trigger('impactHeavy', hapticOptions);
  }, []);

  // 딱딱한 햅틱 피드백 - 강한 충격감이 필요한 상황, 에러나 경고 상황
  const rigid = useCallback(() => {
    ReactNativeHapticFeedback.trigger('rigid', hapticOptions);
  }, []);

  // 부드러운 햅틱 피드백 - 부드러운 피드백이 필요한 상황, 성공적인 액션
  const soft = useCallback(() => {
    ReactNativeHapticFeedback.trigger('soft', hapticOptions);
  }, []);

  // 성공 햅틱 피드백 - 메모 저장, 작업 완료, 성공적인 액션
  const success = useCallback(() => {
    ReactNativeHapticFeedback.trigger('notificationSuccess', hapticOptions);
  }, []);

  // 경고 햅틱 피드백 - 경고 상황, 주의가 필요한 상황
  const warning = useCallback(() => {
    ReactNativeHapticFeedback.trigger('notificationWarning', hapticOptions);
  }, []);

  // 에러 햅틱 피드백 - 에러 상황, 실패한 액션
  const error = useCallback(() => {
    ReactNativeHapticFeedback.trigger('notificationError', hapticOptions);
  }, []);

  return {
    light,
    medium,
    heavy,
    rigid,
    soft,
    success,
    warning,
    error,
  };
};
