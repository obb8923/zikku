import React, { ReactNode } from 'react';
import { GestureResponderEvent, StyleProp, ViewStyle } from 'react-native';
import { LiquidGlassButton } from './LiquidGlassButton';
import { Text } from './Text';

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
    <LiquidGlassButton
      onPress={onPress}
      borderRadius={999}
      className="absolute bottom-6 right-6 items-center justify-center"
      containerStyle={[
        {
          width: 56,
          height: 56,
        },
        style,
      ]}
    >
      {icon ? (
        icon
      ) : (
        <Text text={label} className="text-2xl text-white" />
      )}
    </LiquidGlassButton>
  );
};


