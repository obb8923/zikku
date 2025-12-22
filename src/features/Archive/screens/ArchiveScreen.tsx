import React, { useMemo } from 'react';
import { View, TouchableOpacity, Image } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { FlashList, ListRenderItem } from '@shopify/flash-list';
import { Background } from '@components/Background';
import { Text } from '@components/Text';
import { BackButton } from '@components/BackButton';
import { useRecordStore, Record } from '@stores/recordStore';
import { RecordDetailModal } from '@components/index';
import { CHIP_TYPE, CHIP_TINT_COLORS, type ChipTypeKey } from '@constants/CHIP';
import { Chip, LiquidGlassView } from '@components/index';
import { DEVICE_HEIGHT } from '@constants/NORMAL';
import { LiquidGlassImage } from '@components/index';
type ListItem = {
  type: 'group';
  title: string;
  records: Record[];
};

export const ArchiveScreen = () => {
  const navigation = useNavigation();
  // Record store (로컬 스토어에서만 읽기)
  const records = useRecordStore(state => state.records);
  const [selectedRecord, setSelectedRecord] = React.useState<Record | null>(null);
  const [isDetailModalVisible, setIsDetailModalVisible] = React.useState(false);

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

  // 아이템 렌더링
  const renderItem: ListRenderItem<ListItem> = ({ item }) => {
    return (
      <View className="px-6 mb-4">
        {/* 헤더 */}
        <View className="mb-3">
          <Text type="title3" text={item.title} style={{ fontWeight: '600' }} />
        </View>
        
        {/* 같은 월의 기록들을 가로로 배치 (flex-wrap) */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          {item.records.map((record) => {
            const chipType = getChipTypeFromCategory(record.category);
            const chipTintColor = CHIP_TINT_COLORS[CHIP_TYPE[chipType]];

            return (
              <TouchableOpacity
                key={record.id}
                onPress={() => {
                  setSelectedRecord(record);
                  setIsDetailModalVisible(true);
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
    <Background type="white" isStatusBarGap>
      <View className="flex-1">
        <BackButton onPress={() => navigation.goBack()} />
        <View className="px-6 pt-8 pb-4">
          <Text type="title1" text="아카이브" />
        </View>
        
        {listData.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <Text type="body2" text="기록이 없습니다." style={{ color: 'rgba(0, 0, 0, 0.5)' }} />
          </View>
        ) : (
          <FlashList
            data={listData}
            renderItem={renderItem}
            contentContainerStyle={{ paddingBottom: 16 }}
            keyExtractor={(item) => `group-${item.title}`}
          />
        )}
      </View>

      {/* 기록 상세정보 모달 */}
      <RecordDetailModal
        visible={isDetailModalVisible}
        record={selectedRecord}
        onClose={() => {
          setIsDetailModalVisible(false);
          setSelectedRecord(null);
        }}
      />
    </Background>
  );
}