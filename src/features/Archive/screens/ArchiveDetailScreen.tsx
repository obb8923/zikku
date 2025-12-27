import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Image, Alert, TouchableOpacity, Animated, Keyboard } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MapStackParamList } from '@nav/stack/MapStack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Region, Marker } from 'react-native-maps';
import { useRecordStore } from '@stores/recordStore';
import { DEVICE_HEIGHT } from '@constants/NORMAL';
import { BUTTON_SIZE_MEDIUM } from '@constants/NORMAL';
import { ZOOM_LEVEL } from '@/features/Map/constants/MAP';
import { type ChipTypeKey, CHIP_TYPE, getChipTypeFromCategory } from '@constants/CHIP';
import { Chip, LiquidGlassButton, Text, LiquidGlassTextButton, CategorySelectModal, LiquidGlassInput } from '@components/index';
import { MapControls } from '@/features/Map/components/MapControls';
import { deleteRecord, updateRecord } from '@libs/supabase/recordService';
import { useAuthStore } from '@stores/authStore';
import { Background } from '@components/Background';
import ChevronLeft from '@assets/svgs/ChevronLeft.svg';
import { zoomToDelta } from '@/features/Map/utils/mapUtils';

type ArchiveDetailScreenNavigationProp = NativeStackNavigationProp<MapStackParamList, 'ArchiveDetail'>;
type ArchiveDetailScreenRouteProp = RouteProp<MapStackParamList, 'ArchiveDetail'>;

export const ArchiveDetailScreen = () => {
  const navigation = useNavigation<ArchiveDetailScreenNavigationProp>();
  const route = useRoute<ArchiveDetailScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { recordId } = route.params;
  
  const records = useRecordStore(state => state.records);
  const removeRecordFromStore = useRecordStore(state => state.removeRecord);
  const updateRecordInStore = useRecordStore(state => state.updateRecord);
  const record = records.find(r => r.id === recordId);
  const userId = useAuthStore(state => state.userId);
  
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ChipTypeKey | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(ZOOM_LEVEL.DEFAULT);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'photo' | 'location'>('photo');
  const [isCategoryModalVisible, setIsCategoryModalVisible] = useState(false);
  const mapRef = useRef<MapView>(null);
  
  // Fade 애니메이션 값
  const photoTabOpacity = useRef(new Animated.Value(1)).current;
  const locationTabOpacity = useRef(new Animated.Value(0)).current;

  // record 기반으로 상태 초기화
  useEffect(() => {
    if (!record) return;

    const memo = record.memo || '';
    const category = record.category ? getChipTypeFromCategory(record.category) : null;
    const location = {
      latitude: record.latitude,
      longitude: record.longitude,
    };

    setNote(memo);
    setSelectedCategory(category);
    setSelectedLocation(location);

    const { latitudeDelta, longitudeDelta } = zoomToDelta(ZOOM_LEVEL.DEFAULT);
    setMapRegion({
      latitude: record.latitude,
      longitude: record.longitude,
      latitudeDelta,
      longitudeDelta,
    });
  }, [record]);

  // 지도 region 변경 핸들러
  const handleRegionChangeComplete = useCallback((region: Region) => {
    setMapRegion(region);
    // 위치 업데이트
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

  // 변경사항 확인
  const hasChanges = useCallback(() => {
    if (!record || !selectedCategory || !selectedLocation) return false;

    const originalCategory = record.category ? getChipTypeFromCategory(record.category) : null;
    const originalMemo = record.memo || '';
    const originalLatitude = record.latitude;
    const originalLongitude = record.longitude;

    const categoryChanged = originalCategory !== selectedCategory;
    const memoChanged = originalMemo !== note;
    const locationChanged = 
      Math.abs(originalLatitude - selectedLocation.latitude) > 0.0001 ||
      Math.abs(originalLongitude - selectedLocation.longitude) > 0.0001;

    return categoryChanged || memoChanged || locationChanged;
  }, [record, selectedCategory, selectedLocation, note]);

  // 저장
  const handleSave = useCallback(async () => {
    if (!record || !selectedCategory || !selectedLocation || !userId) {
      Alert.alert('오류', '필수 정보가 누락되었습니다.');
      return;
    }

    // 변경사항이 없으면 바로 닫기
    if (!hasChanges()) {
      navigation.goBack();
      return;
    }

    setIsSaving(true);
    try {
      const category = CHIP_TYPE[selectedCategory];
      const updatedRecord = await updateRecord(record.id, {
        latitude: selectedLocation.latitude,
        longitude: selectedLocation.longitude,
        category,
        memo: note || null,
      });

      // 로컬 스토어 업데이트
      updateRecordInStore(record.id, updatedRecord);

      // 저장 성공 후 화면 닫기
      navigation.goBack();
    } catch (error: any) {
      console.error('수정 오류:', error);
      Alert.alert('오류', error.message || '레코드 수정에 실패했습니다.');
      setIsSaving(false);
    }
  }, [record, selectedCategory, selectedLocation, note, userId, updateRecordInStore, hasChanges, navigation]);

  // 삭제 버튼
  const handlePressDelete = useCallback(() => {
    if (!record) {
      return;
    }
    
    Alert.alert(
      '삭제 확인',
      '정말로 이 레코드를 삭제하시겠습니까?',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            setIsSaving(true);
            try {
              await deleteRecord(record.id);
              removeRecordFromStore(record.id);
              
              Alert.alert('성공', '레코드가 삭제되었습니다.', [
                {
                  text: '확인',
                  onPress: () => {
                    navigation.goBack();
                  },
                },
              ]);
            } catch (error: any) {
              console.error('삭제 오류:', error);
              Alert.alert('오류', error.message || '레코드 삭제에 실패했습니다.');
            } finally {
              setIsSaving(false);
            }
          },
        },
      ]
    );
  }, [record, navigation, removeRecordFromStore]);

  if (!record) {
    return (
      <Background isStatusBarGap={false} isTabBarGap={false}>
        <View className="flex-1 items-center justify-center">
          <Text type="body2" text="레코드를 찾을 수 없습니다." style={{ color: 'rgba(0, 0, 0, 0.5)' }} />
        </View>
      </Background>
    );
  }
  useEffect(() => {
    console.log('isCategoryModalVisible', isCategoryModalVisible);

    return () => {
    };
  }, [isCategoryModalVisible]);

  const displayImageUri = record?.image_path ?? undefined;

  return (
    <>
    <Background isStatusBarGap={false} isTabBarGap={false}>
      <View className="flex-1 px-8 relative" style={{ paddingTop: 16, paddingBottom: insets.bottom }}>
        {/* 뒤로가기 버튼, 액티브 상태 버튼 */}
        <View className="flex-row gap-2 w-full h-auto mb-2 justify-between">
          <View style={{ zIndex: 10, width: BUTTON_SIZE_MEDIUM, height: BUTTON_SIZE_MEDIUM }}>
            <LiquidGlassButton onPress={() => navigation.goBack()} size="medium">
              <ChevronLeft width={24} height={24} color="black" />
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
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="contain"
                />
              </View>
            )}

            {/* 칩 영역 */}
            <View className="items-center justify-center w-full h-1/12 gap-8">
              <TouchableOpacity onPress={() => setIsCategoryModalVisible(true)} disabled={isSaving}>
                <Chip chipType={selectedCategory} interactive={true} />
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
              {/* 메모 영역 */}
              <View className="w-full mt-4">
                <LiquidGlassInput
                  value={note}
                  onChangeText={setNote}
                  placeholder="메모를 입력하세요"
                  multiline
                  returnKeyType="done"
                  onSubmitEditing={() => Keyboard.dismiss()}
                  blurOnSubmit={true}
                  style={{ minHeight: 100, textAlignVertical: 'top' }}
                  editable={!isSaving}
                />
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
                    scrollEnabled={!isSaving}
                    zoomEnabled={!isSaving}
                    pitchEnabled={false}
                    rotateEnabled={false}
                    mapType="mutedStandard"
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
                    onMoveToMyLocation={() => {}}
                    containerStyle={{ right: 8, top: 8 }}
                    disableMyLocation={true}
                  />
                </View>
              )}
            </View>
          </Animated.View>
        </View>

        {/* 버튼 영역 */}
        <View className="w-full items-center justify-center pb-4">
          <View className="flex-row gap-4">
          <LiquidGlassTextButton
              onPress={handlePressDelete}
              size="medium"
              text="삭제"
              disabled={isSaving}
            />
            <LiquidGlassTextButton
              onPress={handleSave}
              size="medium"
              text="저장"
              disabled={isSaving}
              loading={isSaving}
            />
          
          </View>
        </View>
      </View>
    </Background>
    {/* 카테고리 선택 모달 - Portal을 사용하므로 Background 밖에 배치 */}
    <CategorySelectModal
      visible={isCategoryModalVisible}
      onClose={() => setIsCategoryModalVisible(false)}
      onSelect={(category) => {
        setSelectedCategory(category);
        setIsCategoryModalVisible(false);
      }}
      disabled={isSaving}
    />
    </>
  );
};

