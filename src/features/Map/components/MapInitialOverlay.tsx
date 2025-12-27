import React, { useState, useEffect } from 'react';
import { View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { MapStackParamList } from '@nav/stack/MapStack';
import { GradientMask } from './GradientMask';
import { Text } from '@components/index';
import { LiquidGlassTextButton } from '@components/LiquidGlassTextButton';

type NavigationProp = NativeStackNavigationProp<MapStackParamList>;

interface MapInitialOverlayProps {
  onStart: () => void;
  style?: ViewStyle;
}

export const MapInitialOverlay: React.FC<MapInitialOverlayProps> = ({
  onStart,
  style,
}) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [greeting, setGreeting] = useState<string>('');

  const getGreeting = (hour: number): string => {
    if (hour >= 0 && hour < 5) {
      // 심야: 0-4시
      return '조용한 새벽이에요';
    } else if (hour >= 5 && hour < 9) {
      // 새벽: 5-8시
      return '상쾌한 아침이에요';
    } else if (hour >= 9 && hour < 18) {
      // 오전, 오후: 9-17시
      return '오늘도 힘내요';
    } else {
      // 저녁, 밤: 18-23시
      return '좋은 저녁이에요';
    }
  };

  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date();
      const hour = now.getHours();
      setGreeting(getGreeting(hour));
    };

    // 초기 인사말 설정
    updateGreeting();

    // 1시간마다 업데이트 (시간대가 바뀔 때마다)
    const interval = setInterval(updateGreeting, 3600000);

    return () => clearInterval(interval);
  }, []);

  const handleArchivePress = () => {
    navigation.navigate('Archive');
  };

  const handleMorePress = () => {
    navigation.navigate('More');
  };

  return (
    <View 
      className="flex-1 absolute inset-0"
      style={style}
    >
      <View 
      className="flex-1 justify-between px-4"
        style={{ 
          paddingTop: insets.top + 32, 
          paddingBottom: insets.bottom+16,
          zIndex: 200 
        }}
      >
        {/* title area */}
        <View className="w-full">
          <Text type="title1" text="반가워요" className="text-text-component"/>
          <Text type="title0" text={greeting} className="text-text font-bold"/>
        </View>
        {/* button area */}
        <View className="w-full gap-4">
          <LiquidGlassTextButton
            text="시작하기"
            onPress={onStart}
            size="large"
            style={{ width: '100%' }}
            tintColor="white"
            textStyle={{ color: 'black' ,fontWeight: 'bold'}}
          />
        {/* tab button area */}
        <View className="w-full gap-4 flex-row justify-between">
          <LiquidGlassTextButton
            text="기록"
            onPress={handleArchivePress}
            size="large"
            style={{ flex: 1 }}
            tintColor="rgba(255,255,255,0.2)"
            textStyle={{ color: 'black', fontWeight: 'bold' }}
          />
          <LiquidGlassTextButton
            text="설정"
            onPress={handleMorePress}
            size="large"
            style={{flex: 1}}
            tintColor="rgba(255,255,255,0.2)"
            textStyle={{ color: 'black', fontWeight: 'bold' }}
          />
        </View>
        </View>
      </View>
      <GradientMask />
    </View>
  );
};

