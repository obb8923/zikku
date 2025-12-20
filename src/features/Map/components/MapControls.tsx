import React from 'react';
import { View } from 'react-native';
import { LiquidGlassButton } from '@components/LiquidGlassButton';
import PlusSmall from '@assets/svgs/PlusSmall.svg';
import MinusSmall from '@assets/svgs/MinusSmall.svg';
import LocationUser from '@assets/svgs/LocationUser.svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type MapControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onMoveToMyLocation: () => void;
};

export const MapControls = ({
  onZoomIn,
  onZoomOut,
  onMoveToMyLocation,
}: MapControlsProps) => {
  const insets = useSafeAreaInsets();
  return (
    <View className="absolute gap-2" style={{ right: 16, top: insets.top + 16 }}>
      <LiquidGlassButton onPress={onZoomIn} borderRadius={8}>
        <PlusSmall width={24} height={24} color="black" />
      </LiquidGlassButton>

      <LiquidGlassButton onPress={onZoomOut} borderRadius={8}>
        <MinusSmall width={24} height={24} color="black" />
      </LiquidGlassButton>

      <LiquidGlassButton onPress={onMoveToMyLocation} borderRadius={8}>
        <LocationUser width={24} height={24} color="black" />
      </LiquidGlassButton>
    </View>
  );
};

