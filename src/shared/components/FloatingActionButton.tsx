import React, { ReactNode } from 'react';
import { GestureResponderEvent, StyleProp, TouchableOpacity, ViewStyle, Text } from 'react-native';

type FloatingActionButtonProps = {
  onPress: (event: GestureResponderEvent) => void;
  style?: StyleProp<ViewStyle>;
  icon?: ReactNode;
  label?: string;
};

export const FloatingActionButton = ({
  onPress,
  style,
  icon,
  label = '+',
}: FloatingActionButtonProps) => {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-blue-500 shadow-lg"
      style={style}
    >
      {icon ? icon : <Text className="text-2xl text-white">{label}</Text>}
    </TouchableOpacity>
  );
};


