import { useCallback, useEffect, useRef } from 'react';
import { View } from 'react-native';
import { useSharedValue, type SharedValue } from 'react-native-reanimated';

interface UseCanvasOffsetProps {
  scale?: SharedValue<number>;
  translateX?: SharedValue<number>;
  translateY?: SharedValue<number>;
}

export function useCanvasOffset(props?: UseCanvasOffsetProps) {
  const canvasOffsetX = useSharedValue(0);
  const canvasOffsetY = useSharedValue(0);
  const canvasContainerRef = useRef<View>(null);
  const scale = props?.scale;
  const translateX = props?.translateX;
  const translateY = props?.translateY;

  const updateCanvasOffset = useCallback(() => {
    requestAnimationFrame(() => {
      canvasContainerRef.current?.measure((_, __, ___, ____, pageX, pageY) => {
        canvasOffsetX.value = pageX;
        canvasOffsetY.value = pageY;
      });
    });
  }, [canvasOffsetX, canvasOffsetY]);

  useEffect(() => {
    updateCanvasOffset();
  }, [updateCanvasOffset]);

  const convertToLocal = useCallback(
    (absoluteX: number, absoluteY: number) => {
      'worklet';
      // 화면 좌표를 캔버스 컨테이너 좌표로 변환
      const containerX = absoluteX - canvasOffsetX.value;
      const containerY = absoluteY - canvasOffsetY.value;
      
      // 확대/축소와 이동을 고려하여 실제 그래프 좌표로 변환
      if (scale && translateX && translateY) {
        const graphX = (containerX - translateX.value) / scale.value;
        const graphY = (containerY - translateY.value) / scale.value;
        return { x: graphX, y: graphY };
      }
      
      return {
        x: containerX,
        y: containerY,
      };
    },
    [canvasOffsetX, canvasOffsetY, scale, translateX, translateY],
  );

  return {
    canvasContainerRef,
    canvasOffsetX,
    canvasOffsetY,
    updateCanvasOffset,
    convertToLocal,
  };
}


