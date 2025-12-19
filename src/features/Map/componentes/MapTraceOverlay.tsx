import React, { useMemo } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { Canvas, Path, Skia } from '@shopify/react-native-skia';
import { Region } from 'react-native-maps';
import { Trace } from '@stores/traceStore';
import { latLngArrayToScreen } from '@utils/coordinateTransform';

interface MapTraceOverlayProps {
  traces: Trace[];
  region: Region | null;
  strokeColor?: string;
  strokeWidth?: number;
}

export const MapTraceOverlay: React.FC<MapTraceOverlayProps> = ({
  traces,
  region,
  strokeColor = '#3B82F6', // 기본 파란색
  strokeWidth = 3,
}) => {
  const { width, height } = useWindowDimensions();

  // traces를 화면 좌표로 변환
  const path = useMemo(() => {
    if (!region || traces.length === 0) {
      return null;
    }

    const screenCoords = latLngArrayToScreen(
      traces.map(t => ({ latitude: t.latitude, longitude: t.longitude })),
      region,
      width,
      height,
    );

    if (screenCoords.length === 0) {
      return null;
    }

    // Skia Path 생성
    const skiaPath = Skia.Path.Make();
    
    // 첫 번째 점으로 이동
    const firstPoint = screenCoords[0];
    skiaPath.moveTo(firstPoint.x, firstPoint.y);

    // 나머지 점들을 선으로 연결
    for (let i = 1; i < screenCoords.length; i++) {
      const point = screenCoords[i];
      skiaPath.lineTo(point.x, point.y);
    }

    return skiaPath;
  }, [traces, region, width, height]);

  if (!path || traces.length === 0) {
    return null;
  }

  return (
    <View
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        pointerEvents: 'none', // 터치 이벤트를 MapView로 전달
      }}
    >
      <Canvas style={{ flex: 1 }}>
        <Path
          path={path}
          color={strokeColor}
          style="stroke"
          strokeWidth={strokeWidth}
          strokeCap="round"
          strokeJoin="round"
        />
      </Canvas>
    </View>
  );
};

