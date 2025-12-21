import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Image, Keyboard, ScrollView, Alert, ActivityIndicator, TouchableOpacity } from 'react-native';
import { Portal } from '@gorhom/portal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Region, Marker } from 'react-native-maps';
import { useLocationStore } from '@stores/locationStore';
import { useAuthStore } from '@stores/authStore';
import { useRecordStore } from '@stores/recordStore';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@constants/NORMAL';
import { BUTTON_SIZE_MEDIUM } from '@constants/NORMAL';
import { INITIAL_MAP_REGION, ZOOM_LEVEL } from '@/features/Map/constants/MAP';
import { CHIP_TYPE, type ChipTypeKey } from '@constants/CHIP';
import { Chip, LiquidGlassButton, LiquidGlassInput, LiquidGlassView, Text, CategorySelectModal } from '@components/index';
import { MapControls } from '@/features/Map/components/MapControls';
import { saveRecord } from '@libs/supabase/recordService';
import PlusSmallIcon from '@assets/svgs/PlusSmall.svg';
import MarkerPinIcon from '@assets/svgs/MarkerPin.svg';

interface ImageData {
  uri: string;
  fileName?: string;
  type?: string;
  width?: number;
  height?: number;
}

interface RecordModalProps {
  visible: boolean;
  onClose: () => void;
  image?: ImageData | null;
}

// zoom 레벨을 delta로 변환하는 유틸리티 함수
const zoomToDelta = (zoom: number): { latitudeDelta: number; longitudeDelta: number } => {
  const latitudeDelta = 360 / Math.pow(2, zoom);
  const longitudeDelta = latitudeDelta; 
  return { latitudeDelta, longitudeDelta };
};

export const RecordModal = ({ visible, onClose, image }: RecordModalProps) => {
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ChipTypeKey>('LANDSCAPE');
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(ZOOM_LEVEL.DEFAULT);
  const [isSaving, setIsSaving] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const mapRef = useRef<MapView>(null);
  
  // 현재 위치 가져오기
  const currentLatitude = useLocationStore(state => state.latitude);
  const currentLongitude = useLocationStore(state => state.longitude);
  const userId = useAuthStore(state => state.userId);
  const addRecord = useRecordStore(state => state.addRecord);
  
  // 초기 위치 설정 (현재 위치 또는 기본 위치)
  useEffect(() => {
    if (visible && !selectedLocation) {
      const initialLat = currentLatitude ?? INITIAL_MAP_REGION.latitude;
      const initialLng = currentLongitude ?? INITIAL_MAP_REGION.longitude;
      const { latitudeDelta, longitudeDelta } = zoomToDelta(ZOOM_LEVEL.DEFAULT);
      
      setSelectedLocation({ latitude: initialLat, longitude: initialLng });
      setMapRegion({
        latitude: initialLat,
        longitude: initialLng,
        latitudeDelta,
        longitudeDelta,
      });
    }
  }, [visible, currentLatitude, currentLongitude, selectedLocation]);
  
  // 지도 region 변경 핸들러 - 중앙 좌표 업데이트
  const handleRegionChangeComplete = useCallback((region: Region) => {
    setMapRegion(region);
    setSelectedLocation({
      latitude: region.latitude,
      longitude: region.longitude,
    });
    // zoom level 계산
    const calculatedZoom = Math.round(Math.log2(360 / region.latitudeDelta));
    setZoomLevel(calculatedZoom);
  }, []);
  
  // 줌 변경 핸들러
  const handleZoomChange = useCallback(
    (delta: number) => {
      if (!mapRegion || !mapRef.current) return;
      
      const next = Math.min(ZOOM_LEVEL.MAX, Math.max(ZOOM_LEVEL.MIN, zoomLevel + delta));
      const { latitudeDelta, longitudeDelta } = zoomToDelta(next);
      
      mapRef.current.animateToRegion({
        latitude: mapRegion.latitude,
        longitude: mapRegion.longitude,
        latitudeDelta,
        longitudeDelta,
      });
      
      setZoomLevel(next);
    },
    [mapRegion, zoomLevel],
  );
  
  // 줌 인
  const handleZoomIn = useCallback(() => {
    handleZoomChange(1);
  }, [handleZoomChange]);
  
  // 줌 아웃
  const handleZoomOut = useCallback(() => {
    handleZoomChange(-1);
  }, [handleZoomChange]);
  
  // 내 위치로 이동
  const handleMoveToMyLocation = useCallback(() => {
    if (!currentLatitude || !currentLongitude || !mapRef.current || !mapRegion) {
      return;
    }
    
    const { latitudeDelta, longitudeDelta } = mapRegion;
    
    mapRef.current.animateToRegion({
      latitude: currentLatitude,
      longitude: currentLongitude,
      latitudeDelta,
      longitudeDelta,
    });
  }, [currentLatitude, currentLongitude, mapRegion]);
  
  // 저장 핸들러
  const handleSave = useCallback(async () => {
    if (!image?.uri) {
      Alert.alert('오류', '이미지가 필요합니다.');
      return;
    }
    
    if (!selectedLocation) {
      Alert.alert('오류', '위치를 선택해주세요.');
      return;
    }
    
    if (!userId) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }
    
    setIsSaving(true);
    
    try {
      const category = CHIP_TYPE[selectedCategory];
      const savedRecord = await saveRecord(
        image,
        userId,
        selectedLocation.latitude,
        selectedLocation.longitude,
        category,
        note || undefined,
      );
      
      // 로컬 스토어에 추가
      if (savedRecord) {
        addRecord(savedRecord);
      }
      
      Alert.alert('성공', '레코드가 저장되었습니다.', [
        {
          text: '확인',
          onPress: () => {
            onClose();
            // 상태 초기화
            setNote('');
            setSelectedCategory('LANDSCAPE');
            setSelectedLocation(null);
            setMapRegion(null);
          },
        },
      ]);
    } catch (error: any) {
      console.error('저장 오류:', error);
      Alert.alert('오류', error.message || '레코드 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  }, [image, selectedLocation, selectedCategory, note, userId, onClose]);

  if (!visible) {
    return null;
  }
  
  return (
    <Portal>
      <View
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 1000 }}
        pointerEvents="box-none"
      >
        {/* 배경 오버레이 */}
        <View
          className="absolute inset-0"
          style={{backgroundColor: 'rgba(0, 0, 0, 0.8)'}}
          pointerEvents="none"
        />
        {/* 모달 컨텐츠 */}
        <View
          className="flex-1"
          style={{
            paddingTop: insets.top,
            paddingBottom: insets.bottom,
          }}
          pointerEvents="box-none"
        >
          {/* 모달 컨텐츠 영역 */}
          <View className="flex-1 px-8">
            {/* 뒤로가기 버튼 , 메모 */}
            <View className="flex-row  gap-2 w-full h-auto mb-2">
              <View style={{ zIndex: 10, transform: [{rotate: '45deg'}], width: BUTTON_SIZE_MEDIUM, height: BUTTON_SIZE_MEDIUM }}>
                <LiquidGlassButton onPress={onClose} size="medium">
                  <PlusSmallIcon width={24} height={24} color="black" />
                </LiquidGlassButton>
              </View>
              <View className="flex-1">
              <LiquidGlassInput
                placeholder="메모(선택)"
                value={note}
                onChangeText={setNote}
                multiline
                numberOfLines={1}
                textAlignVertical="top"
                returnKeyType="done"
                onSubmitEditing={() => Keyboard.dismiss()}
              />
              </View>
            </View>
            <ScrollView 
            showsVerticalScrollIndicator={false} 
            bounces={false}
            contentContainerStyle={{ paddingBottom: 16 }}>
           
            
            {/* 이미지 영역 */}
            {image?.uri && (
              <View className="items-center justify-center">
                <Image
                  source={{ uri: image?.uri }}
                  style={{
                    borderRadius: 8,
                    marginVertical: 16,
                    width: '100%',
                    height: DEVICE_HEIGHT * 0.3,
                  }}
                  resizeMode="contain"
                />
              </View>
            )}
          
            {/* 칩 영역 */}
            <View className="flex-row w-full h-1/12 gap-8">
            <LiquidGlassView 
            className=""
            borderRadius={16}
            style={{
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
            }}
            innerStyle={{ 
              flex: 1,
              justifyContent: 'center',
              alignItems: 'center',
              borderTopLeftRadius: 16,
              borderTopRightRadius: 16,
              borderBottomLeftRadius: 0,
              borderBottomRightRadius: 0,
              paddingHorizontal: 16,
            }}>
              <Text text="사진 위치" type="body2" style={{ textAlign: 'center' ,color: 'white' }} />
            </LiquidGlassView>
            <View className="flex-1 items-end justify-center mb-2">
              <TouchableOpacity
                onPress={() => setIsCategoryModalVisible(true)}
                disabled={isSaving}
              >
                <Chip chipType={selectedCategory}/>
                </TouchableOpacity>
            </View>
            </View>
            
           
             {/* 지도 영역 */}
             {mapRegion && selectedLocation && (
              <View className="w-full relative" style={{ height: DEVICE_HEIGHT * 0.3 }}>
                <MapView
                  ref={mapRef}
                  style={{ width: '100%', height: '100%', borderRadius: 16 }}
                  initialRegion={mapRegion}
                  onRegionChangeComplete={handleRegionChangeComplete}
                  showsUserLocation={false}
                  showsMyLocationButton={false}
                  scrollEnabled={true}
                  zoomEnabled={true}
                  pitchEnabled={false}
                  rotateEnabled={false}
                >
                  <Marker
                    coordinate={{
                      latitude: selectedLocation.latitude,
                      longitude: selectedLocation.longitude,
                    }}
                    anchor={{ x: 0.5, y: 1 }}
                  >
                    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                      <Text type="body2" text="📍" />
                    </View>
                  </Marker>
                </MapView>
                {/* 지도 컨트롤 */}
                <MapControls
                  onZoomIn={handleZoomIn}
                  onZoomOut={handleZoomOut}
                  onMoveToMyLocation={handleMoveToMyLocation}
                  containerStyle={{ right: 8, top: 8 }}
                />
              </View>
            )}
            </ScrollView>
             {/* 저장 버튼 */}
             <View className="w-full items-center justify-center">
             <LiquidGlassButton
              onPress={handleSave}
              disabled={isSaving || !image?.uri || !selectedLocation}
              borderRadius={16}
            >
              <View className="items-center justify-center">
                {isSaving ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text type="body1" text="저장" style={{ fontWeight: '500' }} />
                )}
              </View>
            </LiquidGlassButton>
            </View>
          </View>
        </View>
      </View>
      
      {/* 카테고리 선택 모달 */}
      <CategorySelectModal
        visible={isCategoryModalVisible}
        onClose={() => setIsCategoryModalVisible(false)}
        onSelect={setSelectedCategory}
        disabled={isSaving}
      />
    </Portal>
  );
};