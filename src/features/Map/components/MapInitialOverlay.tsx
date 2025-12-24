import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientMask } from './GradientMask';
import { Text } from '@components/index';
import { LiquidGlassTextButton } from '@components/LiquidGlassTextButton';

interface MapInitialOverlayProps {
  onStart: () => void;
  style?: ViewStyle;
}

export const MapInitialOverlay: React.FC<MapInitialOverlayProps> = ({
  onStart,
  style,
}) => {
  const insets = useSafeAreaInsets();

  return (
    <View 
      className="flex-1 absolute inset-0"
      style={style}
    >
      <GradientMask />
      <View 
        style={{  
          flex: 1,
          justifyContent: 'space-between',
          paddingTop: insets.top + 16,
          paddingBottom: insets.bottom + 16,
          paddingHorizontal: 32, 
          zIndex: 200 
        }}
      >
        <View className="w-full">
          <Text type="title1" text="반가워요" className="text-text-component"/>
          <Text type="title0" text="SEOUL" className="text-text font-bold"/>
        </View>
        <LiquidGlassTextButton
          text="시작하기"
          onPress={onStart}
          size="large"
          style={{ width: '100%' }}
          tintColor="white"
          textStyle={{ color: 'black' }}
        />
         <LiquidGlassTextButton
          text="테스트 버튼"
          onPress={onStart}
          size="large"
          style={{ width: '100%' }}
          tintColor="white"
          textStyle={{ color: 'black' }}
        />
        <LiquidGlassTextButton
          text="opacity변경"
          onPress={onStart}
          size="large"
          style={{ width: '100%' }}
          tintColor="white"
          textStyle={{ color: 'black' }}
        />
      </View>
    </View>
  );
};

