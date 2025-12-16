import React from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from '@components/Text';
import XIcon from '@assets/svgs/X.svg';
import { useColors } from '@shared/hooks/useColors';

interface ChipProps {
  label: string;
  onRemove?: () => void;
  variant?: 'default' | 'light';
}

export const Chip = ({ label, onRemove, variant = 'default' }: ChipProps) => {
  const colors = useColors();
  const bgColor = variant === 'light' ? colors.TEXT : colors.COMPONENT_BACKGROUND_2;
  const textColor = variant === 'light' ? colors.BACKGROUND : colors.TEXT;
  // const bgColor = COLORS.BLUE_CHIP_50;
  // const textColor = COLORS.BLUE_CHIP_600;
  return (
    <View
      className="flex-row items-center rounded-full"
      style={{ backgroundColor: bgColor ,paddingVertical: 3 ,paddingHorizontal: 8}}
    >
      <Text
        text={label}
        type="body3"
        style={{ color: textColor }}
      />
      {onRemove && (
        <TouchableOpacity
          onPress={onRemove}
          className="ml-2"
          hitSlop={{ top: 5, bottom: 5, left: 5, right: 5 }}
        >
          <XIcon width={9} height={9} color={textColor} />
        </TouchableOpacity>
      )}
    </View>
  );
};

