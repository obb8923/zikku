import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { usePermissionStore } from '@stores/permissionStore';
import MapView, { Region, Polyline } from 'react-native-maps';
import { useLocationStore } from '@stores/locationStore';
import { useTraceStore } from '@stores/traceStore';
import { LiquidGlassButton } from '@components/LiquidGlassButton';
import { MapDebugControls } from '../componentes/MapDebugControls';
import PlusSmall from '@assets/svgs/PlusSmall.svg';
import MinusSmall from '@assets/svgs/MinusSmall.svg';
import LocationUser from '@assets/svgs/LocationUser.svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { POLYLINE_STROKE_CONFIG, INITIAL_MAP_REGION, ZOOM_LEVEL } from '@/features/Map/constants/MAP';
import { getPolylineStrokeWidth } from '../utils/polylineUtils';

const INITIAL_REGION: Region = {
  latitude: INITIAL_MAP_REGION.latitude,
  longitude: INITIAL_MAP_REGION.longitude,
  latitudeDelta: INITIAL_MAP_REGION.latitudeDelta,
  longitudeDelta: INITIAL_MAP_REGION.longitudeDelta,
};

// zoom 레벨을 delta로 변환하는 유틸리티 함수
const zoomToDelta = (zoom: number): { latitudeDelta: number; longitudeDelta: number } => {
  const latitudeDelta = 360 / Math.pow(2, zoom);
  const longitudeDelta = latitudeDelta; 
  return { latitudeDelta, longitudeDelta };
};

export const MapScreen = () => {
  const requestLocationPermission = usePermissionStore((s) => s.requestLocationPermission);
  const locationPermission = usePermissionStore((s) => s.locationPermission);
  const mapRef = useRef<MapView>(null);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(INITIAL_REGION);
  const [zoomLevel, setZoomLevel] = useState<number>(13);
  const latitude = useLocationStore(state => state.latitude);
  const longitude = useLocationStore(state => state.longitude);
  const fetchLocation = useLocationStore(state => state.fetchLocation);
  const insets = useSafeAreaInsets();
  // Trace store
  const traces = useTraceStore(state => state.traces);
  const startTracking = useTraceStore(state => state.startTracking);
  const stopTracking = useTraceStore(state => state.stopTracking);

  // 화면 진입 시 위치 권한 요청 및 현재 위치 가져오기
  useEffect(() => {
    const initializeLocation = async () => {
      await requestLocationPermission();
      fetchLocation();
    };
    void initializeLocation();
  }, [requestLocationPermission, fetchLocation]);

  // 추적 시작/중지
  useEffect(() => {
    // 컴포넌트 마운트 시 추적 시작
    startTracking();

    // 언마운트 시 추적 중지
    return () => {
      stopTracking();
    };
  }, [startTracking, stopTracking]);

  // 초기 region 설정 (currentRegion이 없을 때만)
  useEffect(() => {
    if (!currentRegion && latitude && longitude) {
      const { latitudeDelta, longitudeDelta } = zoomToDelta(zoomLevel);
      setCurrentRegion({
        latitude,
        longitude,
        latitudeDelta,
        longitudeDelta,
      });
    }
  }, [latitude, longitude, currentRegion, zoomLevel]);
  // 위도/경도 변경 시 로깅
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      // console.log(`[MapScreen] 현재 위치 - 위도: ${latitude}, 경도: ${longitude}`);
    }
  }, [latitude, longitude]);

  // 지도 region 변경 핸들러
  const handleRegionChangeComplete = useCallback((region: Region) => {
    setCurrentRegion(region);
  }, []);

  const MIN_ZOOM = ZOOM_LEVEL.MIN;
  const MAX_ZOOM = ZOOM_LEVEL.MAX;

  const getMapCenter = useCallback(() => {
    if (currentRegion) {
      return {
        latitude: currentRegion.latitude,
        longitude: currentRegion.longitude,
      };
    }

    if (latitude && longitude) {
      return { latitude, longitude };
    }

    return {
      latitude: INITIAL_REGION.latitude,
      longitude: INITIAL_REGION.longitude,
    };
  }, [currentRegion, latitude, longitude]);

  const handleZoomChange = useCallback(
    (delta: number) => {
      setZoomLevel(prev => {
        const next = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, prev + delta));
        const center = getMapCenter();
        const { latitudeDelta, longitudeDelta } = zoomToDelta(next);

        if (mapRef.current) {
          mapRef.current.animateToRegion({
            latitude: center.latitude,
            longitude: center.longitude,
            latitudeDelta,
            longitudeDelta,
          });
        }

        return next;
      });
    },
    [getMapCenter],
  );

  const handleZoomIn = useCallback(() => {
    handleZoomChange(1);
  }, [handleZoomChange]);

  const handleZoomOut = useCallback(() => {
    handleZoomChange(-1);
  }, [handleZoomChange]);

  const handleMoveToMyLocationWithFixedZoom = useCallback(() => {
    if (!latitude || !longitude || !mapRef.current) {
      return;
    }

    // 현재 보고 있는 줌(또는 region)의 delta를 그대로 사용해서
    // 확대 레벨은 유지하고 중심만 내 위치로 이동
    const { latitudeDelta, longitudeDelta } =
      currentRegion ?? zoomToDelta(zoomLevel);

    mapRef.current.animateToRegion({
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta,
    });
  }, [latitude, longitude, currentRegion, zoomLevel]);


  return (
    <View className="flex-1">
     <MapView
        style={{ flex: 1 }}
        ref={mapRef}
        showsUserLocation={locationPermission}
        initialRegion={(() => {
          const { latitudeDelta, longitudeDelta } = zoomToDelta(ZOOM_LEVEL.DEFAULT);
          return {
            latitude: latitude || 37.5666102,
            longitude: longitude || -129.9783881,
            latitudeDelta,
            longitudeDelta,
          };
        })()}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {/* traces를 실제 지도 좌표에 고정된 Polyline으로 렌더링 */}
        {traces.length > 0 && (
          <Polyline
            coordinates={traces.map((t) => ({
              latitude: t.latitude,
              longitude: t.longitude,
            }))}
            strokeColor={POLYLINE_STROKE_CONFIG.COLOR}
            strokeWidth={getPolylineStrokeWidth(currentRegion)}
          />
        )}
      </MapView>

      {/* 지도 컨트롤용 리퀴드글래스 버튼들 */}
      <View className="absolute gap-2" style={{right: 16, top: insets.top + 16}}>
        <LiquidGlassButton onPress={handleZoomIn} borderRadius={8}>
          <PlusSmall width={24} height={24} color="black" />
        </LiquidGlassButton>

        <LiquidGlassButton onPress={handleZoomOut} borderRadius={8}>
          <MinusSmall width={24} height={24} color="black" />
        </LiquidGlassButton>

        <LiquidGlassButton onPress={handleMoveToMyLocationWithFixedZoom} borderRadius={8}>
          <LocationUser width={24} height={24} color="black" />
        </LiquidGlassButton>
      </View>

      {/* 개발 모드: 디버그 컨트롤 */}
      <MapDebugControls />

    </View>
  );
};