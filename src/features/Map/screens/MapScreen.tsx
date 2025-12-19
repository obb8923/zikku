import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, useWindowDimensions } from 'react-native';
import { usePermissionStore } from '@stores/permissionStore';
import MapView, { Region } from 'react-native-maps';
import { useLocationStore } from '@stores/locationStore';
import { MapFAB } from '../componentes/MapFAB';

const INITIAL_REGION: Region = {
  latitude: 37.5665,
  longitude: 126.9780,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
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
  const latitude = useLocationStore(state => state.latitude);
  const longitude = useLocationStore(state => state.longitude);
  const fetchLocation = useLocationStore(state => state.fetchLocation);

  // 화면 진입 시 위치 권한 요청 및 현재 위치 가져오기
  useEffect(() => {
    const initializeLocation = async () => {
      await requestLocationPermission();
      fetchLocation();
    };
    void initializeLocation();
  }, [requestLocationPermission, fetchLocation]);

  // 초기 region 설정 (currentRegion이 없을 때만)
  useEffect(() => {
    if (!currentRegion && latitude && longitude) {
      const { latitudeDelta, longitudeDelta } = zoomToDelta(13);
      setCurrentRegion({
        latitude,
        longitude,
        latitudeDelta,
        longitudeDelta,
      });
    }
  }, [latitude, longitude, currentRegion]);
  // location이 변경될 때 지도 카메라 이동
  useEffect(() => {
    if (latitude && longitude && mapRef.current) {
      const { latitudeDelta, longitudeDelta } = zoomToDelta(13);
      mapRef.current.animateToRegion({
        latitude,
        longitude,
        latitudeDelta,
        longitudeDelta,
      });
    }
  }, [latitude, longitude]);
  // 지도 region 변경 핸들러
  const handleRegionChangeComplete = useCallback((region: Region) => {
    setCurrentRegion(region);
  }, []);

  return (
    <View className="flex-1">
     <MapView
        style={{ flex: 1 }}
        ref={mapRef}
        showsUserLocation={locationPermission}
        initialRegion={(() => {
          const { latitudeDelta, longitudeDelta } = zoomToDelta(13);
          return {
            latitude: latitude || 37.5666102,
            longitude: longitude || -129.9783881,
            latitudeDelta,
            longitudeDelta,
          };
        })()}
        onRegionChangeComplete={handleRegionChangeComplete}
      >
      </MapView>
      {/* FAB 버튼 */}
      <MapFAB />

    </View>
  );
};