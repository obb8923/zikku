import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, TouchableOpacity, Text } from 'react-native';
import { useLocationStore } from '@stores/locationStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/**
 * 개발 모드용 지도 디버그 컨트롤
 * - 자동 이동 토글 버튼 (상단 중앙)
 * - 상하좌우 수동 이동 버튼 (오른쪽 하단)
 */
export const MapDebugControls: React.FC = () => {
  const latitude = useLocationStore(state => state.latitude);
  const longitude = useLocationStore(state => state.longitude);
  const setLocation = useLocationStore(state => state.setLocation);
  const [isMoving, setIsMoving] = useState(false);
  const moveIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const insets = useSafeAreaInsets();

  // 자동 이동 토글 (2초에 2m씩 북쪽으로 이동)
  const handleToggleMove = useCallback(() => {
    if (!latitude || !longitude) return;

    if (isMoving) {
      // 정지
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
        moveIntervalRef.current = null;
      }
      setIsMoving(false);
    } else {
      // 시작
      setIsMoving(true);
      moveIntervalRef.current = setInterval(() => {
        const currentLat = useLocationStore.getState().latitude;
        const currentLng = useLocationStore.getState().longitude;
        if (currentLat !== null && currentLng !== null) {
          // 2초에 2m씩 이동
          // 위도 1도 ≈ 111km, 따라서 1m ≈ 0.000009도
          // 북쪽으로 이동 (위도 증가)
          const metersPerMove = 2; // 2m
          const degreesPerMeter = 1 / 111000; // 위도 기준
          const latDelta = metersPerMove * degreesPerMeter;
          
          setLocation(currentLat + latDelta, currentLng);
        }
      }, 2000); // 2초마다 업데이트
    }
  }, [isMoving, latitude, longitude, setLocation]);

  // 상하좌우로 수동 이동
  const moveInDirection = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (!latitude || !longitude) return;

    const currentLat = useLocationStore.getState().latitude;
    const currentLng = useLocationStore.getState().longitude;
    
    if (currentLat === null || currentLng === null) return;

    const metersPerMove = 2000; // 2m씩 이동
    const latDegreesPerMeter = 1 / 111000; // 위도: 1도 ≈ 111km
    // 경도는 위도에 따라 달라짐 (한국 위도 약 37도 기준)
    const lngDegreesPerMeter = 1 / (111000 * Math.cos((currentLat * Math.PI) / 180));

    let latDelta = 0;
    let lngDelta = 0;

    switch (direction) {
      case 'up': // 북쪽 (위도 증가)
        latDelta = metersPerMove * latDegreesPerMeter;
        break;
      case 'down': // 남쪽 (위도 감소)
        latDelta = -metersPerMove * latDegreesPerMeter;
        break;
      case 'left': // 서쪽 (경도 감소)
        lngDelta = -metersPerMove * lngDegreesPerMeter;
        break;
      case 'right': // 동쪽 (경도 증가)
        lngDelta = metersPerMove * lngDegreesPerMeter;
        break;
    }

    setLocation(currentLat + latDelta, currentLng + lngDelta);
  }, [latitude, longitude, setLocation]);

  // 컴포넌트 언마운트 시 interval 정리
  useEffect(() => {
    return () => {
      if (moveIntervalRef.current) {
        clearInterval(moveIntervalRef.current);
      }
    };
  }, []);

  if (!__DEV__) {
    return null;
  }

  return (
    <>
      {/* 자동 이동 토글 버튼 (상단 중앙) */}
      <View className="absolute left-0 right-0 items-center" style={{top: insets.top + 16}}>
        <TouchableOpacity
          onPress={handleToggleMove}
          className="px-4 py-2 rounded-full bg-red-500 shadow-lg"
        >
          <Text className="text-white font-semibold">
            {isMoving ? '정지' : '위치 이동 (2초/2m)'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 상하좌우 이동 버튼 */}
      <View className="absolute items-center justify-center" style={{bottom: 100, right: 16}}>
        <View className="items-center">
          {/* 위 버튼 */}
          <TouchableOpacity
            onPress={() => moveInDirection('up')}
            className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center mb-2 shadow-lg"
          >
            <Text className="text-white font-bold text-lg">↑</Text>
          </TouchableOpacity>
          
          {/* 좌우 버튼 */}
          <View className="flex-row gap-2">
            <TouchableOpacity
              onPress={() => moveInDirection('left')}
              className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center shadow-lg"
            >
              <Text className="text-white font-bold text-lg">←</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              onPress={() => moveInDirection('right')}
              className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center shadow-lg"
            >
              <Text className="text-white font-bold text-lg">→</Text>
            </TouchableOpacity>
          </View>
          
          {/* 아래 버튼 */}
          <TouchableOpacity
            onPress={() => moveInDirection('down')}
            className="w-12 h-12 rounded-full bg-blue-500 items-center justify-center mt-2 shadow-lg"
          >
            <Text className="text-white font-bold text-lg">↓</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );
};

