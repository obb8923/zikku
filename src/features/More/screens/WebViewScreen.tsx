import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WebView } from 'react-native-webview';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { MapStackParamList } from '@nav/stack/MapStack';
import { Background } from '@components/Background';
import { LiquidGlassButton } from '@components/LiquidGlassButton';
import { Text } from '@components/Text';
import { COLORS } from '@constants/COLORS';
import XIcon from '@assets/svgs/X.svg';

type WebViewScreenNavigationProp = NativeStackNavigationProp<MapStackParamList, 'WebView'>;
type WebViewScreenRouteProp = RouteProp<MapStackParamList, 'WebView'>;

export const WebViewScreen = () => {
  const navigation = useNavigation<WebViewScreenNavigationProp>();
  const route = useRoute<WebViewScreenRouteProp>();
  const insets = useSafeAreaInsets();
  const { url, title } = route.params;

  return (
    <Background isStatusBarGap={false}>
      <View className="pt-4 px-6 mb-4 flex-row justify-between items-center">
        <Text 
          type="title3" 
          text={title || '웹페이지'} 
          style={{ fontWeight: '600', color: COLORS.TEXT_2, flex: 1 }} 
        />
        <LiquidGlassButton size="small" onPress={() => navigation.goBack()}>
          <XIcon width={20} height={20} color={COLORS.TEXT} />
        </LiquidGlassButton>
      </View>
      <View className="flex-1">
        <WebView
          source={{ uri: url }}
          startInLoadingState={true}
          renderLoading={() => (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color={COLORS.TEXT} />
            </View>
          )}
          style={{ flex: 1 }}
        />
      </View>
    </Background>
  );
};

