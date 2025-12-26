import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Image, Alert, TouchableOpacity, Animated } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MapStackParamList } from '@nav/stack/MapStack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Region, Marker } from 'react-native-maps';
import { useRecordStore } from '@stores/recordStore';
import { DEVICE_HEIGHT } from '@constants/NORMAL';
import { BUTTON_SIZE_MEDIUM } from '@constants/NORMAL';
import { ZOOM_LEVEL } from '@/features/Map/constants/MAP';
import { type ChipTypeKey } from '@constants/CHIP';
import { Chip, LiquidGlassButton, LiquidGlassView, Text, LiquidGlassTextButton } from '@components/index';
import { MapControls } from '@/features/Map/components/MapControls';
import { deleteRecord } from '@libs/supabase/recordService';
import { Background } from '@components/Background';
import ChevronLeft from '@assets/svgs/ChevronLeft.svg';

type ArchiveDetailScreenNavigationProp = NativeStackNavigationProp<MapStackParamList, 'ArchiveDetail'>;
type ArchiveDetailScreenRouteProp = RouteProp<MapStackParamList, 'ArchiveDetail'>;

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

export const ArchiveDetailScreen = () => {
  const navigation = useNavigation<ArchiveDetailScreenNavigationProp>();
  const route = useRoute<ArchiveDetailScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { recordId } = route.params;
  
  const records = useRecordStore(state => state.records);
  const removeRecordFromStore = useRecordStore(state => state.removeRecord);
  const record = records.find(r => r.id === recordId);
  
  const [note, setNote] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ChipTypeKey | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [mapRegion, setMapRegion] = useState<Region | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(ZOOM_LEVEL.DEFAULT);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'photo' | 'location'>('photo');
  const mapRef = useRef<MapView>(null);
  
  // Fade 애니메이션 값
  const photoTabOpacity = useRef(new Animated.Value(1)).current;
  const locationTabOpacity = useRef(new Animated.Value(0)).current;

  // record 기반으로 상태 초기화
  useEffect(() => {
    if (!record) return;

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
  }, [record]);

  // 지도 region 변경 핸들러
  const handleRegionChangeComplete = useCallback((region: Region) => {
    setMapRegion(region);
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

  const displayImageUri = record?.image_path ?? undefined;

  return (
    <Background isStatusBarGap={false} isTabBarGap={false}>
      <View className="flex-1 px-8 relative" style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}>
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
              <Chip chipType={selectedCategory} interactive={false} />
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
                <LiquidGlassView
                  borderRadius={16}
                  interactive={false}
                  innerStyle={{
                    paddingHorizontal: 16,
                    paddingVertical: 12,
                    minHeight: 100,
                    justifyContent: 'flex-start',
                  }}
                >
                  <Text
                    type="body2"
                    text={note || '메모가 없습니다.'}
                    style={{ textAlignVertical: 'top' as any }}
                  />
                </LiquidGlassView>
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
              onPress={() => {
                // TODO: 수정 기능 구현
                navigation.goBack();
              }}
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
        </View>
      </View>
    </Background>
  );
};

