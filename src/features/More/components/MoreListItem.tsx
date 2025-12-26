import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@components/index';
import ChevronRight from '@assets/svgs/ChevronRight.svg';
import { COLORS } from '@constants/COLORS';
import { useHapticFeedback } from '@hooks/useHapticFeedback';

export type MoreItem = {
  id: string;
  title: string;
};

type MoreListItemProps = {
  item: MoreItem;
  onPress?: (item: MoreItem) => void;
  isLast?: boolean;
};

export const MoreListItem = ({ item, onPress, isLast }: MoreListItemProps) => {
  const haptic = useHapticFeedback();

  const handlePress = () => {
    haptic.impact('light');
    onPress?.(item);
  };

  return (
    <>
      <TouchableOpacity
        activeOpacity={0.8}
        className="w-full py-4"
        onPress={handlePress}
      >
        <View className="w-full flex-row justify-between items-center">
          <Text
            type="body1"
            text={item.title}
            className="text-text font-semibold"
          />
          <ChevronRight width={20} height={20} color={COLORS.TEXT} />
        </View>
      </TouchableOpacity>
      {!isLast && (
        <View
          style={{
            height: 1,
            backgroundColor: COLORS.TEXT_2,
            opacity: 0.1,
            marginLeft: 0,
          }}
        />
      )}
    </>
  );
};

