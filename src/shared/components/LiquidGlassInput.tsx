import React from 'react';
import { TextInput, TextInputProps, StyleProp, ViewStyle } from 'react-native';
import { LiquidGlassView } from './LiquidGlassView';

export type LiquidGlassInputProps = TextInputProps & {
  borderRadius?: number;
  containerStyle?: StyleProp<ViewStyle>;
};

export const LiquidGlassInput = ({
  borderRadius = 16,
  containerStyle,
  style,
  ...textInputProps
}: LiquidGlassInputProps) => {
  return (
    <LiquidGlassView 
    borderRadius={borderRadius} 
    style={containerStyle}>
      <TextInput
        {...textInputProps}
        style={[
          {
            paddingHorizontal: 16,
            paddingVertical: 12,
            fontSize: 16,
            color: '#000',
            minHeight: 44,
          },
          style,
        ]}
        placeholderTextColor="rgba(0, 0, 0, 0.5)"
      />
    </LiquidGlassView>
  );
};

