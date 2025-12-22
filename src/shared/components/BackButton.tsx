import React from 'react';
import { View } from 'react-native';
import { LiquidGlassButton } from './LiquidGlassButton';
import ChevronLeft from '@assets/svgs/ChevronLeft.svg';
import { COLORS } from '@constants/COLORS';
type BackButtonProps = {
  onPress: () => void;
};

export const BackButton = ({ onPress }: BackButtonProps) => {
  return (
    <View className="absolute top-0 left-4" style={{ zIndex: 10 }}>
      <LiquidGlassButton onPress={onPress} size="medium">
        <ChevronLeft width={24} height={24} color={COLORS.TEXT} />
      </LiquidGlassButton>
    </View>
  );
};

