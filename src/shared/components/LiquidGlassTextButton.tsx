import React from 'react';
import {
  GestureResponderEvent,
  Pressable,
  TextStyle,
  ViewStyle,
} from 'react-native';
import { LiquidGlassView } from './LiquidGlassView';
import { BUTTON_SIZE_SMALL, BUTTON_SIZE_MEDIUM, BUTTON_SIZE_LARGE } from '../constants/NORMAL';
import { Text, TypographyType } from './Text';
import {COLORS} from '@constants/COLORS';
export type LiquidGlassTextButtonProps = {
  onPress: (event: GestureResponderEvent) => void;
  disabled?: boolean;
  loading?: boolean;
  borderRadius?: number;
  size?:'small' | 'medium' | 'large';
  style?: ViewStyle;
  text: string;
  textStyle?: TextStyle;
};
export const LiquidGlassTextButton = ({
  onPress,
  disabled = false,
  loading = false,
  borderRadius = 16,
  size = 'medium',
  text,
  textStyle,
  style,
}: LiquidGlassTextButtonProps) => {
  const sizeStyle = {
    small: { height: BUTTON_SIZE_SMALL},
    medium: { height: BUTTON_SIZE_MEDIUM},
    large: { height: BUTTON_SIZE_LARGE},
  };
  const textType={
    small: 'caption1',
    medium: 'body3',
    large: 'body2',
  }
  return (
    <LiquidGlassView
      borderRadius={borderRadius}
      interactive={!disabled}
      style={style}
      tintColor={'rgba(0,0,0,0)'}
    >
      <Pressable
        onPress={onPress}
        disabled={disabled}
        className="items-center justify-center px-4"
        style={{...sizeStyle[size], opacity: disabled || loading ? 0.5 : 1}}
      >
       <Text type={textType[size] as TypographyType} text={loading ? '...' : text} style={{ fontWeight: '500', color: COLORS.TEXT, ...textStyle }} />
      </Pressable>
    </LiquidGlassView>
  );
};


