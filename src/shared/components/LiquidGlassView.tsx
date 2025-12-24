import React, { PropsWithChildren } from 'react';
import { View, ViewStyle, StyleProp, Platform } from 'react-native';
import {
  LiquidGlassView as RNLiquidGlassView,
  type LiquidGlassViewProps,
  isLiquidGlassSupported,
} from '@callstack/liquid-glass';

export type GlassEffectVariant = 'clear' | 'regular' | 'none';

export type AppLiquidGlassViewProps = PropsWithChildren<
  LiquidGlassViewProps & {
    className?: string;
    style?: StyleProp<ViewStyle>;
    borderRadius?: number;
    innerStyle?: StyleProp<ViewStyle>;
  }
>;
export const LiquidGlassView = ({
  children,
  className,
  style,
  borderRadius = 24,
  interactive = true,
  effect = 'clear',
  colorScheme = 'system',
  tintColor = 'rgba(255,255,255,0.22)',
  innerStyle,
  ...rest
}: AppLiquidGlassViewProps) => {
  const commonInnerStyle: ViewStyle = {
    borderRadius,
    overflow: 'hidden',
  };

  const outerStyle: StyleProp<ViewStyle> = [{borderRadius,},style,];

  const isSupported = Platform.OS === 'ios' && isLiquidGlassSupported;

  if (!isSupported) {
    return (
      <View
        className={className}
        style={[
          {
            backgroundColor: 'rgba(255,255,255,1)',
            borderRadius,
          },
          style,
        ]}
      >
        {children}
      </View>
    );
  }

  return (
    <View className={className} style={outerStyle}>
      <RNLiquidGlassView
        {...rest}
        interactive={interactive}
        effect={effect}
        colorScheme={colorScheme}
        tintColor={tintColor}
        style={[commonInnerStyle, innerStyle, (rest as LiquidGlassViewProps).style]}
      >
        {children}
      </RNLiquidGlassView>
    </View>
  );
};


