import React from 'react';
import { TouchableOpacity, StyleProp, ViewStyle, View } from 'react-native';
import { Text } from '@components/Text';
import { useColors } from '@shared/hooks/useColors';
interface PlusButtonProps {
  onPress: () => void;
  text?: string;
  icon?: React.ComponentType<any>;
  iconSize?: number;
}

export const PlusButton = ({ onPress, text, icon: Icon, iconSize = 18 }: PlusButtonProps) => {
  const colors = useColors();
  return (
    <TouchableOpacity
        onPress={onPress}
        className="flex-row items-center justify-center h-full"
      >
            {Icon ? (
              <Icon width={iconSize} height={iconSize} color={colors.TEXT} />
            ) : (
              <Text text="+" type="body3" className="text-text-2"/>
            )}
        {text && <Text text={text} type="body3" className="ml-2 text-text-2"/>}

      </TouchableOpacity>
  );
};