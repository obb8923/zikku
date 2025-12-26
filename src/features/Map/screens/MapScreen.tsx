import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Image, Animated, Pressable } from 'react-native';
import { usePermissionStore } from '@stores/permissionStore';
import MapView, { Region, Polyline, Marker } from 'react-native-maps';
import { useLocationStore } from '@stores/locationStore';
import { useTraceStore } from '@stores/traceStore';
import { useRecordStore, Record } from '@stores/recordStore';
import { useHasStarted, useSetHasStarted } from '@stores/initialScreenStore';
import { MapDebugControls } from '../components/MapDebugControls';
import { MapControls } from '../components/MapControls';
import { MapInitialOverlay } from '../components/MapInitialOverlay';
import { RecordModal } from '@components/index';
import { POLYLINE_STROKE_CONFIG, INITIAL_MAP_REGION, ZOOM_LEVEL, getMarkerImage } from '@/features/Map/constants/MAP';
import { getPolylineStrokeWidth } from '../utils/polylineUtils';
import { zoomToDelta, deltaToZoom, getMarkerSize } from '../utils/mapUtils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LiquidGlassButton } from '@components/LiquidGlassButton';
import ChevronLeft from '@assets/svgs/ChevronLeft.svg';
import { ArchiveScreen } from '@features/Archive/screens/ArchiveScreen';
import { MoreScreen } from '@features/More/screens/MoreScreen';

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
  // 시작하기 버튼을 눌렀을 때 줌 레벨 조정을 했는지 추적하는 ref
  const hasZoomedOnStart = useRef(false);
  // 오버레이 표시 여부 (단일 boolean으로 상태 단순화)
  const [overlayVisible, setOverlayVisible] = useState(true);
  // 모달 상태 관리
  const [modalType, setModalType] = useState<'archive' | 'more' | null>(null);
  const modalSlideAnim = useRef(new Animated.Value(0)).current;

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

  // hasStarted 변경 시 애니메이션 처리 및 줌 레벨 조정
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

      // 줌 레벨을 확대 (STARTED 줌 레벨로, 한 번만 실행)
      if (!hasZoomedOnStart.current && currentRegion && mapRef.current) {
        hasZoomedOnStart.current = true;
        const { latitudeDelta, longitudeDelta } = zoomToDelta(ZOOM_LEVEL.STARTED);
        mapRef.current.animateToRegion({
          latitude: currentRegion.latitude,
          longitude: currentRegion.longitude,
          latitudeDelta,
          longitudeDelta,
        });
        // currentRegion과 zoomLevel도 업데이트
        setCurrentRegion({
          latitude: currentRegion.latitude,
          longitude: currentRegion.longitude,
          latitudeDelta,
          longitudeDelta,
        });
        setZoomLevel(ZOOM_LEVEL.STARTED);
      }
    } else {
      // hasStarted가 false로 변경되었을 때 (애니메이션 완료 후)
      // 이미 handleBackToInitial에서 처리되므로 여기서는 추가 작업 불필요
    }
  }, [hasStarted, animationProgress]);

  // 초기 region 설정 (위치 정보가 로드되면 내 위치로, 없으면 기본값으로)
  useEffect(() => {
    if (hasMovedToInitialLocation.current) {
      return; // 이미 내 위치로 설정했으면 더 이상 실행하지 않음
    }

    // 처음 화면일 때는 작은 줌 레벨 사용
    const { latitudeDelta, longitudeDelta } = zoomToDelta(ZOOM_LEVEL.INITIAL);
    
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

  const handleArchivePress = useCallback(() => {
    setModalType('archive');
    Animated.spring(modalSlideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [modalSlideAnim]);

  const handleMorePress = useCallback(() => {
    setModalType('more');
    Animated.spring(modalSlideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [modalSlideAnim]);

  const handleCloseModal = useCallback(() => {
    Animated.timing(modalSlideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      setModalType(null);
    });
  }, [modalSlideAnim]);

  const handleBackToInitial = useCallback(() => {
    // 오버레이를 먼저 표시 (애니메이션을 위해)
    setOverlayVisible(true);
    
    // 줌 레벨을 INITIAL로 리셋 (애니메이션과 동시에 시작)
    if (currentRegion && mapRef.current) {
      const { latitudeDelta, longitudeDelta } = zoomToDelta(ZOOM_LEVEL.INITIAL);
      mapRef.current.animateToRegion({
        latitude: currentRegion.latitude,
        longitude: currentRegion.longitude,
        latitudeDelta,
        longitudeDelta,
      });
      setCurrentRegion({
        latitude: currentRegion.latitude,
        longitude: currentRegion.longitude,
        latitudeDelta,
        longitudeDelta,
      });
      setZoomLevel(ZOOM_LEVEL.INITIAL);
    }
    
    // progress를 1에서 0으로 애니메이션 (컨트롤 fade out + 초기 화면 fade in 동시)
    Animated.timing(animationProgress, {
      toValue: 0,
      duration: 350,
      useNativeDriver: true,
    }).start(() => {
      // 애니메이션 완료 후 상태 리셋
      setHasStarted(false);
      hasZoomedOnStart.current = false;
    });
  }, [currentRegion, animationProgress]);

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
          <MapInitialOverlay 
            onStart={handleStart}
            onArchivePress={handleArchivePress}
            onMorePress={handleMorePress}
          />
        </Animated.View>
      )}
      {/* 컨트롤 */}
      <Animated.View 
        className="flex-1 absolute inset-0"
        style={{ 
          opacity: animationProgress, // progress가 0→1일 때 opacity도 0→1
          zIndex: 1001,
          pointerEvents: 'box-none', // 컨트롤 영역이 아닌 부분은 터치 통과
        }}
      >
            {/* 뒤로가기 버튼 (왼쪽 위) */}
            {hasStarted && (
              <View 
                className="absolute"
                style={{ 
                  left: 16, 
                  top: insets.top + 16,
                  zIndex: 1002,
                }}
              >
                <LiquidGlassButton onPress={handleBackToInitial} borderRadius={8}>
                  <ChevronLeft width={24} height={24} color="black" />
                </LiquidGlassButton>
              </View>
            )}
            <MapControls
              onZoomIn={handleZoomIn}
              onZoomOut={handleZoomOut}
              onMoveToMyLocation={handleMoveToMyLocationWithFixedZoom}
            />
            {/* <MapDebugControls /> */}
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
      
      {/* Archive/More 모달 */}
      {modalType && (
        <>
          {/* 배경 오버레이 */}
          <Pressable
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              zIndex: 2000,
            }}
            onPress={handleCloseModal}
          />
          {/* 모달 컨텐츠 */}
          <Animated.View
            style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '90%',
              zIndex: 2001,
              transform: [
                {
                  translateY: modalSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [1000, 0], // 아래에서 위로 올라옴
                  }),
                },
              ],
            }}
          >
            <View className="flex-1 bg-background rounded-t-3xl" style={{ paddingTop: insets.top }}>
              {/* 닫기 버튼 */}
              <View
                style={{
                  paddingHorizontal: 16,
                  paddingTop: 16,
                  paddingBottom: 8,
                  flexDirection: 'row',
                  justifyContent: 'flex-end',
                }}
              >
                <LiquidGlassButton onPress={handleCloseModal} borderRadius={8}>
                  <ChevronLeft width={24} height={24} color="black" />
                </LiquidGlassButton>
              </View>
              {/* 스택 컨텐츠 */}
              <View className="flex-1">
                {modalType === 'archive' && <ArchiveScreen />}
                {modalType === 'more' && <MoreScreen />}
              </View>
            </View>
          </Animated.View>
        </>
      )}
     
    </View>
  );
};