import React from 'react';
import { View, ViewStyle, StyleProp } from 'react-native';
import { LiquidGlassButton} from '@components/LiquidGlassButton';
import PlusSmall from '@assets/svgs/PlusSmall.svg';
import MinusSmall from '@assets/svgs/MinusSmall.svg';
import LocationUser from '@assets/svgs/LocationUser.svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type MapControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onMoveToMyLocation: () => void;
  containerStyle?: StyleProp<ViewStyle>;
};

export const MapControls = ({
  onZoomIn,
  onZoomOut,
  onMoveToMyLocation,
  containerStyle,
}: MapControlsProps) => {
  const insets = useSafeAreaInsets();
  const defaultStyle: ViewStyle = { right: 16, top: insets.top + 16 };
  
  return (
    <View className="absolute gap-1" style={containerStyle || defaultStyle}>
   
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

