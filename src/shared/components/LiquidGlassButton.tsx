import React from 'react';
import {
  GestureResponderEvent,
  Pressable,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { LiquidGlassView } from './LiquidGlassView';
import { BUTTON_SIZE_SMALL, BUTTON_SIZE_MEDIUM, BUTTON_SIZE_LARGE } from '../constants/NORMAL';
import { useHapticFeedback } from '@hooks/useHapticFeedback';
export type LiquidGlassButtonProps = {
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  borderRadius?: number;
  children?: React.ReactNode;
  size?:'small' | 'medium' | 'large';
  tintColor?: string;
};
export const LiquidGlassButton = ({
  onPress,
  disabled = false,
  borderRadius = 999,
  children,
  size = 'medium',
  tintColor = 'rgba(255,255,255,0)',
}: LiquidGlassButtonProps) => {
  const haptic = useHapticFeedback();
  const sizeStyle = {
    small: {width: BUTTON_SIZE_SMALL, height: BUTTON_SIZE_SMALL},
    medium: {width: BUTTON_SIZE_MEDIUM, height: BUTTON_SIZE_MEDIUM},
    large: {width: BUTTON_SIZE_LARGE, height: BUTTON_SIZE_LARGE},
  };
  return (
    <LiquidGlassView
      borderRadius={borderRadius}
      interactive={!disabled}
      tintColor={tintColor}
    >
      <Pressable
        onPress={(event) => {
          haptic.impact('light');
          onPress(event);
        }}
        disabled={disabled}
        className="items-center justify-center"
        style={{...sizeStyle[size], opacity: disabled ? 0.5 : 1}}
      >
       {children}
      </Pressable>
    </LiquidGlassView>
  );
};


