import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View } from 'react-native';
import { usePermissionStore } from '@stores/permissionStore';
import MapView, { Region, Polyline, Marker } from 'react-native-maps';
import { useLocationStore } from '@stores/locationStore';
import { useTraceStore } from '@stores/traceStore';
import { useRecordStore, Record } from '@stores/recordStore';
import { MapDebugControls } from '../componentes/MapDebugControls';
import { MapControls } from '../components/MapControls';
import { RecordDetailModal } from '@components/index';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { POLYLINE_STROKE_CONFIG, INITIAL_MAP_REGION, ZOOM_LEVEL } from '@/features/Map/constants/MAP';
import { getPolylineStrokeWidth } from '../utils/polylineUtils';
import MarkerPinIcon from '@assets/svgs/MarkerPin.svg';



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
  const [currentRegion, setCurrentRegion] = useState<Region | null>(INITIAL_MAP_REGION);
  const [zoomLevel, setZoomLevel] = useState<number>(13);
  const latitude = useLocationStore(state => state.latitude);
  const longitude = useLocationStore(state => state.longitude);
  const fetchLocation = useLocationStore(state => state.fetchLocation);
  const insets = useSafeAreaInsets();
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
        {records.map((record) => (
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
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <MarkerPinIcon width={32} height={32} color="#000" />
            </View>
          </Marker>
        ))}
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