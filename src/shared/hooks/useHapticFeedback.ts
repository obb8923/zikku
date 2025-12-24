import { useCallback } from 'react';
import { NativeModules, Platform } from 'react-native';

const { HapticFeedbackModule } = NativeModules;

type ImpactStyle = 'light' | 'medium' | 'heavy' | 'soft' | 'rigid';
type NotificationType = 'success' | 'warning' | 'error';

interface HapticFeedbackModuleType {
  impact: (style: string) => void;
  notification: (type: string) => void;
  selection: () => void;
}

const isIOS = Platform.OS === 'ios';
const hapticModule = HapticFeedbackModule as HapticFeedbackModuleType | undefined;

/**
 * iOS 햅틱 피드백을 쉽게 사용할 수 있는 훅
 * 
 * @example
 * const haptic = useHapticFeedback();
 * haptic.impact('medium');
 * haptic.notification('success');
 * haptic.selection();
 */
export const useHapticFeedback = () => {
  const impact = useCallback(
    (style: ImpactStyle = 'medium') => {
      if (!isIOS || !hapticModule) {
        return;
      }
      hapticModule.impact(style);
    },
    []
  );

  const notification = useCallback(
    (type: NotificationType = 'success') => {
      if (!isIOS || !hapticModule) {
        return;
      }
      hapticModule.notification(type);
    },
    []
  );

  const selection = useCallback(() => {
    if (!isIOS || !hapticModule) {
      return;
    }
    hapticModule.selection();
  }, []);

  return {
    impact,
    notification,
    selection,
  };
};

