import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Image, Animated } from 'react-native';
import { usePermissionStore } from '@stores/permissionStore';
import MapView, { Region, Polyline, Marker } from 'react-native-maps';
import { useLocationStore } from '@stores/locationStore';
import { useTraceStore } from '@stores/traceStore';
import { useRecordStore, Record } from '@stores/recordStore';
import { useHasStarted, useSetHasStarted } from '@stores/initialScreenStore';
import { MapDebugControls } from '../components/MapDebugControls';
import { MapControls } from '../components/MapControls';
import { RecordModal, LiquidGlassTextButton } from '@components/index';
import { POLYLINE_STROKE_CONFIG, INITIAL_MAP_REGION, ZOOM_LEVEL, MARKER_SIZE_CONFIG, getMarkerImage } from '@/features/Map/constants/MAP';
import { getPolylineStrokeWidth } from '../utils/polylineUtils';
import { GradientMask } from '../components/GradientMask';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@components/index';
// zoom 레벨을 delta로 변환하는 유틸리티 함수
const zoomToDelta = (zoom: number): { latitudeDelta: number; longitudeDelta: number } => {
  const latitudeDelta = 360 / Math.pow(2, zoom);
  const longitudeDelta = latitudeDelta; 
  return { latitudeDelta, longitudeDelta };
};

// delta를 zoom 레벨로 변환하는 유틸리티 함수
const deltaToZoom = (latitudeDelta: number): number => {
  return Math.log2(360 / latitudeDelta);
};

// 줌 레벨에 따른 마커 크기 계산
// - 지도를 확대하면 (보이는 영역이 좁아짐, latitudeDelta가 작음) → 마커가 커짐 (MAX_SIZE)
// - 지도를 축소하면 (보이는 영역이 넓어짐, latitudeDelta가 큼) → 마커가 작아짐 (MIN_SIZE)
const getMarkerSize = (region: Region | null): number => {
  if (!region) {
    return MARKER_SIZE_CONFIG.DEFAULT_SIZE;
  }

  const latitudeDelta = region.latitudeDelta;
  
  // 범위 제한
  const clampedDelta = Math.max(
    MARKER_SIZE_CONFIG.MIN_DELTA,
    Math.min(MARKER_SIZE_CONFIG.MAX_DELTA, latitudeDelta)
  );
  
  // 선형 보간
  // latitudeDelta가 작을수록 (확대) ratio가 0에 가까워지고, size는 MAX_SIZE에 가까워짐
  // latitudeDelta가 클수록 (축소) ratio가 1에 가까워지고, size는 MIN_SIZE에 가까워짐
  const ratio =
    (clampedDelta - MARKER_SIZE_CONFIG.MIN_DELTA) /
    (MARKER_SIZE_CONFIG.MAX_DELTA - MARKER_SIZE_CONFIG.MIN_DELTA);
  const size =
    MARKER_SIZE_CONFIG.MAX_SIZE -
    (MARKER_SIZE_CONFIG.MAX_SIZE - MARKER_SIZE_CONFIG.MIN_SIZE) * ratio;
  
  return Math.round(size);
};

export const MapScreen = () => {
  const requestLocationPermission = usePermissionStore((s) => s.requestLocationPermission);
  const locationPermission = usePermissionStore((s) => s.locationPermission);
  const mapRef = useRef<MapView>(null);
  const [currentRegion, setCurrentRegion] = useState<Region | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(13);
  const latitude = useLocationStore(state => state.latitude);
  const longitude = useLocationStore(state => state.longitude);
  const fetchLocation = useLocationStore(state => state.fetchLocation);
  // Trace store
  const traces = useTraceStore(state => state.traces);
  const startTracking = useTraceStore(state => state.startTracking);
  const stopTracking = useTraceStore(state => state.stopTracking);
  // Record store (로컬 스토어에서만 읽기)
  const records = useRecordStore(state => state.records);
  // Record detail modal
  const [selectedRecord, setSelectedRecord] = useState<Record | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  // 초기 화면 상태 (전역 상태로 관리)
  const hasStarted = useHasStarted();
  const setHasStarted = useSetHasStarted();
  const insets = useSafeAreaInsets();
  
  // 애니메이션 값 (단일 progress로 fade-in/fade-out 동기화)
  // progress: 0 = 초기 화면 표시, 1 = 컨트롤 표시
  const animationProgress = useRef(new Animated.Value(0)).current;
  // 초기 위치로 설정했는지 추적하는 ref
  const hasMovedToInitialLocation = useRef(false);
  // 오버레이 표시 여부 (단일 boolean으로 상태 단순화)
  const [overlayVisible, setOverlayVisible] = useState(true);

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

  // hasStarted 변경 시 애니메이션 처리 (단일 progress로 동기화)
  useEffect(() => {
    if (hasStarted) {
      // progress를 0에서 1로 애니메이션 (초기 화면 fade out + 컨트롤 fade in 동시)
      Animated.timing(animationProgress, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }).start(() => {
        // 애니메이션 완료 후 오버레이 숨김
        setOverlayVisible(false);
      });
    } else {
      // 초기 상태로 리셋
      animationProgress.setValue(0);
      setOverlayVisible(true);
    }
  }, [hasStarted, animationProgress]);

  // 초기 region 설정 (위치 정보가 로드되면 내 위치로, 없으면 기본값으로)
  useEffect(() => {
    if (hasMovedToInitialLocation.current) {
      return; // 이미 내 위치로 설정했으면 더 이상 실행하지 않음
    }

    const { latitudeDelta, longitudeDelta } = zoomToDelta(ZOOM_LEVEL.DEFAULT);
    
    if (latitude && longitude) {
      // 내 현재 위치로 설정
      setCurrentRegion({
        latitude,
        longitude,
        latitudeDelta,
        longitudeDelta,
      });
      hasMovedToInitialLocation.current = true;
    } else if (!currentRegion) {
      // 위치 정보가 없고 아직 설정되지 않았으면 기본값(서울)으로 설정
      // (위치 정보가 로드되면 위의 조건에서 덮어씌워짐)
      setCurrentRegion({
        latitude: INITIAL_MAP_REGION.latitude,
        longitude: INITIAL_MAP_REGION.longitude,
        latitudeDelta,
        longitudeDelta,
      });
    }
  }, [latitude, longitude]);

  // 지도 region 변경 핸들러
  const handleRegionChangeComplete = useCallback((region: Region) => {
    setCurrentRegion(region);
    // zoom 레벨도 업데이트 (마커 크기 계산을 위해)
    const calculatedZoom = deltaToZoom(region.latitudeDelta);
    const clampedZoom = Math.min(ZOOM_LEVEL.MAX, Math.max(ZOOM_LEVEL.MIN, calculatedZoom));
    setZoomLevel(clampedZoom);
  }, []);

  

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
      latitude: INITIAL_MAP_REGION.latitude,
      longitude: INITIAL_MAP_REGION.longitude,
    };
  }, [currentRegion, latitude, longitude]);

  const handleZoomChange = useCallback(
    (delta: number) => {
      setZoomLevel(prev => {
        const next = Math.min(ZOOM_LEVEL.MAX, Math.max(ZOOM_LEVEL.MIN, prev + delta));
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

    const { latitudeDelta, longitudeDelta } =
      currentRegion ?? zoomToDelta(zoomLevel);

    mapRef.current.animateToRegion({
      latitude,
      longitude,
      latitudeDelta,
      longitudeDelta,
    });
  }, [latitude, longitude, currentRegion, zoomLevel]);

  const handleStart = useCallback(() => {
    setHasStarted(true);
  }, [setHasStarted]);

  return (
    <View className="flex-1">
      {/* 처음 화면 (애니메이션 완료 후 렌더링 취소) */}
      {overlayVisible && (
        <Animated.View 
          className="flex-1 absolute inset-0"
          style={{ 
            opacity: animationProgress.interpolate({
              inputRange: [0, 1],
              outputRange: [1, 0], // progress가 0→1일 때 opacity는 1→0
            }),
            zIndex: 1000,
            pointerEvents: 'auto',
          }}
        >
          <GradientMask />
          <View 
            style={{  
              flex: 1,
              justifyContent: 'space-between',
              paddingTop: insets.top + 16,
              paddingBottom: insets.bottom + 16,
              paddingHorizontal: 32, 
              zIndex: 200 }}
          >
            <View className="w-full">
            <Text type="title1" text="반가워요" className="text-text-component"/>
            <Text type="title0" text="SEOUL" className="text-text font-bold"/>

            </View>
            <LiquidGlassTextButton
              text="시작하기"
              onPress={handleStart}
              size="large"
              style={{ width: '100%' }}
              tintColor="white"
              textStyle={{ color: 'black' }}
            />
          </View>
        </Animated.View>
      )}
      {/* 컨트롤 */}
      <Animated.View 
        className="flex-1 absolute inset-0"
        style={{ 
          opacity: animationProgress, // progress가 0→1일 때 opacity도 0→1
          zIndex: 1001,
        }}
      >
            <MapControls
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onMoveToMyLocation={handleMoveToMyLocationWithFixedZoom}
            />
            <MapDebugControls />
      </Animated.View>

     <MapView
        style={{ flex: 1 }}
        mapType="mutedStandard"      // "standard" | "satellite" | "hybrid" | "mutedStandard"
        ref={mapRef}
        showsUserLocation={locationPermission}
        region={currentRegion || undefined}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
        {traces.length > 1 && traces.slice(1).map((trace, index) => {
          const prevTrace = traces[index];
          return (
            <Polyline
              key={`trace-${index}`}
              coordinates={[
                {
                  latitude: prevTrace.latitude,
                  longitude: prevTrace.longitude,
                },
                {
                  latitude: trace.latitude,
                  longitude: trace.longitude,
                },
              ]}
              strokeColor={POLYLINE_STROKE_CONFIG.COLOR}
              strokeWidth={getPolylineStrokeWidth(currentRegion)}
            />
          );
        })}
        
        {/* Records 마커 표시 */}
        {records.map((record) => {
          const markerSize = getMarkerSize(currentRegion);
          return (
            <Marker
              key={record.id}
              coordinate={{
                latitude: record.latitude,
                longitude: record.longitude,
              }}
              anchor={{ x: 0.5, y: 1 }}
              onPress={() => {
                setSelectedRecord(record);
                setIsDetailModalVisible(true);
              }}
            >
              <View 
                style={{ 
                  width: markerSize, 
                  height: markerSize,
                }}
              >
                <Image
                  source={getMarkerImage(record.category)}
                  style={{ width: markerSize, height: markerSize }}
                  resizeMode="contain"
                />
              </View>
            </Marker>
          );
        })}
      </MapView>

      
      
     
     
      {/* 기록 상세 / 보기용 모달 (RecordModal 공용 사용) */}
      <RecordModal
        visible={isDetailModalVisible}
        mode="detail"
        record={selectedRecord}
        onClose={() => {
          setIsDetailModalVisible(false);
          setSelectedRecord(null);
        }}
      />
     
    </View>
  );
};