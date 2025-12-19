import React from 'react';
import {
  GestureResponderEvent,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { LiquidGlassView } from './LiquidGlassView';

export type LiquidGlassButtonProps = {
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  borderRadius?: number;
  children?: React.ReactNode;
  size?:'small' | 'medium' | 'large';
};
export const LiquidGlassButton = ({
  onPress,
  disabled = false,
  borderRadius = 999,
  children,
  size = 'medium',
}: LiquidGlassButtonProps) => {
  const sizeStyle = {
    small: {width: 32, height: 32},
    medium: {width: 44, height: 44},
    large: {width: 56, height: 56},
  };
  return (
    <LiquidGlassView
      borderRadius={borderRadius}
      interactive={!disabled}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className="items-center justify-center"
        style={{...sizeStyle[size], opacity: disabled ? 0.5 : 1}}
      >
       {children}
      </Pressable>
    </LiquidGlassView>
  );
};


