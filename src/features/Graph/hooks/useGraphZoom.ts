import { useCallback } from 'react';
import { useSharedValue, withSpring } from 'react-native-reanimated';

const MIN_SCALE = 0.5;
const MAX_SCALE = 3.0;
const INITIAL_SCALE = 1.0;

export function useGraphZoom() {
  const scale = useSharedValue(INITIAL_SCALE);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  const setScale = useCallback((newScale: number) => {
    'worklet';
    scale.value = Math.max(MIN_SCALE, Math.min(MAX_SCALE, newScale));
  }, []);

  const setTranslate = useCallback((x: number, y: number) => {
    'worklet';
    translateX.value = x;
    translateY.value = y;
  }, []);

  const resetZoom = useCallback(() => {
    'worklet';
    scale.value = withSpring(INITIAL_SCALE);
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  }, []);

  return {
    scale,
    translateX,
    translateY,
    focalX,
    focalY,
    setScale,
    setTranslate,
    resetZoom,
    MIN_SCALE,
    MAX_SCALE,
  };
}

