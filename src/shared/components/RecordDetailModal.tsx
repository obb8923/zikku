import React from 'react';
import { View, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Portal } from '@gorhom/portal';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DEVICE_HEIGHT } from '@constants/NORMAL';
import { BUTTON_SIZE_MEDIUM } from '@constants/NORMAL';
import { Record } from '@stores/recordStore';
import { CHIP_TYPE, type ChipTypeKey } from '@constants/CHIP';
import { Chip, LiquidGlassButton, LiquidGlassView, Text } from '@components/index';
import PlusSmallIcon from '@assets/svgs/PlusSmall.svg';

interface RecordDetailModalProps {
  visible: boolean;
  record: Record | null;
  onClose: () => void;
}

export const RecordDetailModal = ({ visible, record, onClose }: RecordDetailModalProps) => {
  const insets = useSafeAreaInsets();

  if (!visible || !record) {
    return null;
  }

  // category를 ChipTypeKey로 변환
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

  const chipType = getChipTypeFromCategory(record.category);
  const formattedDate = new Date(record.created_at).toLocaleString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

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
          onTouchEnd={onClose}
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
            {/* 뒤로가기 버튼 */}
            <View className="flex-row w-full h-auto mb-2 justify-end">
              <View style={{ zIndex: 10, transform: [{rotate: '45deg'}], width: BUTTON_SIZE_MEDIUM, height: BUTTON_SIZE_MEDIUM }}>
                <LiquidGlassButton onPress={onClose} size="medium">
                  <PlusSmallIcon width={24} height={24} color="black" />
                </LiquidGlassButton>
              </View>
            </View>
            
            <ScrollView 
              showsVerticalScrollIndicator={false} 
              bounces={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {/* 이미지 영역 */}
              {record.image_path && (
                <View className="items-center justify-center mb-4">
                  <Image
                    source={{ uri: record.image_path }}
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

              {/* 카테고리 영역 */}
              <View className="flex-row w-full items-center gap-4 mb-4">
                <Chip chipType={chipType} />
                <Text 
                  type="body2" 
                  text={formattedDate}
                  style={{ color: 'rgba(0, 0, 0, 0.6)' }}
                />
              </View>

              {/* 메모 영역 */}
              {record.memo && (
                <LiquidGlassView
                  borderRadius={16}
                  className="w-full mb-4"
                  innerStyle={{
                    padding: 16,
                  }}
                >
                  <Text 
                    type="body2" 
                    text={record.memo}
                    style={{ color: '#000' }}
                  />
                </LiquidGlassView>
              )}

              {/* 위치 정보 영역 */}
              <LiquidGlassView
                borderRadius={16}
                className="w-full"
                innerStyle={{
                  padding: 16,
                }}
              >
                <Text 
                  type="body2" 
                  text="위치 정보"
                  style={{ marginBottom: 8, fontWeight: '600' }}
                />
                <Text 
                  type="body3" 
                  text={`위도: ${record.latitude.toFixed(6)}`}
                  style={{ color: 'rgba(0, 0, 0, 0.7)', marginBottom: 4 }}
                />
                <Text 
                  type="body3" 
                  text={`경도: ${record.longitude.toFixed(6)}`}
                  style={{ color: 'rgba(0, 0, 0, 0.7)' }}
                />
              </LiquidGlassView>
            </ScrollView>
          </View>
        </View>
      </View>
    </Portal>
  );
};

