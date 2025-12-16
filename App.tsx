import './global.css';
import React from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PortalProvider } from '@gorhom/portal';
import { AppNavigation } from '@nav/index';
import { useAppInitialization } from '@stores/initStore';

export default function App() {
  // 앱 초기화 (언어 설정 로드, 온보딩 상태 확인)
  useAppInitialization();

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PortalProvider>
          <View style={{flex:1}}>
            <StatusBar 
              barStyle='light-content' 
              translucent={true}
            />
            <AppNavigation />
          </View>
        </PortalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}