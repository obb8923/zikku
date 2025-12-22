import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Image, Keyboard, ScrollView, Alert, ActivityIndicator, TouchableOpacity, Animated } from 'react-native';
import { Portal } from '@gorhom/portal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Region, Marker } from 'react-native-maps';
import { useLocationStore } from '@stores/locationStore';
import { useAuthStore } from '@stores/authStore';
import { useRecordStore, type Record as RecordType } from '@stores/recordStore';
import { DEVICE_HEIGHT, DEVICE_WIDTH } from '@constants/NORMAL';
import { BUTTON_SIZE_MEDIUM } from '@constants/NORMAL';
import { INITIAL_MAP_REGION, ZOOM_LEVEL } from '@/features/Map/constants/MAP';
import { CHIP_TYPE, type ChipTypeKey } from '@constants/CHIP';
import { Chip, LiquidGlassButton, LiquidGlassInput, LiquidGlassView, Text, CategorySelectModal } from '@components/index';
import { MapControls } from '@/features/Map/components/MapControls';
import { saveRecord } from '@libs/supabase/recordService';
import PlusSmallIcon from '@assets/svgs/PlusSmall.svg';
import MarkerPinIcon from '@assets/svgs/MarkerPin.svg';
import {LiquidGlassTextButton} from '@components/index';
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
  // mode: 기본(생성) / 상세 보기
  mode?: 'create' | 'detail';
  // 기존 레코드 상세 보기용 데이터
  record?: RecordType | null;
  // 상세 모드에서 수정/삭제 버튼 콜백
  onEditPress?: (record: RecordType) => void;
  onDeletePress?: (record: RecordType) => void;
}

// zoom 레벨을 delta로 변환하는 유틸리티 함수
const zoomToDelta = (zoom: number): { latitudeDelta: number; longitudeDelta: number } => {
  const latitudeDelta = 360 / Math.pow(2, zoom);
  const longitudeDelta = latitudeDelta; 
  return { latitudeDelta, longitudeDelta };
};

// category(string)를 ChipTypeKey로 변환
const getChipTypeFromCategory = (category: string | null | undefined): ChipTypeKey => {
  if (!category) return 'LANDSCAPE';
  const categoryMap: { [key: string]: ChipTypeKey } = {
    '풍경': 'LANDSCAPE',
    '장소': 'PLACE',
    '생명': 'LIFE',
    '발견': 'DISCOVERY',
    '함께': 'TOGETHER',
  };
  return categoryMap[category] || 'LANDSCAPE';
};

export const RecordModal = ({
  visible,
  onClose,
  image,
  mode = 'create',
  record,
  onEditPress,
  onDeletePress,
}: RecordModalProps) => {
  const insets = useSafeAreaInsets();
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ChipTypeKey | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(ZOOM_LEVEL.DEFAULT);
  const [isSaving, setIsSaving] = useState(false);
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const [activeTab, setActiveTab] = useState<'photo' | 'location'>('photo');
  const mapRef = useRef<MapView>(null);
  
  // Fade 애니메이션 값
  const photoTabOpacity = useRef(new Animated.Value(1)).current;
  const locationTabOpacity = useRef(new Animated.Value(0)).current;
  
  // 현재 위치 가져오기
  const currentLatitude = useLocationStore(state => state.latitude);
  const currentLongitude = useLocationStore(state => state.longitude);
  const userId = useAuthStore(state => state.userId);
  const addRecord = useRecordStore(state => state.addRecord);
  
  // 초기 위치 설정 (현재 위치 또는 기본 위치)
  useEffect(() => {
    // 상세 모드에서는 별도의 이펙트에서 record 기반으로 설정
    if (!visible || selectedLocation || mode === 'detail') {
      return;
    }

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
  }, [visible, currentLatitude, currentLongitude, selectedLocation, mode]);

  // 상세 모달일 때 record 기반으로 상태 초기화
  useEffect(() => {
    if (!visible || mode !== 'detail' || !record) {
      return;
    }

    setNote(record.memo || '');
    if (record.category) {
      setSelectedCategory(getChipTypeFromCategory(record.category));
    } else {
      setSelectedCategory(null);
    }

    const { latitudeDelta, longitudeDelta } = zoomToDelta(ZOOM_LEVEL.DEFAULT);
    setSelectedLocation({
      latitude: record.latitude,
      longitude: record.longitude,
    });
    setMapRegion({
      latitude: record.latitude,
      longitude: record.longitude,
      latitudeDelta,
      longitudeDelta,
    });
  }, [visible, mode, record]);
  
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
  
  // 탭 전환 핸들러
  const handleTabChange = useCallback((tab: 'photo' | 'location') => {
    if (tab === activeTab) return;
    
    setActiveTab(tab);
    
    // Fade 애니메이션
    if (tab === 'photo') {
      Animated.parallel([
        Animated.timing(photoTabOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(locationTabOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(photoTabOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(locationTabOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [activeTab, photoTabOpacity, locationTabOpacity]);
  
  // 모달이 열릴 때 탭 초기화
  useEffect(() => {
    if (visible) {
      setActiveTab('photo');
      photoTabOpacity.setValue(1);
      locationTabOpacity.setValue(0);
      setSelectedCategory(null);
    }
  }, [visible, photoTabOpacity, locationTabOpacity]);
  
  // 저장 핸들러
  const handleSave = useCallback(async () => {
    // 생성(수정용) 모드에서만 사용
    if (!image?.uri) {
      Alert.alert('오류', '이미지가 필요합니다.');
      return;
    }
    
    if (!selectedCategory) {
      Alert.alert('오류', '카테고리를 선택해주세요.');
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
            setSelectedCategory(null);
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

  // 상세 모드에서 수정 버튼
  const handlePressEdit = useCallback(() => {
    if (!record) {
      return;
    }
    if (onEditPress) {
      onEditPress(record);
    } else {
      Alert.alert('알림', '수정 기능은 아직 연결되지 않았습니다.');
    }
  }, [record, onEditPress]);

  // 상세 모드에서 삭제 버튼
  const handlePressDelete = useCallback(() => {
    if (!record) {
      return;
    }
    if (onDeletePress) {
      onDeletePress(record);
    } else {
      Alert.alert('알림', '삭제 기능은 아직 연결되지 않았습니다.');
    }
  }, [record, onDeletePress]);

  if (!visible) {
    return null;
  }

  const displayImageUri =
    mode === 'detail'
      ? record?.image_path ?? undefined
      : image?.uri;
  
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
          <View className="flex-1 px-8 relative">
            {/* 뒤로가기 버튼 , 액티브 상태 버튼 */}
            <View className="flex-row gap-2 w-full h-auto mb-2 justify-between">
              <View style={{ zIndex: 10, transform: [{rotate: '45deg'}], width: BUTTON_SIZE_MEDIUM, height: BUTTON_SIZE_MEDIUM }}>
                <LiquidGlassButton onPress={onClose} size="medium">
                  <PlusSmallIcon width={24} height={24} color="black" />
                </LiquidGlassButton>
               
              </View>
              <View className="flex-row gap-2">
                  <LiquidGlassTextButton 
                    onPress={() => handleTabChange('photo')} 
                    size="medium" 
                    text="사진과 카테고리"
                    style={{ opacity: activeTab === 'photo' ? 1 : 0.5 }}
                  />
                  <LiquidGlassTextButton 
                    onPress={() => handleTabChange('location')} 
                    size="medium" 
                    text="위치와 메모"
                    style={{ opacity: activeTab === 'location' ? 1 : 0.5 }}
                  />
                </View>
            
            </View>
            {/* 컨텐츠 영역 */}
          <View className="flex-1 relative">
            {/* 사진과 카테고리 탭 */}
            <Animated.View 
            className="absolute flex-1 inset-0 py-12 gap-8"
              style={{ 
                opacity: photoTabOpacity,
                pointerEvents: activeTab === 'photo' ? 'auto' : 'none',
              }}
            >
              {/* 이미지 영역 */}
              {displayImageUri && (
                <View className="flex-1 items-center justify-center">
                  <Image
                    source={{ uri: displayImageUri }}
                    style={{ width: '100%', height: '100%'}}
                    resizeMode="contain"
                  />
                </View>
              )}
            
              {/* 칩 영역 */}
              <View className="items-center justify-center w-full h-1/12 gap-8">
            
                <TouchableOpacity
                  onPress={() => setIsCategoryModalVisible(true)}
                  disabled={isSaving}
                >
                  <Chip chipType={selectedCategory}/>
                </TouchableOpacity>
              </View>
            </Animated.View>
            
            {/* 위치와 메모 탭 */}
            <Animated.View 
            className="flex-1 absolute inset-0"
              style={{ 
                opacity: locationTabOpacity,
                pointerEvents: activeTab === 'location' ? 'auto' : 'none',
              }}
            > 
            <View className="flex-1 justify-between py-12">
            {/* 메모 입력 영역 */}
            <View className="w-full mt-4 relative">
              <LiquidGlassInput
                value={note}
                onChangeText={setNote}
                placeholder="(선택) 메모를 입력할 수 있어요"
                multiline
                numberOfLines={4}
                maxLength={100}
                style={{
                  minHeight: 100,
                  textAlignVertical: 'top',
                }}
              />
              <View className="absolute bottom-2 right-2">
                <Text 
                  type="caption1" 
                  text={`${note.length}/100`}
                  style={{ opacity: 0.6 }}
                />
              </View>
            </View>
              {/* 지도 영역 */}
              {mapRegion && selectedLocation && (
                <View className="w-full relative" style={{ borderRadius: 16, height: DEVICE_HEIGHT * 0.3, marginVertical: 16, overflow: 'hidden' }}>
                  <MapView
                    ref={mapRef}
                    style={{ width: '100%', height: '100%' }}
                    initialRegion={mapRegion}
                    onRegionChangeComplete={handleRegionChangeComplete}
                    showsUserLocation={false}
                    showsMyLocationButton={false}
                    scrollEnabled={true}
                    zoomEnabled={true}
                    pitchEnabled={false}
                    rotateEnabled={false}
                    mapType="mutedStandard"      // "standard" | "satellite" | "hybrid" | "mutedStandard"

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
              
              </View>
            </Animated.View>
            </View>
             {/* 저장 버튼 */}
             <View className="w-full items-center justify-center">
              {mode === 'detail' && record ? (
                <View className="flex-row gap-4">
                  <LiquidGlassTextButton
                    onPress={handlePressEdit}
                    size="medium"
                    text="수정"
                    disabled={isSaving}
                  />
                  <LiquidGlassTextButton
                    onPress={handlePressDelete}
                    size="medium"
                    text="삭제"
                    disabled={isSaving}
                  />
                </View>
              ) : (
                <LiquidGlassTextButton
                  onPress={handleSave}
                  size="medium"
                  text="저장하기"
                  loading={isSaving}
                  disabled={isSaving}
                />
              )}
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