import React from 'react';
import {
  GestureResponderEvent,
  Pressable,
} from 'react-native';
import { LiquidGlassView } from './LiquidGlassView';
import { BUTTON_SIZE_SMALL, BUTTON_SIZE_MEDIUM, BUTTON_SIZE_LARGE } from '../constants/NORMAL';
import { Text } from './Text';
export type LiquidGlassTextButtonProps = {
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  borderRadius?: number;
  size?:'small' | 'medium' | 'large';
  text: string;
};
export const LiquidGlassTextButton = ({
  onPress,
  disabled = false,
  borderRadius = 16,
  size = 'medium',
  text,
}: LiquidGlassTextButtonProps) => {
  const sizeStyle = {
    small: {width: BUTTON_SIZE_SMALL, height: BUTTON_SIZE_SMALL},
    medium: {width: BUTTON_SIZE_MEDIUM, height: BUTTON_SIZE_MEDIUM},
    large: {width: BUTTON_SIZE_LARGE, height: BUTTON_SIZE_LARGE},
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
       <Text type="body1" text={text} style={{ fontWeight: '500' }} />
      </Pressable>
    </LiquidGlassView>
  );
};


