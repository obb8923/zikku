import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Image } from 'react-native';
import { usePermissionStore } from '@stores/permissionStore';
import MapView, { Region, Polyline, Marker } from 'react-native-maps';
import { useLocationStore } from '@stores/locationStore';
import { useTraceStore } from '@stores/traceStore';
import { useRecordStore, Record } from '@stores/recordStore';
import { MapDebugControls } from '../components/MapDebugControls';
import { MapControls } from '../components/MapControls';
import { RecordDetailModal } from '@components/index';
import { POLYLINE_STROKE_CONFIG, INITIAL_MAP_REGION, ZOOM_LEVEL, MARKER_SIZE_CONFIG } from '@/features/Map/constants/MAP';
import { getPolylineStrokeWidth } from '../utils/polylineUtils';
import { CHIP_TYPE } from '@constants/CHIP';
import { GradientMask } from '../components/GradientMask';
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

// 카테고리별 마커 이미지 매핑
const getMarkerImage = (category: string | null | undefined) => {
  switch (category) {
    case CHIP_TYPE.LANDSCAPE:
      return require('../../../../assets/pngs/blue.png');
    case CHIP_TYPE.PLACE:
      return require('../../../../assets/pngs/purple.png');
    case CHIP_TYPE.LIFE:
      return require('../../../../assets/pngs/red.png');
    case CHIP_TYPE.DISCOVERY:
      return require('../../../../assets/pngs/orange.png');
    case CHIP_TYPE.TOGETHER:
      return require('../../../../assets/pngs/green.png');
    default:
      return require('../../../../assets/pngs/blue.png'); // 기본값
  }
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
  const [currentRegion, setCurrentRegion] = useState<Region | null>(INITIAL_MAP_REGION);
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


  return (
    <View className="flex-1">
      <GradientMask />
     <MapView
        style={{ flex: 1 }}
        mapType="mutedStandard"      // "standard" | "satellite" | "hybrid" | "mutedStandard"
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

      {/* 지도 컨트롤용 리퀴드글래스 버튼들 */}
      <MapControls
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onMoveToMyLocation={handleMoveToMyLocationWithFixedZoom}
      />
      {/* 개발 모드: 디버그 컨트롤 */}
      <MapDebugControls />
     
      {/* 기록 상세정보 모달 */}
      <RecordDetailModal
        visible={isDetailModalVisible}
        record={selectedRecord}
        onClose={() => {
          setIsDetailModalVisible(false);
          setSelectedRecord(null);
        }}
      />
     
    </View>
  );
};