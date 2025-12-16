import './global.css';
import 'intl-pluralrules';
import '@i18n/index';
import React, { useEffect } from 'react';
import { StatusBar, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PortalProvider } from '@gorhom/portal';
import { AppNavigation } from '@nav/index';
import { useInitStore } from '@stores/initStore';
import { useThemeStore } from '@stores/themeStore';

export default function App() {
  const initialize = useInitStore((state) => state.initialize);
  const currentTheme = useThemeStore((state) => state.currentTheme);

  useEffect(() => {
    initialize();
  }, [initialize]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PortalProvider>
          <View style={{flex:1}} className={currentTheme}>
            <StatusBar 
              barStyle={currentTheme === 'dark' ? 'light-content' : 'dark-content'} 
              translucent={true}
            />
            <AppNavigation />
          </View>
        </PortalProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}