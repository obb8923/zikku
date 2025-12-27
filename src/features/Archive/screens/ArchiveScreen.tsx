import React, { useMemo } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MapStackParamList } from '@nav/stack/MapStack';
import { Background } from '@components/Background';
import { Text } from '@components/Text';
import { useRecordStore, Record } from '@stores/recordStore';
import { LiquidGlassButton} from '@components/index';
import { CHIP_TYPE, CHIP_TINT_COLORS, type ChipTypeKey, getChipTypeFromCategory } from '@constants/CHIP';
import { LiquidGlassImage } from '@components/index';
import { COLORS } from '@constants/COLORS';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import XIcon from '@assets/svgs/X.svg';

type ArchiveScreenNavigationProp = NativeStackNavigationProp<MapStackParamList, 'Archive'>;
type ListItem = {
  type: 'group';
  title: string;
  records: Record[];
};

export const ArchiveScreen = () => {
  const navigation = useNavigation<ArchiveScreenNavigationProp>();
  const records = useRecordStore(state => state.records);
  const insets = useSafeAreaInsets();
  // records를 월별로 그룹화하여 리스트 아이템으로 변환
  const listData = useMemo(() => {
    const groups: { [key: string]: Record[] } = {};
    
    records.forEach((record) => {
      const date = new Date(record.created_at);
      const monthKey = `${date.getFullYear()}년 ${date.getMonth() + 1}월`;
      
      if (!groups[monthKey]) {
        groups[monthKey] = [];
      }
      groups[monthKey].push(record);
    });

    // 월별로 정렬 (최신순)
    const sortedKeys = Object.keys(groups).sort((a, b) => {
      const dateA = new Date(groups[a][0].created_at);
      const dateB = new Date(groups[b][0].created_at);
      return dateB.getTime() - dateA.getTime();
    });

    // 그룹화된 리스트 데이터 생성
    const groupData: ListItem[] = sortedKeys.map(key => ({
      type: 'group' as const,
      title: key,
      records: groups[key],
    }));

    return groupData;
  }, [records]);

  // 아이템 렌더링
  const renderItem: ListRenderItem<ListItem> = ({ item }) => {
    return (
      <View className="p-4 mb-4 bg-component-background rounded-3xl">
        {/* 헤더 */}
        <View className="mb-3">
          <Text type="title3" text={item.title} style={{ fontWeight: '600', color: COLORS.TEXT_COMPONENT }} />
        </View>
        
        {/* 같은 월의 기록들을 가로로 배치 (flex-wrap) */}
        <View className="flex-row flex-wrap gap-2">
          {item.records.map((record) => {
            const chipType = getChipTypeFromCategory(record.category);
            const chipTintColor = CHIP_TINT_COLORS[CHIP_TYPE[chipType]];

            return (
              <TouchableOpacity
                key={record.id}
                onPress={() => {
                  navigation.navigate('ArchiveDetail', { recordId: record.id });
                }}
                style={{ marginBottom: 12 }}
              >
                {/* 이미지 */}
                {record.image_path && (
                  <LiquidGlassImage 
                    source={record.image_path} 
                    tintColor={chipTintColor}
                  />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    );
  };

  return (
    <Background isStatusBarGap={false}>
      <View className="pt-4 px-6 mb-4 flex-row justify-between items-center">
          <Text type="title3" text="기억 저장소" style={{ fontWeight: '600', color: COLORS.TEXT_2 }} />
          <LiquidGlassButton size="small" onPress={() => navigation.goBack()}>
            <XIcon width={20} height={20} color={COLORS.TEXT} />
          </LiquidGlassButton>
      </View>
      <View className="flex-1">
        {listData.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text type="body2" text="기록이 없습니다." style={{ color: 'rgba(0, 0, 0, 0.5)' }} />
          </View>
        ) : (
          <View className="flex-1 px-6">
          <FlashList
            data={listData}
            renderItem={renderItem}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: insets.bottom + 16 }}
            keyExtractor={(item) => `group-${item.title}`}
          />
          </View>
        )}
      </View>
    </Background>
  );
}